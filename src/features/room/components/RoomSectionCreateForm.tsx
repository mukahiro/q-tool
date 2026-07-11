"use client";

import { useActionState, useEffect, useRef, type RefObject } from "react";
import { createSection } from "../actions";
import { initialCreateSectionState } from "../state";

type RoomSectionCreateFormProps = {
  roomId: string;
  disabled?: boolean;
  buttonLabel?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  onCreated: (result: { sectionId: string; sectionName: string }) => void;
};

export function RoomSectionCreateForm({
  roomId,
  disabled = false,
  buttonLabel = "作成する",
  inputRef,
  onCreated,
}: RoomSectionCreateFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const handledSectionIdRef = useRef<string | null>(null);
  const [state, formAction, isPending] = useActionState(
    createSection.bind(null, roomId),
    initialCreateSectionState,
  );

  useEffect(() => {
    if (!state.ok || !state.sectionId) {
      return;
    }

    if (handledSectionIdRef.current === state.sectionId) {
      return;
    }

    handledSectionIdRef.current = state.sectionId;
    onCreated({
      sectionId: state.sectionId,
      sectionName: state.sectionName ?? `セクション${state.sectionOrder ?? ""}`,
    });
    formRef.current?.reset();
  }, [onCreated, state]);

  return (
    <form ref={formRef} action={formAction} className="flex w-full flex-col gap-2">
      <div className="flex w-full items-center gap-3">
        <label className="min-w-0 flex-1">
          <span className="sr-only">セクション名</span>
          <input
            ref={inputRef}
            type="text"
            name="name"
            maxLength={80}
            disabled={disabled || isPending}
            placeholder="新しいセクション名 (空のままでも可)"
            className="w-full rounded-md border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </label>

        <button
          type="submit"
          disabled={disabled || isPending}
          className="inline-flex min-h-12 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-md bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isPending ? "作成中..." : buttonLabel}
        </button>
      </div>

      {state.message ? (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            state.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
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
