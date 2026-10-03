// Merges content published from the back office (pulled from Firestore at
// build time into generated/live.json by scripts/pull-content.mjs) over the
// seed content in this folder. If the pull could not reach Firestore, the
// seeds are used, so the site always builds.

import liveJson from "./generated/live.json";
import { SEED_ATTORNEYS, SEED_CASES, SEED_REVIEWS } from "./proof";
import { SEED_POSTS } from "./seed-posts";
import type { Attorney, CaseResult, Post, Review, SiteSettings } from "./types";

type Live = {
  source: "firestore" | "none";
  site?: Partial<SiteSettings>;
  attorneys?: Attorney[];
  cases?: CaseResult[];
  reviews?: Review[];
  posts?: Post[];
};

const live = liveJson as unknown as Live;
const fromStore = live.source === "firestore";

// Records flagged demo are fictional placeholders kept for the back office.
// They are never published, so the public site shows only real material.
const visible = <T extends { demo?: boolean }>(rows: T[]) => rows.filter((r) => !r.demo);

const pick = <T,>(remote: T[] | undefined, seed: T[]) => (fromStore && remote && remote.length ? remote : seed);

export const LIVE_SITE: Partial<SiteSettings> = live.site ?? {};

export const ATTORNEYS: Attorney[] = visible(pick(live.attorneys, SEED_ATTORNEYS)).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
export const CASES: CaseResult[] = visible(pick(live.cases, SEED_CASES));
export const REVIEWS: Review[] = visible(pick(live.reviews, SEED_REVIEWS)).sort((a, b) => b.date.localeCompare(a.date));
export const POSTS: Post[] = pick(live.posts, SEED_POSTS).sort((a, b) => b.published.localeCompare(a.published));

export const getAttorney = (slug: string) => ATTORNEYS.find((a) => a.slug === slug);
export const getCase = (slug: string) => CASES.find((c) => c.slug === slug);
export const getPost = (slug: string) => POSTS.find((p) => p.slug === slug);
export const casesFor = (expertise: string) => CASES.filter((c) => c.expertise === expertise);
export const reviewsFor = (expertise: string) => REVIEWS.filter((r) => r.expertise === expertise);
export const casesByAttorney = (slug: string) => CASES.filter((c) => c.attorney === slug);
