import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, UserRound } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { CaseCard } from "@/components/site/cards";
import { BookingBand } from "@/components/home/Sections";
import { ButtonLink, Container, SampleBadge } from "@/components/ui/primitives";
import { getExpertise } from "@/content/expertise";
import { CASES, getAttorney, getCase } from "@/content/proof";
import { RESULTS_CAVEAT } from "@/content/site";

export function generateStaticParams() {
  return CASES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/case-results/[slug]">): Promise<Metadata> {
  const c = getCase((await params).slug);
  return c ? { title: c.title, description: `${c.category}: ${c.outcome}` } : {};
}

export default async function CaseDetail({ params }: PageProps<"/case-results/[slug]">) {
  const c = getCase((await params).slug);
  if (!c) notFound();
  const attorney = getAttorney(c.attorney);
  const area = getExpertise(c.expertise);
  const more = CASES.filter((x) => x.slug !== c.slug && x.track === c.track).slice(0, 3);
  const blocks = [
    { label: "The client", text: c.clientProfile },
    { label: "The challenge", text: c.challenge },
    { label: "Our approach", text: c.approach },
    { label: "The outcome", text: c.outcome },
  ];

  return (
    <>
      <PageHero
        eyebrow={c.category}
        title={c.title}
        crumbs={[{ label: "Case results", href: "/case-results/" }, { label: c.category }]}
        aside={
          <div className="rounded-2xl border border-line-dark bg-ink-raised/80 p-6">
            {c.demo && <SampleBadge dark className="mb-4" />}
            <p className="font-serif-display text-3xl text-brass-light">{c.headline}</p>
            <ul className="mt-5 grid gap-3 text-sm text-stone-dark">
              <li className="flex items-center gap-3"><Clock aria-hidden className="size-4 text-brass" /> {c.timeline}</li>
              <li className="flex items-center gap-3"><CalendarDays aria-hidden className="size-4 text-brass" /> Decided {c.year}</li>
              {attorney && <li className="flex items-center gap-3"><UserRound aria-hidden className="size-4 text-brass" /> {attorney.name}</li>}
            </ul>
          </div>
        }
      />
      <Container className="py-20">
        <div className="mx-auto max-w-3xl">
          <ol className="relative grid gap-12 border-l border-line pl-10">
            {blocks.map((b, i) => (
              <li key={b.label} className="relative">
                <span aria-hidden className="absolute -left-[2.85rem] top-1 grid size-6 place-items-center rounded-full border border-brass bg-paper text-[0.85rem] font-bold text-brass-ink">
                  {i + 1}
                </span>
                <p className="eyebrow text-brass-ink">{b.label}</p>
                <p className="font-serif-display mt-3 text-2xl leading-snug text-ink sm:text-[1.7rem]">{b.text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-14 rounded-2xl bg-mist p-6 text-sm leading-relaxed text-stone">{RESULTS_CAVEAT}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            {area && <ButtonLink href={`/expertise/${area.slug}/`} variant="outline">About {area.title.toLowerCase()}</ButtonLink>}
            <ButtonLink href={`/book/?matter=${c.expertise}`}>Book a consultation</ButtonLink>
          </div>
        </div>
        {more.length > 0 && (
          <div className="mt-24">
            <div className="flex items-end justify-between gap-6">
              <h2 className="font-serif-display text-4xl text-ink">More results</h2>
              <Link href="/case-results/" className="inline-flex min-h-11 items-center font-bold text-brass-ink hover:text-ink">See all results</Link>
            </div>
            <div className="mt-10 grid gap-x-10 gap-y-12 lg:grid-cols-3">
              {more.map((m, i) => <CaseCard key={m.slug} c={m} index={i} />)}
            </div>
          </div>
        )}
      </Container>
      <BookingBand />
    </>
  );
}
