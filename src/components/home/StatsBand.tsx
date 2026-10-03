"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

type Stat = { value: number; prefix?: string; suffix?: string; label: string };

function Counter({ s }: { s: Stat }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(s.value);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, s.value, {
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduce, s.value]);

  return (
    <span ref={ref} className="tabular-nums">
      {s.prefix}
      {shown.toLocaleString("en-US")}
      {s.suffix}
    </span>
  );
}

export function StatsBand({ stats }: { stats: Stat[] }) {
  if (!stats.length) return null;
  return (
    <section className="on-dark border-t border-line-dark bg-ink text-paper" aria-label="The firm in numbers">
      <div className="container-luxe grid divide-y divide-line-dark sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {stats.map((s) => (
          <div key={s.label} className="py-10 sm:px-8 sm:py-14 first:sm:pl-0">
            <p className="font-serif-display text-6xl text-brass-light sm:text-7xl">
              <Counter s={s} />
            </p>
            <p className="mt-3 max-w-xs leading-relaxed text-stone-dark">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
