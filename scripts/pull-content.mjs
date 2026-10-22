// Pulls published content from the live site before each build and writes it
// to src/content/generated/live.json, so pages are prerendered with it.
// Uploaded images stay where they are: pages link to them under /api/media/.
//
// CONTENT_URL picks the site to read from. It defaults to the live domain.

import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";

const SITE = (process.env.CONTENT_URL || "https://rtlawservices.com").replace(/\/$/, "");
const OUT = "src/content/generated/live.json";

// Retries transient network failures with a short backoff.
async function fetchRetry(url, tries = 4) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.status >= 500 && i < tries) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      if (i >= tries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
    }
  }
}

async function main() {
  let live = { source: "none" };
  try {
    const res = await fetchRetry(`${SITE}/api/content`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    live = await res.json();
    if (live.source !== "database") throw new Error("unexpected answer");
    console.log(
      `pull-content: ${live.attorneys.length} attorneys, ${live.cases.length} cases, ${live.reviews.length} reviews, ${live.posts.length} posts from ${SITE}`,
    );
  } catch (err) {
    // In CI, never publish fallback content in place of the live content.
    if (process.env.CI) {
      console.error(`pull-content: ${SITE} unavailable (${err.message}). Stopping the build.`);
      process.exit(1);
    }
    console.warn(`pull-content: ${SITE} unavailable (${err.message}). Using seed content.`);
  }
  mkdirSync("src/content/generated", { recursive: true });
  mkdirSync("public", { recursive: true });
  const json = JSON.stringify(live, null, 2);
  writeFileSync(OUT, json);
  const hash = createHash("sha256").update(json).digest("hex").slice(0, 16);
  writeFileSync("public/build-meta.json", JSON.stringify({ contentHash: hash, builtAt: new Date().toISOString() }));
  console.log(`pull-content: content hash ${hash}`);
}

await main();
