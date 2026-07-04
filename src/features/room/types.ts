import { Timestamp } from "firebase/firestore";

/**
 * Firestore rooms/{roomId} ドキュメントに対応する型
 */
export type Room = {
  id: string;
  teacher_id: string;
  name: string;
  invite_code: string;
  active_section_id: string | null;
  is_active: boolean;
  question_count: number;
  created_at: Timestamp;
  updated_at: Timestamp;
  closed_at: Timestamp | null;
};

/**
 * ルーム作成時に Firestore へ保存するデータ型
 */
export type RoomDocument = {
  id: string;
  teacher_id: string;
  name: string;
  invite_code: string;
  active_section_id: string | null;
  is_active: boolean;
  question_count: number;
  created_at: Date;
  updated_at: Date;
  closed_at: Date | null;
};

/**
 * 招待コードからルームを引くための Firestore ドキュメント型
 */
export type InviteCodeDocument = {
  invite_code: string;
  room_id: string;
  created_at: Date;
};

/**
 * クライアント側で表示用に加工した Room 型
 */
export type RoomDisplay = {
  id: string;
  name: string;
  invite_code: string;
  is_active: boolean;
  question_count: number;
  active_section_id: string | null;
  created_at: Date;
  updated_at: Date;
  closed_at: Date | null;
};
