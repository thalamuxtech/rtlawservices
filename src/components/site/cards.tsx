import Link from "next/link";
import { SampleBadge, Stars } from "@/components/ui/primitives";
import type { Attorney, CaseResult, Review } from "@/content/proof";
import { cn } from "@/lib/utils";

/**
 * A case result set like an entry in a law reporter: a gold rule marks the
 * decision, the outcome leads, and the facts follow in order.
 */
export function CaseCard({ c, dark }: { c: CaseResult; dark?: boolean; index?: number }) {
  return (
    <Link href={`/case-results/${c.slug}/`} className="group flex h-full flex-col border-t-2 border-brass pt-6">
      <div className="flex items-center justify-between gap-3">
        <p className={cn("text-sm font-bold", dark ? "text-stone-dark" : "text-stone")}>
          {c.category}, {c.year}
        </p>
        {c.demo && <SampleBadge dark={dark} />}
      </div>
      <p
        className={cn(
          "font-serif-display mt-3 text-[2rem] leading-tight decoration-1 underline-offset-[6px] group-hover:underline",
          dark ? "text-brass-light" : "text-brass-ink",
        )}
      >
        {c.headline}
      </p>
      <p className={cn("mt-3 max-w-[48ch] leading-relaxed", dark ? "text-stone-dark" : "text-stone")}>{c.clientProfile}</p>
      <p className={cn("mt-auto pt-6 text-sm", dark ? "text-stone-dark" : "text-stone")}>
        Time to decision: <span className={cn("font-bold", dark ? "text-paper" : "text-ink")}>{c.timeline}</span>
      </p>
    </Link>
  );
}

/** A review set as a pull quote, not a boxed card. */
export function ReviewCard({ r, large }: { r: Review; index?: number; large?: boolean }) {
  return (
    <figure className="flex h-full flex-col">
      <div className="flex items-center gap-3">
        <Stars rating={r.rating} />
        {r.demo && <SampleBadge />}
      </div>
      <blockquote
        className={cn(
          "font-serif-display mt-5 flex-1 italic leading-snug text-ink",
          large ? "text-[1.6rem] sm:text-[1.9rem]" : "text-[1.35rem]",
        )}
      >
        &ldquo;{r.quote}&rdquo;
      </blockquote>
      <figcaption className="mt-6 text-sm text-stone">
        <span className="font-bold text-ink">{r.name}</span>, {r.location}
        <span className="block">{r.matter}</span>
      </figcaption>
    </figure>
  );
}

export function AttorneyCard({ a }: { a: Attorney; index?: number }) {
  return (
    <Link
      href={`/attorneys/${a.slug}/`}
      className="group block overflow-hidden rounded-2xl border border-line bg-white transition-colors duration-500 hover:border-ink/40"
    >
      <div className="on-dark relative grid aspect-[4/3] place-items-center overflow-hidden bg-ink">
        <div aria-hidden className="grain absolute inset-0" />
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(177,151,107,0.35),transparent_60%)]" />
        <span className="font-serif-display relative text-7xl text-brass-light">{a.initials}</span>
        <span className="absolute bottom-4 left-4 text-sm text-stone-dark">Portrait to follow</span>
        {a.demo && <SampleBadge dark className="absolute right-4 top-4" />}
      </div>
      <div className="p-7">
        <p className="font-serif-display text-[1.75rem] text-ink decoration-1 underline-offset-[6px] group-hover:underline">{a.name}</p>
        <p className="mt-1 text-[0.95rem] font-bold text-brass-ink">{a.title}</p>
        <p className="mt-4 text-sm text-stone">
          Admitted: {a.admissions[0]}
          {a.practiceLimitation && <span className="block">{a.practiceLimitation}</span>}
        </p>
        <p className="mt-2 text-sm text-stone">Languages: {a.languages.join(", ")}</p>
      </div>
    </Link>
  );
}
