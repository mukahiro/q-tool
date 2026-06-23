import { FirebaseError } from "firebase/app";

export function getFirebaseAuthMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return "認証に失敗しました。時間をおいて再試行してください。";
  }

  switch (error.code) {
    case "auth/email-already-in-use":
      return "このメールアドレスはすでに登録されています。";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "メールアドレスまたはパスワードが正しくありません。";
    case "auth/weak-password":
      return "パスワードは6文字以上で入力してください。";
    case "auth/invalid-email":
      return "メールアドレスの形式が正しくありません。";
    default:
      return "認証に失敗しました。入力内容を確認してください。";
  }
}
