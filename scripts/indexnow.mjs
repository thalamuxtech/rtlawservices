// Tells IndexNow search engines (Bing, Yandex, Seznam, Naver) about every URL
// in the sitemap after a deploy, so changes are picked up quickly. The key
// file public/<key>.txt proves the site owns the request. Google does not use
// IndexNow; it reads the sitemap through Search Console.
//
// Usage: node scripts/indexnow.mjs  (after the site is live)

import { readdirSync, readFileSync } from "node:fs";

const SITE = (process.env.CONTENT_URL || "https://rtlawservices.com").replace(/\/$/, "");
const keyFile = readdirSync("public").find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) throw new Error("IndexNow key file not found in public/");
const key = readFileSync(`public/${keyFile}`, "utf8").trim();

const sitemap = await (await fetch(`${SITE}/sitemap.xml`)).text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!urlList.length) throw new Error("No URLs found in the sitemap");

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(SITE).host, key, keyLocation: `${SITE}/${keyFile}`, urlList }),
});
// 200 and 202 both mean accepted.
console.log(`indexnow: ${urlList.length} URLs, answer ${res.status}`);
if (res.status >= 400) process.exitCode = 1;
