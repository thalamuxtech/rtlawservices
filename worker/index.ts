// Entry point. Static pages come from the assets in out/; this code answers
// only requests under /api/ (see run_worker_first in wrangler.jsonc).

import { adminRoutes } from "./admin";
import { authRoutes } from "./auth";
import { receiveEmail } from "./inbox";
import { clearBlocks, mailEvents } from "./mail";
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
    // One-time delivery check for the email recorded in meta/deliveryWatch.
    const watch = await getDoc(env.DB, "meta", "deliveryWatch");
    if (watch) {
      const events = await mailEvents(env, String(watch.messageId)).catch((err) => [{ email: "", event: `check failed: ${(err as Error).message}`, date: "" }]);
      console.log(`delivery report: ${events.map((e) => `${e.email} ${e.event}${e.reason ? ` (${e.reason})` : ""} ${e.date}`).join("; ") || "none yet"}`);
      if (events.some((e) => e.event !== "requests")) await deleteDoc(env.DB, "meta", "deliveryWatch");
    }
    try {
      const lifted = await clearBlocks(env);
      console.log(`delivery blocks: ${lifted.length ? `unblocked ${lifted.join(", ")}` : "none to lift"}`);
    } catch (err) {
      console.error(`delivery blocks: check failed, ${(err as Error).message}`);
    }
  },
} satisfies ExportedHandler<Env>;
