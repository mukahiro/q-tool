"use client";

import { onIdTokenChanged } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { clearAuthToken, saveAuthToken } from "../actions";
import { getFirebaseAuth } from "@/lib/firebase/client";

let lastSyncedToken: string | null | undefined;

/**
 * Firebase Auth のログイン状態を、サーバーが読む httpOnly Cookie に同期する。
 * ログイン済みのまま直接ページを開いた時も、認証 Cookie を復旧できるようにする。
 */
export function AuthStateSync({
  initialHasAuthToken,
}: {
  initialHasAuthToken: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let isActive = true;

    try {
      const firebaseAuth = getFirebaseAuth();

      const unsubscribe = onIdTokenChanged(firebaseAuth, (user) => {
        void (async () => {
          try {
            if (!user) {
              if (!initialHasAuthToken) {
                lastSyncedToken = null;
                return;
              }

              if (lastSyncedToken === null) {
                return;
              }

              lastSyncedToken = null;
              await clearAuthToken();

              if (initialHasAuthToken) {
                router.refresh();
              }

              return;
            }

            const idToken = await user.getIdToken();

            if (!isActive || lastSyncedToken === idToken) {
              return;
            }

            const result = await saveAuthToken(idToken);

            if (!result.ok) {
              console.error(
                "ログイン状態の同期に失敗しました:",
                result.message,
              );
              return;
            }

            lastSyncedToken = idToken;

            if (pathname === "/login") {
              router.replace("/dashboard");
              return;
            }

            if (!initialHasAuthToken) {
              router.refresh();
            }
          } catch (error) {
            console.error("Firebase auth state sync failed:", error);
          }
        })();
      });

      return () => {
        isActive = false;
        unsubscribe();
      };
    } catch (error) {
      console.error("Firebase initialize failed:", error);
    }

    return () => {
      isActive = false;
    };
  }, [initialHasAuthToken, pathname, router]);

  return null;
}
