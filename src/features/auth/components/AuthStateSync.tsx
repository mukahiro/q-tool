"use client";

import { onIdTokenChanged } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { clearAuthToken, saveAuthToken } from "../actions";
import { getFirebaseAuth } from "@/lib/firebase/client";

/**
 * Firebase Auth のログイン状態を、サーバーが読む httpOnly Cookie に同期する。
 * ログイン済みのまま直接ページを開いた時も、認証 Cookie を復旧できるようにする。
 */
export function AuthStateSync() {
  const pathname = usePathname();
  const router = useRouter();
  const lastSyncedTokenRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    let isActive = true;

    try {
      const firebaseAuth = getFirebaseAuth();

      const unsubscribe = onIdTokenChanged(firebaseAuth, (user) => {
        void (async () => {
          try {
            if (!user) {
              if (lastSyncedTokenRef.current === null) {
                return;
              }

              lastSyncedTokenRef.current = null;
              await clearAuthToken();
              router.refresh();
              return;
            }

            const idToken = await user.getIdToken();

            if (!isActive || lastSyncedTokenRef.current === idToken) {
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

            lastSyncedTokenRef.current = idToken;

            if (pathname === "/login") {
              router.replace("/dashboard");
              return;
            }

            router.refresh();
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
  }, [pathname, router]);

  return null;
}
