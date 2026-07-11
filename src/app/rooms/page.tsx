import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getAuthToken } from "@/features/auth/actions";
import { getTeacherRooms } from "@/features/room/actions";
import { TeacherRoomList } from "@/features/room/components/TeacherRoomList";

export default async function RoomsPage() {
  const authToken = await getAuthToken();
  const isLoggedIn = Boolean(authToken);
  const roomResult = isLoggedIn ? await getTeacherRooms() : null;

  return (
    <main className="flex-1 bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Breadcrumbs
              items={[
                { label: "ダッシュボード", href: "/dashboard" },
              ]}
            />
            <h1 className="mt-1 text-3xl font-semibold">ルーム一覧</h1>
          </div>
          {isLoggedIn ?? (
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              ログイン
            </Link>
          )}
        </header>

        {!isLoggedIn ? (
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-amber-700">
              ログインが必要です
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              ルーム一覧を表示するにはログインしてください
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              教師アカウントでログインすると、作成したルームを一覧で確認できます。
            </p>
          </section>
        ) : null}

        {roomResult?.status === "forbidden" ? (
          <section
            role="alert"
            className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900"
          >
            <p className="text-sm font-medium">ログインを確認できません</p>
            <h2 className="mt-2 text-2xl font-semibold">
              もう一度ログインしてください
            </h2>
            <p className="mt-3 text-sm leading-6">{roomResult.message}</p>
          </section>
        ) : null}

        {roomResult?.status === "error" ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {roomResult.message}
          </p>
        ) : null}

        {roomResult?.status === "success" ? (
          <TeacherRoomList rooms={roomResult.rooms} />
        ) : null}
      </div>
    </main>
  );
}
