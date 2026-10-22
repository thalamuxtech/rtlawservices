"use client";

// Mail received at clientservice@ and info@. The Worker keeps each message as
// it arrived; it is read and parsed here, in the browser. Scripts in a message
// never run, and pictures hosted elsewhere are not loaded, so opening an email
// cannot run code or tell the sender it was read.

import { useEffect, useMemo, useState } from "react";
import { Archive, ArchiveRestore, Download, Paperclip, Reply, Trash2 } from "lucide-react";
import { deleteDoc, patchDoc, type Timestamp } from "@/lib/api";
import { SENDERS } from "@/lib/email-template";
import { cn } from "@/lib/utils";
import { EmailComposer, EmailFrame, type ComposeTarget } from "../EmailComposer";
import { Btn, Chip, Empty, fmtTs, Loading, Panel, type Row, Search, SectionHeader, useCollection, useDialog, useToast } from "../kit";
import { SentEmail } from "./Emails";

type Parsed = {
  html: string;
  text: string;
  to: string;
  cc: string;
  date: string;
  attachments: { name: string; type: string; size: number; url: string }[];
};

const STATUSES = ["all", "new", "read", "replied", "archived"] as const;
const short = (mailbox: string) => mailbox.split("@")[0];
const list = (v?: { name?: string; address?: string }[]) => (v ?? []).map((a) => (a.name ? `${a.name} <${a.address}>` : a.address)).join(", ");

const toBase64 = (buf: ArrayBuffer) => {
  let s = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};

/** Reads a received message: its text, its HTML with inline pictures, and its attachments. */
async function parseMessage(id: string): Promise<Parsed> {
  const res = await fetch(`/api/admin/inbox-raw/${encodeURIComponent(id)}`, { credentials: "same-origin" });
  if (!res.ok) throw new Error("The message could not be loaded.");
  const { default: PostalMime } = await import("postal-mime");
  const email = await PostalMime.parse(await res.arrayBuffer());
  const attachments = email.attachments ?? [];
  let html = email.html ?? "";
  // Pictures sent inside the email ("cid:" links) are shown from the message itself.
  for (const a of attachments) {
    if (!a.contentId) continue;
    const cid = a.contentId.replace(/^<|>$/g, "");
    const content = typeof a.content === "string" ? new TextEncoder().encode(a.content).buffer : (a.content as ArrayBuffer);
    html = html.split(`cid:${cid}`).join(`data:${a.mimeType};base64,${toBase64(content as ArrayBuffer)}`);
  }
  // Links open in a new tab instead of inside the preview.
  if (html) html = `<base target="_blank">${html}`;
  return {
    html,
    text: email.text ?? "",
    to: list(email.to),
    cc: list(email.cc),
    date: email.date ? new Date(email.date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "",
    attachments: attachments
      .filter((a) => a.disposition === "attachment" || !a.contentId)
      .map((a) => {
        const blob = new Blob([a.content as BlobPart], { type: a.mimeType || "application/octet-stream" });
        return { name: a.filename || "attachment", type: a.mimeType, size: blob.size, url: URL.createObjectURL(blob) };
      }),
  };
}

export function Inbox({ rows, role }: { rows: Row[] | null; role: string }) {
  const toast = useToast();
  const dialog = useDialog();
  const emails = useCollection("emails");
  const [mailbox, setMailbox] = useState("all");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [parsed, setParsed] = useState<Parsed | null | "error">(null);
  const [compose, setCompose] = useState<ComposeTarget>(null);
  const [sent, setSent] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const current = rows?.find((r) => r.id === openId);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (rows ?? []).filter(
      (r) =>
        (mailbox === "all" || r.mailbox === mailbox) &&
        (status === "all" ? r.status !== "archived" : r.status === status) &&
        (!t || `${r.name} ${r.email} ${r.subject}`.toLowerCase().includes(t)),
    );
  }, [rows, mailbox, status, q]);

  // Load and parse the message when it opens; mark a new one as read.
  useEffect(() => {
    if (!openId) return;
    let live = true;
    parseMessage(openId)
      .then((p) => live && setParsed(p))
      .catch(() => live && setParsed("error"));
    return () => {
      live = false;
      setParsed((p) => {
        if (p && p !== "error") p.attachments.forEach((a) => URL.revokeObjectURL(a.url));
        return null;
      });
    };
  }, [openId]);

  const open = (r: Row) => {
    setOpenId(r.id);
    if (r.status === "new") patchDoc("inbox", r.id, { status: "read" }).catch(() => {});
  };

  const setStatusOf = async (r: Row, s: string, done: string) => {
    setBusy(true);
    try {
      await patchDoc("inbox", r.id, { status: s });
      toast("ok", done);
    } catch (e) {
      toast("error", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const erase = async (r: Row) => {
    if (!(await dialog.confirm({ title: "Delete this email?", message: `The email from ${r.name || r.email} is deleted permanently. This cannot be undone.`, confirmLabel: "Delete email", danger: true }))) return;
    setBusy(true);
    try {
      await deleteDoc("inbox", r.id);
      setOpenId(null);
      toast("ok", "Email deleted");
    } catch (e) {
      toast("error", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const replies = (emails.rows ?? []).filter((e) => e.requestCol === "inbox" && e.requestId === openId);
  const count = (m: string) => (rows ?? []).filter((r) => r.status === "new" && (m === "all" || r.mailbox === m)).length;

  return (
    <div className="grid gap-6">
      <SectionHeader
        title="Inbox"
        lede="Email sent to clientservice@ and info@rtlawservices.com. Reply with a branded email from the same address."
        action={<Search value={q} onChange={setQ} placeholder="Search sender or subject" />}
      />

      <div className="flex flex-wrap items-center gap-2">
        {["all", ...SENDERS].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMailbox(m)}
            className={cn("inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-bold", mailbox === m ? "border-ink bg-ink text-paper" : "border-line bg-white text-stone hover:text-ink")}
          >
            {m === "all" ? "All addresses" : `${short(m)}@`}
            {count(m) > 0 && <span className={cn("rounded-full px-1.5 text-xs", mailbox === m ? "bg-brass text-ink" : "bg-brass-pale text-brass-ink")}>{count(m)}</span>}
          </button>
        ))}
        <span className="mx-1 hidden h-6 w-px bg-line sm:block" />
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={cn("min-h-10 rounded-full px-3 text-sm font-bold capitalize", status === s ? "bg-mist text-ink" : "text-stone hover:text-ink")}
          >
            {s === "all" ? "Open" : s}
          </button>
        ))}
      </div>

      {rows === null ? (
        <Loading />
      ) : shown.length === 0 ? (
        <Empty text={rows.length ? "Nothing matches this view." : "No email received yet. Messages to clientservice@ and info@ appear here."} />
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-line bg-white">
          {shown.map((r) => (
            <li key={r.id} className="border-b border-line last:border-0">
              <button type="button" onClick={() => open(r)} className="grid w-full gap-1 px-5 py-4 text-left transition-colors hover:bg-mist sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <span className="flex min-w-0 items-start gap-3">
                  <span aria-hidden className={cn("mt-2 size-2 shrink-0 rounded-full", r.status === "new" ? "bg-brass" : "bg-transparent")} />
                  <span className="min-w-0">
                    <span className={cn("block truncate text-ink", r.status === "new" ? "font-bold" : "font-normal")}>{r.name || r.email}</span>
                    <span className={cn("block truncate text-sm", r.status === "new" ? "text-ink" : "text-stone")}>{r.subject}</span>
                  </span>
                </span>
                <span className="flex items-center gap-3 pl-5 text-sm text-stone sm:pl-0">
                  <span className="rounded-full bg-mist px-2.5 py-1 text-xs font-bold">{short(String(r.mailbox))}@</span>
                  {fmtTs(r.createdAt as Timestamp)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Panel
        open={!!current}
        title={current?.subject ?? ""}
        onClose={() => setOpenId(null)}
        wide
        footer={
          current && (
            <>
              {role === "owner" && (
                <Btn variant="danger" busy={busy} onClick={() => erase(current)} className="mr-auto">
                  <Trash2 aria-hidden className="size-4" /> Delete
                </Btn>
              )}
              {current.status === "archived" ? (
                <Btn variant="ghost" busy={busy} onClick={() => setStatusOf(current, "read", "Moved back to the inbox")}>
                  <ArchiveRestore aria-hidden className="size-4" /> Unarchive
                </Btn>
              ) : (
                <Btn
                  variant="ghost"
                  busy={busy}
                  onClick={async () => {
                    await setStatusOf(current, "archived", "Archived");
                    setOpenId(null);
                  }}
                >
                  <Archive aria-hidden className="size-4" /> Archive
                </Btn>
              )}
              <Btn variant="gold" onClick={() => setCompose({ col: "inbox", row: current })}>
                <Reply aria-hidden className="size-4" /> Reply
              </Btn>
            </>
          )
        }
      >
        {current && (
          <div className="grid gap-5">
            <dl className="grid gap-1 rounded-2xl border border-line bg-white p-4 text-sm">
              <Line k="From" v={current.fromName ? `${current.fromName} <${current.fromAddress}>` : String(current.fromAddress ?? current.email)} />
              {current.email !== current.fromAddress && <Line k="Reply to" v={String(current.email)} />}
              <Line k="To" v={parsed && parsed !== "error" && parsed.to ? parsed.to : String(current.mailbox)} />
              {parsed && parsed !== "error" && parsed.cc && <Line k="Cc" v={parsed.cc} />}
              <Line k="Received" v={fmtTs(current.createdAt as Timestamp)} />
              <div className="pt-1">
                <Chip status={current.status} />
              </div>
            </dl>

            {parsed === null ? (
              <Loading />
            ) : parsed === "error" ? (
              <p className="rounded-2xl border border-danger/30 bg-danger/5 p-5 text-sm text-danger">This email could not be opened. Try again, or download it from Cloudflare R2 if it keeps failing.</p>
            ) : (
              <>
                {parsed.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {parsed.attachments.map((a) => (
                      <a key={a.url} href={a.url} download={a.name} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-bold text-ink hover:border-ink/40">
                        <Paperclip aria-hidden className="size-4" /> {a.name}
                        <span className="font-normal text-stone">{Math.max(1, Math.round(a.size / 1024))} KB</span>
                        <Download aria-hidden className="size-4 text-stone" />
                      </a>
                    ))}
                  </div>
                )}
                {parsed.html ? (
                  <>
                    <EmailFrame title="Received email" html={parsed.html} sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox" className="rounded-2xl border border-line bg-white" />
                    <p className="-mt-3 text-xs text-stone">Pictures hosted on other websites are not loaded, so senders cannot see when an email is opened.</p>
                  </>
                ) : (
                  <div className="whitespace-pre-wrap break-words rounded-2xl border border-line bg-white p-5 text-ink">{parsed.text || "This email has no text."}</div>
                )}
              </>
            )}

            {replies.length > 0 && (
              <div>
                <p className="text-sm font-bold text-ink">Your replies</p>
                <ul className="mt-2 grid gap-2">
                  {replies.map((e) => (
                    <li key={e.id}>
                      <button type="button" onClick={() => setSent(e)} className="w-full rounded-xl bg-mist/60 px-4 py-3 text-left text-sm hover:bg-mist">
                        <span className="block font-bold text-ink">{e.subject}</span>
                        <span className="block text-stone">
                          {fmtTs(e.createdAt as Timestamp)}, by {e.sentByName}, from {e.from}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Panel>

      <EmailComposer target={compose} onClose={() => setCompose(null)} />
      <SentEmail row={sent} onClose={() => setSent(null)} />
    </div>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[5rem_1fr] gap-2">
      <dt className="font-bold text-stone">{k}</dt>
      <dd className="break-words text-ink">{v}</dd>
    </div>
  );
}
