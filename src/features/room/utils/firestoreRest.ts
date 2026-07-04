import "server-only";

import type { InviteCodeDocument, RoomDocument } from "../types";

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { booleanValue: boolean }
  | { timestampValue: string }
  | { nullValue: null };

type FirestoreDocument = {
  name: string;
  fields: Record<string, FirestoreValue>;
};

type CreateRoomDocumentsInput = {
  idToken: string;
  room: RoomDocument;
  inviteCode: InviteCodeDocument;
};

type UpdateRoomStatusInput = {
  idToken: string;
  roomId: string;
  isActive: boolean;
  updatedAt: Date;
  closedAt?: Date;
};

export type CreateRoomDocumentsResult = "created" | "already-exists";

export async function createRoomDocuments({
  idToken,
  room,
  inviteCode,
}: CreateRoomDocumentsInput): Promise<CreateRoomDocumentsResult> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new Error("Firebase project id is missing.");
  }

  const documentsPath = `projects/${projectId}/databases/(default)/documents`;
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        writes: [
          {
            update: buildRoomDocument(documentsPath, room),
            currentDocument: { exists: false },
          },
          {
            update: buildInviteCodeDocument(documentsPath, inviteCode),
            currentDocument: { exists: false },
          },
        ],
      }),
      cache: "no-store",
    },
  );

  if (response.ok) {
    return "created";
  }

  const errorText = await response.text();

  // UUIDまたは招待コードが重複した場合は、別の値を生成して再試行します。
  if (response.status === 409 || errorText.includes("ALREADY_EXISTS")) {
    return "already-exists";
  }

  throw new Error(
    `Firestore commit failed (${response.status}): ${errorText}`,
  );
}

export async function updateRoomStatus({
  idToken,
  roomId,
  isActive,
  updatedAt,
  closedAt,
}: UpdateRoomStatusInput): Promise<boolean> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new Error("Firebase project id is missing.");
  }

  const documentsPath = `projects/${projectId}/databases/(default)/documents`;
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        writes: [
          {
            update: {
              name: `${documentsPath}/rooms/${roomId}`,
              fields: {
                is_active: { booleanValue: isActive },
                updated_at: { timestampValue: updatedAt.toISOString() },
                ...(isActive
                  ? {}
                  : {
                      closed_at: {
                        timestampValue:
                          closedAt?.toISOString() ?? updatedAt.toISOString(),
                      },
                    }),
              },
            },
            currentDocument: { exists: true },
          },
        ],
      }),
      cache: "no-store",
    },
  );

  if (response.ok) {
    return true;
  }

  throw new Error(`Firestore update failed (${response.status}): ${await response.text()}`);
}

function buildRoomDocument(
  documentsPath: string,
  room: RoomDocument,
): FirestoreDocument {
  return {
    name: `${documentsPath}/rooms/${room.id}`,
    fields: {
      id: { stringValue: room.id },
      teacher_id: { stringValue: room.teacher_id },
      name: { stringValue: room.name },
      invite_code: { stringValue: room.invite_code },
      active_section_id: { nullValue: null },
      is_active: { booleanValue: room.is_active },
      question_count: { integerValue: String(room.question_count) },
      created_at: { timestampValue: room.created_at.toISOString() },
      updated_at: { timestampValue: room.updated_at.toISOString() },
      closed_at: { nullValue: null },
    },
  };
}

function buildInviteCodeDocument(
  documentsPath: string,
  inviteCode: InviteCodeDocument,
): FirestoreDocument {
  return {
    name: `${documentsPath}/inviteCodes/${inviteCode.invite_code}`,
    fields: {
      invite_code: { stringValue: inviteCode.invite_code },
      room_id: { stringValue: inviteCode.room_id },
      created_at: { timestampValue: inviteCode.created_at.toISOString() },
    },
  };
}
