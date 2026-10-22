"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, PenLine } from "lucide-react";
import { getDoc, type Timestamp } from "@/lib/api";
import { EmailComposer, EmailFrame, type ComposeTarget } from "../EmailComposer";
import { Btn, Empty, fmtTs, Loading, Panel, Search, SectionHeader, type Row } from "../kit";

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
        lede="Branded emails sent to clients from this portal. Replies arrive in the firm's inbox."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Search value={q} onChange={setQ} placeholder="Search subject or recipient" />
            <Btn variant="gold" onClick={() => setCompose({})}>
              <PenLine aria-hidden className="size-4" /> New email
            </Btn>
          </div>
        }
      />
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
