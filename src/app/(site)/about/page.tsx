import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { BookingBand, Pillars } from "@/components/home/Sections";
import { ButtonLink, Container } from "@/components/ui/primitives";
import { Logo } from "@/components/brand/Logo";
import { PAGES } from "@/content/pages";

export const metadata: Metadata = {
  title: "About the firm",
  description: "RT Law Services: an immigration-led law practice in Maryland with roots in fiduciary and cross-border advisory work.",
};

const { about } = PAGES;

export default function AboutPage() {
  return (
    <>
      <PageHero
        title={about.title}
        lede={about.lede}
        crumbs={[{ label: "About" }]}
      />
      <section className="py-20 sm:py-24">
        <Container className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow text-brass-ink">Our story</p>
            <h2 className="font-serif-display mt-3 text-4xl text-ink sm:text-5xl">{about.storyHeading}</h2>
            {about.storyText
              .split(/\n+/)
              .filter(Boolean)
              .map((para, k) => (
                <p key={k} className="mt-6 text-lg leading-relaxed text-stone">
                  {para}
                </p>
              ))}
            <div className="mt-10 grid size-48 place-items-center rounded-full bg-white shadow-[0_30px_80px_-30px_rgba(177,151,107,0.6)]">
              <Logo variant="mark" className="w-28" />
            </div>
          </div>
          <ol className="relative grid gap-10 border-l border-line pl-10">
            {about.timeline.map((t) => (
              <li key={`${t.year}-${t.title}`} className="relative">
                <span aria-hidden className="absolute -left-[2.95rem] top-1.5 size-4 rounded-full border-2 border-brass bg-paper" />
                <p className="eyebrow text-brass-ink">{t.year}</p>
                <h3 className="font-serif-display mt-2 text-3xl text-ink">{t.title}</h3>
                <p className="mt-3 leading-relaxed text-stone">{t.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>
      <section className="on-dark bg-ink py-20 text-paper sm:py-24">
        <Container>
          <p className="eyebrow text-brass-light">Values</p>
          <h2 className="font-serif-display mt-3 text-4xl sm:text-5xl">{about.valuesHeading}</h2>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {about.values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-line-dark bg-ink-raised p-8">
                <span aria-hidden className="block h-px w-10 bg-brass" />
                <h3 className="font-serif-display mt-6 text-2xl">{v.title}</h3>
                <p className="mt-3 leading-relaxed text-stone-dark">{v.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
      <Pillars />
      <section className="py-20">
        <Container className="flex flex-wrap items-center justify-between gap-6">
          <h2 className="font-serif-display text-3xl text-ink sm:text-4xl">Meet the people behind the work</h2>
          <ButtonLink href="/attorneys/" variant="outline">Our attorneys</ButtonLink>
        </Container>
      </section>
      <BookingBand />
    </>
  );
}
