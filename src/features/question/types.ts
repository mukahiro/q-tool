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
  section_id: string | null;
  content: string;
  student_session_id: string;
  reaction_count: number;
  created_at: Timestamp;
};

export type SectionDocument = {
  id: string;
  name: string;
  order: number;
  is_completed: boolean;
};

export type QuestionListItem = {
  id: string;
  sectionId: string | null;
  sectionName: string;
  targetLabel: string;
  content: string;
  studentSessionId: string;
  reactionCount: number;
  createdAtText: string;
  isOwnQuestion: boolean;
  hasReacted: boolean;
  isRecentlyAdded: boolean;
};

export type QuestionSectionGroup = {
  sectionId: string;
  sectionName: string;
  isWholeClass: boolean;
  isActiveSection: boolean;
  isPastSection: boolean;
  questions: QuestionListItem[];
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
