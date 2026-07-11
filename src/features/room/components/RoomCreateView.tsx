import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RoomCreateForm } from "./RoomCreateForm";

export function RoomCreateView({
  teacherEmail,
}: {
  teacherEmail: string | null;
}) {
  return (
    <main className="flex-1 bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto w-full max-w-3xl">
        <header className="border-b border-slate-200 pb-6">
          <Breadcrumbs
            items={[
              { label: "ダッシュボード", href: "/dashboard" },
            ]}
          />
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
