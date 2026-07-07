import type { Timestamp } from "firebase/firestore";

export type SummaryCategory = {
  title: string;
  question_count: number;
};

export type SummaryDocument = {
  id: string;
  room_id: string;
  section_id: string;
  content: string;
  categories: SummaryCategory[];
  created_at: Timestamp;
};

export type SummaryDisplay = {
  id: string;
  sectionId: string;
  content: string;
  categories: SummaryCategory[];
  createdAt: string;
};

export type EndSectionState = {
  ok: boolean;
  message: string;
  summaryId?: string;
  sectionId?: string;
  summaryContent?: string;
  categories?: SummaryCategory[];
};

export const initialEndSectionState: EndSectionState = {
  ok: false,
  message: "",
};
