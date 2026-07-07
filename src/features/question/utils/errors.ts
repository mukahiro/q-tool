export const QUESTION_ERROR_MESSAGES = {
  ROOM_NOT_FOUND: "ルームが見つかりません。",
  ROOM_CLOSED: "このルームは終了しているため、投稿できません。",
  SECTION_NOT_READY:
    "現在受付中のセクションがありません。先生がセクションを開始するまでお待ちください。",
  SESSION_REQUIRED:
    "学生セッションを確認できませんでした。入室画面から入り直してください。",
  QUESTION_NOT_FOUND: "対象の質問が見つかりません。",
  OWN_REACTION_NOT_ALLOWED: "自分の質問にはリアクションできません。",
  FETCH_FAILED:
    "質問の読み込みに失敗しました。時間をおいてもう一度お試しください。",
  POST_FAILED:
    "質問の投稿に失敗しました。時間をおいてもう一度お試しください。",
  REACTION_FAILED:
    "リアクションの更新に失敗しました。時間をおいてもう一度お試しください。",
} as const;
