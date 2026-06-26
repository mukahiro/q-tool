"use server";

import { z } from "zod";
import { getVerifiedTeacherFromAuthCookie } from "@/features/auth/utils/server";
import type { CreateRoomState } from "./state";
import { generateInviteCode } from "./utils/inviteCode";

const createRoomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "ルーム名を入力してください。")
    .max(80, "ルーム名は80文字以内で入力してください。"),
});

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { booleanValue: boolean }
  | { timestampValue: string }
  | { nullValue: null };

type FirestoreDocument = {
  fields: Record<string, FirestoreValue>;
};

type FirestoreCommitResponse = {
  writeResults?: unknown[];
};

export async function createRoom(
  _prevState: CreateRoomState,
  formData: FormData,
): Promise<CreateRoomState> {
  const teacher = await getVerifiedTeacherFromAuthCookie();

  if (!teacher) {
    return {
      ok: false,
      message: "ログイン状態を確認できません。再度ログインしてください。",
    };
  }

  const parsedFields = createRoomSchema.safeParse({
    name: formData.get("name"),
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
    const result = await commitCreateRoom({
      idToken,
      roomId,
      teacherId,
      roomName,
      inviteCode,
      now,
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

async function commitCreateRoom({
  idToken,
  roomId,
  teacherId,
  roomName,
  inviteCode,
  now,
}: {
  idToken: string;
  roomId: string;
  teacherId: string;
  roomName: string;
  inviteCode: string;
  now: Date;
}) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new Error("Firebase project id is missing.");
  }

  const databasePath = `projects/${projectId}/databases/(default)`;
  const documentsPath = `${databasePath}/documents`;
  const response = await fetch(
    `https://firestore.googleapis.com/v1/${documentsPath}:commit`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        writes: [
          {
            update: buildRoomDocument({
              documentsPath,
              roomId,
              teacherId,
              roomName,
              inviteCode,
              now,
            }),
            currentDocument: { exists: false },
          },
          {
            update: buildInviteCodeDocument({
              documentsPath,
              inviteCode,
              roomId,
              now,
            }),
            currentDocument: { exists: false },
          },
        ],
      }),
      cache: "no-store",
    },
  );

  if (response.ok) {
    const data = (await response.json()) as FirestoreCommitResponse;
    return data.writeResults?.length === 2 ? "created" : "failed";
  }

  const errorText = await response.text();

  // inviteCodes/{inviteCode} が既にある場合は、別のコードで再試行します。
  if (response.status === 409 || errorText.includes("ALREADY_EXISTS")) {
    return "duplicate-invite-code";
  }

  throw new Error(errorText);
}

function buildRoomDocument({
  documentsPath,
  roomId,
  teacherId,
  roomName,
  inviteCode,
  now,
}: {
  documentsPath: string;
  roomId: string;
  teacherId: string;
  roomName: string;
  inviteCode: string;
  now: Date;
}): FirestoreDocument & { name: string } {
  return {
    name: `${documentsPath}/rooms/${roomId}`,
    fields: {
      id: { stringValue: roomId },
      teacher_id: { stringValue: teacherId },
      name: { stringValue: roomName },
      invite_code: { stringValue: inviteCode },
      active_section_id: { nullValue: null },
      is_active: { booleanValue: true },
      question_count: { integerValue: "0" },
      created_at: { timestampValue: now.toISOString() },
      updated_at: { timestampValue: now.toISOString() },
      closed_at: { nullValue: null },
    },
  };
}

function buildInviteCodeDocument({
  documentsPath,
  inviteCode,
  roomId,
  now,
}: {
  documentsPath: string;
  inviteCode: string;
  roomId: string;
  now: Date;
}): FirestoreDocument & { name: string } {
  return {
    name: `${documentsPath}/inviteCodes/${inviteCode}`,
    fields: {
      invite_code: { stringValue: inviteCode },
      room_id: { stringValue: roomId },
      created_at: { timestampValue: now.toISOString() },
    },
  };
}
