"use client";

// Loads the Firestore library on demand, so public pages and the pages they
// prefetch do not carry it until a visitor submits a form or opens the
// booking calendar.
export async function store() {
  const [{ getApp, getApps, initializeApp }, fs, { firebaseConfig }] = await Promise.all([
    import("firebase/app"),
    import("firebase/firestore"),
    import("./firebase-config"),
  ]);
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return { fs, db: fs.getFirestore(app) };
}
