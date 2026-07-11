import type { Metadata } from "next";
import Link from "next/link";
import { getRoomDetail } from "@/features/room/actions";
import { RoomDetail } from "@/features/room/components/RoomDetail";

type Props = {
  params: Promise<{ roomId: string }>;
};

// 動的ページのため、静的生成は不可
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ルーム詳細 | Q Tool",
  description: "ルームの詳細情報を確認します",
};

/**
 * ルーム詳細画面
 * 教師が特定ルームの情報を確認し、
 * 招待画面や要約確認へ進むためのハブページ
 */
export default async function RoomDetailPage({ params }: Props) {
  const { roomId } = await params;

  // ルーム詳細情報を取得
  const { data: room, error } = await getRoomDetail(roomId);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        {/* ヘッダー */}
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mt-1 text-3xl font-semibold">ルーム詳細</h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/rooms"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
            >
              ルーム一覧に戻る
            </Link>
          </div>
        </header>

        {/* エラー表示 */}
        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/rooms"
                className="inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
              >
                ルーム一覧に戻る
              </Link>
            </div>
          </div>
        )}

        {/* ルーム詳細 */}
        {room && <RoomDetail room={room} />}
      </div>
    </main>
  );
}
