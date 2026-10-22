"use client";

// Full-screen composer for branded client emails: the form on the left, a
// live preview of the exact email on the right, test sends to any address,
// and Cc and Bcc. The preview and the sent email come from the same renderer
// (src/lib/email-template.ts).

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bold, FlaskConical, Link2, List, ListOrdered, Monitor, Send, Smartphone, UserRound, X } from "lucide-react";
import { useContent } from "@/content/LiveContent";
import { adminPost, api, type Row, type Timestamp } from "@/lib/api";
import { DEFAULT_BRAND, renderEmail, type EmailContent } from "@/lib/email-template";
import { cn } from "@/lib/utils";
import { PRESETS, fromPreset } from "./email-presets";
import { Btn, Toggle, useToast } from "./kit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type ComposeTarget = { col?: "evaluations" | "bookings" | "messages"; row?: Row } | null;

type Draft = { presetId: string; subject: string; to: string[]; cc: string[]; bcc: string[]; content: EmailContent };

/** Consultation details from a booking, written for the client. */
function bookingDetails(r: Row) {
  const start = (r.start as Timestamp | undefined)?.toDate?.();
  if (!start) return "";
  const day = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" }).format(start);
  const et = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }).format(start);
  let local = "";
  try {
    if (r.visitorTz && r.visitorTz !== "America/New_York")
      local = ` (${new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: r.visitorTz, timeZoneName: "short" }).format(start)} your time)`;
  } catch {}
  const mode = r.mode === "phone" ? "Phone call. We will call the number you gave us." : "Video call. We will send the link before the meeting.";
  return `Date: ${day}\nTime: ${et} Eastern Time${local}\nFormat: ${mode}\nLength: ${r.durationMin || 30} minutes`;
}

function startDraft(target: ComposeTarget, signName: string): Draft {
  const row = target?.row;
  const preset = PRESETS.find((p) => p.id === (target?.col === "bookings" ? "consultation" : target?.col === "evaluations" ? "evaluation" : "reply"))!;
  const content = fromPreset(preset, signName);
  if (target?.col === "bookings" && row) content.details = bookingDetails(row) || content.details;
  return { presetId: preset.id, subject: preset.subject, to: row?.email ? [String(row.email)] : [], cc: [], bcc: [], content };
}

const draftKey = (target: ComposeTarget) => `rt-email-draft-${target?.row?.id ?? "new"}`;

export function EmailComposer({ target, onClose }: { target: ComposeTarget; onClose: () => void }) {
  const open = target !== null;
  return <AnimatePresence>{open && <Composer key={target?.row?.id ?? "new"} target={target} onClose={onClose} />}</AnimatePresence>;
}

function Composer({ target, onClose }: { target: ComposeTarget; onClose: () => void }) {
  const toast = useToast();
  const { SITE } = useContent();
  const [me, setMe] = useState<{ email: string; name?: string } | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [testTo, setTestTo] = useState("");
  const [testOpen, setTestOpen] = useState(false);
  const [busy, setBusy] = useState<"" | "test" | "send">("");
  const [mobileTab, setMobileTab] = useState<"write" | "preview">("write");
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Signed-in staff member: signs the email and receives tests by default.
  useEffect(() => {
    api<{ staff: { email: string; name?: string } | null }>("/api/auth/me")
      .then((r) => {
        const s = r.staff;
        setMe(s);
        setTestTo(s?.email ?? "");
        let saved: Draft | null = null;
        try {
          saved = JSON.parse(localStorage.getItem(draftKey(target)) || "null");
        } catch {}
        const d = saved?.content ? saved : startDraft(target, s?.name ?? "");
        setDraft(d);
        setShowCc(d.cc.length > 0);
        setShowBcc(d.bcc.length > 0);
      })
      .catch(() => setDraft(startDraft(target, "")));
  }, [target]);

  // Keep an unsent draft in this browser, per request.
  useEffect(() => {
    if (!draft) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey(target), JSON.stringify(draft));
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [draft, target]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const name = String(target?.row?.name ?? "");
  const brand = useMemo(() => ({ ...DEFAULT_BRAND, phone: SITE.phone, email: SITE.email, website: SITE.url }), [SITE]);
  const rendered = useMemo(() => (draft ? renderEmail(draft.content, { name, email: draft.to[0] }, brand) : null), [draft, name, brand]);

  if (!draft || !rendered) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] grid place-items-center bg-paper">
        <p className="text-stone">Opening the composer…</p>
      </motion.div>
    );
  }

  const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });
  const setC = (patch: Partial<EmailContent>) => setDraft({ ...draft, content: { ...draft.content, ...patch } });
  const c = draft.content;

  const applyPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    if (c.body.trim() && !confirm(`Replace the current text with the "${p.label}" template?`)) return;
    const content = fromPreset(p, c.signName || me?.name || "");
    if (p.id === "consultation" && target?.col === "bookings" && target.row) content.details = bookingDetails(target.row) || content.details;
    set({ presetId: id, subject: p.subject || draft.subject, content });
  };

  /** Wraps or prefixes the selected text in the message box. */
  const format = (kind: "bold" | "link" | "bullets" | "numbers" | "name") => {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    const sel = value.slice(a, b);
    let insert = sel;
    if (kind === "bold") insert = `**${sel || "bold text"}**`;
    if (kind === "link") {
      const url = prompt("Link address (starting with https://)", "https://");
      if (!url) return;
      insert = `[${sel || "link text"}](${url})`;
    }
    if (kind === "bullets" || kind === "numbers")
      insert = (sel || "First item\nSecond item")
        .split("\n")
        .map((l, i) => `${kind === "bullets" ? "-" : `${i + 1}.`} ${l.replace(/^\s*([-*]|\d+[.)])\s+/, "")}`)
        .join("\n");
    if (kind === "name") insert = "{{firstName}}";
    const next = value.slice(0, a) + insert + value.slice(b);
    setC({ body: next });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a, a + insert.length);
    });
  };

  const payload = () => ({ col: target?.col, id: target?.row?.id, toName: name, subject: draft.subject, content: c });

  const sendTest = async () => {
    const list = testTo.split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean);
    if (!list.length || list.some((x) => !EMAIL_RE.test(x))) return toast("error", "Enter a valid email address for the test.");
    if (!draft.subject.trim()) return toast("error", "Write a subject first.");
    setBusy("test");
    try {
      await adminPost("email", { ...payload(), test: true, testTo: list });
      toast("ok", `Test sent to ${list.join(", ")}`);
      setTestOpen(false);
    } catch (e) {
      toast("error", (e as Error).message);
    } finally {
      setBusy("");
    }
  };

  const send = async () => {
    if (!draft.to.length) return toast("error", "Add at least one recipient.");
    if (!draft.subject.trim()) return toast("error", "Write a subject.");
    const extra = draft.cc.length + draft.bcc.length;
    if (!confirm(`Send "${draft.subject}" to ${draft.to.join(", ")}${extra ? ` and ${extra} more in Cc and Bcc` : ""}?`)) return;
    setBusy("send");
    try {
      await adminPost("email", { ...payload(), to: draft.to, cc: draft.cc, bcc: draft.bcc });
      try {
        localStorage.removeItem(draftKey(target));
      } catch {}
      toast("ok", `Email sent to ${draft.to.join(", ")}`);
      onClose();
    } catch (e) {
      toast("error", (e as Error).message);
    } finally {
      setBusy("");
    }
  };

  const discard = () => {
    if (!confirm("Discard this draft and start again from the template?")) return;
    try {
      localStorage.removeItem(draftKey(target));
    } catch {}
    setDraft(startDraft(target, me?.name ?? ""));
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Compose email"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[70] flex flex-col bg-paper"
    >
      <header className="flex min-h-16 flex-wrap items-center gap-3 border-b border-line bg-white px-4 py-2 sm:px-6">
        <button type="button" onClick={onClose} aria-label="Close composer" className="grid size-11 place-items-center rounded-full hover:bg-mist">
          <X aria-hidden className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-serif-display text-2xl leading-tight text-ink">{name ? `Email ${name}` : "New email"}</p>
          <p className="truncate text-xs text-stone">From {brand.name} &lt;clientservice@rtlawservices.com&gt;. Replies arrive in the firm&apos;s inbox.</p>
        </div>
        <div className="relative">
          <Btn variant="ghost" onClick={() => setTestOpen((v) => !v)} aria-expanded={testOpen}>
            <FlaskConical aria-hidden className="size-4" /> Send test
          </Btn>
          <AnimatePresence>
            {testOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute right-0 top-full z-10 mt-2 w-[min(90vw,22rem)] rounded-2xl border border-line bg-white p-4 shadow-2xl"
              >
                <label htmlFor="test-to" className="text-sm font-bold text-ink">
                  Send a test to
                </label>
                <input
                  id="test-to"
                  type="text"
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendTest()}
                  placeholder="you@example.com"
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-line px-3.5 text-sm outline-none focus:border-ink"
                />
                <p className="mt-1.5 text-xs text-stone">Up to three addresses, separated by commas. The subject starts with [Test]. Tests are not saved on the client&apos;s record.</p>
                <Btn className="mt-3 w-full" busy={busy === "test"} onClick={sendTest}>
                  Send test
                </Btn>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Btn variant="gold" busy={busy === "send"} onClick={send}>
          <Send aria-hidden className="size-4" /> Send email
        </Btn>
      </header>

      {/* On small screens the form and the preview share one column, with tabs. */}
      <div className="flex border-b border-line bg-white lg:hidden">
        {(["write", "preview"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setMobileTab(t)}
            aria-pressed={mobileTab === t}
            className={cn("min-h-11 flex-1 text-sm font-bold capitalize", mobileTab === t ? "border-b-2 border-ink text-ink" : "text-stone")}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className={cn("min-h-0 overflow-y-auto px-4 py-6 sm:px-8", mobileTab === "preview" && "hidden lg:block")}>
          <div className="mx-auto grid max-w-2xl gap-6">
            <Section title="Template">
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p.id)}
                    className={cn(
                      "min-h-10 rounded-full border px-4 text-sm font-bold transition-colors",
                      draft.presetId === p.id ? "border-ink bg-ink text-paper" : "border-line bg-white text-stone hover:border-ink/40 hover:text-ink",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Recipients">
              <Recipients label="To" value={draft.to} onChange={(to) => set({ to })} />
              <div className="flex gap-2">
                {!showCc && (
                  <button type="button" onClick={() => setShowCc(true)} className="min-h-9 rounded-full px-3 text-sm font-bold text-brass-ink hover:bg-mist">
                    Add Cc
                  </button>
                )}
                {!showBcc && (
                  <button type="button" onClick={() => setShowBcc(true)} className="min-h-9 rounded-full px-3 text-sm font-bold text-brass-ink hover:bg-mist">
                    Add Bcc
                  </button>
                )}
              </div>
              {showCc && <Recipients label="Cc" value={draft.cc} onChange={(cc) => set({ cc })} hint="Everyone sees Cc addresses." />}
              {showBcc && <Recipients label="Bcc" value={draft.bcc} onChange={(bcc) => set({ bcc })} hint="Hidden from the other recipients. Useful for the case file." />}
            </Section>

            <Section title="Subject and inbox preview">
              <Field label="Subject" value={draft.subject} onChange={(subject) => set({ subject })} />
              <Field label="Preview text" hint="Shown after the subject in most inboxes." value={c.preheader} onChange={(preheader) => setC({ preheader })} />
            </Section>

            <Section title="Message">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Small label" hint="Above the heading." value={c.label} onChange={(label) => setC({ label })} />
                <Field label="Greeting" value={c.greeting} onChange={(greeting) => setC({ greeting })} />
              </div>
              <Field label="Heading" value={c.heading} onChange={(heading) => setC({ heading })} />
              <div>
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <label htmlFor="mail-body" className="text-sm font-bold text-ink">
                    Message
                  </label>
                  <div className="flex flex-wrap gap-1" role="toolbar" aria-label="Formatting">
                    <ToolBtn label="Bold" onClick={() => format("bold")}><Bold aria-hidden className="size-4" /></ToolBtn>
                    <ToolBtn label="Link" onClick={() => format("link")}><Link2 aria-hidden className="size-4" /></ToolBtn>
                    <ToolBtn label="Bulleted list" onClick={() => format("bullets")}><List aria-hidden className="size-4" /></ToolBtn>
                    <ToolBtn label="Numbered list" onClick={() => format("numbers")}><ListOrdered aria-hidden className="size-4" /></ToolBtn>
                    <ToolBtn label="Insert first name" onClick={() => format("name")}><UserRound aria-hidden className="size-4" /></ToolBtn>
                  </div>
                </div>
                <textarea
                  id="mail-body"
                  ref={bodyRef}
                  rows={12}
                  value={c.body}
                  onChange={(e) => setC({ body: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-3 text-[0.95rem] leading-relaxed text-ink outline-none focus:border-ink"
                />
                <p className="mt-1 text-xs text-stone">
                  Leave a blank line between paragraphs. Start lines with &quot;- &quot; for bullets. {"{{firstName}}"} becomes the client&apos;s first name.
                </p>
              </div>
            </Section>

            <Section title="Details box" aside={<Toggle label="Show" checked={c.detailsEnabled} onChange={(detailsEnabled) => setC({ detailsEnabled })} />}>
              {c.detailsEnabled ? (
                <>
                  <Field label="Box title" value={c.detailsTitle} onChange={(detailsTitle) => setC({ detailsTitle })} />
                  <Area label="Details" hint='One per line, as "Label: value".' rows={5} value={c.details} onChange={(details) => setC({ details })} />
                </>
              ) : (
                <p className="text-sm text-stone">A highlighted box for key facts, such as a meeting time or a deadline.</p>
              )}
            </Section>

            <Section title="Button" aside={<Toggle label="Show" checked={c.buttonEnabled} onChange={(buttonEnabled) => setC({ buttonEnabled })} />}>
              {c.buttonEnabled ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Button text" value={c.buttonLabel} onChange={(buttonLabel) => setC({ buttonLabel })} />
                  <Field label="Link" value={c.buttonUrl} onChange={(buttonUrl) => setC({ buttonUrl })} />
                </div>
              ) : (
                <p className="text-sm text-stone">One clear action, such as booking a consultation or uploading documents.</p>
              )}
            </Section>

            <Section title="Sign-off">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Closing" value={c.closing} onChange={(closing) => setC({ closing })} />
                <Field label="Name" value={c.signName} onChange={(signName) => setC({ signName })} />
                <Field label="Title" value={c.signTitle} onChange={(signTitle) => setC({ signTitle })} />
              </div>
            </Section>

            <Section title="Appearance">
              <div className="grid gap-4 sm:grid-cols-2">
                <Choice label="Header" value={c.headerStyle} onChange={(headerStyle) => setC({ headerStyle })} options={[{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }]} />
                <Choice label="Accent" value={c.accent} onChange={(accent) => setC({ accent })} options={[{ value: "gold", label: "Gold" }, { value: "ink", label: "Ink" }]} />
              </div>
              <Toggle label="Firm contact footer" hint="Phone, email and website from Website details." checked={c.showContact} onChange={(showContact) => setC({ showContact })} />
              <Toggle label="Confidentiality notice" hint="Short privilege and no-relationship notice under the email." checked={c.showNotice} onChange={(showNotice) => setC({ showNotice })} />
            </Section>

            <button type="button" onClick={discard} className="mb-4 w-fit text-sm font-bold text-stone hover:text-danger">
              Discard draft
            </button>
          </div>
        </div>

        <div className={cn("min-h-0 flex-col border-l border-line bg-mist", mobileTab === "write" ? "hidden lg:flex" : "flex")}>
          <div className="flex items-center justify-between gap-3 border-b border-line bg-white/70 px-4 py-2 sm:px-6">
            <p className="text-sm font-bold text-ink">Live preview</p>
            <div className="flex rounded-full border border-line bg-white p-1">
              {(
                [
                  ["desktop", Monitor, "Desktop"],
                  ["mobile", Smartphone, "Phone"],
                ] as const
              ).map(([id, Icon, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDevice(id)}
                  aria-pressed={device === id}
                  className={cn("inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold", device === id ? "bg-ink text-paper" : "text-stone hover:text-ink")}
                >
                  <Icon aria-hidden className="size-4" /> {label}
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <div className={cn("mx-auto overflow-hidden rounded-2xl border border-line bg-white shadow-xl transition-[max-width] duration-300", device === "mobile" ? "max-w-[390px]" : "max-w-[720px]")}>
              <div className="border-b border-line px-5 py-4 text-sm">
                <p className="font-bold text-ink">{draft.subject || "No subject"}</p>
                <p className="mt-1 truncate text-stone">
                  <span className="font-bold text-ink">{brand.name}</span> &lt;clientservice@rtlawservices.com&gt;
                </p>
                <p className="truncate text-stone">
                  To {draft.to.join(", ") || "no recipient yet"}
                  {draft.cc.length > 0 && `, Cc ${draft.cc.join(", ")}`}
                </p>
                {c.preheader && <p className="mt-1 truncate text-xs text-stone">{c.preheader}</p>}
              </div>
              <EmailFrame title="Email preview" html={rendered.html} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- pieces ---------- */

/**
 * Shows an email in a frame as tall as the email, so only the page scrolls.
 * Scripts stay blocked; same-origin access only lets the page measure the height.
 */
export function EmailFrame({ title, html, className }: { title: string; html: string; className?: string }) {
  const fit = (f: HTMLIFrameElement) => {
    const h = f.contentDocument?.documentElement.scrollHeight;
    if (h) f.style.height = `${h}px`;
  };
  return (
    <iframe
      title={title}
      sandbox="allow-same-origin"
      srcDoc={html}
      onLoad={(e) => fit(e.currentTarget)}
      className={cn("block h-[900px] w-full border-0", className)}
    />
  );
}

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="grid gap-4 rounded-2xl border border-line bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-bold text-ink">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

const inputCls = "mt-1.5 min-h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[0.95rem] text-ink outline-none focus:border-ink";

function Field({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
      {hint && <span className="mt-1 block text-xs text-stone">{hint}</span>}
    </label>
  );
}

function Area({ label, value, onChange, hint, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; hint?: string; rows?: number }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink">{label}</span>
      <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className={cn(inputCls, "py-2.5 leading-relaxed")} />
      {hint && <span className="mt-1 block text-xs text-stone">{hint}</span>}
    </label>
  );
}

function Choice<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div>
      <p className="text-sm font-bold text-ink">{label}</p>
      <div className="mt-1.5 flex gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn("min-h-10 flex-1 rounded-xl border text-sm font-bold", value === o.value ? "border-ink bg-ink text-paper" : "border-line bg-white text-stone hover:text-ink")}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToolBtn({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="grid size-9 place-items-center rounded-lg text-stone hover:bg-mist hover:text-ink">
      {children}
    </button>
  );
}

/** Email addresses as removable chips. Enter, comma, space or leaving the field adds what was typed. */
function Recipients({ label, value, onChange, hint }: { label: string; value: string[]; onChange: (v: string[]) => void; hint?: string }) {
  const [text, setText] = useState("");
  const id = `rcpt-${label.toLowerCase()}`;
  const commit = (raw = text) => {
    const add = raw.split(/[\s,;]+/).map((x) => x.trim().toLowerCase()).filter(Boolean);
    if (add.length) onChange([...new Set([...value, ...add])]);
    setText("");
  };
  return (
    <div>
      <label htmlFor={id} className="text-sm font-bold text-ink">
        {label}
      </label>
      <div className="mt-1.5 flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-line bg-white px-2 py-1.5 focus-within:border-ink">
        {value.map((e) => {
          const ok = EMAIL_RE.test(e);
          return (
            <span key={e} className={cn("inline-flex items-center gap-1 rounded-full py-1 pl-3 pr-1 text-sm", ok ? "bg-mist text-ink" : "bg-danger/10 text-danger")}>
              {e}
              <button type="button" aria-label={`Remove ${e}`} onClick={() => onChange(value.filter((x) => x !== e))} className="grid size-6 place-items-center rounded-full hover:bg-white">
                <X aria-hidden className="size-3.5" />
              </button>
            </span>
          );
        })}
        <input
          id={id}
          type="text"
          inputMode="email"
          autoComplete="off"
          value={text}
          onChange={(e) => {
            const v = e.target.value;
            if (/[\s,;]$/.test(v)) commit(v);
            else setText(v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
            if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={() => commit()}
          onPaste={(e) => {
            e.preventDefault();
            commit(e.clipboardData.getData("text"));
          }}
          placeholder={value.length ? "" : "name@example.com"}
          className="min-w-40 flex-1 bg-transparent px-1.5 text-[0.95rem] outline-none"
        />
      </div>
      {hint && <p className="mt-1 text-xs text-stone">{hint}</p>}
    </div>
  );
}
