import type { Metadata } from "next";
import { page } from "@/content/seo";
import { MessageSquare, ReceiptText, Video } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { BookingBand, ProcessRibbon } from "@/components/home/Sections";
import { Container } from "@/components/ui/primitives";
import { HEADINGS } from "@/content/headings";

export const metadata: Metadata = page("/how-we-work/", {
  title: "How we work",
  description: "Five stages from consultation to compliance, how we keep you informed, and how fees work.",
});

const DETAILS = [
  { icon: Video, title: "The consultation", text: "A focused meeting by video or phone. We review your goals and documents, explain the routes that fit and answer your questions. You leave with a recommended next step and a written fee quote." },
  { icon: ReceiptText, title: "Fees", text: "We agree the fee in writing before any work begins. Government filing fees are separate and paid directly to the agency. Our filing fees page lists the current government amounts." },
  { icon: MessageSquare, title: "Keeping you informed", text: "Your named attorney updates you at each milestone: filing, receipts, biometrics, any government request, the interview and the decision. We aim to reply to messages within one business day." },
];

export default function HowWeWorkPage() {
  return (
    <>
      <PageHero
        image="case-preparation"
        imagePosition="62% 45%"
        title={HEADINGS["/how-we-work/"].title}
        lede={HEADINGS["/how-we-work/"].lede}
        crumbs={[{ label: "How we work" }]}
      />
      <div className="py-12">
        {/* Names the stages for screen readers and search engines; the stages carry H3 headings. */}
        <h2 className="sr-only">The five stages of a matter</h2>
        <ProcessRibbon compact />
      </div>
      <section className="border-t border-line bg-mist py-20 sm:py-24">
        <Container className="grid gap-5 lg:grid-cols-3">
          {DETAILS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-line bg-white p-8">
              <Icon aria-hidden className="size-7 text-brass-ink" />
              <h2 className="font-serif-display mt-6 text-3xl text-ink">{title}</h2>
              <p className="mt-3 leading-relaxed text-stone">{text}</p>
            </div>
          ))}
        </Container>
      </section>
      <BookingBand />
    </>
  );
}
