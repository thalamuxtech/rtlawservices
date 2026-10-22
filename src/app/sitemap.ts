import type { MetadataRoute } from "next";
import { EXPERTISE } from "@/content/expertise";
import { ATTORNEYS, CASES, POSTS } from "@/content/live";
import { SITE } from "@/content/site";

export const dynamic = "force-static";

// Pages that change only when the site is rebuilt carry the build date; blog
// posts carry the date they were last updated, so crawlers revisit them when
// they change. Legal pages are listed but rarely change.
const STATIC = [
  "", "start-here", "expertise", "case-results", "attorneys", "reviews", "about", "how-we-work", "diaspora", "faq",
  "resources", "resources/filing-fees", "resources/processing-times", "resources/visa-bulletin", "resources/case-status",
  "case-status-tracker", "book", "contact", "blog", "knowledge", "free-evaluation", "check-eligibility",
  "legal/disclaimer", "legal/privacy", "legal/terms", "accessibility",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const built = new Date();
  const url = (path: string) => `${SITE.url}/${path}${path ? "/" : ""}`;
  return [
    ...STATIC.map((p) => ({ url: url(p), lastModified: built })),
    ...EXPERTISE.map((e) => ({ url: url(`expertise/${e.slug}`), lastModified: built })),
    ...CASES.map((c) => ({ url: url(`case-results/${c.slug}`), lastModified: built })),
    ...ATTORNEYS.map((a) => ({ url: url(`attorneys/${a.slug}`), lastModified: built })),
    ...POSTS.map((p) => ({ url: url(`blog/${p.slug}`), lastModified: new Date(p.updated || p.published) })),
  ];
}
