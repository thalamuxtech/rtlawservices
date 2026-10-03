import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, Check, Clock, FileText, Lightbulb, Phone } from "lucide-react";
import { Accordion, PageHero } from "@/components/site/PageHero";
import { CaseCard, ReviewCard } from "@/components/site/cards";
import { BookingBand } from "@/components/home/Sections";
import { ButtonLink, Container } from "@/components/ui/primitives";
import { EXPERTISE, getExpertise } from "@/content/expertise";
import { ATTORNEYS, ILLUSTRATIVE_NOTE, casesFor, reviewsFor } from "@/content/live";
import { RESULTS_CAVEAT, SITE } from "@/content/site";

export function generateStaticParams() {
  return EXPERTISE.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: PageProps<"/expertise/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const e = getExpertise(slug);
  if (!e) return {};
  return { title: `${e.title} (${e.codes})`, description: e.summary };
}

const REVIEWED = "September 2026";

export default async function ExpertiseDetail({ params }: PageProps<"/expertise/[slug]">) {
  const { slug } = await params;
  const e = getExpertise(slug);
  if (!e) notFound();
  const lead = ATTORNEYS.find((a) => a.leads.includes(e.slug));
  const results = casesFor(e.slug).slice(0, 3);
  const reviews = reviewsFor(e.slug).slice(0, 2);
  const pro = e.track === "professionals";
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: e.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  const toc = [
    { id: "who", label: "Who this is for" },
    { id: "how", label: "How we help" },
    ...(e.criteria ? [{ id: "criteria", label: "The legal standard" }] : []),
    ...(e.forms.length ? [{ id: "forms", label: "Forms involved" }] : []),
    { id: "timeline", label: "Timeline" },
    { id: "checklist", label: "Document checklist" },
    ...(results.length ? [{ id: "results", label: "Success stories" }] : []),
    { id: "faq", label: "Questions" },
  ];

  return (
    <>
      <PageHero
        eyebrow={e.codes}
        title={e.title}
        lede={e.intro}
        crumbs={[{ label: "Expertise", href: "/expertise/" }, { label: e.title }]}
        aside={
          <div className="rounded-2xl border border-line-dark bg-ink-raised/80 p-6 backdrop-blur">
            <p className="text-sm text-stone-dark">{lead ? "Lead attorney" : "Your attorney"}</p>
            <p className="font-serif-display mt-1 text-2xl text-paper">{lead ? lead.name : "Assigned at booking"}</p>
            <p className="mt-4 text-sm text-stone-dark">Last reviewed {REVIEWED}</p>
            <div className="mt-6 grid gap-2">
              <ButtonLink href={`/free-evaluation/?matter=${e.slug}`}>Request a free evaluation</ButtonLink>
              <ButtonLink href={`/book/?matter=${e.slug}`} variant="outline-light">
                Book a consultation
              </ButtonLink>
              {pro && (
                <ButtonLink href="/check-eligibility/" variant="outline-light">
                  Check eligibility
                </ButtonLink>
              )}
            </div>
          </div>
        }
      />

      <Container className="grid gap-16 py-20 lg:grid-cols-[220px_1fr] lg:py-24">
        <aside className="hidden lg:block">
          <nav aria-label="On this page" className="sticky top-32">
            <p className="eyebrow text-brass-ink">On this page</p>
            <ul className="mt-5 grid gap-1 border-l border-line">
              {toc.map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="-ml-px block border-l border-transparent py-1.5 pl-4 text-sm text-stone transition-colors hover:border-brass hover:text-ink">
                    {t.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-10 rounded-2xl bg-mist p-5">
              <p className="text-sm font-bold text-ink">Questions first?</p>
              <a href={SITE.phoneHref} className="mt-3 flex min-h-11 items-center gap-2 text-sm font-bold text-brass-ink hover:text-ink">
                <Phone aria-hidden className="size-4" /> {SITE.phone}
              </a>
            </div>
          </nav>
        </aside>

        <div className="min-w-0 max-w-3xl">
          {e.newToThis && (
            <div className="mb-16 flex gap-5 rounded-2xl border border-brass/40 bg-brass-pale/60 p-7">
              <Lightbulb aria-hidden className="mt-1 size-6 shrink-0 text-brass-ink" />
              <div>
                <p className="font-bold text-ink">New to this?</p>
                <p className="mt-2 leading-relaxed text-ink-soft">{e.newToThis}</p>
                <Link href="/start-here/#glossary" className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-brass-ink underline underline-offset-4 hover:text-ink">
                  See the glossary
                </Link>
              </div>
            </div>
          )}

          <section id="who" className="scroll-mt-32">
            <h2 className="font-serif-display text-4xl text-ink">Who this is for</h2>
            <ul className="mt-8 grid gap-3">
              {e.whoFor.map((w) => (
                <li key={w} className="flex gap-4 rounded-xl border border-line bg-white p-4">
                  <Check aria-hidden className="mt-0.5 size-5 shrink-0 text-brass-ink" />
                  <span className="text-ink-soft">{w}</span>
                </li>
              ))}
            </ul>
          </section>

          <section id="how" className="mt-20 scroll-mt-32">
            <h2 className="font-serif-display text-4xl text-ink">How we help</h2>
            <dl className="mt-8 grid gap-x-10 sm:grid-cols-2">
              {e.howWeHelp.map((h) => (
                <div key={h.title} className="border-t border-ink/15 py-6">
                  <dt className="text-lg font-bold text-ink">{h.title}</dt>
                  <dd className="mt-2 leading-relaxed text-stone">{h.text}</dd>
                </div>
              ))}
            </dl>
          </section>

          {e.criteria && (
            <section id="criteria" className="on-dark mt-20 scroll-mt-32 rounded-3xl bg-ink p-8 text-paper sm:p-10">
              <p className="eyebrow text-brass-light">The legal standard</p>
              <h2 className="font-serif-display mt-3 text-3xl sm:text-4xl">{e.criteria.title}</h2>
              <p className="mt-4 leading-relaxed text-stone-dark">{e.criteria.intro}</p>
              <ol className="mt-8 grid gap-3">
                {e.criteria.items.map((c, i) => (
                  <li key={c} className="flex gap-4 border-t border-line-dark pt-3">
                    <span className="w-6 shrink-0 text-sm font-bold text-brass-light">{i + 1}</span>
                    <span className="text-paper/90">{c}</span>
                  </li>
                ))}
              </ol>
              {e.criteria.note && <p className="mt-6 text-sm text-stone-dark">{e.criteria.note}</p>}
            </section>
          )}

          {e.forms.length > 0 && (
            <section id="forms" className="mt-20 scroll-mt-32">
              <h2 className="font-serif-display text-4xl text-ink">Forms involved</h2>
              <ul className="mt-8 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
                {e.forms.map((f) => (
                  <li key={f.code} className="flex items-center gap-5 p-5">
                    <FileText aria-hidden className="size-5 shrink-0 text-brass-ink" />
                    <span className="w-24 shrink-0 font-bold text-ink">{f.code}</span>
                    <span className="text-stone">{f.name}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-stone">
                Government filing fees are listed on our{" "}
                <Link href="/resources/filing-fees/" className="font-bold text-brass-ink underline underline-offset-4">filing fees page</Link>.
              </p>
            </section>
          )}

          <section id="timeline" className="mt-20 scroll-mt-32">
            <h2 className="font-serif-display text-4xl text-ink">Timeline</h2>
            <div className="mt-8 flex gap-5 rounded-2xl border border-line bg-white p-7">
              <Clock aria-hidden className="mt-1 size-6 shrink-0 text-brass-ink" />
              <p className="leading-relaxed text-ink-soft">{e.timeline}</p>
            </div>
          </section>

          <section id="checklist" className="mt-20 scroll-mt-32">
            <h2 className="font-serif-display text-4xl text-ink">Document checklist</h2>
            <p className="mt-3 text-stone">A starting list. We send a checklist for your case after the consultation.</p>
            <ul className="mt-8 grid gap-2 sm:grid-cols-2">
              {e.checklist.map((c) => (
                <li key={c} className="flex gap-3 rounded-xl bg-mist p-4 text-[0.97rem] text-ink-soft">
                  <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-brass" />
                  {c}
                </li>
              ))}
            </ul>
          </section>

          {results.length > 0 && (
            <section id="results" className="mt-20 scroll-mt-32">
              <h2 className="font-serif-display text-4xl text-ink">Success stories</h2>
              <div className="mt-8 grid gap-x-10 gap-y-12 sm:grid-cols-2">
                {results.map((c, i) => <CaseCard key={c.slug} c={c} index={i} />)}
              </div>
              <p className="mt-4 text-sm text-stone">{RESULTS_CAVEAT}</p>
            </section>
          )}

          {reviews.length > 0 && (
            <section className="mt-16 border-t border-ink/15 pt-10">
              <div className="grid gap-10 sm:grid-cols-2">
                {reviews.map((r, i) => <ReviewCard key={r.id} r={r} index={i} />)}
              </div>
              {reviews.some((r) => r.demo) && <p className="mt-6 text-sm text-stone">{ILLUSTRATIVE_NOTE}</p>}
            </section>
          )}

          <section id="faq" className="mt-20 scroll-mt-32">
            <h2 className="font-serif-display text-4xl text-ink">Questions clients ask</h2>
            <Accordion className="mt-8" items={e.faqs} />
          </section>

          <div className="mt-16 flex flex-wrap items-center gap-4 rounded-2xl bg-mist p-7">
            <CalendarCheck aria-hidden className="size-7 text-brass-ink" />
            <p className="flex-1 font-bold text-ink">Ready to talk it through?</p>
            <ButtonLink href={`/free-evaluation/?matter=${e.slug}`}>Free evaluation</ButtonLink>
            <ButtonLink href={`/book/?matter=${e.slug}`} variant="outline">
              Consultation
            </ButtonLink>
          </div>
        </div>
      </Container>
      <BookingBand />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    </>
  );
}
