// Merges content published from the back office over the seed content in this
// folder. At build time the content comes from generated/live.json, pulled from
// Firestore by scripts/pull-content.mjs. In the browser, LiveContent.tsx runs
// the same merge on the newest published content, so edits show at once. If
// neither source is reachable, the seeds are used, so the site always builds.

import liveJson from "./generated/live.json";
import { SEED_ATTORNEYS, SEED_CASES, SEED_REVIEWS } from "./proof";
import { SEED_POSTS } from "./seed-posts";
import type { Attorney, CaseResult, Post, Review, SiteSettings } from "./types";
import type { PagesContent } from "./pages";

export type LiveData = {
  source: "firestore" | "none";
  site?: Partial<SiteSettings>;
  pages?: Partial<PagesContent>;
  attorneys?: Attorney[];
  cases?: CaseResult[];
  reviews?: Review[];
  posts?: Post[];
};

// Records flagged demo are fictional placeholders kept for the back office.
// Attorneys and cases flagged demo are never published. Reviews flagged demo
// are shown, with one note that they are illustrative, until real ones arrive.
const visible = <T extends { demo?: boolean }>(rows: T[]) => rows.filter((r) => !r.demo);

export const ILLUSTRATIVE_NOTE = "These reviews are illustrative examples while client reviews are being collected.";

export function deriveLive(live: LiveData) {
  const fromStore = live.source === "firestore";
  const pick = <T,>(remote: T[] | undefined, seed: T[]) => (fromStore && remote && remote.length ? remote : seed);

  const ATTORNEYS: Attorney[] = visible(pick(live.attorneys, SEED_ATTORNEYS)).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  const CASES: CaseResult[] = visible(pick(live.cases, SEED_CASES));
  const REVIEWS: Review[] = pick(live.reviews, SEED_REVIEWS).sort((a, b) => b.date.localeCompare(a.date));
  const POSTS: Post[] = pick(live.posts, SEED_POSTS).sort((a, b) => b.published.localeCompare(a.published));

  return {
    LIVE_SITE: (fromStore ? live.site : undefined) ?? ({} as Partial<SiteSettings>),
    ATTORNEYS,
    CASES,
    REVIEWS,
    // True while any published review is a fictional placeholder.
    REVIEWS_ILLUSTRATIVE: REVIEWS.some((r) => r.demo),
    POSTS,
    getAttorney: (slug: string) => ATTORNEYS.find((a) => a.slug === slug),
    getCase: (slug: string) => CASES.find((c) => c.slug === slug),
    getPost: (slug: string) => POSTS.find((p) => p.slug === slug),
    casesFor: (expertise: string) => CASES.filter((c) => c.expertise === expertise),
    reviewsFor: (expertise: string) => REVIEWS.filter((r) => r.expertise === expertise),
    casesByAttorney: (slug: string) => CASES.filter((c) => c.attorney === slug),
  };
}

export const BUILD_LIVE = liveJson as unknown as LiveData;

export const {
  LIVE_SITE,
  ATTORNEYS,
  CASES,
  REVIEWS,
  REVIEWS_ILLUSTRATIVE,
  POSTS,
  getAttorney,
  getCase,
  getPost,
  casesFor,
  reviewsFor,
  casesByAttorney,
} = deriveLive(BUILD_LIVE);
