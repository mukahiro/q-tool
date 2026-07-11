"use client";

import {
  collection,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { useState } from "react";
import { getFirebaseFirestore } from "@/lib/firebase/firestore";
import { SummaryResultContent } from "@/features/summary/components/SummaryResultContent";
import type {
  SummaryItem,
  SummarySourceQuestion,
} from "@/features/summary/types";

type SectionSummaryModalProps = {
  roomId: string;
  sectionId: string;
  sectionName: string;
};

type LoadedSummary = {
  id: string;
  sectionId: string;
  sectionName: string;
  content: string;
  items: SummaryItem[];
  sourceQuestions: SummarySourceQuestion[];
  createdAt: string;
};

export function SectionSummaryModal({
  roomId,
  sectionId,
  sectionName,
}: SectionSummaryModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState<LoadedSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleOpenModal = async () => {
    setIsOpen(true);
    setIsLoading(true);
    setMessage(null);

    try {
      const loadedSummary = await loadSummary(roomId, sectionId, sectionName);

      if (!loadedSummary) {
        setSummary(null);
        setMessage("このセクションのAI要約はまだありません。");
        return;
      }

      setSummary(loadedSummary);
    } catch (error) {
      console.error("AI要約の取得に失敗しました", error);
      setSummary(null);
      setMessage(
        "AI要約を読み込めませんでした。時間をおいてもう一度お試しください。",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpenModal}
        className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-sky-300 bg-sky-50 px-3 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
      >
        AI要約
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6"
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`section-summary-title-${sectionId}`}
            className="max-h-full w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
          >
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-sky-700">AI要約</p>
                <h3
                  id={`section-summary-title-${sectionId}`}
                  className="mt-1 text-xl font-semibold text-slate-950"
                >
                  {sectionName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                閉じる
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {isLoading ? (
                <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  AI要約を読み込んでいます。
                </p>
              ) : message ? (
                <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  {message}
                </p>
              ) : summary ? (
                <SummaryResultContent
                  content={summary.content}
                  items={summary.items}
                  sourceQuestions={summary.sourceQuestions}
                />
              ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                閉じる
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

async function loadSummary(
  roomId: string,
  sectionId: string,
  sectionName: string,
): Promise<LoadedSummary | null> {
  const db = getFirebaseFirestore();
  const summariesQuery = query(
    collection(db, "rooms", roomId, "summaries"),
    where("section_id", "==", sectionId),
    limit(1),
  );
  const snapshot = await getDocs(summariesQuery);

  if (snapshot.empty) {
    return null;
  }

  const summaryDoc = snapshot.docs[0];
  const data = summaryDoc.data();

  return {
    id: summaryDoc.id,
    sectionId,
    sectionName,
    content: readString(data.content),
    items: readSummaryItems(data.items),
    sourceQuestions: readSourceQuestions(data.source_questions),
    createdAt: toIsoString(data.created_at),
  };
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readSummaryItems(value: unknown): SummaryItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): SummaryItem | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Partial<SummaryItem>;

      return {
        title: readString(candidate.title),
        text: readString(candidate.text),
        source_question_ids: Array.isArray(candidate.source_question_ids)
          ? candidate.source_question_ids.filter(
              (questionId): questionId is string => typeof questionId === "string",
            )
          : [],
        interest_degree:
          typeof candidate.interest_degree === "number" &&
          Number.isFinite(candidate.interest_degree)
            ? candidate.interest_degree
            : 0,
      };
    })
    .filter((item): item is SummaryItem => Boolean(item));
}

function readSourceQuestions(value: unknown): SummarySourceQuestion[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((question): SummarySourceQuestion | null => {
      if (!question || typeof question !== "object") {
        return null;
      }

      const candidate = question as Partial<SummarySourceQuestion>;

      return {
        id: readString(candidate.id),
        sourceLabel: readString(candidate.sourceLabel),
        content: readString(candidate.content),
        reactionCount:
          typeof candidate.reactionCount === "number"
            ? candidate.reactionCount
            : 0,
      };
    })
    .filter((question): question is SummarySourceQuestion => Boolean(question));
}

function toIsoString(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value) {
    const candidate = value as { toDate?: () => Date };

    if (typeof candidate.toDate === "function") {
      return candidate.toDate().toISOString();
    }
  }

  return "";
}