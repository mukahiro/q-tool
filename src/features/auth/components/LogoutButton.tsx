"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearAuthToken } from "../actions";
import { getFirebaseAuth } from "@/lib/firebase/client";

type LogoutButtonProps = {
  className?: string;
  wrapperClassName?: string;
};

export function LogoutButton({
  className = "",
  wrapperClassName = "",
}: LogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLogout() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const firebaseAuth = getFirebaseAuth();
      await signOut(firebaseAuth);
      const result = await clearAuthToken();

      if (!result.ok) {
        setErrorMessage(result.message ?? "ログアウト処理に失敗しました。");
        return;
      }

      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Firebase sign out failed:", error);
      setErrorMessage("ログアウトに失敗しました。時間をおいて再試行してください。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={`flex flex-col items-start gap-2 ${wrapperClassName}`}>
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoading}
        className={`inline-flex min-h-10 items-center justify-center rounded-md border border-slate-950 bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-400 disabled:bg-slate-400 disabled:text-slate-200 ${className}`}
      >
        {isLoading ? "処理中..." : "ログアウト"}
      </button>
      {errorMessage ? (
        <p className="max-w-60 text-sm text-rose-700">{errorMessage}</p>
      ) : null}
    </div>
  );
}
