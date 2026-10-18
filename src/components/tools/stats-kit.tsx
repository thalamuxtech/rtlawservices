"use client";

// Shared pieces for the USCIS statistics on the case status tracker: the chart
// colours, an animated number, the place-in-line gauge and the tooltip.

import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { roughly, type QueueEstimate } from "@/content/tools/uscis-stats";

/**
 * Chart colours, checked with the data visualization palette validator on a
 * white surface. Approved and denied sit in the colour-blind caution band, so
 * they always appear with a legend, a 2px gap and labelled tooltips.
 */
export const SERIES = {
  approved: "#1f8a5b",
  denied: "#c8642a",
  received: "#3d64b8",
  single: "#7d6638",
  muted: "#d6d0c8",
  grid: "#e1e4e6",
  axis: "#51565c",
} as const;

const ease = [0.22, 1, 0.36, 1] as const;

/** Counts up to a value once it scrolls into view. */
export function CountUp({ value, format = (n) => Math.round(n).toLocaleString("en-US"), className }: { value: number; format?: (n: number) => string; className?: string }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(0);
  useEffect(() => {
    if (reduce) return;
    let frame = 0;
    let start = 0;
    const begin = from.current;
    const run = (t: number) => {
      if (!start) start = t;
      const k = Math.min(1, (t - start) / 900);
      setShown(begin + (value - begin) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) frame = requestAnimationFrame(run);
      else from.current = value;
    };
    frame = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frame);
  }, [value, reduce]);
  return (
    <span className={cn("tabular-nums", className)}>
      {format(reduce ? value : shown)}
    </span>
  );
}

/**
 * A half-ring showing how far the case is estimated to have moved toward the
 * front of the national line. The filled share is the part of today's queue
 * estimated to be behind the case.
 */
export function QueueGauge({ estimate, dark }: { estimate: QueueEstimate; dark?: boolean }) {
  const behind = 1 - estimate.shareAhead;
  const r = 92;
  const arc = Math.PI * r;
  const reduce = useReducedMotion();
  // One value drives the arc and the marker, so the marker travels along the ring.
  const progress = useMotionValue(0);
  useEffect(() => {
    if (reduce) {
      progress.set(behind);
      return;
    }
    const controls = animate(progress, behind, { duration: 1.4, ease });
    return () => controls.stop();
  }, [behind, progress, reduce]);
  const offset = useTransform(progress, (p) => arc * (1 - p));
  const cx = useTransform(progress, (p) => 110 + r * Math.cos(Math.PI * (1 - p)));
  const cy = useTransform(progress, (p) => 110 - r * Math.sin(Math.PI * (1 - p)));
  const label = estimate.ahead < 1 ? "At or near the front" : `${Math.round(behind * 100)}% of the way`;
  return (
    <figure className="relative mx-auto w-full max-w-[320px]">
      <svg viewBox="0 0 220 128" role="img" aria-label={`Estimated position: ${label}. About ${roughly(estimate.ahead)} cases ahead nationally.`} className="w-full overflow-visible">
        <defs>
          <linearGradient id="gauge-fill" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#7d6638" />
            <stop offset="1" stopColor="#c9b48a" />
          </linearGradient>
        </defs>
        <path d={`M ${110 - r} 110 A ${r} ${r} 0 0 1 ${110 + r} 110`} fill="none" stroke={dark ? "#2c333d" : "#e1e4e6"} strokeWidth="14" strokeLinecap="round" />
        {/* Tick marks every tenth of the line. */}
        {Array.from({ length: 11 }, (_, i) => {
          const a = Math.PI * (1 - i / 10);
          return (
            <line
              key={i}
              x1={110 + (r - 16) * Math.cos(a)}
              y1={110 - (r - 16) * Math.sin(a)}
              x2={110 + (r - (i % 5 ? 21 : 25)) * Math.cos(a)}
              y2={110 - (r - (i % 5 ? 21 : 25)) * Math.sin(a)}
              stroke={dark ? "#51565c" : "#a9afb6"}
              strokeWidth="1.5"
            />
          );
        })}
        <motion.path
          d={`M ${110 - r} 110 A ${r} ${r} 0 0 1 ${110 + r} 110`}
          fill="none"
          stroke="url(#gauge-fill)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={arc}
          style={{ strokeDashoffset: offset }}
        />
        <motion.circle r="9" fill={dark ? "#14181f" : "#ffffff"} stroke="#b1976b" strokeWidth="4" style={{ cx, cy }} />
        <text x={110 - r} y="127" textAnchor="middle" className="fill-current text-[9px]" opacity="0.7">Filed</text>
        <text x={110 + r} y="127" textAnchor="middle" className="fill-current text-[9px]" opacity="0.7">Front</text>
      </svg>
      <figcaption className="absolute inset-x-0 bottom-3 text-center">
        <span className={cn("font-serif-display block text-4xl leading-none", dark ? "text-paper" : "text-ink")}>
          {estimate.ahead < 1 ? "Front" : <CountUp value={behind * 100} format={(n) => `${Math.round(n)}%`} />}
        </span>
        <span className={cn("mt-1 block text-xs font-bold", dark ? "text-stone-dark" : "text-stone")}>{estimate.ahead < 1 ? "of the national line" : "of the way to the front"}</span>
      </figcaption>
    </figure>
  );
}

/** Tooltip body: the value leads, the series name follows, keyed by a short stroke. */
export function TipCard({ title, rows, note }: { title: string; rows: { label: string; value: string; color?: string }[]; note?: string }) {
  return (
    <div className="min-w-[180px] rounded-xl border border-line bg-white px-4 py-3 text-sm shadow-[0_20px_50px_-20px_rgba(20,24,31,0.45)]">
      <p className="mb-2 text-xs font-bold text-stone">{title}</p>
      <ul className="grid gap-1.5">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-2.5">
            {r.color && <span aria-hidden className="h-0.5 w-3.5 shrink-0 rounded-full" style={{ background: r.color }} />}
            <span className="font-bold tabular-nums text-ink">{r.value}</span>
            <span className="text-stone">{r.label}</span>
          </li>
        ))}
      </ul>
      {note && <p className="mt-2 max-w-[220px] text-xs text-stone">{note}</p>}
    </div>
  );
}

/** The formula behind every place-in-line estimate, with each term defined. */
export function HowEstimated({ dark }: { dark?: boolean }) {
  return (
    <details className={cn("group rounded-2xl border p-5 text-sm leading-relaxed", dark ? "border-line-dark text-stone-dark" : "border-line bg-mist/50 text-stone")}>
      <summary className={cn("flex cursor-pointer list-none items-center justify-between gap-3 font-bold", dark ? "text-paper" : "text-ink")}>
        How the place-in-line estimate works
        <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-4 grid gap-3">
        <p>
          USCIS does not publish where an individual case sits in its queue. The estimate treats the national queue for the form as if USCIS worked
          through it in filing order, using the latest quarterly figures USCIS publishes.
        </p>
        <p className={cn("rounded-xl px-4 py-3 font-mono text-[0.8rem]", dark ? "bg-ink text-paper" : "bg-white text-ink ring-1 ring-line")}>
          cases ahead = max(0, P − R × m) − C × t
          <br />
          months left = cases ahead ÷ C
        </p>
        <p>
          Where <strong>P</strong> is the number of cases pending nationally at the end of the latest quarter, <strong>R</strong> and <strong>C</strong> are the
          cases received and completed per month in that quarter, <strong>m</strong> is the number of months from your filing date to the end of that quarter
          (cases received in that time are behind you), and <strong>t</strong> is the number of months from the end of the quarter to today. A case filed after
          the quarter ended starts behind everything pending then.
        </p>
        <p>
          The result is a rough guide, not a prediction. USCIS does not work strictly in filing order, field offices and service centers move at different
          speeds, and a request for evidence, an interview or a wait for a visa number can hold one case while later ones move ahead.
        </p>
      </div>
    </details>
  );
}
