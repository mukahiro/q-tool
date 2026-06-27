import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getFirebasePrivateKey() {
  return process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
}

function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getFirebasePrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin SDK の環境変数が設定されていません。FIREBASE_PROJECT_ID、FIREBASE_CLIENT_EMAIL、FIREBASE_PRIVATE_KEY を確認してください。",
    );
  }

  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export function getFirebaseAdminAuth() {
  initializeFirebaseAdmin();
  return getAuth();
}

export function getFirebaseAdminDb() {
  initializeFirebaseAdmin();
  return getFirestore();
}
