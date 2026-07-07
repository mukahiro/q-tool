const STUDENT_SESSION_STORAGE_KEY = "q_tool_student_session_id";

/**
 * ブラウザに保存済みの学生セッションIDを取得します。
 * 存在しない場合は新しく生成してLocalStorageへ保存します。
 */
export function getOrCreateStudentSessionId(): string {
  const existingSessionId = window.localStorage
    .getItem(STUDENT_SESSION_STORAGE_KEY)
    ?.trim();

  if (existingSessionId) {
    return existingSessionId;
  }

  const newSessionId = crypto.randomUUID();

  window.localStorage.setItem(
    STUDENT_SESSION_STORAGE_KEY,
    newSessionId,
  );

  return newSessionId;
}

export function getStudentSessionId(): string | null {
  return (
    window.localStorage
      .getItem(STUDENT_SESSION_STORAGE_KEY)
      ?.trim() ?? null
  );
}