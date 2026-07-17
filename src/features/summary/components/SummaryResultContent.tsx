"use client";

import type { ReactNode } from "react";
import type {
  SummaryItem,
  SummarySourceQuestion,
} from "@/features/summary/types";

type SummaryResultContentProps = {
  content: string;
  items: SummaryItem[];
  sourceQuestions: SummarySourceQuestion[];
  showItemDetails?: boolean;
  actionButton?: ReactNode;
};

export function SummaryResultContent({
  content,
  items,
  sourceQuestions,
  showItemDetails = true,
  actionButton,
}: SummaryResultContentProps) {
  const questionMap = new Map(
    sourceQuestions.map((question) => [question.id, question]),
  );
  const displayItems =
    items.length > 0
      ? items
      : [
          {
            title: "全体要約",
            text: content,
            source_question_ids: [],
            interest_degree: 0,
          },
        ];

  return (
    <div className="space-y-5">
      <section className="rounded-md bg-emerald-50 p-4">
        <p className="text-xs font-semibold text-emerald-700">全体要約</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
          {content}
        </p>
      </section>

      {!showItemDetails ? <div>{actionButton}</div> : null}

      {showItemDetails ? (
        <div className="space-y-3">
          {displayItems.map((item, index) => (
            <SummaryItemSection
              key={`${item.text}-${index}`}
              item={item}
              questionMap={questionMap}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SummaryItemSection({
  item,
  questionMap,
}: {
  item: SummaryItem;
  questionMap: Map<string, SummarySourceQuestion>;
}) {
  const sourceQuestions = item.source_question_ids
    .map((questionId) => questionMap.get(questionId))
    .filter(
      (question): question is SummarySourceQuestion => question !== undefined,
    );
  const interestLevel = getInterestLevel(item.interest_degree);
  const interestBadgeClassName = getInterestBadgeClassName(interestLevel);

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-base font-semibold text-slate-950">
          {item.title}
        </h4>
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${interestBadgeClassName}`}
        >
          関心度 {interestLevel.label}
        </span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
        {item.text}
      </p>

      {sourceQuestions.length > 0 ? (
        <ol className="mt-4 space-y-3">
          {sourceQuestions.map((question) => (
            <li
              key={question.id}
              className="rounded-md border border-slate-200 bg-slate-50 p-3"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold text-emerald-700">
                  {question.sourceLabel}
                </p>
                <p className="text-xs text-slate-500">
                  リアクション {question.reactionCount} 件
                </p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {question.content}
              </p>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

type InterestLevel = {
  label: "高" | "中" | "低";
};

function getInterestLevel(interestDegree: number): InterestLevel {
  if (interestDegree >= 4) {
    return { label: "高" };
  }

  if (interestDegree >= 2) {
    return { label: "中" };
  }

  return { label: "低" };
}

function getInterestBadgeClassName(interestLevel: InterestLevel) {
  switch (interestLevel.label) {
    case "高":
      return "bg-rose-100 text-rose-800";
    case "中":
      return "bg-amber-100 text-amber-800";
    case "低":
      return "bg-slate-100 text-slate-700";
  }
}
