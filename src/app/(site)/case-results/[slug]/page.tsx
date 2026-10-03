import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Quote } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { CaseCard } from "@/components/site/cards";
import { ApprovalDocument } from "@/components/proof/ApprovalDocument";
import { BookingBand } from "@/components/home/Sections";
import { ButtonLink, Container } from "@/components/ui/primitives";
import { getExpertise } from "@/content/expertise";
import { CASES, getAttorney, getCase } from "@/content/live";
import { CTA, RESULTS_CAVEAT } from "@/content/site";

export function generateStaticParams() {
  // Static export needs one route even when nothing is published; it renders the 404 page.
  return CASES.length ? CASES.map((c) => ({ slug: c.slug })) : [{ slug: "none" }];
}

export async function generateMetadata({ params }: PageProps<"/case-results/[slug]">): Promise<Metadata> {
  const c = getCase((await params).slug);
  return c ? { title: `Success story: ${c.title}`, description: `${c.category}: ${c.outcome}` } : {};
}

export default async function CaseDetail({ params }: PageProps<"/case-results/[slug]">) {
  const c = getCase((await params).slug);
  if (!c) notFound();
  const attorney = getAttorney(c.attorney);
  const area = getExpertise(c.expertise);
  const more = CASES.filter((x) => x.slug !== c.slug && x.track === c.track).slice(0, 3);
  const rows = [
    ...(c.details ?? []),
    { label: "Year of decision", value: String(c.year) },
    ...(attorney ? [{ label: "Attorney", value: attorney.name }] : []),
  ];

  return (
    <>
      <PageHero
        eyebrow={`Success story, ${c.category}`}
        title={c.title}
        lede={c.outcome}
        crumbs={[{ label: "Success stories", href: "/case-results/" }, { label: c.category }]}
      >
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-serif-display text-3xl text-brass-light">{c.headline}</span>
        </div>
      </PageHero>

      <Container className="grid gap-14 py-16 lg:grid-cols-[minmax(0,1fr)_380px] lg:py-20">
        <div className="min-w-0">
          {c.testimonial && (
            <figure className="mb-14 border-l-2 border-brass pl-6">
              <Quote aria-hidden className="size-7 text-brass-ink" />
              <blockquote className="font-serif-display mt-3 text-2xl italic leading-snug text-ink sm:text-[1.7rem]">&ldquo;{c.testimonial}&rdquo;</blockquote>
              <figcaption className="mt-3 text-sm text-stone">The client, quoted with consent</figcaption>
            </figure>
          )}

          <section>
            <h2 className="font-serif-display text-3xl text-ink">Case details</h2>
            <dl className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
              {rows.map((r, i) => (
                <div key={r.label} className={`grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-4 px-5 py-3.5 ${i % 2 ? "bg-mist/50" : ""}`}>
                  <dt className="text-sm font-bold text-stone">{r.label}</dt>
                  <dd className="text-ink">{r.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-14">
            <h2 className="font-serif-display text-3xl text-ink">Case summary</h2>
            <div className="mt-6 grid gap-8">
              {[
                { label: "The client", text: c.clientProfile },
                { label: "The challenge", text: c.challenge },
                { label: "Our approach", text: c.approach },
              ].map((b) => (
                <div key={b.label}>
                  <p className="font-bold text-brass-ink">{b.label}</p>
                  <p className="mt-2 max-w-[65ch] text-lg leading-relaxed text-ink-soft">{b.text}</p>
                </div>
              ))}
            </div>
          </section>

          {c.evidence && c.evidence.length > 0 && (
            <section className="mt-14">
              <h2 className="font-serif-display text-3xl text-ink">Evidence presented</h2>
              <ul className="mt-6 grid gap-3">
                {c.evidence.map((e) => (
                  <li key={e} className="flex gap-3">
                    <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-success" />
                    <span className="text-ink-soft">{e}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="mt-14 rounded-2xl bg-mist p-5 text-sm leading-relaxed text-stone">
            {RESULTS_CAVEAT} This summary describes a past matter and is published with the client&rsquo;s consent, with
            identifying details removed.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={`${CTA.evaluation.href}?matter=${c.expertise}`}>Request a free evaluation</ButtonLink>
            {area && (
              <ButtonLink href={`/expertise/${area.slug}/`} variant="outline">
                About {area.title.toLowerCase()}
              </ButtonLink>
            )}
          </div>
        </div>

        {c.documentUrl && (
          <aside className="lg:sticky lg:top-32 lg:h-fit">
            <p className="mb-4 text-sm font-bold text-stone">Approval notice, personal details redacted</p>
            <ApprovalDocument c={c} />
          </aside>
        )}
      </Container>

      {more.length > 0 && (
        <section className="border-t border-line bg-mist py-20">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h2 className="font-serif-display text-4xl text-ink">More success stories</h2>
              <Link href="/case-results/" className="inline-flex min-h-11 items-center font-bold text-brass-ink hover:text-ink">
                See all success stories
              </Link>
            </div>
            <div className="mt-10 grid gap-x-10 gap-y-12 lg:grid-cols-3">
              {more.map((m) => (
                <CaseCard key={m.slug} c={m} />
              ))}
            </div>
          </Container>
        </section>
      )}
      <BookingBand />
    </>
  );
}
