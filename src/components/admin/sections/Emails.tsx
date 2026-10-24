"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Mail, PenLine, ShieldAlert } from "lucide-react";
import { adminDelete, api, getDoc, type Timestamp } from "@/lib/api";
import { EmailComposer, EmailFrame, type ComposeTarget } from "../EmailComposer";
import { Btn, Empty, fmtTs, Loading, Panel, Search, SectionHeader, useDialog, useToast, type Row } from "../kit";

const recipients = (r: Row) => [...(r.to ?? []), ...(r.cc ?? [])].join(", ") || String(r.to ?? "");

/** Every email sent from the portal, newest first, with a way to write a new one. */
export function Emails({ rows }: { rows: Row[] | null }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Row | null>(null);
  const [compose, setCompose] = useState<ComposeTarget>(null);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => !t || `${r.subject} ${recipients(r)} ${r.toName ?? ""} ${r.sentByName ?? ""}`.toLowerCase().includes(t));
  }, [rows, q]);

  return (
    <div className="grid gap-6">
      <SectionHeader
        title="Emails"
        lede="Branded emails sent to clients from this portal. Replies go to the Reply-to address chosen for each email."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Search value={q} onChange={setQ} placeholder="Search subject or recipient" />
            <Btn variant="gold" onClick={() => setCompose({})}>
              <PenLine aria-hidden className="size-4" /> New email
            </Btn>
          </div>
        }
      />
      <DeliveryBlocks />
      {rows === null ? (
        <Loading />
      ) : list.length === 0 ? (
        <Empty text={rows.length ? "No email matches this search." : "No emails sent yet."} action={<Btn onClick={() => setCompose({})}>Write the first one</Btn>} />
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-line bg-white">
          {list.map((r) => (
            <li key={r.id} className="border-b border-line last:border-0">
              <button type="button" onClick={() => setOpen(r)} className="grid w-full gap-1 px-5 py-4 text-left transition-colors hover:bg-mist sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <span className="min-w-0">
                  <span className="block truncate font-bold text-ink">{r.subject}</span>
                  <span className="block truncate text-sm text-stone">To {recipients(r)}</span>
                </span>
                <span className="text-sm text-stone">
                  {fmtTs(r.createdAt as Timestamp)}, {r.sentByName}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <SentEmail row={open} onClose={() => setOpen(null)} />
      <EmailComposer target={compose} onClose={() => setCompose(null)} />
    </div>
  );
}

/** Shows a sent email exactly as the client received it. */
export function SentEmail({ row, onClose }: { row: Row | null; onClose: () => void }) {
  const [html, setHtml] = useState<string | null>(null);
  useEffect(() => {
    if (!row) return;
    let live = true;
    getDoc("emails", row.id)
      .then((d) => live && setHtml(String(d?.html ?? "")))
      .catch(() => live && setHtml(""));
    return () => {
      live = false;
      setHtml(null);
    };
  }, [row]);

  return (
    <Panel open={!!row} title={row?.subject ?? ""} onClose={onClose} wide>
      {row && (
        <div className="grid gap-5">
          <dl className="grid gap-1 rounded-2xl border border-line bg-white p-4 text-sm">
            <Line k="To" v={(row.to ?? []).join(", ")} />
            {row.cc?.length > 0 && <Line k="Cc" v={row.cc.join(", ")} />}
            {row.bcc?.length > 0 && <Line k="Bcc" v={row.bcc.join(", ")} />}
            <Line k="Sent" v={`${fmtTs(row.createdAt as Timestamp)} by ${row.sentByName}`} />
          </dl>
          {html === null ? (
            <Loading />
          ) : html ? (
            <EmailFrame title="Sent email" html={html} className="rounded-2xl border border-line bg-white" />
          ) : (
            <div className="flex items-start gap-3 rounded-2xl border border-line bg-white p-5">
              <Mail aria-hidden className="mt-0.5 size-5 text-brass-ink" />
              <p className="whitespace-pre-wrap text-ink">{row.text || "This email was sent before the branded layout and has no stored copy."}</p>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[3.5rem_1fr] gap-2">
      <dt className="font-bold text-stone">{k}</dt>
      <dd className="break-words text-ink">{v}</dd>
    </div>
  );
}

type Block = { email: string; reason: string; blockedAt: string };

/**
 * Addresses the email service has stopped delivering to, usually after an
 * email bounced. Emails to them look sent but never arrive, so they are listed
 * here with a way to lift the block once the address works again.
 */
function DeliveryBlocks() {
  const toast = useToast();
  const dialog = useDialog();
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(
    () =>
      api<{ blocked: Block[] }>("/api/admin/mail-blocks")
        .then((r) => {
          setBlocks(r.blocked);
          setError("");
        })
        .catch((e: Error) => setError(e.message)),
    [],
  );
  useEffect(() => {
    load();
  }, [load]);

  const unblock = async (b: Block) => {
    const ok = await dialog.confirm({
      title: "Deliver to this address again?",
      message: `${b.email} was blocked because: ${b.reason}. Unblock it only if the mailbox now exists and accepts mail, or it will be blocked again.`,
      confirmLabel: "Unblock",
    });
    if (!ok) return;
    setBusy(b.email);
    try {
      await adminDelete(`mail-blocks/${encodeURIComponent(b.email)}`);
      toast("ok", `${b.email} can receive email again`);
      await load();
    } catch (e) {
      toast("error", (e as Error).message);
    } finally {
      setBusy("");
    }
  };

  if (error) return <p className="rounded-2xl border border-line bg-white px-5 py-4 text-sm text-stone">Delivery blocks could not be checked: {error}</p>;
  if (!blocks?.length) return null;
  return (
    <section className="rounded-2xl border border-danger/30 bg-danger/5 p-5">
      <div className="flex items-start gap-3">
        <ShieldAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-danger" />
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-ink">Emails to these addresses are not being delivered</h2>
          <p className="mt-1 text-sm text-stone">
            The email service blocked them, usually after a message bounced. Emails to them look sent here but never arrive. Unblock an address once it can receive mail.
          </p>
          <ul className="mt-4 grid gap-2">
            {blocks.map((b) => (
              <li key={b.email} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-ink">{b.email}</span>
                  <span className="block text-xs text-stone">
                    {b.reason}
                    {b.blockedAt && `, since ${new Date(b.blockedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`}
                  </span>
                </span>
                <Btn variant="ghost" busy={busy === b.email} onClick={() => unblock(b)}>
                  Unblock
                </Btn>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
