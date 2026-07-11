"use client";

import { useState } from "react";
import type { SummaryDisplay } from "@/features/summary/types";
import { SummaryResultContent } from "./SummaryResultContent";

type SummaryListProps = {
  summaries: SummaryDisplay[];
};

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function SummaryList({ summaries }: SummaryListProps) {
  const [openSummaryIds, setOpenSummaryIds] = useState<string[]>(() =>
    summaries.length > 0 ? [summaries[0].id] : [],
  );

  if (summaries.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-sm font-semibold text-emerald-700">
          要約はまだありません
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          セクションを終了するとここに表示されます
        </h2>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {summaries.map((summary, index) => {
        const isLatest = index === 0;
        const isOpen = isLatest || openSummaryIds.includes(summary.id);

        return (
          <article
            key={summary.id}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="mt-1 text-xl font-semibold text-slate-950">
                    {summary.sectionName}
                  </h2>
                  {isLatest ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                      最新
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  セクションID: {summary.sectionId}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <p className="text-sm text-slate-500">
                  {dateFormatter.format(new Date(summary.createdAt))}
                </p>
              </div>
            </div>

              <div className="mt-4">
                <SummaryResultContent
                  content={summary.content}
                  items={summary.items}
                  sourceQuestions={summary.sourceQuestions}
                  showItemDetails={isOpen}
                  actionButton={
                    !isOpen && !isLatest ? (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenSummaryIds((current) =>
                            current.includes(summary.id)
                              ? current.filter((id) => id !== summary.id)
                              : [...current, summary.id],
                          );
                        }}
                        aria-expanded={isOpen}
                        className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        続きを見る
                      </button>
                    ) : null
                  }
                />
              </div>
          </article>
        );
      })}
    </section>
  );
}
