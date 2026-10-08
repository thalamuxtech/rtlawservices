"use client";

import { Fragment } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { ButtonLink } from "@/components/ui/primitives";
import { CTA } from "@/content/site";
import { PAGES } from "@/content/pages";
import { BlendImage } from "@/components/ui/BlendImage";

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
      <BlendImage name="legal-library" position="58% 28%" priority />
      <div aria-hidden className="grain absolute inset-0 -z-10" />
      <motion.div aria-hidden className="absolute inset-0 -z-10" style={{ background: glow }} />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-ink to-transparent" />

      <div className="container-luxe grid items-center gap-14 pb-20 pt-16 sm:pt-24 lg:min-h-[calc(100dvh-7.25rem)] lg:grid-cols-[1.15fr_0.85fr] lg:pb-28">
        <div>
          <p className="rise eyebrow text-brass-light">{PAGES.home.eyebrow}</p>

          <h1 className="font-serif-display mt-7 text-[2.65rem] leading-[1.04] text-balance sm:text-6xl lg:text-[4.6rem]">
            {/* Real spaces between the animated words, so copied text, search engines and screen readers read whole words. */}
            {words.map((w, i) => (
              <Fragment key={i}>
                {i > 0 && " "}
                <span className="rise-word inline-block" style={{ ["--d" as string]: `${150 + i * 55}ms` }}>
                  {w}
                </span>
              </Fragment>
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

      </div>
    </section>
  );
}
