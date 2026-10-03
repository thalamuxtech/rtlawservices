"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { ButtonLink } from "@/components/ui/primitives";
import { PATH_QUIZ, suggestPath } from "@/content/general";
import { cn } from "@/lib/utils";

export function PathFinder() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const done = step >= PATH_QUIZ.length;
  const result = done ? suggestPath(answers) : null;
  const q = PATH_QUIZ[Math.min(step, PATH_QUIZ.length - 1)];

  const choose = (value: string) => {
    setAnswers((a) => ({ ...a, [q.id]: value }));
    setStep((s) => s + 1);
  };

  return (
    <div className="on-dark relative overflow-hidden rounded-3xl bg-ink p-7 text-paper sm:p-12">
      <div aria-hidden className="grain absolute inset-0" />
      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <p className="eyebrow text-brass-light">Which path fits me?</p>
          <div className="flex gap-1.5" aria-hidden>
            {PATH_QUIZ.map((_, i) => (
              <span key={i} className={cn("h-1.5 w-8 rounded-full transition-colors duration-500", i < step ? "bg-brass" : "bg-line-dark")} />
            ))}
          </div>
        </div>
        <div className="mt-8 min-h-[320px]" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {!done ? (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="text-sm text-stone-dark">Question {step + 1} of {PATH_QUIZ.length}</p>
                <h3 className="font-serif-display mt-2 text-3xl sm:text-4xl">{q.q}</h3>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {q.options.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => choose(o.value)}
                      className="min-h-16 rounded-2xl border border-line-dark bg-ink-raised px-5 py-4 text-left font-bold text-paper transition-colors duration-300 hover:border-brass hover:bg-ink"
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                {step > 0 && (
                  <button type="button" onClick={() => setStep((s) => s - 1)} className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-stone-dark hover:text-paper">
                    <ArrowLeft aria-hidden className="size-4" /> Back
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                <p className="text-sm text-stone-dark">A suggested starting point</p>
                <h3 className="font-serif-display mt-2 text-4xl text-brass-light sm:text-5xl">{result!.label}</h3>
                <p className="mt-4 max-w-xl text-lg leading-relaxed text-stone-dark">{result!.why}</p>
                <p className="mt-4 max-w-xl text-sm text-stone-dark">
                  This tool points to a page to read. It is not legal advice and does not assess eligibility.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  {result!.slug && (
                    <ButtonLink href={`/expertise/${result!.slug}/`} variant="outline-light">
                      Read about it
                    </ButtonLink>
                  )}
                  <ButtonLink href={`/free-evaluation/${result!.slug ? `?matter=${result!.slug}` : ""}`}>Request a free evaluation</ButtonLink>
                  <button
                    type="button"
                    onClick={() => {
                      setAnswers({});
                      setStep(0);
                    }}
                    className="inline-flex min-h-11 items-center gap-2 px-3 text-sm font-bold text-stone-dark hover:text-paper"
                  >
                    <RotateCcw aria-hidden className="size-4" /> Start again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
