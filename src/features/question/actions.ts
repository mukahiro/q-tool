"use server";

import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import type { QuestionActionResult, StudentChatRoom } from "./types";
import { QUESTION_ERROR_MESSAGES } from "./utils/errors";

type StudentRoomResult =
  | {
      ok: true;
      room: StudentChatRoom;
      message: null;
    }
  | {
      ok: false;
      room: null;
      message: string;
    };

const postQuestionSchema = z.object({
  roomId: z.string().min(1),
  studentSessionId: z.string().min(1, QUESTION_ERROR_MESSAGES.SESSION_REQUIRED),
  content: z
    .string()
    .trim()
    .min(1, "質問内容を入力してください。")
    .max(500, "質問は500文字以内で入力してください。"),
});

const reactionSchema = z.object({
  roomId: z.string().min(1),
  questionId: z.string().min(1),
  studentSessionId: z.string().min(1, QUESTION_ERROR_MESSAGES.SESSION_REQUIRED),
});

export async function getStudentChatRoom(
  roomId: string,
): Promise<StudentRoomResult> {
  try {
    const roomSnapshot = await getFirebaseAdminDb()
      .collection("rooms")
      .doc(roomId)
      .get();

    if (!roomSnapshot.exists) {
      return {
        ok: false,
        room: null,
        message: QUESTION_ERROR_MESSAGES.ROOM_NOT_FOUND,
      };
    }

    const data = roomSnapshot.data();

    return {
      ok: true,
      room: {
        id: roomSnapshot.id,
        name: readString(data?.name, "名称未設定のルーム"),
        isActive: Boolean(data?.is_active),
        activeSectionId: readNullableString(data?.active_section_id),
      },
      message: null,
    };
  } catch (error) {
    console.error("学生向けルーム情報の取得に失敗しました", error);

    return {
      ok: false,
      room: null,
      message: QUESTION_ERROR_MESSAGES.FETCH_FAILED,
    };
  }
}

export async function postQuestion(
  input: z.input<typeof postQuestionSchema>,
): Promise<QuestionActionResult> {
  const parsedInput = postQuestionSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      ok: false,
      message:
        parsedInput.error.issues[0]?.message ?? "入力内容を確認してください。",
    };
  }

  const { roomId, studentSessionId, content } = parsedInput.data;
  const db = getFirebaseAdminDb();
  const roomRef = db.collection("rooms").doc(roomId);
  const questionRef = roomRef.collection("questions").doc();

  try {
    await db.runTransaction(async (transaction) => {
      const roomSnapshot = await transaction.get(roomRef);

      if (!roomSnapshot.exists) {
        throw new QuestionActionError(QUESTION_ERROR_MESSAGES.ROOM_NOT_FOUND);
      }

      const roomData = roomSnapshot.data();

      if (!roomData?.is_active) {
        throw new QuestionActionError(QUESTION_ERROR_MESSAGES.ROOM_CLOSED);
      }

      const activeSectionId = readNullableString(roomData.active_section_id);

      if (!activeSectionId) {
        throw new QuestionActionError(QUESTION_ERROR_MESSAGES.SECTION_NOT_READY);
      }

      const sectionRef = roomRef.collection("sections").doc(activeSectionId);
      const sectionSnapshot = await transaction.get(sectionRef);

      if (!sectionSnapshot.exists || sectionSnapshot.data()?.is_completed) {
        throw new QuestionActionError(QUESTION_ERROR_MESSAGES.SECTION_NOT_READY);
      }

      transaction.set(questionRef, {
        id: questionRef.id,
        room_id: roomId,
        section_id: activeSectionId,
        content,
        student_session_id: studentSessionId,
        reaction_count: 0,
        created_at: FieldValue.serverTimestamp(),
      });
      transaction.update(roomRef, {
        question_count: FieldValue.increment(1),
        updated_at: FieldValue.serverTimestamp(),
      });
      transaction.update(sectionRef, {
        question_count: FieldValue.increment(1),
      });
    });

    return {
      ok: true,
      message: "質問を投稿しました。",
    };
  } catch (error) {
    if (error instanceof QuestionActionError) {
      return {
        ok: false,
        message: error.message,
      };
    }

    console.error("質問投稿に失敗しました", error);

    return {
      ok: false,
      message: QUESTION_ERROR_MESSAGES.POST_FAILED,
    };
  }
}

export async function toggleQuestionReaction(
  input: z.input<typeof reactionSchema>,
): Promise<QuestionActionResult> {
  const parsedInput = reactionSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      ok: false,
      message:
        parsedInput.error.issues[0]?.message ?? "入力内容を確認してください。",
    };
  }

  const { roomId, questionId, studentSessionId } = parsedInput.data;
  const db = getFirebaseAdminDb();
  const roomRef = db.collection("rooms").doc(roomId);
  const questionRef = roomRef.collection("questions").doc(questionId);
  const reactionRef = questionRef.collection("reactions").doc(studentSessionId);

  try {
    await db.runTransaction(async (transaction) => {
      const [roomSnapshot, questionSnapshot, reactionSnapshot] =
        await Promise.all([
          transaction.get(roomRef),
          transaction.get(questionRef),
          transaction.get(reactionRef),
        ]);

      if (!roomSnapshot.exists) {
        throw new QuestionActionError(QUESTION_ERROR_MESSAGES.ROOM_NOT_FOUND);
      }

      if (!roomSnapshot.data()?.is_active) {
        throw new QuestionActionError(QUESTION_ERROR_MESSAGES.ROOM_CLOSED);
      }

      if (!questionSnapshot.exists) {
        throw new QuestionActionError(
          QUESTION_ERROR_MESSAGES.QUESTION_NOT_FOUND,
        );
      }

      const questionData = questionSnapshot.data();

      if (questionData?.student_session_id === studentSessionId) {
        throw new QuestionActionError(
          QUESTION_ERROR_MESSAGES.OWN_REACTION_NOT_ALLOWED,
        );
      }

      const sectionId = readNullableString(questionData?.section_id);

      if (!sectionId) {
        throw new QuestionActionError(
          QUESTION_ERROR_MESSAGES.QUESTION_NOT_FOUND,
        );
      }

      const sectionRef = roomRef.collection("sections").doc(sectionId);

      if (reactionSnapshot.exists) {
        transaction.delete(reactionRef);
        transaction.update(questionRef, {
          reaction_count: FieldValue.increment(-1),
        });
        transaction.update(sectionRef, {
          reaction_count: FieldValue.increment(-1),
        });
        return;
      }

      transaction.set(reactionRef, {
        student_session_id: studentSessionId,
        created_at: FieldValue.serverTimestamp(),
      });
      transaction.update(questionRef, {
        reaction_count: FieldValue.increment(1),
      });
      transaction.update(sectionRef, {
        reaction_count: FieldValue.increment(1),
      });
    });

    return {
      ok: true,
      message: "リアクションを更新しました。",
    };
  } catch (error) {
    if (error instanceof QuestionActionError) {
      return {
        ok: false,
        message: error.message,
      };
    }

    console.error("リアクション更新に失敗しました", error);

    return {
      ok: false,
      message: QUESTION_ERROR_MESSAGES.REACTION_FAILED,
    };
  }
}

class QuestionActionError extends Error {}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : fallback;
}

function readNullableString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}
