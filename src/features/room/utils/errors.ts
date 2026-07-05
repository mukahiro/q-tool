/**
 * ルーム関連のエラーメッセージを定義
 */

export const ROOM_ERROR_MESSAGES = {
  NOT_FOUND: "ルームが見つかりません。",
  NOT_AUTHORIZED: "このルームにアクセスする権限がありません。",
  NOT_LOGGED_IN: "ログインして下さい。",
  FETCH_FAILED:
    "ルーム情報の取得に失敗しました。時間をおいて再試行してください。",
} as const;
