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

export type InviteCodeDocument = {
  invite_code: string;
  room_id: string;
  created_at: Date;
};
