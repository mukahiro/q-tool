import Link from "next/link";
import type { GetTeacherProfileResult } from "@/features/profile/actions";
import { ProfileEditForm } from "./ProfileEditForm";

type ProfileEditViewProps = {
  result: GetTeacherProfileResult;
};

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function ProfileEditView({ result }: ProfileEditViewProps) {
  return (
    <main className="flex-1 bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="border-b border-slate-200 pb-6">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-slate-700 underline-offset-4 hover:underline"
          >
            ダッシュボードへ戻る
          </Link>
          <h1 className="mt-5 text-3xl font-semibold">
            プロフィール編集
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            教師アカウントの表示名や授業に関する情報を登録できます。
          </p>
        </header>

        {result.status === "error" || result.status === "forbidden" ? (
          <section
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-rose-800"
          >
            <p className="text-sm font-medium">プロフィールを表示できません</p>
            <h2 className="mt-2 text-2xl font-semibold">
              もう一度お試しください
            </h2>
            <p className="mt-3 text-sm leading-6">{result.message}</p>
          </section>
        ) : null}

        {result.status === "success" ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <p className="text-sm font-semibold text-emerald-700">
                  編集内容
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  基本プロフィール
                </h2>
              </div>
              <ProfileEditForm profile={result.profile} />
            </section>

            <aside className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-emerald-700">
                現在の登録内容
              </p>
              <dl className="mt-4 space-y-4">
                <ProfileItem label="ユーザー名" value={result.profile?.username} />
                <ProfileItem label="メールアドレス" value={result.email} />
                <ProfileItem
                  label="所属"
                  value={result.profile?.affiliation}
                />
                <ProfileItem
                  label="担当授業科目"
                  value={result.profile?.subject}
                />
                <ProfileItem
                  label="連絡用URL"
                  value={result.profile?.contactUrl}
                />
                <ProfileItem label="自己紹介" value={result.profile?.bio} />
                <ProfileItem
                  label="最終更新"
                  value={
                    result.profile?.updatedAt
                      ? dateFormatter.format(new Date(result.profile.updatedAt))
                      : null
                  }
                />
              </dl>
            </aside>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function ProfileItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold text-slate-950">
        {value && value.length > 0 ? value : "未設定"}
      </dd>
    </div>
  );
}
