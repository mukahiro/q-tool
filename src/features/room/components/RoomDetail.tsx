"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import Link from "next/link";
import { SectionSummaryModal } from "@/features/question/components/SectionSummaryModal";
import { endRoomAndSummarizeWholeClass } from "@/features/summary/actions";
import { EndSectionForm } from "@/features/summary/components/EndSectionForm";
import { SummaryResultContent } from "@/features/summary/components/SummaryResultContent";
import type {
  SummaryItem,
  SummarySourceQuestion,
} from "@/features/summary/types";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { RoomDisplay, RoomSectionDisplay } from "../types";
import { RoomSectionCreateForm } from "./RoomSectionCreateForm";

type NextStepLinkProps = {
  href: string;
  label: string;
  description: string;
  actionLabel: string;
};

type NextStepEndRoomProps = {
  isActive: boolean;
  isPending: boolean;
  onEndRoom: () => void;
};

type RoomMetaItemProps = {
  label: string;
  value: string;
  emphasis?: boolean;
};

type SectionListProps = {
  roomId: string;
  sections: RoomSectionDisplay[];
  activeSectionId: string | null;
  isFullscreen: boolean;
};

type EndedSectionSummary = {
  summaryId: string;
  sectionId: string;
  resultLabel: string;
  resultTitle: string;
  content: string;
  items: SummaryItem[];
  sourceQuestions: SummarySourceQuestion[];
};

const getEndedSectionSummaryStorageKey = (roomId: string) =>
  `q-tool:ended-section-summary:${roomId}`;

const getSectionFullscreenStorageKey = (roomId: string) =>
  `q-tool:section-fullscreen:${roomId}`;

/**
 * ルーム詳細表示コンポーネント
 * 教師が特定ルームの情報を確認する画面
 */
export function RoomDetail({ room }: { room: RoomDisplay }) {
  const router = useRouter();
  const [roomState, setRoomState] = useState(room);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isSectionFullscreen, setIsSectionFullscreen] = useState(() =>
    loadSectionFullscreen(room.id),
  );
  const [endedSectionSummary, setEndedSectionSummary] =
    useState<EndedSectionSummary | null>(() =>
      loadEndedSectionSummary(room.id),
    );
  const sectionNameInputRef = useRef<HTMLInputElement>(null);
  const [isRoomEnding, startRoomEndTransition] = useTransition();

  const isSectionActive = Boolean(roomState.active_section_id);
  const sectionAreaClass = isSectionFullscreen
    ? "fixed inset-0 z-50 flex flex-col overflow-hidden rounded-none border-0 bg-white p-4 shadow-2xl sm:p-6"
    : "rounded-lg border border-slate-200 bg-white p-5 shadow-sm";

  // 日時をフォーマット
  const formatDate = (date: Date) => {
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleEndRoom = () => {
    const confirmed = window.confirm(
      "ルームを終了しますか？終了後は学生が新しい質問を投稿できなくなり、授業全体への質問をAI要約します。",
    );

    if (!confirmed) {
      return;
    }

    setFeedbackMessage(null);
    startRoomEndTransition(async () => {
      const result = await endRoomAndSummarizeWholeClass(roomState.id);

      if (result.ok && result.summaryId && result.sectionId) {
        const now = new Date();
        const nextSummary: EndedSectionSummary = {
          summaryId: result.summaryId,
          sectionId: result.sectionId,
          resultLabel: "ルーム終了",
          resultTitle: "授業全体への質問のAI要約結果",
          content:
            result.summaryContent ??
            "ルームを終了し、授業全体への質問をAI要約しました。",
          items: result.summaryItems ?? [],
          sourceQuestions: result.sourceQuestions ?? [],
        };

        saveEndedSectionSummary(roomState.id, nextSummary);
        setEndedSectionSummary(nextSummary);
        setRoomState((currentRoom) => ({
          ...currentRoom,
          is_active: false,
          active_section_id: null,
          active_section_name: null,
          sections: currentRoom.sections.map((section) =>
            section.id === currentRoom.active_section_id
              ? { ...section, is_completed: true, completed_at: now }
              : section,
          ),
          updated_at: now,
          closed_at: now,
        }));
        setFeedbackMessage(result.message ?? null);
        router.refresh();
        return;
      }

      setFeedbackMessage(result.message ?? null);
    });
  };

  const handleSectionCreated = ({
    sectionId,
    sectionName,
  }: {
    sectionId: string;
    sectionName: string;
  }) => {
    const now = new Date();

    setRoomState((currentRoom) => ({
      ...currentRoom,
      active_section_id: sectionId,
      active_section_name: sectionName,
      sections: [
        ...currentRoom.sections,
        {
          id: sectionId,
          name: sectionName,
          order: currentRoom.sections.length + 1,
          is_completed: false,
          question_count: 0,
          reaction_count: 0,
          summary_id: null,
          created_at: now,
          completed_at: null,
        },
      ],
      updated_at: now,
    }));
    setFeedbackMessage("セクションを作成しました。");
  };

  const handleToggleSectionFullscreen = () => {
    setIsSectionFullscreen((current) => {
      const nextValue = !current;

      saveSectionFullscreen(roomState.id, nextValue);
      return nextValue;
    });
  };

  const handleSectionEnded = ({
    summaryId,
    sectionId,
    summaryContent,
    summaryItems,
    sourceQuestions,
  }: {
    summaryId: string;
    sectionId: string;
    summaryContent?: string;
    summaryItems?: SummaryItem[];
    sourceQuestions?: SummarySourceQuestion[];
  }) => {
    const now = new Date();
    const nextSummary: EndedSectionSummary = {
      summaryId,
      sectionId,
      resultLabel: "セクション終了",
      resultTitle: "AI要約結果",
      content: summaryContent ?? "セクションを終了し、AI要約を保存しました。",
      items: summaryItems ?? [],
      sourceQuestions: sourceQuestions ?? [],
    };

    saveEndedSectionSummary(roomState.id, nextSummary);
    setEndedSectionSummary(nextSummary);
    setRoomState((currentRoom) => ({
      ...currentRoom,
      active_section_id: null,
      active_section_name: null,
      sections: currentRoom.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              is_completed: true,
              completed_at: now,
              summary_id: summaryId,
            }
          : section,
      ),
      updated_at: now,
    }));
    setFeedbackMessage("セクションを終了しました。");
  };

  const handleCloseSummaryModal = () => {
    clearEndedSectionSummary(roomState.id);
    setEndedSectionSummary(null);

    window.requestAnimationFrame(() => {
      sectionNameInputRef.current?.focus();
    });
  };

  return (
    <div className="space-y-6 rounded-2xl bg-slate-50">
      {/* ルーム名とステータス */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-950">{roomState.name}</h1>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                  招待コード: <span className="font-mono font-bold">{roomState.invite_code}</span>
                </span>
                <span
                  className={
                    roomState.is_active
                      ? "rounded-full bg-emerald-50 px-3 py-1 text-emerald-700"
                      : "rounded-full bg-rose-50 px-3 py-1 text-rose-700"
                  }
                >
                  {roomState.is_active ? "開講中" : "終了"}
                </span>
              </div>
            </div>

            {feedbackMessage ? (
              <p
                className="rounded-md px-3 py-2 text-sm font-semibold text-emerald-700"
              >
                {feedbackMessage}
              </p>
            ) : null}
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
            <RoomMetaItem
              label="質問数"
              value={`${roomState.question_count}件`}
            />
            {roomState.creator_name ? (
              <RoomMetaItem
                label="作成者"
                value={roomState.creator_name}
              />
            ) : null}
            <RoomMetaItem
              label="作成日時"
              value={formatDate(roomState.created_at)}
            />
            <RoomMetaItem
              label="最終更新"
              value={formatDate(roomState.updated_at)}
            />
            <RoomMetaItem
              label="終了日時"
              value={roomState.closed_at ? formatDate(roomState.closed_at) : "未終了"}
            />
          </dl>
        </div>
      </section>

      {!roomState.is_active && (
        <div className="rounded-lg border border-rose-50 bg-rose-50 p-4 text-sm text-rose-700">
          このルームは終了済みです。セクションの作成や質問の投稿はできません。
        </div>
      )}

      {/* 次に使う操作 */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <NextStepLink
          href={`/rooms/${roomState.id}/invite`}
          label="学生に共有する"
          description="QRコードと参加コードを表示して、学生がこのルームに参加できるようにします。"
          actionLabel="招待画面を開く"
        />
        <NextStepLink
          href={`/rooms/${roomState.id}/chat`}
          label="質問を確認する"
          description="学生から届いた質問を授業中に確認します。教室表示にも使いやすい画面です。"
          actionLabel="チャットを開く"
        />
        <NextStepLink
          href={`/rooms/${roomState.id}/summaries`}
          label="要約を確認する"
          description="終了したセクションや授業全体への質問のAI要約を一覧で確認できます。"
          actionLabel="要約一覧を開く"
        />
        <NextStepEndRoom
          isActive={roomState.is_active}
          isPending={isRoomEnding}
          onEndRoom={handleEndRoom}
        />
      </section>

      {/* セクション */}
      <section className={sectionAreaClass}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-500">セクション</h2>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {roomState.active_section_name ?? "進行中のセクションはありません"}
            </p>
            <p className="mt-2 text-sm text-slate-900">
              {isSectionActive
                ? "セクション終了で要約と回答の時間に進みます。"
                : "次のセクションを作成して授業を再開できます。"}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-end">
            <button
              type="button"
              onClick={handleToggleSectionFullscreen}
              aria-label={
                isSectionFullscreen
                  ? "セクションエリアを通常表示に戻す"
                  : "セクションエリアを全画面表示する"
              }
              title={
                isSectionFullscreen
                  ? "通常表示に戻す"
                  : "全画面表示"
              }
              className="inline-flex size-10 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50"
            >
              {isSectionFullscreen ? (
                <Minimize2 aria-hidden="true" className="size-5" />
              ) : (
                <Maximize2 aria-hidden="true" className="size-5" />
              )}
            </button>
          </div>
        </div>

        <div className="mt-5">
          {isSectionActive ? (
            <div className="w-full">
              <EndSectionForm
                roomId={roomState.id}
                hasActiveSection={Boolean(roomState.active_section_id)}
                layout="inline"
                onEnded={handleSectionEnded}
              />
            </div>
          ) : (
            <RoomSectionCreateForm
              roomId={roomState.id}
              disabled={!roomState.is_active}
              inputRef={sectionNameInputRef}
              onCreated={handleSectionCreated}
            />
          )}
        </div>

        <SectionList
          roomId={roomState.id}
          sections={roomState.sections}
          activeSectionId={roomState.active_section_id}
          isFullscreen={isSectionFullscreen}
        />
      </section>

      {endedSectionSummary ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-4 py-6"
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="summary-result-title"
            className="max-h-full w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
          >
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-700">
                  {endedSectionSummary.resultLabel}
                </p>
                <h3
                  id="summary-result-title"
                  className="mt-1 text-xl font-semibold text-slate-950"
                >
                  {endedSectionSummary.resultTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseSummaryModal}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                閉じる
              </button>
            </div>

            <div className="mt-5">
              <SummaryResultContent
                content={endedSectionSummary.content}
                items={endedSectionSummary.items}
                sourceQuestions={endedSectionSummary.sourceQuestions}
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link
                href={`/rooms/${roomState.id}/summaries`}
                className="inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                要約一覧を開く
              </Link>
              <button
                type="button"
                onClick={handleCloseSummaryModal}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                ルーム詳細に戻る
              </button>
            </div>
          </section>
        </div>
      ) : null}

    </div>
  );
}

function NextStepLink({ href, label, description, actionLabel }: NextStepLinkProps) {
  return (
    <Link
      href={href}
      target="_blank"
      className="flex h-full flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
    >
      <span>
        <span className="block text-sm font-semibold text-slate-950">{label}</span>
        <span className="mt-2 block text-sm leading-6 text-slate-600">{description}</span>
      </span>
      <span className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
        {actionLabel}
      </span>
    </Link>
  );
}

function RoomMetaItem({
  label,
  value,
  emphasis = false,
}: RoomMetaItemProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd
        className={
          emphasis
            ? "mt-1 text-2xl font-bold leading-none text-slate-950"
            : "mt-1 break-words text-sm font-semibold leading-6 text-slate-800"
        }
      >
        {value}
      </dd>
    </div>
  );
}

function NextStepEndRoom({
  isActive,
  isPending,
  onEndRoom,
}: NextStepEndRoomProps) {
  return (
    <div className="flex h-full flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <span>
        <span className="block text-sm font-semibold text-slate-950">ルーム終了</span>
        <span className="mt-2 block text-sm leading-6 text-slate-600">
          授業全体への質問をAI要約して、ルームを終了します。終了後は学生が新しい質問を投稿できなくなります。
        </span>
      </span>
      {isActive ? (
        <button
          type="button"
          onClick={onEndRoom}
          disabled={isPending}
          className="mt-4 inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-400"
        >
          {isPending ? "終了処理中..." : "要約してルームを終了"}
        </button>
      ) : (
        <span className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
          終了済み
        </span>
      )}
    </div>
  );
}

function SectionList({
  roomId,
  sections,
  activeSectionId,
  isFullscreen,
}: SectionListProps) {
  if (sections.length === 0) {
    return (
      <div className={`mt-5 flex ${isFullscreen ? "min-h-0 flex-1" : "h-64"} items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center`}>
        <div className="flex max-w-md flex-col items-center">
          <p className="text-sm font-semibold text-emerald-700">
            セクションはまだありません
          </p>
          <h3 className="mt-2 text-xl font-bold text-slate-950">
            最初のセクションを作成しましょう
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-900">
            セクションを作成すると、授業の区切りごとに質問を集めて要約できます。
          </p>
        </div>
      </div>
    );
  }

  const sortedSections = [...sections].sort((a, b) => {
    if (b.order !== a.order) {
      return b.order - a.order;
    }

    return b.created_at.getTime() - a.created_at.getTime();
  });

  return (
    <div className={`mt-5 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3 ${isFullscreen ? "min-h-0 flex-1" : "h-96"}`}>
      <ol className="space-y-3">
        {sortedSections.map((section) => {
          const isCurrent = section.id === activeSectionId;
          const statusClass = isCurrent
            ? "bg-emerald-100 text-emerald-700"
            : section.is_completed
              ? "bg-slate-100 text-slate-700"
              : "bg-amber-100 text-amber-700";
          return (
            <li
              key={section.id}
              className="rounded-lg border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="break-words text-base font-bold text-slate-950">
                      {section.name}
                    </h3>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass}`}>
                      {isCurrent
                        ? "現在のセクション"
                        : section.is_completed
                          ? "過去のセクション"
                          : "未完了のセクション"}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
                    <span>
                      {section.order > 0 ? `セクション${section.order}` : "セクション"}
                    </span>
                    <span>{section.question_count}件の質問</span>
                    <span>作成: {formatSectionDate(section.created_at)}</span>
                    {section.completed_at ? (
                      <span>終了: {formatSectionDate(section.completed_at)}</span>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {section.summary_id ? (
                    <SectionSummaryModal
                      roomId={roomId}
                      sectionId={section.id}
                      sectionName={section.name}
                    />
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function formatSectionDate(date: Date) {
  return date.toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function saveEndedSectionSummary(
  roomId: string,
  summary: EndedSectionSummary,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      getEndedSectionSummaryStorageKey(roomId),
      JSON.stringify(summary),
    );
  } catch (error) {
    console.error("終了したセクション要約の一時保存に失敗しました", error);
  }
}

function loadEndedSectionSummary(roomId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const savedSummary = window.sessionStorage.getItem(
      getEndedSectionSummaryStorageKey(roomId),
    );

    if (!savedSummary) {
      return null;
    }

    return parseEndedSectionSummary(JSON.parse(savedSummary));
  } catch (error) {
    console.error("終了したセクション要約の復元に失敗しました", error);
    clearEndedSectionSummary(roomId);
    return null;
  }
}

function clearEndedSectionSummary(roomId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(getEndedSectionSummaryStorageKey(roomId));
}

function parseEndedSectionSummary(value: unknown): EndedSectionSummary | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const summary = value as Partial<EndedSectionSummary>;

  if (
    typeof summary.summaryId !== "string" ||
    typeof summary.sectionId !== "string" ||
    typeof summary.content !== "string" ||
    !Array.isArray(summary.items) ||
    !Array.isArray(summary.sourceQuestions)
  ) {
    return null;
  }

  return {
    summaryId: summary.summaryId,
    sectionId: summary.sectionId,
    resultLabel:
      typeof summary.resultLabel === "string"
        ? summary.resultLabel
        : "セクション終了",
    resultTitle:
      typeof summary.resultTitle === "string"
        ? summary.resultTitle
        : "AI要約結果",
    content: summary.content,
    items: summary.items,
    sourceQuestions: summary.sourceQuestions,
  };
}

function saveSectionFullscreen(roomId: string, isFullscreen: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      getSectionFullscreenStorageKey(roomId),
      isFullscreen ? "true" : "false",
    );
  } catch (error) {
    console.error("セクションエリア表示状態の保存に失敗しました", error);
  }
}

function loadSectionFullscreen(roomId: string) {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.sessionStorage.getItem(getSectionFullscreenStorageKey(roomId)) ===
    "true"
  );
}
