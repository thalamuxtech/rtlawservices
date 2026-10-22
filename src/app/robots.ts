import type { MetadataRoute } from "next";
import { SITE } from "@/content/site";

export const dynamic = "force-static";

// The firm wants to be found and cited by search engines and AI answer
// services, so their crawlers are allowed by name as well as through "*".
// Naming them makes the policy explicit, and makes it easy to opt one out
// later, for example Google-Extended or GPTBot to keep content out of AI
// training while staying in search results.
const AI_CRAWLERS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User",
  "ClaudeBot", "Claude-SearchBot", "Claude-User",
  "PerplexityBot", "Perplexity-User",
  "Google-Extended", "Applebot", "Applebot-Extended",
  "Bingbot", "Googlebot",
];

// The staff portal and the site's own API are not content. Uploaded images
// under /api/media/ stay crawlable, so portraits and documents can appear in image search.
const rule = { allow: ["/", "/api/media/"], disallow: ["/admin/", "/api/"] };

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", ...rule }, { userAgent: AI_CRAWLERS, ...rule }],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
