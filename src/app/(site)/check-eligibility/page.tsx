import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { EligibilityChecker } from "@/components/evaluation/EligibilityChecker";
import { BookingBand } from "@/components/home/Sections";
import { Container } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Check your eligibility: EB-1A, O-1A and National Interest Waiver",
  description:
    "An interactive self-check against the EB-1A, O-1A and National Interest Waiver standards, with plain explanations of each criterion. Send your answers for a free attorney evaluation.",
};

export default function CheckEligibilityPage() {
  return (
    <>
      <PageHero
        eyebrow="Eligibility self-check"
        title="See how your record maps to the legal standard"
        lede="Tick the criteria your record could meet. The meter scores your answers as you go, and one click sends them to an attorney for a free evaluation."
        crumbs={[{ label: "Free evaluation", href: "/free-evaluation/" }, { label: "Check eligibility" }]}
      />
      <section className="py-14 sm:py-20">
        <Container>
          <EligibilityChecker />
          <p className="mt-14 max-w-3xl text-sm leading-relaxed text-stone">
            Criteria summarised from 8 CFR 204.5(h)(3) (EB-1A), 8 CFR 214.2(o)(3)(iii) (O-1A) and Matter of Dhanasar, 26 I&amp;N
            Dec. 884 (AAO 2016) (National Interest Waiver). Meeting a number of criteria is a first step, and officers then
            assess the record as a whole.
          </p>
        </Container>
      </section>
      <BookingBand />
    </>
  );
}
