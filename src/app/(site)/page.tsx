import { Hero } from "@/components/home/Hero";
import { ExpertiseTabs } from "@/components/home/ExpertiseTabs";
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
import { Container, SectionHeading } from "@/components/ui/primitives";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TwoDoors />
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
      <AttorneysPreview />
      <ProcessRibbon />
      <Pillars />
      <ReviewsPreview />
      <ResourcesPreview />
      <BookingBand />
    </>
  );
}
