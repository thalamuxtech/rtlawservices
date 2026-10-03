"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Briefcase, Check, FileText, Heart, Loader2, Send, ShieldCheck, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { NO_RELATIONSHIP, SITE } from "@/content/site";
import { countryNames } from "@/lib/countries";
import { store } from "@/lib/store";
import { cn, focusStep } from "@/lib/utils";

type Track = "professional" | "family";
type Answers = Record<string, string | string[] | boolean>;

const STEPS = ["About you", "Your goal", "Your record", "Documents"] as const;
const STORE = "rt-evaluation-draft";
const MAX_FILE = 3 * 1024 * 1024;
const CHUNK = 800_000;

const PRO_CATEGORIES = [
  "EB-2 National Interest Waiver (self-petitioned)",
  "EB-1A extraordinary ability (self-petitioned)",
  "EB-1B outstanding researcher or professor (employer)",
  "O-1A or O-1B extraordinary ability (employer or agent)",
  "EB-1C multinational manager or executive",
  "H-1B or L-1 work visa",
  "Not sure, please recommend based on my record",
];
const FAMILY_GOALS = [
  "Green card for my spouse",
  "Green card for my parent",
  "Green card for my child or sibling",
  "U.S. citizenship for myself",
  "A case that was denied, delayed or needs a waiver",
  "Visas for family living abroad",
  "Something else",
];
const STATUSES = ["F-1", "OPT or STEM OPT", "H-1B", "H-4", "J-1", "O-1", "L-1", "B-1/B-2", "Green card holder", "Not in the U.S.", "Other"];
const FIELDS = [
  "Agricultural sciences", "Biology and biochemistry", "Business and economics", "Chemistry", "Clinical medicine", "Computer science and AI",
  "Engineering", "Environment and ecology", "Finance and fintech", "Geosciences", "Materials science", "Mathematics", "Neuroscience",
  "Pharmacology", "Physics", "Psychology", "Public health", "Social sciences", "Arts, media and entertainment", "Athletics", "Other",
];

const ease = [0.22, 1, 0.36, 1] as const;

export function EvaluationForm() {
  const params = useSearchParams();
  const countries = useMemo(() => countryNames(), []);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [a, setA] = useState<Answers>(() => ({ salutation: "", firstName: "", lastName: "", email: "", phone: "", birthCountry: "", status: "", track: "", categories: [], familyGoals: [] }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const loaded = useRef(false);

  // Restore an unsent draft from this browser, and pre-select a track from ?matter=.
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    let draft: Answers | null = null;
    try {
      draft = JSON.parse(localStorage.getItem(STORE) || "null");
    } catch {}
    const matter = params.get("matter") || "";
    const pro = ["extraordinary-ability", "national-interest-waiver", "h-1b", "l-1", "investors-founders", "employers"].includes(matter);
    const fam = ["family", "citizenship", "spousal-work-authorization", "appeals-waivers", "consular-processing"].includes(matter);
    const next: Answers = { ...(draft ?? {}) };
    if (!next.track && (pro || fam)) next.track = pro ? "professional" : "family";
    if (Object.keys(next).length) setA((cur) => ({ ...cur, ...next }));
  }, [params]);

  useEffect(() => {
    if (state === "sent") return;
    try {
      localStorage.setItem(STORE, JSON.stringify(a));
    } catch {}
  }, [a, state]);

  const set = (k: string, v: string | string[] | boolean) => setA((cur) => ({ ...cur, [k]: v }));
  const str = (k: string) => (typeof a[k] === "string" ? (a[k] as string) : "");
  const list = (k: string) => (Array.isArray(a[k]) ? (a[k] as string[]) : []);
  const toggle = (k: string, v: string) => set(k, list(k).includes(v) ? list(k).filter((x) => x !== v) : [...list(k), v]);
  const track = str("track") as Track | "";

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (str("firstName").trim().length < 1) e.firstName = "Enter your first name.";
      if (str("lastName").trim().length < 1) e.lastName = "Enter your last name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(str("email").trim())) e.email = "Enter a valid email address.";
      if (str("phone").replace(/\D/g, "").length < 7) e.phone = "Enter a phone number, with the country code if outside the U.S.";
      if (!str("birthCountry")) e.birthCountry = "Choose your country of birth.";
      if (!str("status")) e.status = "Choose your current status.";
    }
    if (s === 1) {
      if (!track) e.track = "Choose the kind of help you need.";
      if (track === "professional" && !list("categories").length) e.categories = "Choose at least one category.";
      if (track === "family" && !list("familyGoals").length) e.familyGoals = "Choose at least one goal.";
    }
    if (s === 2 && track === "professional") {
      if (!str("field")) e.field = "Choose your field.";
      if (!str("degree")) e.degree = "Choose your highest degree.";
      if (str("endeavor").trim().length < 20) e.endeavor = "Describe your planned work in a few sentences.";
    }
    if (s === 2 && track === "family") {
      if (str("situation").trim().length < 20) e.situation = "Describe your situation in a few sentences.";
    }
    if (s === 3) {
      if (!a.consentRelationship) e.consentRelationship = "Please confirm you have read this notice.";
      if (!a.consentAccurate) e.consentAccurate = "Please confirm your answers are accurate.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const go = (to: number) => {
    if (to > step && !validate(step)) return;
    setDir(to > step ? 1 : -1);
    setStep(to);
    document.getElementById("evaluation")?.scrollIntoView({ behavior: "smooth", block: "start" });
    focusStep();
  };

  const onFile = (f: File | null) => {
    setFileError("");
    if (!f) return setFile(null);
    if (f.size > MAX_FILE) return setFileError("The file is larger than 3 MB. Please upload a shorter CV or a PDF export.");
    if (!/\.(pdf|docx?|rtf|txt)$/i.test(f.name)) return setFileError("Upload a PDF, Word document, RTF or text file.");
    setFile(f);
  };

  const submit = async () => {
    if (!validate(3)) return;
    if (a.website) {
      setState("sent");
      return;
    }
    setState("sending");
    try {
      const { fs, db: firestore } = await store();
      const ref = fs.doc(fs.collection(firestore, "evaluations"));
      const batch = fs.writeBatch(firestore);
      const answers: Record<string, string | string[]> = {};
      for (const [k, v] of Object.entries(a)) {
        if (["firstName", "lastName", "email", "phone", "birthCountry", "track", "website", "consentRelationship", "consentAccurate", "consentPrivacy"].includes(k)) continue;
        if (typeof v === "string") answers[k] = v.trim().slice(0, 2000);
        else if (Array.isArray(v)) answers[k] = v.slice(0, 20);
        else if (typeof v === "boolean") answers[k] = v ? "Yes" : "No";
      }
      let chunks: string[] = [];
      if (file) {
        const b64 = await toBase64(file);
        for (let i = 0; i < b64.length; i += CHUNK) chunks.push(b64.slice(i, i + CHUNK));
        if (chunks.length > 6) chunks = [];
      }
      batch.set(ref, {
        name: `${str("salutation") ? `${str("salutation")} ` : ""}${str("firstName").trim()} ${str("lastName").trim()}`.slice(0, 200),
        email: str("email").trim().toLowerCase(),
        phone: str("phone").trim(),
        birthCountry: str("birthCountry"),
        track,
        answers,
        file: chunks.length ? { name: file!.name.slice(0, 160), type: file!.type || "application/octet-stream", size: file!.size, chunks: chunks.length } : null,
        consents: { noRelationship: true, accurate: true },
        status: "new",
        createdAt: fs.serverTimestamp(),
      });
      chunks.forEach((data, index) => batch.set(fs.doc(firestore, "evaluations", ref.id, "files", String(index)), { index, data }));
      await batch.commit();
      try {
        localStorage.removeItem(STORE);
      } catch {}
      setState("sent");
      document.getElementById("evaluation")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setState("error");
    }
  };

  if (state === "sent") return <Success name={str("firstName")} />;

  const panel = (
    <motion.div
      key={`${step}-${track}`}
      custom={dir}
      initial={{ opacity: 0, x: dir * 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: dir * -40 }}
      transition={{ duration: 0.38, ease }}
    >
      {step === 0 && (
        <Fieldset title="About you" lede="We use these details to contact you about your evaluation.">
          <Radios label="Title" name="salutation" options={["Mr.", "Ms.", "Mx.", "Dr."]} value={str("salutation")} onChange={(v) => set("salutation", v)} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Text id="firstName" label="First name" value={str("firstName")} onChange={(v) => set("firstName", v)} error={errors.firstName} autoComplete="given-name" required />
            <Text id="lastName" label="Last name" value={str("lastName")} onChange={(v) => set("lastName", v)} error={errors.lastName} autoComplete="family-name" required />
            <Text id="email" type="email" label="Email" value={str("email")} onChange={(v) => set("email", v)} error={errors.email} autoComplete="email" required />
            <Text id="phone" type="tel" label="Phone" value={str("phone")} onChange={(v) => set("phone", v)} error={errors.phone} autoComplete="tel" required hint="Include the country code if outside the U.S." />
            <Select id="birthCountry" label="Country of birth" value={str("birthCountry")} onChange={(v) => set("birthCountry", v)} options={countries} error={errors.birthCountry} required hint="Green card waiting times depend on country of birth." />
            <Select id="status" label="Current immigration status" value={str("status")} onChange={(v) => set("status", v)} options={STATUSES} error={errors.status} required />
          </div>
        </Fieldset>
      )}

      {step === 1 && (
        <Fieldset title="What would you like us to evaluate?" lede="Choose the path that fits best. You can describe anything else in the next step.">
          <div className="grid gap-4 sm:grid-cols-2" role="radiogroup" aria-label="Kind of help">
            {[
              { id: "professional", icon: Briefcase, title: "Professional or employer petition", text: "EB-1, National Interest Waiver, O-1, H-1B, L-1 and related routes." },
              { id: "family", icon: Heart, title: "Family, citizenship or a problem case", text: "Green cards for relatives, naturalization, denials, delays and waivers." },
            ].map(({ id, icon: Icon, title, text }) => (
              <label
                key={id}
                className={cn(
                  "relative flex cursor-pointer flex-col gap-3 rounded-2xl border bg-white p-6 transition-all duration-300 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink",
                  track === id ? "border-ink shadow-[inset_0_0_0_1px_var(--color-ink)]" : "border-line hover:border-ink/40",
                )}
              >
                <input type="radio" name="track" value={id} checked={track === id} onChange={() => set("track", id)} className="sr-only" />
                <Icon aria-hidden className="size-7 text-brass-ink" />
                <span className="font-serif-display text-2xl text-ink">{title}</span>
                <span className="text-stone">{text}</span>
                {track === id && (
                  <motion.span layoutId="track-check" className="absolute right-4 top-4 grid size-7 place-items-center rounded-full bg-ink text-paper">
                    <Check aria-hidden className="size-4" />
                  </motion.span>
                )}
              </label>
            ))}
          </div>
          {errors.track && <Err id="track-err">{errors.track}</Err>}
          <AnimatePresence initial={false}>
            {track === "professional" && (
              <Reveal key="pro">
                <Checks label="Categories you are interested in" options={PRO_CATEGORIES} values={list("categories")} onToggle={(v) => toggle("categories", v)} error={errors.categories} />
                <Radios
                  label="Have you filed an I-140 petition before?"
                  name="priorI140"
                  options={["No", "Yes, approved", "Yes, denied", "Yes, pending"]}
                  value={str("priorI140")}
                  onChange={(v) => set("priorI140", v)}
                />
              </Reveal>
            )}
            {track === "family" && (
              <Reveal key="fam">
                <Checks label="What would you like to achieve?" options={FAMILY_GOALS} values={list("familyGoals")} onToggle={(v) => toggle("familyGoals", v)} error={errors.familyGoals} />
              </Reveal>
            )}
          </AnimatePresence>
        </Fieldset>
      )}

      {step === 2 && track === "professional" && (
        <Fieldset title="Your record" lede="Approximate numbers are fine. The attorney will ask for evidence later.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Select id="field" label="Field" value={str("field")} onChange={(v) => set("field", v)} options={FIELDS} error={errors.field} required />
            <Select id="degree" label="Highest degree" value={str("degree")} onChange={(v) => set("degree", v)} options={["PhD", "MD or MBBS", "JD", "Master's", "Bachelor's", "Other", "In progress"]} error={errors.degree} required />
            <Text id="major" label="Major or specialty" value={str("major")} onChange={(v) => set("major", v)} placeholder="For example, electrical engineering" />
            <Text id="university" label="University and year" value={str("university")} onChange={(v) => set("university", v)} placeholder="For example, Johns Hopkins, 2022" />
            <Text id="position" label="Current position and employer" value={str("position")} onChange={(v) => set("position", v)} className="sm:col-span-2" />
            <Text id="scholar" type="url" label="Google Scholar or other profile link" value={str("scholar")} onChange={(v) => set("scholar", v)} className="sm:col-span-2" placeholder="https://scholar.google.com/..." />
            <Text id="citations" type="number" label="Number of citations" value={str("citations")} onChange={(v) => set("citations", v)} />
            <Select id="publications" label="Number of publications" value={str("publications")} onChange={(v) => set("publications", v)} options={["0", "1 to 4", "5 to 9", "10 to 15", "More than 15"]} />
            <Select id="reviews" label="Papers you have peer reviewed" value={str("reviews")} onChange={(v) => set("reviews", v)} options={["0", "1 to 4", "5 to 9", "10 or more"]} />
            <Text id="lastArticle" label="Year of most recent publication" value={str("lastArticle")} onChange={(v) => set("lastArticle", v)} placeholder="YYYY" />
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <Radios label="Patents granted or pending?" name="patents" options={["Yes", "No"]} value={str("patents")} onChange={(v) => set("patents", v)} />
            <Radios label="Funding or grants received?" name="funding" options={["Yes", "No"]} value={str("funding")} onChange={(v) => set("funding", v)} />
            <Radios label="Media coverage of your work?" name="media" options={["Yes", "No"]} value={str("media")} onChange={(v) => set("media", v)} />
          </div>
          <Area id="awards" label="Awards, memberships and judging roles (optional)" value={str("awards")} onChange={(v) => set("awards", v)} rows={3} />
          <Area id="endeavor" label="What do you plan to do in the United States?" value={str("endeavor")} onChange={(v) => set("endeavor", v)} error={errors.endeavor} rows={4} required hint="A few sentences on the work you will continue and why it matters." />
        </Fieldset>
      )}

      {step === 2 && track === "family" && (
        <Fieldset title="Your situation" lede="Tell us the essentials. Please leave out file numbers and passport numbers.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Select id="sponsorStatus" label="The sponsoring family member is" value={str("sponsorStatus")} onChange={(v) => set("sponsorStatus", v)} options={["A U.S. citizen", "A green card holder", "Not sure", "Not applicable"]} />
            <Select id="relativeLocation" label="The person immigrating lives" value={str("relativeLocation")} onChange={(v) => set("relativeLocation", v)} options={["Inside the United States", "Outside the United States", "Not applicable"]} />
          </div>
          <Checks
            label="Does any of this apply? (optional)"
            options={["A past visa overstay", "A previous denial", "An arrest or court case", "A past removal or deportation", "None of these"]}
            values={list("history")}
            onToggle={(v) => toggle("history", v)}
          />
          <Area id="situation" label="Describe your situation" value={str("situation")} onChange={(v) => set("situation", v)} error={errors.situation} rows={5} required />
        </Fieldset>
      )}

      {step === 3 && (
        <Fieldset title="Documents and consent" lede={track === "professional" ? "A CV helps the attorney assess your record. It is optional, but recommended." : "Add a document if it helps explain your case. This is optional."}>
          <FileDrop file={file} error={fileError} onFile={onFile} />
          <Area id="notes" label="Anything else we should know? (optional)" value={str("notes")} onChange={(v) => set("notes", v)} rows={3} />
          <Text id="source" label="How did you hear about us? (optional)" value={str("source")} onChange={(v) => set("source", v)} />
          <div className="hidden" aria-hidden>
            <label htmlFor="website">Website</label>
            <input id="website" tabIndex={-1} autoComplete="off" value={str("website")} onChange={(e) => set("website", e.target.value)} />
          </div>
          <div className="grid gap-4 rounded-2xl bg-mist p-5">
            <Consent id="consentRelationship" checked={!!a.consentRelationship} onChange={(v) => set("consentRelationship", v)} error={errors.consentRelationship}>
              I understand: {NO_RELATIONSHIP}
            </Consent>
            <Consent id="consentAccurate" checked={!!a.consentAccurate} onChange={(v) => set("consentAccurate", v)} error={errors.consentAccurate}>
              The information I have given is accurate to the best of my knowledge, and I agree to the{" "}
              <a href="/legal/privacy/" target="_blank" className="font-bold text-brass-ink underline underline-offset-4">privacy policy</a>.
            </Consent>
          </div>
          {state === "error" && <Err id="submit-err">The request could not be sent. Check your connection and try again, or call us.</Err>}
        </Fieldset>
      )}
    </motion.div>
  );

  return (
    <div id="evaluation" className="scroll-mt-28 grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="min-w-0 lg:sticky lg:top-32 lg:h-fit">
        <ol className="flex gap-2 overflow-x-auto pb-2 lg:grid lg:gap-1 lg:overflow-visible" aria-label="Evaluation steps">
          {STEPS.map((s, i) => (
            <li key={s} className="shrink-0">
              <button
                type="button"
                onClick={() => (i < step ? go(i) : undefined)}
                disabled={i > step}
                aria-current={i === step ? "step" : undefined}
                className={cn(
                  "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition-colors",
                  i === step ? "bg-ink text-paper" : i < step ? "text-ink hover:bg-mist" : "cursor-default text-stone",
                )}
              >
                <span className={cn("grid size-7 shrink-0 place-items-center rounded-full border text-xs", i < step ? "border-brass bg-brass text-ink" : i === step ? "border-brass-light text-brass-light" : "border-line")}>
                  {i < step ? <Check aria-hidden className="size-3.5" /> : i + 1}
                </span>
                {s}
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-6 hidden h-1.5 overflow-hidden rounded-full bg-line lg:block" aria-hidden>
          <motion.div className="h-full bg-brass" animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} transition={{ duration: 0.5, ease }} />
        </div>
        <p className="mt-6 hidden gap-3 text-sm text-stone lg:flex">
          <ShieldCheck aria-hidden className="size-5 shrink-0 text-brass-ink" />
          Sent securely. Only authorized firm staff can read what you send. Your draft is saved in this browser until you submit.
        </p>
      </aside>

      <div className="min-w-0 rounded-3xl border border-line bg-white p-6 shadow-[0_40px_80px_-50px_rgba(20,24,31,0.45)] sm:p-10">
        <div className="min-h-[460px] overflow-hidden" data-step-root>
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            {panel}
          </AnimatePresence>
        </div>
        <div className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-6">
          {step > 0 ? (
            <button type="button" onClick={() => go(step - 1)} className="inline-flex min-h-11 items-center gap-2 font-bold text-stone hover:text-ink">
              <ArrowLeft aria-hidden className="size-4" /> Back
            </button>
          ) : (
            <span className="text-sm text-stone">Takes about 5 minutes</span>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={() => go(step + 1)}>Continue</Button>
          ) : (
            <Button onClick={submit} disabled={state === "sending"}>
              {state === "sending" ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Send aria-hidden className="size-4" />}
              {state === "sending" ? "Sending" : "Submit for free evaluation"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function toBase64(f: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(f);
  });
}

function Success({ name }: { name: string }) {
  const steps = [
    { t: "Received", d: "Your answers are with our intake team now." },
    { t: "Attorney review", d: "An attorney reviews your record against the legal standard." },
    { t: "Your evaluation", d: `We email our assessment and the routes that fit, usually within ${SITE.evaluationDays === 1 ? "one business day" : `${SITE.evaluationDays} business days`}.` },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="mx-auto max-w-2xl text-center" role="status">
      <motion.span
        initial={{ scale: 0, rotate: -40 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 16, delay: 0.1 }}
        className="mx-auto grid size-24 place-items-center rounded-full bg-brass text-ink shadow-[0_20px_60px_-10px_rgba(177,151,107,0.8)]"
      >
        <Check aria-hidden className="size-11" />
      </motion.span>
      <h2 className="font-serif-display mt-8 text-4xl text-ink sm:text-5xl">Thank you{name ? `, ${name}` : ""}</h2>
      <p className="mt-4 text-lg text-stone">Your free evaluation request is in.</p>
      <ol className="mt-12 grid gap-6 text-left sm:grid-cols-3">
        {steps.map((s, i) => (
          <motion.li key={s.t} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.15, duration: 0.5, ease }} className="border-t-2 border-brass pt-4">
            <span className="text-sm font-bold text-brass-ink">Step {i + 1}</span>
            <p className="mt-1 font-bold text-ink">{s.t}</p>
            <p className="mt-1 text-sm text-stone">{s.d}</p>
          </motion.li>
        ))}
      </ol>
    </motion.div>
  );
}

function Reveal({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease }} className="overflow-hidden">
      <div className="grid gap-8 pt-8">{children}</div>
    </motion.div>
  );
}

function Fieldset({ title, lede, children }: { title: string; lede?: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-8">
      <legend className="font-serif-display float-left w-full text-3xl text-ink sm:text-4xl">
        {title}
        {lede && <span className="mt-3 block font-sans text-base text-stone">{lede}</span>}
      </legend>
      {children}
    </fieldset>
  );
}

const inputCls = (err?: string) =>
  cn("mt-2 min-h-12 w-full rounded-xl border bg-white px-4 text-base text-ink outline-none transition-[border-color,box-shadow] duration-200 focus:border-ink focus:shadow-[0_0_0_4px_rgba(177,151,107,0.18)]", err ? "border-danger" : "border-line");

function Err({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm font-bold text-danger">
      {children}
    </p>
  );
}

function Text({
  id, label, value, onChange, error, hint, type = "text", autoComplete, required, className, placeholder,
}: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string; type?: string; autoComplete?: string; required?: boolean; className?: string; placeholder?: string }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-bold text-ink">
        {label} {required && <span aria-hidden className="text-danger">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={300}
        aria-invalid={!!error}
        aria-describedby={[error && `${id}-err`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls(error)}
      />
      {hint && <p id={`${id}-hint`} className="mt-1.5 text-xs text-stone">{hint}</p>}
      {error && <Err id={`${id}-err`}>{error}</Err>}
    </div>
  );
}

function Area({ id, label, value, onChange, error, hint, rows = 4, required }: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string; rows?: number; required?: boolean }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold text-ink">
        {label} {required && <span aria-hidden className="text-danger">*</span>}
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        maxLength={2000}
        aria-invalid={!!error}
        aria-describedby={[error && `${id}-err`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputCls(error), "py-3")}
      />
      <div className="mt-1.5 flex justify-between gap-4 text-xs text-stone">
        <span id={hint ? `${id}-hint` : undefined}>{hint}</span>
        <span>{value.length} / 2000</span>
      </div>
      {error && <Err id={`${id}-err`}>{error}</Err>}
    </div>
  );
}

function Select({ id, label, value, onChange, options, error, hint, required }: { id: string; label: string; value: string; onChange: (v: string) => void; options: string[]; error?: string; hint?: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold text-ink">
        {label} {required && <span aria-hidden className="text-danger">*</span>}
      </label>
      <select
        id={id}
        value={value}
        aria-invalid={!!error}
        aria-describedby={[error && `${id}-err`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls(error)}
      >
        <option value="">Choose</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      {hint && <p id={`${id}-hint`} className="mt-1.5 text-xs text-stone">{hint}</p>}
      {error && <Err id={`${id}-err`}>{error}</Err>}
    </div>
  );
}

function Radios({ label, name, options, value, onChange }: { label: string; name: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="text-sm font-bold text-ink">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o}
            className={cn(
              "inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm font-bold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink",
              value === o ? "border-ink bg-ink text-paper" : "border-line bg-white text-stone hover:border-ink/40 hover:text-ink",
            )}
          >
            <input type="radio" name={name} value={o} checked={value === o} onChange={() => onChange(o)} className="sr-only" />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Checks({ label, options, values, onToggle, error }: { label: string; options: string[]; values: string[]; onToggle: (v: string) => void; error?: string }) {
  return (
    <fieldset>
      <legend className="text-sm font-bold text-ink">{label}</legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((o) => {
          const on = values.includes(o);
          return (
            <label
              key={o}
              className={cn(
                "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink",
                on ? "border-ink bg-mist" : "border-line bg-white hover:border-ink/40",
              )}
            >
              <input type="checkbox" checked={on} onChange={() => onToggle(o)} className="sr-only" />
              <span className={cn("grid size-5 shrink-0 place-items-center rounded-md border transition-colors", on ? "border-ink bg-ink text-paper" : "border-stone/50")}>
                {on && <Check aria-hidden className="size-3.5" />}
              </span>
              <span className="text-[0.95rem] text-ink">{o}</span>
            </label>
          );
        })}
      </div>
      {error && <Err id={`${label}-err`}>{error}</Err>}
    </fieldset>
  );
}

function Consent({ id, checked, onChange, error, children }: { id: string; checked: boolean; onChange: (v: boolean) => void; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex gap-3">
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-5 shrink-0 accent-ink" aria-invalid={!!error} />
        <label htmlFor={id} className="text-sm leading-relaxed text-ink-soft">
          {children}
        </label>
      </div>
      {error && (
        <p role="alert" className="ml-8 mt-1 text-sm font-bold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function FileDrop({ file, error, onFile }: { file: File | null; error: string; onFile: (f: File | null) => void }) {
  const [over, setOver] = useState(false);
  return (
    <div>
      <p className="text-sm font-bold text-ink">CV or supporting document (optional)</p>
      {file ? (
        <div className="mt-2 flex items-center gap-4 rounded-2xl border border-ink bg-mist p-4">
          <FileText aria-hidden className="size-7 shrink-0 text-brass-ink" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-bold text-ink">{file.name}</span>
            <span className="text-sm text-stone">{(file.size / 1024).toFixed(0)} KB</span>
          </span>
          <button type="button" onClick={() => onFile(null)} aria-label="Remove file" className="grid size-11 place-items-center rounded-full hover:bg-white">
            <X aria-hidden className="size-5" />
          </button>
        </div>
      ) : (
        <label
          htmlFor="cv"
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            onFile(e.dataTransfer.files?.[0] ?? null);
          }}
          className={cn(
            "mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink",
            over ? "border-brass bg-brass-pale/50" : "border-line bg-paper hover:border-ink/40",
          )}
        >
          <motion.span animate={over ? { y: -4, scale: 1.08 } : { y: 0, scale: 1 }} className="grid size-12 place-items-center rounded-full bg-white text-brass-ink shadow">
            <Upload aria-hidden className="size-5" />
          </motion.span>
          <span className="font-bold text-ink">Drop your file here, or choose a file</span>
          <span className="text-sm text-stone">PDF, Word, RTF or text, up to 3 MB</span>
          <input id="cv" type="file" accept=".pdf,.doc,.docx,.rtf,.txt" className="sr-only" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
        </label>
      )}
      {error && <Err id="cv-err">{error}</Err>}
    </div>
  );
}
