"use client";

import Link from "next/link";
import { AlertTriangle, Building, Gavel, Landmark } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { PathFinder } from "@/components/site/PathFinder";
import { BookingBand, ProcessRibbon } from "@/components/home/Sections";
import { Container } from "@/components/ui/primitives";

import { GLOSSARY } from "@/content/general";
import { useContent } from "@/content/LiveContent";

const AGENCIES = [
  { icon: Building, name: "U.S. Citizenship and Immigration Services (USCIS)", text: "Decides most applications filed inside the United States, such as green cards, work permits and citizenship." },
  { icon: Landmark, name: "U.S. Department of State", text: "Runs U.S. embassies and consulates, which issue visas to people outside the United States." },
  { icon: Gavel, name: "Immigration courts", text: "Part of the Department of Justice. Judges hear cases about whether a person may remain in the United States." },
];

export function StartHereView() {
  const { byTrack } = useContent();
  return (
    <>
      <PageHero
        image="path-forward"
        imagePosition="50% 55%"
        title="U.S. immigration, explained in plain words"
        lede="If this is your first time dealing with the U.S. immigration system, begin with this page. It takes about ten minutes to read, and every term is defined as it appears."
        crumbs={[{ label: "Start here" }]}
      />

      <section className="py-20 sm:py-24">
        <Container className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow text-brass-ink">Step 1</p>
            <h2 className="font-serif-display mt-3 text-4xl text-ink sm:text-5xl">Who decides your case</h2>
            <p className="mt-5 text-lg leading-relaxed text-stone">
              Three parts of the U.S. government handle most immigration matters. Knowing which one has your case tells you
              where to look for updates.
            </p>
          </div>
          <ul className="grid gap-4">
            {AGENCIES.map(({ icon: Icon, name, text }) => (
              <li key={name} className="flex gap-5 rounded-2xl border border-line bg-white p-6">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-mist text-brass-ink">
                  <Icon aria-hidden className="size-5" />
                </span>
                <div>
                  <h3 className="font-bold text-ink">{name}</h3>
                  <p className="mt-1.5 leading-relaxed text-stone">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-y border-line bg-mist py-20 sm:py-24">
        <Container>
          <div className="max-w-3xl">
            <p className="eyebrow text-brass-ink">Step 2</p>
            <h2 className="font-serif-display mt-3 text-4xl text-ink sm:text-5xl">The main paths</h2>
            <p className="mt-5 text-lg leading-relaxed text-stone">
              Most people immigrate through family, through work, or through citizenship once they hold a green card.
              Each card below opens a page that explains the path in more detail.
            </p>
          </div>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...byTrack("individuals"), ...byTrack("professionals").slice(0, 1)].map((e) => (
              <li key={e.slug}>
                <Link href={`/expertise/${e.slug}/`} className="group block h-full rounded-2xl border border-line bg-white p-6 transition-colors duration-500 hover:border-brass/60">
                  <p className="text-[0.85rem] font-bold text-brass-ink">{e.codes}</p>
                  <h3 className="font-serif-display mt-2 text-2xl text-ink">{e.title}</h3>
                  <p className="mt-2 leading-relaxed text-stone">{e.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="py-20 sm:py-24">
        <Container>
          <div className="max-w-3xl">
            <p className="eyebrow text-brass-ink">Step 3</p>
            <h2 className="font-serif-display mt-3 text-4xl text-ink sm:text-5xl">What working with us looks like</h2>
          </div>
        </Container>
        <ProcessRibbon compact />
      </section>

      <section id="path-finder" className="scroll-mt-28 pb-20 sm:pb-24">
        <Container>
          <div className="mb-10 max-w-3xl">
            <p className="eyebrow text-brass-ink">Step 4</p>
            <h2 className="font-serif-display mt-3 text-4xl text-ink sm:text-5xl">Find your starting point</h2>
            <p className="mt-5 text-lg leading-relaxed text-stone">Three short questions. Your answers stay in your browser and are not stored.</p>
          </div>
          <PathFinder />
        </Container>
      </section>

      <section id="glossary" className="scroll-mt-28 border-t border-line bg-white py-20 sm:py-24">
        <Container>
          <div className="max-w-3xl">
            <p className="eyebrow text-brass-ink">Glossary</p>
            <h2 className="font-serif-display mt-3 text-4xl text-ink sm:text-5xl">Terms you will meet</h2>
          </div>
          <dl className="mt-12 grid gap-x-12 sm:grid-cols-2">
            {GLOSSARY.map((g) => (
              <div key={g.term} className="border-t border-line py-5">
                <dt className="font-bold text-ink">{g.term}</dt>
                <dd className="mt-1.5 leading-relaxed text-stone">{g.def}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <div className="flex gap-5 rounded-2xl border border-danger/30 bg-white p-7">
            <AlertTriangle aria-hidden className="mt-1 size-6 shrink-0 text-danger" />
            <div>
              <h2 className="text-lg font-bold text-ink">Protect yourself from immigration scams</h2>
              <p className="mt-2 leading-relaxed text-stone">
                In the United States, a notary public is not a lawyer and cannot give immigration advice. Only licensed
                attorneys and accredited representatives may do so.{" "}
                <Link href="/blog/avoiding-notario-fraud/" className="font-bold text-brass-ink underline underline-offset-4">
                  Read our guide to avoiding scams
                </Link>
                .
              </p>
            </div>
          </div>
        </Container>
      </section>
      <BookingBand />
    </>
  );
}
