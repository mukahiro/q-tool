import type { Timestamp } from "firebase/firestore";

export function formatQuestionCreatedAt(value: Timestamp | null | undefined) {
  if (!value) {
    return "投稿時刻不明";
  }

  return value.toDate().toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
