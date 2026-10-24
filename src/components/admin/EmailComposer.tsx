"use client";

// Full-screen composer for branded client emails: the form on the left, a
// live preview of the exact email on the right, test sends to any address,
// and Cc and Bcc. The preview and the sent email come from the same renderer
// (src/lib/email-template.ts).

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bold, CopyPlus, FlaskConical, Link2, List, ListOrdered, Monitor, Paperclip, RotateCcw, Save, Send, Smartphone, Trash2, UserRound, X } from "lucide-react";
import { useContent } from "@/content/LiveContent";
import { adminPost, api, deleteDoc, listDocs, putDoc, type Row, type Timestamp } from "@/lib/api";
import { BLANK_EMAIL, DEFAULT_BRAND, DEFAULT_REPLY_TO, MAILBOXES, renderEmail, SENDERS, type EmailContent } from "@/lib/email-template";
import { cn } from "@/lib/utils";
import { PRESETS, fromPreset, mergeTemplates, type Template } from "./email-presets";
import { Btn, dialogIsOpen, Toggle, useCollection, useDialog, useToast } from "./kit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** A received email being answered or passed on. */
export type Original = {
  /** "On ..., Ada Obi <ada@example.com> wrote:" */
  replyHeader: string;
  /** The forwarded-message block: From, Date, Subject and To. */
  forwardHeader: string;
  text: string;
  to: string[];
  cc: string[];
  files?: { name: string; type: string; blob: Blob }[];
};

export type ComposeTarget = {
  col?: "evaluations" | "bookings" | "messages" | "inbox";
  row?: Row;
  mode?: "reply" | "replyAll" | "forward";
  original?: Original;
} | null;

type Attachment = { name: string; type: string; size: number; content: string };

type Draft = {
  presetId: string;
  from: string;
  /** Where the client's reply goes. */
  replyTo?: string;
  subject: string;
  to: string[];
  cc: string[];
  bcc: string[];
  content: EmailContent;
  /** Whether the quoted original goes out with the email. */
  quoted?: boolean;
  attachments?: Attachment[];
};

const MAX_FILES = 10;
const MAX_BYTES = 7 * 1024 * 1024;

export const fileSize = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

/** A file as base64, the form the email service takes. */
const readBase64 = (f: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(f);
  });

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

function startDraft(target: ComposeTarget, signName: string, templates: Template[]): Draft {
  const row = target?.row;
  const want = target?.col === "bookings" ? "consultation" : target?.col === "evaluations" ? "evaluation" : "reply";
  const preset = templates.find((p) => p.id === want) ?? PRESETS.find((p) => p.id === want)!;
  const content = fromPreset(preset, signName);
  if (target?.col === "bookings" && row) content.details = bookingDetails(row) || content.details;
  // A reply to a received email keeps its subject, quotes it, and goes out
  // from the address it was sent to. A forward starts with no recipient.
  const inbox = target?.col === "inbox" && row;
  const mode = target?.mode ?? "reply";
  const orig = target?.original;
  const base = String(row?.subject ?? "");
  let subject = preset.subject;
  let to = row?.email ? [String(row.email)] : [];
  let cc: string[] = [];
  if (inbox) {
    if (mode === "forward") {
      subject = /^fwd?:/i.test(base) ? base : `Fwd: ${base}`;
      to = [];
      Object.assign(content, { preheader: `Forwarded: ${base}`, label: "", heading: "", greeting: "Hello,", body: "Please see the message below." });
    } else subject = /^re:/i.test(base) ? base : `Re: ${base}`;
    if (mode === "replyAll" && orig) {
      const sender = String(row.email).toLowerCase();
      cc = [...new Set([...orig.to, ...orig.cc].map((x) => x.toLowerCase()))].filter((x) => x !== sender && !MAILBOXES.some((s) => s === x));
    }
    if (orig) {
      content.quote = orig.text;
      content.quoteHeader = mode === "forward" ? orig.forwardHeader : orig.replyHeader;
    }
  }
  const from = SENDERS[0];
  return { presetId: preset.id, from, replyTo: DEFAULT_REPLY_TO, subject, to, cc, bcc: [], content, quoted: !!content.quote, attachments: [] };
}

const draftKey = (target: ComposeTarget) => `rt-email-draft-${target?.row?.id ?? "new"}${target?.mode && target.mode !== "reply" ? `-${target.mode}` : ""}`;

export function EmailComposer({ target, onClose }: { target: ComposeTarget; onClose: () => void }) {
  const open = target !== null;
  return <AnimatePresence>{open && <Composer key={draftKey(target)} target={target} onClose={onClose} />}</AnimatePresence>;
}

function Composer({ target, onClose }: { target: ComposeTarget; onClose: () => void }) {
  const toast = useToast();
  const dialog = useDialog();
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

  const saved = useCollection("emailTemplates", "label");
  const templates = useMemo(() => mergeTemplates(saved.rows ?? []), [saved.rows]);

  // The signed-in staff member signs the email and receives tests by default.
  // The first template is the firm's saved version where there is one.
  useEffect(() => {
    Promise.all([
      api<{ staff: { email: string; name?: string } | null }>("/api/auth/me").catch(() => ({ staff: null })),
      listDocs("emailTemplates").catch(() => []),
    ]).then(([r, rows]) => {
      const s = r.staff;
      setMe(s);
      setTestTo(s?.email ?? "");
      let kept: Draft | null = null;
      try {
        kept = JSON.parse(localStorage.getItem(draftKey(target)) || "null");
      } catch {}
      // A draft saved by an earlier version may lack newer fields, so fill them in.
      const d: Draft = kept?.content
        ? { ...kept, replyTo: kept.replyTo || DEFAULT_REPLY_TO, cc: kept.cc ?? [], bcc: kept.bcc ?? [], to: kept.to ?? [], attachments: [], content: { ...BLANK_EMAIL, ...kept.content } }
        : startDraft(target, s?.name ?? "", mergeTemplates(rows));
      setDraft(d);
      setShowCc(d.cc.length > 0);
      setShowBcc(d.bcc.length > 0);
      // A forward carries the original attachments.
      const files = target?.mode === "forward" ? (target.original?.files ?? []) : [];
      if (files.length)
        Promise.all(files.slice(0, MAX_FILES).map(async (f) => ({ name: f.name, type: f.type, size: f.blob.size, content: await readBase64(f.blob) })))
          .then((attachments) => setDraft((cur) => (cur ? { ...cur, attachments } : cur)))
          .catch(() => {});
    });
  }, [target]);

  // Keep an unsent draft in this browser, per request.
  useEffect(() => {
    if (!draft) return;
    const t = setTimeout(() => {
      try {
        // Files are left out: they can be large, and browser storage is small.
        localStorage.setItem(draftKey(target), JSON.stringify({ ...draft, attachments: [] }));
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [draft, target]);

  useEffect(() => {
    // Escape closes only the composer, not the request panel underneath.
    const k = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || dialogIsOpen()) return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", k, true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", k, true);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const name = String(target?.row?.name ?? "");
  // The contact line at the foot of the email shows the sending address, as the server does.
  const sender = SENDERS.find((s) => s === draft?.from) ?? SENDERS[0];
  const brand = useMemo(() => ({ ...DEFAULT_BRAND, phone: SITE.phone, email: sender, website: SITE.url }), [SITE, sender]);
  // The quoted original goes out only while it is switched on.
  const effective = useMemo(() => (draft ? (draft.quoted === false ? { ...draft.content, quote: "", quoteHeader: "" } : draft.content) : null), [draft]);
  const rendered = useMemo(() => (draft && effective ? renderEmail(effective, { name, email: draft.to[0] }, brand) : null), [draft, effective, name, brand]);

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

  const current = templates.find((t) => t.id === draft.presetId);

  const applyPreset = async (id: string) => {
    const p = templates.find((x) => x.id === id);
    if (!p) return;
    if (
      c.body.trim() &&
      !(await dialog.confirm({ title: `Use "${p.label}"?`, message: "The template replaces the text you have written in this email.", confirmLabel: "Use template", danger: true }))
    )
      return;
    const content = fromPreset(p, c.signName || me?.name || "");
    if (p.id === "consultation" && target?.col === "bookings" && target.row) content.details = bookingDetails(target.row) || content.details;
    set({ presetId: id, subject: p.subject || draft.subject, content });
  };

  /** The draft as a template: booking details filled in for this client go back to the template's own. */
  const asTemplate = (base?: Template) => {
    const content = { ...c };
    if (target?.col === "bookings" && target.row && content.details === bookingDetails(target.row)) content.details = base?.content.details ?? PRESETS.find((p) => p.id === "consultation")!.content.details ?? "";
    return { subject: draft.subject, content };
  };

  const saveTemplate = async () => {
    if (!current || current.id === "blank") return;
    if (!(await dialog.confirm({ title: "Save to template?", message: `The "${current.label}" template will start this way for everyone on the staff.`, confirmLabel: "Save template" }))) return;
    try {
      await putDoc("emailTemplates", current.id, { label: current.label, ...asTemplate(current) }, false);
      toast("ok", `"${current.label}" template saved`);
    } catch (e) {
      toast("error", (e as Error).message);
    }
  };

  const saveAsNew = async () => {
    const label = await dialog.prompt({
      title: "Save as a new template",
      message: "The template is shared with all staff and appears with the others in the composer.",
      confirmLabel: "Save template",
      input: { label: "Template name", value: draft.subject || "New template", required: "Give the template a name." },
    });
    if (!label) return;
    const id = `t-${Date.now().toString(36)}`;
    try {
      await putDoc("emailTemplates", id, { label, ...asTemplate() }, false);
      set({ presetId: id });
      toast("ok", `"${label}" template added`);
    } catch (e) {
      toast("error", (e as Error).message);
    }
  };

  const removeTemplate = async () => {
    if (!current || current.id === "blank") return;
    const restoring = current.builtIn;
    const ok = await dialog.confirm(
      restoring
        ? { title: "Restore the original?", message: `The "${current.label}" template goes back to its original wording for everyone on the staff.`, confirmLabel: "Restore original", danger: true }
        : { title: "Delete this template?", message: `"${current.label}" will be removed for everyone on the staff. This cannot be undone.`, confirmLabel: "Delete template", danger: true },
    );
    if (!ok) return;
    try {
      await deleteDoc("emailTemplates", current.id);
      toast("ok", restoring ? "Original template restored" : "Template deleted");
      if (!restoring) set({ presetId: "blank" });
    } catch (e) {
      toast("error", (e as Error).message);
    }
  };

  /** Wraps or prefixes the selected text in the message box. */
  const format = async (kind: "bold" | "link" | "bullets" | "numbers" | "name") => {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    const sel = value.slice(a, b);
    let insert = sel;
    if (kind === "bold") insert = `**${sel || "bold text"}**`;
    if (kind === "link") {
      const url = await dialog.prompt({
        title: "Add a link",
        message: sel ? `The words "${sel}" will link to this address.` : "Link text is added where the cursor is; change it afterwards.",
        confirmLabel: "Add link",
        input: { label: "Web address", value: "https://", placeholder: "https://rtlawservices.com/book/", required: "Enter the web address." },
      });
      if (!url || url === "https://") return;
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

  const from = SENDERS.find((s) => s === draft.from) ?? SENDERS[0];
  const files = draft.attachments ?? [];
  const totalSize = files.reduce((n, f) => n + f.size, 0);
  const replyTo = (draft.replyTo ?? DEFAULT_REPLY_TO).trim();
  const payload = () => ({
    col: target?.col,
    id: target?.row?.id,
    from,
    replyTo,
    toName: name,
    subject: draft.subject,
    content: effective,
    attachments: files.map(({ name: n, content }) => ({ name: n, content })),
  });

  const addFiles = async (list: FileList | File[] | null) => {
    const picked = Array.from(list ?? []);
    if (!picked.length) return;
    if (files.length + picked.length > MAX_FILES) return toast("error", `Attach ${MAX_FILES} files at most.`);
    if (totalSize + picked.reduce((n, f) => n + f.size, 0) > MAX_BYTES) return toast("error", "Attachments can add up to 7 MB. Try smaller files or send them separately.");
    try {
      const added = await Promise.all(picked.map(async (f) => ({ name: f.name, type: f.type || "application/octet-stream", size: f.size, content: await readBase64(f) })));
      setDraft((cur) => (cur ? { ...cur, attachments: [...(cur.attachments ?? []), ...added] } : cur));
    } catch {
      toast("error", "A file could not be read. Try again.");
    }
  };
  const removeFile = (i: number) => setDraft((cur) => (cur ? { ...cur, attachments: (cur.attachments ?? []).filter((_, j) => j !== i) } : cur));

  const sendTest = async () => {
    const list = testTo.split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean);
    if (!list.length || list.some((x) => !EMAIL_RE.test(x))) return toast("error", "Enter a valid email address for the test.");
    if (!draft.subject.trim()) return toast("error", "Write a subject first.");
    if (!EMAIL_RE.test(replyTo)) return toast("error", replyTo ? "Enter a valid Reply-to address." : "Enter a Reply-to address first.");
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
    if (!EMAIL_RE.test(replyTo)) return toast("error", replyTo ? "Enter a valid Reply-to address." : "Enter a Reply-to address.");
    const extra = draft.cc.length + draft.bcc.length;
    const ok = await dialog.confirm({
      title: "Send this email?",
      message: (
        <>
          <span className="block font-bold text-ink">{draft.subject}</span>
          <span className="mt-1 block">
            From {from} to {draft.to.join(", ")}
            {extra ? `, plus ${extra} in Cc and Bcc` : ""}.
          </span>
        </>
      ),
      confirmLabel: "Send email",
    });
    if (!ok) return;
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

  const discard = async () => {
    if (!(await dialog.confirm({ title: "Discard this draft?", message: "Everything written in this email is cleared and it starts again from the template.", confirmLabel: "Discard draft", danger: true }))) return;
    try {
      localStorage.removeItem(draftKey(target));
    } catch {}
    setDraft(startDraft(target, me?.name ?? "", templates));
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
          <p className="truncate text-xs text-stone">From {brand.name} &lt;{from}&gt;. Replies go to {replyTo || "no address yet"}.</p>
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
                {templates.map((p) => (
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
              <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
                {current && current.id !== "blank" && (
                  <Btn variant="ghost" onClick={saveTemplate}>
                    <Save aria-hidden className="size-4" /> Save to &ldquo;{current.label}&rdquo;
                  </Btn>
                )}
                <Btn variant="ghost" onClick={saveAsNew}>
                  <CopyPlus aria-hidden className="size-4" /> Save as new template
                </Btn>
                {current && !current.builtIn && (
                  <Btn variant="danger" onClick={removeTemplate}>
                    <Trash2 aria-hidden className="size-4" /> Delete template
                  </Btn>
                )}
                {current?.builtIn && current.edited && (
                  <button type="button" onClick={removeTemplate} className="inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-bold text-stone hover:text-ink">
                    <RotateCcw aria-hidden className="size-4" /> Restore original
                  </button>
                )}
              </div>
              <p className="-mt-1 text-xs text-stone">Templates are shared by all staff. Edit the email, then save it to the template so it starts that way next time.</p>
            </Section>

            <Section title="Recipients">
              {SENDERS.length > 1 ? (
                <Choice label="From" value={from} onChange={(f) => set({ from: f })} options={SENDERS.map((s) => ({ value: s, label: s }))} />
              ) : (
                <div>
                  <p className="text-sm font-bold text-ink">From</p>
                  <p className="mt-1.5 flex min-h-11 items-center rounded-xl border border-line bg-mist/50 px-3.5 text-[0.95rem] text-ink">{from}</p>
                </div>
              )}
              <Field label="Reply-to" hint="Where the client's reply goes. clientservice@ unless you change it." value={draft.replyTo ?? DEFAULT_REPLY_TO} onChange={(v) => set({ replyTo: v })} />
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

            <Section title="Attachments" aside={<span className="text-xs font-bold text-stone">{fileSize(totalSize)} of 7 MB</span>}>
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  addFiles(e.dataTransfer.files);
                }}
                className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ink/25 bg-mist/40 px-4 py-5 text-center transition-colors hover:border-ink/50 hover:bg-mist"
              >
                <Paperclip aria-hidden className="size-5 text-brass-ink" />
                <span className="text-sm font-bold text-ink">Add files</span>
                <span className="text-xs text-stone">Drop files here or choose them. Up to {MAX_FILES} files, 7 MB in total.</span>
                <input type="file" multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
              </label>
              {files.length > 0 && (
                <ul className="grid gap-2">
                  {files.map((f, i) => (
                    <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-line bg-white px-3 py-2">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brass-pale text-xs font-bold uppercase text-brass-ink">{(f.name.split(".").pop() || "file").slice(0, 4)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-ink">{f.name}</span>
                        <span className="block text-xs text-stone">{fileSize(f.size)}</span>
                      </span>
                      <button type="button" onClick={() => removeFile(i)} aria-label={`Remove ${f.name}`} className="grid size-9 place-items-center rounded-full text-stone hover:bg-danger/10 hover:text-danger">
                        <X aria-hidden className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {c.quote.trim() && (
              <Section
                title={target?.mode === "forward" ? "Forwarded message" : "Original message"}
                aside={<Toggle label="Include" checked={draft.quoted !== false} onChange={(quoted) => set({ quoted })} />}
              >
                <p className="whitespace-pre-line text-xs text-stone">{c.quoteHeader}</p>
                <div className="max-h-48 overflow-y-auto whitespace-pre-wrap border-l-2 border-line pl-3 text-sm text-stone">{c.quote}</div>
              </Section>
            )}

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
                  <span className="font-bold text-ink">{brand.name}</span> &lt;{from}&gt;
                </p>
                <p className="truncate text-stone">Reply-to {replyTo || "not set"}
                </p>
                <p className="truncate text-stone">
                  To {draft.to.join(", ") || "no recipient yet"}
                  {draft.cc.length > 0 && `, Cc ${draft.cc.join(", ")}`}
                </p>
                {c.preheader && <p className="mt-1 truncate text-xs text-stone">{c.preheader}</p>}
                {files.length > 0 && (
                  <p className="mt-2 flex flex-wrap gap-1.5">
                    {files.map((f, i) => (
                      <span key={`${f.name}-${i}`} className="inline-flex items-center gap-1 rounded-full bg-mist px-2.5 py-1 text-xs font-bold text-ink">
                        <Paperclip aria-hidden className="size-3" /> {f.name}
                      </span>
                    ))}
                  </p>
                )}
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
export function EmailFrame({ title, html, className, sandbox = "allow-same-origin" }: { title: string; html: string; className?: string; sandbox?: string }) {
  const fit = (f: HTMLIFrameElement) => {
    const d = f.contentDocument;
    if (!d) return;
    // Collapse first, so a short email does not keep the frame's starting height.
    f.style.height = "0px";
    f.style.height = `${Math.max(d.documentElement.scrollHeight, 120) + 24}px`;
  };
  return (
    <iframe
      title={title}
      sandbox={sandbox}
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
