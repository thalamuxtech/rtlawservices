// Staff sign-in: passwords hashed with PBKDF2, sessions in an HttpOnly cookie.

import { body, clientIp, EMAIL_RE, getDoc, HttpError, json, limited, sha256Hex, str } from "./lib";
import { sendMail } from "./mail";

const COOKIE = "rt_session";
const SESSION_DAYS = 30;
const RESET_MINUTES = 60;
// The Workers runtime accepts at most 100,000 PBKDF2 iterations.
const ITERATIONS = 100_000;

export type Staff = { uid: string; email: string; role: string; name?: string };

type User = { uid: string; email: string; pw_hash: string | null; pw_salt: string | null; pw_iter: number | null };

const b64 = (bytes: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { pw_hash: b64(await derive(password, salt, ITERATIONS)), pw_salt: b64(salt), pw_iter: ITERATIONS };
}

/** Compares in constant time, so the response time reveals nothing about the hash. */
function same(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function verify(user: User, password: string) {
  if (!user.pw_hash || !user.pw_salt || !user.pw_iter) return false;
  return same(new Uint8Array(await derive(password, unb64(user.pw_salt), user.pw_iter)), unb64(user.pw_hash));
}

/** Checks a password moved from Firebase once, by asking Firebase to sign the account in. */
async function verifyWithFirebase(env: Env, user: User, password: string) {
  if (!env.FIREBASE_API_KEY) return false;
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${env.FIREBASE_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, password, returnSecureToken: false }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { localId?: string };
    return data.localId === user.uid;
  } catch {
    return false;
  }
}

export async function setPassword(env: Env, uid: string, password: string) {
  const h = await hashPassword(password);
  await env.DB.prepare("UPDATE users SET pw_hash = ?, pw_salt = ?, pw_iter = ? WHERE uid = ?").bind(h.pw_hash, h.pw_salt, h.pw_iter, uid).run();
}

export const PASSWORD_RULE = "Use at least 10 characters.";
const goodPassword = (p: unknown): p is string => str(p, 10, 200);

/* ---------- sessions ---------- */

function readCookie(req: Request) {
  const m = /(?:^|;\s*)rt_session=([^;]+)/.exec(req.headers.get("Cookie") || "");
  return m?.[1] ?? null;
}

const cookie = (value: string, maxAge: number) => `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;

async function startSession(env: Env, uid: string) {
  const token = b64(crypto.getRandomValues(new Uint8Array(32))).replace(/[+/=]/g, (c) => ({ "+": "-", "/": "_", "=": "" })[c]!);
  const expires = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400;
  await env.DB.prepare("INSERT INTO sessions (id, uid, expires_at) VALUES (?, ?, ?)").bind(await sha256Hex(token), uid, expires).run();
  return cookie(token, SESSION_DAYS * 86400);
}

/** The signed-in staff member, or null. A signed-in account without a staff record is not staff. */
export async function currentStaff(env: Env, req: Request): Promise<Staff | null> {
  const token = readCookie(req);
  if (!token) return null;
  const row = await env.DB.prepare(
    "SELECT s.uid, u.email FROM sessions s JOIN users u ON u.uid = s.uid WHERE s.id = ? AND s.expires_at > ?",
  )
    .bind(await sha256Hex(token), Math.floor(Date.now() / 1000))
    .first<{ uid: string; email: string }>();
  if (!row) return null;
  const staff = await getDoc(env.DB, "staff", row.uid);
  if (!staff) return null;
  return { uid: row.uid, email: row.email, role: String(staff.role ?? ""), name: staff.name as string | undefined };
}

export async function requireStaff(env: Env, req: Request, owner = false) {
  const staff = await currentStaff(env, req);
  if (!staff) throw new HttpError(401, "Please sign in again.");
  if (owner && staff.role !== "owner") throw new HttpError(403, "Only owners can do this.");
  return staff;
}

/* ---------- reset links ---------- */

/** Where reset emails for an account go. Login-only addresses, such as admin@, name a recovery mailbox. */
async function recoveryAddress(env: Env, uid: string, email: string) {
  const staff = await getDoc(env.DB, "staff", uid);
  return (staff?.recoveryEmail as string | undefined) || email;
}

export async function createResetLink(env: Env, uid: string) {
  const token = b64(crypto.getRandomValues(new Uint8Array(32))).replace(/[+/=]/g, (c) => ({ "+": "-", "/": "_", "=": "" })[c]!);
  await env.DB.prepare("INSERT INTO resets (id, uid, expires_at) VALUES (?, ?, ?)")
    .bind(await sha256Hex(token), uid, Math.floor(Date.now() / 1000) + RESET_MINUTES * 60)
    .run();
  return `${env.SITE_URL}/admin/#reset=${token}`;
}

export async function emailResetLink(env: Env, uid: string, email: string, intro: string) {
  const link = await createResetLink(env, uid);
  const sent = await sendMail(env, {
    to: await recoveryAddress(env, uid, email),
    subject: "Set your RT Law Services staff password",
    text: `${intro}\n\nOpen this link within ${RESET_MINUTES} minutes to set a password for ${email}:\n${link}\n\nIf you did not ask for this, you can ignore this email.`,
  });
  return { link, sent };
}

/* ---------- routes ---------- */

export async function authRoutes(env: Env, req: Request, path: string): Promise<Response | null> {
  if (path === "/api/auth/me" && req.method === "GET") {
    const staff = await currentStaff(env, req);
    if (staff) return json({ staff });
    // Signed in, but without a staff record: tell the portal, so it can say so.
    const token = readCookie(req);
    const row = token
      ? await env.DB.prepare("SELECT u.email FROM sessions s JOIN users u ON u.uid = s.uid WHERE s.id = ? AND s.expires_at > ?")
          .bind(await sha256Hex(token), Math.floor(Date.now() / 1000))
          .first<{ email: string }>()
      : null;
    return json({ staff: null, email: row?.email ?? null });
  }

  if (path === "/api/auth/login" && req.method === "POST") {
    const { email, password } = await body<{ email?: string; password?: string }>(req);
    if (!str(email, 3, 200) || !str(password, 1, 200)) throw new HttpError(400, "Enter your email and password.");
    if (await limited(env.DB, `login:${email.toLowerCase()}:${clientIp(req)}`, 10, 900))
      throw new HttpError(429, "Too many attempts. Wait 15 minutes and try again.");
    const user = await env.DB.prepare("SELECT uid, email, pw_hash, pw_salt, pw_iter FROM users WHERE email = ?").bind(email.trim()).first<User>();
    let ok = false;
    if (user?.pw_hash) ok = await verify(user, password);
    else if (user && (await verifyWithFirebase(env, user, password))) {
      await setPassword(env, user.uid, password);
      ok = true;
    }
    if (!user || !ok) throw new HttpError(401, "Sign-in failed. Check your email and password.");
    return json({ ok: true }, 200, { "Set-Cookie": await startSession(env, user.uid) });
  }

  if (path === "/api/auth/logout" && req.method === "POST") {
    const token = readCookie(req);
    if (token) await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(await sha256Hex(token)).run();
    return json({ ok: true }, 200, { "Set-Cookie": cookie("", 0) });
  }

  if (path === "/api/auth/reset-request" && req.method === "POST") {
    const { email } = await body<{ email?: string }>(req);
    if (!str(email, 3, 200) || !EMAIL_RE.test(email.trim())) throw new HttpError(400, "Enter a valid email address.");
    if (await limited(env.DB, `reset:${clientIp(req)}`, 5, 3600)) throw new HttpError(429, "Too many requests. Try again in an hour.");
    const user = await env.DB.prepare("SELECT uid, email FROM users WHERE email = ?").bind(email.trim()).first<{ uid: string; email: string }>();
    // The same answer whether or not the account exists, so the form cannot be used to find staff emails.
    if (user) await emailResetLink(env, user.uid, user.email, "We received a request to reset your password for the RT Law Services staff portal.");
    return json({ ok: true });
  }

  if (path === "/api/auth/reset" && req.method === "POST") {
    const { token, password } = await body<{ token?: string; password?: string }>(req);
    if (!str(token, 10, 200)) throw new HttpError(400, "This link is not valid. Ask for a new one.");
    if (!goodPassword(password)) throw new HttpError(400, PASSWORD_RULE);
    const id = await sha256Hex(token);
    const row = await env.DB.prepare("SELECT uid FROM resets WHERE id = ? AND expires_at > ?").bind(id, Math.floor(Date.now() / 1000)).first<{ uid: string }>();
    if (!row) throw new HttpError(400, "This link has expired or was already used. Ask for a new one.");
    await setPassword(env, row.uid, password);
    await env.DB.batch([
      env.DB.prepare("DELETE FROM resets WHERE uid = ?").bind(row.uid),
      env.DB.prepare("DELETE FROM sessions WHERE uid = ?").bind(row.uid),
    ]);
    return json({ ok: true }, 200, { "Set-Cookie": await startSession(env, row.uid) });
  }

  if (path === "/api/auth/password" && req.method === "POST") {
    const staff = await requireStaff(env, req);
    const { current, next } = await body<{ current?: string; next?: string }>(req);
    const user = await env.DB.prepare("SELECT uid, email, pw_hash, pw_salt, pw_iter FROM users WHERE uid = ?").bind(staff.uid).first<User>();
    if (!user || !str(current, 1, 200) || !(await verify(user, current))) throw new HttpError(400, "The current password is not right.");
    if (!goodPassword(next)) throw new HttpError(400, PASSWORD_RULE);
    await setPassword(env, staff.uid, next);
    return json({ ok: true });
  }

  return null;
}
