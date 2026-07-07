import Link from "next/link";

export default function RoomInviteNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-950">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-amber-700">404 Not Found</p>

        <h1 className="mt-2 text-2xl font-semibold">
          ルームが見つかりません
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          指定されたルームは存在しないか、削除された可能性があります。
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          トップへ戻る
        </Link>
      </section>
    </main>
  );
}
