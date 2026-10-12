"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle, ArrowRight, Bookmark, BookOpen, Building2, CalendarDays, Check, ChevronDown, ClipboardPaste, Clock, Copy, ExternalLink,
  FileText, History, Loader2, Lock, Printer, Search, ShieldCheck, Sparkles, Trash2, Upload, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CASE_STATUS_RELAY, CTA } from "@/content/site";
import {
  daysBetween, formName, normalizeReceipt, parseCase, RECEIPT, receiptOffice, SAMPLE, STAGES, stageOf, toneOf, type CaseRecord, type Tone,
} from "@/content/tools/case-status";

const ease = [0.22, 1, 0.36, 1] as const;
const STORE = "rt-tracked-cases";

const ZONES = [
  { id: "", label: "My time zone" },
  { id: "America/New_York", label: "Eastern" },
  { id: "America/Chicago", label: "Central" },
  { id: "America/Denver", label: "Mountain" },
  { id: "America/Phoenix", label: "Arizona" },
  { id: "America/Los_Angeles", label: "Pacific" },
  { id: "America/Anchorage", label: "Alaska" },
  { id: "Pacific/Honolulu", label: "Hawaii" },
  { id: "America/Puerto_Rico", label: "Atlantic (Puerto Rico)" },
  { id: "Pacific/Guam", label: "Chamorro (Guam)" },
  { id: "UTC", label: "Coordinated Universal Time (UTC)" },
];

const TONE: Record<Tone, { label: string; dot: string; ring: string; text: string; bar: string }> = {
  positive: { label: "Positive step", dot: "bg-success", ring: "ring-success/30", text: "text-success", bar: "from-success/80 to-success/20" },
  action: { label: "Your response may be needed", dot: "bg-brass", ring: "ring-brass/40", text: "text-brass-ink", bar: "from-brass to-brass/20" },
  negative: { label: "Adverse decision", dot: "bg-danger", ring: "ring-danger/30", text: "text-danger", bar: "from-danger/80 to-danger/20" },
  progress: { label: "In progress", dot: "bg-ink", ring: "ring-ink/15", text: "text-ink", bar: "from-ink/70 to-ink/10" },
};

type Saved = { receipt: string; form?: string; status?: string; tone: Tone; checked: number; record: unknown };

const stepBtn =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-brass/60 px-5 font-bold text-brass-light transition-colors hover:bg-brass hover:text-ink";

const copyHint = "On that page press Ctrl+A, then Ctrl+C (Cmd on a Mac). On a phone, press and hold, choose Select all, then Copy. Come back and press the button.";

function Step({ n, title, text, children }: { n: number; title: string; text: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-line-dark bg-ink-raised/60 p-5">
      <div className="flex items-start gap-3">
        <span className="font-serif-display grid size-9 shrink-0 place-items-center rounded-full border border-brass/50 text-brass-light">{n}</span>
        <span>
          <span className="block font-bold text-paper">{title}</span>
          <span className="text-sm leading-relaxed text-stone-dark">{text}</span>
        </span>
      </div>
      <div className="mt-auto">{children}</div>
    </li>
  );
}

const mask = (r: string) => `${r.slice(0, 3)}••••••${r.slice(-4)}`;

function readSaved(): Saved[] {
  try {
    return JSON.parse(localStorage.getItem(STORE) || "[]");
  } catch {
    return [];
  }
}

function writeSaved(list: Saved[]) {
  try {
    localStorage.setItem(STORE, JSON.stringify(list.slice(0, 12)));
  } catch {}
}

/** Saves a looked-up case to this browser's list, newest first, and returns the list. */
function remember(record: CaseRecord, raw: unknown): Saved[] {
  const entry: Saved = { receipt: record.receiptNumber, form: record.formType, status: record.statusTitle, tone: toneOf(record.statusTitle), checked: Date.now(), record: raw };
  const next = [entry, ...readSaved().filter((s) => s.receipt !== entry.receipt)];
  writeSaved(next);
  return next;
}

export function CaseTracker() {
  // Until live lookups are connected, the account steps are the way to a full timeline.
  const [mode, setMode] = useState<"lookup" | "paste">(CASE_STATUS_RELAY ? "lookup" : "paste");
  const [receipt, setReceipt] = useState("");
  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ record: CaseRecord; raw: unknown; sample?: boolean } | null>(null);
  const [zone, setZone] = useState("");
  const [saved, setSaved] = useState<Saved[]>([]);
  const [manual, setManual] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Saved cases live only in this browser; read them after the page loads.
    // ?example=1 opens the example case, for sharing a demonstration.
    const t = setTimeout(() => {
      setSaved(readSaved());
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "account") setMode("paste");
      if (params.get("tab") === "receipt") setMode("lookup");
      if (params.has("example")) setResult({ record: parseCase(SAMPLE), raw: SAMPLE, sample: true });
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const clean = normalizeReceipt(receipt);
  const valid = RECEIPT.test(clean);
  const office = clean.length >= 3 ? receiptOffice(clean) : undefined;

  const show = (raw: unknown, sample = false) => display(parseCase(raw), raw, sample);

  const display = (record: CaseRecord, raw: unknown, sample = false) => {
    setResult({ record, raw, sample });
    setError("");
    if (!sample && record.receiptNumber) setSaved(remember(record, raw));
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const lookup = async (r = clean) => {
    if (!RECEIPT.test(r)) return setError("Enter a 13-character receipt number: three letters followed by ten digits.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${CASE_STATUS_RELAY.replace(/\/$/, "")}/?receipt=${r}`, { headers: { Accept: "application/json" } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "The lookup did not succeed. Please try again.");
      show(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The lookup did not succeed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const analyze = (text = pasted) => {
    try {
      const record = parseCase(text);
      display(record, JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)));
    } catch (e) {
      setManual(true);
      setPasted(text);
      setError(e instanceof Error ? e.message : "This data could not be read.");
    }
  };

  // Reads what the visitor copied on the USCIS page, in one click.
  const pasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) return setError("Your clipboard is empty. On the USCIS case data page, select all the text and copy it first.");
      analyze(text);
    } catch {
      setManual(true);
      setError("Your browser did not let this page read the clipboard. Paste into the box below instead: Ctrl+V on a computer, or press and hold, then Paste, on a phone.");
    }
  };

  // Keeps the latest analyze for listeners added once.
  const analyzeRef = useRef(analyze);
  useEffect(() => {
    analyzeRef.current = analyze;
  });

  useEffect(() => {
    // Ctrl+V anywhere on the account tab reads the case at once.
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (mode !== "paste" || target?.closest("input, textarea")) return;
      const text = e.clipboardData?.getData("text") ?? "";
      if (text.trim()) analyzeRef.current(text);
    };
    // The one-click reader sends case data from the USCIS site to this page.
    const onMessage = (e: MessageEvent) => {
      if (!/^https:\/\/(my|myaccount)\.uscis\.gov$/.test(e.origin)) return;
      const msg = e.data as { type?: string; data?: unknown } | null;
      if (msg?.type !== "rt-case-data" || typeof msg.data !== "string") return;
      (e.source as Window | null)?.postMessage("rt-case-ack", e.origin);
      setMode("paste");
      analyzeRef.current(msg.data);
    };
    document.addEventListener("paste", onPaste);
    window.addEventListener("message", onMessage);
    return () => {
      document.removeEventListener("paste", onPaste);
      window.removeEventListener("message", onMessage);
    };
  }, [mode]);

  const upload = (file?: File) => {
    if (!file) return;
    if (file.size > 2_000_000) return setError("This file is larger than case data usually is. Choose the file you saved from USCIS.");
    file.text().then((t) => {
      setPasted(t);
      analyze(t);
    });
  };

  const remove = (r: string) => {
    const next = readSaved().filter((s) => s.receipt !== r);
    writeSaved(next);
    setSaved(next);
  };

  const accountUrl = valid ? `https://my.uscis.gov/account/case-service/api/cases/${clean}` : "";

  return (
    <div className="grid gap-12">
      {/* Input */}
      <div className="on-dark relative overflow-hidden rounded-[2rem] bg-ink p-6 text-paper shadow-[0_50px_120px_-50px_rgba(20,24,31,0.7)] sm:p-10">
        <div aria-hidden className="grain absolute inset-0" />
        <div aria-hidden className="absolute -right-32 -top-32 size-[460px] rounded-full bg-[radial-gradient(circle,rgba(177,151,107,0.22),transparent_65%)]" />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div role="tablist" aria-label="How to check" className="inline-grid grid-cols-2 rounded-full border border-line-dark bg-ink-raised/80 p-1">
              {[
                { id: "lookup" as const, label: "Receipt number", icon: Search },
                { id: "paste" as const, label: "From my USCIS account", icon: ClipboardPaste },
              ].map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  type="button"
                  aria-selected={mode === t.id}
                  onClick={() => {
                    setMode(t.id);
                    setError("");
                  }}
                  className={cn("relative inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold transition-colors sm:px-6", mode === t.id ? "text-ink" : "text-stone-dark hover:text-paper")}
                >
                  {mode === t.id && <motion.span layoutId="tracker-tab" className="absolute inset-0 rounded-full bg-brass" transition={{ type: "spring", stiffness: 380, damping: 34 }} />}
                  <t.icon aria-hidden className="relative size-4" />
                  <span className="relative">{t.label}</span>
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-stone-dark">
              <Clock aria-hidden className="size-4 text-brass-light" />
              <span className="sr-only sm:not-sr-only">Show times in</span>
              <select value={zone} onChange={(e) => setZone(e.target.value)} className="min-h-11 rounded-full border border-line-dark bg-ink-raised px-4 text-paper focus:border-brass focus:outline-none">
                {ZONES.map((z) => (
                  <option key={z.id} value={z.id}>{z.label}</option>
                ))}
              </select>
            </label>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {mode === "lookup" ? (
              <motion.div key="lookup" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease }} className="mt-10">
                <label htmlFor="receipt" className="eyebrow text-brass-light">Receipt number</label>
                <form
                  className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (CASE_STATUS_RELAY) lookup();
                  }}
                >
                  <div className={cn("relative flex items-center rounded-2xl border bg-ink-raised/70 transition-colors focus-within:border-brass", error ? "border-danger/70" : valid ? "border-success/60" : "border-line-dark")}>
                    <input
                      id="receipt"
                      value={receipt}
                      onChange={(e) => setReceipt(e.target.value.toUpperCase())}
                      placeholder="EAC2190000001"
                      autoComplete="off"
                      spellCheck={false}
                      inputMode="text"
                      maxLength={20}
                      aria-describedby="receipt-help"
                      className="min-h-16 w-full bg-transparent px-5 font-mono text-xl tracking-[0.18em] text-paper placeholder:text-stone-dark/40 focus:outline-none sm:text-2xl"
                    />
                    <span className={cn("mr-4 inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold", valid ? "bg-success/20 text-[#8fd3b0]" : "bg-line-dark text-stone-dark")}>
                      {valid ? <Check aria-hidden className="size-3.5" /> : null}
                      {valid ? "Valid format" : `${clean.length}/13`}
                    </span>
                  </div>
                  {CASE_STATUS_RELAY ? (
                    <button type="submit" disabled={busy} className="inline-flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-brass px-8 font-bold text-ink transition-colors hover:bg-brass-light disabled:opacity-60">
                      {busy ? <Loader2 aria-hidden className="size-5 animate-spin" /> : <Search aria-hidden className="size-5" />}
                      {busy ? "Checking with USCIS" : "Check status"}
                    </button>
                  ) : (
                    <a href="https://egov.uscis.gov/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-brass px-8 font-bold text-ink transition-colors hover:bg-brass-light">
                      Check on uscis.gov <ExternalLink aria-hidden className="size-4" />
                    </a>
                  )}
                </form>
                <div id="receipt-help" className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-stone-dark">
                  <span>Printed on your receipt notice (Form I-797C). Three letters, then ten digits. Works for every USCIS form.</span>
                  {office && (
                    <motion.span initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-2 rounded-full border border-line-dark px-3 py-1 text-paper">
                      <Building2 aria-hidden className="size-4 text-brass-light" /> {office}
                    </motion.span>
                  )}
                </div>
                {!CASE_STATUS_RELAY && (
                  <p className="mt-6 max-w-2xl rounded-2xl border border-line-dark bg-ink-raised/60 p-4 text-sm leading-relaxed text-stone-dark">
                    <strong className="text-paper">Live lookups are being connected to the USCIS Case Status API.</strong> Until then, check on uscis.gov, or use{" "}
                    <button type="button" onClick={() => setMode("paste")} className="font-bold text-brass-light underline underline-offset-4 hover:text-paper">
                      From my USCIS account
                    </button>{" "}
                    to see a full timeline here in three quick steps.
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div key="paste" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease }} className="mt-10">
                <ol className="grid gap-4 lg:grid-cols-3">
                  <Step n={1} title="Sign in to USCIS" text="Use the account that filed the case, in this same browser.">
                    <a href="https://myaccount.uscis.gov/sign-in" target="_blank" rel="noopener noreferrer" className={stepBtn}>
                      Sign in to USCIS <ExternalLink aria-hidden className="size-4" />
                    </a>
                  </Step>
                  <Step n={2} title="Open your case data" text="Enter the receipt number, then open the page of data USCIS keeps for it.">
                    <div className="grid gap-2">
                      <input
                        aria-label="Receipt number"
                        value={receipt}
                        onChange={(e) => setReceipt(e.target.value.toUpperCase())}
                        placeholder="IOE0123456789"
                        autoComplete="off"
                        spellCheck={false}
                        maxLength={20}
                        className={cn("min-h-12 w-full rounded-xl border bg-ink px-4 font-mono tracking-[0.14em] text-paper placeholder:text-stone-dark/40 focus:border-brass focus:outline-none", valid ? "border-success/60" : "border-line-dark")}
                      />
                      <a
                        href={accountUrl || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-disabled={!valid}
                        onClick={(e) => {
                          if (valid) return;
                          e.preventDefault();
                          setError("Enter a 13-character receipt number first: three letters followed by ten digits.");
                        }}
                        className={cn(stepBtn, !valid && "cursor-not-allowed opacity-50")}
                      >
                        Open my case data <ExternalLink aria-hidden className="size-4" />
                      </a>
                    </div>
                  </Step>
                  <Step n={3} title="Copy it and bring it here" text={copyHint}>
                    <button type="button" onClick={pasteClipboard} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brass px-5 font-bold text-ink transition-colors hover:bg-brass-light">
                      <ClipboardPaste aria-hidden className="size-4" /> Paste and show my case
                    </button>
                  </Step>
                </ol>

                <Bookmarklet />

                <details open={manual} onToggle={(e) => setManual((e.target as HTMLDetailsElement).open)} className="group mt-6 rounded-2xl border border-line-dark bg-ink-raised/40 p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-stone-dark hover:text-paper">
                    Paste or upload the data yourself, or use a Case Status API response <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <label htmlFor="case-data" className="sr-only">Case data</label>
                  <textarea
                    id="case-data"
                    value={pasted}
                    onChange={(e) => setPasted(e.target.value)}
                    rows={7}
                    spellCheck={false}
                    placeholder={'{ "data": { "receiptNumber": "…", "events": [ … ] } }'}
                    className="mt-4 w-full rounded-2xl border border-line-dark bg-ink-raised/70 p-4 font-mono text-sm leading-relaxed text-paper placeholder:text-stone-dark/50 focus:border-brass focus:outline-none"
                  />
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button type="button" onClick={() => analyze()} disabled={!pasted.trim()} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brass px-6 font-bold text-ink transition-colors hover:bg-brass-light disabled:opacity-50">
                      <Sparkles aria-hidden className="size-4" /> Show my case
                    </button>
                    <label className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full border border-line-dark px-5 font-bold text-paper transition-colors hover:border-brass-light">
                      <Upload aria-hidden className="size-4" /> Upload file
                      <input type="file" accept=".json,.txt,application/json,text/plain" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
                    </label>
                    {pasted && (
                      <button type="button" onClick={() => setPasted("")} className="inline-flex min-h-12 items-center gap-2 rounded-full px-4 text-sm font-bold text-stone-dark hover:text-paper">
                        <X aria-hidden className="size-4" /> Clear
                      </button>
                    )}
                  </div>
                </details>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.p role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-6 flex items-start gap-2 text-sm font-bold text-[#f0a8a8]">
                <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" /> {error}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line-dark pt-6 text-sm text-stone-dark">
            <span className="inline-flex items-center gap-2">
              <Lock aria-hidden className="size-4 text-brass-light" />
              {mode === "paste"
                ? "Pasted data is read in your browser and is never sent to us."
                : CASE_STATUS_RELAY
                  ? "Your receipt number goes only to USCIS, through our secure relay. We keep no copy."
                  : "What you type here stays in your browser."}
            </span>
            <button type="button" onClick={() => show(SAMPLE, true)} className="inline-flex min-h-11 items-center gap-2 font-bold text-brass-light hover:text-paper">
              See an example case <ArrowRight aria-hidden className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Saved cases */}
      {saved.length > 0 && (
        <section aria-labelledby="saved-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="saved-heading" className="font-serif-display text-3xl text-ink">Your tracked cases</h2>
            <p className="text-sm text-stone">Kept only in this browser. Clearing your browser data removes them.</p>
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((s) => (
              <li key={s.receipt} className="group relative">
                <button
                  type="button"
                  onClick={() => {
                    // With live lookups, refresh from USCIS; otherwise show the saved data.
                    if (CASE_STATUS_RELAY) {
                      setReceipt(s.receipt);
                      lookup(s.receipt);
                    } else show(s.record);
                  }}
                  className="flex w-full items-start gap-4 rounded-2xl border border-line bg-white p-5 pr-14 text-left transition-all hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-[0_20px_50px_-30px_rgba(20,24,31,0.45)]"
                >
                  <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", TONE[s.tone].dot)} />
                  <span className="min-w-0">
                    <span className="block font-mono text-sm tracking-widest text-ink">{mask(s.receipt)}</span>
                    <span className="mt-1 block truncate font-bold text-ink">{s.status || "Status not available"}</span>
                    <span className="mt-1 block text-xs text-stone">
                      {s.form ? `${s.form} · ` : ""}checked {new Date(s.checked).toLocaleDateString("en-US", { dateStyle: "medium" })}
                    </span>
                  </span>
                </button>
                <button type="button" aria-label={`Remove ${mask(s.receipt)}`} onClick={() => remove(s.receipt)} className="absolute right-3 top-3 grid size-10 place-items-center rounded-full text-stone transition-colors hover:bg-mist hover:text-danger">
                  <Trash2 aria-hidden className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Results */}
      <div ref={resultsRef} className="scroll-mt-32">
        <AnimatePresence mode="wait">
          {result && <Result key={result.record.receiptNumber + String(result.sample)} {...result} zone={zone} onClose={() => setResult(null)} />}
        </AnimatePresence>
      </div>

      <Disclaimer />
    </div>
  );
}

function fmt(d: Date | undefined, zone: string, withTime = false) {
  if (!d) return "Not provided";
  return d.toLocaleString("en-US", { timeZone: zone || undefined, dateStyle: "medium", ...(withTime ? { timeStyle: "short" } : {}) });
}

// A date written as YYYY-MM-DD has no time of day, so it is shown without one.
const hasTime = (raw?: string) => !!raw && /\d{2}:\d{2}/.test(raw);

function Result({ record: c, raw, sample, zone, onClose }: { record: CaseRecord; raw: unknown; sample?: boolean; zone: string; onClose: () => void }) {
  const tone = toneOf(c.statusTitle);
  const t = TONE[tone];
  const { stage, basis } = stageOf(c);
  const [copied, setCopied] = useState(false);
  const [now] = useState(() => new Date());
  const name = formName(c.formType);
  const office = c.receiptNumber ? receiptOffice(c.receiptNumber) : undefined;
  const sinceFiled = c.submitted ? daysBetween(c.submitted, now) : undefined;
  const lastChange = c.modified ?? c.history[0]?.date;
  const sinceUpdate = lastChange ? daysBetween(lastChange, now) : undefined;
  const quiet = useMemo(() => {
    const dated = c.history.filter((h) => h.date).map((h) => h.date!.getTime()).sort((a, b) => a - b);
    let max = 0;
    for (let i = 1; i < dated.length; i++) max = Math.max(max, Math.round((dated[i] - dated[i - 1]) / 86_400_000));
    return max;
  }, [c.history]);

  const summary = [
    `Receipt number: ${c.receiptNumber}`,
    c.formType && `Form: ${c.formType}${name ? ` (${name})` : ""}`,
    c.statusTitle && `Current status: ${c.statusTitle}`,
    c.submitted && `Filed: ${fmt(c.submitted, zone)}`,
    lastChange && `Last update: ${fmt(lastChange, zone)}`,
    "",
    ...c.history.map((h) => `${h.rawDate ? fmt(h.date, zone, hasTime(h.rawDate)) : "Undated"}: ${h.title}${h.code ? ` (${h.code})` : ""}`),
  ].filter((x): x is string => typeof x === "string").join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const needsCounsel = tone === "action" || tone === "negative" || (sinceUpdate ?? 0) > 180;

  return (
    <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.5, ease }} aria-label="Case status" className="grid gap-6 print:gap-4">
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
          {c.source === "account" && <Tag>From your USCIS account data</Tag>}
          {c.source === "api" && !sample && <Tag>From the USCIS Case Status API</Tag>}
        </div>

        <dl className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          <Meta icon={FileText} label="Form" value={c.formType || "Not provided"} sub={name} />
          <Meta icon={Building2} label="Receipt number" value={c.receiptNumber || "Not provided"} sub={office} mono />
          <Meta icon={CalendarDays} label="Filed" value={fmt(c.submitted, zone)} sub={sinceFiled !== undefined ? `${sinceFiled.toLocaleString()} days ago` : undefined} />
          <Meta icon={History} label="Last update" value={fmt(lastChange, zone)} sub={sinceUpdate !== undefined ? `${sinceUpdate.toLocaleString()} days ago` : undefined} />
        </dl>
      </div>

      {/* Progress */}
      <div className="rounded-[2rem] border border-line bg-white p-6 sm:p-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3 className="font-serif-display text-3xl text-ink">Where the case appears to be</h3>
          <p className="text-sm text-stone">Estimated from the recorded updates, not an official USCIS stage.</p>
        </div>
        <ol className="relative mt-10 grid grid-cols-5 gap-2">
          <div aria-hidden className="absolute left-[10%] right-[10%] top-5 h-0.5 bg-line" />
          <motion.div aria-hidden initial={{ scaleX: 0 }} animate={{ scaleX: stage / (STAGES.length - 1) }} transition={{ duration: 1.1, ease, delay: 0.2 }} style={{ originX: 0 }} className="absolute left-[10%] right-[10%] top-5 h-0.5 bg-brass" />
          {STAGES.map((s, i) => {
            const done = i < stage;
            const current = i === stage;
            return (
              <li key={s} className="relative grid justify-items-center gap-3 text-center" aria-current={current ? "step" : undefined}>
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.25 + i * 0.12, duration: 0.4, ease }}
                  className={cn("relative grid size-10 place-items-center rounded-full border-2 text-sm font-bold", done ? "border-brass bg-brass text-ink" : current ? "border-brass bg-ink text-brass-light" : "border-line bg-white text-stone")}
                >
                  {done ? <Check aria-hidden className="size-4" /> : i + 1}
                  {current && <span aria-hidden className="absolute inset-0 animate-ping rounded-full border-2 border-brass/50" />}
                </motion.span>
                <span className={cn("text-xs font-bold sm:text-sm", i <= stage ? "text-ink" : "text-stone")}>{s}</span>
              </li>
            );
          })}
        </ol>
        {basis && (
          <p className="mt-8 text-sm text-stone">
            Based on {basis.code ? <>status code <span className="font-mono font-bold text-ink">{basis.code}</span>, </> : null}
            <strong className="text-ink">{basis.title}</strong>
            {basis.date ? <>, {fmt(basis.date, zone)}</> : null}.
          </p>
        )}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat value={c.history.length} label={c.history.length === 1 ? "status update recorded" : "status updates recorded"} />
          <Stat value={sinceUpdate ?? "–"} label="days since the last update" />
          <Stat value={quiet || "–"} label="days in the longest gap between updates" />
        </div>
      </div>

      {/* Timeline */}
      {c.history.length > 0 && (
        <div className="rounded-[2rem] border border-line bg-white p-6 sm:p-10">
          <h3 className="font-serif-display text-3xl text-ink">Timeline</h3>
          <ol className="relative mt-8 grid gap-0">
            <div aria-hidden className="absolute bottom-3 left-[7px] top-3 w-px bg-line" />
            {c.history.map((h, i) => {
              const next = c.history[i + 1];
              const gap = h.date && next?.date ? daysBetween(next.date, h.date) : undefined;
              const ht = toneOf(h.title);
              return (
                <motion.li key={`${h.title}-${i}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + Math.min(i, 10) * 0.06, duration: 0.4, ease }} className="relative grid gap-1 pb-8 pl-10 last:pb-0">
                  <span aria-hidden className={cn("absolute left-0 top-1.5 size-[15px] rounded-full border-[3px] border-white ring-1", i === 0 ? cn(TONE[ht].dot, "ring-ink/20") : "bg-sand ring-line")} />
                  <span className="text-sm text-stone">
                    {h.date ? fmt(h.date, zone, hasTime(h.rawDate)) : h.rawDate || "Date not provided"}
                    {gap !== undefined && gap > 0 && <span className="ml-2 rounded-full bg-mist px-2 py-0.5 text-xs">+{gap} days</span>}
                  </span>
                  <span className={cn("font-bold", i === 0 ? "text-lg text-ink" : "text-ink-soft")}>{h.title}</span>
                  {h.code && <span className="font-mono text-xs text-stone">USCIS status code {h.code}</span>}
                  {h.detail && <span className="max-w-3xl text-sm leading-relaxed text-stone">{h.detail}</span>}
                </motion.li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Notices */}
      {c.notices.length > 0 && (
        <div className="rounded-[2rem] border border-line bg-white p-6 sm:p-10">
          <h3 className="font-serif-display text-3xl text-ink">Notices</h3>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {c.notices.map((n, i) => (
              <li key={i} className="rounded-2xl border border-line bg-mist/50 p-5">
                <p className="font-bold text-ink">{n.title}</p>
                {n.date && <p className="text-sm text-stone">{fmt(n.date, zone)}</p>}
                <dl className="mt-3 grid gap-1 text-sm">
                  {n.fields.slice(0, 8).map((f) => (
                    <div key={f.label} className="flex justify-between gap-4">
                      <dt className="text-stone">{f.label}</dt>
                      <dd className="text-right text-ink">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        </div>
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
                  : (sinceUpdate ?? 0) > 180
                    ? "No update for more than six months can be worth a review."
                    : "An attorney can explain what this status means for you."}
            </p>
            <p className="mt-3 text-stone-dark">A status message is only part of the picture. We can review your notices and the record before you decide what to do.</p>
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

function Meta({ icon: Icon, label, value, sub, mono }: { icon: typeof FileText; label: string; value: string; sub?: string; mono?: boolean }) {
  return (
    <div className="bg-white p-5">
      <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-stone">
        <Icon aria-hidden className="size-4 text-brass-ink" /> {label}
      </dt>
      <dd className={cn("mt-2 text-lg font-bold text-ink", mono && "font-mono tracking-wider")}>{value}</dd>
      {sub && <dd className="mt-0.5 text-sm text-stone">{sub}</dd>}
    </div>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-2xl bg-mist p-5">
      <p className="font-serif-display text-4xl text-ink">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="mt-1 text-sm text-stone">{label}</p>
    </div>
  );
}

// The one-click reader runs on the USCIS site, signed in as the visitor. It
// reads the case data page, or fetches the case by receipt number from the same
// site, opens this tracker and hands the data over by postMessage. Nothing goes
// through a server or into a web address.
function readerCode(origin: string) {
  const js = `(async()=>{const O=${JSON.stringify(origin)};const w=window.open(O+"/case-status-tracker/?from=uscis","_blank");const stop=m=>{if(m)alert(m);if(w)w.close()};let t=(document.body.innerText||"").trim();let ok=false;try{const j=JSON.parse(t.slice(t.indexOf("{"),t.lastIndexOf("}")+1));ok=!!(j.data||j.case_status)}catch(e){}if(!ok){if(location.hostname!=="my.uscis.gov")return stop("Sign in to your USCIS account first. When your account page is open, click RT Case Reader again.");const r=(prompt("Your receipt number, for example IOE0123456789")||"").toUpperCase().replace(/[^A-Z0-9]/g,"");if(!r)return stop();const x=await fetch("/account/case-service/api/cases/"+r,{credentials:"include"});t=await x.text();if(!x.ok)return stop("USCIS did not return this case. Check that you are signed in and that the receipt number belongs to this account.")}let n=0;const h=e=>{if(e.origin===O&&e.data==="rt-case-ack"){clearInterval(i);removeEventListener("message",h)}};addEventListener("message",h);const i=setInterval(()=>{if(++n>60)return clearInterval(i);try{w.postMessage({type:"rt-case-data",data:t},O)}catch(e){}},500)})();`;
  return `javascript:${encodeURIComponent(js)}`;
}

const noSubscription = () => () => {};

function Bookmarklet() {
  const ref = useRef<HTMLAnchorElement>(null);
  const origin = useSyncExternalStore(noSubscription, () => window.location.origin, () => "");
  // React does not render javascript: links, so the address is set directly.
  useEffect(() => {
    if (ref.current && origin) ref.current.setAttribute("href", readerCode(origin));
  }, [origin]);
  return (
    <div className="mt-6 hidden items-center gap-5 rounded-2xl border border-dashed border-brass/40 p-5 md:flex">
      <a
        ref={ref}
        onClick={(e) => {
          e.preventDefault();
          alert("Drag this button to your bookmarks bar. Then, on the USCIS website, signed in, click the bookmark.");
        }}
        className="inline-flex min-h-12 shrink-0 cursor-grab items-center gap-2 rounded-full bg-paper px-5 font-bold text-ink shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)] active:cursor-grabbing"
      >
        <Bookmark aria-hidden className="size-4 text-brass-ink" /> RT Case Reader
      </a>
      <p className="text-sm leading-relaxed text-stone-dark">
        <strong className="text-paper">Skip the copying on a computer.</strong> Drag this button to your bookmarks bar once. After you sign in to USCIS,
        click the bookmark and enter your receipt number. Your case opens here, read only in your browser.
      </p>
    </div>
  );
}

function Disclaimer() {
  return (
    <section aria-labelledby="disclaimer-heading" className="rounded-[2rem] border border-line bg-mist p-6 sm:p-10">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-full bg-ink text-brass-light">
          <ShieldCheck aria-hidden className="size-5" />
        </span>
        <h2 id="disclaimer-heading" className="font-serif-display text-3xl text-ink">Disclaimer</h2>
      </div>
      <div className="mt-6 grid gap-6 text-sm leading-relaxed text-stone md:grid-cols-2">
        <div className="grid gap-4">
          <p>
            <strong className="text-ink">Not a government service.</strong> This tracker is provided by RT Law Services as a convenience. It is not
            affiliated with, endorsed by or operated by U.S. Citizenship and Immigration Services (USCIS), the U.S. Department of Homeland Security
            (DHS) or any other government agency. The official source of your case status is USCIS, at{" "}
            <a href="https://egov.uscis.gov/" target="_blank" rel="noopener noreferrer" className="font-bold text-ink underline underline-offset-4">egov.uscis.gov</a> and in your USCIS account.
          </p>
          <p>
            <strong className="text-ink">Information as USCIS provides it.</strong> Status messages, dates and history come from USCIS, or from data you
            paste in. USCIS may update its records later than events happen, and its messages can be brief, delayed or incomplete. Descriptions of status
            codes come from the published National Information Exchange Model (NIEM) code list and may not reflect how USCIS uses a code in a given case.
            The progress stage and day counts are estimates drawn from those messages and do not predict when USCIS will decide your case.
          </p>
        </div>
        <div className="grid gap-4">
          <p>
            <strong className="text-ink">Not legal advice.</strong> Nothing on this page is legal advice for your situation, and using the tracker does not
            create an attorney-client relationship. Deadlines in USCIS notices are strict, so read every notice you receive and speak with a licensed
            immigration attorney before you act on a status message.
          </p>
          <p>
            <strong className="text-ink">Your privacy.</strong> A receipt number you look up is sent to USCIS through our secure relay to fetch the status,
            and neither we nor the relay keep a copy. Case data you paste, upload or send with RT Case Reader is read only in your browser and is not sent to us or stored on our
            servers. Cases you track are saved only in this browser, and you can remove them at any time.
          </p>
        </div>
      </div>
      <p className="mt-8 inline-flex items-center gap-2 text-xs text-stone">
        <BookOpen aria-hidden className="size-3.5" /> Status code list: NIEM 5.0, BenefitDocumentStatusCategoryCode.{" "}
        <a href="https://niem.github.io/model/5.0/scr/BenefitDocumentStatusCategoryCodeSimpleType/" target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-4">
          View the source
        </a>
      </p>
    </section>
  );
}
