"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { resolveJoinRoom } from "@/features/join/actions";
import {
  clearJoinAttemptLimit,
  getJoinAttemptStatus,
  MAX_FAILED_JOIN_ATTEMPTS,
  recordFailedJoinAttempt,
  type JoinAttemptStatus,
} from "@/features/join/utils/joinAttemptLimit";
import { getOrCreateStudentSessionId } from "@/features/join/utils/studentSession";

const INITIAL_ATTEMPT_STATUS: JoinAttemptStatus = {
  failedAttempts: 0,
  remainingAttempts: MAX_FAILED_JOIN_ATTEMPTS,
  locked: false,
  lockedUntil: null,
  remainingMs: 0,
};

export function JoinForm() {
  const router = useRouter();

  const [pin, setPin] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [attemptStatus, setAttemptStatus] =
    useState<JoinAttemptStatus>(INITIAL_ATTEMPT_STATUS);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function refreshAttemptStatus() {
      const nextStatus = getJoinAttemptStatus();
      setAttemptStatus(nextStatus);

      if (!nextStatus.locked) {
        setErrorMessage((currentMessage) =>
          currentMessage.startsWith("入力回数の上限")
            ? ""
            : currentMessage,
        );
      }
    }

    refreshAttemptStatus();

    const intervalId = window.setInterval(
      refreshAttemptStatus,
      1000,
    );

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const latestAttemptStatus = getJoinAttemptStatus();
    setAttemptStatus(latestAttemptStatus);

    if (latestAttemptStatus.locked) {
      return;
    }

    const normalizedPin = pin.trim().toUpperCase();

    startTransition(async () => {
      setErrorMessage("");

      try {
        const result = await resolveJoinRoom(normalizedPin);

        if (result.status === "success") {
          clearJoinAttemptLimit();
          getOrCreateStudentSessionId();

          router.push(`/rooms/${result.roomId}/chat`);
          return;
        }

        if (
          result.status === "invalid-code" ||
          result.status === "not-found"
        ) {
          const nextAttemptStatus = recordFailedJoinAttempt();

          setAttemptStatus(nextAttemptStatus);

          if (!nextAttemptStatus.locked) {
            setErrorMessage(
              `${result.message} あと${nextAttemptStatus.remainingAttempts}回入力できます。`,
            );
          }

          return;
        }

        setErrorMessage(result.message);
      } catch (error) {
        console.error("ルーム入室処理に失敗しました", error);

        setErrorMessage(
          "ルームへの入室に失敗しました。時間をおいてもう一度お試しください。",
        );
      }
    });
  }

  const isLocked = attemptStatus.locked;
  const remainingTimeText = formatRemainingTime(
    attemptStatus.remainingMs,
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-950">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-emerald-700">
          Q Tool
        </p>

        <h1 className="mt-2 text-2xl font-semibold">
          ルームに入室
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          教師から案内された6文字のPINを入力してください。
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5"
        >
          <label className="block">
            <span className="text-sm font-medium text-slate-800">
              PINコード
            </span>

            <input
              type="text"
              value={pin}
              onChange={(event) =>
                setPin(event.target.value.toUpperCase())
              }
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              disabled={isPending || isLocked}
              placeholder="例: ABC234"
              aria-describedby="join-pin-message"
              className="mt-2 w-full rounded-md border border-slate-300 px-4 py-3 text-center font-mono text-2xl font-semibold uppercase tracking-[0.25em] text-slate-950 outline-none transition placeholder:text-base placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </label>

          <div id="join-pin-message" aria-live="polite">
            {isLocked ? (
              <p
                role="alert"
                className="rounded-md bg-rose-50 px-3 py-3 text-sm text-rose-700"
              >
                入力回数の上限に達しました。
                {remainingTimeText}後にもう一度お試しください。
              </p>
            ) : null}

            {!isLocked && errorMessage ? (
              <p
                role="alert"
                className="rounded-md bg-rose-50 px-3 py-3 text-sm text-rose-700"
              >
                {errorMessage}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isPending || isLocked}
            className="inline-flex w-full items-center justify-center rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isPending ? "確認中..." : "ルームに入室"}
          </button>
        </form>

        <Link
          href="/"
          className="mt-6 block text-center text-sm font-medium text-slate-600 underline-offset-4 hover:underline"
        >
          トップページへ戻る
        </Link>
      </section>
    </main>
  );
}

function formatRemainingTime(remainingMs: number) {
  const totalSeconds = Math.max(
    0,
    Math.ceil(remainingMs / 1000),
  );

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}秒`;
  }

  return `${minutes}分${String(seconds).padStart(2, "0")}秒`;
}