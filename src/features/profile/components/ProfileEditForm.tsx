"use client";

import { useActionState } from "react";
import { saveTeacherProfile } from "@/features/profile/actions";
import { initialProfileFormState } from "@/features/profile/state";
import type { TeacherProfile } from "@/features/profile/types";

type ProfileEditFormProps = {
  profile: TeacherProfile | null;
};

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const [state, formAction, isPending] = useActionState(
    saveTeacherProfile,
    initialProfileFormState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <label className="block">
        <span className="text-sm font-medium text-slate-800">
          ユーザー名 <span className="text-rose-600">必須</span>
        </span>
        <input
          type="text"
          name="username"
          required
          maxLength={40}
          disabled={isPending}
          defaultValue={profile?.username ?? ""}
          placeholder="例: 山田先生"
          autoComplete="name"
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-800">所属</span>
        <input
          type="text"
          name="affiliation"
          maxLength={80}
          disabled={isPending}
          defaultValue={profile?.affiliation ?? ""}
          placeholder="例: q-tool 高等学校"
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-800">
          担当授業科目
        </span>
        <input
          type="text"
          name="subject"
          maxLength={80}
          disabled={isPending}
          defaultValue={profile?.subject ?? ""}
          placeholder="例: 数学I / 情報I"
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-800">連絡用URL</span>
        <input
          type="url"
          name="contactUrl"
          maxLength={200}
          disabled={isPending}
          defaultValue={profile?.contactUrl ?? ""}
          placeholder="例: https://classroom.google.com/..."
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-800">自己紹介</span>
        <textarea
          name="bio"
          rows={5}
          maxLength={300}
          disabled={isPending}
          defaultValue={profile?.bio ?? ""}
          placeholder="授業や質問対応で学生に伝えたいことを書けます。"
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </label>

      {state.message ? (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            state.ok
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
          role={state.ok ? "status" : "alert"}
          aria-live="polite"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
      >
        {isPending ? "保存中..." : "保存する"}
      </button>
    </form>
  );
}
