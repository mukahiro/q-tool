"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { clearAuthToken, saveAuthToken } from "../actions";
import { getFirebaseAuthMessage } from "../utils/errors";
import { getFirebaseAuth } from "@/lib/firebase/client";

export type AuthMode = "login" | "signup";

export function useAuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const title = useMemo(
    () => (mode === "login" ? "教師ログイン" : "教師アカウント作成"),
    [mode],
  );

  useEffect(() => {
    let unsubscribe = () => {};

    try {
      const firebaseAuth = getFirebaseAuth();

      unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        setCurrentUser(user);

        if (user) {
          const token = await user.getIdToken();
          await saveAuthToken(token);
        } else {
          await clearAuthToken();
        }

        setIsLoading(false);
        router.refresh();
      });
    } catch (error) {
      console.error("Firebase initialize failed:", error);
      queueMicrotask(() => {
        setMessage(
          "Firebase の設定が不足しています。.env.local を確認してください。",
        );
        setIsLoading(false);
      });
    }

    return () => unsubscribe();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const firebaseAuth = getFirebaseAuth();
      const credential =
        mode === "login"
          ? await signInWithEmailAndPassword(firebaseAuth, email, password)
          : await createUserWithEmailAndPassword(firebaseAuth, email, password);

      const token = await credential.user.getIdToken();
      const result = await saveAuthToken(token);

      if (!result.ok) {
        setMessage(result.message ?? "ログイン状態を保存できませんでした。");
        return;
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      setMessage(getFirebaseAuthMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    setIsLoading(true);
    setMessage(null);

    try {
      const firebaseAuth = getFirebaseAuth();
      await signOut(firebaseAuth);
      await clearAuthToken();
      router.refresh();
    } catch (error) {
      console.error("Firebase sign out failed:", error);
      setMessage("ログアウトに失敗しました。時間をおいて再試行してください。");
    } finally {
      setIsLoading(false);
    }
  }

  return {
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
  };
}
