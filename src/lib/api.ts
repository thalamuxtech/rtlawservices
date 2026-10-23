"use client";

// Talks to the site's own back end (worker/ in this repository) under /api/.
// Records come back as plain JSON; timestamps arrive as {"__ts": "<ISO>"} and
// are turned into Timestamp objects, so the back office can format and sort them.

import { useCallback, useEffect, useState } from "react";

export class Timestamp {
  constructor(private readonly ms: number) {}
  static fromDate = (d: Date) => new Timestamp(d.getTime());
  toDate = () => new Date(this.ms);
  toMillis = () => this.ms;
  /** Sent back in the same form the server stores. */
  toJSON = () => ({ __ts: new Date(this.ms).toISOString() });
}

export type DocumentData = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
export type Row = DocumentData & { id: string };

const revive = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(revive)
    : v && typeof v === "object"
      ? typeof (v as { __ts?: unknown }).__ts === "string"
        ? new Timestamp(Date.parse((v as { __ts: string }).__ts))
        : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, revive(x)]))
      : v;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  const res = await fetch(path, {
    credentials: "same-origin",
    ...rest,
    headers: json === undefined ? rest.headers : { "Content-Type": "application/json", ...rest.headers },
    body: json === undefined ? rest.body : JSON.stringify(json),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error || "The request failed.");
  return revive(data) as T;
}

/* ---------- back office records ---------- */

// Every save announces itself, so lists on screen refresh at once instead of
// waiting for the next periodic check.
const CHANGED = "rt-data-changed";
const changed = () => window.dispatchEvent(new Event(CHANGED));
const POLL_MS = 15_000;

const enc = encodeURIComponent;

export const listDocs = (col: string) => api<Row[]>(`/api/admin/c/${enc(col)}`);
export const getDoc = (col: string, id: string) => api<DocumentData | null>(`/api/admin/d/${enc(col)}/${enc(id)}`);

export async function putDoc(col: string, id: string, data: DocumentData, affectsSite = true) {
  await api(`/api/admin/d/${enc(col)}/${enc(id)}`, { method: "PUT", json: { data, affectsSite } });
  changed();
}

export async function patchDoc(col: string, id: string, patch: DocumentData) {
  const r = await api<{ released?: boolean }>(`/api/admin/d/${enc(col)}/${enc(id)}`, { method: "PATCH", json: patch });
  changed();
  return r;
}

export async function deleteDoc(col: string, id: string) {
  await api(`/api/admin/d/${enc(col)}/${enc(id)}`, { method: "DELETE" });
  changed();
}

export async function adminPost<T = unknown>(path: string, json?: unknown) {
  const r = await api<T>(`/api/admin/${path}`, { method: "POST", json: json ?? {} });
  changed();
  return r;
}

export async function adminDelete(path: string) {
  await api(`/api/admin/${path}`, { method: "DELETE" });
  changed();
}

/** Re-runs `load` every 15 seconds, when the tab regains focus, and after every save. */
function usePolling<T>(load: () => Promise<T>, onData: (v: T) => void, onError: (e: Error) => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    const run = () =>
      load()
        .then((v) => live && onData(v))
        .catch((e: Error) => live && onError(e));
    run();
    const t = setInterval(() => document.visibilityState === "visible" && run(), POLL_MS);
    window.addEventListener(CHANGED, run);
    window.addEventListener("focus", run);
    return () => {
      live = false;
      clearInterval(t);
      window.removeEventListener(CHANGED, run);
      window.removeEventListener("focus", run);
    };
  }, [load, onData, onError, enabled]);
}

/** One record, kept up to date. `undefined` while loading, `null` if it does not exist. */
export function useDoc(col: string, id: string) {
  const [data, setData] = useState<DocumentData | null | undefined>(undefined);
  const load = useCallback(() => getDoc(col, id), [col, id]);
  const onError = useCallback(() => setData((d) => d ?? null), []);
  usePolling(load, setData, onError);
  return data;
}

/** `enabled: false` skips loading, for a section that is switched off. */
export function useRows(col: string, enabled = true) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(() => listDocs(col), [col]);
  const onData = useCallback((r: Row[]) => {
    setError("");
    setRows(r);
  }, []);
  const onError = useCallback((e: Error) => {
    setError(e.message);
    setRows((r) => r ?? []);
  }, []);
  usePolling(load, onData, onError, enabled);
  return { rows, error };
}
