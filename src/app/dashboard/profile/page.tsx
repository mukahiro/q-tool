import { redirect } from "next/navigation";
import { getVerifiedTeacherFromAuthCookie } from "@/features/auth/utils/server";
import { getTeacherProfile } from "@/features/profile/actions";
import { ProfileEditView } from "@/features/profile/components/ProfileEditView";

export default async function DashboardProfilePage() {
  const teacher = await getVerifiedTeacherFromAuthCookie();

  if (!teacher) {
    redirect("/login");
  }

  const profileResult = await getTeacherProfile();

  return <ProfileEditView result={profileResult} />;
}

