"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Info } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

type Item = { id: string; title: string; text: string; examples: string };
type Standard = {
  id: "eb1a" | "o1a" | "niw";
  label: string;
  short: string;
  intro: string;
  threshold: number;
  thresholdText: string;
  category: string;
  items: Item[];
  gate?: Item[];
};

// Criteria follow 8 CFR 204.5(h)(3) for EB-1A, 8 CFR 214.2(o)(3)(iii)(B) for
// O-1A, and the three-part test in Matter of Dhanasar, 26 I&N Dec. 884 (2016).
const STANDARDS: Standard[] = [
  {
    id: "eb1a",
    label: "EB-1A green card",
    short: "EB-1A",
    intro: "Extraordinary ability, self-petitioned. Applicants show a one-time major award, or at least three of the ten criteria below, and an officer then judges whether the whole record shows sustained acclaim.",
    threshold: 3,
    thresholdText: "3 of 10 criteria, followed by a final merits review",
    category: "EB-1A extraordinary ability (self-petitioned)",
    gate: [{ id: "major", title: "A one-time major, internationally recognized award", text: "An award at the level of a Nobel Prize, Pulitzer Prize or Olympic medal.", examples: "This alone can meet the first step." }],
    items: [
      { id: "awards", title: "Prizes or awards for excellence", text: "Nationally or internationally recognized awards in your field.", examples: "Best paper awards, national fellowships, industry awards." },
      { id: "membership", title: "Membership requiring outstanding achievement", text: "Associations that admit members based on achievements judged by experts.", examples: "Elected fellow of a learned society." },
      { id: "media", title: "Published material about you", text: "Articles in professional or major media about you and your work.", examples: "Newspaper features, trade press profiles, interviews." },
      { id: "judging", title: "Judging the work of others", text: "Serving as a judge of others in your field, alone or on a panel.", examples: "Peer review for journals, grant panels, competition judging." },
      { id: "contributions", title: "Original contributions of major significance", text: "Work that others in the field have adopted, built on or relied on.", examples: "Widely used methods, patents in use, cited clinical findings." },
      { id: "authorship", title: "Authorship of scholarly articles", text: "Articles in professional journals or major media.", examples: "Peer-reviewed papers, book chapters." },
      { id: "exhibitions", title: "Display of your work", text: "Your work shown at artistic exhibitions or showcases.", examples: "Gallery shows, festivals, juried exhibitions." },
      { id: "role", title: "Leading or critical role", text: "A leading or critical role for organizations with a distinguished reputation.", examples: "Principal investigator, founder, head of a key unit." },
      { id: "salary", title: "High salary", text: "Pay that is high compared with others in your field.", examples: "Salary at the top of published wage data." },
      { id: "commercial", title: "Commercial success in the performing arts", text: "Box office receipts or record, cassette, CD or video sales.", examples: "Sales charts, box office reports." },
    ],
  },
  {
    id: "o1a",
    label: "O-1A visa",
    short: "O-1A",
    intro: "Extraordinary ability in sciences, education, business or athletics. Applicants show a major award or at least three of the eight criteria below, and need a U.S. employer or agent as petitioner.",
    threshold: 3,
    thresholdText: "3 of 8 criteria, plus a U.S. employer or agent",
    category: "O-1A or O-1B extraordinary ability (employer or agent)",
    items: [
      { id: "awards", title: "Nationally or internationally recognized prizes", text: "Awards for excellence in your field.", examples: "Startup competition wins, research awards." },
      { id: "membership", title: "Membership requiring outstanding achievement", text: "Associations judged by recognized experts.", examples: "Selective professional bodies." },
      { id: "media", title: "Published material about you", text: "Coverage in professional or major media.", examples: "Press features, podcasts, trade articles." },
      { id: "judging", title: "Judging the work of others", text: "Evaluating work in your field or an allied field.", examples: "Peer review, accelerator selection panels." },
      { id: "contributions", title: "Original contributions of major significance", text: "Scientific, scholarly or business contributions others rely on.", examples: "Product adoption, patents, influential research." },
      { id: "authorship", title: "Scholarly articles", text: "Authorship in professional journals or major media.", examples: "Papers, published technical articles." },
      { id: "critical", title: "Critical role at distinguished organizations", text: "Employment in a critical or essential capacity.", examples: "Founder, chief technology officer, lead scientist." },
      { id: "salary", title: "High salary", text: "Pay that is high compared with others in the field.", examples: "Compensation above market benchmarks." },
    ],
  },
  {
    id: "niw",
    label: "National Interest Waiver",
    short: "NIW",
    intro: "An EB-2 green card without a job offer. Applicants first qualify for EB-2, then meet all three parts of the Dhanasar test.",
    threshold: 4,
    thresholdText: "An EB-2 basis and all three parts of the test",
    category: "EB-2 National Interest Waiver (self-petitioned)",
    gate: [
      { id: "eb2", title: "An EB-2 basis", text: "A U.S. master's degree or higher (or foreign equivalent), a bachelor's degree plus five years of progressive experience, or exceptional ability.", examples: "Required before the waiver can be considered." },
    ],
    items: [
      { id: "merit", title: "Substantial merit and national importance", text: "Your planned work has value with impact beyond a single employer or client.", examples: "Public health, clean energy, AI safety, infrastructure." },
      { id: "positioned", title: "Well positioned to advance the work", text: "Your education, record, plans and progress show you can carry it out.", examples: "Publications, funding, letters of support, prototypes." },
      { id: "balance", title: "On balance, the waiver benefits the United States", text: "The national interest outweighs the usual job offer and labor certification process.", examples: "Urgency, self-employment, unique expertise." },
    ],
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

export function EligibilityChecker() {
  const router = useRouter();
  const [sid, setSid] = useState<Standard["id"]>("eb1a");
  const [picked, setPicked] = useState<Record<string, string[]>>({ eb1a: [], o1a: [], niw: [] });
  const std = STANDARDS.find((s) => s.id === sid)!;
  const sel = picked[sid];
  const toggle = (id: string) => setPicked((p) => ({ ...p, [sid]: p[sid].includes(id) ? p[sid].filter((x) => x !== id) : [...p[sid], id] }));

  const gateMet = (std.gate ?? []).every((g) => sel.includes(g.id));
  const count = std.items.filter((i) => sel.includes(i.id)).length;
  const score = sid === "niw" ? count + (gateMet ? 1 : 0) : count;
  const majorAward = sid === "eb1a" && sel.includes("major");
  const met = majorAward || (sid === "niw" ? gateMet && count === 3 : count >= std.threshold);
  const total = sid === "niw" ? 4 : std.items.length;
  const pct = Math.min(1, majorAward ? 1 : score / total);

  const message = met
    ? "Your answers are consistent with the threshold for this category. An attorney can test how strong the evidence is and how an officer is likely to weigh it."
    : sid === "niw"
      ? !gateMet
        ? "The waiver needs an EB-2 basis first. Other routes may still fit, which a free evaluation can explore."
        : `You have ticked ${count} of the 3 parts. An attorney can review whether further evidence exists.`
      : `You have ticked ${count} of the ${std.threshold} criteria needed. An attorney can review whether further evidence exists.`;

  const send = () => {
    const titles = [...(std.gate ?? []), ...std.items].filter((i) => sel.includes(i.id)).map((i) => i.title);
    try {
      const draft = JSON.parse(localStorage.getItem("rt-evaluation-draft") || "{}");
      const categories: string[] = Array.isArray(draft.categories) ? draft.categories : [];
      localStorage.setItem(
        "rt-evaluation-draft",
        JSON.stringify({
          ...draft,
          track: "professional",
          categories: Array.from(new Set([...categories, std.category])),
          awards: `Self-check (${std.short}): ${titles.join("; ") || "no criteria ticked"}.`,
        }),
      );
    } catch {}
    router.push("/free-evaluation/#evaluation");
  };

  const R = 54;
  const C = 2 * Math.PI * R;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        <div role="tablist" aria-label="Category" className="grid grid-cols-3 rounded-2xl border border-line bg-white p-1.5 sm:inline-grid sm:rounded-full">
          {STANDARDS.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={sid === s.id}
              onClick={() => setSid(s.id)}
              className={cn("relative min-h-11 rounded-xl px-3 text-sm font-bold transition-colors sm:rounded-full sm:px-6", sid === s.id ? "bg-ink text-paper" : "text-stone hover:text-ink")}
            >
              {sid === s.id && <motion.span layoutId="std-pill" className="absolute inset-0 rounded-xl bg-ink sm:rounded-full" transition={{ type: "spring", stiffness: 380, damping: 34 }} />}
              <span className="relative">{s.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={sid} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease }}>
            <p className="mt-8 max-w-2xl leading-relaxed text-stone">{std.intro}</p>
            {std.gate && (
              <div className="mt-8">
                <p className="text-sm font-bold text-ink">{sid === "niw" ? "First, the EB-2 basis" : "Or, a single major award"}</p>
                <div className="mt-3 grid gap-3">{std.gate.map((g) => <Criterion key={g.id} item={g} on={sel.includes(g.id)} onToggle={() => toggle(g.id)} />)}</div>
              </div>
            )}
            <p className="mt-8 text-sm font-bold text-ink">{sid === "niw" ? "Then, the three parts of the test" : "Tick each criterion your record could meet"}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {std.items.map((it, i) => (
                <Criterion key={it.id} item={it} on={sel.includes(it.id)} onToggle={() => toggle(it.id)} n={sid !== "niw" ? i + 1 : undefined} />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <aside className="lg:sticky lg:top-32 lg:h-fit">
        <div className="on-dark rounded-3xl bg-ink p-7 text-paper" aria-live="polite">
          <p className="text-sm font-bold text-brass-light">Your self-check, {std.short}</p>
          <div className="relative mx-auto mt-6 size-44">
            <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
              <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-line-dark)" strokeWidth="9" />
              <motion.circle
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke={met ? "#3fa37a" : "var(--color-brass)"}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={C}
                animate={{ strokeDashoffset: C * (1 - pct) }}
                transition={{ duration: 0.7, ease }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <motion.p key={`${sid}-${score}-${majorAward}`} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-serif-display text-5xl">
                  {majorAward ? "1" : score}
                  <span className="text-2xl text-stone-dark">/{majorAward ? "1" : total}</span>
                </motion.p>
                <p className="text-xs text-stone-dark">{majorAward ? "major award" : sid === "niw" ? "requirements" : "criteria"}</p>
              </div>
            </div>
          </div>
          <p className="mt-6 text-center text-sm text-stone-dark">Threshold: {std.thresholdText}</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={`${met}-${sid}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn("mt-5 rounded-2xl p-4 text-sm leading-relaxed", met ? "bg-success/25 text-paper" : "bg-ink-raised text-stone-dark")}
            >
              {message}
            </motion.p>
          </AnimatePresence>
          <Button onClick={send} className="mt-6 w-full">
            Send to an attorney for a free evaluation
          </Button>
          <p className="mt-4 flex gap-2 text-xs leading-relaxed text-stone-dark">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
            A self-check, not legal advice. Officers weigh the quality of evidence, not only the number of criteria.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Criterion({ item, on, onToggle, n }: { item: Item; on: boolean; onToggle: () => void; n?: number }) {
  return (
    <label
      className={cn(
        "group flex cursor-pointer gap-4 rounded-2xl border p-4 transition-all duration-300 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink",
        on ? "border-ink bg-white shadow-[inset_0_0_0_1px_var(--color-ink)]" : "border-line bg-white hover:border-ink/40",
      )}
    >
      <input type="checkbox" checked={on} onChange={onToggle} className="sr-only" />
      <motion.span
        animate={on ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
        className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border transition-colors", on ? "border-ink bg-ink text-paper" : "border-stone/50 text-stone")}
      >
        {on ? <Check aria-hidden className="size-3.5" /> : n ? <span className="text-[0.7rem] font-bold">{n}</span> : null}
      </motion.span>
      <span>
        <span className="block font-bold text-ink">{item.title}</span>
        <span className="mt-1 block text-sm leading-relaxed text-stone">{item.text}</span>
        <span className="mt-1 block text-sm text-brass-ink">{item.examples}</span>
      </span>
    </label>
  );
}
