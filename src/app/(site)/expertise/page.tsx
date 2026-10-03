import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { ExpertiseIndex } from "@/components/site/ExpertiseIndex";
import { BookingBand } from "@/components/home/Sections";
import { ButtonLink, Container } from "@/components/ui/primitives";
import { byTrack, type Expertise } from "@/content/expertise";
import { ATTORNEYS, CASES } from "@/content/proof";

export const metadata: Metadata = {
  title: "Areas of expertise",
  description:
    "Family green cards, citizenship, spouse work permits, appeals and waivers, consular processing, O-1, EB-1A, National Interest Waiver, H-1B, L-1, investor visas, PERM and estate planning.",
};

const meta = (e: Expertise) => {
  const n = CASES.filter((c) => c.expertise === e.slug).length;
  const lead = ATTORNEYS.find((a) => a.leads.includes(e.slug));
  const parts = [lead && `Led by ${lead.name}`, n > 0 && `${n} published result${n > 1 ? "s" : ""}`].filter(Boolean);
  return parts.length ? parts.join(". ") : undefined;
};

export default function ExpertisePage() {
  return (
    <>
      <PageHero
        title="Immigration counsel for every stage of the journey"
        lede="Two tracks share one standard of care. Choose the situation that matches yours, or answer three questions to find your path."
        crumbs={[{ label: "Expertise" }]}
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="#individuals" variant="outline-light">Individuals and families</ButtonLink>
          <ButtonLink href="#professionals" variant="outline-light">Professionals and employers</ButtonLink>
          <ButtonLink href="/start-here/#path-finder">Find my path</ButtonLink>
        </div>
      </PageHero>

      <section id="individuals" className="scroll-mt-28 py-24">
        <Container className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <h2 className="font-serif-display text-4xl text-ink sm:text-5xl">Individuals and families</h2>
            <p className="mt-4 max-w-sm text-lg leading-relaxed text-stone">Plain explanations for first-time applicants, with the detail experienced applicants expect.</p>
          </div>
          <ExpertiseIndex items={byTrack("individuals")} meta={meta} />
        </Container>
      </section>

      <section id="professionals" className="on-dark scroll-mt-28 bg-ink py-24 text-paper">
        <Container className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <h2 className="font-serif-display text-4xl sm:text-5xl">Professionals, founders and employers</h2>
            <p className="mt-4 max-w-sm text-lg leading-relaxed text-stone-dark">Criteria-led petitions, evidence strategy and premium processing where available, for clients anywhere in the United States.</p>
          </div>
          <ExpertiseIndex items={byTrack("professionals")} dark meta={meta} />
        </Container>
      </section>

      <section className="py-24">
        <Container className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <h2 className="font-serif-display text-4xl text-ink sm:text-5xl">Planning for global families</h2>
            <p className="mt-4 max-w-sm text-lg leading-relaxed text-stone">Estate planning grew from the firm&rsquo;s fiduciary roots.</p>
          </div>
          <ExpertiseIndex items={byTrack("other")} meta={meta} />
        </Container>
      </section>
      <BookingBand />
    </>
  );
}
