"use client";

import {
  ArrowDown,
  Bell,
  ChevronDown,
  Heart,
  MessageSquare,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  postQuestion,
  toggleQuestionReaction,
} from "@/features/question/actions";
import { useQuestionChat } from "../hooks/useQuestionChat";
import { SectionSummaryModal } from "./SectionSummaryModal";
import type {
  QuestionListItem,
  QuestionSectionGroup,
  StudentChatRoom,
} from "../types";

type QuestionTargetScope = "active_section" | "whole_class";
type NewQuestionNotice = {
  questionId: string;
  sectionId: string;
  count: number;
  isOwnQuestion: boolean;
} | null;

export function QuestionChatPage({
  initialRoom,
}: {
  initialRoom: StudentChatRoom;
}) {
  const {
    room,
    studentSessionId,
    activeSectionName,
    questionGroups,
    errorMessage,
    isLoadingQuestions,
    setErrorMessage,
  } = useQuestionChat(initialRoom);
  const [content, setContent] = useState("");
  const [expandedPastSectionIds, setExpandedPastSectionIds] = useState<
    Set<string>
  >(() => new Set());
  const [targetScope, setTargetScope] =
    useState<QuestionTargetScope>("active_section");
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const [newQuestionNotice, setNewQuestionNotice] =
    useState<NewQuestionNotice>(null);
  const [isPending, startTransition] = useTransition();
  const notifiedQuestionIdsRef = useRef<Set<string>>(new Set());

  const effectiveTargetScope =
    targetScope === "active_section" && !room.activeSectionId
      ? "whole_class"
      : targetScope;
  const canPost =
    room.isActive &&
    (effectiveTargetScope === "whole_class" || Boolean(room.activeSectionId));
  const questionCount = questionGroups.reduce(
    (total, group) => total + group.questions.length,
    0,
  );
  const targetScopeLabel =
    effectiveTargetScope === "active_section"
      ? (activeSectionName ?? "現在のセクション")
      : "授業全体";
  const recentlyAddedQuestions = useMemo(
    () =>
      questionGroups.flatMap((group) =>
        group.questions
          .filter((question) => question.isRecentlyAdded)
          .map((question) => ({
            id: question.id,
            sectionId: group.sectionId,
            isOwnQuestion: question.isOwnQuestion,
          })),
      ),
    [questionGroups],
  );

  useEffect(() => {
    const unnotifiedQuestions = recentlyAddedQuestions.filter(
      (question) => !notifiedQuestionIdsRef.current.has(question.id),
    );

    if (unnotifiedQuestions.length === 0) {
      return;
    }

    unnotifiedQuestions.forEach((question) => {
      notifiedQuestionIdsRef.current.add(question.id);
    });

    const latestQuestion = unnotifiedQuestions[0];
    setNewQuestionNotice({
      questionId: latestQuestion.id,
      sectionId: latestQuestion.sectionId,
      count: unnotifiedQuestions.length,
      isOwnQuestion: latestQuestion.isOwnQuestion,
    });
  }, [recentlyAddedQuestions]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!studentSessionId) {
      setErrorMessage(
        "学生セッションを確認できませんでした。入室画面から入り直してください。",
      );
      return;
    }

    setErrorMessage(null);

    startTransition(async () => {
      const result = await postQuestion({
        roomId: room.id,
        studentSessionId,
        targetScope: effectiveTargetScope,
        content,
      });

      if (!result.ok) {
        setErrorMessage(result.message);
        return;
      }

      setContent("");
      setIsComposerExpanded(false);
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

  function handleNewQuestionNoticeClick() {
    if (!newQuestionNotice) {
      return;
    }

    const noticeSection = questionGroups.find(
      (group) => group.sectionId === newQuestionNotice.sectionId,
    );

    if (noticeSection?.isPastSection) {
      setExpandedPastSectionIds((current) => {
        if (current.has(newQuestionNotice.sectionId)) {
          return current;
        }

        const next = new Set(current);
        next.add(newQuestionNotice.sectionId);
        return next;
      });
    }

    setNewQuestionNotice(null);

    window.setTimeout(() => {
      const questionElement = document.getElementById(
        `question-${newQuestionNotice.questionId}`,
      );
      questionElement?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 50);
  }

  function getNewQuestionNoticeText() {
    if (!newQuestionNotice) {
      return "";
    }

    if (newQuestionNotice.isOwnQuestion) {
      return "質問を投稿しました";
    }

    return newQuestionNotice.count > 1
      ? `${newQuestionNotice.count}件の新しい投稿があります`
      : "新しい投稿があります";
  }

  return (
    <div
      className={
        isComposerExpanded ? "space-y-5 pb-96" : "space-y-5 pb-28"
      }
    >
      {newQuestionNotice && (
        <div className="fixed inset-x-0 top-3 z-30 px-4">
          <button
            type="button"
            onClick={handleNewQuestionNoticeClick}
            className="mx-auto flex min-h-12 w-full max-w-sm cursor-pointer items-center gap-3 rounded-md border border-emerald-200 bg-white px-4 py-3 text-left text-sm font-bold text-slate-950 shadow-lg shadow-slate-950/10 transition hover:border-emerald-300 hover:bg-emerald-50"
          >
            <Bell
              aria-hidden="true"
              className="size-5 shrink-0 text-emerald-700"
            />
            <span className="min-w-0 flex-1">
              {getNewQuestionNoticeText()}
            </span>
            <ArrowDown
              aria-hidden="true"
              className="size-4 shrink-0 text-emerald-700"
            />
          </button>
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">
              {room.name}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              担当教師: {room.teacherName ?? "未設定"}
            </p>
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
                ? `セクション: ${activeSectionName}`
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

      {!room.isActive && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          このルームは終了済みです。質問の閲覧はできますが、新しい投稿はできません。
        </div>
      )}

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
            roomId={room.id}
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

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="mx-auto w-full max-w-3xl">
          {!isComposerExpanded && (
            <button
              type="button"
              disabled={!room.isActive}
              onClick={() => setIsComposerExpanded(true)}
              className="flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-md border border-slate-300 bg-white px-4 py-3 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              <MessageSquare
                aria-hidden="true"
                className="size-5 shrink-0 text-emerald-700"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-950">
                  質問を書く
                </span>
                <span className="block truncate text-xs font-semibold text-slate-500">
                  質問先: {targetScopeLabel}
                </span>
              </span>
            </button>
          )}

          {isComposerExpanded && (
            <form
              className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              onSubmit={handleSubmit}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-slate-950">
                  質問を投稿
                </h2>
                <button
                  type="button"
                  onClick={() => setIsComposerExpanded(false)}
                  aria-label="投稿フォームを閉じる"
                  className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-100"
                >
                  <X aria-hidden="true" className="size-5" />
                </button>
              </div>

              <fieldset className="space-y-2">
                <div className="grid grid-cols-2 gap-2 rounded-md bg-slate-100 p-1">
                  <button
                    type="button"
                    disabled={
                      !room.activeSectionId || !room.isActive || isPending
                    }
                    onClick={() => setTargetScope("active_section")}
                    aria-pressed={effectiveTargetScope === "active_section"}
                    className={
                      effectiveTargetScope === "active_section"
                        ? "min-h-10 cursor-pointer rounded-sm bg-white px-3 py-2 text-sm font-bold text-emerald-700 shadow-sm disabled:cursor-not-allowed disabled:text-slate-400"
                        : "min-h-10 cursor-pointer rounded-sm px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-white/70 disabled:cursor-not-allowed disabled:text-slate-400"
                    }
                  >
                    現在のセクション
                  </button>
                  <button
                    type="button"
                    disabled={!room.isActive || isPending}
                    onClick={() => setTargetScope("whole_class")}
                    aria-pressed={effectiveTargetScope === "whole_class"}
                    className={
                      effectiveTargetScope === "whole_class"
                        ? "min-h-10 cursor-pointer rounded-sm bg-white px-3 py-2 text-sm font-bold text-emerald-700 shadow-sm disabled:cursor-not-allowed disabled:text-slate-400"
                        : "min-h-10 cursor-pointer rounded-sm px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-white/70 disabled:cursor-not-allowed disabled:text-slate-400"
                    }
                  >
                    授業全体
                  </button>
                </div>
              </fieldset>

              <label className="block">
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  disabled={!canPost || isPending}
                  autoFocus
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
                  disabled={
                    !canPost || isPending || content.trim().length === 0
                  }
                  className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-emerald-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isPending ? "送信中..." : "投稿する"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function QuestionSection({
  roomId,
  group,
  isExpanded,
  isPending,
  onToggle,
  onReaction,
}: {
  roomId: string;
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
                group.isWholeClass
                  ? "rounded-full bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700"
                  : group.isActiveSection
                  ? "rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"
                  : "rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600"
              }
            >
              {group.isWholeClass
                ? "授業全体への質問"
                : group.isActiveSection
                  ? "現在のセクション"
                  : "過去のセクション"}
            </span>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {group.questions.length}件の質問
          </p>
        </div>

        {group.isPastSection ? (
          <div className="flex shrink-0 items-center gap-2">
            <SectionSummaryModal
              roomId={roomId}
              sectionId={group.sectionId}
              sectionName={group.sectionName}
            />

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
              className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-300 text-slate-700 transition hover:bg-slate-50"
            >
              <ChevronDown
                aria-hidden="true"
                className={
                  isExpanded
                    ? "size-5 rotate-180 transition-transform"
                    : "size-5 transition-transform"
                }
              />
            </button>
          </div>
        ) : null}
      </div>

      {isExpanded && (
        <div className="space-y-3 border-t border-slate-100 p-4">
          {group.questions.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              このセクションにはまだ質問がありません。
            </p>
          ) : (
            group.questions.map((question) => (
              <QuestionItem
                key={question.id}
                question={question}
                isPending={isPending}
                onReaction={onReaction}
              />
            ))
          )}
        </div>
      )}
    </section>
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
    <article
      id={`question-${question.id}`}
      className={
        question.isRecentlyAdded
          ? "origin-top rounded-lg border border-emerald-300 bg-emerald-50 p-4 ring-2 ring-emerald-100 transition-all duration-700 motion-safe:animate-[question-card-enter_700ms_ease-out]"
          : "origin-top rounded-lg border border-slate-200 bg-slate-50 p-4 transition-all duration-700"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
              {question.targetLabel}
            </span>
            <span className="text-xs font-medium text-slate-500">
              {question.createdAtText}
            </span>
            {question.isOwnQuestion && (
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 ml-auto">
                自分の質問
              </span>
            )}
          </div>
          <p className="mt-3 whitespace-pre-wrap break-words text-base leading-7 text-slate-950 px-2">
            {question.content}
          </p>
        </div>
      </div>

      {!question.isOwnQuestion && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            disabled={isPending}
            onClick={() => onReaction(question.id)}
            aria-pressed={question.hasReacted}
            aria-label={question.hasReacted ? "共感を取り消す" : "共感する"}
            title={question.hasReacted ? "共感を取り消す" : "共感する"}
            className={
              question.hasReacted
                ? "inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                : "inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
            }
          >
            <Heart
              aria-hidden="true"
              className={
                question.hasReacted ? "mr-2 size-4 fill-current" : "mr-2 size-4"
              }
            />
            {question.hasReacted ? "共感を取り消す" : "共感する"}
          </button>
        </div>
    )}
    </article>
  );
}
