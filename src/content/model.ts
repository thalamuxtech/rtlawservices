// Everything the public pages read, derived from one set of published content.
// The build uses it on generated/live.json; the browser uses it on the newest
// content in Firestore (public/live), so back-office edits show immediately.

import { deriveExpertise, type Track } from "./expertise";
import { deriveGeneral } from "./general";
import { deriveLive, type LiveData } from "./live";
import { mergePages } from "./pages";
import { deriveSite } from "./site";

export function buildContent(raw: LiveData) {
  const fromStore = raw.source === "firestore";
  const PAGES = mergePages(fromStore ? raw.pages : undefined);
  const live = deriveLive(raw);
  const EXPERTISE = deriveExpertise(PAGES);
  return {
    PAGES,
    ...live,
    ...deriveSite(live.LIVE_SITE, live.ATTORNEYS, live.CASES, PAGES),
    ...deriveGeneral(PAGES),
    EXPERTISE,
    byTrack: (track: Track) => EXPERTISE.filter((e) => e.track === track),
    getExpertise: (slug: string) => EXPERTISE.find((e) => e.slug === slug),
  };
}

export type Content = ReturnType<typeof buildContent>;
