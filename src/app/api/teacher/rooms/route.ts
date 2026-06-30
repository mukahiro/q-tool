import { getTeacherRoomsForRequest } from "@/features/room/actions";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const result = await getTeacherRoomsForRequest(request);

  if (result.status === "forbidden") {
    return Response.json({ message: result.message }, { status: 403 });
  }

  if (result.status === "error") {
    return Response.json({ message: result.message }, { status: 500 });
  }

  return Response.json({ rooms: result.rooms });
}
