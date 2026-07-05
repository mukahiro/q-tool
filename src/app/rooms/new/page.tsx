import { forbidden } from "next/navigation";
import { getVerifiedTeacherFromAuthCookie } from "@/features/auth/utils/server";
import { RoomCreateView } from "@/features/room/components/RoomCreateView";

export default async function NewRoomPage() {
  const teacher = await getVerifiedTeacherFromAuthCookie();

  if (!teacher) {
    forbidden();
  }

  return <RoomCreateView teacherEmail={teacher.email} />;
}
