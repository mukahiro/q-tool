import Link from "next/link";
import { getAuthToken } from "@/features/auth/actions";
import { LogoutButton } from "@/features/auth/components/LogoutButton";

export default async function Home() {
  const authToken = await getAuthToken();
  const isLoggedIn = Boolean(authToken);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Q Tool</p>
            <h1 className="mt-1 text-3xl font-semibold">教師ダッシュボード</h1>
          </div>
          {isLoggedIn ? (
            <LogoutButton />
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              ログイン
            </Link>
          )}
        </header>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {isLoggedIn ? (
            <>
              <p className="text-sm font-medium text-emerald-700">
                Firebase Authentication でログイン済み
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                ルーム管理を開始できます
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                新しいルームを作成し、学生が参加するための招待コードを発行できます。
              </p>
              <Link
                href="/rooms/new"
                className="mt-6 inline-flex items-center justify-center rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                ルームを作成
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-amber-700">
                ログインが必要です
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                教師機能を使うにはログインしてください
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                学生は認証なしで参加する想定ですが、ルーム作成と管理は教師アカウントで保護します。
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
