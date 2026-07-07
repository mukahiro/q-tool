import type { Timestamp } from "firebase/firestore";

export type SummaryItem = {
  title: string;
  text: string;
  source_question_ids: string[];
};

export type SummarySourceQuestion = {
  id: string;
  sourceLabel: string;
  content: string;
  reactionCount: number;
};

export type SummaryDocument = {
  id: string;
  room_id: string;
  section_id: string;
  content: string;
  items?: SummaryItem[];
  source_questions?: SummarySourceQuestion[];
  created_at: Timestamp;
};

export type SummaryDisplay = {
  id: string;
  sectionId: string;
  content: string;
  items: SummaryItem[];
  sourceQuestions: SummarySourceQuestion[];
  createdAt: string;
};

export type EndSectionState = {
  ok: boolean;
  message: string;
  summaryId?: string;
  sectionId?: string;
  summaryContent?: string;
  summaryItems?: SummaryItem[];
  sourceQuestions?: SummarySourceQuestion[];
};

export const initialEndSectionState: EndSectionState = {
  ok: false,
  message: "",
};
