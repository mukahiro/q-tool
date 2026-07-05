import type { Timestamp } from "firebase/firestore";

export type StudentChatRoom = {
  id: string;
  name: string;
  isActive: boolean;
  activeSectionId: string | null;
};

export type QuestionDocument = {
  id: string;
  room_id: string;
  section_id: string;
  content: string;
  student_session_id: string;
  reaction_count: number;
  created_at: Timestamp;
};

export type QuestionListItem = {
  id: string;
  sectionId: string;
  content: string;
  studentSessionId: string;
  reactionCount: number;
  createdAtText: string;
  isOwnQuestion: boolean;
  hasReacted: boolean;
};

export type QuestionActionResult =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
    };
