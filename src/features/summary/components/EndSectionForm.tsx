"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { endActiveSection } from "@/features/summary/actions";
import { SummaryResultContent } from "@/features/summary/components/SummaryResultContent";
import { initialEndSectionState } from "@/features/summary/types";

type EndSectionFormProps = {
  roomId: string;
  hasActiveSection: boolean;
  onEnded?: () => void;
};

export function EndSectionForm({
  roomId,
  hasActiveSection,
  onEnded,
}: EndSectionFormProps) {
  const router = useRouter();
  const [dismissedSummaryId, setDismissedSummaryId] = useState<string | null>(
    null,
  );
  const [state, formAction, isPending] = useActionState(
    endActiveSection,
    initialEndSectionState,
  );
  const isModalOpen =
    state.ok &&
    Boolean(state.summaryContent) &&
    state.summaryId !== dismissedSummaryId;

  const handleCloseSummaryModal = () => {
    setDismissedSummaryId(state.summaryId ?? null);
    onEnded?.();
    router.refresh();
  };

  return (
    <>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="roomId" value={roomId} />

        {state.message ? (
          <p
            className={`rounded-md px-3 py-2 text-sm ${
              state.ok
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
            role={state.ok ? "status" : "alert"}
            aria-live="polite"
          >
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!hasActiveSection || isPending}
          className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto cursor-pointer"
        >
          {isPending ? "要約を作成中..." : "セクションを終了して要約"}
        </button>
      </form>

      {isModalOpen && state.summaryContent ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6"
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
                  セクション終了
                </p>
                <h3
                  id="summary-result-title"
                  className="mt-1 text-xl font-semibold text-slate-950"
                >
                  AI要約結果
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
                content={state.summaryContent}
                items={state.summaryItems ?? []}
                sourceQuestions={state.sourceQuestions ?? []}
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link
                href={`/rooms/${roomId}/summaries`}
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
    </>
  );
}
