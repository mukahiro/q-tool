"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { submitStudentQuestion } from "../actions";
import { fetchRoomStatus } from "../utils/firebase";

type StudentChatViewProps = {
  roomId: string;
};

export function StudentChatView({ roomId }: StudentChatViewProps) {
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isRoomActive, setIsRoomActive] = useState(true);
  const [isPending, startTransition] = useTransition();

  const studentSessionId = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const stored = window.localStorage.getItem("student_session_id");

    if (stored) {
      return stored;
    }

    const generated = crypto.randomUUID();
    window.localStorage.setItem("student_session_id", generated);
    return generated;
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadRoomStatus() {
      const { data } = await fetchRoomStatus(roomId);
      if (isMounted) {
        setIsRoomActive(data?.is_active ?? true);
      }
    }

    void loadRoomStatus();

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setMessage(null);
    startTransition(async () => {
      const result = await submitStudentQuestion(roomId, content, studentSessionId);
      setMessage(result.message);
      if (result.ok) {
        setContent("");
      }
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">Q Tool</p>
          <h1 className="mt-2 text-2xl font-semibold">質問を送信</h1>
          <p className="mt-2 text-sm text-slate-600">
            {isRoomActive
              ? "このルームでは質問を投稿できます。"
              : "このルームは終了しました。新しい質問は投稿できません。"}
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <label htmlFor="question-content" className="block text-sm font-semibold text-slate-700">
            質問内容
          </label>
          <textarea
            id="question-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            disabled={!isRoomActive || isPending}
            rows={6}
            className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-100"
            placeholder="授業中に気になったことを入力してください"
          />

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {isRoomActive ? "投稿後に教師画面で共有されます。" : "終了済みのため投稿できません。"}
            </p>
            <button
              type="submit"
              disabled={!isRoomActive || isPending}
              className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
            >
              {isPending ? "送信中..." : "質問を送信"}
            </button>
          </div>

          {message && (
            <p className={`mt-4 text-sm ${message.includes("失敗") ? "text-rose-600" : "text-emerald-700"}`}>
              {message}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
