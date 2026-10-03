import Link from "next/link";
import { Stars } from "@/components/ui/primitives";
import { DocumentPreview } from "@/components/proof/ApprovalDocument";
import type { Attorney, CaseResult, Review } from "@/content/types";
import { cn } from "@/lib/utils";

/**
 * A case result set like an entry in a law reporter: a gold rule marks the
 * decision, the outcome leads, and the facts follow in order.
 */
export function CaseCard({ c, dark }: { c: CaseResult; dark?: boolean; index?: number }) {
  return (
    <Link href={`/case-results/${c.slug}/`} className="group flex h-full flex-col">
      {c.documentUrl && <DocumentPreview c={c} />}
      <div className="mt-6 flex flex-1 flex-col border-t-2 border-brass pt-5">
      <div className="flex items-center justify-between gap-3">
        <p className={cn("text-sm font-bold", dark ? "text-stone-dark" : "text-stone")}>
          {c.category}, {c.year}
        </p>
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
      </div>
    </Link>
  );
}

/** A review set as a pull quote, not a boxed card. */
export function ReviewCard({ r, large }: { r: Review; index?: number; large?: boolean }) {
  return (
    <figure className="flex h-full flex-col">
      <div className="flex items-center gap-3">
        <Stars rating={r.rating} />
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

/** Bar admissions, leaving out placeholder text that is not an admission. */
export const admissionsOf = (a: Attorney) => (a.admissions ?? []).filter((x) => x.trim() && !/to be confirmed/i.test(x));

export function AttorneyPortrait({ a, className }: { a: Attorney; className?: string }) {
  return (
    <div className={cn("on-dark relative grid place-items-center overflow-hidden bg-ink", className)}>
      {a.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={a.photoUrl} alt={`Portrait of ${a.name}`} className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
      ) : (
        <>
          <div aria-hidden className="grain absolute inset-0" />
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(177,151,107,0.4),transparent_60%)]" />
          <span aria-hidden className="absolute aspect-square w-[58%] max-w-64 rounded-full border border-brass/30" />
          <span aria-hidden className="absolute aspect-square w-[78%] max-w-80 rounded-full border border-brass/15" />
          <span className="font-serif-display relative text-7xl text-brass-light">{a.initials}</span>
        </>
      )}
    </div>
  );
}

export function LanguageChips({ languages, className, dark }: { languages: string[]; className?: string; dark?: boolean }) {
  if (!languages?.length) return null;
  return (
    <ul aria-label="Languages" className={cn("flex flex-wrap gap-2", className)}>
      {languages.map((l) => (
        <li key={l} className={cn("rounded-full border px-3 py-1 text-sm font-bold", dark ? "border-line-dark text-paper" : "border-ink/15 text-ink")}>
          {l}
        </li>
      ))}
    </ul>
  );
}

export function AttorneyCard({ a }: { a: Attorney; index?: number }) {
  return (
    <Link
      href={`/attorneys/${a.slug}/`}
      className="group block overflow-hidden rounded-2xl border border-line bg-white transition-colors duration-500 hover:border-ink/40"
    >
      <AttorneyPortrait a={a} className="aspect-[4/3]" />
      <div className="p-7">
        <p className="font-serif-display text-[1.75rem] text-ink decoration-1 underline-offset-[6px] group-hover:underline">{a.name}</p>
        <p className="mt-1 text-[0.95rem] font-bold text-brass-ink">{a.title}</p>
        {admissionsOf(a).length > 0 && <p className="mt-4 text-sm text-stone">Admitted in {admissionsOf(a).join(", ")}</p>}
        {a.practiceLimitation && <p className="mt-1 text-sm text-stone">{a.practiceLimitation}</p>}
        <LanguageChips languages={a.languages} className="mt-4" />
      </div>
    </Link>
  );
}
