import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { BookingBand, Pillars } from "@/components/home/Sections";
import { ButtonLink, Container } from "@/components/ui/primitives";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "About the firm",
  description: "RT Law Services: an immigration-led law practice in Maryland with roots in fiduciary and cross-border advisory work.",
};

const TIMELINE = [
  { year: "From 2015", title: "RT Fiduciary Services", text: "The practice began as a trust, estate and cross-border advisory business, serving families and companies with ties between the United States and West Africa." },
  { year: "Early years", title: "Diaspora Connect", text: "A seminar series created for the Pan-African diaspora in the United States, focused on business and investment links with home countries." },
  { year: "Today", title: "RT Law Services", text: "An immigration-led law practice serving families, professionals and employers across the United States, with estate planning for global families." },
];

const VALUES = [
  { title: "Knowledge first", text: "Advice rests on the law and the facts, checked before it is given." },
  { title: "Candour", text: "We explain risks plainly, including when a route is unlikely to succeed." },
  { title: "Care for the person", text: "Immigration decisions shape families and careers. We treat each case that way." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="Built on a decade of serving families across borders"
        lede="RT Law Services grew from a fiduciary practice into an immigration-led law firm. The constant has been clients whose lives and plans cross national borders."
        crumbs={[{ label: "About" }]}
      />
      <section className="py-20 sm:py-24">
        <Container className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow text-brass-ink">Our story</p>
            <h2 className="font-serif-display mt-3 text-4xl text-ink sm:text-5xl">From fiduciary roots to immigration counsel</h2>
            <p className="mt-6 text-lg leading-relaxed text-stone">
              Work with trusts, estates and cross-border business taught us that legal problems rarely stop at one
              border. Immigration became the centre of the practice because it decides where families can live and where
              professionals can build their careers.
            </p>
            <div className="mt-10 grid size-48 place-items-center rounded-full bg-white shadow-[0_30px_80px_-30px_rgba(177,151,107,0.6)]">
              <Logo variant="mark" className="w-28" />
            </div>
          </div>
          <ol className="relative grid gap-10 border-l border-line pl-10">
            {TIMELINE.map((t) => (
              <li key={t.year} className="relative">
                <span aria-hidden className="absolute -left-[2.95rem] top-1.5 size-4 rounded-full border-2 border-brass bg-paper" />
                <p className="eyebrow text-brass-ink">{t.year}</p>
                <h3 className="font-serif-display mt-2 text-3xl text-ink">{t.title}</h3>
                <p className="mt-3 leading-relaxed text-stone">{t.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>
      <section className="on-dark bg-ink py-20 text-paper sm:py-24">
        <Container>
          <p className="eyebrow text-brass-light">Values</p>
          <h2 className="font-serif-display mt-3 text-4xl sm:text-5xl">How we practise</h2>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-2xl border border-line-dark bg-ink-raised p-8">
                <span aria-hidden className="block h-px w-10 bg-brass" />
                <h3 className="font-serif-display mt-6 text-2xl">{v.title}</h3>
                <p className="mt-3 leading-relaxed text-stone-dark">{v.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
      <Pillars />
      <section className="py-20">
        <Container className="flex flex-wrap items-center justify-between gap-6">
          <h2 className="font-serif-display text-3xl text-ink sm:text-4xl">Meet the people behind the work</h2>
          <ButtonLink href="/attorneys/" variant="outline">Our attorneys</ButtonLink>
        </Container>
      </section>
      <BookingBand />
    </>
  );
}
