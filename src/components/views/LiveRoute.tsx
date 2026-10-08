"use client";

// A post, attorney or success story published after the last build has no
// prerendered page yet, so the host answers its address with the 404 page.
// This component runs there: it looks the address up in the newest published
// content and, if the record exists, renders the full page in the site layout.
// The next build then creates the real page.

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { MobileActionBar } from "@/components/site/Chrome";
import { MotionProvider } from "@/components/ui/MotionProvider";
import { RevealObserver } from "@/components/ui/RevealObserver";
import { LiveContentProvider, useContent, useContentFresh } from "@/content/LiveContent";
import { AttorneyView } from "./AttorneyView";
import { CaseView } from "./CaseView";
import { PostView } from "./PostView";

const ROUTE = /^\/(blog|attorneys|case-results)\/([^/]+)\/?$/;

function Resolve({ kind, slug, fallback }: { kind: string; slug: string; fallback: ReactNode }) {
  const { getPost, getAttorney, getCase } = useContent();
  const fresh = useContentFresh();
  const title =
    kind === "blog" ? getPost(slug)?.title : kind === "attorneys" ? getAttorney(slug)?.name : getCase(slug)?.title;

  useEffect(() => {
    if (title) document.title = `${title} | RT Law Services`;
  }, [title]);

  if (!fresh) return null;
  if (!title) return <>{fallback}</>;
  return (
    <MotionProvider>
      <Header />
      <main id="main">
        {kind === "blog" ? <PostView slug={slug} /> : kind === "attorneys" ? <AttorneyView slug={slug} /> : <CaseView slug={slug} />}
      </main>
      <Footer />
      <MobileActionBar />
      <RevealObserver />
    </MotionProvider>
  );
}

// The address does not change while this page is open, so there is nothing to subscribe to.
const noSubscription = () => () => {};

export function LiveRoute({ fallback }: { fallback: ReactNode }) {
  // The address is only known in the browser; the prerendered 404 page has none.
  const path = useSyncExternalStore(noSubscription, () => window.location.pathname, () => "");
  const match = path.match(ROUTE);

  if (!match) return <>{fallback}</>;
  return (
    <LiveContentProvider>
      <Resolve kind={match[1]} slug={decodeURIComponent(match[2])} fallback={fallback} />
    </LiveContentProvider>
  );
}
