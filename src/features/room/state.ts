export type CreateRoomState = {
  ok: boolean;
  message: string | null;
  roomId?: string;
  inviteCode?: string;
};

export const initialCreateRoomState: CreateRoomState = {
  ok: false,
  message: null,
};
