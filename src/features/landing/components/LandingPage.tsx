import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  Bot,
  CheckCircle2,
  ClipboardList,
  MessageSquarePlus,
  QrCode,
  Sparkles,
  UsersRound,
} from "lucide-react";

type LandingIcon = ComponentType<SVGProps<SVGSVGElement>>;

const teacherFlowItems = [
  "ルームを作成",
  "QRコード・PINを共有",
  "授業の進行に集中",
  "区切りごとにAI要約",
];

const studentFlowItems = [
  "匿名で参加",
  "思いついた瞬間に投稿",
  "共感した質問にリアクション",
];

const featureCards = [
  {
    icon: QrCode,
    title: "入室しやすい",
    description:
      "QRコードと6文字の招待コードに対応。学生はログインなしで、すぐに授業ルームへ入れます。",
  },
  {
    icon: ClipboardList,
    title: "授業を止めにくい",
    description:
      "教師画面では質問本文をすぐに並べないため、授業に集中できます。説明の流れを保ちやすくします。",
  },
  {
    icon: Bot,
    title: "回答へつなげる",
    description:
      "セクション終了時に質問をAIで要約。似た疑問をまとめ、次に扱うべきポイントを見つけやすくします。",
  },
];

export function LandingPage({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <main className="flex-1 bg-[#f8fafc] text-slate-950">
      <section className="border-b border-slate-200 bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid min-h-[calc(100dvh-5.5rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1fr_0.92fr]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
              <Sparkles className="size-4" aria-hidden="true" />
              授業中の「わからない」を拾いやすく
            </div>
            <h1 className="mt-5 text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
              質問を集めて、
              <span className="block text-cyan-800">答えやすい形へ。</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Q Toolは、学生の匿名質問をリアルタイムに集め、授業の区切りでAI要約までつなげる質問ツールです。発言しづらい疑問も、教師が扱いやすい流れで受け止められます。
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={isLoggedIn ? "/dashboard" : "/login?mode=signup"}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {isLoggedIn ? "ダッシュボードへ" : "無料でルームを作る"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/join"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                <UsersRound className="size-4" aria-hidden="true" />
                学生として参加
              </Link>
            </div>

            <div className="mt-8 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <LandingCheck text="学生はログイン不要" />
              <LandingCheck text="教師は授業進行に集中" />
              <LandingCheck text="QRコード・PINで入室" />
              <LandingCheck text="AI要約で回答準備を支援" />
            </div>
          </div>

          <DashboardPreview />
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="grid gap-4 md:grid-cols-3">
            {featureCards.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.95fr_1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-cyan-800">授業の流れ</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-slate-950">
              先生は授業に集中し、学生は迷わず質問できます。
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Q Toolは「質問を受け付ける時間」と「まとめて答える時間」を分ける設計です。個別の投稿にその場で追われにくく、授業の区切りでまとめて扱えます。
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FlowPanel
              icon={BookOpenCheck}
              title="教師"
              items={teacherFlowItems}
              tone="teacher"
            />
            <FlowPanel
              icon={MessageSquarePlus}
              title="学生"
              items={studentFlowItems}
              tone="student"
            />
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 rounded-lg border border-slate-200 bg-slate-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="text-2xl font-semibold">次の授業で試してみる</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              ルームを作成して招待コードを共有すれば、学生の質問をすぐに受け付けられます。
            </p>
          </div>
          <Link
            href={isLoggedIn ? "/rooms/new" : "/login?mode=signup"}
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-50"
          >
            ルーム作成へ
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function DashboardPreview() {
  return (
    <div
      aria-label="教師画面のプレビュー"
      className="rounded-lg border border-slate-200 bg-slate-950 p-3 shadow-2xl sm:p-4"
    >
      <div className="overflow-hidden rounded-md bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-rose-400" />
            <span className="size-2 rounded-full bg-amber-400" />
            <span className="size-2 rounded-full bg-emerald-400" />
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            開講中
          </span>
        </div>

        <div className="p-5">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-cyan-800">
                数学I 二次関数
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                導入: 放物線の形
              </h2>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-right">
              <p className="text-xs font-medium text-slate-500">招待コード</p>
              <p className="mt-1 font-mono text-lg font-semibold tracking-wide text-slate-950">
                MATH7K
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <PreviewMetric label="質問" value="12" unit="件" />
            <PreviewMetric label="作成者" value="" unit="山口先生" />
            <PreviewMetric label="要約設定" value="" unit="日本語 / 標準" />
          </div>

          <div className="mt-5 rounded-md border border-cyan-100 bg-cyan-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-900">
              <Bot className="size-4" aria-hidden="true" />
              AI要約プレビュー
            </div>
            <p className="mt-3 text-sm leading-6 text-cyan-950">
              平方完成の符号、頂点座標の読み取り、グラフの開き方に質問が集中しています。
            </p>
          </div>

          <div className="mt-5 space-y-3">
            <PreviewQuestion text="平方完成で符号を間違えやすいです。" />
            <PreviewQuestion text="頂点の座標はどこを見ればよいですか？" />
            <PreviewQuestion text="グラフの開き方をもう一度確認したいです。" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LandingCheck({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}

function PreviewMetric({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">
        {value}
        <span className="ml-0.5 text-xs font-medium text-slate-500">{unit}</span>
      </p>
    </div>
  );
}

function PreviewQuestion({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700">
      {text}
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LandingIcon;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex size-10 items-center justify-center rounded-md bg-cyan-50 text-cyan-800">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}

function FlowPanel({
  icon: Icon,
  title,
  items,
  tone,
}: {
  icon: LandingIcon;
  title: string;
  items: string[];
  tone: "teacher" | "student";
}) {
  const toneClass =
    tone === "teacher"
      ? "border-cyan-200 bg-cyan-50 text-cyan-900"
      : "border-emerald-200 bg-emerald-50 text-emerald-900";

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <span
          className={`flex size-10 items-center justify-center rounded-md border ${toneClass}`}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      </div>
      <ol className="mt-5 space-y-3">
        {items.map((item, index) => (
          <li key={item} className="flex gap-3 text-sm text-slate-700">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
              {index + 1}
            </span>
            <span className="leading-6">{item}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}
