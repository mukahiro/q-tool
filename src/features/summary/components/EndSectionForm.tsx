"use client";

import { useState, type FormEvent } from "react";
import { endActiveSection } from "@/features/summary/actions";
import {
  initialEndSectionState,
  type EndSectionState,
} from "@/features/summary/types";

type EndSectionFormProps = {
  roomId: string;
  hasActiveSection: boolean;
  onEnded?: (result: Required<Pick<EndSectionState, "summaryId" | "sectionId">> &
    Pick<
      EndSectionState,
      "summaryContent" | "summaryItems" | "sourceQuestions"
    >) => void;
  layout?: "stacked" | "inline";
};

export function EndSectionForm({
  roomId,
  hasActiveSection,
  onEnded,
  layout = "stacked",
}: EndSectionFormProps) {
  const [state, setState] = useState(initialEndSectionState);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasActiveSection || isPending) {
      return;
    }

    setIsPending(true);

    try {
      const result = await endActiveSection(
        initialEndSectionState,
        new FormData(event.currentTarget),
      );

      setState(result);

      if (result.ok && result.summaryId && result.sectionId) {
        onEnded?.({
          summaryId: result.summaryId,
          sectionId: result.sectionId,
          summaryContent: result.summaryContent,
          summaryItems: result.summaryItems,
          sourceQuestions: result.sourceQuestions,
        });
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={layout === "inline" ? "flex w-full flex-col gap-2" : "space-y-3"}
    >
      <input type="hidden" name="roomId" value={roomId} />

      <button
        type="submit"
        disabled={!hasActiveSection || isPending}
        className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto cursor-pointer"
      >
        {isPending ? "要約を作成中..." : "セクションを終了して要約"}
      </button>

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
    </form>
  );
}
