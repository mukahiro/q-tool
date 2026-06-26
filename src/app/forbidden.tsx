import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-950">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-rose-700">403 Forbidden</p>
        <h1 className="mt-2 text-2xl font-semibold">
          教師ログインが必要です
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          ルームを作成するには、教師アカウントでログインしてください。
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          ログイン画面へ
        </Link>
      </section>
    </main>
  );
}
