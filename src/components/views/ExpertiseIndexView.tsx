"use client";

import { PageHero } from "@/components/site/PageHero";
import { ExpertiseIndex } from "@/components/site/ExpertiseIndex";
import { BookingBand } from "@/components/home/Sections";
import { ButtonLink, Container } from "@/components/ui/primitives";
import { TRACK_LABELS, type Expertise } from "@/content/expertise";
import type { Attorney, CaseResult } from "@/content/types";
import { useContent } from "@/content/LiveContent";
import { HEADINGS } from "@/content/headings";

const meta = (e: Expertise, CASES: CaseResult[], ATTORNEYS: Attorney[]) => {
  const n = CASES.filter((c) => c.expertise === e.slug).length;
  const lead = ATTORNEYS.find((a) => a.leads.includes(e.slug));
  const parts = [lead && `Led by ${lead.name}`, n > 0 && `${n} published result${n > 1 ? "s" : ""}`].filter(Boolean);
  return parts.length ? parts.join(". ") : undefined;
};

export function ExpertiseIndexView() {
  const { ATTORNEYS, CASES, byTrack } = useContent();
  const describe = (e: Expertise) => meta(e, CASES, ATTORNEYS);
  return (
    <>
      <PageHero
        title={HEADINGS["/expertise/"].title}
        lede={HEADINGS["/expertise/"].lede}
        crumbs={[{ label: "Expertise" }]}
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="#individuals" variant="outline-light">{TRACK_LABELS.individuals}</ButtonLink>
          <ButtonLink href="#professionals" variant="outline-light">{TRACK_LABELS.professionals}</ButtonLink>
          <ButtonLink href="#relief" variant="outline-light">{TRACK_LABELS.relief}</ButtonLink>
          <ButtonLink href="/start-here/#path-finder">Find my path</ButtonLink>
        </div>
      </PageHero>

      <section id="individuals" className="scroll-mt-28 py-24">
        <Container className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <h2 className="font-serif-display text-4xl text-ink sm:text-5xl">{TRACK_LABELS.individuals}</h2>
            <p className="mt-4 max-w-sm text-lg leading-relaxed text-stone">Plain explanations for first-time applicants, with the detail experienced applicants expect.</p>
          </div>
          <ExpertiseIndex items={byTrack("individuals")} meta={describe} />
        </Container>
      </section>

      <section id="professionals" className="on-dark scroll-mt-28 bg-ink py-24 text-paper">
        <Container className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <h2 className="font-serif-display text-4xl sm:text-5xl">{TRACK_LABELS.professionals}</h2>
            <p className="mt-4 max-w-sm text-lg leading-relaxed text-stone-dark">Criteria-led petitions, evidence strategy and premium processing where available, for clients anywhere in the United States.</p>
          </div>
          <ExpertiseIndex items={byTrack("professionals")} dark meta={describe} />
        </Container>
      </section>

      <section id="relief" className="scroll-mt-28 py-24">
        <Container className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <h2 className="font-serif-display text-4xl text-ink sm:text-5xl">{TRACK_LABELS.relief}</h2>
            <p className="mt-4 max-w-sm text-lg leading-relaxed text-stone">Humanitarian protection, status for students and residents, and the work and travel documents that keep a case on track.</p>
          </div>
          <ExpertiseIndex items={byTrack("relief")} meta={describe} />
        </Container>
      </section>

      <section className="border-t border-line py-24">
        <Container className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <h2 className="font-serif-display text-4xl text-ink sm:text-5xl">{TRACK_LABELS.other}</h2>
            <p className="mt-4 max-w-sm text-lg leading-relaxed text-stone">Estate planning grew from the firm&rsquo;s fiduciary roots.</p>
          </div>
          <ExpertiseIndex items={byTrack("other")} meta={describe} />
        </Container>
      </section>
      <BookingBand />
    </>
  );
}
