"use server";

import type { DecodedIdToken } from "firebase-admin/auth";
import type { DocumentData } from "firebase-admin/firestore";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuthToken } from "@/features/auth/actions";
import { getVerifiedTeacherFromAuthCookie } from "@/features/auth/utils/server";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase/admin";
import type {
  CreateRoomState,
  CreateSectionState,
  EndRoomState,
} from "./state";
import type {
  InviteCodeDocument,
  RoomDisplay,
  RoomDocument,
  RoomSectionDisplay,
  SectionDocument,
} from "./types";
import { ROOM_ERROR_MESSAGES } from "./utils/errors";
import { fetchRoom, timestampToDate } from "./utils/firebase";
import {
  createRoomDocuments,
  type CreateRoomDocumentsResult,
  updateRoomStatus,
} from "./utils/firestoreRest";
import { generateInviteCode } from "./utils/inviteCode";

export type TeacherRoomSummary = {
  id: string;
  name: string;
  inviteCode: string;
  isActive: boolean;
  questionCount: number;
  sectionCount: number;
  createdAt: string;
};

export type GetTeacherRoomsResult =
  | {
      status: "success";
      rooms: TeacherRoomSummary[];
    }
  | {
      status: "forbidden" | "error";
      message: string;
      rooms: [];
    };

const createRoomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "ルーム名を入力してください。")
    .max(80, "ルーム名は80文字以内で入力してください。"),
});

const createSectionSchema = z.object({
  name: z
    .string()
    .trim()
    .max(80, "セクション名は80文字以内で入力してください。"),
});

export async function getTeacherRooms(options?: {
  limit?: number;
}): Promise<GetTeacherRoomsResult> {
  const idToken = await getAuthToken();

  return getTeacherRoomsByIdToken(idToken, options);
}

async function getTeacherRoomsByIdToken(
  idToken: string | null,
  options?: {
    limit?: number;
  },
): Promise<GetTeacherRoomsResult> {
  if (!idToken) {
    return {
      status: "forbidden",
      message: "ログインが必要です。教師アカウントでログインしてください。",
      rooms: [],
    };
  }

  let decodedToken: DecodedIdToken;

  try {
    decodedToken = await getFirebaseAdminAuth().verifyIdToken(idToken);
  } catch (error) {
    console.error("教師ログイン情報の検証に失敗しました", error);

    return {
      status: "forbidden",
      message: "ログインが必要です。教師アカウントでログインしてください。",
      rooms: [],
    };
  }

  try {
    let roomsQuery = getFirebaseAdminDb()
      .collection("rooms")
      .where("teacher_id", "==", decodedToken.uid)
      .orderBy("created_at", "desc");

    if (typeof options?.limit === "number" && options.limit > 0) {
      roomsQuery = roomsQuery.limit(Math.floor(options.limit));
    }

    const roomsSnapshot = await roomsQuery.get();
    const rooms = await Promise.all(
      roomsSnapshot.docs.map(async (roomDoc) => {
        const roomData = roomDoc.data();
        const sectionCount = await getRoomSectionCount(roomDoc.id);

        return toTeacherRoomSummary(roomDoc.id, roomData, sectionCount);
      }),
    );

    return {
      status: "success",
      rooms,
    };
  } catch (error) {
    console.error("ルーム一覧の取得に失敗しました", error);

    return {
      status: "error",
      message:
        "ルーム一覧を読み込めませんでした。時間をおいてもう一度お試しください。",
      rooms: [],
    };
  }
}

export async function createRoom(
  _previousState: CreateRoomState,
  formData: FormData,
): Promise<CreateRoomState> {
  const teacher = await getVerifiedTeacherFromAuthCookie();

  if (!teacher) {
    return {
      ok: false,
      message: "ログイン状態を確認できません。再度ログインしてください。",
    };
  }

  const nameValue = formData.get("name");
  const parsedFields = createRoomSchema.safeParse({
    name: typeof nameValue === "string" ? nameValue : "",
  });

  if (!parsedFields.success) {
    return {
      ok: false,
      message:
        parsedFields.error.issues[0]?.message ??
        "入力内容を確認してください。",
    };
  }

  let result: CreateRoomState;

  try {
    result = await createRoomWithUniqueInviteCode({
      idToken: teacher.idToken,
      teacherId: teacher.uid,
      roomName: parsedFields.data.name,
    });
  } catch (error) {
    console.error("Room creation failed:", error);

    return {
      ok: false,
      message:
        "ルームの作成に失敗しました。時間をおいてもう一度お試しください。",
    };
  }

  if (result.ok && result.roomId) {
    redirect(`/rooms/${result.roomId}`);
  }

  return result;
}

async function createRoomWithUniqueInviteCode({
  idToken,
  teacherId,
  roomName,
}: {
  idToken: string;
  teacherId: string;
  roomName: string;
}): Promise<CreateRoomState> {
  const maxAttempts = 8;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const roomId = crypto.randomUUID();
    const inviteCode = generateInviteCode();
    const now = new Date();
    const room: RoomDocument = {
      id: roomId,
      teacher_id: teacherId,
      name: roomName,
      invite_code: inviteCode,
      active_section_id: null,
      is_active: true,
      question_count: 0,
      created_at: now,
      updated_at: now,
      closed_at: null,
    };
    const inviteCodeDocument: InviteCodeDocument = {
      invite_code: inviteCode,
      room_id: roomId,
      created_at: now,
    };

    const result: CreateRoomDocumentsResult = await createRoomDocuments({
      idToken,
      room,
      inviteCode: inviteCodeDocument,
    });

    if (result === "created") {
      return {
        ok: true,
        message: "ルームを作成しました。",
        roomId,
        inviteCode,
      };
    }
  }

  return {
    ok: false,
    message:
      "招待コードの発行に失敗しました。時間をおいてもう一度お試しください。",
  };
}

/**
 * ルーム詳細情報を取得するサーバーアクション
 * - 認証チェック
 * - ルーム取得
 * - クライアント用に加工
 */
export async function getRoomDetail(
  roomId: string,
): Promise<{ data: RoomDisplay | null; error: string | null }> {
  try {
    const authToken = await getAuthToken();
    if (!authToken) {
      return {
        data: null,
        error: ROOM_ERROR_MESSAGES.NOT_LOGGED_IN,
      };
    }

    const decodedToken = await getFirebaseAdminAuth().verifyIdToken(authToken);

    const { data: room, error: roomFetchError } = await fetchRoom(roomId);

    if (roomFetchError || !room) {
      return {
        data: null,
        error: roomFetchError || ROOM_ERROR_MESSAGES.FETCH_FAILED,
      };
    }

    if (room.teacher_id !== decodedToken.uid) {
      return {
        data: null,
        error: ROOM_ERROR_MESSAGES.NOT_AUTHORIZED,
      };
    }

    const [creatorName, sections] = await Promise.all([
      getTeacherUsername(room.teacher_id),
      getRoomSections(roomId),
    ]);
    const activeSectionName =
      sections.find((section) => section.id === room.active_section_id)?.name ??
      null;

    const roomDisplay: RoomDisplay = {
      id: room.id,
      name: room.name,
      creator_name: creatorName,
      invite_code: room.invite_code,
      is_active: room.is_active,
      question_count: room.question_count,
      active_section_id: room.active_section_id,
      active_section_name: activeSectionName,
      sections,
      created_at: timestampToDate(room.created_at) || new Date(),
      updated_at: timestampToDate(room.updated_at) || new Date(),
      closed_at: timestampToDate(room.closed_at),
    };

    return { data: roomDisplay, error: null };
  } catch (error) {
    console.error("getRoomDetail error:", error);
    return {
      data: null,
      error: ROOM_ERROR_MESSAGES.FETCH_FAILED,
    };
  }
}

export async function createSection(
  roomId: string,
  _previousState: CreateSectionState,
  formData: FormData,
): Promise<CreateSectionState> {
  const teacher = await getVerifiedTeacherFromAuthCookie();

  if (!teacher) {
    return {
      ok: false,
      message: ROOM_ERROR_MESSAGES.NOT_LOGGED_IN,
    };
  }

  const nameValue = formData.get("name");
  const parsedFields = createSectionSchema.safeParse({
    name: typeof nameValue === "string" ? nameValue : "",
  });

  if (!parsedFields.success) {
    return {
      ok: false,
      message:
        parsedFields.error.issues[0]?.message ??
        "入力内容を確認してください。",
    };
  }

  try {
    const db = getFirebaseAdminDb();
    const roomRef = db.collection("rooms").doc(roomId);
    const roomSnap = await roomRef.get();

    if (!roomSnap.exists) {
      return {
        ok: false,
        message: ROOM_ERROR_MESSAGES.NOT_FOUND,
      };
    }

    const roomData = roomSnap.data();

    if (roomData?.teacher_id !== teacher.uid) {
      return {
        ok: false,
        message: ROOM_ERROR_MESSAGES.NOT_AUTHORIZED,
      };
    }

    if (roomData?.is_active === false) {
      return {
        ok: false,
        message: "終了済みのルームにはセクションを作成できません。",
      };
    }

    if (roomData?.active_section_id) {
      return {
        ok: false,
        message:
          "進行中のセクションがあります。先にセクション終了を押してください。",
      };
    }

    const sectionsSnapshot = await roomRef.collection("sections").get();
    const sectionOrder = sectionsSnapshot.size + 1;
    const sectionName = parsedFields.data.name || `セクション${sectionOrder}`;
    const sectionId = crypto.randomUUID();
    const now = new Date();

    const sectionDocument: SectionDocument = {
      id: sectionId,
      room_id: roomId,
      name: sectionName,
      order: sectionOrder,
      is_completed: false,
      question_count: 0,
      reaction_count: 0,
      summary_id: null,
      created_at: now,
      completed_at: null,
    };

    await roomRef.collection("sections").doc(sectionId).set(sectionDocument);

    await roomRef.update({
      active_section_id: sectionId,
      updated_at: now,
    });

    return {
      ok: true,
      message: "セクションを作成しました。",
      sectionId,
      sectionName,
      sectionOrder,
    };
  } catch (error) {
    console.error("createSection error:", error);

    return {
      ok: false,
      message: ROOM_ERROR_MESSAGES.SECTION_CREATE_FAILED,
    };
  }
}

export async function endSection(roomId: string): Promise<{
  ok: boolean;
  message: string;
  sectionId?: string;
  sectionName?: string;
}> {
  try {
    const teacher = await getVerifiedTeacherFromAuthCookie();

    if (!teacher) {
      return {
        ok: false,
        message: ROOM_ERROR_MESSAGES.NOT_LOGGED_IN,
      };
    }

    const db = getFirebaseAdminDb();
    const roomRef = db.collection("rooms").doc(roomId);
    const roomSnap = await roomRef.get();

    if (!roomSnap.exists) {
      return {
        ok: false,
        message: ROOM_ERROR_MESSAGES.NOT_FOUND,
      };
    }

    const roomData = roomSnap.data();

    if (roomData?.teacher_id !== teacher.uid) {
      return {
        ok: false,
        message: ROOM_ERROR_MESSAGES.NOT_AUTHORIZED,
      };
    }

    const activeSectionId = roomData?.active_section_id;

    if (!activeSectionId) {
      return {
        ok: false,
        message: "終了するセクションがありません。",
      };
    }

    const sectionRef = roomRef.collection("sections").doc(activeSectionId);
    const sectionSnap = await sectionRef.get();

    if (!sectionSnap.exists) {
      return {
        ok: false,
        message: ROOM_ERROR_MESSAGES.NOT_FOUND,
      };
    }

    const now = new Date();
    const sectionData = sectionSnap.data();
    const sectionName =
      typeof sectionData?.name === "string" && sectionData.name.trim().length > 0
        ? sectionData.name
        : "セクション";

    await sectionRef.update({
      is_completed: true,
      completed_at: now,
    });

    await roomRef.update({
      active_section_id: null,
      updated_at: now,
    });

    return {
      ok: true,
      message: "セクションを終了しました。要約と回答の時間に進めます。",
      sectionId: activeSectionId,
      sectionName,
    };
  } catch (error) {
    console.error("endSection error:", error);

    return {
      ok: false,
      message: ROOM_ERROR_MESSAGES.SECTION_END_FAILED,
    };
  }
}

export async function endRoom(roomId: string): Promise<EndRoomState> {
  try {
    const teacher = await getVerifiedTeacherFromAuthCookie();

    if (!teacher) {
      return {
        ok: false,
        message: ROOM_ERROR_MESSAGES.NOT_LOGGED_IN,
      };
    }

    const { data: room, error: roomFetchError } = await fetchRoom(roomId);

    if (roomFetchError || !room) {
      return {
        ok: false,
        message: roomFetchError || ROOM_ERROR_MESSAGES.NOT_FOUND,
      };
    }

    if (room.teacher_id !== teacher.uid) {
      return {
        ok: false,
        message: ROOM_ERROR_MESSAGES.NOT_AUTHORIZED,
      };
    }

    const updatedAt = new Date();
    const updated = await updateRoomStatus({
      idToken: teacher.idToken,
      roomId,
      isActive: false,
      updatedAt,
      closedAt: updatedAt,
    });

    if (!updated) {
      return {
        ok: false,
        message: ROOM_ERROR_MESSAGES.END_FAILED,
      };
    }

    return {
      ok: true,
      message: "ルームを終了しました。",
    };
  } catch (error) {
    console.error("endRoom error:", error);

    return {
      ok: false,
      message: ROOM_ERROR_MESSAGES.END_FAILED,
    };
  }
}

function toTeacherRoomSummary(
  id: string,
  data: DocumentData,
  sectionCount: number,
): TeacherRoomSummary {
  return {
    id,
    name: readString(data.name, "名称未設定のルーム"),
    inviteCode: readString(data.invite_code, "未設定"),
    isActive: Boolean(data.is_active),
    questionCount: readNumber(data.question_count),
    sectionCount,
    createdAt: toIsoString(data.created_at),
  };
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : fallback;
}

async function getTeacherUsername(teacherId: string) {
  let teacherSnapshot;

  try {
    teacherSnapshot = await getFirebaseAdminDb()
      .collection("teachers")
      .doc(teacherId)
      .get();
  } catch (error) {
    console.error("作成ユーザー名の取得に失敗しました", error);
    return null;
  }

  if (!teacherSnapshot.exists) {
    return null;
  }

  const username = teacherSnapshot.data()?.username;
  return typeof username === "string" && username.trim().length > 0
    ? username.trim()
    : null;
}

async function getRoomSections(roomId: string): Promise<RoomSectionDisplay[]> {
  const sectionsSnapshot = await getFirebaseAdminDb()
    .collection("rooms")
    .doc(roomId)
    .collection("sections")
    .orderBy("order", "asc")
    .get();

  return sectionsSnapshot.docs.map((sectionDoc) =>
    toRoomSectionDisplay(sectionDoc.id, sectionDoc.data()),
  );
}

async function getRoomSectionCount(roomId: string): Promise<number> {
  const sectionsSnapshot = await getFirebaseAdminDb()
    .collection("rooms")
    .doc(roomId)
    .collection("sections")
    .get();

  return sectionsSnapshot.size;
}

function toRoomSectionDisplay(
  id: string,
  data: DocumentData,
): RoomSectionDisplay {
  return {
    id,
    name: readString(data.name, "名称未設定のセクション"),
    order: readNumber(data.order),
    is_completed: Boolean(data.is_completed),
    question_count: readNumber(data.question_count),
    reaction_count: readNumber(data.reaction_count),
    summary_id: readNullableString(data.summary_id),
    created_at: toDateValue(data.created_at) ?? new Date(0),
    completed_at: toDateValue(data.completed_at),
  };
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readNullableString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function toDateValue(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  return null;
}

function toIsoString(value: unknown) {
  if (isFirestoreTimestamp(value)) {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? new Date(0).toISOString()
      : date.toISOString();
  }

  return new Date(0).toISOString();
}

function isFirestoreTimestamp(
  value: unknown,
): value is { toDate: () => Date } {
  return (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  );
}
