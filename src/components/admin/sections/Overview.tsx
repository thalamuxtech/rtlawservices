"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { doc, onSnapshot, type Timestamp } from "firebase/firestore";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarClock, ClipboardCheck, Globe2, Inbox, Mail, Sparkles } from "lucide-react";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { fmtTs, Toggle, type Row } from "../kit";

type Props = {
  evaluations: Row[] | null;
  bookings: Row[] | null;
  messages: Row[] | null;
  go: (section: string) => void;
};

const BRASS = "#b1976b";
const INK = "#14181f";
const PIE = ["#b1976b", "#14181f", "#2f6b4f", "#33415c", "#7d6638", "#a9afb6", "#9b2c2c", "#c9b48a"];

const weekStart = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x.getTime();
};

/** Deterministic sample activity, used only when "Preview with sample activity" is on. */
function sampleRows(): { evaluations: Row[]; bookings: Row[]; messages: Row[] } {
  const now = Date.now();
  const mk = (n: number, seed: number, extra: (i: number) => Partial<Row>): Row[] =>
    Array.from({ length: n }, (_, i) => {
      const r = Math.abs(Math.sin(seed + i * 12.9898) * 43758.5453) % 1;
      const t = now - r * 84 * 86_400_000;
      return { id: `s${seed}-${i}`, createdAt: { toDate: () => new Date(t), toMillis: () => t } as unknown as Timestamp, ...extra(i) };
    });
  const statuses = ["new", "reviewing", "evaluated", "retained", "not-a-fit"];
  const matters = ["Family green cards", "Citizenship", "National Interest Waiver", "Extraordinary ability", "H-1B professionals", "Denied or delayed"];
  return {
    evaluations: mk(46, 1, (i) => ({ name: `Sample applicant ${i + 1}`, track: i % 3 ? "professional" : "family", status: statuses[i % 5] })),
    bookings: mk(38, 2, (i) => ({ name: `Sample client ${i + 1}`, matterLabel: matters[i % 6], status: ["new", "confirmed", "held", "retained"][i % 4] })),
    messages: mk(21, 3, (i) => ({ name: `Sample sender ${i + 1}`, topic: "A new matter", status: i % 2 ? "replied" : "new" })),
  };
}

export function Overview({ evaluations, bookings, messages, go }: Props) {
  const [sample, setSample] = useState(false);
  const [meta, setMeta] = useState<{ updatedAt?: Timestamp } | null>(null);
  const [build, setBuild] = useState<{ builtAt?: string } | null>(null);

  useEffect(() => onSnapshot(doc(db(), "meta", "content"), (s) => setMeta(s.data() ?? null)), []);
  useEffect(() => {
    fetch(`/build-meta.json?ts=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setBuild)
      .catch(() => setBuild(null));
  }, []);

  const data = useMemo(() => {
    if (sample) return sampleRows();
    return { evaluations: evaluations ?? [], bookings: bookings ?? [], messages: messages ?? [] };
  }, [sample, evaluations, bookings, messages]);

  const weeks = useMemo(() => {
    const out: { week: string; Evaluations: number; Consultations: number; Messages: number }[] = [];
    const first = weekStart(new Date()) - 11 * 7 * 86_400_000;
    for (let i = 0; i < 12; i++) {
      const t = first + i * 7 * 86_400_000;
      out.push({ week: new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" }), Evaluations: 0, Consultations: 0, Messages: 0 });
    }
    const add = (rows: Row[], key: "Evaluations" | "Consultations" | "Messages") =>
      rows.forEach((r) => {
        const ms = (r.createdAt as Timestamp | undefined)?.toMillis?.();
        if (!ms) return;
        const idx = Math.floor((weekStart(new Date(ms)) - first) / (7 * 86_400_000));
        if (idx >= 0 && idx < 12) out[idx][key] += 1;
      });
    add(data.evaluations, "Evaluations");
    add(data.bookings, "Consultations");
    add(data.messages, "Messages");
    return out;
  }, [data]);

  const byMatter = useMemo(() => {
    const m = new Map<string, number>();
    data.bookings.forEach((b) => m.set(b.matterLabel ?? "Other", (m.get(b.matterLabel ?? "Other") ?? 0) + 1));
    data.evaluations.forEach((e) => {
      const k = e.track === "professional" ? "Professional evaluation" : "Family evaluation";
      m.set(k, (m.get(k) ?? 0) + 1);
    });
    return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [data]);

  const pipeline = useMemo(() => {
    const m = new Map<string, number>();
    [...data.evaluations, ...data.bookings].forEach((r) => m.set(r.status ?? "new", (m.get(r.status ?? "new") ?? 0) + 1));
    return [...m.entries()].map(([name, value]) => ({ name: name.replace(/-/g, " "), value }));
  }, [data]);

  const [now] = useState(() => Date.now());
  const kpis = [
    { label: "New evaluation requests", value: data.evaluations.filter((r) => r.status === "new").length, icon: ClipboardCheck, go: "evaluations" },
    { label: "Consultation requests", value: data.bookings.filter((r) => r.status === "new").length, icon: CalendarClock, go: "bookings" },
    { label: "Unanswered messages", value: data.messages.filter((r) => r.status === "new").length, icon: Mail, go: "messages" },
    { label: "Requests in 30 days", value: [...data.evaluations, ...data.bookings, ...data.messages].filter((r) => ((r.createdAt as Timestamp | undefined)?.toMillis?.() ?? 0) > now - 30 * 86_400_000).length, icon: Inbox, go: "evaluations" },
  ];

  const recent = useMemo(
    () =>
      [
        ...data.evaluations.map((r) => ({ ...r, kind: "Evaluation", section: "evaluations" }) as Row),
        ...data.bookings.map((r) => ({ ...r, kind: "Consultation", section: "bookings" }) as Row),
        ...data.messages.map((r) => ({ ...r, kind: "Message", section: "messages" }) as Row),
      ]
        .sort((a, b) => ((b.createdAt as Timestamp)?.toMillis?.() ?? 0) - ((a.createdAt as Timestamp)?.toMillis?.() ?? 0))
        .slice(0, 8),
    [data],
  );

  const pending = meta?.updatedAt?.toMillis && build?.builtAt ? meta.updatedAt.toMillis() > new Date(build.builtAt).getTime() : false;

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif-display text-4xl text-ink">Overview</h1>
          <p className="mt-2 text-stone">Requests, pipeline and publishing at a glance. Figures update live.</p>
        </div>
        <Toggle label="Preview with sample activity" hint="Fills the charts with generated data. Nothing is saved." checked={sample} onChange={setSample} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.button
            type="button"
            key={k.label}
            onClick={() => go(k.go)}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.45 }}
            className="group rounded-2xl border border-line bg-white p-5 text-left transition-colors hover:border-ink/40"
          >
            <span className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-full bg-mist text-brass-ink transition-colors group-hover:bg-ink group-hover:text-brass-light">
                <k.icon aria-hidden className="size-5" />
              </span>
              {sample && <span className="rounded-full border border-brass-ink/40 px-2 text-xs font-bold text-brass-ink">Sample</span>}
            </span>
            <motion.span key={`${k.value}-${sample}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="font-serif-display mt-4 block text-5xl text-ink">
              {k.value}
            </motion.span>
            <span className="text-sm text-stone">{k.label}</span>
          </motion.button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card title="Requests per week" sub="Last 12 weeks">
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={weeks} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  {[["ev", BRASS], ["co", INK], ["me", "#2f6b4f"]].map(([id, c]) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid stroke="#e1e4e6" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#51565c" }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#51565c" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e1e4e6" }} />
                <Area type="monotone" dataKey="Evaluations" stroke={BRASS} strokeWidth={2.5} fill="url(#ev)" animationDuration={1200} />
                <Area type="monotone" dataKey="Consultations" stroke={INK} strokeWidth={2.5} fill="url(#co)" animationDuration={1400} />
                <Area type="monotone" dataKey="Messages" stroke="#2f6b4f" strokeWidth={2} fill="url(#me)" animationDuration={1600} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <Legend items={[["Evaluations", BRASS], ["Consultations", INK], ["Messages", "#2f6b4f"]]} />
        </Card>

        <Card title="Pipeline" sub="Evaluations and consultations by status">
          {pipeline.length ? (
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pipeline} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="88%" paddingAngle={2} animationDuration={1200}>
                    {pipeline.map((_, i) => (
                      <Cell key={i} fill={PIE[i % PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e1e4e6" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart />
          )}
          <Legend items={pipeline.map((p, i) => [`${p.name} (${p.value})`, PIE[i % PIE.length]])} />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card title="Demand by matter" sub="Consultation requests and evaluations">
          {byMatter.length ? (
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={byMatter} layout="vertical" margin={{ left: 20, right: 16 }}>
                  <CartesianGrid stroke="#e1e4e6" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#51565c" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12, fill: "#14181f" }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "#eff1f1" }} contentStyle={{ borderRadius: 12, border: "1px solid #e1e4e6" }} />
                  <Bar dataKey="value" name="Requests" radius={[0, 8, 8, 0]} fill={BRASS} animationDuration={1200} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart />
          )}
        </Card>

        <Card title="Recent activity" sub="Newest first">
          {recent.length ? (
            <ul className="divide-y divide-line">
              {recent.map((r, i) => (
                <motion.li key={`${r.kind}-${r.id}`} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                  <button type="button" onClick={() => !sample && go(r.section)} className="flex w-full items-center justify-between gap-3 py-3 text-left">
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-ink">{r.name}</span>
                      <span className="text-xs text-stone">
                        {r.kind}, {fmtTs(r.createdAt as Timestamp)}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-mist px-2.5 py-1 text-xs font-bold capitalize text-stone">{String(r.status ?? "new").replace(/-/g, " ")}</span>
                  </button>
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="py-10 text-center text-stone">No requests yet. New submissions appear here instantly.</p>
          )}
        </Card>
      </div>

      <div className={cn("flex flex-wrap items-center gap-4 rounded-2xl p-5", pending ? "bg-brass-pale" : "bg-white ring-1 ring-line")}>
        <span className={cn("grid size-11 place-items-center rounded-full", pending ? "bg-brass text-ink" : "bg-success text-white")}>
          {pending ? <Sparkles aria-hidden className="size-5" /> : <Globe2 aria-hidden className="size-5" />}
        </span>
        <div className="flex-1">
          <p className="font-bold text-ink">{pending ? "Content changes are waiting to publish" : "The website is up to date"}</p>
          <p className="text-sm text-stone">
            {build?.builtAt ? `Last published ${new Date(build.builtAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}. ` : ""}
            Saved changes go live automatically, usually within 30 minutes.
          </p>
        </div>
        <button type="button" onClick={() => go("publishing")} className="inline-flex min-h-11 items-center rounded-full border border-line bg-white px-5 text-sm font-bold text-ink hover:border-ink/40">
          Publishing details
        </button>
      </div>
    </div>
  );
}

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="rounded-2xl border border-line bg-white p-6">
      <h2 className="font-bold text-ink">{title}</h2>
      {sub && <p className="text-sm text-stone">{sub}</p>}
      <div className="mt-5">{children}</div>
    </motion.section>
  );
}

function Legend({ items }: { items: [string, string][] }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone">
      {items.map(([l, c]) => (
        <li key={l} className="flex items-center gap-2 capitalize">
          <span className="size-2.5 rounded-full" style={{ background: c }} /> {l}
        </li>
      ))}
    </ul>
  );
}

function EmptyChart() {
  return <div className="grid h-72 place-items-center rounded-xl bg-mist/60 text-sm text-stone">No data yet. Try the sample activity preview.</div>;
}
