import Link from "next/link";
import { RoomCreateForm } from "./RoomCreateForm";

export function RoomCreateView({
  teacherEmail,
}: {
  teacherEmail: string | null;
}) {
  return (
    <main className="flex-1 bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-100"
        >
          ← ダッシュボードへ戻る
        </Link>

        <header className="mt-6 border-b border-slate-200 pb-6">
          <h1 className="mt-1 text-3xl font-semibold">ルーム新規作成</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            授業名を入力すると、学生が参加するための招待コードを発行して
            Firestoreに保存します。
          </p>
        </header>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-5">
            <p className="text-sm font-medium text-slate-500">ログイン中の教師</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {teacherEmail ?? "メールアドレス未設定"}
            </p>
          </div>

          <RoomCreateForm />
        </section>
      </div>
    </main>
  );
}
