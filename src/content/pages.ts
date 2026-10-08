// Page text that staff can change in the back office (settings/pages).
// The defaults below are the current wording. A published value replaces its
// default at build time, and again in the browser when newer content is
// published (see LiveContent.tsx); an empty value falls back to the default, so
// a page never renders blank.

import liveJson from "./generated/live.json";
import type { Expertise, Faq } from "./expertise";

export type TitledText = { title: string; text: string };
export type FaqGroup = { group: string; items: Faq[] };

export type PagesContent = {
  firm: { tagline: string; description: string };
  home: { eyebrow: string; headline: string; lede: string; primaryCta: string; secondaryCta: string };
  about: {
    title: string;
    lede: string;
    storyHeading: string;
    storyText: string;
    timeline: { year: string; title: string; text: string }[];
    valuesHeading: string;
    values: TitledText[];
  };
  process: TitledText[];
  pillars: TitledText[];
  faqs: FaqGroup[];
  /** Overrides for practice area pages, keyed by slug. */
  expertise: Record<string, Partial<Omit<Expertise, "slug" | "track" | "icon">>>;
};

export const DEFAULT_PAGES: PagesContent = {
  firm: {
    tagline: "Committed to helping our clients succeed",
    description:
      "RT Law Services is a Maryland immigration law firm serving families, professionals and employers across the United States, with clear guidance for first-time applicants and exacting work on employment and extraordinary ability petitions.",
  },
  home: {
    eyebrow: "RT Law Services, immigration counsel",
    headline: "Focused immigration counsel, built around the details of your case.",
    lede: "From a first green card to an extraordinary ability petition. Clear guidance for first-time applicants and exacting work for professionals, founders and employers.",
    primaryCta: "Request a free evaluation",
    secondaryCta: "Book a consultation",
  },
  about: {
    title: "Built on a decade of serving families across borders",
    lede: "RT Law Services grew from a fiduciary practice into an immigration-led law firm. The constant has been clients whose lives and plans cross national borders.",
    storyHeading: "From fiduciary roots to immigration counsel",
    storyText:
      "Work with trusts, estates and cross-border business taught us that legal problems rarely stop at one border. Immigration became the centre of the practice because it decides where families can live and where professionals can build their careers.",
    timeline: [
      { year: "From 2015", title: "RT Fiduciary Services", text: "The practice began as a trust, estate and cross-border advisory business, serving families and companies with ties between the United States and West Africa." },
      { year: "Early years", title: "Diaspora Connect", text: "A seminar series created for the Pan-African diaspora in the United States, focused on business and investment links with home countries." },
      { year: "Today", title: "RT Law Services", text: "An immigration-led law practice serving families, professionals and employers across the United States, with estate planning for global families." },
    ],
    valuesHeading: "How we practise",
    values: [
      { title: "Knowledge first", text: "Advice rests on the law and the facts, checked before it is given." },
      { title: "Candour", text: "We explain risks plainly, including when a route is unlikely to succeed." },
      { title: "Care for the person", text: "Immigration decisions shape families and careers. We treat each case that way." },
    ],
  },
  process: [
    { title: "Assess", text: "We review your goals, history and documents, then explain which paths fit and what each involves. You leave the consultation with a clear next step." },
    { title: "Prepare", text: "We build the filing: forms, evidence and, where needed, a written legal argument. You receive a checklist and we review each document you send." },
    { title: "Represent", text: "We file, track the case and answer government requests. We prepare you for interviews and attend where the rules allow." },
    { title: "Plan ahead", text: "Approval is often one step in a longer path. We map the route from visa to green card to citizenship and flag dates to watch." },
    { title: "Stay compliant", text: "We help you and your employer keep status, renew on time and avoid errors that could affect future applications." },
  ],
  pillars: [
    { title: "Personal attention", text: "One case at a time. A named attorney leads your matter, and you can book directly with that attorney." },
    { title: "Honest assessment", text: "We tell you plainly how strong your case looks, including when a route is unlikely to succeed, before you commit to it." },
    { title: "Global families", text: "Video consultations scheduled in your own time zone, for clients across the United States and abroad." },
    { title: "Long-term planning", text: "From a first visa to citizenship and estate planning, we think in years, not single filings." },
  ],
  faqs: [],
  expertise: {},
};

const filled = (v: unknown) => (Array.isArray(v) ? v.length > 0 : typeof v === "string" ? v.trim() !== "" : v != null);

/** Keeps each default unless a non-empty published value exists. */
function merge<T extends Record<string, unknown>>(base: T, over?: Partial<T>): T {
  const out = { ...base };
  for (const [k, v] of Object.entries(over ?? {})) if (filled(v)) (out as Record<string, unknown>)[k] = v;
  return out;
}

/** Page text with published values laid over the defaults. */
export function mergePages(published: Partial<PagesContent> = {}) {
  return {
    firm: merge(DEFAULT_PAGES.firm, published.firm),
    home: merge(DEFAULT_PAGES.home, published.home),
    about: merge(DEFAULT_PAGES.about, published.about),
    process: filled(published.process) ? published.process! : DEFAULT_PAGES.process,
    pillars: filled(published.pillars) ? published.pillars! : DEFAULT_PAGES.pillars,
    faqs: published.faqs,
    expertise: published.expertise ?? {},
  };
}

export type Pages = ReturnType<typeof mergePages>;

/** Applies published overrides to a practice area, ignoring empty fields. */
export function applyOverrides<E extends Expertise>(pages: Pages, e: E): E {
  return merge(e as unknown as Record<string, unknown>, pages.expertise[e.slug] as Record<string, unknown>) as unknown as E;
}

type Raw = { source?: string; pages?: Partial<PagesContent> };
const raw = liveJson as unknown as Raw;

export const PAGES = mergePages(raw.source === "firestore" ? raw.pages : undefined);

export const withOverrides = <E extends Expertise>(e: E): E => applyOverrides(PAGES, e);
