import "server-only";

type FirestoreStringValue = {
  stringValue?: string;
};

type FirestoreBooleanValue = {
  booleanValue?: boolean;
};

type FirestoreRoomResponse = {
  fields?: {
    teacher_id?: FirestoreStringValue;
    name?: FirestoreStringValue;
    invite_code?: FirestoreStringValue;
    is_active?: FirestoreBooleanValue;
  };
};

export type OwnedRoomInviteResult =
  | {
      status: "success";
      room: {
        id: string;
        name: string;
        inviteCode: string;
        isActive: boolean;
      };
    }
  | {
      status: "not-found";
    }
  | {
      status: "forbidden";
    };

type GetOwnedRoomInviteInput = {
  roomId: string;
  teacherId: string;
  idToken: string;
};

/**
 * 指定されたルームの招待情報を取得します。
 *
 * ログイン中の教師がルーム作成者でない場合は forbidden を返します。
 */
export async function getOwnedRoomInvite({
  roomId,
  teacherId,
  idToken,
}: GetOwnedRoomInviteInput): Promise<OwnedRoomInviteResult> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new Error("Firebase project id is missing.");
  }

  const documentUrl =
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/(default)/documents/rooms/${encodeURIComponent(roomId)}`;

  const response = await fetch(documentUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    return {
      status: "not-found",
    };
  }

  if (response.status === 401 || response.status === 403) {
    return {
      status: "forbidden",
    };
  }

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Firestore room fetch failed (${response.status}): ${errorText}`,
    );
  }

  const document = (await response.json()) as FirestoreRoomResponse;

  const roomTeacherId = document.fields?.teacher_id?.stringValue;
  const roomName = document.fields?.name?.stringValue;
  const inviteCode = document.fields?.invite_code?.stringValue;
  const isActive = document.fields?.is_active?.booleanValue;

  if (
    !roomTeacherId ||
    !roomName ||
    !inviteCode ||
    typeof isActive !== "boolean"
  ) {
    throw new Error("Firestore room document is missing required fields.");
  }

  if (roomTeacherId !== teacherId) {
    return {
      status: "forbidden",
    };
  }

  return {
    status: "success",
    room: {
      id: roomId,
      name: roomName,
      inviteCode,
      isActive,
    },
  };
}
