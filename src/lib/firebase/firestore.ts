import { getFirestore } from "firebase/firestore";
import { getFirebaseApp } from "./app";

export function getFirebaseFirestore() {
  return getFirestore(getFirebaseApp());
}
