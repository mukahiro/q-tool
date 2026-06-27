import type { TeacherRoomSummary } from "@/features/room/actions";
import { TeacherRoomList } from "@/features/room/components/TeacherRoomList";
import { notFound } from "next/navigation";

const previewRooms: TeacherRoomSummary[] = [
  {
    id: "preview-room-programming-basics",
    name: "プログラミング基礎 第3回",
    inviteCode: "QTOOL-314",
    isActive: true,
    createdAt: "2026-06-27T09:00:00.000Z",
    questionCount: 18,
  },
  {
    id: "preview-room-web-intro",
    name: "Webアプリ入門",
    inviteCode: "WEB-506",
    isActive: true,
    createdAt: "2026-06-26T05:15:00.000Z",
    questionCount: 7,
  },
  {
    id: "preview-room-data-literacy",
    name: "データリテラシー演習",
    inviteCode: "DATA-827",
    isActive: false,
    createdAt: "2026-06-20T04:30:00.000Z",
    questionCount: 42,
  },
];

export default function TeacherDashboardPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-6">
          <p className="text-sm font-medium text-teal-700">q-tool</p>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
                授業の質問ルーム管理
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                教師としてログインした後のルーム一覧を確認できます。
              </p>
            </div>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              新しいルームを作成
            </button>
          </div>
        </header>

        <TeacherRoomList rooms={previewRooms} />
      </div>
    </main>
  );
}
