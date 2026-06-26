import { cookies } from "next/headers";

const AUTH_COOKIE_NAME = "q_tool_firebase_id_token";

type FirebaseLookupResponse = {
  users?: {
    localId?: string;
    email?: string;
  }[];
};

export type VerifiedTeacher = {
  uid: string;
  email: string | null;
  idToken: string;
};

export async function getVerifiedTeacherFromAuthCookie(): Promise<VerifiedTeacher | null> {
  const cookieStore = await cookies();
  const idToken = cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;

  if (!idToken) {
    return null;
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!apiKey) {
    console.error("Firebase API key is missing.");
    return null;
  }

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as FirebaseLookupResponse;
    const user = data.users?.[0];

    if (!user?.localId) {
      return null;
    }

    return {
      uid: user.localId,
      email: user.email ?? null,
      idToken,
    };
  } catch (error) {
    console.error("Firebase auth token verification failed:", error);
    return null;
  }
}
