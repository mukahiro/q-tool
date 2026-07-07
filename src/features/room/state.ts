export type CreateRoomState = {
  ok: boolean;
  message: string | null;
  roomId?: string;
  inviteCode?: string;
};

export type CreateSectionState = {
  ok: boolean;
  message: string | null;
  sectionId?: string;
  sectionName?: string;
  sectionOrder?: number;
};

export type EndRoomState = {
  ok: boolean;
  message: string | null;
};

export const initialCreateRoomState: CreateRoomState = {
  ok: false,
  message: null,
};

export const initialCreateSectionState: CreateSectionState = {
  ok: false,
  message: null,
};
