import { Timestamp } from "firebase/firestore";
import type {
  SummaryLanguage,
  SummaryTone,
} from "@/features/summary/settings";

/**
 * Firestore rooms/{roomId} ドキュメントに対応する型
 */
export type Room = {
  id: string;
  teacher_id: string;
  name: string;
  invite_code: string;
  active_section_id: string | null;
  summary_language?: SummaryLanguage;
  summary_tone?: SummaryTone;
  is_active: boolean;
  question_count: number;
  created_at: Timestamp;
  updated_at: Timestamp;
  closed_at: Timestamp | null;
};

/**
 * rooms/{roomId}/sections/{sectionId} ドキュメントに対応する型
 */
export type Section = {
  id: string;
  room_id: string;
  name: string;
  order: number;
  is_completed: boolean;
  question_count: number;
  reaction_count: number;
  summary_id: string | null;
  created_at: Timestamp;
  completed_at: Timestamp | null;
};

/**
 * セクション作成時に Firestore へ保存するデータ型
 */
export type SectionDocument = {
  id: string;
  room_id: string;
  name: string;
  order: number;
  is_completed: boolean;
  question_count: number;
  reaction_count: number;
  summary_id: string | null;
  created_at: Date;
  completed_at: Date | null;
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
  summary_language: SummaryLanguage;
  summary_tone: SummaryTone;
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
export type RoomSectionDisplay = {
  id: string;
  name: string;
  order: number;
  is_completed: boolean;
  question_count: number;
  reaction_count: number;
  summary_id: string | null;
  created_at: Date;
  completed_at: Date | null;
};

export type RoomDisplay = {
  id: string;
  name: string;
  creator_name: string | null;
  invite_code: string;
  is_active: boolean;
  question_count: number;
  active_section_id: string | null;
  active_section_name: string | null;
  summary_language: SummaryLanguage;
  summary_tone: SummaryTone;
  sections: RoomSectionDisplay[];
  created_at: Date;
  updated_at: Date;
  closed_at: Date | null;
};
