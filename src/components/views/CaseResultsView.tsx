"use client";

import { PageHero } from "@/components/site/PageHero";
import { CaseLibrary } from "@/components/proof/CaseLibrary";
import { BookingBand } from "@/components/home/Sections";
import { Container } from "@/components/ui/primitives";

import { RESULTS_CAVEAT } from "@/content/site";
import { useContent } from "@/content/LiveContent";

export function CaseResultsView() {
  const { CASES } = useContent();
  return (
    <>
      <PageHero
        title="Success stories, documented"
        lede="Each summary shows the client's situation, the obstacle, our approach and how long the matter took. Names and identifying details are removed, and every result is published with the client's consent."
        crumbs={[{ label: "Success stories" }]}
      />
      <section className="py-20">
        <Container>
          {CASES.length ? <CaseLibrary cases={CASES} /> : <div className="mx-auto max-w-xl rounded-3xl border border-line bg-white p-10 text-center">
              <p className="font-serif-display text-3xl text-ink">Success stories are on their way</p>
              <p className="mt-3 text-stone">Each story is published only with the client&rsquo;s written consent and with identifying details removed.</p>
            </div>}
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
