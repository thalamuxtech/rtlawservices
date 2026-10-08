"use client";

// Writes public/live: every published record the public website shows, in one
// document that the site reads on each page view (src/content/LiveContent.tsx).
// The back office rewrites it after each save, so edits show on the website at
// once. It mirrors scripts/pull-content.mjs, which does the same for the build.
// Uploaded images stay out of it, because they would push the document past
// Firestore's 1 MiB limit; the build turns them into files.

import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, Timestamp, where, type DocumentData } from "firebase/firestore";
import { db } from "./firebase";

const INTERNAL = new Set(["status", "updatedAt", "updatedBy", "documentImage", "photo"]);

/** Timestamps become ISO strings, as in the build's content file. */
const plain = (v: unknown): unknown =>
  v instanceof Timestamp
    ? v.toDate().toISOString()
    : Array.isArray(v)
      ? v.map(plain)
      : v && typeof v === "object"
        ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plain(x)]))
        : v;

const strip = (row: DocumentData) => plain(Object.fromEntries(Object.entries(row).filter(([k]) => !INTERNAL.has(k)))) as DocumentData;

async function published(name: string) {
  const snap = await getDocs(query(collection(db(), name), where("status", "==", "published")));
  return snap.docs.map((d) => ({ id: d.id, data: d.data() }));
}

async function setting(id: string) {
  const snap = await getDoc(doc(db(), "settings", id));
  return snap.exists() ? strip(snap.data()) : null;
}

export async function writeLiveContent() {
  const [site, pages, attorneys, cases, reviews, posts] = await Promise.all([
    setting("site"),
    setting("pages"),
    published("attorneys"),
    published("cases"),
    published("reviews"),
    published("posts"),
  ]);
  await setDoc(doc(db(), "public", "live"), {
    ...(site ? { site } : {}),
    ...(pages ? { pages } : {}),
    attorneys: attorneys.map((a) => ({ ...strip(a.data), slug: a.data.slug || a.id })),
    cases: cases.map((c) => ({ ...strip(c.data), slug: c.data.slug || c.id })),
    reviews: reviews.map((r) => ({ ...strip(r.data), id: r.id })),
    posts: posts.map((p) => ({ ...strip(p.data), slug: p.data.slug || p.id })),
    version: serverTimestamp(),
  });
}
