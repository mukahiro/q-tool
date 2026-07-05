import { redirect } from "next/navigation";
import { getVerifiedTeacherFromAuthCookie } from "@/features/auth/utils/server";
import { getTeacherRooms } from "@/features/room/actions";
import { TeacherDashboard } from "@/features/room/components/TeacherDashboard";

export default async function DashboardPage() {
  const teacher = await getVerifiedTeacherFromAuthCookie();

  if (!teacher) {
    redirect("/login");
  }

  const roomResult = await getTeacherRooms({ limit: 3 });

  return (
    <TeacherDashboard teacherEmail={teacher.email} roomResult={roomResult} />
  );
}
