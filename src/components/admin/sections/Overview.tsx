"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { doc, onSnapshot, type Timestamp } from "firebase/firestore";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, BookOpen, CalendarClock, ClipboardCheck, ExternalLink, FileText, Globe2, Mail, Minus, Sparkles, Trophy } from "lucide-react";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { fmtTs, Toggle, type Row } from "../kit";

type Content = { cases: Row[] | null; reviews: Row[] | null; posts: Row[] | null; attorneys: Row[] | null };

type Props = {
  evaluations: Row[] | null;
  bookings: Row[] | null;
  messages: Row[] | null;
  content: Content;
  name: string;
  go: (section: string) => void;
};

const C = { brass: "#b1976b", brassLight: "#c9b48a", ink: "#14181f", green: "#2f6b4f", slate: "#33415c", stone: "#51565c", line: "#e1e4e6", mist: "#eff1f1" };
const STATUS_COLORS = [C.brass, C.ink, C.green, C.slate, "#7d6638", "#a9afb6", "#9b2c2c", C.brassLight];
const DAY = 86_400_000;
const TZ = "America/New_York";

type Range = "30d" | "90d" | "12m";
const RANGES: { id: Range; label: string; days: number }[] = [
  { id: "30d", label: "30 days", days: 30 },
  { id: "90d", label: "90 days", days: 91 },
  { id: "12m", label: "12 months", days: 365 },
];

const ms = (r: Row) => (r.createdAt as Timestamp | undefined)?.toMillis?.() ?? 0;
const ADVANCED = new Set(["evaluated", "consultation-booked", "confirmed", "held", "retained"]);

/** Deterministic sample activity, used only when the preview toggle is on. Nothing is saved. */
function sampleRows(now: number): { evaluations: Row[]; bookings: Row[]; messages: Row[] } {
  const rnd = (seed: number) => Math.abs(Math.sin(seed * 12.9898) * 43758.5453) % 1;
  const mk = (n: number, seed: number, extra: (i: number) => Partial<Row>): Row[] =>
    Array.from({ length: n }, (_, i) => {
      // Skew toward recent weeks and office hours so the charts read like real demand.
      const age = Math.pow(rnd(seed * 100 + i), 1.6) * 360 * DAY;
      const d = new Date(now - age);
      d.setHours(8 + Math.floor(rnd(seed * 7 + i) * 11), Math.floor(rnd(i + seed) * 60));
      const t = d.getTime();
      return { id: `s${seed}-${i}`, createdAt: { toDate: () => new Date(t), toMillis: () => t } as unknown as Timestamp, ...extra(i) };
    });
  const ev = ["new", "reviewing", "evaluated", "consultation-booked", "retained", "not-a-fit", "evaluated", "reviewing"];
  const bk = ["new", "confirmed", "held", "retained", "confirmed", "held", "not-a-fit"];
  const matters = ["Family green cards", "Citizenship", "National Interest Waiver", "Extraordinary ability", "H-1B professionals", "Denied or delayed", "Employer sponsorship", "Family abroad"];
  const countries = ["Nigeria", "India", "United States", "Ghana", "Brazil", "United Kingdom", "Kenya", "Mexico", "Philippines", "Canada"];
  return {
    evaluations: mk(132, 1, (i) => ({ name: `Sample applicant ${i + 1}`, track: i % 3 ? "professional" : "family", status: ev[i % ev.length], birthCountry: countries[Math.floor(rnd(i + 3) * 6)] })),
    bookings: mk(96, 2, (i) => ({ name: `Sample client ${i + 1}`, matterLabel: matters[Math.floor(rnd(i + 9) * matters.length)], status: bk[i % bk.length], country: countries[Math.floor(rnd(i + 5) * countries.length)] })),
    messages: mk(58, 3, (i) => ({ name: `Sample sender ${i + 1}`, topic: "A new matter", status: i % 3 ? "replied" : "new" })),
  };
}

export function Overview({ evaluations, bookings, messages, content, name, go }: Props) {
  const [sample, setSample] = useState(false);
  const [range, setRange] = useState<Range>("90d");
  const [series, setSeries] = useState({ Evaluations: true, Consultations: true, Messages: true });
  const [meta, setMeta] = useState<{ updatedAt?: Timestamp } | null>(null);
  const [build, setBuild] = useState<{ builtAt?: string } | null>(null);
  const [now] = useState(() => Date.now());

  useEffect(() => onSnapshot(doc(db(), "meta", "content"), (s) => setMeta(s.data() ?? null)), []);
  useEffect(() => {
    fetch(`/build-meta.json?ts=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setBuild)
      .catch(() => setBuild(null));
  }, []);

  const data = useMemo(() => (sample ? sampleRows(now) : { evaluations: evaluations ?? [], bookings: bookings ?? [], messages: messages ?? [] }), [sample, now, evaluations, bookings, messages]);
  const days = RANGES.find((r) => r.id === range)!.days;
  const from = now - days * DAY;
  const prevFrom = from - days * DAY;
  const inRange = (r: Row) => ms(r) >= from;
  const inPrev = (r: Row) => ms(r) >= prevFrom && ms(r) < from;

  /* ---------- trend buckets ---------- */
  const trend = useMemo(() => {
    const monthly = range === "12m";
    const weekly = range === "90d";
    const n = monthly ? 12 : weekly ? 13 : 30;
    const buckets = Array.from({ length: n }, (_, i) => {
      const d = new Date(now);
      if (monthly) {
        d.setDate(1);
        d.setMonth(d.getMonth() - (n - 1 - i));
      } else d.setTime(now - (n - 1 - i) * (weekly ? 7 : 1) * DAY);
      d.setHours(0, 0, 0, 0);
      return {
        start: d.getTime(),
        label: d.toLocaleDateString("en-US", monthly ? { month: "short" } : { month: "short", day: "numeric" }),
        Evaluations: 0,
        Consultations: 0,
        Messages: 0,
      };
    });
    const place = (rows: Row[], key: "Evaluations" | "Consultations" | "Messages") =>
      rows.forEach((r) => {
        const t = ms(r);
        for (let i = buckets.length - 1; i >= 0; i--)
          if (t >= buckets[i].start) {
            if (i < buckets.length - 1 || t <= now) buckets[i][key] += 1;
            break;
          }
      });
    place(data.evaluations, "Evaluations");
    place(data.bookings, "Consultations");
    place(data.messages, "Messages");
    return buckets;
  }, [data, range, now]);

  /* ---------- KPIs ---------- */
  const weekly = (rows: Row[], pred: (r: Row) => boolean = () => true) =>
    Array.from({ length: 12 }, (_, i) => {
      const a = now - (12 - i) * 7 * DAY;
      return { v: rows.filter((r) => pred(r) && ms(r) >= a && ms(r) < a + 7 * DAY).length };
    });
  const requests = [...data.evaluations, ...data.bookings];
  const retained = (r: Row) => r.status === "retained";
  const retainedNow = requests.filter((r) => inRange(r) && retained(r)).length;
  const requestsNow = requests.filter(inRange).length;
  const kpis = [
    { label: "Free evaluations", value: data.evaluations.filter(inRange).length, prev: data.evaluations.filter(inPrev).length, note: `${data.evaluations.filter((r) => r.status === "new").length} awaiting first review`, icon: ClipboardCheck, go: "evaluations", spark: weekly(data.evaluations), color: C.brass },
    { label: "Consultation requests", value: data.bookings.filter(inRange).length, prev: data.bookings.filter(inPrev).length, note: `${data.bookings.filter((r) => r.status === "new").length} to confirm`, icon: CalendarClock, go: "bookings", spark: weekly(data.bookings), color: C.ink },
    { label: "Messages", value: data.messages.filter(inRange).length, prev: data.messages.filter(inPrev).length, note: `${data.messages.filter((r) => r.status === "new").length} unanswered`, icon: Mail, go: "messages", spark: weekly(data.messages), color: C.green },
    { label: "Clients retained", value: retainedNow, prev: requests.filter((r) => inPrev(r) && retained(r)).length, note: requestsNow ? `${Math.round((retainedNow / requestsNow) * 100)}% of requests in this period` : "No requests in this period", icon: Trophy, go: "bookings", spark: weekly(requests, retained), color: C.slate },
  ];

  /* ---------- funnel, status mix, matters, countries ---------- */
  const scoped = requests.filter(inRange);
  const funnel = [
    { label: "Received", value: scoped.length },
    { label: "Picked up by the team", value: scoped.filter((r) => r.status && r.status !== "new").length },
    { label: "Evaluated or consultation set", value: scoped.filter((r) => ADVANCED.has(r.status)).length },
    { label: "Retained", value: scoped.filter(retained).length },
  ];
  const statusMix = useMemo(() => {
    const m = new Map<string, number>();
    scoped.forEach((r) => m.set(r.status ?? "new", (m.get(r.status ?? "new") ?? 0) + 1));
    return [...m.entries()].map(([k, value]) => ({ name: k.replace(/-/g, " "), value })).sort((a, b) => b.value - a.value);
  }, [scoped]);
  const tally = (rows: { key?: string }[], top = 7) => {
    const m = new Map<string, number>();
    rows.forEach(({ key }) => key && m.set(key, (m.get(key) ?? 0) + 1));
    return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, top);
  };
  const matters = tally([
    ...data.bookings.filter(inRange).map((b) => ({ key: b.matterLabel })),
    ...data.evaluations.filter(inRange).map((e) => ({ key: e.track === "professional" ? "Professional evaluation" : "Family evaluation" })),
  ]);
  const countries = tally([...data.bookings.filter(inRange).map((b) => ({ key: b.country })), ...data.evaluations.filter(inRange).map((e) => ({ key: e.birthCountry }))], 6);

  /* ---------- arrival heatmap (Eastern time) ---------- */
  const heat = useMemo(() => {
    const grid = Array.from({ length: 7 }, () => Array(6).fill(0) as number[]);
    const fmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", hour: "numeric", hour12: false });
    const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    [...data.evaluations, ...data.bookings, ...data.messages].filter(inRange).forEach((r) => {
      const parts = fmt.formatToParts(new Date(ms(r)));
      const d = order.indexOf(parts.find((p) => p.type === "weekday")?.value ?? "");
      const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
      if (d >= 0) grid[d][Math.floor(h / 4)] += 1;
    });
    return { grid, max: Math.max(1, ...grid.flat()), order };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, range]);

  /* ---------- content library ---------- */
  const library = (
    [
      ["Success stories", content.cases, "cases"],
      ["Reviews", content.reviews, "reviews"],
      ["Blog posts", content.posts, "posts"],
      ["Attorneys", content.attorneys, "attorneys"],
    ] as const
  ).map(([label, rows, section], i) => {
    const all = rows ?? [];
    const live = all.filter((r) => r.status === "published" && !(r.demo && section !== "reviews")).length;
    return { label, section, live, total: all.length, pct: all.length ? Math.round((live / all.length) * 100) : 0, fill: [C.brass, C.ink, C.green, C.slate][i] };
  });

  const recent = useMemo(
    () =>
      [
        ...data.evaluations.map((r) => ({ ...r, kind: "Evaluation", section: "evaluations", icon: ClipboardCheck }) as Row),
        ...data.bookings.map((r) => ({ ...r, kind: "Consultation", section: "bookings", icon: CalendarClock }) as Row),
        ...data.messages.map((r) => ({ ...r, kind: "Message", section: "messages", icon: Mail }) as Row),
      ]
        .sort((a, b) => ms(b) - ms(a))
        .slice(0, 7),
    [data],
  );

  const waiting = [...data.evaluations, ...data.bookings, ...data.messages].filter((r) => r.status === "new").length;
  const pending = meta?.updatedAt?.toMillis && build?.builtAt ? meta.updatedAt.toMillis() > new Date(build.builtAt).getTime() : false;
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hour12: false }).format(now)) % 24;
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  // Use a first name only when the staff record holds a personal name.
  const first = /^[A-Z][a-z]+\s+[A-Z]/.test(name) && !/law|services|admin/i.test(name) ? name.split(/\s+/)[0] : "";
  const rangeLabel = RANGES.find((r) => r.id === range)!.label;

  return (
    <div className="grid gap-6">
      {/* Welcome band */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="on-dark relative overflow-hidden rounded-3xl bg-ink p-7 text-paper sm:p-9">
        <div aria-hidden className="grain absolute inset-0" />
        <div aria-hidden className="absolute -right-24 -top-24 size-80 rounded-full bg-[radial-gradient(circle,rgba(177,151,107,0.35),transparent_65%)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm text-stone-dark">{new Intl.DateTimeFormat("en-US", { timeZone: TZ, dateStyle: "full" }).format(now)}</p>
            <h1 className="font-serif-display mt-2 text-4xl sm:text-5xl">
              {greeting}
              {first ? `, ${first}` : ""}
            </h1>
            <p className="mt-3 max-w-xl text-lg text-stone-dark">
              {waiting === 0 ? "Every request has a first response. Nothing is waiting." : `${waiting} ${waiting === 1 ? "request is" : "requests are"} waiting for a first response.`}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <QuickBtn onClick={() => go("evaluations")} icon={ClipboardCheck}>Review evaluations</QuickBtn>
              <QuickBtn onClick={() => go("pages")} icon={FileText}>Edit page text</QuickBtn>
              <QuickBtn onClick={() => go("posts")} icon={BookOpen}>Write a post</QuickBtn>
              <a href="/" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-dark px-4 text-sm font-bold text-paper transition-colors duration-300 hover:bg-paper hover:text-ink">
                <ExternalLink aria-hidden className="size-4" /> Open website
              </a>
            </div>
          </div>
          <div className="grid gap-3 sm:justify-items-end">
            <div role="radiogroup" aria-label="Period" className="flex rounded-full border border-line-dark bg-ink-raised p-1">
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  role="radio"
                  aria-checked={range === r.id}
                  onClick={() => setRange(r.id)}
                  className={cn("relative min-h-10 rounded-full px-4 text-sm font-bold transition-colors", range === r.id ? "text-ink" : "text-stone-dark hover:text-paper")}
                >
                  {range === r.id && <motion.span layoutId="range-pill" className="absolute inset-0 rounded-full bg-brass" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                  <span className="relative">{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-stone">
          Figures cover the last {rangeLabel} and update live. Percentages compare with the {rangeLabel} before.
        </p>
        <Toggle label="Preview with sample activity" hint="Fills the charts with generated data. Nothing is saved." checked={sample} onChange={setSample} />
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => {
          const delta = k.prev ? Math.round(((k.value - k.prev) / k.prev) * 100) : k.value ? 100 : 0;
          const Trend = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;
          return (
            <motion.button
              type="button"
              key={k.label}
              onClick={() => go(k.go)}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.06, duration: 0.45 }}
              className="group relative overflow-hidden rounded-2xl border border-line bg-white p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-[0_24px_50px_-30px_rgba(20,24,31,0.45)]"
            >
              <span className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-full bg-mist text-brass-ink transition-colors duration-300 group-hover:bg-ink group-hover:text-brass-light">
                  <k.icon aria-hidden className="size-5" />
                </span>
                <span className={cn("inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold", delta > 0 ? "bg-success/10 text-success" : delta < 0 ? "bg-danger/10 text-danger" : "bg-mist text-stone")}>
                  <Trend aria-hidden className="size-3.5" />
                  {Math.abs(delta)}%
                </span>
              </span>
              <motion.span key={`${k.value}-${sample}-${range}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="font-serif-display mt-4 block text-5xl leading-none text-ink">
                {k.value}
              </motion.span>
              <span className="mt-1 block text-sm font-bold text-ink">{k.label}</span>
              <span className="block text-xs text-stone">{k.note}</span>
              <span aria-hidden className="pointer-events-none mt-3 block h-12 w-full">
                <ResponsiveContainer>
                  <AreaChart data={k.spark} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
                    <defs>
                      <linearGradient id={`sp${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={k.color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={k.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke={k.color} strokeWidth={2} fill={`url(#sp${i})`} isAnimationActive animationDuration={1100} />
                  </AreaChart>
                </ResponsiveContainer>
              </span>
              <span className="sr-only">
                {k.prev} in the previous {rangeLabel}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Trend + status mix */}
      <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <Card title="Requests over time" sub={`Last ${rangeLabel}, by ${range === "12m" ? "month" : range === "90d" ? "week" : "day"}`}>
          <div className="mb-4 flex flex-wrap gap-2">
            {(
              [
                ["Evaluations", C.brass],
                ["Consultations", C.ink],
                ["Messages", C.green],
              ] as const
            ).map(([k, c]) => (
              <button
                key={k}
                type="button"
                aria-pressed={series[k]}
                onClick={() => setSeries((s) => ({ ...s, [k]: !s[k] }))}
                className={cn("inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-bold transition-colors duration-300", series[k] ? "border-ink/15 bg-white text-ink" : "border-dashed border-line text-stone/60")}
              >
                <span className="size-2.5 rounded-full" style={{ background: series[k] ? c : "transparent", boxShadow: `inset 0 0 0 2px ${c}` }} />
                {k}
              </button>
            ))}
          </div>
          <div className="h-80">
            <ResponsiveContainer>
              <AreaChart data={trend} margin={{ left: -18, right: 8, top: 8 }}>
                <defs>
                  {(
                    [
                      ["ev", C.brass],
                      ["co", C.ink],
                      ["me", C.green],
                    ] as const
                  ).map(([id, c]) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c} stopOpacity={0.32} />
                      <stop offset="100%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid stroke={C.line} strokeDasharray="3 6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: C.stone }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={18} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: C.stone }} tickLine={false} axisLine={false} />
                <Tooltip content={<InkTooltip />} cursor={{ stroke: C.brass, strokeDasharray: "4 4" }} />
                {series.Evaluations && <Area type="monotone" dataKey="Evaluations" stroke={C.brass} strokeWidth={2.5} fill="url(#ev)" activeDot={{ r: 5, strokeWidth: 0 }} animationDuration={1100} />}
                {series.Consultations && <Area type="monotone" dataKey="Consultations" stroke={C.ink} strokeWidth={2.5} fill="url(#co)" activeDot={{ r: 5, strokeWidth: 0 }} animationDuration={1300} />}
                {series.Messages && <Area type="monotone" dataKey="Messages" stroke={C.green} strokeWidth={2} fill="url(#me)" activeDot={{ r: 5, strokeWidth: 0 }} animationDuration={1500} />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Status mix" sub="Evaluations and consultations in this period">
          {statusMix.length ? (
            <>
              <div className="relative h-60">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={statusMix} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="92%" paddingAngle={2.5} cornerRadius={6} stroke="none" animationDuration={1100}>
                      {statusMix.map((_, i) => (
                        <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<InkTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                  <span>
                    <span className="font-serif-display block text-4xl leading-none text-ink">{scoped.length}</span>
                    <span className="text-xs text-stone">requests</span>
                  </span>
                </div>
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {statusMix.map((s, i) => (
                  <li key={s.name} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 capitalize text-stone">
                      <span className="size-2.5 rounded-full" style={{ background: STATUS_COLORS[i % STATUS_COLORS.length] }} />
                      {s.name}
                    </span>
                    <span className="font-bold text-ink">{s.value}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <EmptyChart />
          )}
        </Card>
      </div>

      {/* Funnel + demand */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Conversion funnel" sub="How far requests in this period have moved">
          {funnel[0].value ? (
            <ol className="grid gap-4">
              {funnel.map((f, i) => {
                const pct = Math.round((f.value / funnel[0].value) * 100);
                return (
                  <li key={f.label}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-bold text-ink">{f.label}</span>
                      <span className="text-stone">
                        <span className="font-serif-display mr-2 text-2xl text-ink">{f.value}</span>
                        {pct}%
                      </span>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-mist">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(pct, 2)}%` }}
                        transition={{ delay: 0.15 + i * 0.12, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${[C.brassLight, C.brass, "#7d6638", C.ink][i]}, ${[C.brass, "#7d6638", C.ink, C.ink][i]})` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <EmptyChart />
          )}
        </Card>

        <Card title="Demand by matter" sub="Consultation matters and evaluation tracks">
          {matters.length ? (
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={matters} layout="vertical" margin={{ left: 8, right: 24 }} barCategoryGap={10}>
                  <defs>
                    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={C.brassLight} />
                      <stop offset="100%" stopColor={C.brass} />
                    </linearGradient>
                  </defs>
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 12, fill: C.ink }} axisLine={false} tickLine={false} />
                  <Tooltip content={<InkTooltip />} cursor={{ fill: C.mist, radius: 8 }} />
                  <Bar dataKey="value" name="Requests" radius={[0, 10, 10, 0]} fill="url(#bar)" background={{ fill: C.mist, radius: 10 }} label={{ position: "right", fill: C.ink, fontSize: 12, fontWeight: 700 }} animationDuration={1100} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart />
          )}
        </Card>
      </div>

      {/* Heatmap + countries + library */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="When requests arrive" sub="Day and time, Eastern">
          <div className="grid grid-cols-[2.5rem_repeat(6,minmax(0,1fr))] gap-1.5 text-xs">
            <span />
            {["12a", "4a", "8a", "12p", "4p", "8p"].map((h) => (
              <span key={h} className="text-center text-stone">
                {h}
              </span>
            ))}
            {heat.grid.map((row, d) => (
              <HeatRow key={d} day={heat.order[d]} row={row} max={heat.max} delay={d} />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-end gap-2 text-xs text-stone">
            Fewer
            {[0.08, 0.3, 0.55, 0.8, 1].map((o) => (
              <span key={o} className="size-3 rounded-[4px]" style={{ background: `rgba(177,151,107,${o})` }} />
            ))}
            More
          </div>
        </Card>

        <Card title="Where requests come from" sub="Country given on bookings, or country of birth on evaluations">
          {countries.length ? (
            <ol className="grid gap-3.5">
              {countries.map((c, i) => (
                <li key={c.name}>
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-ink">{c.name}</span>
                    <span className="text-stone">{c.value}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-mist">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(c.value / countries[0].value) * 100}%` }} transition={{ delay: 0.1 + i * 0.08, duration: 0.8 }} className="h-full rounded-full bg-ink" />
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyChart />
          )}
        </Card>

        <Card title="Website content" sub="Share of each library live on the website">
          <div className="relative h-52">
            <ResponsiveContainer>
              <RadialBarChart data={library} innerRadius="28%" outerRadius="100%" startAngle={90} endAngle={-270} barSize={11}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="pct" background={{ fill: C.mist }} cornerRadius={8} animationDuration={1200} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 grid gap-1">
            {library.map((l) => (
              <li key={l.label}>
                <button type="button" onClick={() => go(l.section)} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-2 text-sm transition-colors duration-300 hover:bg-ink hover:text-paper">
                  <span className="flex items-center gap-2 font-bold">
                    <span className="size-2.5 rounded-full" style={{ background: l.fill }} />
                    {l.label}
                  </span>
                  <span>
                    {l.live} live of {l.total}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Recent + publishing */}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card title="Recent activity" sub="Newest first">
          {recent.length ? (
            <ol className="relative grid gap-1 before:absolute before:bottom-4 before:left-[1.2rem] before:top-4 before:w-px before:bg-line">
              {recent.map((r, i) => {
                const Icon = r.icon as typeof Mail;
                return (
                  <motion.li key={`${r.kind}-${r.id}`} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <button type="button" onClick={() => !sample && go(r.section)} className="relative flex w-full items-center gap-4 rounded-xl py-2.5 pr-2 text-left transition-colors hover:bg-mist">
                      <span className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full border border-line bg-white text-brass-ink">
                        <Icon aria-hidden className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold text-ink">{r.name}</span>
                        <span className="text-xs text-stone">
                          {r.kind}, {fmtTs(r.createdAt as Timestamp)}
                        </span>
                      </span>
                      <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-bold capitalize", r.status === "new" ? "bg-brass text-ink" : "bg-mist text-stone")}>{String(r.status ?? "new").replace(/-/g, " ")}</span>
                    </button>
                  </motion.li>
                );
              })}
            </ol>
          ) : (
            <p className="py-10 text-center text-stone">No requests yet. New submissions appear here as they arrive.</p>
          )}
        </Card>

        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={cn("flex flex-col justify-between gap-6 self-start rounded-2xl p-6", pending ? "bg-brass-pale" : "on-dark bg-ink text-paper")}>
          <div className="flex items-start gap-4">
            <span className={cn("grid size-12 shrink-0 place-items-center rounded-full", pending ? "bg-brass text-ink" : "bg-success text-white")}>
              {pending ? <Sparkles aria-hidden className="size-5" /> : <Globe2 aria-hidden className="size-5" />}
            </span>
            <div>
              <p className={cn("font-serif-display text-2xl", pending ? "text-ink" : "text-paper")}>{pending ? "Changes are on their way" : "The website is up to date"}</p>
              <p className={cn("mt-1 text-sm", pending ? "text-stone" : "text-stone-dark")}>
                {build?.builtAt ? `Last published ${new Date(build.builtAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}. ` : ""}
                Saved changes go live automatically, usually within 15 minutes.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => go("publishing")}
            className={cn("inline-flex min-h-11 w-fit items-center rounded-full px-5 text-sm font-bold transition-colors duration-300", pending ? "bg-ink text-paper hover:bg-ink-raised" : "border border-line-dark text-paper hover:bg-paper hover:text-ink")}
          >
            Publishing details
          </button>
        </motion.section>
      </div>
    </div>
  );
}

function QuickBtn({ onClick, icon: Icon, children }: { onClick: () => void; icon: typeof Mail; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-paper px-4 text-sm font-bold text-ink transition-colors duration-300 hover:bg-brass">
      <Icon aria-hidden className="size-4" /> {children}
    </button>
  );
}

function HeatRow({ day, row, max, delay }: { day: string; row: number[]; max: number; delay: number }) {
  return (
    <>
      <span className="self-center font-bold text-stone">{day}</span>
      {row.map((v, i) => (
        <motion.span
          key={i}
          title={`${day}, ${["midnight to 4 AM", "4 to 8 AM", "8 AM to noon", "noon to 4 PM", "4 to 8 PM", "8 PM to midnight"][i]}: ${v}`}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.02 * (delay * 6 + i), duration: 0.35 }}
          className="aspect-square rounded-md"
          style={{ background: v ? `rgba(177,151,107,${0.12 + (v / max) * 0.88})` : C.mist }}
        />
      ))}
    </>
  );
}

type TipProps = { active?: boolean; label?: string; payload?: { name?: string; value?: number; color?: string; payload?: { fill?: string; name?: string } }[] };

function InkTooltip({ active, label, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-ink px-4 py-3 text-sm text-paper shadow-2xl">
      {label && <p className="mb-1.5 font-bold text-brass-light">{label}</p>}
      <ul className="grid gap-1">
        {payload.map((p, i) => (
          <li key={i} className="flex items-center gap-2 capitalize">
            <span className="size-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />
            <span className="text-stone-dark">{p.name || p.payload?.name}</span>
            <span className="ml-auto pl-4 font-bold">{p.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="rounded-2xl border border-line bg-white p-6">
      <h2 className="font-serif-display text-2xl text-ink">{title}</h2>
      {sub && <p className="text-sm text-stone">{sub}</p>}
      <div className="mt-5">{children}</div>
    </motion.section>
  );
}

function EmptyChart() {
  return <div className="grid h-64 place-items-center rounded-xl bg-mist/60 px-6 text-center text-sm text-stone">No data in this period yet. Turn on the sample activity preview to see how this chart works.</div>;
}
