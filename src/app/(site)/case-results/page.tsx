import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { CaseLibrary } from "@/components/proof/CaseLibrary";
import { BookingBand } from "@/components/home/Sections";
import { Container } from "@/components/ui/primitives";
import { CASES } from "@/content/proof";
import { RESULTS_CAVEAT } from "@/content/site";

export const metadata: Metadata = {
  title: "Case results",
  description: "Anonymised outcomes from family, citizenship, extraordinary ability, National Interest Waiver and employer matters, published with client consent.",
};

export default function CaseResultsPage() {
  return (
    <>
      <PageHero
        title="Outcomes, documented"
        lede="Each summary shows the client's situation, the obstacle, our approach and how long the matter took. Names and identifying details are removed, and every result is published with the client's consent."
        crumbs={[{ label: "Case results" }]}
      />
      <section className="py-20">
        <Container>
          {CASES.length ? <CaseLibrary cases={CASES} /> : <p className="text-stone">Case results will appear here once published with client consent.</p>}
          <div className="mt-14 rounded-2xl border border-line bg-mist p-6 text-sm leading-relaxed text-stone">
            <strong className="text-ink">About these results.</strong> {RESULTS_CAVEAT} Timelines reflect the conditions of
            each case at the time and do not predict current processing.
          </div>
        </Container>
      </section>
      <BookingBand />
    </>
  );
}
