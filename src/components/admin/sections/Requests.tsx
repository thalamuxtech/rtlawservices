"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Download, Mail, Phone, Send, Trash2 } from "lucide-react";
import { adminPost, deleteDoc, patchDoc, type Timestamp } from "@/lib/api";
import { cn } from "@/lib/utils";
import { AreaIn, Btn, Chip, Empty, fmtTs, Loading, Panel, Search, SectionHeader, TextIn, useCollection, useToast, type Row } from "../kit";

type Config = {
  col: "evaluations" | "bookings" | "messages";
  title: string;
  lede: string;
  stages: string[];
  subtitle: (r: Row) => string;
  details: (r: Row) => [string, string][];
};

const label = (k: string) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
const show = (v: unknown) => (Array.isArray(v) ? v.join(", ") : typeof v === "string" ? v : v == null ? "" : String(v));

export const EVALUATIONS: Config = {
  col: "evaluations",
  title: "Free evaluations",
  lede: "Questionnaires submitted from the free evaluation page, with any attached CV.",
  stages: ["new", "reviewing", "evaluated", "consultation-booked", "retained", "not-a-fit"],
  subtitle: (r) => `${r.track === "professional" ? "Professional" : "Family"}, born in ${r.birthCountry ?? "unknown"}`,
  details: (r) => [
    ["Track", r.track === "professional" ? "Professional or employer petition" : "Family, citizenship or problem case"],
    ["Country of birth", r.birthCountry],
    ...Object.entries((r.answers ?? {}) as Record<string, unknown>)
      .filter(([, v]) => show(v))
      .map(([k, v]) => [label(k), show(v)] as [string, string]),
    ["Received", fmtTs(r.createdAt as Timestamp)],
  ],
};

export const BOOKINGS: Config = {
  col: "bookings",
  title: "Consultations",
  lede: "Consultation requests from the booking page. Confirm each by email after the conflict check.",
  stages: ["new", "confirmed", "held", "retained", "referred", "not-a-fit", "no-show", "cancelled"],
  subtitle: (r) => `${r.matterLabel}, ${fmtTs(r.start as Timestamp)} ET`,
  details: (r) => [
    ["Matter", r.matterLabel],
    ["When (Eastern)", `${fmtTs(r.start as Timestamp)}, ${r.durationMin} minutes`],
    ["Client's time", `${fmtTs(r.start as Timestamp, r.visitorTz)} (${r.visitorTz})`],
    ["Format", r.mode],
    ["Attorney", r.attorney],
    ["Country", r.country],
    ["Language", r.language],
    ["Other parties", r.otherParties || "None given"],
    ["Notes", r.notes || "None"],
    ["Source", r.source || "Not given"],
    ["Received", fmtTs(r.createdAt as Timestamp)],
  ],
};

export const MESSAGES: Config = {
  col: "messages",
  title: "Messages",
  lede: "Messages from the contact form.",
  stages: ["new", "replied", "closed"],
  subtitle: (r) => `${r.topic}, ${fmtTs(r.createdAt as Timestamp)}`,
  details: (r) => [
    ["Topic", r.topic],
    ["Message", r.message],
    ["Received", fmtTs(r.createdAt as Timestamp)],
  ],
};

export function Requests({ cfg, rows, role }: { cfg: Config; rows: Row[] | null; role?: string }) {
  const toast = useToast();
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const current = rows?.find((r) => r.id === openId);

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: rows?.length ?? 0 };
    rows?.forEach((r) => (m[r.status] = (m[r.status] ?? 0) + 1));
    return m;
  }, [rows]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => (filter === "all" || r.status === filter) && (!t || `${r.name} ${r.email} ${r.phone ?? ""}`.toLowerCase().includes(t)));
  }, [rows, filter, q]);

  const update = async (patch: Record<string, unknown>, done: string) => {
    if (!current) return;
    setBusy(true);
    try {
      // The server releases a booking's time when its status means the meeting will not happen.
      const { released } = await patchDoc(cfg.col, current.id, patch);
      toast("ok", released ? `${done}. The time is open for booking again.` : done);
    } catch {
      toast("error", "Could not save. Check your connection and permissions.");
    } finally {
      setBusy(false);
    }
  };

  // Owners can erase a request, for example when a client asks for their data to be deleted.
  const erase = async () => {
    if (!current || !confirm(`Delete this request from ${current.name} permanently, including any CV? This cannot be undone.`)) return;
    setBusy(true);
    try {
      // The server also removes any CV, booked times and sent emails.
      await deleteDoc(cfg.col, current.id);
      setOpenId(null);
      toast("ok", "Request deleted");
    } catch {
      toast("error", "Could not delete. Only owners can delete requests.");
    } finally {
      setBusy(false);
    }
  };


  return (
    <div className="grid gap-6">
      <SectionHeader title={cfg.title} lede={cfg.lede} action={<Search value={q} onChange={setQ} placeholder="Search name, email or phone" />} />

      <div className="flex flex-wrap gap-2">
        {["all", ...cfg.stages].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-bold capitalize transition-colors",
              filter === s ? "border-ink bg-ink text-paper" : "border-line bg-white text-stone hover:text-ink",
            )}
          >
            {s.replace(/-/g, " ")}
            <span className={cn("rounded-full px-1.5 text-xs", filter === s ? "bg-paper/20" : "bg-mist")}>{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      {rows === null ? (
        <Loading />
      ) : list.length === 0 ? (
        <Empty text={rows.length ? "Nothing matches this filter." : "No submissions yet. New ones appear here instantly."} />
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-line bg-white">
          {list.map((r, i) => (
            <motion.li key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.025 }} className="border-b border-line last:border-0">
              <button
                type="button"
                onClick={() => {
                  setOpenId(r.id);
                  setNote(r.staffNote ?? "");
                }}
                className="grid w-full gap-1 px-5 py-4 text-left transition-colors hover:bg-mist sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <span className="min-w-0">
                  <span className="block truncate font-bold text-ink">{r.name}</span>
                  <span className="block truncate text-sm text-stone">{cfg.subtitle(r)}</span>
                </span>
                <span className="flex items-center gap-3">
                  {r.file && <span className="rounded-full bg-mist px-2.5 py-1 text-xs font-bold text-stone">CV</span>}
                  <Chip status={r.status} />
                </span>
              </button>
            </motion.li>
          ))}
        </ul>
      )}

      <Panel
        open={!!current}
        title={current?.name ?? ""}
        onClose={() => setOpenId(null)}
        wide
        footer={
          current && (
            <>
              {role === "owner" && (
                <Btn variant="danger" busy={busy} onClick={erase} className="mr-auto">
                  <Trash2 aria-hidden className="size-4" /> Delete
                </Btn>
              )}
              <Btn variant="ghost" onClick={() => setOpenId(null)}>
                Close
              </Btn>
              <Btn busy={busy} onClick={() => update({ staffNote: note.slice(0, 4000) }, "Note saved")}>
                Save note
              </Btn>
            </>
          )
        }
      >
        {current && (
          <div className="grid gap-6">
            <div className="flex flex-wrap gap-2">
              <a href={`mailto:${current.email}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-bold text-ink hover:border-ink/40">
                <Mail aria-hidden className="size-4" /> Open in my email app
              </a>
              {current.phone && (
                <a href={`tel:${current.phone}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-bold text-ink">
                  <Phone aria-hidden className="size-4" /> {current.phone}
                </a>
              )}
              {current.file && (
                <a href={`/api/admin/cv/${encodeURIComponent(current.id)}`} download={current.file.name} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-bold text-ink hover:border-ink/40">
                  <Download aria-hidden className="size-4" /> {current.file.name}
                </a>
              )}
            </div>

            <div>
              <p className="text-sm font-bold text-ink">Status</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {cfg.stages.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => update({ status: s }, `Marked ${s.replace(/-/g, " ")}`)}
                    className={cn(
                      "min-h-10 rounded-full border px-4 text-sm font-bold capitalize transition-colors",
                      current.status === s ? "border-ink bg-ink text-paper" : "border-line bg-white text-stone hover:border-ink/40 hover:text-ink",
                    )}
                  >
                    {s.replace(/-/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            <dl className="overflow-hidden rounded-2xl border border-line">
              <Detail k="Email" v={current.email} />
              {cfg.details(current).map(([k, v]) => (
                <Detail key={k} k={k} v={v} />
              ))}
            </dl>

            <AreaIn label="Internal note" hint="Visible to staff only." value={note} onChange={setNote} rows={4} />

            <EmailClient col={cfg.col} request={current} />
          </div>
        )}
      </Panel>
    </div>
  );
}

function Detail({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid gap-1 border-b border-line px-4 py-3 last:border-0 odd:bg-mist/40 sm:grid-cols-[170px_1fr]">
      <dt className="text-sm font-bold text-stone">{k}</dt>
      <dd className="whitespace-pre-wrap break-words text-ink">{v || "None"}</dd>
    </div>
  );
}

/** Writes to the client from the portal. Replies go to clientservice@, which forwards to the firm's inbox. */
function EmailClient({ col, request }: { col: Config["col"]; request: Row }) {
  const toast = useToast();
  const emails = useCollection("emails");
  const [subject, setSubject] = useState("Your enquiry with RT Law Services");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const sent = (emails.rows ?? []).filter((e) => e.requestId === request.id);

  const send = async () => {
    if (!subject.trim() || !text.trim()) return toast("error", "Write a subject and a message.");
    setBusy(true);
    try {
      await adminPost("email", { col, id: request.id, subject: subject.trim(), text: text.trim() });
      setText("");
      toast("ok", `Email sent to ${request.email}`);
    } catch (e) {
      toast("error", (e as Error).message || "The email could not be sent.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="grid gap-4 rounded-2xl border border-line bg-white p-5">
      <h3 className="font-bold text-ink">Email {request.name || "the client"}</h3>
      <p className="-mt-2 text-sm text-stone">
        Sent from clientservice@rtlawservices.com to {request.email}. The client&apos;s reply arrives in the firm&apos;s inbox.
      </p>
      <TextIn label="Subject" value={subject} onChange={setSubject} />
      <AreaIn label="Message" value={text} onChange={setText} rows={7} />
      <Btn busy={busy} onClick={send} className="w-fit">
        <Send aria-hidden className="size-4" /> Send email
      </Btn>
      {sent.length > 0 && (
        <div>
          <p className="text-sm font-bold text-ink">Sent from the portal</p>
          <ul className="mt-2 grid gap-2">
            {sent.map((e) => (
              <li key={e.id} className="rounded-xl bg-mist/60 px-4 py-3 text-sm">
                <span className="block font-bold text-ink">{e.subject}</span>
                <span className="block text-stone">
                  {fmtTs(e.createdAt as Timestamp)}, by {e.sentByName}
                </span>
                <span className="mt-1 block whitespace-pre-wrap text-ink">{e.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
