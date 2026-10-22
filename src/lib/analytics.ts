"use client";

// Google Analytics 4, loaded only after the visitor accepts analytics cookies
// (components/site/CookieConsent.tsx). Until then no analytics script, cookie
// or request reaches Google. The measurement ID is public by design.
const MEASUREMENT_ID = "G-TRL5XPGMHC";
const CONSENT_KEY = "rt-consent";
// Bump when the categories change, so visitors are asked again.
const CONSENT_VERSION = 1;

export type Consent = { analytics: boolean; version: number; at: string };

type Gtag = (...args: unknown[]) => void;
type W = Window & { dataLayer?: unknown[]; gtag?: Gtag } & Record<string, unknown>;

export function readConsent(): Consent | null {
  try {
    const c = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null") as Consent | null;
    return c && c.version === CONSENT_VERSION ? c : null;
  } catch {
    return null;
  }
}

export function saveConsent(analytics: boolean) {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics, version: CONSENT_VERSION, at: new Date().toISOString() }));
  } catch {}
  if (analytics) startAnalytics();
  else stopAnalytics();
}

/** Loads Google Analytics. Does nothing without the visitor's consent. */
export function startAnalytics() {
  if (typeof window === "undefined" || !readConsent()?.analytics) return;
  const w = window as unknown as W;
  w[`ga-disable-${MEASUREMENT_ID}`] = false;
  if (document.getElementById("ga4")) return;
  w.dataLayer = w.dataLayer || [];
  // gtag.js expects the arguments object itself, not an array.
  w.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments);
  };
  w.gtag("js", new Date());
  w.gtag("config", MEASUREMENT_ID, { anonymize_ip: true });
  const s = document.createElement("script");
  s.id = "ga4";
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(s);
}

/** Withdrawn consent: stop sending and remove the analytics cookies already set. */
function stopAnalytics() {
  const w = window as unknown as W;
  w[`ga-disable-${MEASUREMENT_ID}`] = true;
  const host = location.hostname;
  const domains = ["", host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
  for (const c of document.cookie.split(";")) {
    const name = c.split("=")[0].trim();
    if (!/^_ga|^_gid|^_gat/.test(name)) continue;
    for (const d of domains) document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ""}`;
  }
}

/**
 * Records a conversion, such as a booking request, when analytics is on.
 * Never sends what the visitor typed: only the event name and its category.
 */
export function track(event: string, params: Record<string, string | number> = {}) {
  const w = typeof window === "undefined" ? null : (window as unknown as W);
  if (!w?.gtag || !readConsent()?.analytics) return;
  w.gtag("event", event, params);
}
