"use client";

// Starts the "Build and deploy" GitHub workflow as soon as content is saved, so
// back-office changes reach the public website in a few minutes instead of
// waiting for the scheduled run, which GitHub can delay by hours.
//
// The workflow is started with a fine-grained GitHub token limited to Actions
// on this one repository. Owners save it at private/github, which only staff
// can read. It is never part of the public website code.
//
// The workflow allows one running build and one waiting build. A newer request
// replaces the waiting one, and every build pulls the latest content when it
// starts, so starting it on every save is safe.

import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const REPO = "thalamuxtech/rtlawservices";
const WORKFLOW = "deploy.yml";
const API = `https://api.github.com/repos/${REPO}/actions`;

export type PublishResult = { ok: true } | { ok: false; reason: "no-token" | "rejected" | "network"; detail?: string };

export type BuildRun = { status: string; conclusion: string | null; createdAt: string; url: string };

let cached: string | null | undefined;

async function token(): Promise<string | null> {
  if (cached !== undefined) return cached;
  const snap = await getDoc(doc(db(), "private", "github"));
  cached = (snap.data()?.token as string | undefined) || null;
  return cached;
}

const headers = (t: string) => ({
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${t}`,
  "X-GitHub-Api-Version": "2022-11-28",
});

async function record(uid: string, result: PublishResult) {
  await setDoc(
    doc(db(), "meta", "content"),
    result.ok
      ? { publishRequestedAt: serverTimestamp(), publishRequestedBy: uid, publishError: "" }
      : { publishError: result.reason === "no-token" ? "No publishing token saved" : result.detail || "GitHub did not accept the request" },
    { merge: true },
  );
}

/** Asks GitHub to rebuild and deploy the website now. Never throws. */
export async function requestPublish(uid: string): Promise<PublishResult> {
  let result: PublishResult;
  try {
    const t = await token();
    if (!t) {
      result = { ok: false, reason: "no-token" };
    } else {
      const res = await fetch(`${API}/workflows/${WORKFLOW}/dispatches`, {
        method: "POST",
        headers: { ...headers(t), "Content-Type": "application/json" },
        body: JSON.stringify({ ref: "main" }),
      });
      result = res.ok ? { ok: true } : { ok: false, reason: "rejected", detail: `GitHub answered ${res.status}${res.status === 401 ? ": the token is invalid or has expired" : ""}` };
    }
  } catch (err) {
    result = { ok: false, reason: "network", detail: err instanceof Error ? err.message : "Network error" };
  }
  await record(uid, result).catch(() => {});
  return result;
}

/** The most recent run of the deploy workflow, or null if it cannot be read. */
export async function latestBuild(): Promise<BuildRun | null> {
  try {
    const t = await token();
    if (!t) return null;
    const res = await fetch(`${API}/workflows/${WORKFLOW}/runs?per_page=1&branch=main`, { headers: headers(t) });
    if (!res.ok) return null;
    const run = (await res.json()).workflow_runs?.[0];
    return run ? { status: run.status, conclusion: run.conclusion, createdAt: run.created_at, url: run.html_url } : null;
  } catch {
    return null;
  }
}

export async function hasPublishToken() {
  return !!(await token().catch(() => null));
}

export async function savePublishToken(value: string, uid: string) {
  const ref = doc(db(), "private", "github");
  if (value) await setDoc(ref, { token: value, savedBy: uid, savedAt: serverTimestamp() });
  else await deleteDoc(ref);
  cached = value || null;
}
