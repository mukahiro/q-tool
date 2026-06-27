"use server";

import { z } from "zod";
import { getVerifiedTeacherFromAuthCookie } from "@/features/auth/utils/server";
import type { CreateRoomState } from "./state";
import type { InviteCodeDocument, RoomDocument } from "./types";
import {
  createRoomDocuments,
  type CreateRoomDocumentsResult,
} from "./utils/firestoreRest";
import { generateInviteCode } from "./utils/inviteCode";

const createRoomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "ルーム名を入力してください。")
    .max(80, "ルーム名は80文字以内で入力してください。"),
});

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
