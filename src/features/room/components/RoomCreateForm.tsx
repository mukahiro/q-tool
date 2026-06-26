"use client";

import { useActionState } from "react";
import { createRoom } from "@/features/room/actions";
import { initialCreateRoomState } from "@/features/room/state";

export function RoomCreateForm({
  teacherEmail,
}: {
  teacherEmail: string | null;
}) {
  const [state, formAction, isPending] = useActionState(
    createRoom,
    initialCreateRoomState,
  );

  return (
    <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-1 border-b border-slate-100 pb-5">
        <p className="text-sm font-medium text-slate-500">ログイン中の教師</p>
        <p className="text-sm font-semibold text-slate-950">
          {teacherEmail ?? "メールアドレス未設定"}
        </p>
      </div>

      <form action={formAction} className="mt-6 space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-slate-800">ルーム名</span>
          <input
            type="text"
            name="name"
            required
            maxLength={80}
            placeholder="例: 数学I 二次関数"
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        {state.message ? (
          <p
            className={`rounded-md px-3 py-2 text-sm ${
              state.ok
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
            aria-live="polite"
          >
            {state.message}
          </p>
        ) : null}

        {state.ok && state.roomId && state.inviteCode ? (
          <div className="grid gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950 sm:grid-cols-2">
            <div>
              <p className="font-medium">ルームID</p>
              <p className="mt-1 break-all font-mono">{state.roomId}</p>
            </div>
            <div>
              <p className="font-medium">招待コード</p>
              <p className="mt-1 font-mono text-lg font-semibold">
                {state.inviteCode}
              </p>
            </div>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isPending ? "作成中..." : "ルームを作成する"}
        </button>
      </form>
    </section>
  );
}
