import Link from "next/link";
import { Gauge } from "lucide-react";
import { Hero } from "@/components/home/Hero";
import { ExpertiseTabs } from "@/components/home/ExpertiseTabs";
import { StatsBand } from "@/components/home/StatsBand";
import {
  AttorneysPreview,
  BookingBand,
  FeaturedResults,
  Pillars,
  ProcessRibbon,
  ResourcesPreview,
  ReviewsPreview,
  TwoDoors,
} from "@/components/home/Sections";
import { ButtonLink, Container, SectionHeading } from "@/components/ui/primitives";
import { CTA } from "@/content/site";

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsBand />
      <TwoDoors />
      <section className="relative overflow-hidden bg-brass-pale/50 py-20">
        <Container className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div data-reveal>
            <p className="eyebrow text-brass-ink">For researchers, founders and leaders</p>
            <h2 className="font-serif-display mt-3 text-4xl text-ink sm:text-5xl">Could you qualify for EB-1A, O-1A or a National Interest Waiver?</h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-stone">
              Tick the criteria your record meets and watch the score update as you go. Then send your answers to an
              attorney for a free evaluation.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/check-eligibility/">Check my eligibility</ButtonLink>
              <ButtonLink href={CTA.evaluation.href} variant="outline">
                Request a free evaluation
              </ButtonLink>
            </div>
          </div>
          <Link
            href="/check-eligibility/"
            aria-label="Open the eligibility self-check"
            className="on-dark group relative mx-auto grid size-64 place-items-center rounded-full bg-ink text-paper shadow-[0_40px_100px_-30px_rgba(20,24,31,0.6)] sm:size-72"
            data-reveal
          >
            <svg viewBox="0 0 120 120" className="absolute inset-6 -rotate-90" aria-hidden>
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-line-dark)" strokeWidth="6" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-brass)" strokeWidth="6" strokeLinecap="round" strokeDasharray="327" strokeDashoffset="98" className="gauge-sweep" />
            </svg>
            <span className="text-center">
              <Gauge aria-hidden className="mx-auto size-7 text-brass-light" />
              <span className="font-serif-display mt-2 block text-5xl">3/10</span>
              <span className="text-sm text-stone-dark">criteria to begin</span>
            </span>
          </Link>
        </Container>
      </section>
      <section className="border-t border-line bg-mist py-24 sm:py-32" id="expertise">
        <Container>
          <SectionHeading
            title="Eleven matter types, two tracks"
            lede="Each page explains who the route suits, the forms involved, the evidence that matters and a realistic timeline."
          />
          <div className="mt-12">
            <ExpertiseTabs />
          </div>
        </Container>
      </section>
      <FeaturedResults />
      <ReviewsPreview />
      <AttorneysPreview />
      <ProcessRibbon />
      <Pillars />
      <ResourcesPreview />
      <BookingBand />
    </>
  );
}
