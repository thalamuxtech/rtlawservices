// Relay between the website's case status tracker and the USCIS Case Status
// API (Torch). It exists because the API's client secret must never reach a
// browser. It:
//   - accepts GET /?receipt=EAC9999103403 only from the firm's own website,
//   - obtains and reuses an OAuth 2.0 access token (client credentials),
//   - forwards the request to USCIS and returns only the `case_status` object,
//   - keeps no copy of receipt numbers or results, and logs neither.
//
// Secrets (set with `wrangler secret put`): USCIS_CLIENT_ID, USCIS_CLIENT_SECRET.
// Variables (wrangler.toml): USCIS_TOKEN_URL, USCIS_CASE_URL, ALLOWED_ORIGINS.

const RECEIPT = /^[A-Z]{3}\d{10}$/;

// Per-isolate token cache. USCIS tokens last about 30 minutes.
let token = null;
let tokenExpires = 0;

// Best-effort limit per visitor address within one isolate, on top of USCIS's
// own limits. Cloudflare's rate limiting rules can be added for a hard limit.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const hits = new Map();

function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

function cors(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  return allowed.includes(origin)
    ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Max-Age": "86400", Vary: "Origin" }
    : null;
}

function reply(status, body, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

async function accessToken(env) {
  if (token && Date.now() < tokenExpires) return token;
  const res = await fetch(env.USCIS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: env.USCIS_CLIENT_ID, client_secret: env.USCIS_CLIENT_SECRET }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) throw new Error("token");
  token = data.access_token;
  tokenExpires = Date.now() + (Number(data.expires_in) || 1799) * 1000 - 60_000;
  return token;
}

async function lookup(receipt, env, retry = true) {
  const res = await fetch(`${env.USCIS_CASE_URL.replace(/\/$/, "")}/${receipt}`, {
    headers: { Authorization: `Bearer ${await accessToken(env)}`, Accept: "application/json" },
  });
  // An expired token: fetch a new one once.
  if (res.status === 401 && retry) {
    token = null;
    return lookup(receipt, env, false);
  }
  return res;
}

const relay = {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = cors(origin, env);
    if (!headers) return reply(403, { error: "This service only answers the RT Law Services website." }, {});
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "GET") return reply(405, { error: "Method not allowed." }, headers);

    const receipt = (new URL(request.url).searchParams.get("receipt") || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!RECEIPT.test(receipt)) return reply(400, { error: "Enter a 13-character receipt number: three letters and ten digits." }, headers);
    if (limited(request.headers.get("CF-Connecting-IP") || "unknown")) return reply(429, { error: "Too many lookups. Please wait a minute and try again." }, headers);

    try {
      const res = await lookup(receipt, env);
      const data = await res.json().catch(() => ({}));
      if (res.status === 404 || res.status === 400) return reply(404, { error: "USCIS did not find a case with this receipt number. Check each character and try again." }, headers);
      if (res.status === 429) return reply(429, { error: "USCIS is limiting requests right now. Please try again shortly." }, headers);
      if (!res.ok || !data || typeof data.case_status !== "object") return reply(502, { error: "USCIS did not answer as expected. Please try again later." }, headers);
      return reply(200, { case_status: data.case_status }, headers);
    } catch {
      return reply(502, { error: "The USCIS service could not be reached. Please try again later." }, headers);
    }
  },
};

export default relay;
