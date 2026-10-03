"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";

/** Lets visitors stop the moving reviews, as WCAG 2.2.2 requires for motion over five seconds. */
export function MarqueePause({ target }: { target: string }) {
  const [paused, setPaused] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={paused}
      aria-controls={target}
      onClick={() => {
        const next = !paused;
        setPaused(next);
        document.getElementById(target)?.classList.toggle("marquee-paused", next);
      }}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-ink/25 px-5 font-bold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
    >
      {paused ? <Play aria-hidden className="size-4" /> : <Pause aria-hidden className="size-4" />}
      {paused ? "Play reviews" : "Pause reviews"}
    </button>
  );
}
