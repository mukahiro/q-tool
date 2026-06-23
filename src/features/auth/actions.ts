"use server";

import { cookies } from "next/headers";
import { z } from "zod";

const AUTH_COOKIE_NAME = "q_tool_firebase_id_token";

const idTokenSchema = z
  .string()
  .min(20, "ログイン情報が正しくありません。もう一度ログインしてください。");

type AuthActionResult = {
  ok: boolean;
  message?: string;
};

export async function saveAuthToken(idToken: string): Promise<AuthActionResult> {
  const parsedToken = idTokenSchema.safeParse(idToken);

  if (!parsedToken.success) {
    return {
      ok: false,
      message: parsedToken.error.issues[0]?.message,
    };
  }

  try {
    const cookieStore = await cookies();

    // Firebase の ID トークンは短命です。クライアント側の認証状態変更時に更新します。
    cookieStore.set(AUTH_COOKIE_NAME, parsedToken.data, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });

    return { ok: true };
  } catch (error) {
    console.error("Firebase auth cookie save failed:", error);

    return {
      ok: false,
      message: "ログイン状態の保存に失敗しました。時間をおいて再試行してください。",
    };
  }
}

export async function clearAuthToken(): Promise<AuthActionResult> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);

    return { ok: true };
  } catch (error) {
    console.error("Firebase auth cookie clear failed:", error);

    return {
      ok: false,
      message: "ログアウト処理に失敗しました。時間をおいて再試行してください。",
    };
  }
}

export async function getAuthToken() {
  const cookieStore = await cookies();

  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}
