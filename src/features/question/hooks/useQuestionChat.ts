"use client";

import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { getFirebaseFirestore } from "@/lib/firebase/firestore";
import type {
  QuestionDocument,
  QuestionListItem,
  QuestionSectionGroup,
  SectionDocument,
  StudentChatRoom,
} from "../types";
import { QUESTION_ERROR_MESSAGES } from "../utils/errors";
import { formatQuestionCreatedAt } from "../utils/format";
import { getOrCreateStudentSessionId } from "../utils/session";

const WHOLE_CLASS_GROUP_ID = "whole_class";
const WHOLE_CLASS_LABEL = "授業全体";

export function useQuestionChat(initialRoom: StudentChatRoom) {
  const [room, setRoom] = useState(initialRoom);
  const [studentSessionId, setStudentSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionDocument[]>([]);
  const [sections, setSections] = useState<SectionDocument[]>([]);
  const [reactedQuestionIds, setReactedQuestionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setStudentSessionId(getOrCreateStudentSessionId());
      } catch (error) {
        console.error("学生セッションIDの作成に失敗しました", error);
        setErrorMessage(QUESTION_ERROR_MESSAGES.SESSION_REQUIRED);
      }
    });
  }, []);

  useEffect(() => {
    const db = getFirebaseFirestore();
    const roomRef = doc(db, "rooms", initialRoom.id);

    return onSnapshot(
      roomRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setErrorMessage(QUESTION_ERROR_MESSAGES.ROOM_NOT_FOUND);
          return;
        }

        const data = snapshot.data();
        setRoom({
          id: snapshot.id,
          name:
            typeof data.name === "string" && data.name.trim().length > 0
              ? data.name
              : initialRoom.name,
          isActive: Boolean(data.is_active),
          activeSectionId:
            typeof data.active_section_id === "string" &&
            data.active_section_id.trim().length > 0
              ? data.active_section_id
              : null,
        });
      },
      (error) => {
        console.error("ルーム情報のリアルタイム取得に失敗しました", error);
        setErrorMessage(QUESTION_ERROR_MESSAGES.FETCH_FAILED);
      },
    );
  }, [initialRoom]);

  useEffect(() => {
    const db = getFirebaseFirestore();
    const sectionsQuery = query(
      collection(db, "rooms", initialRoom.id, "sections"),
      orderBy("order", "asc"),
    );

    return onSnapshot(
      sectionsQuery,
      (snapshot) => {
        setSections(snapshot.docs.map(toSectionDocument));
      },
      (error) => {
        console.error("セクション一覧のリアルタイム取得に失敗しました", error);
        setErrorMessage(QUESTION_ERROR_MESSAGES.FETCH_FAILED);
      },
    );
  }, [initialRoom.id]);

  useEffect(() => {
    const db = getFirebaseFirestore();
    const questionsQuery = query(
      collection(db, "rooms", initialRoom.id, "questions"),
      orderBy("created_at", "desc"),
    );

    return onSnapshot(
      questionsQuery,
      (snapshot) => {
        setQuestions(snapshot.docs.map(toQuestionDocument));
        setIsLoadingQuestions(false);
      },
      (error) => {
        console.error("質問一覧のリアルタイム取得に失敗しました", error);
        setErrorMessage(QUESTION_ERROR_MESSAGES.FETCH_FAILED);
        setIsLoadingQuestions(false);
      },
    );
  }, [initialRoom.id]);

  useEffect(() => {
    if (!studentSessionId || questions.length === 0) {
      return;
    }

    const db = getFirebaseFirestore();
    const unsubscribes = questions.map((question) =>
      onSnapshot(
        doc(
          db,
          "rooms",
          initialRoom.id,
          "questions",
          question.id,
          "reactions",
          studentSessionId,
        ),
        (snapshot) => {
          setReactedQuestionIds((current) => {
            const next = new Set(current);

            if (snapshot.exists()) {
              next.add(question.id);
            } else {
              next.delete(question.id);
            }

            return next;
          });
        },
      ),
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [initialRoom.id, questions, studentSessionId]);

  const questionGroups: QuestionSectionGroup[] = useMemo(() => {
    if (!studentSessionId) {
      return [];
    }

    const sectionById = new Map(
      sections.map((section) => [section.id, section]),
    );
    const groupsBySectionId = new Map<string, QuestionListItem[]>();

    for (const question of questions) {
      const groupId = question.section_id ?? WHOLE_CLASS_GROUP_ID;
      const section = question.section_id
        ? sectionById.get(question.section_id)
        : null;
      const sectionName = question.section_id
        ? (section?.name ?? `セクションID: ${question.section_id}`)
        : WHOLE_CLASS_LABEL;
      const questionItem: QuestionListItem = {
        id: question.id,
        sectionId: question.section_id,
        sectionName,
        targetLabel: question.section_id
          ? `対象セクション: ${sectionName}`
          : `質問先: ${WHOLE_CLASS_LABEL}`,
        content: question.content,
        studentSessionId: question.student_session_id,
        reactionCount: question.reaction_count,
        createdAtText: formatQuestionCreatedAt(question.created_at),
        isOwnQuestion: question.student_session_id === studentSessionId,
        hasReacted: reactedQuestionIds.has(question.id),
      };

      groupsBySectionId.set(groupId, [
        ...(groupsBySectionId.get(groupId) ?? []),
        questionItem,
      ]);
    }

    return Array.from(groupsBySectionId.entries())
      .map(([groupId, sectionQuestions]) => {
        const isWholeClassGroup = groupId === WHOLE_CLASS_GROUP_ID;
        const section = isWholeClassGroup ? null : sectionById.get(groupId);
        const sectionId = isWholeClassGroup ? null : groupId;
        const isActiveSection = room.activeSectionId === sectionId;

        return {
          sectionId: groupId,
          sectionName: isWholeClassGroup
            ? `${WHOLE_CLASS_LABEL}への質問`
            : (section?.name ?? `セクションID: ${groupId}`),
          isWholeClass: isWholeClassGroup,
          isActiveSection,
          isPastSection: !isActiveSection && !isWholeClassGroup,
          questions: sectionQuestions,
        };
      })
      .sort((firstGroup, secondGroup) => {
        if (firstGroup.isActiveSection) return -1;
        if (secondGroup.isActiveSection) return 1;
        if (firstGroup.sectionId === WHOLE_CLASS_GROUP_ID) return -1;
        if (secondGroup.sectionId === WHOLE_CLASS_GROUP_ID) return 1;

        const firstOrder = sectionById.get(firstGroup.sectionId)?.order ?? 0;
        const secondOrder = sectionById.get(secondGroup.sectionId)?.order ?? 0;

        return secondOrder - firstOrder;
      });
  }, [
    questions,
    reactedQuestionIds,
    room.activeSectionId,
    sections,
    studentSessionId,
  ]);

  const activeSectionName = useMemo(() => {
    if (!room.activeSectionId) {
      return null;
    }

    return (
      sections.find((section) => section.id === room.activeSectionId)?.name ??
      "セクション名を読み込み中"
    );
  }, [room.activeSectionId, sections]);

  return {
    room,
    studentSessionId,
    activeSectionName,
    questionGroups,
    errorMessage,
    isLoadingQuestions,
    setErrorMessage,
  };
}

function toSectionDocument(snapshot: QueryDocumentSnapshot): SectionDocument {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    name: readString(data.name, `セクションID: ${snapshot.id}`),
    order: readNumber(data.order),
    is_completed: Boolean(data.is_completed),
  };
}

function toQuestionDocument(
  snapshot: QueryDocumentSnapshot,
): QuestionDocument {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    room_id: readString(data.room_id, ""),
    section_id: readNullableString(data.section_id),
    content: readString(data.content, ""),
    student_session_id: readString(data.student_session_id, ""),
    reaction_count: readNumber(data.reaction_count),
    created_at: data.created_at,
  };
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function readNullableString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
