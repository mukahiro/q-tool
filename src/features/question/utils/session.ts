export const STUDENT_SESSION_STORAGE_KEY = "student_session_id";

export function getOrCreateStudentSessionId() {
  const savedSessionId = window.localStorage.getItem(
    STUDENT_SESSION_STORAGE_KEY,
  );

  if (savedSessionId) {
    return savedSessionId;
  }

  const newSessionId =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `student_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  window.localStorage.setItem(STUDENT_SESSION_STORAGE_KEY, newSessionId);

  return newSessionId;
}
