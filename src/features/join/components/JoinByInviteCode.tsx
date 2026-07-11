"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveJoinRoom } from "@/features/join/actions";
import { clearJoinAttemptLimit } from "@/features/join/utils/joinAttemptLimit";

type JoinByInviteCodeProps = {
  inviteCode: string;
};

export function JoinByInviteCode({
  inviteCode,
}: JoinByInviteCodeProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function joinRoom() {
      const result = await resolveJoinRoom(inviteCode);

      if (!active) {
        return;
      }

      if (result.status === "success") {
        clearJoinAttemptLimit();

        router.replace(`/rooms/${result.roomId}/chat`);
        return;
      }

      setErrorMessage(result.message);
    }

    void joinRoom();

    return () => {
      active = false;
    };
  }, [inviteCode, router]);

  if (errorMessage) {
    return (
      <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-10 text-slate-950">
        <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-rose-700">
            入室できませんでした
          </p>

          <h1 className="mt-2 text-2xl font-semibold">
            ルームを確認できません
          </h1>

          <p
            role="alert"
            className="mt-4 rounded-md bg-rose-50 px-3 py-3 text-sm text-rose-700"
          >
            {errorMessage}
          </p>

          <Link
            href="/join"
            className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            PIN入力画面へ
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-10 text-slate-950">
      <section
        aria-live="polite"
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm"
      >
        <p className="text-sm font-semibold text-emerald-700">
          Q Tool
        </p>

        <h1 className="mt-2 text-2xl font-semibold">
          ルームへ入室しています
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          招待コードを確認しています。しばらくお待ちください。
        </p>

        <div
          aria-hidden="true"
          className="mx-auto mt-6 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950"
        />
      </section>
    </main>
  );
}
