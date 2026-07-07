"use client";

import { useActionState } from "react";
import { endActiveSection } from "@/features/summary/actions";
import { initialEndSectionState } from "@/features/summary/types";

type EndSectionFormProps = {
  roomId: string;
  hasActiveSection: boolean;
};

export function EndSectionForm({
  roomId,
  hasActiveSection,
}: EndSectionFormProps) {
  const [state, formAction, isPending] = useActionState(
    endActiveSection,
    initialEndSectionState,
  );

  return (
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
        className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
      >
        {isPending ? "要約を作成中..." : "現在のセクションを終了"}
      </button>
    </form>
  );
}
