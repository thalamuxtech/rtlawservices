import type { Metadata } from "next";
import { page } from "@/content/seo";
import { PageHero } from "@/components/site/PageHero";
import { CaseTracker } from "@/components/tools/CaseTracker";
import { BookingBand } from "@/components/home/Sections";
import { Container } from "@/components/ui/primitives";
import { HEADINGS } from "@/content/headings";

export const metadata: Metadata = page("/case-status-tracker/", {
  title: "USCIS case status tracker",
  description:
    "Check any USCIS case by receipt number and see its current status, full history and timeline in one place. Unofficial tool, not legal advice.",
});

export default function CaseStatusTrackerPage() {
  return (
    <>
      <PageHero
        eyebrow="Case status tracker"
        title={HEADINGS["/case-status-tracker/"].title}
        lede={HEADINGS["/case-status-tracker/"].lede}
        crumbs={[{ label: "Knowledge center", href: "/knowledge/" }, { label: "Case status tracker" }]}
        image="path-forward"
        imagePosition="50% 55%"
      />
      <section className="py-14 sm:py-20">
        <Container>
          <CaseTracker />
        </Container>
      </section>
      <BookingBand />
    </>
  );
}
