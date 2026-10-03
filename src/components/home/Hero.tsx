"use client";

import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/primitives";
import { CTA } from "@/content/site";
import { PAGES } from "@/content/pages";

const ease = [0.22, 1, 0.36, 1] as const;
const words = PAGES.home.headline.split(/\s+/);

export function Hero() {
  const reduce = useReducedMotion();
  const mx = useMotionValue(70);
  const my = useMotionValue(30);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });
  const glow = useMotionTemplate`radial-gradient(600px circle at ${sx}% ${sy}%, rgba(177,151,107,0.20), transparent 60%)`;

  return (
    <section
      className="on-dark relative isolate overflow-hidden bg-ink text-paper"
      onPointerMove={(e) => {
        if (reduce) return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width) * 100);
        my.set(((e.clientY - r.top) / r.height) * 100);
      }}
    >
      <div aria-hidden className="grain absolute inset-0 -z-10" />
      <motion.div aria-hidden className="absolute inset-0 -z-10" style={{ background: glow }} />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-ink to-transparent" />

      <div className="container-luxe grid items-center gap-14 pb-20 pt-16 sm:pt-24 lg:min-h-[calc(100dvh-7.25rem)] lg:grid-cols-[1.15fr_0.85fr] lg:pb-28">
        <div>
          <p className="rise eyebrow text-brass-light">{PAGES.home.eyebrow}</p>

          <h1 className="font-serif-display mt-7 text-[2.65rem] leading-[1.04] text-balance sm:text-6xl lg:text-[4.6rem]">
            {words.map((w, i) => (
              <span key={i} className="rise-word inline-block pr-[0.25em]" style={{ ["--d" as string]: `${150 + i * 55}ms` }}>
                {w}
              </span>
            ))}
          </h1>

          <p
            style={{ ["--d" as string]: "750ms" }}
            className="rise mt-7 max-w-xl text-lg leading-relaxed text-stone-dark sm:text-xl"
          >
            {PAGES.home.lede}
          </p>

          <div style={{ ["--d" as string]: "900ms" }} className="rise mt-10 flex flex-wrap gap-3">
            <ButtonLink href={CTA.evaluation.href}>{PAGES.home.primaryCta}</ButtonLink>
            <ButtonLink href={CTA.consultation.href} variant="outline-light">
              {PAGES.home.secondaryCta}
            </ButtonLink>
          </div>

          <p
            style={{ ["--d" as string]: "1050ms" }}
            className="rise mt-12 max-w-xl border-t border-line-dark pt-6 text-[0.95rem] leading-relaxed text-stone-dark"
          >
            Based in Maryland and serving clients across the United States and abroad. Consultations by video, phone or in
            person, booked online in your own time zone.
          </p>
        </div>

        <HeroMark />
      </div>
    </section>
  );
}

function HeroMark() {
  const reduce = useReducedMotion();
  return (
    <div className="relative mx-auto hidden aspect-square w-full max-w-[460px] lg:block" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-brass/25"
          style={{ inset: `${i * 11}%` }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={reduce ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1, rotate: i % 2 ? -360 : 360 }}
          transition={{
            opacity: { duration: 1, delay: 0.2 + i * 0.15 },
            scale: { duration: 1.2, ease, delay: 0.2 + i * 0.15 },
            rotate: { duration: 60 + i * 20, repeat: Infinity, ease: "linear" },
          }}
        >
          <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brass" />
        </motion.div>
      ))}
      <motion.div
        className="absolute inset-[30%] grid place-items-center rounded-full bg-paper shadow-[0_40px_120px_-20px_rgba(177,151,107,0.45)]"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease, delay: 0.45 }}
      >
        <Logo variant="mark" className="w-[62%]" />
      </motion.div>
    </div>
  );
}
