import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export function LandingPage({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid min-h-[82vh] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1fr_0.86fr]">
          <div>
            <BrandLogo priority className="w-44 sm:w-52" />
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
              授業中の質問を集め、教師が答えやすい形に整える
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              学生は匿名で質問を投稿し、教師はルームごとに質問数と授業の流れを確認できます。発言しづらい疑問も拾いやすくする、授業向けのリアルタイム質問ツールです。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={isLoggedIn ? "/dashboard" : "/login"}
                className="inline-flex items-center justify-center rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {isLoggedIn ? "ダッシュボードへ" : "教師として始める"}
              </Link>
              <Link
                href="/join"
                className="inline-flex items-center justify-center rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                学生として参加
              </Link>
            </div>
          </div>

          <div
            aria-label="教師画面のプレビュー"
            className="rounded-lg border border-slate-200 bg-slate-950 p-4 shadow-xl"
          >
            <div className="rounded-md bg-white p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-semibold text-emerald-700">
                    最近のルーム
                  </p>
                  <p className="mt-1 text-lg font-semibold">数学I 二次関数</p>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  開講中
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <PreviewMetric label="質問数" value="12件" />
                <PreviewMetric label="招待コード" value="MATH7K" />
              </div>
              <div className="mt-5 space-y-3">
                <PreviewQuestion text="平方完成で符号を間違えやすいです。" />
                <PreviewQuestion text="頂点の座標はどこを見ればよいですか？" />
                <PreviewQuestion text="グラフの開き方をもう一度確認したいです。" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-3">
          <FeatureCard
            title="質問を集める"
            description="QRコードや招待コードで学生が参加し、授業中の疑問をその場で投稿できます。"
          />
          <FeatureCard
            title="状況を把握する"
            description="教師はルームごとの状態や質問数を確認し、授業の進行に合わせて対応できます。"
          />
          <FeatureCard
            title="回答につなげる"
            description="将来的なAI要約と組み合わせ、似た質問をまとめて効率よくフィードバックできます。"
          />
        </div>
      </section>
    </main>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function PreviewQuestion({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
      {text}
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}
