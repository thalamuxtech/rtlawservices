import Link from "next/link";
import { MarqueePause } from "./MarqueePause";
import { Stars } from "@/components/ui/primitives";
import type { Review } from "@/content/types";
import { ILLUSTRATIVE_NOTE } from "@/content/live";
import { cn } from "@/lib/utils";

const BUILD = new Date();

function ago(date: string) {
  const days = Math.max(0, Math.round((BUILD.getTime() - new Date(`${date}T12:00:00Z`).getTime()) / 86_400_000));
  if (days < 1) return "today";
  const unit = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"} ago`;
  if (days < 7) return unit(days, "day");
  if (days < 30) return unit(Math.round(days / 7), "week");
  if (days < 365) return unit(Math.max(1, Math.round(days / 30)), "month");
  return unit(Math.round(days / 365), "year");
}

const AVATAR = ["bg-[#2f4858]", "bg-[#7d6638]", "bg-[#3d5a3c]", "bg-[#5b3a55]", "bg-[#33415c]", "bg-[#6b4226]"];

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-label="Google review" role="img" className="size-5">
      <path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h6a5.1 5.1 0 0 1-2.2 3.4v2.8h3.6c2.1-1.9 3.2-4.8 3.2-8.2z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.4-2.7l-3.6-2.8c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.7H2v2.9A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.7 13.9a6.6 6.6 0 0 1 0-4.2V6.8H2a11 11 0 0 0 0 9.9l3.7-2.8z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2 6.8l3.7 2.9C6.6 7.4 9.1 5.4 12 5.4z" />
    </svg>
  );
}

function ReviewTile({ r, i }: { r: Review; i: number }) {
  const isNew = (BUILD.getTime() - new Date(`${r.date}T12:00:00Z`).getTime()) / 86_400_000 < 45;
  return (
    <figure className="flex w-[300px] shrink-0 flex-col rounded-2xl border border-line bg-white p-5 shadow-[0_20px_40px_-32px_rgba(20,24,31,0.5)] sm:w-[340px]">
      <div className="flex items-center gap-3">
        <span aria-hidden className={cn("grid size-11 shrink-0 place-items-center rounded-full font-bold text-white", AVATAR[i % AVATAR.length])}>
          {r.name
            .split(/\s+/)
            .slice(0, 2)
            .map((p) => p[0])
            .join("")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-ink">{r.name}</p>
          <p className="text-[0.82rem] text-stone">
            {ago(r.date)}
            {isNew && <span className="ml-2 rounded bg-success px-1.5 py-0.5 text-[0.7rem] font-bold text-white">NEW</span>}
          </p>
        </div>
        {r.source === "google" ? <GoogleMark /> : null}
      </div>
      <Stars rating={r.rating} className="mt-3" />
      <blockquote className="mt-3 line-clamp-5 text-[0.95rem] leading-relaxed text-ink-soft">{r.quote}</blockquote>
      <figcaption className="mt-auto pt-4 text-[0.82rem] font-bold text-brass-ink">{r.matter}</figcaption>
    </figure>
  );
}

export function ReviewsMarquee({ reviews, illustrative = false }: { reviews: Review[]; illustrative?: boolean }) {
  if (!reviews.length) return null;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  // One row of every review. Speed scales with the count, so each card moves at the same pace.
  const rows = [reviews];
  const fromGoogle = reviews.some((r) => r.source === "google");

  return (
    <section className="overflow-hidden bg-white py-24 sm:py-28" aria-labelledby="reviews-heading">
      <div className="container-luxe flex flex-wrap items-end justify-between gap-8">
        <div>
          <h2 id="reviews-heading" className="font-serif-display text-[2.1rem] text-ink sm:text-5xl">
            {/* A recommendation claim needs real reviews behind it, so placeholders keep the neutral heading. */}
            {illustrative ? <>In our clients&rsquo; words</> : "Our clients keep recommending us"}
          </h2>
          {illustrative ? (
            <p className="mt-5 max-w-xl text-stone">{ILLUSTRATIVE_NOTE}</p>
          ) : (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="font-serif-display text-4xl text-ink">{avg.toFixed(1)}</span>
              <Stars rating={Math.round(avg)} />
              <span className="text-stone">
                from {reviews.length} {fromGoogle ? "Google and client" : "client"} reviews
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <MarqueePause target="reviews-marquee" />
          <Link
            href="/reviews/"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/25 px-6 font-bold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
          >
            Read all reviews
          </Link>
        </div>
      </div>

      <div id="reviews-marquee" className="marquee-mask mt-14" role="region" aria-label="Client reviews">
        {rows.map((row, ri) => (
          <div key={ri} className="marquee-row group/row flex overflow-hidden">
            <div className="marquee-track flex w-max gap-5 pr-5" style={{ animationDuration: `${Math.max(40, row.length * 9)}s` }}>
              {[...row, ...row].map((r, i) => (
                <div key={`${r.id}-${i}`} aria-hidden={i >= row.length || undefined}>
                  <ReviewTile r={r} i={i} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
