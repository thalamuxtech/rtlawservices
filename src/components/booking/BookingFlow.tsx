"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { collection, doc, getDocs, query, serverTimestamp, Timestamp, where, writeBatch } from "firebase/firestore";
import { ArrowLeft, CalendarCheck, CalendarPlus, Check, Loader2, Phone, Video, Building2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { ATTORNEYS } from "@/content/proof";
import { NO_RELATIONSHIP, SITE } from "@/content/site";
import { db } from "@/lib/firebase";
import {
  MATTERS, MODES, attorneyFor, bookableDays, durationFor, fetchUsHolidays, fmtDayLong, fmtTime, icsFile,
  slotId, slotsFor, tzLabel, visitorTz, FIRM_TZ, type Mode,
} from "@/lib/booking";
import { cn } from "@/lib/utils";

const noopSubscribe = () => () => {};
const STEPS = ["Matter", "Format", "Time", "Details", "Review"] as const;
const MODE_ICONS = { video: Video, phone: Phone, office: Building2 };

type Details = {
  name: string; email: string; phone: string; country: string; language: string; otherParties: string; notes: string; source: string;
  consentNoRelationship: boolean; consentPrivacy: boolean; website: string;
};

const EMPTY: Details = {
  name: "", email: "", phone: "", country: "United States", language: "English", otherParties: "", notes: "", source: "",
  consentNoRelationship: false, consentPrivacy: false, website: "",
};

export function BookingFlow() {
  const params = useSearchParams();
  const initialMatter = params.get("matter");
  const preferredAttorney = params.get("attorney");
  const [step, setStep] = useState(initialMatter && MATTERS.some((m) => m.id === initialMatter) ? 1 : 0);
  const [matter, setMatter] = useState<string>(initialMatter && MATTERS.some((m) => m.id === initialMatter) ? initialMatter : "");
  const [mode, setMode] = useState<Mode | "">("");
  const [day, setDay] = useState("");
  const [slot, setSlot] = useState<Date | null>(null);
  const [details, setDetails] = useState<Details>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Details, string>>>({});
  const [holidays, setHolidays] = useState<Set<string>>(new Set());
  const [taken, setTaken] = useState<Set<number>>(new Set());
  const [loadedKey, setLoadedKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);
  const tz = useSyncExternalStore(noopSubscribe, visitorTz, () => FIRM_TZ);

  const attorney = attorneyFor(matter || "general", preferredAttorney);
  const attorneyName = ATTORNEYS.find((a) => a.slug === attorney)?.name;
  const duration = durationFor(matter);
  const matterInfo = MATTERS.find((m) => m.id === matter);

  useEffect(() => {
    const y = new Date().getFullYear();
    fetchUsHolidays([y, y + 1]).then(setHolidays);
  }, []);

  const days = useMemo(() => bookableDays(holidays), [holidays]);

  const slotKey = `${attorney}|${day}`;
  const loadingSlots = !!day && loadedKey !== slotKey;

  useEffect(() => {
    if (!day) return;
    let live = true;
    // Never leave the calendar waiting: after 6 seconds show every time. The
    // create-only slot lock in Firestore still prevents double booking.
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 6000));
    Promise.race([getDocs(query(collection(db(), "slots"), where("attorney", "==", attorney), where("day", "==", day))), timeout])
      .then((snap) => {
        if (live) setTaken(new Set(snap.docs.map((d) => (d.data().start as Timestamp).toMillis())));
      })
      .catch(() => {
        if (live) setTaken(new Set());
      })
      .finally(() => {
        if (live) setLoadedKey(`${attorney}|${day}`);
      });
    return () => {
      live = false;
    };
  }, [day, attorney]);

  const times = day ? slotsFor(day, duration) : [];

  const validate = () => {
    const e: Partial<Record<keyof Details, string>> = {};
    if (details.name.trim().length < 2) e.name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(details.email.trim())) e.email = "Enter a valid email address.";
    if (details.phone.replace(/\D/g, "").length < 7) e.phone = "Enter a phone number, including the country code if outside the U.S.";
    if (!details.country.trim()) e.country = "Enter your country of residence.";
    if (!details.consentNoRelationship) e.consentNoRelationship = "Please confirm you have read this notice.";
    if (!details.consentPrivacy) e.consentPrivacy = "Please agree to the privacy policy.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const canNext = [!!matter, !!mode, !!slot, true, true][step];

  const next = () => {
    if (step === 3 && !validate()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    if (!slot || !mode) return;
    if (details.website) {
      setDone(true); // honeypot: silently accept bots
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const firestore = db();
      const batch = writeBatch(firestore);
      const slotRef = doc(firestore, "slots", slotId(attorney, slot));
      const bookingRef = doc(collection(firestore, "bookings"));
      batch.set(slotRef, { attorney, day, start: Timestamp.fromDate(slot), createdAt: serverTimestamp() });
      batch.set(bookingRef, {
        matter,
        matterLabel: matterInfo?.label ?? matter,
        mode,
        attorney,
        start: Timestamp.fromDate(slot),
        day,
        durationMin: duration,
        visitorTz: tz,
        name: details.name.trim(),
        email: details.email.trim().toLowerCase(),
        phone: details.phone.trim(),
        country: details.country.trim(),
        language: details.language.trim(),
        otherParties: details.otherParties.trim(),
        notes: details.notes.trim(),
        source: details.source.trim(),
        consents: { noRelationship: true, privacy: true },
        slotId: slotRef.id,
        status: "new",
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSubmitError("That time was just taken or the connection failed. Please choose another time, or call us.");
      setTaken((t) => new Set(t).add(slot.getTime()));
      setSlot(null);
      setStep(2);
    } finally {
      setSubmitting(false);
    }
  };

  if (done && slot) {
    const ics = icsFile({
      start: slot,
      minutes: duration,
      title: `Consultation with ${SITE.name}`,
      description: `${matterInfo?.label ?? ""} consultation (${mode}). Questions: ${SITE.phone}`,
    });
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl text-center">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
          className="mx-auto grid size-20 place-items-center rounded-full bg-brass text-ink"
        >
          <Check aria-hidden className="size-9" />
        </motion.span>
        <h2 className="font-serif-display mt-8 text-4xl text-ink sm:text-5xl">Your request is in</h2>
        <p className="mt-5 text-lg leading-relaxed text-stone">
          {fmtDayLong(day)} at {fmtTime(slot, tz)} ({tzLabel(tz, slot)}), {MODES.find((m) => m.id === mode)?.label.toLowerCase()} consultation,{" "}
          {duration} minutes. Our intake team reviews every request and confirms by email within one business day, after a conflict check.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <a
            href={`data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`}
            download="rt-law-consultation.ics"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/25 px-6 font-bold text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            <CalendarPlus aria-hidden className="size-4" /> Add to calendar
          </a>
          <a href="/start-here/" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brass px-6 font-bold text-ink hover:bg-brass-light">
            Read the Start Here guide
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0">
        <ol className="flex flex-wrap gap-x-6 gap-y-3" aria-label="Booking steps">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2 text-sm" aria-current={i === step ? "step" : undefined}>
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full border text-xs font-bold transition-colors duration-300",
                  i < step ? "border-brass bg-brass text-ink" : i === step ? "border-ink bg-ink text-paper" : "border-line text-stone",
                )}
              >
                {i < step ? <Check aria-hidden className="size-3.5" /> : i + 1}
              </span>
              <span className={cn("font-bold", i === step ? "text-ink" : "text-stone")}>{s}</span>
            </li>
          ))}
        </ol>

        <div className="mt-10 min-h-[420px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 0 && (
                <fieldset>
                  <legend className="font-serif-display text-3xl text-ink sm:text-4xl">What would you like to discuss?</legend>
                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {MATTERS.map((m) => (
                      <label
                        key={m.id}
                        className={cn(
                          "flex min-h-16 items-center justify-between gap-4 rounded-2xl border bg-white p-4 transition-colors duration-300 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink",
                          matter === m.id ? "border-ink shadow-[inset_0_0_0_1px_var(--color-ink)]" : "border-line hover:border-ink/40",
                        )}
                      >
                        <input type="radio" name="matter" value={m.id} checked={matter === m.id} onChange={() => setMatter(m.id)} className="sr-only" />
                        <span>
                          <span className="block font-bold text-ink">{m.label}</span>
                          <span className="block text-xs font-bold text-stone">{m.codes}</span>
                        </span>
                        <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border", matter === m.id ? "border-ink bg-ink text-paper" : "border-line")}>
                          {matter === m.id && <Check aria-hidden className="size-3.5" />}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              {step === 1 && (
                <fieldset>
                  <legend className="font-serif-display text-3xl text-ink sm:text-4xl">How would you like to meet?</legend>
                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {MODES.map((m) => {
                      const Icon = MODE_ICONS[m.id];
                      return (
                        <label
                          key={m.id}
                          className={cn(
                            "flex flex-col gap-4 rounded-2xl border bg-white p-6 transition-colors duration-300 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink",
                            mode === m.id ? "border-ink shadow-[inset_0_0_0_1px_var(--color-ink)]" : "border-line hover:border-ink/40",
                          )}
                        >
                          <input type="radio" name="mode" value={m.id} checked={mode === m.id} onChange={() => setMode(m.id)} className="sr-only" />
                          <Icon aria-hidden className="size-7 text-brass-ink" />
                          <span className="font-bold text-ink">{m.label}</span>
                          <span className="text-sm text-stone">{m.detail}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="mt-6 text-sm text-stone">
                    {matterInfo?.label}: {duration}-minute consultation.
                  </p>
                </fieldset>
              )}

              {step === 2 && (
                <div>
                  <h2 className="font-serif-display text-3xl text-ink sm:text-4xl">Choose a time</h2>
                  <p className="mt-3 text-stone">
                    Times shown in your time zone: <strong className="text-ink">{tzLabel(tz)}</strong>
                    {tz !== FIRM_TZ && <> (our office uses Eastern Time)</>}.
                  </p>
                  {submitError && <p role="alert" className="mt-4 rounded-xl bg-danger/10 p-4 text-sm font-bold text-danger">{submitError}</p>}
                  <div className="mt-8 -mx-1 flex gap-2 overflow-x-auto px-1 pb-3" role="listbox" aria-label="Available days">
                    {days.map((d) => {
                      const [y, m, dd] = d.split("-").map(Number);
                      const dt = new Date(Date.UTC(y, m - 1, dd, 12));
                      return (
                        <button
                          key={d}
                          type="button"
                          role="option"
                          aria-selected={day === d}
                          onClick={() => {
                            setDay(d);
                            setSlot(null);
                          }}
                          className={cn(
                            "flex min-w-[76px] shrink-0 flex-col items-center rounded-2xl border px-3 py-3 transition-colors duration-300",
                            day === d ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink hover:border-ink/40",
                          )}
                        >
                          <span className="text-xs font-bold opacity-70">
                            {dt.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })}
                          </span>
                          <span className="font-serif-display text-2xl">{dd}</span>
                          <span className="text-xs opacity-70">{dt.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })}</span>
                        </button>
                      );
                    })}
                  </div>
                  {!day && <p className="mt-6 text-stone">Select a day to see available times.</p>}
                  {day && (
                    <div className="mt-6">
                      <p className="font-bold text-ink">{fmtDayLong(day)}</p>
                      {loadingSlots ? (
                        <p className="mt-4 flex items-center gap-2 text-stone"><Loader2 aria-hidden className="size-4 animate-spin" /> Checking availability</p>
                      ) : (
                        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
                          {times.map((t) => {
                            const isTaken = taken.has(t.getTime());
                            const selected = slot?.getTime() === t.getTime();
                            return (
                              <button
                                key={t.toISOString()}
                                type="button"
                                disabled={isTaken}
                                aria-pressed={selected}
                                onClick={() => setSlot(t)}
                                className={cn(
                                  "min-h-11 rounded-xl border text-sm font-bold transition-colors duration-200",
                                  isTaken
                                    ? "cursor-not-allowed border-line bg-mist text-stone line-through"
                                    : selected
                                      ? "border-brass bg-brass text-ink"
                                      : "border-line bg-white text-ink hover:border-ink",
                                )}
                              >
                                {fmtTime(t, tz)}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <form
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                    next();
                  }}
                >
                  <h2 className="font-serif-display text-3xl text-ink sm:text-4xl">Your details</h2>
                  <p className="mt-3 text-stone">Only what we need to schedule and run a conflict check. Please do not include passport or file numbers.</p>
                  <div className="mt-8 grid gap-5 sm:grid-cols-2">
                    <Field id="name" label="Full name" autoComplete="name" value={details.name} error={errors.name} onChange={(v) => setDetails({ ...details, name: v })} required />
                    <Field id="email" label="Email" type="email" autoComplete="email" value={details.email} error={errors.email} onChange={(v) => setDetails({ ...details, email: v })} required />
                    <Field id="phone" label="Phone" type="tel" autoComplete="tel" value={details.phone} error={errors.phone} onChange={(v) => setDetails({ ...details, phone: v })} required hint="Include the country code if outside the U.S." />
                    <Field id="country" label="Country of residence" autoComplete="country-name" value={details.country} error={errors.country} onChange={(v) => setDetails({ ...details, country: v })} required />
                    <Field id="language" label="Preferred language" value={details.language} onChange={(v) => setDetails({ ...details, language: v })} />
                    <Field id="source" label="How did you hear about us? (optional)" value={details.source} onChange={(v) => setDetails({ ...details, source: v })} />
                    <Field id="otherParties" className="sm:col-span-2" label="Names of other people involved (optional)" hint="For example a spouse, employer or sponsor. We use this only for a conflict of interest check." value={details.otherParties} onChange={(v) => setDetails({ ...details, otherParties: v })} />
                    <div className="sm:col-span-2">
                      <label htmlFor="notes" className="block text-sm font-bold text-ink">Anything we should know before the call? (optional)</label>
                      <textarea id="notes" rows={4} maxLength={1200} value={details.notes} onChange={(e) => setDetails({ ...details, notes: e.target.value })} className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink outline-none transition-colors focus:border-ink" />
                    </div>
                    <div className="hidden" aria-hidden>
                      <label htmlFor="website">Website</label>
                      <input id="website" tabIndex={-1} autoComplete="off" value={details.website} onChange={(e) => setDetails({ ...details, website: e.target.value })} />
                    </div>
                  </div>
                  <div className="mt-8 grid gap-4 rounded-2xl bg-mist p-5">
                    <Check2 id="c1" checked={details.consentNoRelationship} error={errors.consentNoRelationship} onChange={(v) => setDetails({ ...details, consentNoRelationship: v })}>
                      I understand: {NO_RELATIONSHIP}
                    </Check2>
                    <Check2 id="c2" checked={details.consentPrivacy} error={errors.consentPrivacy} onChange={(v) => setDetails({ ...details, consentPrivacy: v })}>
                      I agree to the <a href="/legal/privacy/" target="_blank" className="font-bold text-brass-ink underline underline-offset-4">privacy policy</a>.
                    </Check2>
                  </div>
                  <button type="submit" className="sr-only">Continue</button>
                </form>
              )}

              {step === 4 && slot && (
                <div>
                  <h2 className="font-serif-display text-3xl text-ink sm:text-4xl">Review and confirm</h2>
                  <dl className="mt-8 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
                    {[
                      ["Matter", matterInfo?.label],
                      ["Format", `${MODES.find((m) => m.id === mode)?.label}, ${duration} minutes`],
                      ["When", `${fmtDayLong(day)} at ${fmtTime(slot, tz)} (${tzLabel(tz, slot)})`],
                      ...(tz !== FIRM_TZ ? [["Office time", `${fmtTime(slot, FIRM_TZ)} Eastern Time`]] : []),
                      ["Attorney", attorneyName ?? "Assigned by the firm"],
                      ["Name", details.name],
                      ["Email", details.email],
                      ["Phone", details.phone],
                    ].map(([k, v]) => (
                      <div key={k} className="grid gap-1 p-4 sm:grid-cols-[160px_1fr]">
                        <dt className="text-sm font-bold text-stone">{k}</dt>
                        <dd className="text-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  {submitError && <p role="alert" className="mt-4 text-sm font-bold text-danger">{submitError}</p>}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-6">
          {step > 0 ? (
            <button type="button" onClick={back} className="inline-flex min-h-11 items-center gap-2 font-bold text-stone hover:text-ink">
              <ArrowLeft aria-hidden className="size-4" /> Back
            </button>
          ) : <span />}
          {step < STEPS.length - 1 ? (
            <Button onClick={next} disabled={!canNext}>
              Continue
            </Button>
          ) : (
            <Button onClick={submit} disabled={submitting}>
              {submitting ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <CalendarCheck aria-hidden className="size-4" />}
              {submitting ? "Sending" : "Request this time"}
            </Button>
          )}
        </div>
      </div>

      <aside className="h-fit rounded-3xl bg-ink p-7 text-paper lg:sticky lg:top-32">
        <p className="eyebrow text-brass-light">Your consultation</p>
        <dl className="mt-6 grid gap-4 text-sm">
          <div><dt className="text-stone-dark">Matter</dt><dd className="mt-1 font-bold">{matterInfo?.label ?? "Not selected"}</dd></div>
          <div><dt className="text-stone-dark">Format</dt><dd className="mt-1 font-bold">{mode ? `${MODES.find((m) => m.id === mode)?.label}, ${duration} min` : "Not selected"}</dd></div>
          <div><dt className="text-stone-dark">Time</dt><dd className="mt-1 font-bold">{slot ? `${fmtDayLong(day)}, ${fmtTime(slot, tz)}` : "Not selected"}</dd></div>
        </dl>
        <div className="mt-8 flex gap-3 border-t border-line-dark pt-6 text-sm text-stone-dark">
          <ShieldCheck aria-hidden className="size-5 shrink-0 text-brass" />
          Confidential. Only firm staff can read what you send.
        </div>
        <a href={SITE.phoneHref} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-brass-light hover:text-paper">
          <Phone aria-hidden className="size-4" /> Prefer to call? {SITE.phone}
        </a>
      </aside>
    </div>
  );
}

function Field({
  id, label, value, onChange, error, hint, type = "text", autoComplete, required, className,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string;
  type?: string; autoComplete?: string; required?: boolean; className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-bold text-ink">
        {label} {required && <span aria-hidden className="text-danger">*</span>}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        required={required}
        value={value}
        maxLength={200}
        aria-invalid={!!error}
        aria-describedby={[error && `${id}-err`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "mt-2 min-h-12 w-full rounded-xl border bg-white px-4 text-base text-ink outline-none transition-colors focus:border-ink",
          error ? "border-danger" : "border-line",
        )}
      />
      {hint && <p id={`${id}-hint`} className="mt-1.5 text-xs text-stone">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm font-bold text-danger">{error}</p>}
    </div>
  );
}

function Check2({ id, checked, onChange, error, children }: { id: string; checked: boolean; onChange: (v: boolean) => void; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex gap-3">
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-5 shrink-0 accent-ink" aria-invalid={!!error} />
        <label htmlFor={id} className="text-sm leading-relaxed text-ink-soft">{children}</label>
      </div>
      {error && <p role="alert" className="ml-8 mt-1 text-sm font-bold text-danger">{error}</p>}
    </div>
  );
}
