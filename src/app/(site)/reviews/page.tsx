import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { ReviewCard } from "@/components/site/cards";
import { BookingBand } from "@/components/home/Sections";
import { Container, SampleBadge, Stars } from "@/components/ui/primitives";
import { REVIEWS } from "@/content/live";

export const metadata: Metadata = {
  title: "Client reviews",
  description: "What clients say about working with RT Law Services, from family green cards to extraordinary ability petitions.",
};

export default function ReviewsPage() {
  const avg = REVIEWS.length ? REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length : 0;
  const anyDemo = REVIEWS.some((r) => r.demo);
  return (
    <>
      <PageHero
        title="In our clients' words"
        lede="Reviews are published with the reviewer's permission. We show first names and initials only, to protect privacy."
        crumbs={[{ label: "Reviews" }]}
        aside={
          REVIEWS.length ? (
            <div className="rounded-2xl border border-line-dark bg-ink-raised/80 p-6">
              {anyDemo && <SampleBadge dark className="mb-4" />}
              <p className="font-serif-display text-6xl text-brass-light">{avg.toFixed(1)}</p>
              <Stars rating={Math.round(avg)} className="mt-3" />
              <p className="mt-3 text-sm text-stone-dark">Average of {REVIEWS.length} reviews on this page</p>
            </div>
          ) : undefined
        }
      />
      <section className="py-20">
        <Container>
          <div className="columns-1 gap-12 sm:columns-2 lg:columns-3 [&>*]:mb-12 [&>*]:break-inside-avoid [&>*]:border-t [&>*]:border-ink/15 [&>*]:pt-8">
            {REVIEWS.map((r, i) => <ReviewCard key={r.id} r={r} index={i % 3} />)}
          </div>
          <p className="mt-10 max-w-3xl text-sm leading-relaxed text-stone">
            Reviews describe individual experiences. Prior results do not guarantee a similar outcome, and each case depends on its own facts.
          </p>
        </Container>
      </section>
      <BookingBand />
    </>
  );
}
