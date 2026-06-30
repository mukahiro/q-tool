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
};
