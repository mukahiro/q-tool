export type JoinRoomResult =
  | {
      status: "success";
      roomId: string;
      roomName: string;
    }
  | {
      status: "invalid-code";
      message: string;
    }
  | {
      status: "not-found";
      message: string;
    }
  | {
      status: "closed";
      message: string;
    }
  | {
      status: "error";
      message: string;
    };