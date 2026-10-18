import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/site/PageHero";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { Container } from "@/components/ui/primitives";
import { HEADINGS } from "@/content/headings";

export const metadata: Metadata = {
  title: "Book a consultation",
  description: "Choose a matter, a format and a time shown in your own time zone. Video or phone consultations.",
};

export default function BookPage() {
  return (
    <>
      <PageHero
        image="law-consultation"
        imagePosition="50% 30%"
        title={HEADINGS["/book/"].title}
        lede={HEADINGS["/book/"].lede}
        crumbs={[{ label: "Book" }]}
      />
      <section className="py-16 sm:py-20">
        <Container>
          <Suspense fallback={<p className="text-stone">Loading the booking calendar</p>}>
            <BookingFlow />
          </Suspense>
        </Container>
      </section>
    </>
  );
}
