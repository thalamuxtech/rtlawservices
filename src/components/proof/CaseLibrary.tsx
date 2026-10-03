"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CaseCard } from "@/components/site/cards";
import type { CaseResult } from "@/content/types";
import { cn } from "@/lib/utils";

type Filter = "all" | "individuals" | "professionals";

export function CaseLibrary({ cases }: { cases: CaseResult[] }) {
  const [track, setTrack] = useState<Filter>("all");
  const [category, setCategory] = useState("all");

  const categories = useMemo(
    () => Array.from(new Set(cases.filter((c) => track === "all" || c.track === track).map((c) => c.category))),
    [cases, track],
  );
  const shown = cases.filter((c) => (track === "all" || c.track === track) && (category === "all" || c.category === category));

  const chip = (active: boolean) =>
    cn(
      "min-h-11 rounded-full border px-5 text-sm font-bold transition-colors duration-300",
      active ? "border-ink bg-ink text-paper" : "border-line bg-white text-stone hover:border-ink hover:text-ink",
    );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by track">
        {(["all", "individuals", "professionals"] as Filter[]).map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={track === t}
            className={chip(track === t)}
            onClick={() => {
              setTrack(t);
              setCategory("all");
            }}
          >
            {t === "all" ? "All results" : t === "individuals" ? "Individuals and families" : "Professionals and employers"}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        <button type="button" aria-pressed={category === "all"} className={cn(chip(category === "all"), "px-4 text-[0.8rem]")} onClick={() => setCategory("all")}>
          Every category
        </button>
        {categories.map((c) => (
          <button key={c} type="button" aria-pressed={category === c} className={cn(chip(category === c), "px-4 text-[0.8rem]")} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>
      <p className="mt-8 text-sm text-stone" aria-live="polite">
        Showing {shown.length} of {cases.length} results
      </p>
      <motion.ul layout className="mt-8 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence initial={false} mode="popLayout">
          {shown.map((c, i) => (
            <motion.li
              key={c.slug}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <CaseCard c={c} index={i} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}
