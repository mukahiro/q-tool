"use server";

import type { DocumentData } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getVerifiedTeacherFromAuthCookie } from "@/features/auth/utils/server";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import type { ProfileFormState } from "./state";
import type { TeacherProfile } from "./types";

export type GetTeacherProfileResult =
  | {
      status: "success";
      email: string | null;
      profile: TeacherProfile | null;
    }
  | {
      status: "forbidden" | "error";
      message: string;
      email: null;
      profile: null;
    };

const profileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "ユーザー名を入力してください。")
    .max(40, "ユーザー名は40文字以内で入力してください。"),
  affiliation: z
    .string()
    .trim()
    .max(80, "所属は80文字以内で入力してください。")
    .optional(),
  subject: z
    .string()
    .trim()
    .max(80, "担当授業科目は80文字以内で入力してください。")
    .optional(),
  contactUrl: z
    .string()
    .trim()
    .max(200, "連絡用URLは200文字以内で入力してください。")
    .refine(
      (value) => value.length === 0 || isValidHttpUrl(value),
      "連絡用URLは http:// または https:// から始まるURLを入力してください。",
    )
    .optional(),
  bio: z
    .string()
    .trim()
    .max(300, "自己紹介は300文字以内で入力してください。")
    .optional(),
});

export async function getTeacherProfile(): Promise<GetTeacherProfileResult> {
  const teacher = await getVerifiedTeacherFromAuthCookie();

  if (!teacher) {
    return {
      status: "forbidden",
      message: "ログインが必要です。教師アカウントでログインしてください。",
      email: null,
      profile: null,
    };
  }

  try {
    const profileSnapshot = await getFirebaseAdminDb()
      .collection("teachers")
      .doc(teacher.uid)
      .get();

    return {
      status: "success",
      email: teacher.email,
      profile: profileSnapshot.exists
        ? toTeacherProfile(teacher.uid, profileSnapshot.data())
        : null,
    };
  } catch (error) {
    console.error("プロフィールの取得に失敗しました", error);

    return {
      status: "error",
      message:
        "プロフィールを読み込めませんでした。時間をおいてもう一度お試しください。",
      email: null,
      profile: null,
    };
  }
}

export async function saveTeacherProfile(
  _previousState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const teacher = await getVerifiedTeacherFromAuthCookie();

  if (!teacher) {
    return {
      ok: false,
      message: "ログイン状態を確認できません。再度ログインしてください。",
    };
  }

  const parsedFields = profileSchema.safeParse({
    username: formData.get("username"),
    affiliation: formData.get("affiliation"),
    subject: formData.get("subject"),
    contactUrl: formData.get("contactUrl"),
    bio: formData.get("bio"),
  });

  if (!parsedFields.success) {
    return {
      ok: false,
      message:
        parsedFields.error.issues[0]?.message ??
        "入力内容を確認してください。",
    };
  }

  try {
    const profileRef = getFirebaseAdminDb()
      .collection("teachers")
      .doc(teacher.uid);
    const profileSnapshot = await profileRef.get();
    const now = new Date();

    await profileRef.set(
      {
        uid: teacher.uid,
        email: teacher.email,
        username: parsedFields.data.username,
        affiliation: toNullableText(parsedFields.data.affiliation),
        subject: toNullableText(parsedFields.data.subject),
        contact_url: toNullableText(parsedFields.data.contactUrl),
        bio: toNullableText(parsedFields.data.bio),
        updated_at: now,
        ...(profileSnapshot.exists ? {} : { created_at: now }),
      },
      { merge: true },
    );

    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard");

    return {
      ok: true,
      message: "プロフィールを保存しました。",
    };
  } catch (error) {
    console.error("プロフィールの保存に失敗しました", error);

    return {
      ok: false,
      message:
        "プロフィールの保存に失敗しました。時間をおいてもう一度お試しください。",
    };
  }
}

function toTeacherProfile(
  uid: string,
  data: DocumentData | undefined,
): TeacherProfile {
  return {
    uid,
    username: toStringValue(data?.username),
    affiliation: toNullableText(data?.affiliation),
    subject: toNullableText(data?.subject),
    contactUrl: toNullableText(data?.contact_url),
    bio: toNullableText(data?.bio),
    updatedAt: toIsoString(data?.updated_at),
  };
}

function toStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toNullableText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function toIsoString(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }

  return null;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
