"use client";

// Google Analytics 4, loaded directly so the history recorded under this
// measurement ID continues. The ID is public by design.
const MEASUREMENT_ID = "G-TRL5XPGMHC";

type Gtag = (...args: unknown[]) => void;

export async function startAnalytics() {
  if (typeof window === "undefined" || document.getElementById("ga4")) return;
  const w = window as unknown as { dataLayer: unknown[]; gtag: Gtag };
  w.dataLayer = w.dataLayer || [];
  // gtag.js expects the arguments object itself, not an array.
  w.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments);
  };
  w.gtag("js", new Date());
  w.gtag("config", MEASUREMENT_ID);
  const s = document.createElement("script");
  s.id = "ga4";
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(s);
}
