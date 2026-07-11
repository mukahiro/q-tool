"use client";

import { useAuthForm } from "../hooks/useAuthForm";
import type { AuthMode } from "../hooks/useAuthForm";

export function AuthForm({
  initialMode = "login",
}: {
  initialMode?: AuthMode;
}) {
  const {
    currentUser,
    email,
    handleLogout,
    handleSubmit,
    isLoading,
    message,
    mode,
    password,
    setEmail,
    setMode,
    setPassword,
    title,
  } = useAuthForm(initialMode);

  if (currentUser) {
    return (
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-emerald-700">ログイン中</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          {currentUser.email}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          教師用のルーム作成や管理機能に進めます。
        </p>
        {message ? (
          <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {message}
          </p>
        ) : null}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoading}
          className="mt-6 w-full rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          ログアウト
        </button>
      </section>
    );
  }

  return (
    <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex rounded-md bg-slate-100 p-1" aria-label="認証方法">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`w-1/2 rounded px-3 py-2 text-sm font-semibold ${
            mode === "login"
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-600"
          }`}
        >
          ログイン
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`w-1/2 rounded px-3 py-2 text-sm font-semibold ${
            mode === "signup"
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-600"
          }`}
        >
          新規登録
        </button>
      </div>

      <h1 className="mt-6 text-2xl font-semibold text-slate-950">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        授業ルームを作成する教師向けの認証画面です。
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-800">
            メールアドレス
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-800">パスワード</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        {message ? (
          <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isLoading
            ? "処理中..."
            : mode === "login"
              ? "ログインする"
              : "登録する"}
        </button>
      </form>
    </section>
  );
}
