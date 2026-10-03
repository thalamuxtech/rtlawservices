import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CalendarRange, Compass, Gauge, Hourglass, Receipt, Search } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { BookingBand } from "@/components/home/Sections";
import { Container } from "@/components/ui/primitives";
import { EXPERTISE } from "@/content/expertise";
import { GLOSSARY } from "@/content/general";
import { POSTS } from "@/content/live";

export const metadata: Metadata = {
  title: "Knowledge center",
  description: "Guides, interactive tools and references on U.S. immigration: eligibility self-check, filing fees, processing times, the Visa Bulletin, a glossary and the blog.",
};

const TOOLS = [
  { href: "/check-eligibility/", icon: Gauge, title: "Eligibility self-check", text: "Score your record against EB-1A, O-1A and National Interest Waiver criteria." },
  { href: "/start-here/#path-finder", icon: Compass, title: "Path finder", text: "Three questions that point you to the right route." },
  { href: "/resources/filing-fees/", icon: Receipt, title: "Filing fees", text: "Government fees from the current USCIS schedule." },
  { href: "/resources/processing-times/", icon: Hourglass, title: "Processing times", text: "Read official timelines and spot a stuck case." },
  { href: "/resources/visa-bulletin/", icon: CalendarRange, title: "Visa Bulletin", text: "Priority dates and the two monthly charts, explained." },
  { href: "/resources/case-status/", icon: Search, title: "Case status", text: "Find your receipt number and read status messages." },
];

export default function KnowledgePage() {
  const topics = Array.from(new Set(POSTS.map((p) => p.category)));
  return (
    <>
      <PageHero
        title="Knowledge center"
        lede="Everything we publish, in one place: interactive tools, plain-language guides with official sources, and quick references for every stage of the process."
        crumbs={[{ label: "Knowledge center" }]}
      />

      <section className="py-20">
        <Container>
          <h2 className="font-serif-display text-4xl text-ink" data-reveal>
            Tools and references
          </h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map(({ href, icon: Icon, title, text }, i) => (
              <li key={href} data-reveal style={{ ["--reveal-delay" as string]: `${i * 70}ms` }}>
                <Link href={href} className="group flex h-full gap-5 rounded-2xl border border-line bg-white p-6 transition-colors duration-300 hover:border-ink/40">
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-mist text-brass-ink transition-colors duration-300 group-hover:bg-ink group-hover:text-brass-light">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <span>
                    <span className="font-serif-display block text-2xl text-ink">{title}</span>
                    <span className="mt-1 block leading-relaxed text-stone">{text}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-y border-line bg-mist py-20">
        <Container className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <div data-reveal>
            <h2 className="font-serif-display text-4xl text-ink">Guides by topic</h2>
            <p className="mt-4 text-stone">Every guide lists the official sources it relies on.</p>
            <Link href="/blog/" className="mt-6 inline-flex min-h-11 items-center gap-2 font-bold text-brass-ink hover:text-ink">
              <BookOpen aria-hidden className="size-4" /> All posts
            </Link>
          </div>
          <div className="grid gap-10">
            {topics.map((t) => (
              <div key={t} data-reveal>
                <h3 className="text-sm font-bold text-brass-ink">{t}</h3>
                <ul className="mt-2 border-t border-ink/15">
                  {POSTS.filter((p) => p.category === t).map((p) => (
                    <li key={p.slug}>
                      <Link href={`/blog/${p.slug}/`} className="group flex items-baseline justify-between gap-6 border-b border-ink/15 py-4">
                        <span className="font-serif-display text-xl text-ink decoration-1 underline-offset-4 group-hover:underline">{p.title}</span>
                        <span className="shrink-0 text-sm text-stone">{p.readMinutes} min</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <div data-reveal>
            <h2 className="font-serif-display text-4xl text-ink">Practice guides</h2>
            <p className="mt-4 text-stone">Each covers who the route suits, forms, timelines, a document checklist and common questions.</p>
          </div>
          <ul className="grid border-t border-ink/15 sm:grid-cols-2 sm:gap-x-10">
            {EXPERTISE.map((e) => (
              <li key={e.slug}>
                <Link href={`/expertise/${e.slug}/`} className="group flex items-baseline justify-between gap-4 border-b border-ink/15 py-4">
                  <span className="font-bold text-ink decoration-brass underline-offset-4 group-hover:underline">{e.title}</span>
                  <span className="text-sm text-brass-ink">{e.codes}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-t border-line bg-white py-20">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6" data-reveal>
            <h2 className="font-serif-display text-4xl text-ink">Glossary at a glance</h2>
            <Link href="/start-here/#glossary" className="inline-flex min-h-11 items-center font-bold text-brass-ink hover:text-ink">
              Full glossary
            </Link>
          </div>
          <dl className="mt-10 grid gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
            {GLOSSARY.slice(0, 9).map((g) => (
              <div key={g.term} className="border-t border-line py-5">
                <dt className="font-bold text-ink">{g.term}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-stone">{g.def}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>
      <BookingBand />
    </>
  );
}
