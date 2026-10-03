"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Post } from "@/content/types";
import { cn } from "@/lib/utils";

const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

export function BlogIndex({ posts }: { posts: Post[] }) {
  const categories = ["All", ...Array.from(new Set(posts.map((p) => p.category)))];
  const [cat, setCat] = useState("All");
  const shown = posts.filter((p) => cat === "All" || p.category === cat);
  const [lead, ...rest] = shown;

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter posts by topic">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={cat === c}
            onClick={() => setCat(c)}
            className={cn(
              "min-h-11 rounded-full border px-5 text-sm font-bold transition-colors duration-300",
              cat === c ? "border-ink bg-ink text-paper" : "border-line bg-white text-stone hover:border-ink hover:text-ink",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={cat}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {lead && (
            <Link href={`/blog/${lead.slug}/`} className="on-dark group mt-10 grid gap-8 rounded-3xl bg-ink p-8 text-paper sm:p-12 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
              <div>
                <p className="text-sm font-bold text-brass-light">Latest, {lead.category}</p>
                <h2 className="font-serif-display mt-4 text-4xl leading-tight decoration-1 underline-offset-8 group-hover:underline sm:text-5xl">{lead.title}</h2>
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-stone-dark">{lead.dek}</p>
              </div>
              <div className="text-sm text-stone-dark lg:text-right">
                <p>{fmt(lead.published)}</p>
                <p>{lead.readMinutes} minute read, {lead.sources.length} sources</p>
              </div>
            </Link>
          )}
          <ul className="mt-10 grid border-t border-ink/15 lg:grid-cols-2 lg:gap-x-12">
            {rest.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}/`} className="group block border-b border-ink/15 py-8">
                  <p className="text-sm text-stone">
                    {p.category}, {fmt(p.published)}
                  </p>
                  <h3 className="font-serif-display mt-2 text-[1.75rem] leading-tight text-ink decoration-1 underline-offset-[6px] group-hover:underline">{p.title}</h3>
                  <p className="mt-2 leading-relaxed text-stone">{p.dek}</p>
                  <p className="mt-3 text-sm font-bold text-brass-ink">
                    {p.readMinutes} minute read, {p.sources.length} sources
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          {!shown.length && <p className="mt-10 text-stone">No posts on this topic yet.</p>}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
