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

// Uploaded images are written to files at build time and listed in public/live
// only by fingerprint, to keep it small. An image whose fingerprint matches the
// build uses the build's file; a new or replaced one is read from its own
// record. A removed image disappears at once.
type Fetch = { col: "attorneys" | "cases"; id: string; slug: string; hash: string };

// Images already loaded in this visit, by fingerprint, so moving between pages
// does not download them again.
const loaded = new Map<string, Promise<string | undefined>>();

function withBuildImages(live: LiveData): { data: LiveData; fetches: Fetch[] } {
  const builtA = new Map((BUILD_LIVE.attorneys ?? []).map((a) => [a.slug, a]));
  const builtC = new Map((BUILD_LIVE.cases ?? []).map((c) => [c.slug, c]));
  const fetches: Fetch[] = [];
  const attorneys = live.attorneys?.map((a) => {
    const b = builtA.get(a.slug);
    if (!a.photoHash) return { ...a, photoUrl: undefined };
    if (b?.photoUrl && b.photoHash === a.photoHash) return { ...a, photoUrl: b.photoUrl };
    if (a._id) fetches.push({ col: "attorneys", id: a._id, slug: a.slug, hash: a.photoHash });
    return { ...a, photoUrl: b?.photoUrl };
  });
  const cases = live.cases?.map((c) => {
    const b = builtC.get(c.slug);
    if (!c.documentHash) return { ...c, documentUrl: undefined };
    if (b?.documentUrl && b.documentHash === c.documentHash) return { ...c, documentUrl: b.documentUrl };
    if (c._id) fetches.push({ col: "cases", id: c._id, slug: c.slug, hash: c.documentHash });
    return { ...c, documentUrl: b?.documentUrl };
  });
  return { data: { ...live, attorneys, cases }, fetches };
}

export function LiveContentProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<Value>({ content: BUILD, fresh: false });
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const store = getFirestore(app);
    getDoc(doc(store, "public", "live"))
      .then(async (snap) => {
        if (cancelled) return;
        const raw = snap.data() as LiveData | undefined;
        // No live document yet: the build content is the newest there is.
        if (!raw) return setValue({ content: BUILD, fresh: true });
        const { data, fetches } = withBuildImages({ ...raw, source: "firestore" });
        setValue({ content: buildContent(data), fresh: true });
        if (!fetches.length) return;
        // Images uploaded since the build, read from their own published records.
        const images = await Promise.all(
          fetches.map(async (f) => {
            const key = `${f.col}/${f.id}/${f.hash}`;
            if (!loaded.has(key))
              loaded.set(
                key,
                getDoc(doc(store, f.col, f.id))
                  .then((d) => d.data()?.[f.col === "attorneys" ? "photo" : "documentImage"] as string | undefined)
                  .catch(() => {
                    loaded.delete(key);
                    return undefined;
                  }),
              );
            return { ...f, url: await loaded.get(key) };
          }),
        );
        if (cancelled) return;
        const url = new Map(images.filter((i) => i.url).map((i) => [`${i.col}/${i.slug}`, i.url]));
        setValue({
          content: buildContent({
            ...data,
            attorneys: data.attorneys?.map((a) => ({ ...a, photoUrl: url.get(`attorneys/${a.slug}`) ?? a.photoUrl })),
            cases: data.cases?.map((c) => ({ ...c, documentUrl: url.get(`cases/${c.slug}`) ?? c.documentUrl })),
          }),
          fresh: true,
        });
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

/**
 * Keeps the browser tab title in step with a record edited since the build.
 * Uses the same pattern as the title template in app/layout.tsx.
 */
export function useLiveTitle(title?: string) {
  useEffect(() => {
    if (title) document.title = `${title} | RT Law Services`;
  }, [title]);
}

/** Whether the newest published content has been read, so a missing record really is missing. */
export const useContentFresh = () => useContext(Ctx).fresh;
