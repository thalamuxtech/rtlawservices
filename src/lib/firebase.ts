"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// The Firebase web configuration is public by design. Access to data is
// controlled by Firestore security rules (firestore.rules), not by hiding it.
const firebaseConfig = {
  apiKey: "AIzaSyDUwp_5XYzduoAyY9HEbiXT8ktKPPsSS4c",
  authDomain: "rtlawservice.firebaseapp.com",
  projectId: "rtlawservice",
  storageBucket: "rtlawservice.firebasestorage.app",
  messagingSenderId: "932745616445",
  appId: "1:932745616445:web:2b2ca1927b82381b339e54",
  measurementId: "G-TRL5XPGMHC",
};

export function firebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function db(): Firestore {
  return getFirestore(firebaseApp());
}

export function auth(): Auth {
  return getAuth(firebaseApp());
}

export async function startAnalytics() {
  if (typeof window === "undefined") return;
  const { isSupported, getAnalytics } = await import("firebase/analytics");
  if (await isSupported()) getAnalytics(firebaseApp());
}
