import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-10 text-slate-950">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-rose-700">403 Forbidden</p>

        <h1 className="mt-2 text-2xl font-semibold">
          このページを表示する権限がありません
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          教師アカウントでログインしているか、このルームを作成した教師であることを確認してください。
        </p>

        <div className="mt-6 grid gap-3">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            トップへ戻る
          </Link>

          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            ログイン画面へ
          </Link>
        </div>
      </section>
    </main>
  );
}
