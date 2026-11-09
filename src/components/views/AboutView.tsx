"use client";

import { PageHero } from "@/components/site/PageHero";
import { BookingBand, Pillars } from "@/components/home/Sections";
import { ButtonLink, Container } from "@/components/ui/primitives";
import { Logo } from "@/components/brand/Logo";
import { AttorneyPortrait } from "@/components/site/cards";
import { useContent } from "@/content/LiveContent";
import { pageLd } from "@/content/schema";
import { TEAM } from "@/content/team";
import Link from "next/link";

export function AboutView() {
  const { PAGES, ATTORNEYS, SITE } = useContent();
  const { about } = PAGES;
  // The firm's leader, shown when a published profile carries the title.
  const lead = ATTORNEYS.find((a) => !a.demo && /managing partner/i.test(a.title));
  return (
    <>
      <PageHero
        image="path-forward"
        imagePosition="50% 55%"
        title={about.title}
        lede={about.lede}
        crumbs={[{ label: "About" }]}
      />
      <section className="py-20 sm:py-24">
        <Container className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow text-brass-ink">Our story</p>
            <h2 className="font-serif-display mt-3 text-4xl text-ink sm:text-5xl">{about.storyHeading}</h2>
            {about.storyText
              .split(/\n+/)
              .filter(Boolean)
              .map((para, k) => (
                <p key={k} className="mt-6 text-lg leading-relaxed text-stone">
                  {para}
                </p>
              ))}
            <div className="mt-10 grid size-48 place-items-center rounded-full bg-white shadow-[0_30px_80px_-30px_rgba(177,151,107,0.6)]">
              <Logo variant="mark" className="w-28" />
            </div>
          </div>
          <ol className="relative grid gap-10 border-l border-line pl-10">
            {about.timeline.map((t) => (
              <li key={`${t.year}-${t.title}`} className="relative">
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
          <h2 className="font-serif-display mt-3 text-4xl sm:text-5xl">{about.valuesHeading}</h2>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {about.values.map((v) => (
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
      {lead && (
        <section className="py-20 sm:py-24">
          <Container>
            <p className="eyebrow text-brass-ink">Leadership</p>
            <div className="group mt-6 overflow-hidden rounded-3xl border border-line bg-white shadow-[0_40px_80px_-50px_rgba(20,24,31,0.5)] lg:grid lg:grid-cols-[0.75fr_1.25fr]">
              <AttorneyPortrait a={lead} className="aspect-[4/3] lg:aspect-auto lg:min-h-full" />
              <div className="p-8 sm:p-12">
                <p className="text-sm font-bold text-brass-ink">{lead.title}</p>
                <h2 className="font-serif-display mt-1 text-4xl text-ink sm:text-5xl">{lead.name}</h2>
                <span aria-hidden className="mt-5 flex items-center gap-1.5">
                  <span className="h-px w-14 bg-gradient-to-r from-brass to-brass/20" />
                  <span className="size-1.5 rotate-45 bg-brass" />
                </span>
                {[lead.bio[0], lead.bio.length > 2 ? lead.bio[lead.bio.length - 1] : lead.bio[1]].filter(Boolean).map((p) => (
                  <p key={p} className="mt-5 text-lg leading-relaxed text-stone">{p}</p>
                ))}
                <div className="mt-8 flex flex-wrap gap-3">
                  <ButtonLink href={`/attorneys/${lead.slug}/`}>Read the full profile</ButtonLink>
                  <ButtonLink href={`/book/?attorney=${lead.slug}`} variant="outline">Book with {lead.name.split(" ")[0]}</ButtonLink>
                </div>
              </div>
            </div>
          </Container>
        </section>
      )}
      <section className="border-t border-line bg-mist py-20">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow text-brass-ink">Our team</p>
              <h2 className="font-serif-display mt-3 text-3xl text-ink sm:text-4xl">Meet the people behind the work</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/team/">Leadership and advisors</ButtonLink>
              <ButtonLink href="/attorneys/" variant="outline">Our attorneys</ButtonLink>
            </div>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((m) => (
              <li key={m.slug}>
                <Link
                  href={`/team/#${m.slug}`}
                  className="group flex h-full items-center gap-4 rounded-2xl border border-line bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-[0_24px_50px_-30px_rgba(20,24,31,0.45)]"
                >
                  <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-full bg-ink shadow-[0_0_0_1px_rgba(199,167,103,0.6),0_0_0_4px_#fff,0_0_0_5px_rgba(199,167,103,0.35)]">
                    <Logo tone="dark" variant="mark" className="w-7" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold text-ink group-hover:underline">{m.name}</span>
                    <span className="mt-0.5 block text-sm text-stone">{m.role}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
      <BookingBand />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageLd(SITE, "AboutPage", "/about/", `About ${SITE.name}`)) }} />
    </>
  );
}
