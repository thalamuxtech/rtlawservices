"use client";

// Keeps the public pages in step with the back office. Pages are prerendered
// with the content of the last build, so visitors and search engines get a
// complete page at once. On every page view this provider then reads the newest
// published content (one Firestore document, public/live, written by the back
// office on each save) and re-renders the page with it. A change saved in the
// back office therefore shows on the next page load, before any rebuild.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getApp, getApps, initializeApp } from "firebase/app";
import { doc, getDoc, getFirestore } from "firebase/firestore/lite";
import { firebaseConfig } from "@/lib/firebase-config";
import { BUILD_LIVE, type LiveData } from "./live";
import { buildContent, type Content } from "./model";

const BUILD = buildContent(BUILD_LIVE);

type Value = { content: Content; /** True once the newest published content has been read. */ fresh: boolean };

const Ctx = createContext<Value>({ content: BUILD, fresh: false });

// Uploaded images are written to files at build time and left out of
// public/live to keep it small, so they come from the build by slug. A new
// image appears once the next build finishes.
function withBuildImages(live: LiveData): LiveData {
  const photo = new Map((BUILD_LIVE.attorneys ?? []).map((a) => [a.slug, a.photoUrl]));
  const document = new Map((BUILD_LIVE.cases ?? []).map((c) => [c.slug, c.documentUrl]));
  return {
    ...live,
    attorneys: live.attorneys?.map((a) => ({ ...a, photoUrl: photo.get(a.slug) })),
    cases: live.cases?.map((c) => ({ ...c, documentUrl: document.get(c.slug) })),
  };
}

export function LiveContentProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<Value>({ content: BUILD, fresh: false });
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    getDoc(doc(getFirestore(app), "public", "live"))
      .then((snap) => {
        if (cancelled) return;
        const data = snap.data() as LiveData | undefined;
        // No live document yet: the build content is the newest there is.
        setValue({ content: data ? buildContent(withBuildImages({ ...data, source: "firestore" })) : BUILD, fresh: true });
      })
      // Offline or blocked: keep showing the build content.
      .catch(() => !cancelled && setValue((v) => ({ ...v, fresh: true })));
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** The newest published content, falling back to the build's content. */
export const useContent = () => useContext(Ctx).content;

/** Whether the newest published content has been read, so a missing record really is missing. */
export const useContentFresh = () => useContext(Ctx).fresh;
