"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Gauge, Hourglass, Scale, Timer, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  approvalRate, clearanceMonths, compact, estimateQueue, latestIndex, QUARTERS, quarterSpan, roughly, rowsForForm, STATS_SOURCE, type StatRow,
} from "@/content/tools/uscis-stats";
import { CountUp, HowEstimated, QueueGauge, SERIES, TipCard } from "./stats-kit";

const ease = [0.22, 1, 0.36, 1] as const;
const MONTH_MS = 30.4375 * 86_400_000;
const months = (n: number) => `${n < 10 ? n.toFixed(1) : Math.round(n)} months`;

/**
 * "Where your case stands": the case set against the official national figures
 * for its form, with a model estimate of its place in line while it is pending.
 */
export function QueueInsight({ form, filed, decided, now }: { form?: string; filed?: Date; decided?: Date; now: Date }) {
  const rows = useMemo(() => rowsForForm(form), [form]);
  const [rowId, setRowId] = useState(rows[0]?.id);
  const row = rows.find((r) => r.id === rowId) ?? rows[0];
  if (!row) return null;
  return <Panel key={row.id} row={row} rows={rows} onRow={setRowId} filed={filed} decided={decided} now={now} />;
}

function Panel({ row, rows, onRow, filed, decided, now }: { row: StatRow; rows: StatRow[]; onRow: (id: string) => void; filed?: Date; decided?: Date; now: Date }) {
  const [pace, setPace] = useState(0);
  const i = latestIndex(row);
  if (i < 0) return null;
  const point = row.series[i]!;
  const quarter = QUARTERS[i];
  const estimate = filed && !decided ? estimateQueue(row, filed, now) : undefined;
  const rate = approvalRate(point);
  const clear = clearanceMonths(point);
  const age = filed ? ((decided ?? now).getTime() - filed.getTime()) / MONTH_MS : undefined;
  const monthsLeft = estimate ? estimate.ahead / (estimate.completedPerMonth * (1 + pace / 100)) : undefined;
  const trend = QUARTERS.map((q, k) => ({ label: q.label, pending: row.series[k]?.pending ?? null })).filter((d) => d.pending !== null);

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease }}
      aria-labelledby="queue-heading"
      className="on-dark relative overflow-hidden rounded-[2rem] bg-ink p-6 text-paper sm:p-10"
    >
      <div aria-hidden className="grain absolute inset-0" />
      <div aria-hidden className="absolute -left-40 -top-40 size-[520px] rounded-full bg-[radial-gradient(circle,rgba(177,151,107,0.2),transparent_65%)]" />
      <div className="relative">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-brass-light">Where your case stands</p>
            <h3 id="queue-heading" className="font-serif-display mt-2 text-3xl sm:text-4xl">
              {decided ? "How your case compares nationally" : `Your case against ${compact(point.pending ?? 0)} pending nationally`}
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-stone-dark">
              Official USCIS figures for {row.label}, {quarterSpan(quarter)}. The place in line is a model estimate, explained below.
            </p>
          </div>
          {rows.length > 1 && (
            <div role="radiogroup" aria-label="Category" className="flex flex-wrap gap-1.5 rounded-2xl border border-line-dark bg-ink-raised/70 p-1">
              {rows.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  role="radio"
                  aria-checked={r.id === row.id}
                  onClick={() => onRow(r.id)}
                  className={cn("min-h-10 rounded-xl px-3 text-xs font-bold transition-colors", r.id === row.id ? "bg-brass text-ink" : "text-stone-dark hover:text-paper")}
                >
                  {r.label.replace(/^[^,]+,\s*/, "")}
                </button>
              ))}
            </div>
          )}
        </div>
        {rows.length > 1 && <p className="mt-3 text-xs text-stone-dark">USCIS reports this form by category. Choose the one that matches your case.</p>}

        <div className="mt-10 grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            {estimate ? (
              <>
                <QueueGauge estimate={estimate} dark />
                <p className="mt-4 text-center text-sm text-stone-dark">
                  {estimate.ahead < 1 ? (
                    <>By this model, cases filed before yours should already have been completed at the national pace.</>
                  ) : (
                    <>
                      About <strong className="text-paper">{roughly(estimate.ahead)}</strong> cases filed earlier are estimated to be still pending, out of roughly{" "}
                      {roughly(estimate.queueNow)} in the national queue.
                    </>
                  )}
                </p>
              </>
            ) : decided && age !== undefined ? (
              <Compare age={age} median={point.median ?? undefined} decided />
            ) : (
              <p className="rounded-2xl border border-line-dark p-6 text-sm text-stone-dark">
                The case data has no filing date, so a place in line cannot be estimated. The national figures on the right still apply.
              </p>
            )}
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            {monthsLeft !== undefined && estimate && estimate.ahead >= 1 && (
              <Tile
                icon={Hourglass}
                label={pace ? `estimated months left at a ${pace > 0 ? `${pace}% faster` : `${-pace}% slower`} pace` : "estimated months left at the current pace"}
                wide
                extra={
                <label className="mt-4 block text-xs font-bold text-stone-dark">
                  What if USCIS works faster or slower?
                  <input
                    type="range"
                    min={-50}
                    max={100}
                    step={10}
                    value={pace}
                    onChange={(e) => setPace(Number(e.target.value))}
                    aria-valuetext={pace === 0 ? "Current pace" : `${Math.abs(pace)} percent ${pace > 0 ? "faster" : "slower"}`}
                    className="mt-2 w-full accent-[#b1976b]"
                  />
                  <span className="mt-1 flex justify-between font-normal"><span>50% slower</span><span>Current</span><span>Twice as fast</span></span>
                </label>
                }
              >
                <CountUp value={monthsLeft} format={(n) => (n < 10 ? n.toFixed(1) : String(Math.round(n)))} />
              </Tile>
            )}
            <Tile icon={Timer} label={`median months to a decision, ${quarter.label}`}>
              {point.median ? <CountUp value={point.median} format={(n) => n.toFixed(1)} /> : <span className="text-xl text-stone-dark">Not reported</span>}
            </Tile>
            <Tile icon={Scale} label="of decisions were approvals that quarter">
              {rate !== undefined ? <CountUp value={rate * 100} format={(n) => `${Math.round(n)}%`} /> : <span className="text-xl text-stone-dark">Not reported</span>}
            </Tile>
            <Tile icon={Users2} label={`cases completed per month, ${quarter.label}`}>
              <CountUp value={(point.completed ?? 0) / 3} format={(n) => compact(n)} />
            </Tile>
            <Tile icon={Gauge} label="months to clear the national backlog at that pace">
              {clear !== undefined ? <CountUp value={clear} format={(n) => (n < 10 ? n.toFixed(1) : String(Math.round(n)))} /> : <span className="text-xl text-stone-dark">Not available</span>}
            </Tile>
          </dl>
        </div>

        {age !== undefined && !decided && <div className="mt-10"><Compare age={age} median={point.median ?? undefined} /></div>}

        {trend.length > 1 && (
          <figure className="mt-10 rounded-2xl border border-line-dark bg-ink-raised/50 p-5">
            <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-bold text-paper">Pending nationally, {row.label}</span>
              <span className="text-xs text-stone-dark">End of each fiscal quarter. Hover for values.</span>
            </figcaption>
            <div className="mt-4 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="pending-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor="#c9b48a" stopOpacity={0.45} />
                      <stop offset="1" stopColor="#c9b48a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#2c333d" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#a9afb6", fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tickLine={false} axisLine={false} width={44} tick={{ fill: "#a9afb6", fontSize: 11 }} tickFormatter={(v: number) => compact(v)} />
                  <Tooltip
                    cursor={{ stroke: "#c9b48a", strokeWidth: 1 }}
                    content={({ active, payload, label }) =>
                      active && payload?.length ? <TipCard title={String(label)} rows={[{ label: "pending", value: Number(payload[0].value).toLocaleString("en-US"), color: SERIES.single }]} /> : null
                    }
                  />
                  <Area type="monotone" dataKey="pending" stroke="#c9b48a" strokeWidth={2} fill="url(#pending-fill)" activeDot={{ r: 5, stroke: "#14181f", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </figure>
        )}

        <div className="mt-8"><HowEstimated dark /></div>
        <p className="mt-4 text-xs text-stone-dark">
          Source: {STATS_SOURCE.publisher},{" "}
          <a href={STATS_SOURCE.url} target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-4 hover:text-paper">{STATS_SOURCE.title}</a>.
          National figures cover every office; your office may be faster or slower.
        </p>
      </div>
    </motion.section>
  );
}

/** A horizontal track placing the case's age against the national median. */
function Compare({ age, median, decided }: { age: number; median?: number; decided?: boolean }) {
  const max = Math.max(age, (median ?? 0) * 1.6, 1) * 1.1;
  const pos = (v: number) => `${(v / max) * 100}%`;
  const ratio = median ? age / median : undefined;
  const verdict =
    ratio === undefined
      ? undefined
      : decided
        ? ratio <= 1
          ? "Your case was decided faster than the median for cases USCIS completed in the latest quarter."
          : "Your case took longer than the median for cases USCIS completed in the latest quarter."
        : ratio < 1
          ? "Your case is younger than the median time to a decision, so a wait at this stage is normal."
          : ratio < 1.5
            ? "Your case has passed the median time. Half of the cases USCIS completed that quarter took longer than the median, so this is still common."
            : "Your case is well past the median time. It can be worth asking an attorney whether a service request or another step makes sense.";
  return (
    <div className="rounded-2xl border border-line-dark p-5">
      <p className="font-bold text-paper">{decided ? "Time to decision" : "Time since filing"}: {months(age)}</p>
      <div className="relative mb-9 mt-5 h-2 rounded-full bg-line-dark">
        <motion.div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brass-ink to-brass-light" initial={{ width: 0 }} animate={{ width: pos(age) }} transition={{ duration: 1.2, ease }} />
        {median && (
          <div className="absolute -bottom-1.5 -top-1.5 w-px bg-paper/80" style={{ left: pos(median) }}>
            <span className="absolute left-1/2 top-[calc(100%+6px)] -translate-x-1/2 whitespace-nowrap rounded-full bg-paper px-2 py-0.5 text-[0.7rem] font-bold text-ink">
              Median {months(median)}
            </span>
          </div>
        )}
      </div>
      {verdict && <p className="text-sm text-stone-dark">{verdict}</p>}
    </div>
  );
}

function Tile({ icon: Icon, label, children, wide, extra }: { icon: typeof Timer; label: string; children: React.ReactNode; wide?: boolean; extra?: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-line-dark bg-ink-raised/70 p-5", wide && "sm:col-span-2")}>
      <dt className="sr-only">{label}</dt>
      <dd>
        <Icon aria-hidden className="size-5 text-brass-light" />
        <span className="font-serif-display mt-3 block text-4xl text-paper">{children}</span>
        <span aria-hidden className="mt-1 block text-sm text-stone-dark">{label}</span>
        {extra}
      </dd>
    </div>
  );
}
