// Checks every built page in out/ for the basics search engines and AI
// systems rely on. Run after `npm run build`: node scripts/seo-audit.mjs
//
// Per page: a unique title and description, a canonical address that matches
// the page, Open Graph tags, one H1, headings in order, alt text on images,
// and structured data that parses. Exits with code 1 if anything fails.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SITE = "https://rtlawservices.com";
const OUT = "out";
const SKIP = /^(admin|_next|404|api|og|brand|images|media)(\/|$)/;

function pages(dir = OUT, rel = "") {
  const found = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const r = rel ? `${rel}/${name}` : name;
    if (SKIP.test(r)) continue;
    if (statSync(full).isDirectory()) found.push(...pages(full, r));
    else if (name === "index.html") found.push({ file: full, path: `/${rel}${rel ? "/" : ""}` });
  }
  return found;
}

const attr = (tag, name) => new RegExp(`${name}="([^"]*)"`).exec(tag)?.[1];
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const meta = (html, key, value) => {
  for (const m of html.matchAll(/<meta [^>]*>/g)) if (attr(m[0], key) === value) return decode(attr(m[0], "content") ?? "");
  return null;
};

const problems = [];
const titles = new Map();
const descriptions = new Map();
const types = new Map();
const list = pages();

for (const { file, path } of list) {
  const html = readFileSync(file, "utf8");
  const issue = (msg) => problems.push(`${path}  ${msg}`);
  if (/<meta name="robots" content="[^"]*noindex/.test(html)) continue;
  if (path === "/case-results/none/" || path === "/blog/none/") continue;

  const title = decode(/<title>([^<]*)<\/title>/.exec(html)?.[1] ?? "");
  if (!title) issue("no title");
  else titles.set(title, [...(titles.get(title) ?? []), path]);
  if (title.length > 70) issue(`title is ${title.length} characters (about 60 or fewer shows in full)`);

  const desc = meta(html, "name", "description");
  if (!desc) issue("no meta description");
  else {
    descriptions.set(desc, [...(descriptions.get(desc) ?? []), path]);
    if (desc.length < 50 || desc.length > 170) issue(`description is ${desc.length} characters (aim for 50 to 160)`);
  }

  const canonical = /<link rel="canonical" href="([^"]*)"/.exec(html)?.[1];
  if (!canonical) issue("no canonical link");
  else if (canonical !== `${SITE}${path}`) issue(`canonical ${canonical} does not match the page`);
  const ogUrl = meta(html, "property", "og:url");
  if (ogUrl !== `${SITE}${path}`) issue(`og:url is ${ogUrl ?? "missing"}`);
  if (!meta(html, "property", "og:image")) issue("no og:image");

  const body = html.replace(/<script[\s\S]*?<\/script>/g, "");
  const h1 = (body.match(/<h1[\s>]/g) ?? []).length;
  if (h1 !== 1) issue(`${h1} H1 headings`);
  let last = 0;
  for (const m of body.matchAll(/<h([1-6])[\s>]/g)) {
    const level = Number(m[1]);
    if (last && level > last + 1) {
      issue(`heading jumps from H${last} to H${level}`);
      break;
    }
    last = level;
  }
  for (const m of body.matchAll(/<img [^>]*>/g)) if (attr(m[0], "alt") === undefined) issue(`image without alt: ${attr(m[0], "src")}`);

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1]);
      for (const node of data["@graph"] ?? [data]) for (const t of [node["@type"]].flat()) types.set(t, (types.get(t) ?? 0) + 1);
    } catch {
      issue("structured data does not parse");
    }
  }
}

for (const [t, paths] of titles) if (paths.length > 1) problems.push(`duplicate title "${t}" on ${paths.join(", ")}`);
for (const [d, paths] of descriptions) if (paths.length > 1) problems.push(`duplicate description on ${paths.join(", ")}: "${d.slice(0, 60)}..."`);

console.log(`Checked ${list.length} pages.`);
console.log("Structured data types:", Object.fromEntries([...types].sort()));
if (problems.length) {
  console.log(`\n${problems.length} problems:`);
  for (const p of problems) console.log(`- ${p}`);
  process.exitCode = 1;
} else console.log("No problems found.");
