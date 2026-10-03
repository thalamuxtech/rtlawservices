"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { firebaseConfig } from "./firebase-config";

export function firebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function db(): Firestore {
  return getFirestore(firebaseApp());
}

export function auth(): Auth {
  return getAuth(firebaseApp());
}
