import type { Metadata } from "next";
import { Clock3, FileCheck2, Landmark, Video } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { BookingBand } from "@/components/home/Sections";
import { ButtonLink, Container } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Clients outside the United States",
  description: "Immigration and estate planning support for clients and families abroad, with consultations scheduled in your time zone.",
};

const ITEMS = [
  { icon: Video, title: "Consultations in your time zone", text: "Book online and see times in your local time. Video consultations work from anywhere with a stable connection." },
  { icon: FileCheck2, title: "Documents from abroad", text: "We check civil documents against U.S. Department of State requirements for your country before anything is submitted." },
  { icon: Landmark, title: "Embassy interviews", text: "We prepare applicants for consular interviews by video, in the language they are most comfortable with, using an interpreter where needed." },
  { icon: Clock3, title: "Planning across borders", text: "For families with property or heirs in more than one country, we prepare Maryland wills and trusts and coordinate with advisers abroad." },
];

export default function DiasporaPage() {
  return (
    <>
      <PageHero
        title="A U.S. firm you can reach from anywhere"
        lede="If you live outside the United States, or your family does, distance should not make the process harder to follow."
        crumbs={[{ label: "Clients abroad" }]}
      >
        <ButtonLink href="/book/">Book in your time zone</ButtonLink>
      </PageHero>
      <section className="py-20 sm:py-24">
        <Container className="grid gap-5 sm:grid-cols-2">
          {ITEMS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-line bg-white p-8">
              <Icon aria-hidden className="size-7 text-brass-ink" />
              <h2 className="font-serif-display mt-6 text-3xl text-ink">{title}</h2>
              <p className="mt-3 leading-relaxed text-stone">{text}</p>
            </div>
          ))}
        </Container>
      </section>
      <section className="on-dark bg-ink py-20 text-paper">
        <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow text-brass-light">Diaspora Connect</p>
            <h2 className="font-serif-display mt-3 text-4xl sm:text-5xl">Connecting the diaspora with home</h2>
          </div>
          <p className="text-lg leading-relaxed text-stone-dark">
            The Diaspora Connect seminar series was created by the founders of RT as a platform for the Pan-African
            diaspora in the United States to explore business, investment and family ties with home countries. Event
            announcements will appear on this page.
          </p>
        </Container>
      </section>
      <BookingBand />
    </>
  );
}
