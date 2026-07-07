"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { endRoom, endSection } from "../actions";
import type { RoomDisplay } from "../types";
import { RoomSectionCreateModal } from "./RoomSectionCreateModal";

/**
 * ルーム詳細表示コンポーネント
 * 教師が特定ルームの情報を確認する画面
 */
export function RoomDetail({ room }: { room: RoomDisplay }) {
  const router = useRouter();
  const [roomState, setRoomState] = useState(room);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isSectionEnding, setIsSectionEnding] = useState(false);
  const [isRoomEnding, startRoomEndTransition] = useTransition();

  // ルーム状態を日本語で表示
  const statusText = roomState.is_active ? "開講中" : "終了";
  const statusColor = roomState.is_active ? "text-emerald-700" : "text-rose-700";
  const pageBackground = roomState.is_active ? "bg-slate-50" : "bg-zinc-700";
  const cardBackground = roomState.is_active ? "bg-white" : "bg-zinc-300";
  const cardBorder = roomState.is_active ? "border-slate-200" : "border-zinc-300";
  const titleColor = roomState.is_active ? "text-slate-950" : "text-zinc-800";
  const mutedText = roomState.is_active ? "text-slate-500" : "text-zinc-600";
  const bodyText = roomState.is_active ? "text-slate-900" : "text-zinc-700";
  const subtleBadge = roomState.is_active
    ? "bg-slate-100 text-slate-700"
    : "bg-zinc-200 text-zinc-700";
  const buttonBorder = roomState.is_active
    ? "border-slate-300 text-slate-700 hover:bg-slate-50"
    : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50";
  const isSectionActive = Boolean(roomState.active_section_id);

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
    startRoomEndTransition(async () => {
      const result = await endRoom(roomState.id);

      if (result.ok) {
        const now = new Date();

        setRoomState((currentRoom) => ({
          ...currentRoom,
          is_active: false,
          active_section_id: null,
          active_section_name: null,
          updated_at: now,
          closed_at: now,
        }));
        setFeedbackMessage(result.message);
        router.refresh();
        return;
      }

      setFeedbackMessage(result.message);
    });
  };

  const handleEndSection = () => {
    setFeedbackMessage(null);
    setIsSectionEnding(true);

    void (async () => {
      const result = await endSection(roomState.id);

      setIsSectionEnding(false);

      if (!result.ok) {
        setFeedbackMessage(result.message);
        return;
      }

      setRoomState((currentRoom) => ({
        ...currentRoom,
        active_section_id: null,
        active_section_name: null,
        updated_at: new Date(),
      }));
      setFeedbackMessage(result.message);
      router.refresh();
    })();
  };

  return (
    <div className={`space-y-6 ${pageBackground} rounded-2xl p-4 sm:p-6`}>
      {/* ルーム名とステータス */}
      <section className={`rounded-lg border p-6 shadow-sm ${cardBackground} ${cardBorder}`}>
        <div className="flex flex-col justify-between sm:flex-row sm:items-start">
          <div>
            <h1 className={`text-2xl font-bold ${titleColor}`}>{roomState.name}</h1>
            <p className={`mt-2 text-sm font-semibold ${statusColor}`}>
              {statusText}
            </p>
            {feedbackMessage ? (
              <p
                className={`mt-2 text-sm ${
                  roomState.is_active ? "text-emerald-700" : "text-amber-300"
                }`}
              >
                {feedbackMessage}
              </p>
            ) : null}
          </div>
          <div className={`mt-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium sm:mt-0 ${subtleBadge}`}>
            招待コード: <span className="ml-2 font-mono font-bold">{roomState.invite_code}</span>
          </div>
        </div>
      </section>

      {/* 統計情報 */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* 質問数 */}
        <div className={`rounded-lg border p-4 shadow-sm ${cardBackground} ${cardBorder}`}>
          <p className={`text-sm font-semibold ${mutedText}`}>質問数</p>
          <p className={`mt-2 text-3xl font-bold ${titleColor}`}>
            {roomState.question_count}
          </p>
        </div>

        {/* 現在のセクション */}
        <div className={`rounded-lg border p-4 shadow-sm ${cardBackground} ${cardBorder}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className={`text-sm font-semibold ${mutedText}`}>現在のセクション</p>
              <p className={`mt-2 text-lg font-semibold ${titleColor}`}>
                {roomState.active_section_name ?? "セクションが開始されていません"}
              </p>
              <p className={`mt-2 text-sm ${bodyText}`}>
                {isSectionActive
                  ? "セクション終了で要約と回答の時間に進みます。"
                  : "次のセクションを作成して授業を再開できます。"}
              </p>
            </div>

            {isSectionActive ? (
              <button
                type="button"
                onClick={handleEndSection}
                disabled={isSectionEnding || !roomState.is_active}
                className="inline-flex cursor-pointer items-center justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-400"
              >
                {isSectionEnding ? "終了処理中..." : "セクション終了"}
              </button>
            ) : (
              <RoomSectionCreateModal
                roomId={roomState.id}
                disabled={!roomState.is_active}
                label="次のセクションを作成"
                onCreated={({ sectionId, sectionName }) => {
                  setRoomState((currentRoom) => ({
                    ...currentRoom,
                    active_section_id: sectionId,
                    active_section_name: sectionName,
                    updated_at: new Date(),
                  }));
                  setFeedbackMessage("セクションを作成しました。");
                  router.refresh();
                }}
              />
            )}
          </div>
        </div>
      </section>

      {/* 時刻情報 */}
      <section className={`rounded-lg border p-6 shadow-sm ${cardBackground} ${cardBorder}`}>
        <h2 className={`text-sm font-semibold ${mutedText}`}>ルーム情報</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className={`font-medium ${mutedText}`}>作成日時</dt>
            <dd className={bodyText}>{formatDate(roomState.created_at)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className={`font-medium ${mutedText}`}>最終更新</dt>
            <dd className={bodyText}>{formatDate(roomState.updated_at)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className={`font-medium ${mutedText}`}>終了日時</dt>
            <dd className={bodyText}>
              {roomState.closed_at ? formatDate(roomState.closed_at) : "未終了"}
            </dd>
          </div>
        </dl>
      </section>

      {/* アクションリンク */}
      <section className={`space-y-3 rounded-lg border p-6 shadow-sm ${cardBackground} ${cardBorder}`}>
        <h2 className={`mb-4 text-sm font-semibold ${mutedText}`}>次のステップ</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          {roomState.is_active ? (
            <button
              type="button"
              onClick={handleEndRoom}
              disabled={isRoomEnding}
              className="inline-flex cursor-pointer items-center justify-center rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-400"
            >
              {isRoomEnding ? "終了処理中..." : "ルーム終了"}
            </button>
          ) : (
            <div className="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
              終了済みです
            </div>
          )}

          {/* 招待画面へのリンク */}
          <Link
            href={`/rooms/${roomState.id}/invite`}
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            招待QR・PIN表示
          </Link>

          {/* 要約一覧へのリンク */}
          <Link
            href={`/rooms/${roomState.id}/summaries`}
            className="inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            AI要約を確認
          </Link>

          {/* チャットページへのリンク */}
          <Link
            href={`/rooms/${roomState.id}/chat`}
            className="inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            チャット表示
          </Link>

          {/* ダッシュボードに戻る */}
          <Link
            href="/dashboard"
            className={`inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-semibold transition ${buttonBorder}`}
          >
            ダッシュボードに戻る
          </Link>
        </div>
      </section>
    </div>
  );
}
