// Pulls published content from Firestore before each build and writes it to
// src/content/generated/live.json. Uploaded images (redacted approval
// documents, attorney portraits) are written to public/media so pages
// reference small files instead of inline data.
//
// Only published records are readable by the public, and this script reads
// them the same way a visitor would, with the public web API key.

import { createHash } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";

const PROJECT = "rtlawservice";
const KEY = "AIzaSyDUwp_5XYzduoAyY9HEbiXT8ktKPPsSS4c";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const OUT = "src/content/generated/live.json";
const MEDIA = "public/media";
const digest = createHash("sha256");

function decode(v) {
  if (v == null) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(decode);
  if ("mapValue" in v) return fields(v.mapValue.fields || {});
  return null;
}
const fields = (f) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, decode(v)]));

// Retries transient network failures with a short backoff.
async function fetchRetry(url, init, tries = 4) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, init);
      if (res.status >= 500 && i < tries) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      if (i >= tries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
    }
  }
}

async function published(collection) {
  const res = await fetchRetry(`${BASE}:runQuery?key=${KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: { fieldFilter: { field: { fieldPath: "status" }, op: "EQUAL", value: { stringValue: "published" } } },
      },
    }),
  });
  if (!res.ok) throw new Error(`${collection}: HTTP ${res.status}`);
  const rows = await res.json();
  return rows.filter((r) => r.document).map((r) => ({ _id: r.document.name.split("/").pop(), ...fields(r.document.fields || {}) }));
}

async function doc(path) {
  const res = await fetchRetry(`${BASE}/${path}?key=${KEY}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return fields((await res.json()).fields || {});
}

function saveImage(dataUrl, name) {
  const m = /^data:image\/(webp|jpeg|png);base64,(.+)$/.exec(dataUrl || "");
  if (!m) return undefined;
  digest.update(m[2]);
  const file = `${name}.${m[1] === "jpeg" ? "jpg" : m[1]}`;
  writeFileSync(`${MEDIA}/${file}`, Buffer.from(m[2], "base64"));
  return `/media/${file}`;
}

const INTERNAL = new Set(["_id", "status", "updatedAt", "updatedBy", "documentImage", "photo"]);
const strip = (row) => Object.fromEntries(Object.entries(row).filter(([k]) => !INTERNAL.has(k)));

async function main() {
  let live = { source: "none" };
  try {
    const [site, attorneys, cases, reviews, posts] = await Promise.all([
      doc("settings/site"),
      published("attorneys"),
      published("cases"),
      published("reviews"),
      published("posts"),
    ]);
    rmSync(MEDIA, { recursive: true, force: true });
    mkdirSync(MEDIA, { recursive: true });
    live = {
      source: "firestore",
      site: site ? strip(site) : undefined,
      attorneys: attorneys.map((a) => ({ ...strip(a), slug: a.slug || a._id, photoUrl: saveImage(a.photo, `attorney-${a._id}`) })),
      cases: cases.map((c) => ({ ...strip(c), slug: c.slug || c._id, documentUrl: saveImage(c.documentImage, `approval-${c._id}`) })),
      reviews: reviews.map((r) => ({ ...strip(r), id: r._id })),
      posts: posts.map((p) => ({ ...strip(p), slug: p.slug || p._id })),
    };
    console.log(
      `pull-content: ${live.attorneys.length} attorneys, ${live.cases.length} cases, ${live.reviews.length} reviews, ${live.posts.length} posts`,
    );
  } catch (err) {
    // In CI, never publish fallback content in place of the live content.
    if (process.env.CI) {
      console.error(`pull-content: Firestore unavailable (${err.message}). Stopping the build.`);
      process.exit(1);
    }
    console.warn(`pull-content: Firestore unavailable (${err.message}). Using seed content.`);
  }
  mkdirSync("src/content/generated", { recursive: true });
  mkdirSync("public", { recursive: true });
  const json = JSON.stringify(live, null, 2);
  writeFileSync(OUT, json);
  const hash = digest.update(json).digest("hex").slice(0, 16);
  writeFileSync("public/build-meta.json", JSON.stringify({ contentHash: hash, builtAt: new Date().toISOString() }));
  console.log(`pull-content: content hash ${hash}`);
}

await main();
