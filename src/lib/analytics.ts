"use client";

// Kept apart from lib/firebase.ts so ordinary pages load only the small
// Firebase core and analytics, not the database and sign-in libraries.
import { getApp, getApps, initializeApp } from "firebase/app";
import { firebaseConfig } from "./firebase-config";

export async function startAnalytics() {
  if (typeof window === "undefined") return;
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const { isSupported, getAnalytics } = await import("firebase/analytics");
  if (await isSupported()) getAnalytics(app);
}
