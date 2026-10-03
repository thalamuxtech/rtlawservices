import type { MetadataRoute } from "next";
import { ARTICLES } from "@/content/articles";
import { EXPERTISE } from "@/content/expertise";
import { ATTORNEYS, CASES } from "@/content/proof";
import { SITE } from "@/content/site";

export const dynamic = "force-static";

const STATIC = [
  "", "start-here", "expertise", "case-results", "attorneys", "reviews", "about", "how-we-work", "diaspora", "faq",
  "resources", "resources/filing-fees", "resources/processing-times", "resources/visa-bulletin", "resources/case-status",
  "book", "contact", "legal/disclaimer", "legal/privacy", "legal/terms", "accessibility",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const urls = [
    ...STATIC,
    ...EXPERTISE.map((e) => `expertise/${e.slug}`),
    ...CASES.map((c) => `case-results/${c.slug}`),
    ...ATTORNEYS.map((a) => `attorneys/${a.slug}`),
    ...ARTICLES.map((a) => `resources/${a.slug}`),
  ];
  return urls.map((u) => ({ url: `${SITE.url}/${u}${u ? "/" : ""}`, lastModified: new Date("2026-10-03") }));
}
