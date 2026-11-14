"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { GuillocheRosette } from "@/components/brand/Guilloche";
import { PageHero } from "@/components/site/PageHero";
import { Emblem } from "@/components/site/cards";
import { BookingBand } from "@/components/home/Sections";
import { Container } from "@/components/ui/primitives";
import { useContent } from "@/content/LiveContent";
import { HEADINGS } from "@/content/headings";
import { teamLd } from "@/content/schema";
import { TEAM, type TeamMember } from "@/content/team";
import { cn } from "@/lib/utils";

export function TeamView() {
  const { SITE } = useContent();
  const leaders = TEAM.filter((m) => m.group === "Leadership");
  const advisors = TEAM.filter((m) => m.group === "Advisors");
  return (
    <>
      <PageHero image="global-connection" title={HEADINGS["/team/"].title} lede={HEADINGS["/team/"].lede} crumbs={[{ label: "Our team" }]} />

      <section className="py-20 sm:py-24">
        <Container>
          <p className="eyebrow text-brass-ink">Leadership</p>
          <h2 className="font-serif-display mt-3 text-4xl text-ink sm:text-5xl">The people who lead the firm</h2>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {leaders.map((m, i) => (
              <motion.div key={m.slug} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, delay: i * 0.1 }}>
                <MemberCard m={m} />
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {advisors.length > 0 && (
        <section className="on-dark relative overflow-hidden bg-ink py-20 text-paper sm:py-24">
          <div aria-hidden className="grain absolute inset-0" />
          <GuillocheRosette className="pointer-events-none absolute -right-40 -top-40 size-[36rem] text-brass opacity-[0.12]" />
          <Container className="relative">
            <p className="eyebrow text-brass-light">Advisors</p>
            <h2 className="font-serif-display mt-3 text-4xl sm:text-5xl">Guidance from distinguished advisors</h2>
            <div className="mt-12 grid gap-8">
              {advisors.map((m) => (
                <AdvisorFeature key={m.slug} m={m} />
              ))}
            </div>
          </Container>
        </section>
      )}

      <BookingBand />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(teamLd(SITE, TEAM)) }} />
    </>
  );
}

/** The member's photo, or the firm's emblem when there is none. */
function MemberPortrait({ m }: { m: TeamMember }) {
  if (!m.photo) return <Emblem title={m.role} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={m.photo}
      alt={`Portrait of ${m.name}`}
      loading="lazy"
      className="absolute inset-0 size-full object-cover"
      style={{ objectPosition: m.photoPosition ?? "50% 25%" }}
    />
  );
}

/** A leader's card: photo or emblem, name and role, the first paragraph, and the rest on request. */
function MemberCard({ m }: { m: TeamMember }) {
  const [open, setOpen] = useState(false);
  const more = m.bio.length > 1 || (m.bio[0]?.length ?? 0) > 360;
  return (
    <article id={m.slug} className="group flex h-full scroll-mt-28 flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-[0_40px_80px_-60px_rgba(20,24,31,0.55)] transition-shadow duration-500 hover:shadow-[0_40px_90px_-50px_rgba(20,24,31,0.6)]">
      <div className="on-dark relative aspect-[4/3] overflow-hidden bg-ink">
        <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.03]">
          <MemberPortrait m={m} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-7 sm:p-8">
        <p className="text-sm font-bold text-brass-ink">{m.role}</p>
        <h3 className="font-serif-display mt-1 text-3xl text-ink">{m.name}</h3>
        {m.credentials && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {m.credentials.map((c) => (
              <li key={c} className="rounded-full border border-line px-2.5 py-0.5 text-xs font-bold text-stone">{c}</li>
            ))}
          </ul>
        )}
        <span aria-hidden className="mt-5 flex items-center gap-1.5">
          <span className="h-px w-12 bg-gradient-to-r from-brass to-brass/20" />
          <span className="size-1.5 rotate-45 bg-brass" />
        </span>
        <div className={cn("relative mt-5 text-[0.98rem] leading-relaxed text-stone", !open && more && "max-h-56 overflow-hidden")}>
          <AnimatePresence initial={false}>
            {(open ? m.bio : m.bio.slice(0, 1)).map((p, i) => (
              <motion.p key={i} initial={i ? { opacity: 0, y: 6 } : false} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={i ? "mt-4" : ""}>
                {p}
              </motion.p>
            ))}
          </AnimatePresence>
          {!open && more && <span aria-hidden className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />}
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-4 pt-6">
          {more && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-ink underline-offset-4 hover:underline"
            >
              {open ? "Show less" : "Read full biography"}
              <ChevronDown aria-hidden className={cn("size-4 transition-transform duration-300", open && "rotate-180")} />
            </button>
          )}
          {m.profile && (
            <Link href={m.profile} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-brass-ink hover:text-ink">
              Full profile <ArrowUpRight aria-hidden className="size-4" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

/** An advisor, shown wide on the dark band with the full biography in two columns. */
function AdvisorFeature({ m }: { m: TeamMember }) {
  return (
    <motion.article
      id={m.slug}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7 }}
      className="grid scroll-mt-28 overflow-hidden rounded-3xl border border-line-dark bg-ink-raised lg:grid-cols-[0.7fr_1.3fr]"
    >
      <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-full">
        <MemberPortrait m={m} />
      </div>
      <div className="p-8 sm:p-12">
        <p className="text-sm font-bold text-brass-light">{m.role}</p>
        <h3 className="font-serif-display mt-1 text-4xl sm:text-5xl">{m.name}</h3>
        <span aria-hidden className="mt-5 flex items-center gap-1.5">
          <span className="h-px w-12 bg-gradient-to-r from-brass to-brass/20" />
          <span className="size-1.5 rotate-45 bg-brass" />
        </span>
        <div className="mt-6 gap-8 text-[0.98rem] leading-relaxed text-stone-dark lg:columns-2">
          {m.bio.map((p, i) => (
            <p key={i} className="mb-5 break-inside-avoid">{p}</p>
          ))}
        </div>
      </div>
    </motion.article>
  );
}
