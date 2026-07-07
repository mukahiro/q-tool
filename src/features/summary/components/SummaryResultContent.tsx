"use client";

import { useState, type ReactNode } from "react";
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
  const [openItemKeys, setOpenItemKeys] = useState<string[]>([]);
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
              itemKey={`summary-item-${index}`}
              questionMap={questionMap}
              isOpen={openItemKeys.includes(`summary-item-${index}`)}
              onToggle={() => {
                const itemKey = `summary-item-${index}`;

                setOpenItemKeys((current) =>
                  current.includes(itemKey)
                    ? current.filter((key) => key !== itemKey)
                    : [...current, itemKey],
                );
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SummaryItemSection({
  item,
  itemKey,
  questionMap,
  isOpen,
  onToggle,
}: {
  item: SummaryItem;
  itemKey: string;
  questionMap: Map<string, SummarySourceQuestion>;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const sourceQuestions = item.source_question_ids
    .map((questionId) => questionMap.get(questionId))
    .filter(
      (question): question is SummarySourceQuestion => question !== undefined,
    );
  const hasSourceQuestions = sourceQuestions.length > 0;

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <h4 className="text-base font-semibold text-slate-950">{item.title}</h4>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
        {item.text}
      </p>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SourceQuestionBadges
          sourceQuestionIds={item.source_question_ids}
          questionMap={questionMap}
        />

        <button
          type="button"
          onClick={onToggle}
          disabled={!hasSourceQuestions}
          className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
          aria-expanded={isOpen}
          aria-controls={`summary-source-${itemKey}`}
        >
          {isOpen ? "ソース質問を隠す" : "ソース質問を表示"}
        </button>
      </div>

      {isOpen ? (
        <ol id={`summary-source-${itemKey}`} className="mt-4 space-y-3">
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

function SourceQuestionBadges({
  sourceQuestionIds,
  questionMap,
}: {
  sourceQuestionIds: string[];
  questionMap: Map<string, SummarySourceQuestion>;
}) {
  if (sourceQuestionIds.length === 0) {
    return (
      <p className="mt-3 text-xs text-slate-500">
        参照元: 保存された質問ソースなし
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <span className="text-xs font-medium text-slate-500">参照元</span>
      {sourceQuestionIds.map((questionId) => {
        const question = questionMap.get(questionId);

        return (
          <span
            key={questionId}
            className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"
            title={question?.content ?? questionId}
          >
            {question?.sourceLabel ?? questionId}
          </span>
        );
      })}
    </div>
  );
}
