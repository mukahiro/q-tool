"use server";

import { getAuthToken } from "@/features/auth/actions";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase/admin";
import type { DecodedIdToken } from "firebase-admin/auth";
import type { DocumentData } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";

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

export async function getTeacherRooms(): Promise<GetTeacherRoomsResult> {
  const idToken = await getAuthToken();

  return getTeacherRoomsByIdToken(idToken);
}

export async function getTeacherRoomsForRequest(
  request: NextRequest,
): Promise<GetTeacherRoomsResult> {
  const idToken = getIdTokenFromRequest(request);

  return getTeacherRoomsByIdToken(idToken);
}

async function getTeacherRoomsByIdToken(
  idToken: string | null,
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
    const roomsSnapshot = await getFirebaseAdminDb()
      .collection("rooms")
      .where("teacher_id", "==", decodedToken.uid)
      .orderBy("created_at", "desc")
      .get();

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

function getIdTokenFromRequest(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const bearerPrefix = "Bearer ";

  if (authorization?.startsWith(bearerPrefix)) {
    return authorization.slice(bearerPrefix.length);
  }

  return request.cookies.get("q_tool_firebase_id_token")?.value ?? null;
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
