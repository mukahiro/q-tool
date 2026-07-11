"use client";

import { useActionState } from "react";
import { createRoom } from "@/features/room/actions";
import { initialCreateRoomState } from "@/features/room/state";

export function RoomCreateForm() {
  const [state, formAction, isPending] = useActionState(
    createRoom,
    initialCreateRoomState,
  );

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <label className="block">
        <span className="text-sm font-medium text-slate-800">ルーム名</span>
        <input
          type="text"
          name="name"
          required
          maxLength={80}
          disabled={isPending}
          placeholder="例: 数学I 二次関数"
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
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

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isPending ? "作成中..." : "ルームを作成"}
      </button>
    </form>
  );
}
