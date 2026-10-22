"use client";

// Keeps the public pages in step with the back office. Pages are prerendered
// with the content of the last build, so visitors and search engines get a
// complete page at once. On every page view this provider then reads the newest
// published content from /api/content and re-renders the page with it. A change
// saved in the back office therefore shows on the next page load, before any rebuild.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BUILD_LIVE, type LiveData } from "./live";
import { buildContent, type Content } from "./model";

const BUILD = buildContent(BUILD_LIVE);

type Value = { content: Content; /** True once the newest published content has been read. */ fresh: boolean };

const Ctx = createContext<Value>({ content: BUILD, fresh: false });

export function LiveContentProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<Value>({ content: BUILD, fresh: false });
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/content")
      .then((r) => (r.ok ? (r.json() as Promise<LiveData>) : Promise.reject(new Error(String(r.status)))))
      .then((live) => !cancelled && setValue({ content: buildContent(live), fresh: true }))
      // Offline, or the local development server without the back end: keep the build content.
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
