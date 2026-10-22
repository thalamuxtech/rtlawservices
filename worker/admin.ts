// Back-office routes. Every route needs a signed-in staff member; deleting
// requests and managing staff need an owner.

import { createResetLink, emailResetLink, requireStaff, type Staff } from "./auth";
import { body, deleteDoc, EMAIL_RE, getDoc, HttpError, json, listDocs, mergeDoc, newId, putDoc, sha256Hex, str, ts, type Doc } from "./lib";
import { sendMail } from "./mail";

const REQUESTS = new Set(["evaluations", "bookings", "messages"]);
const CONTENT = new Set(["attorneys", "cases", "reviews", "posts"]);
const READABLE = new Set([...REQUESTS, ...CONTENT, "staff", "emails", "settings", "meta"]);
const ROLES = new Set(["owner", "attorney", "intake", "editor"]);

// Statuses that mean the meeting will not happen, so its time goes back on the calendar.
const RELEASES = new Set(["cancelled", "not-a-fit", "referred"]);

/* ---------- uploaded images ---------- */

const IMAGE_FIELDS = ["photo", "documentImage"] as const;
const MEDIA_PREFIX = "/api/media/";

/**
 * Moves images sent as data URLs into storage and keeps only their address in
 * the record. File names carry a fingerprint, so a replaced image gets a new
 * address and browsers never show a stale copy.
 */
async function storeImages(env: Env, col: string, id: string, data: Doc, previous: Doc | null) {
  for (const field of IMAGE_FIELDS) {
    const value = data[field];
    const old = previous?.[field];
    if (typeof value === "string" && value.startsWith("data:")) {
      const m = /^data:image\/(webp|jpeg|png);base64,(.+)$/.exec(value);
      if (!m) throw new HttpError(400, "Upload a WebP, JPEG or PNG image.");
      const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
      const name = `${col}-${id}-${(await sha256Hex(bytes)).slice(0, 16)}.${m[1] === "jpeg" ? "jpg" : m[1]}`;
      await env.FILES.put(`media/${name}`, bytes, { httpMetadata: { contentType: `image/${m[1]}` } });
      data[field] = MEDIA_PREFIX + name;
    }
    if (typeof old === "string" && old.startsWith(MEDIA_PREFIX) && old !== data[field]) await env.FILES.delete(`media/${old.slice(MEDIA_PREFIX.length)}`);
  }
}

async function dropImages(env: Env, data: Doc | null) {
  for (const field of IMAGE_FIELDS) {
    const v = data?.[field];
    if (typeof v === "string" && v.startsWith(MEDIA_PREFIX)) await env.FILES.delete(`media/${v.slice(MEDIA_PREFIX.length)}`);
  }
}

/* ---------- publishing ---------- */

const GITHUB_API = (env: Env) => `https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/deploy.yml`;
const githubHeaders = (env: Env) => ({
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${env.GITHUB_TOKEN}`,
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "rtlawservices-worker",
});

/**
 * Starts the "Build and deploy" workflow, which refreshes the prerendered pages
 * that search engines read. Visitors already see the change, because pages
 * read /api/content on each view.
 */
async function requestBuild(env: Env, uid: string) {
  let error = "";
  if (!env.GITHUB_TOKEN) error = "No publishing token is set up";
  else {
    try {
      const res = await fetch(`${GITHUB_API(env)}/dispatches`, { method: "POST", headers: { ...githubHeaders(env), "Content-Type": "application/json" }, body: JSON.stringify({ ref: "main" }) });
      if (!res.ok) error = `GitHub answered ${res.status}${res.status === 401 ? ": the token is invalid or has expired" : ""}`;
    } catch {
      error = "GitHub could not be reached";
    }
  }
  await mergeDoc(env.DB, "meta", "content", error ? { publishError: error } : { publishRequestedAt: ts(), publishRequestedBy: uid, publishError: "" });
  return error;
}

async function touchContent(env: Env, ctx: ExecutionContext, uid: string) {
  await mergeDoc(env.DB, "meta", "content", { updatedAt: ts(), updatedBy: uid });
  ctx.waitUntil(requestBuild(env, uid));
}

async function latestBuild(env: Env) {
  if (!env.GITHUB_TOKEN) return null;
  try {
    const res = await fetch(`${GITHUB_API(env)}/runs?per_page=1&branch=main`, { headers: githubHeaders(env) });
    if (!res.ok) return null;
    const run = ((await res.json()) as { workflow_runs?: Record<string, string>[] }).workflow_runs?.[0];
    return run ? { status: run.status, conclusion: run.conclusion, createdAt: run.created_at, url: run.html_url } : null;
  } catch {
    return null;
  }
}

/* ---------- requests ---------- */

async function releaseSlots(env: Env, bookingId: string) {
  await env.DB.prepare("DELETE FROM slots WHERE booking_id = ?").bind(bookingId).run();
}

async function emailClient(env: Env, staff: Staff, b: Doc) {
  const { col, id, subject, text } = b;
  if (typeof col !== "string" || !REQUESTS.has(col) || !str(id, 1, 64)) throw new HttpError(400, "Choose a request first.");
  if (!str(subject, 1, 200) || !str(text, 1, 20_000)) throw new HttpError(400, "Write a subject and a message.");
  const request = await getDoc(env.DB, col, id);
  const to = request?.email;
  if (typeof to !== "string" || !EMAIL_RE.test(to)) throw new HttpError(400, "This request has no valid email address.");
  const result = await sendMail(env, { to, toName: String(request?.name ?? ""), subject, text });
  if (!result.ok) throw new HttpError(502, result.error);
  const record = { requestCol: col, requestId: id, to, subject, text, sentBy: staff.uid, sentByName: staff.name || staff.email, messageId: result.messageId ?? "", createdAt: ts() };
  const emailId = newId();
  await putDoc(env.DB, "emails", emailId, record);
  // A reply to a new message or evaluation moves it along, so the inbox stays accurate.
  if (request?.status === "new" && col === "messages") await mergeDoc(env.DB, col, id, { status: "replied", updatedAt: ts(), updatedBy: staff.uid });
  return json({ ok: true, id: emailId });
}

/* ---------- staff ---------- */

async function addStaff(env: Env, owner: Staff, b: Doc) {
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) throw new HttpError(400, "Enter a valid email address.");
  const role = String(b.role ?? "");
  if (!ROLES.has(role)) throw new HttpError(400, "Choose a role.");
  const exists = await env.DB.prepare("SELECT uid FROM users WHERE email = ?").bind(email).first<{ uid: string }>();
  const uid = exists?.uid ?? newId();
  if (!exists) await env.DB.prepare("INSERT INTO users (uid, email, created_at) VALUES (?, ?, ?)").bind(uid, email, new Date().toISOString()).run();
  await putDoc(env.DB, "staff", uid, { email, name: String(b.name ?? "").trim().slice(0, 120), role, addedBy: owner.uid, addedAt: ts() });
  const { link, sent } = await emailResetLink(env, uid, email, "You have been given access to the RT Law Services staff portal.");
  // Without email set up, the owner passes the link on by hand.
  return json({ ok: true, uid, emailed: sent.ok, link: sent.ok ? undefined : link });
}

/* ---------- routes ---------- */

export async function adminRoutes(env: Env, req: Request, path: string, ctx: ExecutionContext): Promise<Response | null> {
  if (!path.startsWith("/api/admin/")) return null;
  const staff = await requireStaff(env, req);
  const parts = path.slice("/api/admin/".length).split("/").map(decodeURIComponent);
  const method = req.method;

  // GET /api/admin/c/{collection}
  if (parts[0] === "c" && parts.length === 2 && method === "GET") {
    if (!READABLE.has(parts[1])) throw new HttpError(404, "Not found.");
    return json(await listDocs(env.DB, parts[1]));
  }

  // /api/admin/d/{collection}/{id}
  if (parts[0] === "d" && parts.length === 3) {
    const [, col, id] = parts;
    if (!READABLE.has(col) || !str(id, 1, 120)) throw new HttpError(404, "Not found.");

    if (method === "GET") return json(await getDoc(env.DB, col, id));

    if (method === "PUT") {
      if (!CONTENT.has(col) && col !== "settings") throw new HttpError(403, "This record cannot be edited here.");
      const { data, affectsSite = true } = await body<{ data?: Doc; affectsSite?: boolean }>(req);
      if (!data || typeof data !== "object") throw new HttpError(400, "Nothing to save.");
      const previous = await getDoc(env.DB, col, id);
      const next: Doc = { ...data, updatedAt: ts(), updatedBy: staff.uid };
      delete next.id;
      await storeImages(env, col, id, next, previous);
      await putDoc(env.DB, col, id, next);
      if (affectsSite) await touchContent(env, ctx, staff.uid);
      return json({ ok: true });
    }

    if (method === "PATCH") {
      if (!REQUESTS.has(col)) throw new HttpError(403, "This record cannot be edited here.");
      const patch = await body(req);
      const allowed: Doc = {};
      if (str(patch.status, 1, 40)) allowed.status = patch.status;
      if (typeof patch.staffNote === "string") allowed.staffNote = patch.staffNote.slice(0, 4000);
      if (!Object.keys(allowed).length) throw new HttpError(400, "Nothing to save.");
      if (!(await getDoc(env.DB, col, id))) throw new HttpError(404, "This request no longer exists.");
      await mergeDoc(env.DB, col, id, { ...allowed, updatedAt: ts(), updatedBy: staff.uid });
      const released = col === "bookings" && typeof allowed.status === "string" && RELEASES.has(allowed.status);
      if (released) await releaseSlots(env, id);
      return json({ ok: true, released });
    }

    if (method === "DELETE") {
      if (REQUESTS.has(col)) {
        // Owners can erase a request, for example when a client asks for their data to be deleted.
        if (staff.role !== "owner") throw new HttpError(403, "Only owners can delete requests.");
        if (col === "evaluations") await env.FILES.delete(`cv/${id}`);
        if (col === "bookings") await releaseSlots(env, id);
        await env.DB.prepare("DELETE FROM docs WHERE col = 'emails' AND json_extract(data, '$.requestId') = ?").bind(id).run();
        await deleteDoc(env.DB, col, id);
        return json({ ok: true });
      }
      if (CONTENT.has(col)) {
        await dropImages(env, await getDoc(env.DB, col, id));
        await deleteDoc(env.DB, col, id);
        await touchContent(env, ctx, staff.uid);
        return json({ ok: true });
      }
      throw new HttpError(403, "This record cannot be deleted here.");
    }
  }

  // GET /api/admin/cv/{evaluationId}
  if (parts[0] === "cv" && parts.length === 2 && method === "GET") {
    const ev = await getDoc(env.DB, "evaluations", parts[1]);
    const obj = ev?.file ? await env.FILES.get(`cv/${parts[1]}`) : null;
    if (!obj) throw new HttpError(404, "The file could not be found.");
    const name = String((ev!.file as Doc).name ?? "cv").replace(/["\r\n]/g, "");
    return new Response(obj.body, {
      headers: {
        "Content-Type": obj.httpMetadata?.contentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  if (path === "/api/admin/email" && method === "POST") return emailClient(env, staff, await body(req));

  if (path === "/api/admin/publish") {
    if (method === "GET") return json({ tokenSaved: !!env.GITHUB_TOKEN, mailReady: !!env.BREVO_API_KEY, run: await latestBuild(env) });
    if (method === "POST") {
      const error = await requestBuild(env, staff.uid);
      return json({ ok: !error, error });
    }
  }

  if (parts[0] === "staff") {
    if (staff.role !== "owner") throw new HttpError(403, "Only owners can manage staff.");
    if (parts.length === 1 && method === "POST") return addStaff(env, staff, await body(req));
    const uid = parts[1];
    if (parts.length === 2 && method === "DELETE") {
      if (uid === staff.uid) throw new HttpError(400, "You cannot remove your own access.");
      await env.DB.batch([
        env.DB.prepare("DELETE FROM docs WHERE col = 'staff' AND id = ?").bind(uid),
        env.DB.prepare("DELETE FROM sessions WHERE uid = ?").bind(uid),
        env.DB.prepare("DELETE FROM resets WHERE uid = ?").bind(uid),
      ]);
      return json({ ok: true });
    }
    // A fresh set-password link, for a staff member who cannot receive email.
    if (parts.length === 3 && parts[2] === "link" && method === "POST") {
      const user = await env.DB.prepare("SELECT uid FROM users WHERE uid = ?").bind(uid).first();
      if (!user) throw new HttpError(404, "No account for this staff member.");
      return json({ link: await createResetLink(env, uid) });
    }
  }

  throw new HttpError(404, "Not found.");
}
