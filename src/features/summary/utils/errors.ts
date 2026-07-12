export const SUMMARY_ERROR_MESSAGES = {
  NOT_LOGGED_IN: "ログイン状態を確認できません。再度ログインしてください。",
  ROOM_NOT_FOUND: "ルームが見つかりません。",
  NOT_AUTHORIZED: "このルームを操作する権限がありません。",
  NO_ACTIVE_SECTION: "終了できるセクションがありません。",
  SECTION_NOT_FOUND: "現在のセクションが見つかりません。",
  SECTION_ALREADY_COMPLETED: "このセクションはすでに終了しています。",
  GEMINI_API_KEY_MISSING:
    "AI要約の準備が完了していません。管理者に確認してください。",
  SUMMARY_FAILED:
    "セクションの終了と要約に失敗しました。時間をおいてもう一度お試しください。",
  ROOM_END_SUMMARY_FAILED:
    "ルームの終了と授業全体への質問の要約に失敗しました。時間をおいてもう一度お試しください。",
  FETCH_FAILED:
    "要約一覧を読み込めませんでした。時間をおいてもう一度お試しください。",
} as const;
