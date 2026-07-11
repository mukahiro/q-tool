"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createSection } from "../actions";
import { initialCreateSectionState } from "../state";

type RoomSectionCreateModalProps = {
  roomId: string;
  disabled?: boolean;
  label?: string;
  onCreated: (result: { sectionId: string; sectionName: string }) => void;
};

export function RoomSectionCreateModal({
  roomId,
  disabled = false,
  label = "新しいセクションを作成",
  onCreated,
}: RoomSectionCreateModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    createSection.bind(null, roomId),
    initialCreateSectionState,
  );
  const handledSectionIdRef = useRef<string | null>(null);

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
      sectionName:
        state.sectionName ?? `セクション${state.sectionOrder ?? ""}`,
    });
    setIsOpen(false);
  }, [onCreated, state]);

  return (
    <div className="flex shrink-0 items-start">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className="inline-flex cursor-pointer items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
      >
        {label}
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-section-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-8"
        >
          <div className="w-full max-w-2xl rounded-md bg-white p-8 shadow-2xl sm:p-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-700">
                  セクション管理
                </p>
                <h2
                  id="create-section-title"
                  className="mt-1 text-2xl font-semibold text-slate-950"
                >
                  新しいセクションを作成
                </h2>

              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                閉じる
              </button>
            </div>

            <form action={formAction} className="mt-8 space-y-5">
              <label className="block">
                <span className="text-sm font-medium text-slate-800">
                  セクション名
                </span>
                <input
                  type="text"
                  name="name"
                  maxLength={80}
                  disabled={isPending}
                  placeholder="未入力なら自動でセクション名を付けます"
                  className="mt-2 w-full rounded-md border border-slate-300 px-4 py-3.5 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </label>

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

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex cursor-pointer items-center justify-center rounded-md bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isPending ? "作成中..." : "作成する"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}