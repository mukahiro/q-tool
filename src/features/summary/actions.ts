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
  SummaryDisplay,
  SummaryItem,
  SummarySourceQuestion,
} from "./types";
import { SUMMARY_ERROR_MESSAGES } from "./utils/errors";

type SectionQuestion = {
  id: string;
  sourceLabel: string;
  content: string;
  reactionCount: number;
  createdAtMillis: number;
};

type GeneratedSummary = {
  content: string;
  items: SummaryItem[];
};

type SummaryItemInput = {
  title?: unknown;
  text?: unknown;
  source_question_ids?: unknown;
  interest_degree?: unknown;
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

const WHOLE_CLASS_SUMMARY_SECTION_ID = "whole_class";
const WHOLE_CLASS_SUMMARY_SECTION_NAME = "授業全体への質問";

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
    const sourceQuestions = toSourceQuestions(questions);
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
        items: summary.items,
        source_questions: sourceQuestions,
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

    revalidatePath(`/rooms/${roomId}/summaries`);

    return {
      ok: true,
      message: "セクションを終了し、AI要約を保存しました。",
      summaryId: summaryRef.id,
      sectionId: activeSectionId,
      summaryContent: summary.content,
      summaryItems: summary.items,
      sourceQuestions,
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

export async function endRoomAndSummarizeWholeClass(
  roomId: string,
): Promise<EndSectionState> {
  const parsedInput = endSectionSchema.safeParse({ roomId });

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

  const db = getFirebaseAdminDb();
  const roomRef = db.collection("rooms").doc(parsedInput.data.roomId);

  try {
    const roomSnapshot = await roomRef.get();

    if (!roomSnapshot.exists) {
      return { ok: false, message: SUMMARY_ERROR_MESSAGES.ROOM_NOT_FOUND };
    }

    const roomData = roomSnapshot.data();

    if (roomData?.teacher_id !== teacher.uid) {
      return { ok: false, message: SUMMARY_ERROR_MESSAGES.NOT_AUTHORIZED };
    }

    if (roomData?.is_active === false) {
      return {
        ok: false,
        message: "このルームはすでに終了しています。",
      };
    }

    const questions = await getWholeClassQuestions(parsedInput.data.roomId);
    const summary = await generateSectionSummary(questions, {
      emptyContent: "授業全体への質問は投稿されませんでした。",
      emptyTitle: "授業全体への質問なし",
      promptScope: "授業全体に向けて投稿された質問",
    });
    const sourceQuestions = toSourceQuestions(questions);
    const summaryRef = roomRef.collection("summaries").doc();

    await db.runTransaction(async (transaction) => {
      const latestRoomSnapshot = await transaction.get(roomRef);

      if (!latestRoomSnapshot.exists) {
        throw new SummaryActionError(SUMMARY_ERROR_MESSAGES.ROOM_NOT_FOUND);
      }

      const latestRoomData = latestRoomSnapshot.data();

      if (latestRoomData?.teacher_id !== teacher.uid) {
        throw new SummaryActionError(SUMMARY_ERROR_MESSAGES.NOT_AUTHORIZED);
      }

      if (latestRoomData?.is_active === false) {
        throw new SummaryActionError("このルームはすでに終了しています。");
      }

      transaction.set(summaryRef, {
        id: summaryRef.id,
        room_id: parsedInput.data.roomId,
        section_id: WHOLE_CLASS_SUMMARY_SECTION_ID,
        content: summary.content,
        items: summary.items,
        source_questions: sourceQuestions,
        created_at: FieldValue.serverTimestamp(),
      });

      transaction.update(roomRef, {
        is_active: false,
        active_section_id: null,
        updated_at: FieldValue.serverTimestamp(),
        closed_at: FieldValue.serverTimestamp(),
      });
    });

    revalidatePath(`/rooms/${parsedInput.data.roomId}`);
    revalidatePath(`/rooms/${parsedInput.data.roomId}/summaries`);

    return {
      ok: true,
      message: "ルームを終了し、授業全体への質問をAI要約しました。",
      summaryId: summaryRef.id,
      sectionId: WHOLE_CLASS_SUMMARY_SECTION_ID,
      summaryContent: summary.content,
      summaryItems: summary.items,
      sourceQuestions,
    };
  } catch (error) {
    if (error instanceof SummaryActionError) {
      return { ok: false, message: error.message };
    }

    console.error("ルーム終了と授業全体への質問の要約に失敗しました", error);

    return {
      ok: false,
      message: SUMMARY_ERROR_MESSAGES.ROOM_END_SUMMARY_FAILED,
    };
  }
}

export async function getRoomSummaries(
  roomId: string,
): Promise<GetRoomSummariesResult> {
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

    const [summariesSnapshot, sectionsSnapshot] = await Promise.all([
      roomSnapshot.ref.collection("summaries").orderBy("created_at", "desc").get(),
      roomSnapshot.ref.collection("sections").get(),
    ]);
    const sectionNameById = new Map(
      sectionsSnapshot.docs.map((sectionDoc) => [
        sectionDoc.id,
        readString(sectionDoc.data().name, "不明なセクション"),
      ]),
    );

    return {
      ok: true,
      summaries: summariesSnapshot.docs.map((summaryDoc) =>
        toSummaryDisplay(summaryDoc.id, summaryDoc.data(), sectionNameById),
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
      const sourceLabel = `Q${snapshot.docs.indexOf(questionDoc) + 1}`;

      return {
        id: questionDoc.id,
        sourceLabel,
        content: readString(data.content, ""),
        reactionCount: readNumber(data.reaction_count),
        createdAtMillis: toMillis(data.created_at),
      };
    })
    .filter((question) => question.content.length > 0)
    .sort((a, b) => a.createdAtMillis - b.createdAtMillis);
}

async function getWholeClassQuestions(roomId: string) {
  const snapshot = await getFirebaseAdminDb()
    .collection("rooms")
    .doc(roomId)
    .collection("questions")
    .where("target_scope", "==", "whole_class")
    .get();

  return snapshot.docs
    .map((questionDoc, index): SectionQuestion => {
      const data = questionDoc.data();

      return {
        id: questionDoc.id,
        sourceLabel: `Q${index + 1}`,
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
  options?: {
    emptyContent?: string;
    emptyTitle?: string;
    promptScope?: string;
  },
): Promise<GeneratedSummary> {
  if (questions.length === 0) {
    const content =
      options?.emptyContent ?? "このセクションでは質問が投稿されませんでした。";

    return {
      content,
      items: [
        {
          text: content,
          title: options?.emptyTitle ?? "質問なし",
          source_question_ids: [],
          interest_degree: 0,
        },
      ],
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

  const result = await model.generateContent(
    buildSummaryPrompt(questions, options?.promptScope),
  );
  const text = result.response.text().trim();

  return parseGeminiSummary(text, questions);
}

function buildSummaryPrompt(questions: SectionQuestion[], promptScope?: string) {
  const questionLines = questions
    .map(
      (question) =>
        `- ${question.sourceLabel}: question_id=${question.id}, empathy_count=${question.reactionCount}, summary_weight=${question.reactionCount + 1}, content="${question.content}"`,
    )
    .join("\n");

  return `あなたは授業中の質問を整理する日本語の教育アシスタントです。
次の${promptScope ?? "質問一覧"}を読み、教師が口頭で回答しやすいように要約してください。
empathy_count は学生からの共感数です。summary_weight は要約時の重みで、値が大きい質問ほど優先して扱ってください。

出力は必ず次の JSON だけにしてください。Markdown のコードブロックは使わないでください。
{
  "content": "教師向けの要約文。重要な疑問点、混乱が多い箇所、回答の優先度が伝わるように簡潔に書く。",
  "items": [
    {
      "title": "要約項目の短い見出し",
      "text": "要約の一項目。どの質問群から判断したか分かる粒度で簡潔に書く。",
      "source_question_ids": ["question_idをそのまま入れる"],
      "interest_degree": 1
    }
  ]
}

必ず守ること:
- items は2〜5件にまとめる。
- 各 item には title と text を必ず入れる。
- source_question_ids には、質問一覧にある question_id だけを入れる。
- interest_degree は 1〜5 の整数で入れる。5 が最も関心が高い項目を表す。
- items は interest_degree の高い順に並べる。
- summary_weight が高い質問は、content と items の優先順位・詳しさ・並び順に強く反映する。
- 共感数が多い質問と似た質問が複数ある場合は、まとめて重要な論点として扱う。
- 共感数が少ない質問でも、授業理解に重要なものは必要に応じて含める。
- 参照した質問がない推測は書かない。
- AIとしての意見や回答は書かない。
- 不適切な表現を含む質問は除外する。

質問一覧:
${questionLines}`;
}

function parseGeminiSummary(
  text: string,
  questions: SectionQuestion[],
): GeneratedSummary {
  const jsonText = extractJsonObject(text);
  const validQuestionIds = new Set(questions.map((question) => question.id));

  try {
    const parsed = JSON.parse(jsonText) as {
      content?: unknown;
      items?: unknown;
    };
    const content = readString(parsed.content, text);
    const items = Array.isArray(parsed.items)
      ? parsed.items
          .map((item) => toSummaryItem(item, validQuestionIds))
          .filter((item): item is SummaryItem => item !== null)
          .sort((firstItem, secondItem) => {
            if (firstItem.interest_degree !== secondItem.interest_degree) {
              return secondItem.interest_degree - firstItem.interest_degree;
            }

            return 0;
          })
      : [];

    return {
      content,
      items: items.length > 0 ? items : toFallbackSummaryItems(content),
    };
  } catch {
    return {
      content: text,
      items: toFallbackSummaryItems(text),
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

function toSummaryItem(
  value: unknown,
  validQuestionIds: Set<string>,
): SummaryItem | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const data = value as SummaryItemInput;
  const text = readString(data.text, "");
  const title = readString(data.title, "要約項目");

  if (!text) {
    return null;
  }

  return {
    title,
    text,
    source_question_ids: readQuestionIds(
      data.source_question_ids,
      validQuestionIds,
    ),
    interest_degree: readInterestDegree(data.interest_degree),
  };
}

function toSummaryDisplay(
  id: string,
  data: DocumentData,
  sectionNameById: Map<string, string>,
): SummaryDisplay {
  const sourceQuestions = Array.isArray(data.source_questions)
    ? data.source_questions
        .map((question) => toSourceQuestion(question))
        .filter(
          (question): question is SummarySourceQuestion => question !== null,
        )
    : [];
  const sourceQuestionIds = new Set(
    sourceQuestions.map((question) => question.id),
  );
  const content = readString(data.content, "要約本文がありません。");
  const items = Array.isArray(data.items)
    ? data.items
        .map((item) => toSummaryItem(item, sourceQuestionIds))
        .filter((item): item is SummaryItem => item !== null)
        .sort((firstItem, secondItem) => {
          if (firstItem.interest_degree !== secondItem.interest_degree) {
            return secondItem.interest_degree - firstItem.interest_degree;
          }

          return 0;
        })
    : [];
  const sectionId = readString(data.section_id, "不明なセクション");

  return {
    id,
    sectionId,
    sectionName:
      sectionId === WHOLE_CLASS_SUMMARY_SECTION_ID
        ? WHOLE_CLASS_SUMMARY_SECTION_NAME
        : (sectionNameById.get(sectionId) ?? "不明なセクション"),
    content,
    items: items.length > 0 ? items : toFallbackSummaryItems(content),
    sourceQuestions,
    createdAt: toIsoString(data.created_at),
  };
}

function toSourceQuestions(
  questions: SectionQuestion[],
): SummarySourceQuestion[] {
  return questions.map((question) => ({
    id: question.id,
    sourceLabel: question.sourceLabel,
    content: question.content,
    reactionCount: question.reactionCount,
  }));
}

function toSourceQuestion(value: unknown): SummarySourceQuestion | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const data = value as Record<string, unknown>;
  const id = readString(data.id, "");
  const content = readString(data.content, "");

  if (!id || !content) {
    return null;
  }

  return {
    id,
    sourceLabel: readString(data.sourceLabel, id),
    content,
    reactionCount: readNumber(data.reactionCount),
  };
}

function toFallbackSummaryItems(content: string): SummaryItem[] {
  return [
    {
      title: "全体要約",
      text: content,
      source_question_ids: [],
      interest_degree: 0,
    },
  ];
}

function readQuestionIds(value: unknown, validQuestionIds?: Set<string>) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => {
    if (typeof item !== "string" || item.trim().length === 0) {
      return false;
    }

    return validQuestionIds ? validQuestionIds.has(item) : true;
  });
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

function readInterestDegree(value: unknown) {
  const degree = readNumber(value);

  if (degree <= 0) {
    return 0;
  }

  return Math.min(5, Math.max(1, Math.round(degree)));
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
