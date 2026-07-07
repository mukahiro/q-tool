"use server";

import type { DecodedIdToken } from "firebase-admin/auth";
import type { DocumentData } from "firebase-admin/firestore";
import { z } from "zod";
import { getAuthToken } from "@/features/auth/actions";
import { getVerifiedTeacherFromAuthCookie } from "@/features/auth/utils/server";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase/admin";
import type { CreateRoomState, EndRoomState } from "./state";
import type { InviteCodeDocument, RoomDisplay, RoomDocument } from "./types";
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

    return {
      status: "success",
      rooms: roomsSnapshot.docs.map((roomDoc) =>
        toTeacherRoomSummary(roomDoc.id, roomDoc.data()),
      ),
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

  try {
    return await createRoomWithUniqueInviteCode({
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

    const { data: room, error: roomFetchError } = await fetchRoom(roomId);

    if (roomFetchError || !room) {
      return {
        data: null,
        error: roomFetchError || ROOM_ERROR_MESSAGES.FETCH_FAILED,
      };
    }

    const roomDisplay: RoomDisplay = {
      id: room.id,
      name: room.name,
      invite_code: room.invite_code,
      is_active: room.is_active,
      question_count: room.question_count,
      active_section_id: room.active_section_id,
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
): TeacherRoomSummary {
  return {
    id,
    name: readString(data.name, "名称未設定のルーム"),
    inviteCode: readString(data.invite_code, "未設定"),
    isActive: Boolean(data.is_active),
    questionCount: readNumber(data.question_count),
    createdAt: toIsoString(data.created_at),
  };
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : fallback;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
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
