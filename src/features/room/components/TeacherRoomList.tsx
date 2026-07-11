import Link from "next/link";
import type { TeacherRoomSummary } from "../actions";

type TeacherRoomListProps = {
  rooms: TeacherRoomSummary[];
};

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function TeacherRoomList({ rooms }: TeacherRoomListProps) {
  if (rooms.length === 0) {
    return (
      <section
        aria-labelledby="room-list-heading"
        className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center"
      >
        <p className="text-sm font-semibold text-emerald-700">
          ルームはまだありません
        </p>
        <h2
          id="room-list-heading"
          className="mt-2 text-2xl font-semibold text-slate-950"
        >
          最初の授業ルームを作成しましょう
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
          ルームを作成すると、ここにルーム名、招待コード、開講状態、質問数、作成日時が表示されます。
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="room-list-heading" className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            作成済みルーム
          </p>
          <h2
            id="room-list-heading"
            className="mt-1 text-2xl font-semibold text-slate-950"
          >
            ルーム一覧
          </h2>
        </div>
        <p className="text-sm text-slate-600">
          自分が作成したルームだけを表示しています。
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {rooms.map((room) => (
          <TeacherRoomCard key={room.id} room={room} />
        ))}
      </div>
    </section>
  );
}

export function TeacherRoomCard({ room }: { room: TeacherRoomSummary }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-950">
              {room.name}
            </h3>
            <RoomStatusBadge isActive={room.isActive} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {dateFormatter.format(new Date(room.createdAt))}
          </p>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left sm:text-right">
          <p className="text-xs font-medium text-slate-500">招待コード</p>
          <Link
            href={`/rooms/${room.id}/invite`}
            aria-label={`${room.name}の招待QR・PINを表示`}
            className="font-mono text-lg font-bold tracking-wide text-slate-950 underline-offset-4 hover:underline"
          >
            {room.inviteCode}
          </Link>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <RoomMetric label="質問数" value={`${room.questionCount}件`} />
        <RoomMetric
          label="状態"
          value={room.isActive ? "開講中" : "終了済み"}
        />
      </dl>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/rooms/${room.id}`}
          className="inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          詳細
        </Link>
        <Link
          href={`/rooms/${room.id}/chat`}
          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        >
          チャット
        </Link>
      </div>
    </article>
  );
}

function RoomStatusBadge({ isActive }: { isActive: boolean }) {
  const badgeClassName = isActive
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-100 text-slate-600";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClassName}`}
    >
      {isActive ? "開講中" : "終了済み"}
    </span>
  );
}

function RoomMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-950">{value}</dd>
    </div>
  );
}
