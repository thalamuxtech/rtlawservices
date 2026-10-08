"use client";

import Link from "next/link";
import { PageHero } from "@/components/site/PageHero";
import { admissionsOf, CaseCard } from "@/components/site/cards";
import { BookingBand } from "@/components/home/Sections";
import { ButtonLink, Container } from "@/components/ui/primitives";
import { Missing } from "@/components/views/Missing";
import { useContent, useContentFresh } from "@/content/LiveContent";

export function AttorneyView({ slug }: { slug: string }) {
  const { SITE, casesByAttorney, getAttorney, getExpertise } = useContent();
  const fresh = useContentFresh();
  const a = getAttorney(slug);
  if (!a) return fresh ? <Missing what="profile" back={{ label: "All attorneys", href: "/attorneys/" }} /> : null;
  const results = casesByAttorney(a.slug);
  const ld = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: a.name,
    jobTitle: a.title,
    knowsLanguage: a.languages,
    worksFor: { "@type": "LegalService", name: SITE.name },
  };
  const panels = [
    { label: "Bar admissions", items: [...admissionsOf(a), ...(a.practiceLimitation ? [a.practiceLimitation] : [])] },
    { label: "Education", items: a.education },
    { label: "Languages", items: a.languages },
    { label: "Memberships", items: a.memberships },
  ];

  return (
    <>
      <PageHero
        eyebrow={a.title}
        title={a.name}
        crumbs={[{ label: "Attorneys", href: "/attorneys/" }, { label: a.name }]}
        aside={
          <div className="relative grid aspect-square place-items-center overflow-hidden rounded-3xl border border-line-dark bg-ink-raised">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_110%,rgba(177,151,107,0.4),transparent_60%)]" />
            <span className="font-serif-display relative text-8xl text-brass-light">{a.initials}</span>
          </div>
        }
      >
        <ButtonLink href={`/book/?attorney=${a.slug}`}>Book with {a.name.split(" ")[0]}</ButtonLink>
      </PageHero>

      <Container className="grid gap-16 py-20 lg:grid-cols-[1fr_340px]">
        <div className="max-w-2xl">
          <h2 className="font-serif-display text-4xl text-ink">Biography</h2>
          {a.bio.map((p) => (
            <p key={p} className="mt-5 text-lg leading-relaxed text-ink-soft">{p}</p>
          ))}
          <h2 className="font-serif-display mt-16 text-4xl text-ink">Leads matters in</h2>
          <ul className="mt-6 flex flex-wrap gap-2">
            {a.leads.map((s) => {
              const e = getExpertise(s);
              return e ? (
                <li key={s}>
                  <Link href={`/expertise/${s}/`} className="inline-flex min-h-11 items-center rounded-full border border-line bg-white px-5 text-sm font-bold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper">
                    {e.title}
                  </Link>
                </li>
              ) : null;
            })}
          </ul>
        </div>
        <aside className="grid content-start gap-4">
          {panels.filter((p) => p.items?.length).map((p) => (
            <div key={p.label} className="rounded-2xl border border-line bg-white p-6">
              <p className="eyebrow text-brass-ink">{p.label}</p>
              <ul className="mt-3 grid gap-1.5 text-ink-soft">
                {p.items.map((i) => <li key={i}>{i}</li>)}
              </ul>
            </div>
          ))}
        </aside>
      </Container>

      {results.length > 0 && (
        <section className="border-t border-line bg-mist py-20">
          <Container>
            <h2 className="font-serif-display text-4xl text-ink">Selected results</h2>
            <div className="mt-10 grid gap-x-10 gap-y-12 lg:grid-cols-3">
              {results.slice(0, 3).map((c, i) => <CaseCard key={c.slug} c={c} index={i} />)}
            </div>
          </Container>
        </section>
      )}
      <BookingBand />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </>
  );
}
