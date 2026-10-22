// What visitors can reach without signing in: the published content, uploaded
// images, booked times, and the booking, contact and free evaluation forms.
// Visitors can create requests but never read them back.

import { body, clientIp, EMAIL_RE, getDoc, HttpError, json, limited, newId, plain, publishedDocs, putDocStmt, str, ts, type Doc } from "./lib";

const INTERNAL = new Set(["status", "updatedAt", "updatedBy", "documentImage", "photo"]);
const strip = (row: Doc) => plain(Object.fromEntries(Object.entries(row).filter(([k]) => !INTERNAL.has(k) && k !== "id"))) as Doc;

/** Everything the public pages show, in the shape src/content/live.ts reads. */
export async function liveContent(env: Env) {
  const [site, pages, attorneys, cases, reviews, posts] = await Promise.all([
    getDoc(env.DB, "settings", "site"),
    getDoc(env.DB, "settings", "pages"),
    publishedDocs(env.DB, "attorneys"),
    publishedDocs(env.DB, "cases"),
    publishedDocs(env.DB, "reviews"),
    publishedDocs(env.DB, "posts"),
  ]);
  return {
    source: "database",
    ...(site ? { site: strip(site) } : {}),
    ...(pages ? { pages: strip(pages) } : {}),
    attorneys: attorneys.map((a) => ({ ...strip(a), slug: a.slug || a.id, _id: a.id, photoUrl: a.photo || undefined })),
    cases: cases.map((c) => ({ ...strip(c), slug: c.slug || c.id, _id: c.id, documentUrl: c.documentImage || undefined })),
    reviews: reviews.map((r) => ({ ...strip(r), id: r.id })),
    posts: posts.map((p) => ({ ...strip(p), slug: p.slug || p.id })),
  };
}

/* ---------- booking rules, as in src/lib/booking.ts ---------- */

const BLOCK_MS = 30 * 60_000;
const blocksFor = (start: Date, minutes: number) => Array.from({ length: Math.max(1, Math.ceil(minutes / 30)) }, (_, i) => new Date(start.getTime() + i * BLOCK_MS));
const slotId = (attorney: string, start: Date) => `${attorney}_${start.toISOString().replace(/[:.]/g, "-")}`;

function inBookingWindow(iso: unknown) {
  if (typeof iso !== "string") return null;
  const d = new Date(iso);
  const t = d.getTime();
  return Number.isFinite(t) && t > Date.now() && t < Date.now() + 35 * 86400_000 && t % BLOCK_MS === 0 ? d : null;
}

async function tooMany(env: Env, req: Request, form: string) {
  if (await limited(env.DB, `form:${form}:${clientIp(req)}`, 10, 3600)) throw new HttpError(429, "Too many submissions from this connection. Please call us instead.");
}

async function createBooking(env: Env, req: Request) {
  await tooMany(env, req, "booking");
  const b = await body(req);
  const start = inBookingWindow(b.start);
  const ok =
    start &&
    str(b.matter, 1, 64) &&
    str(b.matterLabel, 1, 120) &&
    (b.mode === "video" || b.mode === "phone") &&
    str(b.attorney, 1, 64) &&
    /^[a-z0-9-]+$/.test(b.attorney) &&
    (b.durationMin === 30 || b.durationMin === 60) &&
    str(b.day, 10, 10) &&
    str(b.visitorTz, 1, 64) &&
    str(b.name, 2, 200) &&
    str(b.email, 5, 200) &&
    EMAIL_RE.test(b.email) &&
    str(b.phone, 7, 200) &&
    str(b.country, 1, 200) &&
    str(b.language ?? "", 0, 200) &&
    str(b.otherParties ?? "", 0, 200) &&
    str(b.notes ?? "", 0, 1200) &&
    str(b.source ?? "", 0, 200);
  if (!ok) throw new HttpError(400, "Some details are missing or too long.");

  const id = newId();
  const blocks = blocksFor(start, b.durationMin as number);
  const ids = blocks.map((x) => slotId(b.attorney as string, x));
  const now = new Date().toISOString();
  const booking: Doc = {
    matter: b.matter,
    matterLabel: b.matterLabel,
    mode: b.mode,
    attorney: b.attorney,
    start: ts(start),
    day: b.day,
    durationMin: b.durationMin,
    visitorTz: b.visitorTz,
    name: b.name,
    email: (b.email as string).toLowerCase(),
    phone: b.phone,
    country: b.country,
    language: b.language ?? "",
    otherParties: b.otherParties ?? "",
    notes: b.notes ?? "",
    source: b.source ?? "",
    consents: { noRelationship: true, privacy: true },
    slotId: ids[0],
    status: "new",
    createdAt: ts(),
  };
  try {
    // One transaction: if any block is already taken, nothing is written.
    await env.DB.batch([
      ...blocks.map((x, i) =>
        env.DB.prepare("INSERT INTO slots (id, attorney, day, start, booking_id, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(ids[i], b.attorney, b.day, x.toISOString(), id, now),
      ),
      putDocStmt(env.DB, "bookings", id, booking),
    ]);
  } catch (err) {
    if (String(err).includes("UNIQUE")) throw new HttpError(409, "That time was just taken. Please choose another time.");
    throw err;
  }
  return json({ ok: true, id });
}

async function createMessage(env: Env, req: Request) {
  await tooMany(env, req, "message");
  const b = await body(req);
  const ok =
    str(b.name, 2, 120) && str(b.email, 5, 160) && EMAIL_RE.test(b.email) && str(b.phone ?? "", 0, 40) && str(b.topic, 1, 60) && str(b.message, 10, 2000);
  if (!ok) throw new HttpError(400, "Some details are missing or too long.");
  const id = newId();
  await putDocStmt(env.DB, "messages", id, {
    name: b.name,
    email: (b.email as string).toLowerCase(),
    phone: b.phone ?? "",
    topic: b.topic,
    message: b.message,
    status: "new",
    createdAt: ts(),
  }).run();
  return json({ ok: true, id });
}

const MAX_CV = 3 * 1024 * 1024;

async function createEvaluation(env: Env, req: Request) {
  await tooMany(env, req, "evaluation");
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new HttpError(400, "The request could not be read.");
  }
  let b: Doc;
  try {
    b = JSON.parse(String(form.get("data") ?? "{}"));
  } catch {
    throw new HttpError(400, "The request could not be read.");
  }
  const answers = b.answers as Doc | undefined;
  const ok =
    str(b.name, 2, 200) &&
    str(b.email, 5, 200) &&
    EMAIL_RE.test(b.email) &&
    str(b.phone, 7, 60) &&
    str(b.birthCountry, 1, 80) &&
    (b.track === "professional" || b.track === "family") &&
    !!answers &&
    typeof answers === "object" &&
    Object.keys(answers).length <= 40 &&
    JSON.stringify(answers).length <= 60_000;
  if (!ok) throw new HttpError(400, "Some details are missing or too long.");

  const id = newId();
  const upload = form.get("file");
  let file: Doc | null = null;
  if (upload && typeof upload !== "string") {
    if (upload.size > MAX_CV) throw new HttpError(400, "The file is larger than 3 MB.");
    if (!/\.(pdf|docx?|rtf|txt)$/i.test(upload.name)) throw new HttpError(400, "Upload a PDF, Word document, RTF or text file.");
    const type = upload.type || "application/octet-stream";
    await env.FILES.put(`cv/${id}`, upload.stream(), { httpMetadata: { contentType: type } });
    file = { name: upload.name.slice(0, 160), type, size: upload.size };
  }
  await putDocStmt(env.DB, "evaluations", id, {
    name: b.name,
    email: (b.email as string).toLowerCase(),
    phone: b.phone,
    birthCountry: b.birthCountry,
    track: b.track,
    answers,
    file,
    consents: { noRelationship: true, accurate: true },
    status: "new",
    createdAt: ts(),
  }).run();
  return json({ ok: true, id });
}

export async function publicRoutes(env: Env, req: Request, path: string): Promise<Response | null> {
  if (path === "/api/content" && req.method === "GET") return json(await liveContent(env));

  if (path.startsWith("/api/media/") && req.method === "GET") {
    const name = path.slice("/api/media/".length);
    if (!/^[\w.-]+$/.test(name)) throw new HttpError(404, "Not found.");
    const obj = await env.FILES.get(`media/${name}`);
    if (!obj) throw new HttpError(404, "Not found.");
    // File names contain a fingerprint of their content, so they never change.
    return new Response(obj.body, {
      headers: {
        "Content-Type": obj.httpMetadata?.contentType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  if (path === "/api/slots" && req.method === "GET") {
    const url = new URL(req.url);
    const attorney = url.searchParams.get("attorney") ?? "";
    const day = url.searchParams.get("day") ?? "";
    if (!str(attorney, 1, 64) || !/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new HttpError(400, "Choose a day.");
    const { results } = await env.DB.prepare("SELECT start FROM slots WHERE attorney = ? AND day = ?").bind(attorney, day).all<{ start: string }>();
    return json({ taken: results.map((r) => r.start) });
  }

  if (path === "/api/bookings" && req.method === "POST") return createBooking(env, req);
  if (path === "/api/messages" && req.method === "POST") return createMessage(env, req);
  if (path === "/api/evaluations" && req.method === "POST") return createEvaluation(env, req);

  return null;
}
