"use client";

import Link from "next/link";
import { EndSectionForm } from "@/features/summary/components/EndSectionForm";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { endRoom } from "../actions";
import type { RoomDisplay, RoomSectionDisplay } from "../types";
import { RoomSectionCreateModal } from "./RoomSectionCreateModal";

type NextStepLinkProps = {
  href: string;
  label: string;
  description: string;
  actionLabel: string;
};

type SectionListProps = {
  roomId: string;
  sections: RoomSectionDisplay[];
  activeSectionId: string | null;
  bodyText: string;
  mutedText: string;
  titleColor: string;
};

/**
 * ルーム詳細表示コンポーネント
 * 教師が特定ルームの情報を確認する画面
 */
export function RoomDetail({ room }: { room: RoomDisplay }) {
  const router = useRouter();
  const [roomState, setRoomState] = useState(room);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
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
  const nextStepHeadingColor = roomState.is_active ? "text-slate-950" : "text-zinc-50";
  const nextStepMutedText = roomState.is_active ? "text-slate-600" : "text-zinc-200";
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
          sections: currentRoom.sections.map((section) =>
            section.id === currentRoom.active_section_id
              ? { ...section, is_completed: true, completed_at: now }
              : section,
          ),
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
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
              {roomState.creator_name ? (
                <div>
                  <dt className={`font-medium ${mutedText}`}>作成ユーザー</dt>
                  <dd className={`mt-1 font-semibold ${bodyText}`}>{roomState.creator_name}</dd>
                </div>
              ) : null}
              <div>
                <dt className={`font-medium ${mutedText}`}>質問数</dt>
                <dd className={`mt-1 font-semibold ${bodyText}`}>
                  {roomState.question_count}件
                </dd>
              </div>
              <div>
                <dt className={`font-medium ${mutedText}`}>作成日時</dt>
                <dd className={bodyText}>{formatDate(roomState.created_at)}</dd>
              </div>
              <div>
                <dt className={`font-medium ${mutedText}`}>最終更新</dt>
                <dd className={bodyText}>{formatDate(roomState.updated_at)}</dd>
              </div>
              <div>
                <dt className={`font-medium ${mutedText}`}>終了日時</dt>
                <dd className={bodyText}>
                  {roomState.closed_at ? formatDate(roomState.closed_at) : "未終了"}
                </dd>
              </div>
            </dl>
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

      {/* セクション */}
      <section className={`rounded-lg border p-5 shadow-sm ${cardBackground} ${cardBorder}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className={`text-sm font-semibold ${mutedText}`}>セクション</h2>
            <p className={`mt-2 text-lg font-semibold ${titleColor}`}>
              {roomState.active_section_name ?? "進行中のセクションはありません"}
            </p>
            <p className={`mt-2 text-sm ${bodyText}`}>
              {isSectionActive
                ? "セクション終了で要約と回答の時間に進みます。"
                : "次のセクションを作成して授業を再開できます。"}
            </p>
          </div>

          {isSectionActive ? (
            <EndSectionForm
              roomId={roomState.id}
              hasActiveSection={Boolean(roomState.active_section_id)}
              onEnded={() => {
                const now = new Date();

                setRoomState((currentRoom) => ({
                  ...currentRoom,
                  active_section_id: null,
                  active_section_name: null,
                  sections: currentRoom.sections.map((section) =>
                    section.id === currentRoom.active_section_id
                      ? { ...section, is_completed: true, completed_at: now }
                      : section,
                  ),
                  updated_at: now,
                }));
                setFeedbackMessage("セクションを終了しました。");
              }}
            />
          ) : (
            <RoomSectionCreateModal
              roomId={roomState.id}
              disabled={!roomState.is_active}
              label="次のセクションを作成"
              onCreated={({ sectionId, sectionName }) => {
                const now = new Date();

                setRoomState((currentRoom) => ({
                  ...currentRoom,
                  active_section_id: sectionId,
                  active_section_name: sectionName,
                  sections: [
                    ...currentRoom.sections,
                    {
                      id: sectionId,
                      name: sectionName,
                      order: currentRoom.sections.length + 1,
                      is_completed: false,
                      question_count: 0,
                      reaction_count: 0,
                      summary_id: null,
                      created_at: now,
                      completed_at: null,
                    },
                  ],
                  updated_at: now,
                }));
                setFeedbackMessage("セクションを作成しました。");
                router.refresh();
              }}
            />
          )}
        </div>

        <SectionList
          roomId={roomState.id}
          sections={roomState.sections}
          activeSectionId={roomState.active_section_id}
          bodyText={bodyText}
          mutedText={mutedText}
          titleColor={titleColor}
        />
      </section>

      {/* 次に使う操作 */}
      <section className="space-y-4" aria-labelledby="next-steps-heading">
        <div>
          <h2 id="next-steps-heading" className={`text-lg font-bold ${nextStepHeadingColor}`}>
            次のステップ
          </h2>
          <p className={`mt-1 text-sm ${nextStepMutedText}`}>
            授業中によく使う画面と、授業後の確認先をまとめています。
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <NextStepLink
            href={`/rooms/${roomState.id}/invite`}
            label="学生に共有する"
            description="QRコードと参加コードを表示して、学生がこのルームに参加できるようにします。"
            actionLabel="招待画面を開く"
          />
          <NextStepLink
            href={`/rooms/${roomState.id}/chat`}
            label="質問を確認する"
            description="学生から届いた質問を授業中に確認します。教室表示にも使いやすい画面です。"
            actionLabel="チャットを開く"
          />
          <NextStepLink
            href={`/rooms/${roomState.id}/summaries`}
            label="要約を振り返る"
            description="終了したセクションの要約と回答案を確認し、授業後の整理に使います。"
            actionLabel="要約一覧を開く"
          />
        </div>

        <div className={`rounded-lg border p-5 shadow-sm ${cardBackground} ${cardBorder}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className={`text-sm font-semibold ${titleColor}`}>ルームの受付状態</h3>
              <p className={`mt-1 text-sm ${bodyText}`}>
                {roomState.is_active
                  ? "授業が終わったらルームを終了して、新しい質問の受付を止めます。"
                  : "このルームは終了済みです。内容の確認と要約の振り返りは引き続き行えます。"}
              </p>
            </div>

            {roomState.is_active ? (
              <button
                type="button"
                onClick={handleEndRoom}
                disabled={isRoomEnding}
                className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-400"
              >
                {isRoomEnding ? "終了処理中..." : "ルームを終了"}
              </button>
            ) : (
              <span className="inline-flex min-h-10 items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                終了済み
              </span>
            )}
          </div>
        </div>

      </section>
    </div>
  );
}

function NextStepLink({ href, label, description, actionLabel }: NextStepLinkProps) {
  return (
    <Link
      href={href}
      className="flex h-full flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
    >
      <span>
        <span className="block text-sm font-semibold text-slate-950">{label}</span>
        <span className="mt-2 block text-sm leading-6 text-slate-600">{description}</span>
      </span>
      <span className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
        {actionLabel}
      </span>
    </Link>
  );
}

function SectionList({
  roomId,
  sections,
  activeSectionId,
  bodyText,
  mutedText,
  titleColor,
}: SectionListProps) {
  if (sections.length === 0) {
    return (
      <p className={`mt-5 flex h-64 items-center justify-center rounded-md border border-dashed border-slate-300 px-4 py-3 text-sm ${bodyText}`}>
        まだセクションは作成されていません。
      </p>
    );
  }

  const sortedSections = [...sections].sort((a, b) => {
    if (b.order !== a.order) {
      return b.order - a.order;
    }

    return b.created_at.getTime() - a.created_at.getTime();
  });

  return (
    <div className="mt-5 h-96 overflow-y-auto rounded-md border border-slate-200 bg-white/70">
      <ol className="divide-y divide-slate-200">
        {sortedSections.map((section) => {
          const isCurrent = section.id === activeSectionId;
          const statusText = isCurrent
            ? "進行中"
            : section.is_completed
              ? "完了"
              : "未完了";
          const statusClass = isCurrent
            ? "bg-emerald-100 text-emerald-700"
            : section.is_completed
              ? "bg-slate-100 text-slate-700"
              : "bg-amber-100 text-amber-700";

          return (
            <li key={section.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-sm font-semibold ${titleColor}`}>
                    {section.order > 0 ? `セクション${section.order}` : "セクション"}
                  </span>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass}`}>
                    {statusText}
                  </span>
                </div>
                <p className={`mt-1 text-base font-semibold ${titleColor}`}>
                  {section.name}
                </p>
                <p className={`mt-1 text-sm ${mutedText}`}>
                  作成: {formatSectionDate(section.created_at)}
                  {section.completed_at
                    ? ` / 終了: ${formatSectionDate(section.completed_at)}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <div className={`text-sm font-semibold ${bodyText}`}>
                  質問 {section.question_count}件
                </div>
                {section.summary_id ? (
                  <Link
                    href={`/rooms/${roomId}/summaries#${section.summary_id}`}
                    className="inline-flex min-h-9 items-center justify-center rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                  >
                    要約を表示
                  </Link>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function formatSectionDate(date: Date) {
  return date.toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
