import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getRoomSummaries } from "@/features/summary/actions";
import { SummaryList } from "@/features/summary/components/SummaryList";

type Props = {
  params: Promise<{ roomId: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI要約一覧 | Q Tool",
  description: "終了したセクションのAI要約を確認します",
};

export default async function SummariesPage({ params }: Props) {
  const { roomId } = await params;
  const result = await getRoomSummaries(roomId);

  return (
    <main className="flex-1 bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Breadcrumbs
              items={[
                { label: "ダッシュボード", href: "/dashboard" },
                { label: "ルーム一覧", href: "/rooms" },
                { label: "ルーム詳細", href: `/rooms/${roomId}` },
              ]}
            />
            <h1 className="mt-1 text-3xl font-semibold">AI要約一覧</h1>
          </div>
        </header>

        {!result.ok ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {result.message}
          </p>
        ) : (
          <SummaryList summaries={result.summaries} />
        )}
      </div>
    </main>
  );
}
