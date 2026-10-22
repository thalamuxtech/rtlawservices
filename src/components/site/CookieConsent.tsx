"use client";

// Asks before any analytics loads. Accept and Reject carry equal weight, and
// the choice can be changed later from "Cookie settings" in the footer.

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Cookie } from "lucide-react";
import { readConsent, saveConsent, startAnalytics } from "@/lib/analytics";

export const OPEN_COOKIE_SETTINGS = "rt-open-cookie-settings";

export function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const c = readConsent();
    if (c) {
      if (c.analytics) startAnalytics();
    } else {
      // Shown after the page has settled, so it does not compete with the first paint.
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS, show);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS, show);
  }, []);

  const choose = (analytics: boolean) => {
    saveConsent(analytics);
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-title"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-x-3 bottom-[5.5rem] z-[70] mx-auto max-w-lg rounded-3xl border border-line bg-paper p-6 shadow-[0_30px_80px_-30px_rgba(20,24,31,0.55)] sm:bottom-6 sm:left-6 sm:right-auto sm:mx-0"
        >
          <div className="flex items-start gap-4">
            <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-brass-pale text-brass-ink">
              <Cookie className="size-5" />
            </span>
            <div>
              <h2 id="cookie-title" className="font-serif-display text-2xl text-ink">
                Your privacy choice
              </h2>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-stone">
                We would like to use Google Analytics cookies to understand which pages help visitors. They load only if you accept, and never
                receive what you type into our forms. The site works the same either way.{" "}
                <Link href="/legal/privacy/" className="font-bold text-ink underline underline-offset-2">
                  Privacy policy
                </Link>
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => choose(false)} className="min-h-12 rounded-full border border-ink/25 bg-white font-bold text-ink transition-colors hover:border-ink">
              Reject
            </button>
            <button type="button" onClick={() => choose(true)} className="min-h-12 rounded-full bg-ink font-bold text-paper transition-colors hover:bg-ink-raised">
              Accept
            </button>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

/** Footer link that reopens the choice. */
export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS))} className={className}>
      Cookie settings
    </button>
  );
}
