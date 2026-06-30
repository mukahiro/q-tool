import type { TeacherRoomSummary } from "@/features/room/actions";
import { TeacherRoomList } from "@/features/room/components/TeacherRoomList";

const previewRooms: TeacherRoomSummary[] = [
  {
    id: "preview-room-programming-basics",
    name: "プログラミング基礎 第3回",
    inviteCode: "QTA7K2",
    isActive: true,
    questionCount: 18,
    createdAt: "2026-06-30T09:00:00.000Z",
  },
  {
    id: "preview-room-web-intro",
    name: "Webアプリ入門",
    inviteCode: "WEB5N8",
    isActive: true,
    questionCount: 7,
    createdAt: "2026-06-29T05:15:00.000Z",
  },
  {
    id: "preview-room-data-literacy",
    name: "データリテラシー演習",
    inviteCode: "DATA3R",
    isActive: false,
    questionCount: 42,
    createdAt: "2026-06-24T04:30:00.000Z",
  },
];

export default function TeacherDashboardPreviewPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Q Tool</p>
            <h1 className="mt-1 text-3xl font-semibold">
              教師ダッシュボード
            </h1>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            新しいルームを作成
          </button>
        </header>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-emerald-700">
            プレビュー表示
          </p>
          <h2 className="mt-2 text-2xl font-semibold">ルーム管理</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            ログイン後に表示されるルーム一覧の見た目をサンプルデータで確認できます。
          </p>
        </section>

        <TeacherRoomList rooms={previewRooms} />
      </div>
    </main>
  );
}
