// One-off move of every record from Firestore to the Cloudflare D1 database
// and R2 storage. Safe to run again: each run replaces the D1 records with a
// fresh copy, keeps any password already set on the new site, and re-uploads
// files under the same names.
//
// Usage (project owner signed in to gcloud):
//   FIRESTORE_TOKEN=$(gcloud auth print-access-token) node scripts/migrate-firestore.mjs <work folder>
//
// The work folder receives client data (the SQL file and CVs), so keep it
// outside the repository and delete it afterwards.

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PROJECT = "rtlawservice";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const TOKEN = process.env.FIRESTORE_TOKEN;
const WORK = process.argv[2];
const DRY = process.argv.includes("--dry-run");
const BUCKET = "rtlawservices-files";
// Login-only addresses with no mailbox: their reset emails go to a real one.
const RECOVERY = { "admin@rtlawservices.com": "info@rtlawservices.com" };

if (!TOKEN || !WORK) {
  console.error("Usage: FIRESTORE_TOKEN=... node scripts/migrate-firestore.mjs <work folder> [--dry-run]");
  process.exit(1);
}
mkdirSync(join(WORK, "files"), { recursive: true });

const decode = (v) => {
  if (v == null) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return { __ts: new Date(v.timestampValue).toISOString() };
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(decode);
  if ("mapValue" in v) return fields(v.mapValue.fields || {});
  return null;
};
const fields = (f) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, decode(v)]));

async function list(path) {
  const out = [];
  let page = "";
  do {
    const res = await fetch(`${BASE}/${path}?pageSize=300${page ? `&pageToken=${page}` : ""}`, {
      headers: { Authorization: `Bearer ${TOKEN}`, "X-Goog-User-Project": PROJECT },
    });
    if (!res.ok) throw new Error(`${path}: HTTP ${res.status} ${await res.text()}`);
    const j = await res.json();
    for (const d of j.documents || []) out.push({ id: d.name.split("/").pop(), data: fields(d.fields || {}) });
    page = j.nextPageToken || "";
  } while (page);
  return out;
}

const q = (s) => (s == null ? "NULL" : `'${String(s).replace(/'/g, "''")}'`);
const sql = [];
const uploads = [];
let counts = {};

function upload(key, bytes, type) {
  const file = join(WORK, "files", key.replace(/\//g, "__"));
  writeFileSync(file, bytes);
  uploads.push({ key, file, type });
}

/** Moves an image held as a data URL into R2 and returns its new address. */
function image(col, id, dataUrl) {
  const m = /^data:image\/(webp|jpeg|png);base64,(.+)$/.exec(dataUrl || "");
  if (!m) return dataUrl ?? null;
  const bytes = Buffer.from(m[2], "base64");
  const name = `${col}-${id}-${createHash("sha256").update(bytes).digest("hex").slice(0, 16)}.${m[1] === "jpeg" ? "jpg" : m[1]}`;
  upload(`media/${name}`, bytes, `image/${m[1]}`);
  return `/api/media/${name}`;
}

function putDoc(col, id, data) {
  sql.push(`INSERT INTO docs (col, id, data) VALUES (${q(col)}, ${q(id)}, ${q(JSON.stringify(data))});`);
  counts[col] = (counts[col] || 0) + 1;
}

async function main() {
  sql.push("DELETE FROM docs;", "DELETE FROM slots;");

  for (const col of ["bookings", "messages", "reviews", "posts", "settings", "meta"]) {
    for (const d of await list(col)) putDoc(col, d.id, d.data);
  }

  for (const col of ["attorneys", "cases"]) {
    const field = col === "attorneys" ? "photo" : "documentImage";
    for (const d of await list(col)) {
      if (d.data[field]) d.data[field] = image(col, d.id, d.data[field]);
      putDoc(col, d.id, d.data);
    }
  }

  for (const d of await list("evaluations")) {
    if (d.data.file) {
      const chunks = (await list(`evaluations/${d.id}/files`)).sort((a, b) => a.data.index - b.data.index);
      if (chunks.length) {
        upload(`cv/${d.id}`, Buffer.from(chunks.map((c) => c.data.data).join(""), "base64"), d.data.file.type || "application/octet-stream");
        delete d.data.file.chunks;
      } else d.data.file = null;
    }
    putDoc("evaluations", d.id, d.data);
  }

  for (const d of await list("slots")) {
    const start = d.data.start?.__ts;
    if (!start || !d.data.bookingId) continue;
    sql.push(
      `INSERT INTO slots (id, attorney, day, start, booking_id, created_at) VALUES (${q(d.id)}, ${q(d.data.attorney)}, ${q(d.data.day)}, ${q(start)}, ${q(d.data.bookingId)}, ${q(d.data.createdAt?.__ts ?? new Date().toISOString())});`,
    );
    counts.slots = (counts.slots || 0) + 1;
  }

  // Staff keep their Firebase user ID, so the first sign-in can confirm the old password with Firebase.
  const missingEmail = [];
  for (const d of await list("staff")) {
    const email = String(d.data.email || "").toLowerCase();
    if (!email) {
      missingEmail.push(d.id);
      continue;
    }
    if (RECOVERY[email] && !d.data.recoveryEmail) d.data.recoveryEmail = RECOVERY[email];
    putDoc("staff", d.id, d.data);
    sql.push(
      `INSERT INTO users (uid, email, created_at) VALUES (${q(d.id)}, ${q(email)}, ${q(new Date().toISOString())}) ON CONFLICT (uid) DO UPDATE SET email = excluded.email;`,
    );
  }

  const file = join(WORK, "import.sql");
  writeFileSync(file, sql.join("\n") + "\n");
  const longest = Math.max(...sql.map((s) => s.length));
  console.log("records:", counts, "files:", uploads.length, "longest statement:", longest, "bytes");
  if (missingEmail.length) console.log("staff records without an email (not moved):", missingEmail);
  if (longest > 95_000) console.log("WARNING: a statement is close to D1's 100 KB limit.");
  if (DRY) return console.log(`Dry run. SQL written to ${file}; nothing uploaded.`);

  const wrangler = (args) => execFileSync("npx", ["wrangler", ...args], { stdio: "inherit", shell: process.platform === "win32" });
  for (const u of uploads) wrangler(["r2", "object", "put", `${BUCKET}/${u.key}`, "--file", u.file, "--content-type", u.type, "--remote"]);
  wrangler(["d1", "execute", "rtlawservices", "--remote", "--file", file, "--yes"]);
  console.log("Done.");
}

await main();
