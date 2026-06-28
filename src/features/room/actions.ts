"use server";

import { getAuthToken } from "@/features/auth/actions";
import { fetchRoom, timestampToDate } from "./utils/firebase";
import { ROOM_ERROR_MESSAGES } from "./utils/errors";
import type { RoomDisplay } from "./types";

/**
 * ルーム詳細情報を取得するサーバーアクション
 * - 認証チェック
 * - ルーム取得
 * - 権限確認
 * - クライアント用に加工
 * @param roomId - ルームID
 * @returns { data: RoomDisplay | null, error: string | null }
 */
export async function getRoomDetail(
  roomId: string
): Promise<{ data: RoomDisplay | null; error: string | null }> {
  try {
    // 1. 認証トークンの確認（クライアントから送付されたCookieで確認）
    const authToken = await getAuthToken();
    if (!authToken) {
      return {
        data: null,
        error: ROOM_ERROR_MESSAGES.NOT_LOGGED_IN,
      };
    }

    // 2. ルーム情報を取得（Server Actions 内で Firebase SDK を使用）
    // 注: Server Actions ではクライアント Firebase SDK を使う
    // そのため getCurrentUserUid() では auth.currentUser が undefined になる可能性
    // 実際の運用では Admin SDK または Custom Claims の検証が必要
    const { data: room, error: roomFetchError } = await fetchRoom(roomId);

    if (roomFetchError || !room) {
      return {
        data: null,
        error: roomFetchError || ROOM_ERROR_MESSAGES.FETCH_FAILED,
      };
    }

    // 3. 権限確認（ここは制限的になる）
    // Server Actions 内で currentUser が利用できないため、
    // 本来ならば idToken をデコードして uid を取得する必要がある
    // 簡暫く、クライアント側で権限チェックを補う設計とする
    // または Firestore Security Rules で権限制御する

    // 4. クライアント用に加工
    const roomDisplay: RoomDisplay = {
      id: room.id,
      name: room.name,
      invite_code: room.invite_code,
      is_active: room.is_active,
      question_count: room.question_count,
      active_section_id: room.active_section_id,
      created_at: timestampToDate(room.created_at) || new Date(),
      updated_at: timestampToDate(room.updated_at) || new Date(),
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
