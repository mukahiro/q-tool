"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { endRoom } from "../actions";
import type { RoomDisplay } from "../types";

/**
 * ルーム詳細表示コンポーネント
 * 教師が特定ルームの情報を確認する画面
 */
export function RoomDetail({ room }: { room: RoomDisplay }) {
  const router = useRouter();
  const [isRoomActive, setIsRoomActive] = useState(room.is_active);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ルーム状態を日本語で表示
  const statusText = isRoomActive ? "開講中" : "終了";
  const statusColor = isRoomActive ? "text-emerald-700" : "text-rose-700";
  const pageBackground = isRoomActive ? "bg-slate-50" : "bg-zinc-700";
  const cardBackground = isRoomActive ? "bg-white" : "bg-zinc-300";
  const cardBorder = isRoomActive ? "border-slate-200" : "border-zinc-300";
  const titleColor = isRoomActive ? "text-slate-950" : "text-zinc-800";
  const mutedText = isRoomActive ? "text-slate-500" : "text-zinc-600";
  const bodyText = isRoomActive ? "text-slate-900" : "text-zinc-700";
  const subtleBadge = isRoomActive ? "bg-slate-100 text-slate-700" : "bg-zinc-200 text-zinc-700";
  const buttonBorder = isRoomActive ? "border-slate-300 text-slate-700 hover:bg-slate-50" : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50";

  // 日時をフォーマット
  const formatDate = (date: Date) => {
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleEndRoom = () => {
    const confirmed = window.confirm(
      "ルームを終了しますか？終了後は学生が新しい質問を投稿できなくなります。",
    );

    if (!confirmed) {
      return;
    }

    setFeedbackMessage(null);
    startTransition(async () => {
      const result = await endRoom(room.id);

      if (result.ok) {
        setIsRoomActive(false);
        setFeedbackMessage(result.message);
        router.refresh();
        return;
      }

      setFeedbackMessage(result.message);
    });
  };

  return (
    <div className={`space-y-6 ${pageBackground} rounded-2xl p-4 sm:p-6`}>
      {/* ルーム名とステータス */}
      <section className={`rounded-lg border p-6 shadow-sm ${cardBackground} ${cardBorder}`}>
        <div className="flex flex-col justify-between sm:flex-row sm:items-start">
          <div>
            <h1 className={`text-2xl font-bold ${titleColor}`}>{room.name}</h1>
            <p className={`mt-2 text-sm font-semibold ${statusColor}`}>
              {statusText}
            </p>
            {feedbackMessage && (
              <p className={`mt-2 text-sm ${isRoomActive ? "text-emerald-700" : "text-amber-300"}`}>
                {feedbackMessage}
              </p>
            )}
          </div>
          <div className={`mt-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium sm:mt-0 ${subtleBadge}`}>
            招待コード: <span className="ml-2 font-mono font-bold">{room.invite_code}</span>
          </div>
        </div>
      </section>

      {/* 統計情報 */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* 質問数 */}
        <div className={`rounded-lg border p-4 shadow-sm ${cardBackground} ${cardBorder}`}>
          <p className={`text-sm font-semibold ${mutedText}`}>質問数</p>
          <p className={`mt-2 text-3xl font-bold ${titleColor}`}>
            {room.question_count}
          </p>
        </div>

        {/* 現在のセクション */}
        <div className={`rounded-lg border p-4 shadow-sm ${cardBackground} ${cardBorder}`}>
          <p className={`text-sm font-semibold ${mutedText}`}>現在のセクション</p>
          <p className={`mt-2 text-lg ${titleColor}`}>
            {room.active_section_id
              ? `セクションID: ${room.active_section_id}`
              : "セクションが開始されていません"}
          </p>
        </div>
      </section>

      {/* 時刻情報 */}
      <section className={`rounded-lg border p-6 shadow-sm ${cardBackground} ${cardBorder}`}>
        <h2 className={`text-sm font-semibold ${mutedText}`}>ルーム情報</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className={`font-medium ${mutedText}`}>作成日時</dt>
            <dd className={bodyText}>{formatDate(room.created_at)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className={`font-medium ${mutedText}`}>最終更新</dt>
            <dd className={bodyText}>{formatDate(room.updated_at)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className={`font-medium ${mutedText}`}>終了日時</dt>
            <dd className={bodyText}>
              {room.closed_at ? formatDate(room.closed_at) : "未終了"}
            </dd>
          </div>
        </dl>
      </section>

      {/* アクションリンク */}
      <section className={`space-y-3 rounded-lg border p-6 shadow-sm ${cardBackground} ${cardBorder}`}>
        <h2 className={`mb-4 text-sm font-semibold ${mutedText}`}>次のステップ</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          {isRoomActive ? (
            <button
              type="button"
              onClick={handleEndRoom}
              disabled={isPending}
              className="inline-flex cursor-pointer items-center justify-center rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-400"
            >
              {isPending ? "終了処理中..." : "ルーム終了"}
            </button>
          ) : (
            <div className="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
              終了済みです
            </div>
          )}

          {/* 招待画面へのリンク */}
          <Link
            href={`/rooms/${room.id}/invite`}
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            招待QR・PIN表示
          </Link>

          {/* 要約一覧へのリンク */}
          <Link
            href={`/rooms/${room.id}/summaries`}
            className="inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            AI要約を確認
          </Link>

          {/* ダッシュボードに戻る */}
          <Link
            href="/"
            className={`inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-semibold transition ${buttonBorder}`}
          >
            ダッシュボードに戻る
          </Link>
        </div>
      </section>
    </div>
  );
}
