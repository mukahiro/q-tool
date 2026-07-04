export type CreateRoomState = {
  ok: boolean;
  message: string | null;
  roomId?: string;
  inviteCode?: string;
};

export type EndRoomState = {
  ok: boolean;
  message: string | null;
};

export const initialCreateRoomState: CreateRoomState = {
  ok: false,
  message: null,
};
