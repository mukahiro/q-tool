import { forbidden } from "next/navigation";
import { getVerifiedTeacherFromAuthCookie } from "@/features/auth/utils/server";
import { RoomCreateForm } from "@/features/room/components/RoomCreateForm";

export default async function NewRoomPage() {
  const teacher = await getVerifiedTeacherFromAuthCookie();

  if (!teacher) {
    forbidden();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto w-full max-w-3xl">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm font-semibold text-emerald-700">Q Tool</p>
          <h1 className="mt-1 text-3xl font-semibold">ルーム新規作成</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            授業名を入力すると、学生が参加するための招待コードを発行して
            Firestore に保存します。
          </p>
        </header>

        <RoomCreateForm teacherEmail={teacher.email} />
      </div>
    </main>
  );
}
