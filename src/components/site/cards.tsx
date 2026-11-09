import Link from "next/link";
import { Stars } from "@/components/ui/primitives";
import { DocumentPreview } from "@/components/proof/ApprovalDocument";
import type { Attorney, CaseResult, Review } from "@/content/types";
import { GuillocheRosette, GuillocheWeave } from "@/components/brand/Guilloche";
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
        <AttorneyEmblem a={a} />
      )}
    </div>
  );
}

/**
 * Stands in for a portrait: an engraved emblem in the style of the firm's
 * business card, with the attorney's monogram in a gold medallion. Sizes
 * follow the box (container units), so it works on cards and full heroes.
 */
const CORNERS = [
  "left-[3.6cqmin] top-[3.6cqmin] border-l-2 border-t-2",
  "right-[3.6cqmin] top-[3.6cqmin] border-r-2 border-t-2",
  "bottom-[3.6cqmin] left-[3.6cqmin] border-b-2 border-l-2",
  "bottom-[3.6cqmin] right-[3.6cqmin] border-b-2 border-r-2",
];

function AttorneyEmblem({ a }: { a: Attorney }) {
  return <Emblem initials={a.initials} title={a.title} />;
}

/** The engraved emblem with any monogram and title, for people without a photo. */
export function Emblem({ initials, title }: { initials: string; title: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center [container-type:size]">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,#222a36_0%,#14181f_58%,#0b0e13_100%)]" />
      <div aria-hidden className="grain absolute inset-0 opacity-70" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[38%] text-brass [mask-image:linear-gradient(to_top,black,transparent)]">
        <GuillocheWeave className="size-full opacity-60" />
      </div>
      <GuillocheRosette className="absolute size-[118cqmin] text-brass opacity-[0.22]" />
      {/* Gold frame with heavier corners, as on the card. */}
      <span aria-hidden className="absolute inset-[5cqmin] border border-brass/45" />
      {CORNERS.map((c) => (
        <span key={c} aria-hidden className={cn("absolute size-[7cqmin] border-[#c7a767]", c)} />
      ))}
      <div className="relative flex flex-col items-center">
        <span className="relative grid size-[50cqmin] place-items-center rounded-full bg-[radial-gradient(circle_at_50%_35%,#262e3b,#10141a_70%)] shadow-[0_0_0_1px_rgba(199,167,103,0.7),0_0_0_1.4cqmin_rgba(20,24,31,1),0_0_0_calc(1.4cqmin+1px)_rgba(199,167,103,0.45),0_2.5cqmin_6cqmin_rgba(0,0,0,0.55)]">
          <span aria-hidden className="absolute inset-[3cqmin] rounded-full border border-dashed border-brass/30" />
          <span className="font-serif-display bg-gradient-to-b from-[#f4e7c4] via-[#c7a767] to-[#8e7440] bg-clip-text text-[22cqmin] leading-none tracking-[0.02em] text-transparent">{initials}</span>
        </span>
        <span aria-hidden className="mt-[4.5cqmin] flex items-center gap-[1.4cqmin]">
          <span className="h-px w-[9cqmin] bg-gradient-to-r from-brass/0 to-brass" />
          <span className="size-[1.5cqmin] min-h-1 min-w-1 rotate-45 bg-[#e6d3a3]" />
          <span className="h-px w-[9cqmin] bg-gradient-to-l from-brass/0 to-brass" />
        </span>
        <span className="mt-[2.8cqmin] max-w-[82cqmin] text-balance text-center text-[max(10px,3.3cqmin)] font-bold uppercase leading-snug tracking-[0.26em] text-[#d9c59b]">{title}</span>
      </div>
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
