"use server";

import { z } from "zod";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import type { JoinRoomResult } from "./types";

const inviteCodeSchema = z
  .string()
  .length(6, "PINは6文字で入力してください。")
  .regex(
    /^[A-Z0-9]{6}$/,
    "PINは半角の大文字英数字で入力してください。",
  );

/**
 * 招待コードから学生が入室するルームを取得します。
 *
 * 学生はFirebase Authenticationへログインしないため、
 * Firebase Admin SDKを利用してサーバー側でFirestoreを参照します。
 */
export async function resolveJoinRoom(
  inviteCode: string,
): Promise<JoinRoomResult> {
  const normalizedCode = inviteCode.trim().toUpperCase();
  const parsedCode = inviteCodeSchema.safeParse(normalizedCode);

  if (!parsedCode.success) {
    return {
      status: "invalid-code",
      message:
        parsedCode.error.issues[0]?.message ??
        "PINの入力内容を確認してください。",
    };
  }

  try {
    const firestore = getFirebaseAdminDb();

    const inviteCodeSnapshot = await firestore
      .collection("inviteCodes")
      .doc(parsedCode.data)
      .get();

    if (!inviteCodeSnapshot.exists) {
      return {
        status: "not-found",
        message: "入力されたPINに対応するルームが見つかりません。",
      };
    }

    const roomId = inviteCodeSnapshot.get("room_id");

    if (typeof roomId !== "string" || roomId.trim().length === 0) {
      console.error("inviteCodesドキュメントにroom_idがありません", {
        inviteCode: parsedCode.data,
      });

      return {
        status: "error",
        message:
          "ルーム情報を読み込めませんでした。時間をおいてもう一度お試しください。",
      };
    }

    const roomSnapshot = await firestore
      .collection("rooms")
      .doc(roomId)
      .get();

    if (!roomSnapshot.exists) {
      return {
        status: "not-found",
        message: "このPINに対応するルームが見つかりません。",
      };
    }

    const roomData = roomSnapshot.data();

    if (!roomData) {
      console.error("roomsドキュメントのデータが空です", {
        roomId,
      });

      return {
        status: "error",
        message:
          "ルーム情報を読み込めませんでした。時間をおいてもう一度お試しください。",
      };
    }

    const roomName =
      typeof roomData.name === "string" && roomData.name.trim().length > 0
        ? roomData.name
        : "名称未設定のルーム";

    return {
      status: "success",
      roomId: roomSnapshot.id,
      roomName,
    };
  } catch (error) {
    console.error("学生用ルーム入室処理に失敗しました", error);

    return {
      status: "error",
      message:
        "ルームへの入室に失敗しました。時間をおいてもう一度お試しください。",
    };
  }
}
