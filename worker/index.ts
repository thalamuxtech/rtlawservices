// Entry point. Static pages come from the assets in out/; this code answers
// only requests under /api/ (see run_worker_first in wrangler.jsonc).

import { adminRoutes, emailClient } from "./admin";
import { authRoutes } from "./auth";
import { receiveEmail } from "./inbox";
import { clearBlocks } from "./mail";
import { deleteDoc, getDoc, HttpError, json } from "./lib";
import { publicRoutes } from "./public";

/** Requests that change data must come from a page on the same site. */
function sameOrigin(req: Request) {
  if (req.method === "GET" || req.method === "HEAD") return true;
  const origin = req.headers.get("Origin");
  return !!origin && origin === new URL(req.url).origin;
}

export default {
  async fetch(req, env, ctx) {
    const path = new URL(req.url).pathname;
    if (!path.startsWith("/api/")) return env.ASSETS.fetch(req);
    try {
      if (!sameOrigin(req)) throw new HttpError(403, "This request must come from the website.");
      return (
        (await authRoutes(env, req, path)) ??
        (await publicRoutes(env, req, path)) ??
        (await adminRoutes(env, req, path, ctx)) ??
        json({ error: "Not found." }, 404)
      );
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status);
      console.error(err);
      return json({ error: "Something went wrong. Please try again." }, 500);
    }
  },

  // Mail for clientservice@ and info@, delivered by Email Routing.
  async email(message, env) {
    await receiveEmail(message, env);
  },

  // Every 15 minutes: lift delivery blocks Brevo has placed (see clearBlocks).
  async scheduled(_event, env) {
    // One-time outbox: an email queued in meta/outbox by the developer, on the
    // firm's request, sent through the normal send path. Removed before sending,
    // so it can never go twice.
    const job = await getDoc(env.DB, "meta", "outbox");
    if (job) {
      await deleteDoc(env.DB, "meta", "outbox");
      const res = await emailClient(env, { uid: "outbox", email: "outbox", role: "system", name: "RT Law Services (queued on request)" }, job).catch((err) => json({ error: (err as Error).message }, 500));
      console.log(`outbox: ${res.status} ${await res.text()}`);
    }
    try {
      const lifted = await clearBlocks(env);
      console.log(`delivery blocks: ${lifted.length ? `unblocked ${lifted.join(", ")}` : "none to lift"}`);
    } catch (err) {
      console.error(`delivery blocks: check failed, ${(err as Error).message}`);
    }
  },
} satisfies ExportedHandler<Env>;
