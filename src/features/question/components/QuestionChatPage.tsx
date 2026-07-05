"use client";

import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import {
  postQuestion,
  toggleQuestionReaction,
} from "@/features/question/actions";
import { useQuestionChat } from "../hooks/useQuestionChat";
import type {
  QuestionListItem,
  QuestionSectionGroup,
  StudentChatRoom,
} from "../types";

export function QuestionChatPage({
  initialRoom,
}: {
  initialRoom: StudentChatRoom;
}) {
  const {
    room,
    studentSessionId,
    questionGroups,
    errorMessage,
    isLoadingQuestions,
    setErrorMessage,
  } = useQuestionChat(initialRoom);
  const [content, setContent] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [expandedPastSectionIds, setExpandedPastSectionIds] = useState<
    Set<string>
  >(() => new Set());
  const [isPending, startTransition] = useTransition();

  const canPost = room.isActive && Boolean(room.activeSectionId);
  const questionCount = questionGroups.reduce(
    (total, group) => total + group.questions.length,
    0,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!studentSessionId) {
      setErrorMessage(
        "学生セッションを確認できませんでした。入室画面から入り直してください。",
      );
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const result = await postQuestion({
        roomId: room.id,
        studentSessionId,
        content,
      });

      if (!result.ok) {
        setErrorMessage(result.message);
        return;
      }

      setContent("");
      setSuccessMessage(result.message);
    });
  }

  function handleReaction(questionId: string) {
    if (!studentSessionId) {
      setErrorMessage(
        "学生セッションを確認できませんでした。入室画面から入り直してください。",
      );
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const result = await toggleQuestionReaction({
        roomId: room.id,
        questionId,
        studentSessionId,
      });

      if (!result.ok) {
        setErrorMessage(result.message);
      }
    });
  }

  function togglePastSection(sectionId: string) {
    setExpandedPastSectionIds((current) => {
      const next = new Set(current);

      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }

      return next;
    });
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Q Tool</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">
              {room.name}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span
              className={
                room.isActive
                  ? "rounded-full bg-emerald-50 px-3 py-1 text-emerald-700"
                  : "rounded-full bg-slate-100 px-3 py-1 text-slate-600"
              }
            >
              {room.isActive ? "受付中" : "終了済み"}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              {room.activeSectionId
                ? `セクション: ${room.activeSectionId}`
                : "受付中のセクションなし"}
            </span>
          </div>
        </div>
      </section>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          {successMessage}
        </div>
      )}

      {!room.isActive && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          このルームは終了済みです。質問の閲覧はできますが、新しい投稿はできません。
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">質問を投稿</h2>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              質問内容
            </span>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              disabled={!canPost || isPending}
              rows={4}
              maxLength={500}
              placeholder={
                canPost
                  ? "わからないことを入力してください"
                  : "現在は質問を投稿できません"
              }
              className="mt-2 w-full resize-none rounded-md border border-slate-300 px-3 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-500"
            />
          </label>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">{content.length}/500</p>
            <button
              type="submit"
              disabled={!canPost || isPending || content.trim().length === 0}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isPending ? "送信中..." : "投稿する"}
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-950">投稿済み質問</h2>
          <span className="text-sm font-semibold text-slate-500">
            {questionCount}件
          </span>
        </div>

        {isLoadingQuestions && (
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
            質問を読み込んでいます。
          </div>
        )}

        {!isLoadingQuestions && questionCount === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
            まだ質問はありません。
          </div>
        )}

        {questionGroups.map((group) => (
          <QuestionSection
            key={group.sectionId}
            group={group}
            isExpanded={
              !group.isPastSection || expandedPastSectionIds.has(group.sectionId)
            }
            isPending={isPending}
            onToggle={togglePastSection}
            onReaction={handleReaction}
          />
        ))}
      </section>

      <div className="pt-2 text-center">
        <Link
          href="/join"
          className="text-sm font-semibold text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline"
        >
          別のルームに入室する
        </Link>
      </div>
    </div>
  );
}

function QuestionSection({
  group,
  isExpanded,
  isPending,
  onToggle,
  onReaction,
}: {
  group: QuestionSectionGroup;
  isExpanded: boolean;
  isPending: boolean;
  onToggle: (sectionId: string) => void;
  onReaction: (questionId: string) => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-base font-bold text-slate-950">
              {group.sectionName}
            </h3>
            <span
              className={
                group.isActiveSection
                  ? "rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"
                  : "rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600"
              }
            >
              {group.isActiveSection ? "現在のセクション" : "過去のセクション"}
            </span>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {group.questions.length}件の質問
          </p>
        </div>

        {group.isPastSection && (
          <button
            type="button"
            onClick={() => onToggle(group.sectionId)}
            aria-expanded={isExpanded}
            aria-label={
              isExpanded ? "過去のセクションを隠す" : "過去のセクションを表示する"
            }
            title={
              isExpanded ? "過去のセクションを隠す" : "過去のセクションを表示する"
            }
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-slate-300 text-slate-700 transition hover:bg-slate-50"
          >
            <ChevronDownIcon
              className={
                isExpanded
                  ? "size-5 rotate-180 transition-transform"
                  : "size-5 transition-transform"
              }
            />
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-3 border-t border-slate-100 p-4">
          {group.questions.map((question) => (
            <QuestionItem
              key={question.id}
              question={question}
              isPending={isPending}
              onReaction={onReaction}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ChevronDownIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function QuestionItem({
  question,
  isPending,
  onReaction,
}: {
  question: QuestionListItem;
  isPending: boolean;
  onReaction: (questionId: string) => void;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
              対象セクション: {question.sectionName}
            </span>
            {question.isOwnQuestion && (
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                自分の質問
              </span>
            )}
            <span className="text-xs font-medium text-slate-500">
              {question.createdAtText}
            </span>
          </div>
          <p className="mt-3 whitespace-pre-wrap break-words text-base leading-7 text-slate-950">
            {question.content}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <p className="text-xs font-semibold text-slate-500">
          共感 {question.reactionCount}件
        </p>

        {!question.isOwnQuestion && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => onReaction(question.id)}
            aria-pressed={question.hasReacted}
            className={
              question.hasReacted
                ? "inline-flex min-h-10 items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                : "inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
            }
          >
            {question.hasReacted ? "取り消す" : "共感する"}
          </button>
        )}
      </div>
    </article>
  );
}
