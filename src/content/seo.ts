// Page metadata in one place: the canonical address, and the Open Graph and
// Twitter (X) tags that link previews use, all from a page's path, title and
// description. Next.js replaces the root layout's openGraph object instead of
// merging it, so every page sets the full set here.

import type { Metadata } from "next";

export const OG_IMAGE = { url: "/og/rt-law-services.png", width: 1200, height: 630, alt: "RT Law Services, immigration law" };

type PageMeta = {
  title: string;
  /** Use the title as written, without the " | RT Law Services" suffix, as on the home page. */
  absoluteTitle?: boolean;
  description?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
};

const SUFFIX = " | RT Law Services";

/** Search results show about 160 characters of a description; longer ones are cut at a word. */
export function clip(text: string | undefined, max = 158) {
  if (!text || text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\s]+$/, "")}…`;
}

/** Metadata for the page at `path`, written with leading and trailing slashes ("/about/"). */
export function page(path: string, input: PageMeta): Metadata {
  const m = { ...input, description: clip(input.description) };
  // Results show about 60 characters of a title, so a long title drops the firm-name suffix.
  const absolute = m.absoluteTitle || m.title.length + SUFFIX.length > 65;
  return {
    title: absolute ? { absolute: m.title } : m.title,
    description: m.description,
    alternates: { canonical: path },
    openGraph: {
      type: m.type ?? "website",
      siteName: "RT Law Services",
      locale: "en_US",
      url: path,
      title: m.title,
      description: m.description,
      images: [OG_IMAGE],
      ...(m.publishedTime ? { publishedTime: m.publishedTime } : {}),
      ...(m.modifiedTime ? { modifiedTime: m.modifiedTime } : {}),
    },
    twitter: { card: "summary_large_image", title: m.title, description: m.description, images: [OG_IMAGE.url] },
    ...(m.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
