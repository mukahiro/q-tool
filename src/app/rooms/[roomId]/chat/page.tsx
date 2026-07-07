import type { Metadata } from "next";
import Link from "next/link";
import { getStudentChatRoom } from "@/features/question/actions";
import { QuestionChatPage } from "@/features/question/components/QuestionChatPage";

type Props = {
  params: Promise<{ roomId: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "質問チャット | Q Tool",
  description: "学生が質問を投稿・閲覧する画面です",
};

export default async function StudentQuestionChatRoute({ params }: Props) {
  const { roomId } = await params;
  const result = await getStudentChatRoom(roomId);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950">
      <div className="mx-auto w-full max-w-3xl">
        {result.ok ? (
          <QuestionChatPage initialRoom={result.room} />
        ) : (
          <section className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-emerald-700">Q Tool</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950">
              ルームを開けませんでした
            </h1>
            <p className="mt-4 text-sm font-semibold text-red-700">
              {result.message}
            </p>
            <Link
              href="/join"
              className="mt-5 inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              入室画面へ戻る
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
