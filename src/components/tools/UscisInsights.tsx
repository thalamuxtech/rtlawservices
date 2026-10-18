"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Area, AreaChart, Bar, CartesianGrid, ComposedChart, Line, LineChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, CalendarDays, ChartNoAxesCombined, ListOrdered, Radar, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  approvalRate, clearanceMonths, compact, estimateQueue, latestIndex, previous, QUARTERS, quarterSpan, roughly, STAT_GROUPS, STAT_ROWS, STATS_SOURCE,
  statRow, type Point, type StatRow,
} from "@/content/tools/uscis-stats";
import { CountUp, HowEstimated, QueueGauge, SERIES, TipCard } from "./stats-kit";

const ease = [0.22, 1, 0.36, 1] as const;
const VIEWS = [
  { id: "decisions", label: "Decisions" },
  { id: "backlog", label: "Backlog" },
  { id: "speed", label: "Speed" },
] as const;
type View = (typeof VIEWS)[number]["id"];

/** Months under three years stay in months; longer spans read more clearly in years. */
const span = (m: number) => (m < 36 ? `${Math.round(m)} mo` : `${Math.round(m / 12).toLocaleString("en-US")} yr`);
const fmt = (n: number | null | undefined) => (n === null || n === undefined ? "Not reported" : n.toLocaleString("en-US"));
const tick = { fill: SERIES.axis, fontSize: 11 };
const latestQuarter = QUARTERS[QUARTERS.length - 1];

export function UscisInsights() {
  const [rowId, setRowId] = useState("i485-employment");
  const row = statRow(rowId)!;
  const [group, setGroup] = useState(row.group);
  const [view, setView] = useState<View>("decisions");
  const [table, setTable] = useState(false);
  const i = latestIndex(row);
  const point = row.series[i]!;
  const quarter = QUARTERS[i];

  const choose = (id: string) => {
    const r = statRow(id);
    if (!r) return;
    setRowId(id);
    setGroup(r.group);
  };

  const series = QUARTERS.map((q, k) => ({ ...(row.series[k] ?? {}), label: q.label, derived: q.derived })) as (Partial<Point> & { label: string; derived: boolean })[];
  const anyDerived = QUARTERS.some((q) => q.derived);

  return (
    <section aria-labelledby="insights-heading" className="grid min-w-0 gap-6 [&>*]:min-w-0">
      {/* Header and headline figures */}
      <div className="on-dark relative overflow-hidden rounded-[2rem] bg-ink p-6 text-paper sm:p-10">
        <div aria-hidden className="grain absolute inset-0" />
        <div aria-hidden className="absolute -right-24 -top-48 size-[620px] rounded-full bg-[radial-gradient(circle,rgba(61,100,184,0.22),transparent_62%)]" />
        <div aria-hidden className="absolute -bottom-56 -left-24 size-[560px] rounded-full bg-[radial-gradient(circle,rgba(177,151,107,0.22),transparent_62%)]" />
        <div className="relative">
          <p className="eyebrow text-brass-light">USCIS by the numbers</p>
          <h2 id="insights-heading" className="font-serif-display mt-2 max-w-3xl text-balance text-4xl leading-tight sm:text-5xl">
            How fast is USCIS deciding cases like yours?
          </h2>
          <p className="mt-4 max-w-2xl text-stone-dark">
            Official national figures for {STAT_ROWS.length} forms and categories, from {quarterSpan(QUARTERS[0])} to{" "}
            {quarterSpan(latestQuarter)}. Choose a form to compare decisions, backlog and speed over time.
          </p>

          {/* Filters, one row above everything they scope */}
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {STAT_GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={group === g}
                onClick={() => {
                  setGroup(g);
                  const first = STAT_ROWS.find((r) => r.group === g);
                  if (first && row.group !== g) setRowId(first.id);
                }}
                className={cn(
                  "min-h-10 rounded-full border px-4 text-sm font-bold transition-colors",
                  group === g ? "border-brass bg-brass text-ink" : "border-line-dark text-stone-dark hover:border-brass-light hover:text-paper",
                )}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {STAT_ROWS.filter((r) => r.group === group).map((r) => (
              <button
                key={r.id}
                type="button"
                aria-pressed={r.id === row.id}
                onClick={() => choose(r.id)}
                className={cn(
                  "relative min-h-10 rounded-xl px-3.5 text-sm transition-colors",
                  r.id === row.id ? "text-ink" : "bg-ink-raised/70 text-stone-dark hover:text-paper",
                )}
              >
                {r.id === row.id && <motion.span layoutId="insight-form" className="absolute inset-0 rounded-xl bg-paper" transition={{ type: "spring", stiffness: 380, damping: 34 }} />}
                <span className="relative font-bold">{r.label}</span>
              </button>
            ))}
          </div>

          <dl className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line-dark bg-line-dark sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="pending nationally" value={point.pending} prev={previous(row, i, "pending")} lowerIsBetter format={compact} />
            <Kpi label="median months to a decision" value={point.median} prev={previous(row, i, "median")} lowerIsBetter format={(n) => n.toFixed(1)} />
            <Kpi
              label="of decisions were approvals"
              value={approvalRate(point) !== undefined ? approvalRate(point)! * 100 : null}
              prev={prevRate(row, i)}
              format={(n) => `${Math.round(n)}%`}
              unit="points"
            />
            <Kpi label="new cases received" value={point.received} prev={previous(row, i, "received")} format={compact} neutral />
          </dl>
          <p className="mt-3 text-xs text-stone-dark">
            {row.label}, {quarterSpan(quarter)}. Changes compare with the previous quarter USCIS reported.
          </p>
        </div>
      </div>

      {/* Main chart */}
      <div className="rounded-[2rem] border border-line bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-serif-display flex items-center gap-3 text-2xl text-ink sm:text-3xl">
            <span className="grid size-10 place-items-center rounded-full bg-mist text-brass-ink"><ChartNoAxesCombined aria-hidden className="size-5" /></span>
            {row.label}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <div role="tablist" aria-label="Measure" className="inline-flex rounded-full border border-line bg-mist p-1">
              {VIEWS.map((v) => (
                <button
                  key={v.id}
                  role="tab"
                  type="button"
                  aria-selected={view === v.id}
                  onClick={() => setView(v.id)}
                  className={cn("relative min-h-10 rounded-full px-4 text-sm font-bold transition-colors", view === v.id ? "text-paper" : "text-stone hover:text-ink")}
                >
                  {view === v.id && <motion.span layoutId="insight-view" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 380, damping: 34 }} />}
                  <span className="relative">{v.label}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-pressed={table}
              onClick={() => setTable(!table)}
              className={cn("inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-colors", table ? "border-ink bg-ink text-paper" : "border-line text-stone hover:text-ink")}
            >
              <Table2 aria-hidden className="size-4" /> Table
            </button>
          </div>
        </div>

        <p className="mt-3 text-sm text-stone">
          {view === "decisions"
            ? "Approvals and denials each quarter, stacked, with new cases received as a line. When the line sits above the bars, the backlog grows."
            : view === "backlog"
              ? "Cases waiting for a decision at the end of each quarter."
              : "Median months from filing to completion for cases completed in each quarter. Half took less time, half took more."}
        </p>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={`${row.id}-${view}-${table}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease }} className="mt-6">
            {table ? (
              <DataTable series={series} />
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {view === "decisions" ? (
                    <ComposedChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="28%">
                      <CartesianGrid vertical={false} stroke={SERIES.grid} />
                      <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: SERIES.grid }} tick={tick} />
                      <YAxis tickLine={false} axisLine={false} width={48} tick={tick} tickFormatter={(v: number) => compact(v)} />
                      <Tooltip cursor={{ fill: "rgba(20,24,31,0.05)" }} content={({ active, payload, label }) => <QuarterTip active={active} payload={payload} label={label} />} />
                      <Bar dataKey="approved" name="approved" stackId="d" fill={SERIES.approved} stroke="#ffffff" strokeWidth={2} />
                      <Bar dataKey="denied" name="denied" stackId="d" fill={SERIES.denied} stroke="#ffffff" strokeWidth={2} radius={[4, 4, 0, 0]} />
                      <Line dataKey="received" name="received" type="monotone" stroke={SERIES.received} strokeWidth={2} dot={{ r: 4, fill: SERIES.received, stroke: "#ffffff", strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
                    </ComposedChart>
                  ) : view === "backlog" ? (
                    <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="backlog-fill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0" stopColor={SERIES.single} stopOpacity={0.35} />
                          <stop offset="1" stopColor={SERIES.single} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke={SERIES.grid} />
                      <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: SERIES.grid }} tick={tick} />
                      <YAxis tickLine={false} axisLine={false} width={48} tick={tick} tickFormatter={(v: number) => compact(v)} />
                      <Tooltip cursor={{ stroke: SERIES.single }} content={({ active, payload, label }) => <QuarterTip active={active} payload={payload} label={label} />} />
                      <Area dataKey="pending" name="pending" type="monotone" stroke={SERIES.single} strokeWidth={2} fill="url(#backlog-fill)" connectNulls activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 2 }} />
                    </AreaChart>
                  ) : (
                    <LineChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid vertical={false} stroke={SERIES.grid} />
                      <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: SERIES.grid }} tick={tick} />
                      <YAxis tickLine={false} axisLine={false} width={48} tick={tick} tickFormatter={(v: number) => `${v} mo`} />
                      <Tooltip cursor={{ stroke: SERIES.single }} content={({ active, payload, label }) => <QuarterTip active={active} payload={payload} label={label} />} />
                      <Line dataKey="median" name="median months" type="monotone" stroke={SERIES.single} strokeWidth={2} connectNulls dot={{ r: 4, fill: SERIES.single, stroke: "#ffffff", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {view === "decisions" && !table && (
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone" aria-label="Legend">
            <li className="flex items-center gap-2"><span aria-hidden className="size-3 rounded-sm" style={{ background: SERIES.approved }} /> Approved</li>
            <li className="flex items-center gap-2"><span aria-hidden className="size-3 rounded-sm" style={{ background: SERIES.denied }} /> Denied</li>
            <li className="flex items-center gap-2"><span aria-hidden className="h-0.5 w-4 rounded-full" style={{ background: SERIES.received }} /> Received</li>
          </ul>
        )}
        {anyDerived && (
          <p className="mt-4 text-xs text-stone">
            USCIS has not published separate reports for {QUARTERS.filter((q) => q.derived).map((q) => q.label).join(" and ")}. Their received, approved and denied counts are worked out
            from the fiscal-year totals in the next report, and pending counts and median times are not available for them.
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] [&>*]:min-w-0">
        <BacklogMap selected={row.id} onSelect={choose} />
        <LongestLines selected={row.id} onSelect={choose} />
      </div>

      <QueueCalculator initial={row.id} />

      <p className="text-xs leading-relaxed text-stone">
        Source: {STATS_SOURCE.publisher},{" "}
        <a href={STATS_SOURCE.url} target="_blank" rel="noopener noreferrer" className="font-bold text-ink underline underline-offset-4">{STATS_SOURCE.title}</a>, quarterly reports from{" "}
        {quarterSpan(QUARTERS[0])} to {quarterSpan(latestQuarter)}. USCIS revises its figures between reports, so totals here may differ slightly from later
        publications. Approval share counts approvals and denials only; USCIS also closes some cases in other ways.
      </p>
    </section>
  );
}

function prevRate(row: StatRow, index: number) {
  for (let k = index - 1; k >= 0; k--) {
    const r = approvalRate(row.series[k]);
    if (r !== undefined) return { value: r * 100, quarter: QUARTERS[k] };
  }
  return undefined;
}

function Kpi({
  label, value, prev, format, lowerIsBetter, neutral, unit,
}: { label: string; value: number | null; prev?: { value: number; quarter: { label: string } }; format: (n: number) => string; lowerIsBetter?: boolean; neutral?: boolean; unit?: string }) {
  const delta = value !== null && prev ? value - prev.value : undefined;
  const pct = delta !== undefined && prev && !unit ? (delta / prev.value) * 100 : undefined;
  const better = delta === undefined || delta === 0 || neutral ? undefined : lowerIsBetter ? delta < 0 : delta > 0;
  return (
    <div className="bg-ink p-5 sm:p-6">
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="font-serif-display block text-5xl leading-none text-paper">
          {value === null ? <span className="text-2xl text-stone-dark">Not reported</span> : <CountUp value={value} format={format} />}
        </span>
        <span aria-hidden className="mt-2 block text-sm text-stone-dark">{label}</span>
        {delta !== undefined && delta !== 0 && (
          <span className={cn("mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold", better === undefined ? "bg-line-dark text-stone-dark" : better ? "bg-[#1f8a5b]/20 text-[#8fd3b0]" : "bg-[#c8642a]/20 text-[#f0b48c]")}>
            {delta > 0 ? <ArrowUpRight aria-hidden className="size-3.5" /> : <ArrowDownRight aria-hidden className="size-3.5" />}
            {unit ? `${Math.abs(delta).toFixed(1)} ${unit}` : `${Math.abs(pct!).toFixed(1)}%`} {delta > 0 ? "up" : "down"} on {prev!.quarter.label}
          </span>
        )}
      </dd>
    </div>
  );
}

type TipPayload = { name?: string | number; value?: unknown; color?: string; payload?: { derived?: boolean } };

function QuarterTip({ active, payload, label }: { active?: boolean; payload?: readonly TipPayload[]; label?: string | number }) {
  if (!active || !payload?.length) return null;
  const color: Record<string, string> = { approved: SERIES.approved, denied: SERIES.denied, received: SERIES.received, pending: SERIES.single, "median months": SERIES.single };
  const rows = [...payload]
    .filter((p) => p.value !== null && p.value !== undefined)
    .map((p) => ({ label: String(p.name), value: String(p.name).includes("median") ? `${Number(p.value).toFixed(1)}` : Number(p.value).toLocaleString("en-US"), color: color[String(p.name)] }));
  const derived = payload[0]?.payload?.derived;
  return <TipCard title={String(label)} rows={rows.length ? rows : [{ label: "", value: "Not reported" }]} note={derived ? "Worked out from fiscal-year totals." : undefined} />;
}

function DataTable({ series }: { series: (Partial<Point> & { label: string; derived: boolean })[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[640px] text-right text-sm">
        <thead className="bg-mist text-xs text-stone">
          <tr>
            {["Quarter", "Received", "Approved", "Denied", "Completed", "Pending", "Median months"].map((h, k) => (
              <th key={h} scope="col" className={cn("px-4 py-3 font-bold", k === 0 && "text-left")}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {series.map((s) => (
            <tr key={s.label} className="border-t border-line tabular-nums text-ink">
              <th scope="row" className="px-4 py-2.5 text-left font-bold">{s.label}{s.derived ? "*" : ""}</th>
              <td className="px-4 py-2.5">{fmt(s.received)}</td>
              <td className="px-4 py-2.5">{fmt(s.approved)}</td>
              <td className="px-4 py-2.5">{fmt(s.denied)}</td>
              <td className="px-4 py-2.5">{fmt(s.completed)}</td>
              <td className="px-4 py-2.5">{fmt(s.pending)}</td>
              <td className="px-4 py-2.5">{s.median ? s.median.toFixed(1) : "Not reported"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-line px-4 py-2 text-xs text-stone">* Worked out from fiscal-year totals in the next report.</p>
    </div>
  );
}

/** Every form placed by speed (median months) and backlog (pending cases); bubble area follows new receipts. */
function BacklogMap({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const points = useMemo(
    () =>
      STAT_ROWS.map((r) => {
        const p = r.series[latestIndex(r)];
        return p && p.median && p.pending ? { id: r.id, label: r.label, x: p.median, y: p.pending, received: p.received ?? 0 } : null;
      }).filter((p): p is NonNullable<typeof p> => !!p),
    [],
  );
  const maxReceived = Math.max(...points.map((p) => p.received), 1);
  const skipped = STAT_ROWS.length - points.length;
  return (
    <div className="rounded-[2rem] border border-line bg-white p-6 sm:p-8">
      <h3 className="font-serif-display flex items-center gap-3 text-2xl text-ink">
        <span className="grid size-10 place-items-center rounded-full bg-mist text-brass-ink"><Radar aria-hidden className="size-5" /></span>
        Backlog map
      </h3>
      <p className="mt-2 text-sm text-stone">
        Each bubble is a form: further right is slower, higher has more cases waiting, and a larger bubble received more new cases. Select a bubble to load it above.
      </p>
      <div className="mt-6 h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 12, right: 16, bottom: 18, left: 0 }}>
            <CartesianGrid stroke={SERIES.grid} />
            <XAxis type="number" dataKey="x" name="median months" domain={[0, (max: number) => Math.ceil((max + 4) / 5) * 5]} tickLine={false} axisLine={{ stroke: SERIES.grid }} tick={tick} label={{ value: "Median months to a decision", position: "insideBottom", offset: -12, fill: SERIES.axis, fontSize: 11 }} />
            <YAxis type="number" dataKey="y" name="pending" scale="log" domain={[(min: number) => min * 0.6, (max: number) => max * 1.8]} allowDataOverflow tickLine={false} axisLine={false} width={48} tick={tick} tickFormatter={(v: number) => compact(v)} />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                const d = active && payload?.[0]?.payload as (typeof points)[number] | undefined;
                return d ? (
                  <TipCard
                    title={d.label}
                    rows={[
                      { label: "pending", value: d.y.toLocaleString("en-US") },
                      { label: "median months", value: d.x.toFixed(1) },
                      { label: "received last quarter", value: d.received.toLocaleString("en-US") },
                    ]}
                  />
                ) : null;
              }}
            />
            <Scatter
              data={points}
              onClick={(d: unknown) => {
                const id = (d as { id?: string; payload?: { id?: string } })?.payload?.id ?? (d as { id?: string })?.id;
                if (id) onSelect(id);
              }}
              shape={(props: unknown) => {
                const { cx, cy, payload } = props as { cx: number; cy: number; payload: (typeof points)[number] };
                const r = 4 + 14 * Math.sqrt(payload.received / maxReceived);
                const on = payload.id === selected;
                return (
                  <g className="cursor-pointer">
                    <circle cx={cx} cy={cy} r={Math.max(r, 12)} fill="transparent" />
                    <circle cx={cx} cy={cy} r={r} fill={on ? SERIES.received : SERIES.single} fillOpacity={on ? 0.9 : 0.35} stroke={on ? "#14181f" : "#ffffff"} strokeWidth={2} />
                    {on && (
                      <text x={cx} y={cy - r - 6} textAnchor="middle" fontSize={11} fontWeight={700} fill="#14181f">
                        {payload.label.split(",")[0]}
                      </text>
                    )}
                  </g>
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      {skipped > 0 && <p className="mt-2 text-xs text-stone">{skipped} rows without a reported median time, such as affirmative asylum, are not placed on the map.</p>}
    </div>
  );
}

/** Forms ranked by the months USCIS would need to clear its pending cases at the latest pace. */
function LongestLines({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const ranked = useMemo(
    () =>
      STAT_ROWS.map((r) => ({ id: r.id, label: r.label, months: clearanceMonths(r.series[latestIndex(r)]) }))
        .filter((r): r is { id: string; label: string; months: number } => r.months !== undefined && Number.isFinite(r.months))
        .sort((a, b) => b.months - a.months)
        .slice(0, 10),
    [],
  );
  const max = ranked[0]?.months ?? 1;
  return (
    <div className="rounded-[2rem] border border-line bg-white p-6 sm:p-8">
      <h3 className="font-serif-display flex items-center gap-3 text-2xl text-ink">
        <span className="grid size-10 place-items-center rounded-full bg-mist text-brass-ink"><ListOrdered aria-hidden className="size-5" /></span>
        Longest lines
      </h3>
      <p className="mt-2 text-sm text-stone">Months USCIS would need to clear each backlog at the latest quarter&rsquo;s pace, if no new cases arrived.</p>
      <ol className="mt-6 grid gap-2">
        {ranked.map((r, k) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => onSelect(r.id)}
              aria-pressed={r.id === selected}
              className={cn("group grid w-full min-w-0 gap-1.5 rounded-xl px-3 py-2 text-left transition-colors [&>*]:min-w-0", r.id === selected ? "bg-ink text-paper" : "hover:bg-mist")}
            >
              <span className="flex min-w-0 items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-bold">{r.label}</span>
                <span className={cn("shrink-0 tabular-nums", r.id === selected ? "text-brass-light" : "text-stone")}>{span(r.months)}</span>
              </span>
              <span className={cn("block h-1.5 rounded-full", r.id === selected ? "bg-line-dark" : "bg-mist")}>
                <motion.span
                  className={cn("block h-full rounded-full", r.id === selected ? "bg-brass-light" : "bg-brass-ink")}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(r.months / max) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: k * 0.05, ease }}
                />
              </span>
            </button>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs text-stone">
        Very long figures mean USCIS completed few of these cases in the quarter, sometimes because of a processing pause or a wait for visa numbers. They do
        not mean each case will wait that long.
      </p>
    </div>
  );
}

/** Place-in-line estimate for anyone, from a form and a filing date. */
function QueueCalculator({ initial }: { initial: string }) {
  const [rowId, setRowId] = useState(initial);
  const [date, setDate] = useState("");
  const [now] = useState(() => new Date());
  const row = statRow(rowId)!;
  const filed = date ? new Date(`${date}T12:00:00Z`) : undefined;
  const valid = filed && !Number.isNaN(filed.getTime()) && filed.getTime() <= now.getTime();
  const estimate = valid ? estimateQueue(row, filed, now) : undefined;
  return (
    <div className="rounded-[2rem] border border-line bg-white p-6 sm:p-10">
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center [&>*]:min-w-0">
        <div>
          <p className="eyebrow text-brass-ink">Place-in-line calculator</p>
          <h3 className="font-serif-display mt-2 text-3xl text-ink sm:text-4xl">No case data to hand? Estimate from your filing date.</h3>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 [&>*]:min-w-0">
            <label className="grid gap-2 text-sm font-bold text-ink">
              Form and category
              <select value={rowId} onChange={(e) => setRowId(e.target.value)} className="min-h-12 w-full min-w-0 rounded-xl border border-line bg-white px-3 font-normal focus:border-ink focus:outline-none">
                {STAT_GROUPS.map((g) => (
                  <optgroup key={g} label={g}>
                    {STAT_ROWS.filter((r) => r.group === g).map((r) => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-ink">
              Date USCIS received it
              <span className="relative">
                <CalendarDays aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brass-ink" />
                <input
                  type="date"
                  value={date}
                  max={now.toISOString().slice(0, 10)}
                  min="2015-01-01"
                  onChange={(e) => setDate(e.target.value)}
                  className="min-h-12 w-full rounded-xl border border-line bg-white pl-10 pr-3 font-normal focus:border-ink focus:outline-none"
                />
              </span>
            </label>
          </div>
          <p className="mt-3 text-sm text-stone">The received date is printed on your receipt notice (Form I-797C).</p>
          <div className="mt-6"><HowEstimated /></div>
        </div>
        <div className="rounded-[1.5rem] bg-mist p-6 sm:p-8">
          {estimate ? (
            <>
              <QueueGauge estimate={estimate} />
              <dl className="mt-6 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl bg-white p-4">
                  <dt className="text-xs text-stone">Estimated cases ahead</dt>
                  <dd className="font-serif-display mt-1 text-2xl text-ink">{estimate.ahead < 1 ? "None" : roughly(estimate.ahead)}</dd>
                </div>
                <div className="rounded-xl bg-white p-4">
                  <dt className="text-xs text-stone">Estimated months left</dt>
                  <dd className="font-serif-display mt-1 text-2xl text-ink">{estimate.ahead < 1 ? "Due now" : estimate.monthsLeft.toFixed(1)}</dd>
                </div>
                <div className="rounded-xl bg-white p-4">
                  <dt className="text-xs text-stone">Months since filing</dt>
                  <dd className="font-serif-display mt-1 text-2xl text-ink">{estimate.age.toFixed(1)}</dd>
                </div>
                <div className="rounded-xl bg-white p-4">
                  <dt className="text-xs text-stone">National median</dt>
                  <dd className="font-serif-display mt-1 text-2xl text-ink">{estimate.median ? `${estimate.median.toFixed(1)} mo` : "Not reported"}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-stone">Based on {row.label}, {quarterSpan(estimate.quarter)}. A rough model estimate, not a USCIS figure.</p>
            </>
          ) : (
            <div className="grid min-h-64 place-items-center text-center">
              <div>
                <span className="mx-auto grid size-14 place-items-center rounded-full bg-white text-brass-ink ring-1 ring-line"><CalendarDays aria-hidden className="size-6" /></span>
                <p className="mt-4 font-bold text-ink">{date && !valid ? "Choose a date that is not in the future." : "Choose a form and the date USCIS received your case."}</p>
                <p className="mt-1 text-sm text-stone">The estimate appears here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
