"use client";

// Shown when something in the staff portal fails. A portal left open across a
// deploy can ask for script files that no longer exist; that case reloads
// once by itself, so staff pick up the new version without noticing.

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

const RELOADED = "rt-admin-reloaded";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const stale = error.name === "ChunkLoadError" || /Loading chunk|Failed to load chunk|Failed to fetch dynamically imported module/i.test(error.message);

  useEffect(() => {
    if (!stale) return;
    try {
      // Only once in a row, so a real outage cannot cause a reload loop.
      if (sessionStorage.getItem(RELOADED)) return;
      sessionStorage.setItem(RELOADED, "1");
      location.reload();
    } catch {}
  }, [stale]);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        sessionStorage.removeItem(RELOADED);
      } catch {}
    }, 10_000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-4 text-center">
      <div className="max-w-md">
        <h1 className="font-serif-display text-4xl text-ink">{stale ? "Updating the portal" : "Something went wrong"}</h1>
        <p className="mt-3 text-stone">
          {stale
            ? "A newer version of the portal is available. Reloading picks it up; nothing you saved is lost."
            : "This screen could not be shown. Reload to try again. If it keeps happening, tell your website developer what you were doing."}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <button type="button" onClick={() => location.reload()} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-6 font-bold text-paper hover:bg-ink-raised">
            <RotateCcw aria-hidden className="size-4" /> Reload
          </button>
          {!stale && (
            <button type="button" onClick={reset} className="inline-flex min-h-11 items-center rounded-full border border-line bg-white px-6 font-bold text-ink hover:border-ink/40">
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
