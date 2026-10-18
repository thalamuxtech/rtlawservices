"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  AlertTriangle, ArrowRight, BellRing, Building2, CalendarDays, Check, ChevronDown, CircleDashed, Copy, FileText, Flag, History, Printer, Sparkles, User, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CTA } from "@/content/site";
import { CATEGORIES, type Category } from "@/content/tools/case-events";
import { QueueInsight } from "./QueueInsight";
import { CARD_FORMS, caseTone, daysBetween, formName, receiptOffice, stageOf, type CaseRecord, type HistoryItem, type Tone } from "@/content/tools/case-status";

const ease = [0.22, 1, 0.36, 1] as const;

export const TONE: Record<Tone, { label: string; dot: string; ring: string; text: string; bar: string }> = {
  positive: { label: "Positive step", dot: "bg-success", ring: "ring-success/30", text: "text-success", bar: "from-success/80 to-success/20" },
  action: { label: "Your response may be needed", dot: "bg-brass", ring: "ring-brass/40", text: "text-brass-ink", bar: "from-brass to-brass/20" },
  negative: { label: "Adverse decision", dot: "bg-danger", ring: "ring-danger/30", text: "text-danger", bar: "from-danger/80 to-danger/20" },
  progress: { label: "In progress", dot: "bg-ink", ring: "ring-ink/15", text: "text-ink", bar: "from-ink/70 to-ink/10" },
};

const CAT_STYLE: Partial<Record<Category, string>> = {
  approved: "bg-success/10 text-success",
  card: "bg-success/10 text-success",
  denied: "bg-danger/10 text-danger",
  rejected: "bg-danger/10 text-danger",
  evidence: "bg-brass-pale text-brass-ink",
  silent: "bg-mist text-stone",
  other: "bg-mist text-stone",
};

export function fmt(d: Date | undefined, zone: string, withTime = true) {
  if (!d) return "Not provided";
  // USCIS stores date-only values, such as the filing date, as midnight UTC.
  // Shown in another zone they would slip to the day before, so they keep UTC.
  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0) {
    return d.toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" });
  }
  // dateStyle and timeStyle cannot be combined with timeZoneName, so the parts are listed.
  return d.toLocaleString("en-US", {
    timeZone: zone || undefined,
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit", timeZoneName: "short" } : {}),
  });
}

// A date written as YYYY-MM-DD has no time of day, so it is shown without one.
const timed = (h: { rawDate?: string; kind?: string }) => h.kind === "silent" || !h.rawDate || /\d{2}:\d{2}/.test(h.rawDate);

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString()} ${n === 1 ? one : many}`;

type Milestone = { label: string; date?: Date; state: "done" | "current" | "todo" | "skipped"; note?: string };

function analyse(c: CaseRecord, now: Date) {
  const events = c.history.filter((h) => h.kind === "event");
  const earliest = (cats: Category[]) =>
    events.filter((h) => h.category && cats.includes(h.category) && h.date).sort((a, b) => a.date!.getTime() - b.date!.getTime())[0];
  const receipt = earliest(["receipt"]);
  const checks = earliest(["biometrics", "checks"]);
  const interview = earliest(["interview"]);
  const evidence = earliest(["evidence"]);
  const approved = earliest(["approved"]);
  const adverse = earliest(["denied", "rejected"]);
  const decided = earliest(["approved", "denied", "rejected", "decision"]);
  const card = earliest(["card"]);
  const decisionDate = decided?.date ?? card?.date;
  const showCard = !!card || CARD_FORMS.test(c.formType ?? "");
  const { stage, basis } = stageOf(c);

  const milestones: Milestone[] = [
    { label: "Filed", date: c.submitted, state: c.submitted ? "done" : "todo" },
    { label: "Receipt", date: receipt?.date, state: receipt || stage >= 0 ? "done" : "todo" },
    { label: "Biometrics and checks", date: checks?.date, state: checks ? "done" : stage >= 2 ? "skipped" : "todo", note: !checks && stage >= 2 ? "Not recorded" : undefined },
    {
      label: "Interview",
      date: interview?.date,
      state: interview ? "done" : decisionDate ? "skipped" : "todo",
      note: interview ? undefined : decisionDate ? "None recorded" : undefined,
    },
    { label: "Decision", date: decisionDate, state: decisionDate ? "done" : "todo", note: !decided && card ? "Inferred from the card" : undefined },
    ...(showCard ? [{ label: "Card or document", date: card?.date, state: card ? ("done" as const) : ("todo" as const) }] : []),
  ];
  const next = milestones.findIndex((m) => m.state === "todo");
  if (next > 0) milestones[next].state = "current";

  const lastEvent = events.filter((h) => h.date).sort((a, b) => b.date!.getTime() - a.date!.getTime())[0];
  const lastChange = [c.modified, lastEvent?.date].filter(Boolean).sort((a, b) => b!.getTime() - a!.getTime())[0];
  const dated = events.filter((h) => h.date).map((h) => h.date!.getTime()).sort((a, b) => a - b);
  let longestGap = 0;
  for (let i = 1; i < dated.length; i++) longestGap = Math.max(longestGap, Math.round((dated[i] - dated[i - 1]) / 86_400_000));
  const seen = new Set<string>();
  let repeats = 0;
  for (const h of events) {
    const k = `${h.code ?? h.title}|${h.date?.toISOString().slice(0, 10)}`;
    if (seen.has(k)) repeats++;
    seen.add(k);
  }
  const unpublished = [...new Set(events.filter((h) => h.source === "unpublished").map((h) => h.code!))];

  return {
    milestones,
    stage,
    basis,
    approved,
    adverse,
    evidence,
    interview,
    card,
    decided,
    decisionDate,
    lastChange,
    stats: {
      sinceFiled: c.submitted ? daysBetween(c.submitted, now) : undefined,
      toDecision: c.submitted && decisionDate ? daysBetween(c.submitted, decisionDate) : undefined,
      decisionToCard: decisionDate && card?.date && decided ? daysBetween(decisionDate, card.date) : undefined,
      sinceUpdate: lastChange ? daysBetween(lastChange, now) : undefined,
      events: events.length,
      notices: c.notices.length,
      longestGap,
    },
    repeats,
    unpublished,
  };
}

export function CaseResult({ record: c, raw, sample, zone, onClose }: { record: CaseRecord; raw: unknown; sample?: boolean; zone: string; onClose: () => void }) {
  const [now] = useState(() => new Date());
  const [copied, setCopied] = useState(false);
  const a = useMemo(() => analyse(c, now), [c, now]);
  const tone = caseTone(c);
  const t = TONE[tone];
  const name = c.formName || formName(c.formType);
  const office = c.receiptNumber ? receiptOffice(c.receiptNumber) : undefined;
  const d = (x?: Date, withTime = true) => fmt(x, zone, withTime);

  // The written summary. Every sentence rests on a recorded field.
  const summary: string[] = [];
  if (a.adverse) summary.push(`USCIS recorded "${a.adverse.title}" on ${d(a.adverse.date, false)}. Read the decision notice carefully, because deadlines to appeal or file a motion are short.`);
  else if (a.card) {
    summary.push(`USCIS records show the card for this case was produced on ${d(a.card.date)}. A card is produced only after an approval, so the case appears to be approved.`);
    summary.push(a.approved ? `USCIS recorded the approval as "${a.approved.title}" on ${d(a.approved.date)}.` : "The record does not include a separate published approval code, so the decision date shown is the card date.");
  } else if (a.approved) summary.push(`USCIS recorded an approval ("${a.approved.title}") on ${d(a.approved.date)}. A written decision notice usually follows.`);
  else if (a.evidence) summary.push(`USCIS recorded "${a.evidence.title}" on ${d(a.evidence.date, false)}. The notice states the deadline to respond, and missing it can lead to a denial.`);
  else summary.push(`The case is in progress. The furthest step recorded is "${a.basis?.title ?? "the receipt"}".`);

  if (a.stats.sinceFiled !== undefined) {
    let s = `The case was filed on ${d(c.submitted, false)}, ${plural(a.stats.sinceFiled, "day")} ago.`;
    if (a.stats.toDecision !== undefined) s += ` The decision came ${plural(a.stats.toDecision, "day")} after filing`;
    if (a.stats.decisionToCard !== undefined) s += `, and the card ${plural(a.stats.decisionToCard, "day")} after the decision`;
    summary.push(a.stats.toDecision !== undefined ? `${s}.` : s);
  }
  if (a.decisionDate && !a.interview && (a.approved || a.card)) summary.push("No interview appears in the record. USCIS can decide some cases without an interview, and the decision notice is the document that confirms how the case was decided.");
  else if (a.interview) summary.push(`The record includes an interview step: "${a.interview.title}", ${d(a.interview.date, false)}.`);
  if (a.unpublished.length) summary.push(`The record also includes ${plural(a.unpublished.length, "code")} that USCIS has not published (${a.unpublished.join(", ")}). ${a.unpublished.length === 1 ? "Its" : "Their"} meaning cannot be confirmed from public sources.`);
  if (a.repeats) summary.push(`${plural(a.repeats, "step")} appear${a.repeats === 1 ? "s" : ""} more than once on the same day, which happens when USCIS records a step again.`);
  if (c.actionRequired !== undefined) summary.push(c.actionRequired ? "USCIS marks an action as required on this case. Check your account and every notice for what is needed." : "In this data, USCIS does not mark any action as required from you.");
  if (c.modified) summary.push(`The case record was last updated on ${d(c.modified)}.`);

  const copy = async () => {
    const lines = [
      `Receipt number: ${c.receiptNumber}`,
      c.formType && `Form: ${c.formType}${name ? ` (${name})` : ""}`,
      c.statusTitle && `Current status: ${c.statusTitle}`,
      "",
      ...summary,
      "",
      ...c.history.map((h) => `${h.date ? d(h.date, timed(h)) : "Undated"}: ${h.title}${h.code ? ` (${h.code})` : ""}`),
    ].filter((x): x is string => typeof x === "string");
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const needsCounsel = tone === "action" || tone === "negative" || (a.stats.sinceUpdate ?? 0) > 180;
  const doneCount = a.milestones.filter((m) => m.state === "done" || m.state === "skipped").length;

  return (
    <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.5, ease }} aria-label="Case status" className="grid gap-6">
      {sample && (
        <p className="flex items-center gap-2 rounded-2xl border border-brass/40 bg-brass-pale px-5 py-3 text-sm font-bold text-brass-ink">
          <Sparkles aria-hidden className="size-4" /> Example case with fictional details. Enter your own receipt number to see your case.
        </p>
      )}

      {/* Status */}
      <div className={cn("relative overflow-hidden rounded-[2rem] border border-line bg-white p-6 ring-1 sm:p-10", t.ring)}>
        <div aria-hidden className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", t.bar)} />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <span className={cn("inline-flex items-center gap-2 rounded-full bg-mist px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em]", t.text)}>
            <span className={cn("size-2 rounded-full", t.dot)} /> {t.label}
          </span>
          <div className="flex gap-1 print:hidden">
            <IconBtn label={copied ? "Copied" : "Copy summary"} onClick={copy}>{copied ? <Check className="size-4" /> : <Copy className="size-4" />}</IconBtn>
            <IconBtn label="Print" onClick={() => window.print()}><Printer className="size-4" /></IconBtn>
            <IconBtn label="Close" onClick={onClose}><X className="size-4" /></IconBtn>
          </div>
        </div>
        <p className="eyebrow mt-6 text-brass-ink">Current status</p>
        <h2 className="font-serif-display mt-2 text-balance text-4xl leading-tight text-ink sm:text-5xl">{c.statusTitle || "Status not provided"}</h2>
        {c.statusText && <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-soft">{c.statusText}</p>}
        <div className="mt-6 flex flex-wrap gap-2">
          {c.closed !== undefined && <Tag>{c.closed ? "Case closed" : "Case open"}</Tag>}
          {c.actionRequired && <Tag warn>USCIS marks an action as required</Tag>}
          <Tag>{c.source === "account" ? "From your USCIS account data" : sample ? "Example data" : "From the USCIS Case Status API"}</Tag>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          <BigStat value={a.stats.sinceFiled} label="days since filing" />
          <BigStat value={a.stats.toDecision} label="days from filing to decision" empty="No decision yet" />
          <BigStat value={a.stats.decisionToCard} label="days from decision to card" empty={a.card ? "No separate decision recorded" : "No card yet"} />
          <BigStat value={a.stats.sinceUpdate} label="days since the last update" />
        </div>
      </div>

      {/* Details and flags */}
      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <Card title="Application information" icon={FileText}>
          <dl className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
            <Info label="Receipt number" value={c.receiptNumber || "Not provided"} sub={office} mono />
            <Info label="Form" value={c.formType || "Not provided"} sub={name} />
            {c.applicant && <Info label="Applicant" value={c.applicant} icon={User} />}
            {c.channel && <Info label="Filing channel" value={c.channel.replace(/_/g, " ")} icon={Building2} />}
            <Info label="Filed" value={d(c.submitted)} icon={CalendarDays} />
            <Info label="Last updated" value={d(a.lastChange)} icon={History} />
          </dl>
        </Card>
        <Card title="Case flags" icon={Flag}>
          <ul className="grid gap-3">
            {c.closed !== undefined && <FlagRow label="Case status" value={c.closed ? "Closed" : "Open"} good={c.closed && tone === "positive"} />}
            {c.acked !== undefined && <FlagRow label="Adjudicator status" value={c.acked ? "Acknowledged by the adjudicator and case system" : "Not yet acknowledged"} good={c.acked} />}
            {c.premium !== undefined && <FlagRow label="Processing type" value={c.premium ? "Premium processing" : "Standard processing"} />}
            {c.groupComplete !== undefined && <FlagRow label="Group status" value={c.groupComplete ? "All related cases complete" : "Related cases still pending"} />}
            <FlagRow label="Action required" value={c.actionRequired === undefined ? "Not stated in this data" : c.actionRequired ? "Yes, check your account" : "No action needed"} good={c.actionRequired === false} warn={c.actionRequired === true} />
            <FlagRow label="Evidence requests" value={a.evidence ? `Recorded on ${d(a.evidence.date, false)}` : c.evidenceOpen ? `${c.evidenceOpen} open` : "None recorded"} warn={!!a.evidence || !!c.evidenceOpen} good={!a.evidence && !c.evidenceOpen} />
            <FlagRow label="Official notices" value={c.notices.length ? plural(c.notices.length, "notice") : "None in this data"} />
          </ul>
        </Card>
      </div>

      {/* Progress */}
      <Card title="Adjudication progress" icon={CircleDashed} aside="Estimated from the recorded events, not an official USCIS stage.">
        {/* A vertical list on phones, one row of steps from the sm breakpoint up. */}
        <ol
          className="relative mt-4 grid gap-4 sm:grid-cols-[repeat(var(--steps),minmax(0,1fr))] sm:gap-3"
          style={{ "--steps": a.milestones.length } as React.CSSProperties}
        >
          <div aria-hidden className="absolute left-[8%] right-[8%] top-5 hidden h-0.5 bg-line sm:block" />
          <motion.div
            aria-hidden
            initial={{ scaleX: 0 }}
            animate={{ scaleX: Math.max(0, doneCount - 1) / Math.max(1, a.milestones.length - 1) }}
            transition={{ duration: 1.1, ease, delay: 0.2 }}
            style={{ originX: 0 }}
            className="absolute left-[8%] right-[8%] top-5 hidden h-0.5 bg-brass sm:block"
          />
          <div aria-hidden className="absolute bottom-5 left-5 top-5 w-0.5 -translate-x-1/2 bg-line sm:hidden" />
          <motion.div
            aria-hidden
            initial={{ scaleY: 0 }}
            animate={{ scaleY: Math.max(0, doneCount - 1) / Math.max(1, a.milestones.length - 1) }}
            transition={{ duration: 1.1, ease, delay: 0.2 }}
            style={{ originY: 0 }}
            className="absolute bottom-5 left-5 top-5 w-0.5 -translate-x-1/2 bg-brass sm:hidden"
          />
          {a.milestones.map((m, i) => (
            <li
              key={m.label}
              className="relative grid grid-cols-[2.5rem_1fr] items-center gap-x-4 text-left sm:grid-cols-1 sm:justify-items-center sm:gap-2 sm:text-center"
              aria-current={m.state === "current" ? "step" : undefined}
            >
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.25 + i * 0.1, duration: 0.4, ease }}
                className={cn(
                  "relative grid size-10 place-items-center rounded-full border-2 text-sm font-bold",
                  m.state === "done" ? "border-brass bg-brass text-ink" : m.state === "skipped" ? "border-brass/60 bg-white text-brass-ink" : m.state === "current" ? "border-brass bg-ink text-brass-light" : "border-line bg-white text-stone",
                )}
              >
                {m.state === "done" ? <Check aria-hidden className="size-4" /> : m.state === "skipped" ? "–" : i + 1}
                {m.state === "current" && <span aria-hidden className="absolute inset-0 animate-ping rounded-full border-2 border-brass/50" />}
              </motion.span>
              <span className="grid gap-0.5 sm:contents">
                <span className={cn("text-sm font-bold", m.state === "todo" ? "text-stone" : "text-ink")}>{m.label}</span>
                <span className="text-xs leading-tight text-stone">{m.note ?? (m.date ? d(m.date, false) : m.state === "current" ? "Next" : "")}</span>
              </span>
            </li>
          ))}
        </ol>
        {a.basis && (
          <p className="mt-8 text-sm text-stone">
            Furthest step: {a.basis.code ? <>code <span className="font-mono font-bold text-ink">{a.basis.code}</span>, </> : null}
            <strong className="text-ink">{a.basis.title}</strong>
            {a.basis.date ? <>, {d(a.basis.date, false)}</> : null}.
          </p>
        )}
      </Card>

      {/* National figures and the place-in-line estimate. A closed case with no
          recorded decision is treated as finished at its last update. */}
      <QueueInsight form={c.formType} filed={c.submitted} decided={a.decisionDate ?? (c.closed ? a.lastChange : undefined)} now={now} />

      {/* Summary */}
      <div className="on-dark relative overflow-hidden rounded-[2rem] bg-ink p-6 text-paper sm:p-10">
        <div aria-hidden className="grain absolute inset-0" />
        <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="eyebrow text-brass-light">Case summary and analysis</p>
            <h3 className="font-serif-display mt-2 text-3xl">
              {c.formType ? `${c.formType} ` : ""}
              {c.receiptNumber}
            </h3>
            <div className="mt-5 grid gap-3 leading-relaxed text-stone-dark">
              {summary.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
          <dl className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-2">
            <DarkStat value={a.stats.events} label={a.stats.events === 1 ? "event recorded" : "events recorded"} />
            <DarkStat value={a.stats.notices} label={a.stats.notices === 1 ? "official notice" : "official notices"} />
            <DarkStat value={a.stats.longestGap} label="days in the longest gap" />
            <DarkStat value={a.unpublished.length} label={a.unpublished.length === 1 ? "unpublished code" : "unpublished codes"} />
          </dl>
        </div>
      </div>

      {/* Notices */}
      {c.notices.length > 0 && (
        <Card title="Official notices" icon={BellRing}>
          <ul className="grid gap-4 md:grid-cols-2">
            {c.notices.map((n, i) => (
              <li key={i} className="rounded-2xl border border-line bg-mist/50 p-5">
                <p className="font-bold text-ink">{n.title}</p>
                {n.date && <p className="text-sm text-stone">Generated {d(n.date)}</p>}
                {n.appointment && (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-ink ring-1 ring-line">
                    <CalendarDays aria-hidden className="size-4 text-brass-ink" /> Appointment: {d(n.appointment)}
                  </p>
                )}
                <dl className="mt-3 grid gap-1 text-sm">
                  {n.receipt && <Row label="Receipt" value={n.receipt} mono />}
                  {n.letterId && <Row label="Letter ID" value={n.letterId} mono />}
                  {n.fields.slice(0, 6).map((f) => (
                    <Row key={f.label} label={f.label} value={f.value} />
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Timeline */}
      {c.history.length > 0 && (
        <Card title="Event timeline" icon={History} aside="Newest first. Times in the zone you chose above.">
          <ol className="relative mt-4 grid">
            <div aria-hidden className="absolute bottom-3 left-[7px] top-3 w-px bg-line" />
            {c.history.map((h, i) => (
              <TimelineItem key={`${h.id ?? h.title}-${i}`} h={h} i={i} next={c.history[i + 1]} d={d} />
            ))}
          </ol>
        </Card>
      )}

      {/* Next step */}
      <div className={cn("on-dark relative overflow-hidden rounded-[2rem] p-6 sm:p-10 print:hidden", needsCounsel ? "bg-ink text-paper" : "bg-ink-raised text-paper")}>
        <div aria-hidden className="grain absolute inset-0" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-2xl">
            <p className="eyebrow text-brass-light">{needsCounsel ? "A good moment for advice" : "Questions about your case?"}</p>
            <p className="font-serif-display mt-2 text-3xl">
              {tone === "action"
                ? "A request from USCIS usually has a firm deadline."
                : tone === "negative"
                  ? "An adverse decision may still leave options open."
                  : (a.stats.sinceUpdate ?? 0) > 180
                    ? "No update for more than six months can be worth a review."
                    : "An attorney can explain what this record means for you."}
            </p>
            <p className="mt-3 text-stone-dark">A status record is only part of the picture. We can review your notices and the file before you decide what to do.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={CTA.consultation.href} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brass px-6 font-bold text-ink hover:bg-brass-light">
              Book a consultation <ArrowRight aria-hidden className="size-4" />
            </Link>
            <Link href={CTA.evaluation.href} className="inline-flex min-h-12 items-center rounded-full border border-brass-light/50 px-6 font-bold text-brass-light hover:bg-brass-light hover:text-ink">
              Free evaluation
            </Link>
          </div>
        </div>
      </div>

      <details className="group rounded-2xl border border-line bg-white p-5 print:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold text-ink">
          Data received from USCIS <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
        </summary>
        <pre className="mt-4 max-h-96 overflow-auto rounded-xl bg-ink p-4 text-xs leading-relaxed text-stone-dark">{JSON.stringify(raw, null, 2)}</pre>
      </details>
    </motion.section>
  );
}

function TimelineItem({ h, i, next, d }: { h: HistoryItem; i: number; next?: HistoryItem; d: (x?: Date, t?: boolean) => string }) {
  const cat = h.category ?? "other";
  const gap = h.date && next?.date ? daysBetween(next.date, h.date) : undefined;
  const explain =
    h.source === "unpublished"
      ? `USCIS recorded code ${h.code}, which is not in the published code list. Applicants report seeing unpublished codes at many points in a case, so this one cannot be read as a specific step.`
      : CATEGORIES[cat].explain;
  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 + Math.min(i, 12) * 0.05, duration: 0.4, ease }}
      className="relative grid gap-1.5 pb-9 pl-10 last:pb-0"
    >
      <span aria-hidden className={cn("absolute left-0 top-1.5 size-[15px] rounded-full border-[3px] border-white ring-1", i === 0 ? "bg-brass ring-brass/40" : h.kind === "filed" ? "bg-ink ring-ink/30" : "bg-sand ring-line")} />
      <span className="flex flex-wrap items-center gap-2 text-sm text-stone">
        {h.date ? d(h.date, timed(h)) : h.rawDate || "Date not provided"}
        {gap !== undefined && gap > 0 && <span className="rounded-full bg-mist px-2 py-0.5 text-xs">+{gap} days</span>}
      </span>
      <span className="flex flex-wrap items-center gap-2">
        <span className={cn("font-bold", i === 0 ? "text-lg text-ink" : "text-ink-soft")}>{h.title}</span>
        {h.code && <span className="rounded-md bg-ink px-2 py-0.5 font-mono text-xs text-brass-light">{h.code}</span>}
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", CAT_STYLE[cat] ?? "bg-brass-pale/60 text-brass-ink")}>{CATEGORIES[cat].label}</span>
        {h.source === "unpublished" && <span className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-0.5 text-xs text-stone"><AlertTriangle aria-hidden className="size-3" /> Not in the published list</span>}
      </span>
      <span className="max-w-3xl text-sm leading-relaxed text-stone">{h.detail ?? explain}</span>
      {(h.id || h.recorded) && (
        <span className="font-mono text-[0.7rem] text-stone/80">
          {h.id ? `Event ID ${h.id}` : ""}
          {h.id && h.recorded ? " · " : ""}
          {h.recorded ? `Entered in the record ${d(h.recorded)}` : ""}
        </span>
      )}
    </motion.li>
  );
}

function Card({ title, icon: Icon, aside, children }: { title: string; icon: typeof FileText; aside?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[2rem] border border-line bg-white p-6 sm:p-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h3 className="font-serif-display flex items-center gap-3 text-2xl text-ink sm:text-3xl">
          <span className="grid size-10 place-items-center rounded-full bg-mist text-brass-ink">
            <Icon aria-hidden className="size-5" />
          </span>
          {title}
        </h3>
        {aside && <p className="text-sm text-stone">{aside}</p>}
      </div>
      {children}
    </div>
  );
}

function Info({ label, value, sub, mono, icon: Icon }: { label: string; value: string; sub?: string; mono?: boolean; icon?: typeof FileText }) {
  return (
    <div className="bg-white p-4">
      <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-stone">
        {Icon && <Icon aria-hidden className="size-3.5 text-brass-ink" />} {label}
      </dt>
      <dd className={cn("mt-1.5 font-bold text-ink", mono && "font-mono tracking-wider")}>{value}</dd>
      {sub && <dd className="mt-0.5 text-sm text-stone">{sub}</dd>}
    </div>
  );
}

function FlagRow({ label, value, good, warn }: { label: string; value: string; good?: boolean; warn?: boolean }) {
  return (
    <li className="flex items-start justify-between gap-4 border-b border-line pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-stone">{label}</span>
      <span className={cn("inline-flex items-center gap-1.5 text-right text-sm font-bold", warn ? "text-brass-ink" : good ? "text-success" : "text-ink")}>
        {warn ? <AlertTriangle aria-hidden className="size-4 shrink-0" /> : good ? <Check aria-hidden className="size-4 shrink-0" /> : null}
        {value}
      </span>
    </li>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-stone">{label}</dt>
      <dd className={cn("text-right text-ink", mono && "font-mono")}>{value}</dd>
    </div>
  );
}

function BigStat({ value, label, empty = "Not available" }: { value?: number; label: string; empty?: string }) {
  return (
    <div className="bg-white p-5">
      <p className="font-serif-display text-4xl text-ink">{value === undefined ? <span className="text-xl text-stone">{empty}</span> : value.toLocaleString()}</p>
      <p className="mt-1 text-sm text-stone">{label}</p>
    </div>
  );
}

function DarkStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-line-dark bg-ink-raised/70 p-4">
      <dt className="font-serif-display text-3xl text-paper">{value.toLocaleString()}</dt>
      <dd className="mt-1 text-sm text-stone-dark">{label}</dd>
    </div>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="grid size-11 place-items-center rounded-full text-stone transition-colors hover:bg-mist hover:text-ink">
      {children}
    </button>
  );
}

function Tag({ children, warn }: { children: React.ReactNode; warn?: boolean }) {
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold", warn ? "border-brass/50 bg-brass-pale text-brass-ink" : "border-line text-stone")}>{children}</span>;
}
