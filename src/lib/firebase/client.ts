"use client";

import { getAuth } from "firebase/auth";
import { getFirebaseApp } from "./app";

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}
