import { getFirebaseFirestore } from "@/lib/firebase/firestore";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import type { Room, Section } from "../types";

export async function fetchRoomStatus(roomId: string) {
  try {
    const firestore = getFirebaseFirestore();
    const roomRef = doc(firestore, "rooms", roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      return { data: null, error: "ルームが見つかりません。" };
    }

    const roomData = roomSnap.data();

    return {
      data: {
        is_active: roomData.is_active,
      },
      error: null,
    };
  } catch (error) {
    console.error("Failed to fetch room status:", error);
    return {
      data: null,
      error: "ルーム状態の取得に失敗しました。",
    };
  }
}

/**
 * 指定されたルームIDからルーム情報を取得する
 * @param roomId - ルームID
 * @returns ルーム情報、またはエラーメッセージ
 */
export async function fetchRoom(
  roomId: string
): Promise<{ data: Room | null; error: string | null }> {
  try {
    // Firebase App を初期化済みにしてから Firestore を取得する
    const firestore = getFirebaseFirestore();

    // ルームドキュメントを取得
    const roomRef = doc(firestore, "rooms", roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      return {
        data: null,
        error: "ルームが見つかりません。",
      };
    }

    const roomData = roomSnap.data();

    // Firestore ドキュメントを Room 型にキャスト
    const room: Room = {
      id: roomSnap.id,
      teacher_id: roomData.teacher_id,
      name: roomData.name,
      invite_code: roomData.invite_code,
      active_section_id: roomData.active_section_id || null,
      is_active: roomData.is_active,
      question_count: roomData.question_count || 0,
      created_at: roomData.created_at,
      updated_at: roomData.updated_at,
      closed_at: roomData.closed_at || null,
    };

    return { data: room, error: null };
  } catch (error) {
    console.error("Failed to fetch room:", error);
    return {
      data: null,
      error: "ルーム情報の取得に失敗しました。時間をおいて再試行してください。",
    };
  }
}

/**
 * 指定されたセクションIDからセクション情報を取得する
 */
export async function fetchSection(
  roomId: string,
  sectionId: string,
): Promise<{ data: Section | null; error: string | null }> {
  try {
    const firestore = getFirebaseFirestore();
    const sectionRef = doc(firestore, "rooms", roomId, "sections", sectionId);
    const sectionSnap = await getDoc(sectionRef);

    if (!sectionSnap.exists()) {
      return {
        data: null,
        error: "セクションが見つかりません。",
      };
    }

    const sectionData = sectionSnap.data();

    const section: Section = {
      id: sectionSnap.id,
      room_id: sectionData.room_id,
      name: sectionData.name,
      order: sectionData.order ?? 0,
      is_completed: Boolean(sectionData.is_completed),
      question_count: sectionData.question_count ?? 0,
      reaction_count: sectionData.reaction_count ?? 0,
      summary_id: sectionData.summary_id ?? null,
      created_at: sectionData.created_at,
      completed_at: sectionData.completed_at ?? null,
    };

    return { data: section, error: null };
  } catch (error) {
    console.error("Failed to fetch section:", error);
    return {
      data: null,
      error:
        "セクション情報の取得に失敗しました。時間をおいて再試行してください。",
    };
  }
}



/**
 * Timestamp を Date に変換する
 * @param timestamp - Firestore Timestamp
 * @returns Date オブジェクト
 */
export function timestampToDate(timestamp: Timestamp | null): Date | null {
  if (!timestamp) return null;
  return timestamp.toDate();
}
