import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink, Container, SectionHeading } from "@/components/ui/primitives";
import { AttorneyCard, CaseCard } from "@/components/site/cards";
import { PILLARS, PROCESS } from "@/content/general";
import { ATTORNEYS, CASES, POSTS, REVIEWS } from "@/content/live";
import { ReviewsMarquee } from "@/components/proof/ReviewsMarquee";
import { CTA, RESULTS_CAVEAT } from "@/content/site";

export function TwoDoors() {
  return (
    <section className="py-24 sm:py-32">
      <Container>
        <SectionHeading
          title="Wherever you start, we meet you there"
          lede="Some clients are filing for the first time. Others hold doctorates, run companies or sponsor teams. Each path is written for its reader, with the same attorneys and the same care behind it."
        />
        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          <Link href="/start-here/" className="group flex flex-col rounded-3xl bg-mist p-9 transition-colors duration-300 hover:bg-[#e6e9ea] sm:p-12">
            <p className="eyebrow text-brass-ink">New to U.S. immigration</p>
            <h3 className="font-serif-display mt-3 text-4xl text-ink decoration-1 underline-offset-8 group-hover:underline sm:text-5xl">
              Start here, step by step
            </h3>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-stone">
              How the system works in plain words, a glossary of the terms you will meet, and three questions that point
              you to the right path.
            </p>
            <span className="mt-auto pt-10 font-bold text-ink">Read the guide</span>
          </Link>
          <Link href="/expertise/#professionals" className="on-dark group flex flex-col rounded-3xl bg-ink p-9 transition-colors duration-300 hover:bg-ink-raised sm:p-12">
            <p className="eyebrow text-brass-light">Professionals, founders and employers</p>
            <h3 className="font-serif-display mt-3 text-4xl text-paper decoration-1 underline-offset-8 group-hover:underline sm:text-5xl">
              Petitions built as arguments
            </h3>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-stone-dark">
              O-1, EB-1A, National Interest Waiver, H-1B, L-1, E-2, EB-5 and PERM. Each petition maps your record to the
              legal standard an officer applies.
            </p>
            <span className="mt-auto pt-10 font-bold text-brass-light">See professional services</span>
          </Link>
        </div>
      </Container>
    </section>
  );
}

export function FeaturedResults() {
  const featured = CASES.filter((c) => c.featured).slice(0, 3);
  if (!featured.length) return null;
  return (
    <section className="on-dark relative overflow-hidden bg-ink py-24 text-paper sm:py-32">
      <div aria-hidden className="grain absolute inset-0" />
      <Container className="relative">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SectionHeading
            dark
            title="Success stories, documented"
            lede="Anonymised summaries of matters, published with client consent. Each one shows the challenge, our approach and the time to decision."
          />
          <ButtonLink href="/case-results/" variant="outline-light">
            All success stories
          </ButtonLink>
        </div>
        <div className="mt-16 grid gap-12 lg:grid-cols-3 lg:gap-10">
          {featured.map((c, i) => (
            <div key={c.slug} data-reveal style={{ ["--reveal-delay" as string]: `${i * 110}ms` }}>
              <CaseCard c={c} dark />
            </div>
          ))}
        </div>
        <p className="mt-12 text-sm text-stone-dark">{RESULTS_CAVEAT}</p>
      </Container>
    </section>
  );
}

export function AttorneysPreview() {
  if (!ATTORNEYS.length) return null;
  return (
    <section className="py-24 sm:py-32">
      <Container className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <SectionHeading
            title="You will know who is handling your case"
            lede="Every matter has a named attorney from the first consultation. Admissions, languages and areas of focus are listed on each profile."
          />
          <div className="mt-10">
            <ButtonLink href="/attorneys/" variant="outline">
              Meet the attorneys
            </ButtonLink>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {ATTORNEYS.map((a, i) => (
            <div key={a.slug} data-reveal style={{ ["--reveal-delay" as string]: `${i * 110}ms` }}>
              <AttorneyCard a={a} />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function Pillars() {
  return (
    <section className="border-y border-line bg-mist py-24 sm:py-28">
      <Container className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading title="What you can expect from us" />
        <dl className="grid gap-x-12 sm:grid-cols-2">
          {PILLARS.map((p) => (
            <div key={p.title} className="border-t border-ink/15 py-7" data-reveal>
              <dt className="font-serif-display text-2xl text-ink">{p.title}</dt>
              <dd className="mt-2 leading-relaxed text-stone">{p.text}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

export function ProcessRibbon({ compact }: { compact?: boolean }) {
  return (
    <section className={compact ? "" : "py-24 sm:py-32"}>
      <Container>
        {!compact && (
          <SectionHeading
            title="Five stages, the same for every client"
            lede="From the first conversation to the years after approval, you always know which stage you are in and what comes next."
          />
        )}
        <ol className="relative mt-16 grid gap-10 lg:grid-cols-5 lg:gap-6">
          <div aria-hidden className="absolute left-0 right-0 top-5 hidden h-px bg-line lg:block" />
          <div aria-hidden className="reveal-line absolute left-0 top-5 hidden h-px w-full origin-left bg-brass lg:block" data-reveal />
          {PROCESS.map((s, i) => (
            <li key={s.n} className="relative" data-reveal style={{ ["--reveal-delay" as string]: `${200 + i * 140}ms` }}>
              <span className="relative z-10 grid size-10 place-items-center rounded-full border border-brass bg-paper text-sm font-bold text-brass-ink">
                {Number(s.n)}
              </span>
              <h3 className="font-serif-display mt-6 text-2xl text-ink">{s.title}</h3>
              <p className="mt-3 text-[0.97rem] leading-relaxed text-stone">{s.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

export function ReviewsPreview() {
  return <ReviewsMarquee reviews={REVIEWS} />;
}

const fmtDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

export function ResourcesPreview() {
  const posts = POSTS.slice(0, 3);
  return (
    <section className="py-24 sm:py-32">
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionHeading title="Latest from the blog" lede="Policy updates and plain-language guides. Every post lists the official sources behind it." />
          <div className="mt-10" data-reveal>
            <ButtonLink href="/blog/" variant="outline">
              Read the blog
            </ButtonLink>
          </div>
        </div>
        <ul className="border-t border-ink/15">
          {posts.map((p, i) => (
            <li key={p.slug} data-reveal style={{ ["--reveal-delay" as string]: `${i * 90}ms` }}>
              <Link href={`/blog/${p.slug}/`} className="group block border-b border-ink/15 py-7 transition-colors hover:bg-white sm:px-2">
                <p className="text-sm text-stone">
                  {p.category}, {fmtDate(p.published)}, {p.sources.length} sources
                </p>
                <h3 className="font-serif-display mt-2 text-[1.75rem] leading-tight text-ink decoration-1 underline-offset-[6px] group-hover:underline">{p.title}</h3>
                <p className="mt-2 max-w-[62ch] leading-relaxed text-stone">{p.dek}</p>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export function BookingBand() {
  return (
    <section className="on-dark relative overflow-hidden bg-ink py-24 text-paper sm:py-28">
      <div aria-hidden className="grain absolute inset-0" />
      <div aria-hidden className="absolute -right-24 top-1/2 size-[520px] -translate-y-1/2 rounded-full border border-brass/20" />
      <div aria-hidden className="absolute -right-8 top-1/2 size-[360px] -translate-y-1/2 rounded-full border border-brass/30" />
      <Container className="relative grid items-center gap-12 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <h2 className="font-serif-display text-4xl text-balance sm:text-6xl" data-reveal>Tell us where you are. We will show you the way forward.</h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-dark">
            Send your details for a free evaluation by an attorney, or book a consultation by video, phone or in person at a time that suits your time zone.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href={CTA.evaluation.href}>Request a free evaluation</ButtonLink>
            <ButtonLink href={CTA.consultation.href} variant="outline-light">
              Book a consultation
            </ButtonLink>
          </div>
        </div>
        <div className="hidden justify-center lg:flex">
          <div className="grid size-64 place-items-center rounded-full bg-paper shadow-[0_40px_120px_-20px_rgba(177,151,107,0.5)]">
            <Logo variant="mark" className="w-40" />
          </div>
        </div>
      </Container>
    </section>
  );
}
