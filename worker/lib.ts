// Shared helpers: responses, identifiers, timestamps and the document store.

export type Doc = Record<string, unknown>;
export type Row = Doc & { id: string };

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const SECURITY_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export const json = (body: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...SECURITY_HEADERS, "Content-Type": "application/json", ...headers } });

export async function body<T = Doc>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, "The request could not be read.");
  }
}

/** A 20-character random identifier, the same length and alphabet Firestore used. */
export function newId() {
  const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(20)), (b) => abc[b % abc.length]).join("");
}

export const ts = (d: Date | string | number = new Date()) => ({ __ts: new Date(d).toISOString() });
export const isTs = (v: unknown): v is { __ts: string } => !!v && typeof v === "object" && typeof (v as { __ts?: unknown }).__ts === "string";

/** Replaces stored timestamps with ISO strings, the form the public website reads. */
export const plain = (v: unknown): unknown =>
  isTs(v)
    ? v.__ts
    : Array.isArray(v)
      ? v.map(plain)
      : v && typeof v === "object"
        ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plain(x)]))
        : v;

export async function sha256Hex(data: string | ArrayBuffer | Uint8Array) {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export const str = (v: unknown, min: number, max: number): v is string => typeof v === "string" && v.length >= min && v.length <= max;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ---------- document store ---------- */

export async function getDoc(db: D1Database, col: string, id: string): Promise<Doc | null> {
  const row = await db.prepare("SELECT data FROM docs WHERE col = ? AND id = ?").bind(col, id).first<{ data: string }>();
  return row ? (JSON.parse(row.data) as Doc) : null;
}

export async function listDocs(db: D1Database, col: string): Promise<Row[]> {
  const { results } = await db.prepare("SELECT id, data FROM docs WHERE col = ?").bind(col).all<{ id: string; data: string }>();
  return results.map((r) => ({ ...(JSON.parse(r.data) as Doc), id: r.id }));
}

export async function publishedDocs(db: D1Database, col: string): Promise<Row[]> {
  const { results } = await db
    .prepare("SELECT id, data FROM docs WHERE col = ? AND json_extract(data, '$.status') = 'published'")
    .bind(col)
    .all<{ id: string; data: string }>();
  return results.map((r) => ({ ...(JSON.parse(r.data) as Doc), id: r.id }));
}

export const putDocStmt = (db: D1Database, col: string, id: string, data: Doc) =>
  db
    .prepare(
      "INSERT INTO docs (col, id, data) VALUES (?, ?, ?) ON CONFLICT (col, id) DO UPDATE SET data = excluded.data, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')",
    )
    .bind(col, id, JSON.stringify(data));

export const putDoc = (db: D1Database, col: string, id: string, data: Doc) => putDocStmt(db, col, id, data).run();

export async function mergeDoc(db: D1Database, col: string, id: string, patch: Doc) {
  const current = (await getDoc(db, col, id)) ?? {};
  await putDoc(db, col, id, { ...current, ...patch });
}

export const deleteDoc = (db: D1Database, col: string, id: string) => db.prepare("DELETE FROM docs WHERE col = ? AND id = ?").bind(col, id).run();

/* ---------- throttling ---------- */

/** Counts an attempt against `key`. Returns true once more than `max` happen within `windowSec`. */
export async function limited(db: D1Database, key: string, max: number, windowSec: number) {
  const now = Math.floor(Date.now() / 1000);
  const row = await db
    .prepare(
      `INSERT INTO throttle (key, count, reset_at) VALUES (?1, 1, ?2 + ?3)
       ON CONFLICT (key) DO UPDATE SET
         count = CASE WHEN reset_at <= ?2 THEN 1 ELSE count + 1 END,
         reset_at = CASE WHEN reset_at <= ?2 THEN ?2 + ?3 ELSE reset_at END
       RETURNING count`,
    )
    .bind(key, now, windowSec)
    .first<{ count: number }>();
  return (row?.count ?? 0) > max;
}

export const clientIp = (req: Request) => req.headers.get("CF-Connecting-IP") || "unknown";
