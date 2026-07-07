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
      {summaries.map((summary) => (
        <article
          key={summary.id}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">
                セクションID: {summary.sectionId}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                AI要約
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              {dateFormatter.format(new Date(summary.createdAt))}
            </p>
          </div>

          <div className="mt-4">
            <SummaryResultContent
              content={summary.content}
              items={summary.items}
              sourceQuestions={summary.sourceQuestions}
            />
          </div>
        </article>
      ))}
    </section>
  );
}
