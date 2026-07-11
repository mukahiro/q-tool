"use client";

import Link from "next/link";
import { SectionSummaryModal } from "@/features/question/components/SectionSummaryModal";
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

type NextStepEndRoomProps = {
  isActive: boolean;
  isPending: boolean;
  onEndRoom: () => void;
};

type RoomMetaItemProps = {
  label: string;
  value: string;
  surfaceClassName: string;
  borderClassName: string;
  emphasis?: boolean;
};

type SectionListProps = {
  roomId: string;
  sections: RoomSectionDisplay[];
  activeSectionId: string | null;
  bodyText: string;
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
  const pageBackground = roomState.is_active ? "bg-slate-50" : "bg-zinc-700";
  const cardBackground = roomState.is_active ? "bg-white" : "bg-zinc-300";
  const cardBorder = roomState.is_active ? "border-slate-200" : "border-zinc-300";
  const titleColor = roomState.is_active ? "text-slate-950" : "text-zinc-800";
  const mutedText = roomState.is_active ? "text-slate-500" : "text-zinc-600";
  const bodyText = roomState.is_active ? "text-slate-900" : "text-zinc-700";
  const subtleBadge = roomState.is_active
    ? "bg-slate-100 text-slate-700"
    : "bg-zinc-200 text-zinc-700";
  const metaSurface = roomState.is_active ? "bg-slate-50" : "bg-zinc-200";
  const metaBorder = roomState.is_active ? "border-slate-200" : "border-zinc-300";
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
    <div className={`space-y-6 ${pageBackground} rounded-2xl`}>
      {/* ルーム名とステータス */}
      <section className={`rounded-lg border p-6 shadow-sm ${cardBackground} ${cardBorder}`}>
        <div className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className={`text-2xl font-bold ${titleColor}`}>{roomState.name}</h1>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className={`rounded-full px-3 py-1 ${subtleBadge}`}>
                  招待コード: <span className="font-mono font-bold">{roomState.invite_code}</span>
                </span>
                <span
                  className={
                    roomState.is_active
                      ? "rounded-full bg-emerald-50 px-3 py-1 text-emerald-700"
                      : "rounded-full bg-rose-50 px-3 py-1 text-rose-700"
                  }
                >
                  {statusText}
                </span>
              </div>
            </div>

            {feedbackMessage ? (
              <p
                className={`rounded-md px-3 py-2 text-sm font-semibold ${
                  roomState.is_active ? "text-emerald-700" : "text-amber-300"
                }`}
              >
                {feedbackMessage}
              </p>
            ) : null}
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
            <RoomMetaItem
              label="質問数"
              value={`${roomState.question_count}件`}
              surfaceClassName={metaSurface}
              borderClassName={metaBorder}
            />
            {roomState.creator_name ? (
              <RoomMetaItem
                label="作成者"
                value={roomState.creator_name}
                surfaceClassName={metaSurface}
                borderClassName={metaBorder}
              />
            ) : null}
            <RoomMetaItem
              label="作成日時"
              value={formatDate(roomState.created_at)}
              surfaceClassName={metaSurface}
              borderClassName={metaBorder}
            />
            <RoomMetaItem
              label="最終更新"
              value={formatDate(roomState.updated_at)}
              surfaceClassName={metaSurface}
              borderClassName={metaBorder}
            />
            <RoomMetaItem
              label="終了日時"
              value={roomState.closed_at ? formatDate(roomState.closed_at) : "未終了"}
              surfaceClassName={metaSurface}
              borderClassName={metaBorder}
            />
          </dl>
        </div>
      </section>

      {/* 次に使う操作 */}
      <section className="grid gap-4 lg:grid-cols-3">
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
        <NextStepEndRoom
          isActive={roomState.is_active}
          isPending={isRoomEnding}
          onEndRoom={handleEndRoom}
        />
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
        />
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

function RoomMetaItem({
  label,
  value,
  surfaceClassName,
  borderClassName,
  emphasis = false,
}: RoomMetaItemProps) {
  return (
    <div className={`rounded-md border px-4 py-3 ${surfaceClassName} ${borderClassName}`}>
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd
        className={
          emphasis
            ? "mt-1 text-2xl font-bold leading-none text-slate-950"
            : "mt-1 break-words text-sm font-semibold leading-6 text-slate-800"
        }
      >
        {value}
      </dd>
    </div>
  );
}

function NextStepEndRoom({
  isActive,
  isPending,
  onEndRoom,
}: NextStepEndRoomProps) {
  return (
    <div className="flex h-full flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <span>
        <span className="block text-sm font-semibold text-slate-950">ルーム終了</span>
        <span className="mt-2 block text-sm leading-6 text-slate-600">
          授業が終わったら受付を止め、新しい質問の投稿を締め切ります。
        </span>
      </span>
      {isActive ? (
        <button
          type="button"
          onClick={onEndRoom}
          disabled={isPending}
          className="mt-4 inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-400"
        >
          {isPending ? "終了処理中..." : "ルームを終了"}
        </button>
      ) : (
        <span className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
          終了済み
        </span>
      )}
    </div>
  );
}

function SectionList({
  roomId,
  sections,
  activeSectionId,
  bodyText,
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
    <div className="mt-5 h-96 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3">
      <ol className="space-y-3">
        {sortedSections.map((section) => {
          const isCurrent = section.id === activeSectionId;
          const statusClass = isCurrent
            ? "bg-emerald-100 text-emerald-700"
            : section.is_completed
              ? "bg-slate-100 text-slate-700"
              : "bg-amber-100 text-amber-700";
          const statusText = isCurrent
            ? "現在のセクション"
            : section.is_completed
              ? "過去のセクション"
              : "未完了のセクション";

          return (
            <li
              key={section.id}
              className="rounded-lg border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="break-words text-base font-bold text-slate-950">
                      {section.name}
                    </h3>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass}`}>
                      {statusText}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
                    <span>
                      {section.order > 0 ? `セクション${section.order}` : "セクション"}
                    </span>
                    <span>{section.question_count}件の質問</span>
                    <span>作成: {formatSectionDate(section.created_at)}</span>
                    {section.completed_at ? (
                      <span>終了: {formatSectionDate(section.completed_at)}</span>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {section.summary_id ? (
                    <SectionSummaryModal
                      roomId={roomId}
                      sectionId={section.id}
                      sectionName={section.name}
                    />
                  ) : null}
                </div>
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
