import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/site/PageHero";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { Container } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Book a consultation",
  description: "Choose a matter, a format and a time shown in your own time zone. Video, phone or in-office consultations.",
};

export default function BookPage() {
  return (
    <>
      <PageHero
        title="Choose a time that suits you"
        lede="Five short steps. Times appear in your own time zone, and our intake team confirms every request by email within one business day."
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
