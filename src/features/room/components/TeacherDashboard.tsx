import Link from "next/link";
import type { GetTeacherRoomsResult, TeacherRoomSummary } from "../actions";
import { TeacherRoomCard } from "./TeacherRoomList";

type TeacherDashboardProps = {
  teacherEmail: string | null;
  roomResult: GetTeacherRoomsResult;
};

export function TeacherDashboard({
  teacherEmail,
  roomResult,
}: TeacherDashboardProps) {
  return (
    <main className="flex-1 bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mt-1 text-3xl font-semibold">
              教師ダッシュボード
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {teacherEmail ?? "教師アカウント"} でログイン中
            </p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <DashboardAction
            href="/rooms/new"
            label="ルームを作成"
            title="授業を始める"
            description="授業名を登録して、学生に共有する招待コードを発行します。"
            primary
          />
          <DashboardAction
            href="/rooms"
            label="ルーム一覧"
            title="作成済みルームを見る"
            description="過去に作成したルームの状態、質問数、招待コードを確認します。"
          />
          <DashboardAction
            href="/dashboard/profile"
            label="プロフィール編集"
            title="教師情報を整える"
            description="ユーザー名、所属、担当科目など、教師アカウントのプロフィールを登録します。"
          />
        </section>

        {roomResult.status === "error" ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {roomResult.message}
          </p>
        ) : null}

        {roomResult.status === "forbidden" ? (
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

        {roomResult.status === "success" ? (
          <RecentRooms rooms={roomResult.rooms} />
        ) : null}
      </div>
    </main>
  );
}

function DashboardAction({
  href,
  label,
  title,
  description,
  primary = false,
}: {
  href: string;
  label: string;
  title: string;
  description: string;
  primary?: boolean;
}) {
  const linkClassName = primary
    ? "bg-slate-950 text-white hover:bg-slate-800"
    : "border border-slate-300 text-slate-700 hover:bg-slate-50";

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-emerald-700">{title}</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-950">{label}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      <Link
        href={href}
        className={`mt-5 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition ${linkClassName}`}
      >
        {label}
      </Link>
    </article>
  );
}

function RecentRooms({ rooms }: { rooms: TeacherRoomSummary[] }) {
  if (rooms.length === 0) {
    return (
      <section
        aria-labelledby="recent-rooms-heading"
        className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center"
      >
        <p className="text-sm font-semibold text-emerald-700">最近のルーム</p>
        <h2
          id="recent-rooms-heading"
          className="mt-2 text-2xl font-semibold text-slate-950"
        >
          まだルームはありません
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
          最初のルームを作成すると、ここに新しい順で数件表示されます。
        </p>
        <Link
          href="/rooms/new"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          最初のルームを作成
        </Link>
      </section>
    );
  }

  return (
    <section aria-labelledby="recent-rooms-heading" className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">最近のルーム</p>
          <h2
            id="recent-rooms-heading"
            className="mt-1 text-2xl font-semibold text-slate-950"
          >
            新しく作成したルーム
          </h2>
        </div>
        <Link
          href="/rooms"
          className="text-sm font-semibold text-slate-700 underline-offset-4 hover:underline"
        >
          すべて見る
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {rooms.map((room) => (
          <TeacherRoomCard key={room.id} room={room} />
        ))}
      </div>
    </section>
  );
}
