"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ExpertiseIndex } from "@/components/site/ExpertiseIndex";
import { byTrack, type Track } from "@/content/expertise";
import { cn } from "@/lib/utils";

const TABS: { id: Track; label: string }[] = [
  { id: "individuals", label: "Individuals and families" },
  { id: "professionals", label: "Professionals and employers" },
];

export function ExpertiseTabs() {
  const [tab, setTab] = useState<Track>("individuals");

  return (
    <div>
      <div role="tablist" aria-label="Areas of expertise" className="grid w-full grid-cols-2 rounded-2xl border border-line bg-white p-1.5 sm:inline-flex sm:w-auto sm:rounded-full">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative min-h-11 rounded-xl px-3 text-sm font-bold leading-tight transition-colors sm:rounded-full sm:px-7",
              tab === t.id ? "bg-ink text-paper" : "text-stone hover:text-ink",
            )}
          >
            {tab === t.id && (
              <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-xl bg-ink sm:rounded-full" transition={{ type: "spring", stiffness: 380, damping: 34 }} />
            )}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <ExpertiseIndex items={byTrack(tab)} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
