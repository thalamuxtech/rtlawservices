"use client";

// Mail received at clientservice@ and info@, laid out like a mail app: the
// list on the left, the open message on the right. The Worker keeps each
// message as it arrived; it is read and parsed here, in the browser. Scripts
// in a message never run, and pictures hosted elsewhere are not loaded, so
// opening an email cannot run code or tell the sender it was read.

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Archive, ArchiveRestore, ArrowLeft, Download, Eye, File, FileArchive, FileImage, FileSpreadsheet, FileText, Forward, Inbox as InboxIcon, Mail,
  MailOpen, Paperclip, Reply, ReplyAll, ShieldAlert, Trash2, X,
} from "lucide-react";
import { api, deleteDoc, patchDoc, type Timestamp } from "@/lib/api";
import { SENDERS } from "@/lib/email-template";
import { cn } from "@/lib/utils";
import { EmailComposer, EmailFrame, fileSize, type ComposeTarget, type Original } from "../EmailComposer";
import { Btn, Chip, fmtTs, Loading, Search, useCollection, useDialog, useToast, type Row } from "../kit";
import { SentEmail } from "./Emails";

/* ---------- reading a message ---------- */

type Addr = { name?: string; address?: string };

type Attachment = {
  name: string;
  type: string;
  size: number;
  url: string;
  blob: Blob;
  ext: string;
  image: boolean;
  /** Programs, scripts and web pages, which can do harm when opened. */
  risky: boolean;
};

type Parsed = { html: string; text: string; to: Addr[]; cc: Addr[]; date: Date | null; attachments: Attachment[]; preview: string };

const RISKY = /^(exe|msi|bat|cmd|com|scr|pif|vbs|vbe|js|jse|wsf|wsh|ps1|psm1|jar|app|dmg|pkg|sh|reg|lnk|hta|html?|svg|iso|docm|xlsm|pptm)$/i;

const label = (a: Addr) => (a.name ? `${a.name} <${a.address}>` : (a.address ?? ""));

const toBase64 = (buf: ArrayBuffer) => {
  let s = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};

/** Plain text of an HTML email, for previews and quoting. DOMParser does not run scripts. */
const htmlText = (html: string) => {
  const doc = new DOMParser().parseFromString(html.replace(/<(br|\/p|\/div|\/li|\/tr|\/h\d)[^>]*>/gi, "$&\n"), "text/html");
  doc.querySelectorAll("script, style, head, title").forEach((el) => el.remove());
  return (doc.body.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim();
};

/** First lines of the message, without quoted earlier messages. */
const previewOf = (text: string) =>
  text
    .split("\n")
    .filter((l) => !l.trim().startsWith(">"))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);

// Parsed messages for this visit, so moving between emails does not download them again.
const cache = new Map<string, Promise<Parsed>>();

function parseMessage(id: string): Promise<Parsed> {
  const hit = cache.get(id);
  if (hit) return hit;
  const job = (async () => {
    const res = await fetch(`/api/admin/inbox-raw/${encodeURIComponent(id)}`, { credentials: "same-origin" });
    if (!res.ok) throw new Error("The message could not be loaded.");
    const { default: PostalMime } = await import("postal-mime");
    const email = await PostalMime.parse(await res.arrayBuffer());
    const all = email.attachments ?? [];
    let html = email.html ?? "";
    // Pictures sent inside the email ("cid:" links) are shown from the message itself.
    const inline = new Set<unknown>();
    for (const a of all) {
      if (!a.contentId) continue;
      const cid = a.contentId.replace(/^<|>$/g, "");
      if (!html.includes(`cid:${cid}`)) continue;
      const buf = typeof a.content === "string" ? (new TextEncoder().encode(a.content).buffer as ArrayBuffer) : (a.content as ArrayBuffer);
      html = html.split(`cid:${cid}`).join(`data:${a.mimeType};base64,${toBase64(buf)}`);
      inline.add(a);
    }
    // Links open in a new tab instead of inside the reading pane.
    if (html) html = `<base target="_blank"><style>body{margin:16px;font-family:Helvetica,Arial,sans-serif;color:#14181F;line-height:1.55;word-wrap:break-word}img{max-width:100%;height:auto}</style>${html}`;
    const text = email.text?.trim() || (email.html ? htmlText(email.html) : "");
    const attachments = all
      .filter((a) => !inline.has(a))
      .map((a) => {
        const type = a.mimeType || "application/octet-stream";
        const blob = new Blob([a.content as BlobPart], { type });
        const name = a.filename || "attachment";
        const ext = (name.includes(".") ? (name.split(".").pop() ?? "") : "").toLowerCase();
        return { name, type, size: blob.size, url: URL.createObjectURL(blob), blob, ext, image: type.startsWith("image/") && !/svg/.test(type), risky: RISKY.test(ext) };
      });
    return { html, text, to: email.to ?? [], cc: email.cc ?? [], date: email.date ? new Date(email.date) : null, attachments, preview: previewOf(text) };
  })();
  cache.set(id, job);
  job.catch(() => cache.delete(id));
  return job;
}

/* ---------- small pieces ---------- */

const AVATAR = ["#14181F", "#7D6638", "#33415C", "#1F5F5B", "#6B3E4E", "#4A5A2E"];

function Avatar({ name, email, size = 40 }: { name?: string; email?: string; size?: number }) {
  const key = (email || name || "?").toLowerCase();
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const words = (name || email || "?").replace(/<.*>/, "").trim().split(/\s+/).filter(Boolean);
  const initials = ((words[0]?.[0] ?? "?") + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
  return (
    <span aria-hidden className="grid shrink-0 place-items-center rounded-full font-bold text-white" style={{ width: size, height: size, background: AVATAR[h % AVATAR.length], fontSize: size * 0.36 }}>
      {initials}
    </span>
  );
}

/** Time today, "Yesterday", a weekday this week, then the date. */
function shortDate(t?: Timestamp) {
  const d = t?.toDate?.();
  if (!d) return "";
  const now = new Date();
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86400000);
  if (diff === 0) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (diff === 1) return "Yesterday";
  if (diff < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", d.getFullYear() === now.getFullYear() ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" });
}

function TypeIcon({ a, className }: { a: Pick<Attachment, "ext" | "type" | "image">; className?: string }) {
  const t = `${a.type} ${a.ext}`;
  const [Icon, tone] = a.image
    ? [FileImage, "bg-[#E8EEF6] text-[#33415C]"]
    : /pdf/.test(t)
      ? [FileText, "bg-danger/10 text-danger"]
      : /sheet|excel|csv|xls/.test(t)
        ? [FileSpreadsheet, "bg-success/10 text-success"]
        : /word|doc|rtf|txt|text/.test(t)
          ? [FileText, "bg-[#E8EEF6] text-[#33415C]"]
          : /zip|rar|7z|tar|gz|compressed/.test(t)
            ? [FileArchive, "bg-brass-pale text-brass-ink"]
            : [File, "bg-mist text-stone"];
  return (
    <span className={cn("grid place-items-center rounded-xl", tone, className)}>
      <Icon aria-hidden className="size-6" />
    </span>
  );
}

const FOLDERS = [
  { id: "inbox", label: "Inbox", match: (r: Row) => r.status !== "archived" },
  { id: "unread", label: "Unread", match: (r: Row) => r.status === "new" },
  { id: "replied", label: "Replied", match: (r: Row) => r.status === "replied" },
  { id: "archived", label: "Archived", match: (r: Row) => r.status === "archived" },
] as const;

/* ---------- the inbox ---------- */

export function Inbox({ rows, role, receiving = true }: { rows: Row[] | null; role: string; receiving?: boolean }) {
  const toast = useToast();
  const dialog = useDialog();
  const emails = useCollection("emails");
  const [mailbox, setMailbox] = useState("all");
  const [folder, setFolder] = useState<(typeof FOLDERS)[number]["id"]>("inbox");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [compose, setCompose] = useState<ComposeTarget>(null);
  const [sent, setSent] = useState<Row | null>(null);
  // Previews worked out in this visit, shown until the saved ones arrive.
  const [previews, setPreviews] = useState<Record<string, { preview: string; attachmentCount: number }>>({});
  const current = rows?.find((r) => r.id === openId) ?? null;

  const inMailbox = useMemo(() => (rows ?? []).filter((r) => mailbox === "all" || r.mailbox === mailbox), [rows, mailbox]);
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    const match = FOLDERS.find((f) => f.id === folder)!.match;
    return inMailbox.filter((r) => match(r) && (!t || `${r.name} ${r.email} ${r.subject} ${r.preview ?? previews[r.id]?.preview ?? ""}`.toLowerCase().includes(t)));
  }, [inMailbox, folder, q, previews]);

  // Fill in the preview line and attachment count of messages not read yet,
  // one at a time, and save them so the list shows them from then on.
  useEffect(() => {
    const todo = (rows ?? []).filter((r) => r.preview === undefined && !previews[r.id]).slice(0, 25);
    if (!todo.length) return;
    let live = true;
    (async () => {
      for (const r of todo) {
        if (!live) return;
        try {
          const p = await parseMessage(r.id);
          const info = { preview: p.preview, attachmentCount: p.attachments.length };
          if (live) setPreviews((cur) => ({ ...cur, [r.id]: info }));
          await api(`/api/admin/d/inbox/${encodeURIComponent(r.id)}`, { method: "PATCH", json: info });
        } catch {}
      }
    })();
    return () => {
      live = false;
    };
  }, [rows, previews]);

  const open = (r: Row) => {
    setOpenId(r.id);
    if (r.status === "new") patchDoc("inbox", r.id, { status: "read" }).catch(() => {});
  };

  const count = (f: (typeof FOLDERS)[number]) => inMailbox.filter(f.match).length;
  const unread = (m: string) => (rows ?? []).filter((r) => r.status === "new" && (m === "all" || r.mailbox === m)).length;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif-display text-4xl text-ink">Inbox</h1>
          <p className="mt-1 text-stone">Email sent to clientservice@ and info@rtlawservices.com.</p>
        </div>
        <Search value={q} onChange={setQ} placeholder="Search sender, subject or text" />
      </div>

      {!receiving && (
        <div role="status" className="flex flex-wrap items-start gap-4 rounded-2xl border border-brass/40 bg-brass-pale px-5 py-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-brass-ink">
            <Mail aria-hidden className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-ink">Receiving email here is paused for now</p>
            <p className="mt-0.5 text-sm leading-relaxed text-stone">
              New mail to clientservice@ and info@rtlawservices.com arrives in the Hostinger mailboxes. Read and answer it in Hostinger
              webmail or your email app. Sending branded emails from this portal still works, and earlier messages stay below.
            </p>
          </div>
          <a
            href="https://mail.hostinger.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-bold text-paper hover:bg-ink-raised"
          >
            Open Hostinger webmail
          </a>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex max-w-full overflow-x-auto rounded-full border border-line bg-white p-1" role="tablist" aria-label="Address">
          {["all", ...SENDERS].map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mailbox === m}
              onClick={() => setMailbox(m)}
              className={cn("inline-flex min-h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 text-sm font-bold transition-colors sm:px-4", mailbox === m ? "bg-ink text-paper" : "text-stone hover:text-ink")}
            >
              {m === "all" ? (
                <>
                  All<span className="hidden sm:inline">&nbsp;addresses</span>
                </>
              ) : (
                `${m.split("@")[0]}@`
              )}
              {unread(m) > 0 && <span className={cn("rounded-full px-1.5 text-xs", mailbox === m ? "bg-brass text-ink" : "bg-brass-pale text-brass-ink")}>{unread(m)}</span>}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Folder">
          {FOLDERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={folder === f.id}
              onClick={() => setFolder(f.id)}
              className={cn("inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-bold transition-colors", folder === f.id ? "bg-brass-pale text-brass-ink" : "text-stone hover:bg-mist hover:text-ink")}
            >
              {f.label}
              <span className="text-xs font-normal opacity-80">{count(f)}</span>
            </button>
          ))}
        </div>
      </div>

      <div
        className="grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-3xl border border-line bg-white shadow-[0_20px_60px_-40px_rgba(20,24,31,0.45)] lg:grid-cols-[minmax(300px,400px)_minmax(0,1fr)]"
        style={{ height: "max(560px, calc(100dvh - 17rem))" }}
      >
        {/* Message list */}
        <div className={cn("min-h-0 flex-col border-line lg:flex lg:border-r", current ? "hidden" : "flex")}>
          {rows === null ? (
            <Loading />
          ) : shown.length === 0 ? (
            <div className="grid flex-1 place-items-center p-10 text-center">
              <div>
                <InboxIcon aria-hidden className="mx-auto size-10 text-line" />
                <p className="mt-3 font-bold text-ink">{rows.length ? "Nothing here" : "No email yet"}</p>
                <p className="mt-1 text-sm text-stone">{rows.length ? "Try another folder, address or search." : "Messages to clientservice@ and info@ appear here."}</p>
              </div>
            </div>
          ) : (
            <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto">
              {shown.map((r) => {
                const info = previews[r.id];
                const preview = (r.preview as string | undefined) ?? info?.preview;
                const files = (r.attachmentCount as number | undefined) ?? info?.attachmentCount ?? 0;
                const isNew = r.status === "new";
                const active = r.id === openId;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => open(r)}
                      aria-current={active ? "true" : undefined}
                      className={cn("relative flex w-full gap-3 px-4 py-3.5 text-left transition-colors", active ? "bg-brass-pale/60" : "hover:bg-mist/70")}
                    >
                      {active && <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-brass" />}
                      <Avatar name={String(r.name ?? "")} email={String(r.email ?? "")} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-2">
                          <span className={cn("min-w-0 flex-1 truncate text-[0.95rem] text-ink", isNew ? "font-bold" : "font-normal")}>{r.name || r.email}</span>
                          <span className={cn("shrink-0 text-xs", isNew ? "font-bold text-brass-ink" : "text-stone")}>{shortDate(r.createdAt as Timestamp)}</span>
                        </span>
                        <span className={cn("mt-0.5 block truncate text-sm", isNew ? "font-bold text-ink" : "text-ink/85")}>{r.subject}</span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-sm text-stone">
                          {r.status === "replied" && <Reply aria-label="Replied" className="size-3.5 shrink-0 text-brass-ink" />}
                          {files > 0 && <Paperclip aria-label={`${files} attachments`} className="size-3.5 shrink-0" />}
                          <span className="truncate">{preview ?? " "}</span>
                        </span>
                        {mailbox === "all" && <span className="mt-1.5 inline-block rounded-full bg-mist px-2 py-0.5 text-[0.7rem] font-bold text-stone">{String(r.mailbox).split("@")[0]}@</span>}
                      </span>
                      {isNew && <span aria-label="Unread" className="mt-2 size-2 shrink-0 rounded-full bg-brass" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Reading pane */}
        <div className={cn("min-h-0 flex-col lg:flex", current ? "flex" : "hidden")}>
          {current ? (
            <Reader
              key={current.id}
              row={current}
              role={role}
              replies={(emails.rows ?? []).filter((e) => e.requestCol === "inbox" && e.requestId === current.id)}
              onBack={() => setOpenId(null)}
              onCompose={setCompose}
              onViewSent={setSent}
              toast={toast}
              confirmDelete={() =>
                dialog.confirm({ title: "Delete this email?", message: `The email from ${current.name || current.email} and its attachments are deleted permanently. This cannot be undone.`, confirmLabel: "Delete email", danger: true })
              }
            />
          ) : (
            <div className="grid flex-1 place-items-center bg-mist/30 p-10 text-center">
              <div>
                <span className="mx-auto grid size-16 place-items-center rounded-full bg-white text-brass-ink shadow-sm ring-1 ring-line">
                  <Mail aria-hidden className="size-7" />
                </span>
                <p className="font-serif-display mt-4 text-2xl text-ink">Select an email to read</p>
                <p className="mt-1 text-sm text-stone">Reply, forward or archive it from here.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <EmailComposer target={compose} onClose={() => setCompose(null)} />
      <SentEmail row={sent} onClose={() => setSent(null)} />
    </div>
  );
}

/* ---------- reading pane ---------- */

function Reader({
  row, role, replies, onBack, onCompose, onViewSent, toast, confirmDelete,
}: {
  row: Row;
  role: string;
  replies: Row[];
  onBack: () => void;
  onCompose: (t: ComposeTarget) => void;
  onViewSent: (r: Row) => void;
  toast: (kind: "ok" | "error", text: string) => void;
  confirmDelete: () => Promise<boolean>;
}) {
  const [parsed, setParsed] = useState<Parsed | null | "error">(null);
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState<Attachment | null>(null);

  useEffect(() => {
    let live = true;
    parseMessage(row.id)
      .then((p) => live && setParsed(p))
      .catch(() => live && setParsed("error"));
    return () => {
      live = false;
    };
  }, [row.id]);

  const p = parsed && parsed !== "error" ? parsed : null;
  const from = row.fromName ? `${row.fromName} <${row.fromAddress}>` : String(row.fromAddress ?? row.email);
  const when = p?.date ?? (row.createdAt as Timestamp | undefined)?.toDate?.() ?? null;
  const whenText = when ? when.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "";
  const others = p ? [...p.to, ...p.cc].map((a) => (a.address ?? "").toLowerCase()).filter((a) => a && !SENDERS.some((s) => s === a)) : [];

  const original = (): Original => ({
    replyHeader: `On ${whenText}, ${from} wrote:`,
    forwardHeader: [
      "Forwarded message",
      `From: ${from}`,
      `Date: ${whenText}`,
      `Subject: ${row.subject}`,
      `To: ${p ? p.to.map(label).join(", ") : row.mailbox}`,
      ...(p?.cc.length ? [`Cc: ${p.cc.map(label).join(", ")}`] : []),
    ].join("\n"),
    text: p?.text ?? "",
    to: p ? p.to.map((a) => a.address ?? "").filter(Boolean) : [],
    cc: p ? p.cc.map((a) => a.address ?? "").filter(Boolean) : [],
    // Programs and scripts are not forwarded; the email service refuses them, and they are rarely safe.
    files: p?.attachments.filter((a) => !a.risky).map((a) => ({ name: a.name, type: a.type, blob: a.blob })),
  });
  const compose = (mode: "reply" | "replyAll" | "forward") => onCompose({ col: "inbox", row, mode, original: original() });

  const setStatus = async (status: string, done: string, close = false) => {
    setBusy(true);
    try {
      await patchDoc("inbox", row.id, { status });
      toast("ok", done);
      if (close) onBack();
    } catch (e) {
      toast("error", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const erase = async () => {
    if (!(await confirmDelete())) return;
    setBusy(true);
    try {
      await deleteDoc("inbox", row.id);
      cache.delete(row.id);
      toast("ok", "Email deleted");
      onBack();
    } catch (e) {
      toast("error", (e as Error).message);
      setBusy(false);
    }
  };

  const downloadAll = useCallback(() => {
    if (!p) return;
    p.attachments.forEach((a, i) =>
      setTimeout(() => {
        const link = document.createElement("a");
        link.href = a.url;
        link.download = a.name;
        link.click();
      }, i * 350),
    );
  }, [p]);

  const preview = (a: Attachment) => {
    if (a.image) return setViewing(a);
    window.open(a.url, "_blank", "noopener");
  };
  const canPreview = (a: Attachment) => !a.risky && (a.image || a.type === "application/pdf" || a.type.startsWith("text/plain"));
  const totalSize = p?.attachments.reduce((n, a) => n + a.size, 0) ?? 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <button type="button" onClick={onBack} aria-label="Back to the list" className="grid size-10 place-items-center rounded-full hover:bg-mist lg:hidden">
          <ArrowLeft aria-hidden className="size-5" />
        </button>
        <Btn variant="gold" onClick={() => compose("reply")}>
          <Reply aria-hidden className="size-4" /> Reply
        </Btn>
        {others.length > 0 && (
          <Btn variant="ghost" onClick={() => compose("replyAll")}>
            <ReplyAll aria-hidden className="size-4" /> Reply all
          </Btn>
        )}
        <Btn variant="ghost" onClick={() => compose("forward")} disabled={parsed === null}>
          <Forward aria-hidden className="size-4" /> Forward
        </Btn>
        <span className="ml-auto flex items-center gap-1">
          <IconAction label="Mark as unread" onClick={() => setStatus("new", "Marked as unread", true)} disabled={busy}>
            <MailOpen aria-hidden className="size-[18px]" />
          </IconAction>
          {row.status === "archived" ? (
            <IconAction label="Move to inbox" onClick={() => setStatus("read", "Moved to the inbox")} disabled={busy}>
              <ArchiveRestore aria-hidden className="size-[18px]" />
            </IconAction>
          ) : (
            <IconAction label="Archive" onClick={() => setStatus("archived", "Archived", true)} disabled={busy}>
              <Archive aria-hidden className="size-[18px]" />
            </IconAction>
          )}
          {role === "owner" && (
            <IconAction label="Delete" onClick={erase} disabled={busy} danger>
              <Trash2 aria-hidden className="size-[18px]" />
            </IconAction>
          )}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <article className="mx-auto max-w-4xl px-4 py-6 sm:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-mist px-2.5 py-1 text-xs font-bold text-stone">{String(row.mailbox)}</span>
            <Chip status={row.status} />
          </div>
          <h2 className="font-serif-display mt-3 text-3xl leading-tight text-ink sm:text-[2.1rem]">{row.subject}</h2>

          <div className="mt-6 flex items-start gap-3.5">
            <Avatar name={String(row.name ?? "")} email={String(row.email ?? "")} size={46} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-ink">
                  <span className="font-bold">{row.fromName || row.fromAddress}</span>
                  {row.fromName && <span className="ml-1.5 text-sm text-stone">&lt;{row.fromAddress}&gt;</span>}
                </p>
                <p className="text-sm text-stone">{whenText}</p>
              </div>
              <p className="mt-0.5 text-sm text-stone">
                to {p && p.to.length ? p.to.map((a) => a.address).join(", ") : String(row.mailbox)}
                {p && p.cc.length > 0 && <>, cc {p.cc.map((a) => a.address).join(", ")}</>}
              </p>
              {row.email !== row.fromAddress && <p className="mt-0.5 text-sm text-stone">Replies go to {row.email}</p>}
            </div>
          </div>

          {parsed === null ? (
            <Loading />
          ) : parsed === "error" ? (
            <p className="mt-6 rounded-2xl border border-danger/30 bg-danger/5 p-5 text-sm text-danger">This email could not be opened. Close it and try again.</p>
          ) : (
            <>
              {parsed.attachments.length > 0 && (
                <section className="mt-6 rounded-2xl border border-line bg-mist/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-sm font-bold text-ink">
                      <Paperclip aria-hidden className="size-4 text-brass-ink" />
                      {parsed.attachments.length} {parsed.attachments.length === 1 ? "attachment" : "attachments"}
                      <span className="font-normal text-stone">{fileSize(totalSize)}</span>
                    </p>
                    {parsed.attachments.length > 1 && (
                      <button type="button" onClick={downloadAll} className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-brass-ink hover:bg-white">
                        <Download aria-hidden className="size-4" /> Download all
                      </button>
                    )}
                  </div>
                  <ul className="mt-3 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                    {parsed.attachments.map((a) => (
                      <li key={a.url} className="overflow-hidden rounded-xl border border-line bg-white">
                        {a.image ? (
                          <button type="button" onClick={() => preview(a)} className="block h-28 w-full bg-mist" aria-label={`Preview ${a.name}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={a.url} alt="" className="size-full object-cover" />
                          </button>
                        ) : (
                          <div className="flex h-28 items-center justify-center bg-mist/50">
                            <TypeIcon a={a} className="size-14" />
                          </div>
                        )}
                        <div className="p-3">
                          <p className="truncate text-sm font-bold text-ink" title={a.name}>
                            {a.name}
                          </p>
                          <p className="text-xs text-stone">
                            {fileSize(a.size)}
                            {a.ext && <> &middot; {a.ext.toUpperCase()}</>}
                          </p>
                          {a.risky && (
                            <p className="mt-1.5 flex items-start gap-1 text-xs font-bold text-danger">
                              <ShieldAlert aria-hidden className="mt-px size-3.5 shrink-0" /> Program or web file. Open only if you expected it.
                            </p>
                          )}
                          <div className="mt-2.5 flex gap-1.5">
                            {canPreview(a) && (
                              <button type="button" onClick={() => preview(a)} className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-line text-xs font-bold text-ink hover:border-ink/40">
                                <Eye aria-hidden className="size-3.5" /> Preview
                              </button>
                            )}
                            <a href={a.url} download={a.name} className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-ink text-xs font-bold text-paper hover:bg-ink-raised">
                              <Download aria-hidden className="size-3.5" /> Download
                            </a>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <div className="mt-6">
                {parsed.html ? (
                  <>
                    <EmailFrame title="Received email" html={parsed.html} sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox" className="rounded-2xl border border-line bg-white" />
                    <p className="mt-2 text-xs text-stone">Pictures hosted on other websites are not loaded, so senders cannot see when an email is opened.</p>
                  </>
                ) : (
                  <div className="whitespace-pre-wrap break-words rounded-2xl border border-line bg-white p-6 leading-relaxed text-ink">{parsed.text || "This email has no text."}</div>
                )}
              </div>
            </>
          )}

          {replies.length > 0 && (
            <section className="mt-8">
              <p className="text-sm font-bold text-ink">Conversation</p>
              <ol className="mt-3 grid gap-3 border-l-2 border-brass/40 pl-4">
                {replies.map((e) => (
                  <li key={e.id}>
                    <button type="button" onClick={() => onViewSent(e)} className="flex w-full items-start gap-3 rounded-2xl border border-line bg-white p-4 text-left transition-colors hover:border-ink/30">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-brass-light">RT</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-bold text-ink">You replied, from {e.from}</span>
                          <span className="text-xs text-stone">{fmtTs(e.createdAt as Timestamp)}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-sm text-stone">
                          {e.subject}, by {e.sentByName}
                          {e.attachments?.length ? `, ${e.attachments.length} ${e.attachments.length === 1 ? "file" : "files"}` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </article>
      </div>

      <AnimatePresence>{viewing && <Lightbox a={viewing} onClose={() => setViewing(null)} />}</AnimatePresence>
    </div>
  );
}

function IconAction({ label: text, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={text}
      title={text}
      className={cn("grid size-10 place-items-center rounded-full text-stone transition-colors disabled:opacity-40", danger ? "hover:bg-danger/10 hover:text-danger" : "hover:bg-mist hover:text-ink")}
    >
      {children}
    </button>
  );
}

/** A picture attachment, full size. */
function Lightbox({ a, onClose }: { a: Attachment; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", k, true);
    return () => window.removeEventListener("keydown", k, true);
  }, [onClose]);
  return (
    <motion.div role="dialog" aria-modal="true" aria-label={a.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[85] flex flex-col bg-ink/90 backdrop-blur-sm">
      <div className="flex items-center gap-3 px-4 py-3 text-paper sm:px-6">
        <p className="min-w-0 flex-1 truncate font-bold">{a.name}</p>
        <span className="text-sm text-stone-dark">{fileSize(a.size)}</span>
        <a href={a.url} download={a.name} className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-brass px-4 text-sm font-bold text-ink hover:bg-brass-light">
          <Download aria-hidden className="size-4" /> Download
        </a>
        <button type="button" onClick={onClose} aria-label="Close" className="grid size-10 place-items-center rounded-full hover:bg-white/10">
          <X aria-hidden className="size-5" />
        </button>
      </div>
      <button type="button" onClick={onClose} aria-label="Close" className="grid min-h-0 flex-1 cursor-zoom-out place-items-center p-4 sm:p-10">
        <motion.img initial={{ scale: 0.96 }} animate={{ scale: 1 }} src={a.url} alt={a.name} className="max-h-full max-w-full rounded-lg object-contain shadow-2xl" />
      </button>
    </motion.div>
  );
}
