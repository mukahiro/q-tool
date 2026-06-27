"use server";

import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export type TeacherRoomSummary = {
  id: string;
  name: string;
  inviteCode: string;
  isActive: boolean;
  createdAt: string;
  questionCount: number;
};

type GetTeacherRoomsResult =
  | {
      status: "success";
      rooms: TeacherRoomSummary[];
    }
  | {
      status: "forbidden" | "error";
      message: string;
      rooms: [];
    };

const authCookieNames = ["firebaseIdToken", "__session", "idToken"];

export async function getTeacherRooms(): Promise<GetTeacherRoomsResult> {
  const cookieStore = await cookies();
  const idToken =
    authCookieNames
      .map((cookieName) => cookieStore.get(cookieName)?.value)
      .find(Boolean) ?? null;

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

  let teacherUid: string;

  try {
    const decodedToken = await getFirebaseAdminAuth().verifyIdToken(idToken);
    teacherUid = decodedToken.uid;
  } catch (error) {
    console.error("教師ログイン情報の確認に失敗しました", error);

    return {
      status: "forbidden",
      message: "ログインが必要です。教師アカウントでログインしてください。",
      rooms: [],
    };
  }

  try {
    const roomsSnapshot = await getFirebaseAdminDb()
      .collection("rooms")
      .where("teacher_id", "==", teacherUid)
      .orderBy("created_at", "desc")
      .get();

    const rooms = roomsSnapshot.docs.map((roomDoc) =>
      toTeacherRoomSummary(roomDoc.id, roomDoc.data()),
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

function getIdTokenFromRequest(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const bearerPrefix = "Bearer ";

  if (authorization?.startsWith(bearerPrefix)) {
    return authorization.slice(bearerPrefix.length);
  }

  return (
    authCookieNames
      .map((cookieName) => request.cookies.get(cookieName)?.value)
      .find(Boolean) ?? null
  );
}

function toTeacherRoomSummary(
  id: string,
  data: FirebaseFirestore.DocumentData,
): TeacherRoomSummary {
  return {
    id,
    name: readString(data.name, "名称未設定"),
    inviteCode: readString(data.invite_code ?? data.inviteCode, "未設定"),
    isActive: Boolean(data.is_active ?? data.isActive),
    createdAt: toISOString(data.created_at ?? data.createdAt),
    questionCount: readNumber(
      data.question_count ?? data.questionCount ?? data.questions_count,
    ),
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

function toISOString(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? new Date(0).toISOString()
      : date.toISOString();
  }

  if (isFirestoreTimestamp(value)) {
    return value.toDate().toISOString();
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
