"use client";

import Link from "next/link";
import type { RoomDisplay } from "../types";

/**
 * ルーム詳細表示コンポーネント
 * 教師が特定ルームの情報を確認する画面
 */
export function RoomDetail({ room }: { room: RoomDisplay }) {
  // ルーム状態を日本語で表示
  const statusText = room.is_active ? "開講中" : "終了";
  const statusColor = room.is_active ? "text-emerald-700" : "text-slate-500";

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

  return (
    <div className="space-y-6">
      {/* ルーム名とステータス */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between sm:flex-row sm:items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">{room.name}</h1>
            <p className={`mt-2 text-sm font-semibold ${statusColor}`}>
              {statusText}
            </p>
          </div>
          <div className="mt-4 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 sm:mt-0">
            招待コード: <span className="ml-2 font-mono font-bold">{room.invite_code}</span>
          </div>
        </div>
      </section>

      {/* 統計情報 */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* 質問数 */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">質問数</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">
            {room.question_count}
          </p>
        </div>

        {/* 現在のセクション */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">現在のセクション</p>
          <p className="mt-2 text-lg text-slate-950">
            {room.active_section_id
              ? `セクションID: ${room.active_section_id}`
              : "セクションが開始されていません"}
          </p>
        </div>
      </section>

      {/* 時刻情報 */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-500">ルーム情報</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="font-medium text-slate-600">作成日時</dt>
            <dd className="text-slate-900">{formatDate(room.created_at)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium text-slate-600">最終更新</dt>
            <dd className="text-slate-900">{formatDate(room.updated_at)}</dd>
          </div>
        </dl>
      </section>

      {/* アクションリンク */}
      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-500">次のステップ</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
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

          {/* ルーム一覧に戻る */}
          <Link
            href="/rooms"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ルーム一覧に戻る
          </Link>
        </div>
      </section>
    </div>
  );
}
