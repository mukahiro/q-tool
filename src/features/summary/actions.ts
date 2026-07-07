"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { FieldValue } from "firebase-admin/firestore";
import type { DocumentData } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getVerifiedTeacherFromAuthCookie } from "@/features/auth/utils/server";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import type {
  EndSectionState,
  SummaryCategory,
  SummaryDisplay,
} from "./types";
import { SUMMARY_ERROR_MESSAGES } from "./utils/errors";

type SectionQuestion = {
  id: string;
  content: string;
  reactionCount: number;
  createdAtMillis: number;
};

type GeneratedSummary = {
  content: string;
  categories: SummaryCategory[];
};

export type GetRoomSummariesResult =
  | {
      ok: true;
      summaries: SummaryDisplay[];
      message: null;
    }
  | {
      ok: false;
      summaries: [];
      message: string;
    };

const endSectionSchema = z.object({
  roomId: z.string().min(1),
});

export async function endActiveSection(
  _previousState: EndSectionState,
  formData: FormData,
): Promise<EndSectionState> {
  const parsedInput = endSectionSchema.safeParse({
    roomId: formData.get("roomId"),
  });

  if (!parsedInput.success) {
    return {
      ok: false,
      message: "ルーム情報を確認できませんでした。",
    };
  }

  const teacher = await getVerifiedTeacherFromAuthCookie();

  if (!teacher) {
    return {
      ok: false,
      message: SUMMARY_ERROR_MESSAGES.NOT_LOGGED_IN,
    };
  }

  const { roomId } = parsedInput.data;
  const db = getFirebaseAdminDb();
  const roomRef = db.collection("rooms").doc(roomId);

  try {
    const roomSnapshot = await roomRef.get();

    if (!roomSnapshot.exists) {
      return { ok: false, message: SUMMARY_ERROR_MESSAGES.ROOM_NOT_FOUND };
    }

    const roomData = roomSnapshot.data();

    if (roomData?.teacher_id !== teacher.uid) {
      return { ok: false, message: SUMMARY_ERROR_MESSAGES.NOT_AUTHORIZED };
    }

    const activeSectionId = readNullableString(roomData.active_section_id);

    if (!activeSectionId) {
      return { ok: false, message: SUMMARY_ERROR_MESSAGES.NO_ACTIVE_SECTION };
    }

    const sectionRef = roomRef.collection("sections").doc(activeSectionId);
    const sectionSnapshot = await sectionRef.get();

    if (!sectionSnapshot.exists) {
      return { ok: false, message: SUMMARY_ERROR_MESSAGES.SECTION_NOT_FOUND };
    }

    if (sectionSnapshot.data()?.is_completed) {
      return {
        ok: false,
        message: SUMMARY_ERROR_MESSAGES.SECTION_ALREADY_COMPLETED,
      };
    }

    const questions = await getSectionQuestions(roomId, activeSectionId);
    const summary = await generateSectionSummary(questions);
    const summaryRef = roomRef.collection("summaries").doc();

    await db.runTransaction(async (transaction) => {
      const [latestRoomSnapshot, latestSectionSnapshot] = await Promise.all([
        transaction.get(roomRef),
        transaction.get(sectionRef),
      ]);

      if (!latestRoomSnapshot.exists) {
        throw new SummaryActionError(SUMMARY_ERROR_MESSAGES.ROOM_NOT_FOUND);
      }

      const latestRoomData = latestRoomSnapshot.data();

      if (latestRoomData?.teacher_id !== teacher.uid) {
        throw new SummaryActionError(SUMMARY_ERROR_MESSAGES.NOT_AUTHORIZED);
      }

      if (readNullableString(latestRoomData?.active_section_id) !== activeSectionId) {
        throw new SummaryActionError(SUMMARY_ERROR_MESSAGES.NO_ACTIVE_SECTION);
      }

      if (!latestSectionSnapshot.exists) {
        throw new SummaryActionError(SUMMARY_ERROR_MESSAGES.SECTION_NOT_FOUND);
      }

      if (latestSectionSnapshot.data()?.is_completed) {
        throw new SummaryActionError(
          SUMMARY_ERROR_MESSAGES.SECTION_ALREADY_COMPLETED,
        );
      }

      transaction.set(summaryRef, {
        id: summaryRef.id,
        room_id: roomId,
        section_id: activeSectionId,
        content: summary.content,
        categories: summary.categories,
        created_at: FieldValue.serverTimestamp(),
      });

      transaction.update(sectionRef, {
        is_completed: true,
        completed_at: FieldValue.serverTimestamp(),
        summary_id: summaryRef.id,
      });

      transaction.update(roomRef, {
        active_section_id: null,
        updated_at: FieldValue.serverTimestamp(),
      });
    });

    revalidatePath(`/rooms/${roomId}`);
    revalidatePath(`/rooms/${roomId}/summaries`);

    return {
      ok: true,
      message: "セクションを終了し、AI要約を保存しました。",
      summaryId: summaryRef.id,
      sectionId: activeSectionId,
    };
  } catch (error) {
    if (error instanceof SummaryActionError) {
      return { ok: false, message: error.message };
    }

    console.error("セクション終了と要約保存に失敗しました", error);

    return {
      ok: false,
      message: SUMMARY_ERROR_MESSAGES.SUMMARY_FAILED,
    };
  }
}

export async function getRoomSummaries(
  roomId: string,
): Promise<GetRoomSummariesResult> {
  const teacher = await getVerifiedTeacherFromAuthCookie();

  if (!teacher) {
    return {
      ok: false,
      summaries: [],
      message: SUMMARY_ERROR_MESSAGES.NOT_LOGGED_IN,
    };
  }

  try {
    const db = getFirebaseAdminDb();
    const roomSnapshot = await db.collection("rooms").doc(roomId).get();

    if (!roomSnapshot.exists) {
      return {
        ok: false,
        summaries: [],
        message: SUMMARY_ERROR_MESSAGES.ROOM_NOT_FOUND,
      };
    }

    if (roomSnapshot.data()?.teacher_id !== teacher.uid) {
      return {
        ok: false,
        summaries: [],
        message: SUMMARY_ERROR_MESSAGES.NOT_AUTHORIZED,
      };
    }

    const summariesSnapshot = await roomSnapshot.ref
      .collection("summaries")
      .orderBy("created_at", "desc")
      .get();

    return {
      ok: true,
      summaries: summariesSnapshot.docs.map((summaryDoc) =>
        toSummaryDisplay(summaryDoc.id, summaryDoc.data()),
      ),
      message: null,
    };
  } catch (error) {
    console.error("要約一覧の取得に失敗しました", error);

    return {
      ok: false,
      summaries: [],
      message: SUMMARY_ERROR_MESSAGES.FETCH_FAILED,
    };
  }
}

async function getSectionQuestions(roomId: string, sectionId: string) {
  const snapshot = await getFirebaseAdminDb()
    .collection("rooms")
    .doc(roomId)
    .collection("questions")
    .where("section_id", "==", sectionId)
    .get();

  return snapshot.docs
    .map((questionDoc): SectionQuestion => {
      const data = questionDoc.data();

      return {
        id: questionDoc.id,
        content: readString(data.content, ""),
        reactionCount: readNumber(data.reaction_count),
        createdAtMillis: toMillis(data.created_at),
      };
    })
    .filter((question) => question.content.length > 0)
    .sort((a, b) => a.createdAtMillis - b.createdAtMillis);
}

async function generateSectionSummary(
  questions: SectionQuestion[],
): Promise<GeneratedSummary> {
  if (questions.length === 0) {
    return {
      content: "このセクションでは質問が投稿されませんでした。",
      categories: [],
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new SummaryActionError(SUMMARY_ERROR_MESSAGES.GEMINI_API_KEY_MISSING);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite",
    generationConfig: {
      temperature: 0.2,
    },
  });

  const result = await model.generateContent(buildSummaryPrompt(questions));
  const text = result.response.text().trim();

  return parseGeminiSummary(text);
}

function buildSummaryPrompt(questions: SectionQuestion[]) {
  const questionLines = questions
    .map(
      (question, index) =>
        `${index + 1}. ${question.content}（リアクション: ${question.reactionCount}）`,
    )
    .join("\n");

  return `あなたは授業中の質問を整理する日本語の教育アシスタントです。
次の質問一覧を読み、教師が口頭で回答しやすいように要約してください。

出力は必ず次の JSON だけにしてください。Markdown のコードブロックは使わないでください。
{
  "content": "教師向けの要約文。重要な疑問点、混乱が多い箇所、回答の優先度が伝わるように200〜400字で書く。",
  "categories": [
    { "title": "カテゴリ名", "question_count": 1 }
  ]
}

質問一覧:
${questionLines}`;
}

function parseGeminiSummary(text: string): GeneratedSummary {
  const jsonText = extractJsonObject(text);

  try {
    const parsed = JSON.parse(jsonText) as {
      content?: unknown;
      categories?: unknown;
    };
    const content = readString(parsed.content, text);
    const categories = Array.isArray(parsed.categories)
      ? parsed.categories
          .map((category) => toSummaryCategory(category))
          .filter((category): category is SummaryCategory => category !== null)
      : [];

    return { content, categories };
  } catch {
    return {
      content: text,
      categories: [],
    };
  }
}

function extractJsonObject(text: string) {
  const startIndex = text.indexOf("{");
  const endIndex = text.lastIndexOf("}");

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return text;
  }

  return text.slice(startIndex, endIndex + 1);
}

function toSummaryCategory(value: unknown): SummaryCategory | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const data = value as Record<string, unknown>;
  const title = readString(data.title, "");

  if (!title) {
    return null;
  }

  return {
    title,
    question_count: readNumber(data.question_count),
  };
}

function toSummaryDisplay(id: string, data: DocumentData): SummaryDisplay {
  return {
    id,
    sectionId: readString(data.section_id, "不明なセクション"),
    content: readString(data.content, "要約本文がありません。"),
    categories: Array.isArray(data.categories)
      ? data.categories
          .map((category) => toSummaryCategory(category))
          .filter((category): category is SummaryCategory => category !== null)
      : [],
    createdAt: toIsoString(data.created_at),
  };
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function readNullableString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function toMillis(value: unknown) {
  if (isFirestoreTimestamp(value)) {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  return 0;
}

function toIsoString(value: unknown) {
  if (isFirestoreTimestamp(value)) {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(0).toISOString();
}

function isFirestoreTimestamp(
  value: unknown,
): value is { toDate: () => Date; toMillis: () => number } {
  return (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function" &&
    "toMillis" in value &&
    typeof value.toMillis === "function"
  );
}

class SummaryActionError extends Error {}
