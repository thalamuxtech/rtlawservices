// Official USCIS workload figures, and the arithmetic the tracker builds on them.
//
// The figures come from the USCIS quarterly report "Number of Service-wide Forms
// by Quarter, Form Status, and Processing Time", extracted by
// scripts/uscis-stats.py into uscis-stats.json. They are national totals for
// each form and category. USCIS does not publish where an individual case sits
// in its queue, so every "place in line" figure here is a model estimate built
// from those totals, and the page says so wherever it shows one.

import raw from "./uscis-stats.json";

export type Point = { received: number | null; approved: number | null; denied: number | null; completed: number | null; pending: number | null; median: number | null };
export type Quarter = { fy: number; q: number; label: string; period: string | null; source: string | null; derived: boolean };
export type StatRow = { id: string; label: string; form: string; group: string; series: (Point | null)[] };

type Raw = { title: string; publisher: string; url: string; quarters: Quarter[]; rows: StatRow[]; total: (Point | null)[] };
const DATA = raw as unknown as Raw;

export const STATS_SOURCE = { title: DATA.title, publisher: DATA.publisher, url: DATA.url };

/** Direct link to one quarterly report spreadsheet on uscis.gov. */
export const reportUrl = (file: string) => `https://www.uscis.gov/sites/default/files/document/data/${file}`;
export const QUARTERS = DATA.quarters;
export const STAT_ROWS = DATA.rows;
export const STAT_GROUPS = [...new Set(STAT_ROWS.map((r) => r.group))];
export const statRow = (id: string) => STAT_ROWS.find((r) => r.id === id);

/** Last day of a federal fiscal-year quarter. FY2026 Q1 runs October to December 2025. */
export function quarterEnd(fy: number, q: number) {
  const [y, m] = q === 1 ? [fy - 1, 12] : q === 2 ? [fy, 3] : q === 3 ? [fy, 6] : [fy, 9];
  return new Date(Date.UTC(y, m, 0, 12));
}

/** Plain-language span of a quarter, for example "April to June 2026". */
export function quarterSpan(qt: Quarter) {
  const end = quarterEnd(qt.fy, qt.q);
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 2, 1, 12));
  const month = (d: Date) => d.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
  return `${month(start)} to ${month(end)} ${end.getUTCFullYear()}`;
}

/** Index of the newest quarter where the row has pending, completion and receipt counts. */
export function latestIndex(row: StatRow) {
  for (let i = row.series.length - 1; i >= 0; i--) {
    const p = row.series[i];
    if (p && p.pending !== null && p.completed && p.received !== null) return i;
  }
  return -1;
}

/** Approvals as a share of approvals plus denials, or undefined when either is missing. */
export function approvalRate(p?: Point | null) {
  if (!p || p.approved === null || p.denied === null || p.approved + p.denied === 0) return undefined;
  return p.approved / (p.approved + p.denied);
}

/** Months USCIS would need to clear the pending count at the quarter's completion pace. */
export function clearanceMonths(p?: Point | null) {
  if (!p || p.pending === null || !p.completed) return undefined;
  return p.pending / (p.completed / 3);
}

/** The most recent earlier quarter with a value for the field, for comparisons. */
export function previous(row: StatRow, index: number, field: keyof Point) {
  for (let i = index - 1; i >= 0; i--) {
    const v = row.series[i]?.[field];
    if (v !== null && v !== undefined) return { value: v, quarter: QUARTERS[i] };
  }
  return undefined;
}

/** Statistics rows that describe a form, best match first. */
const FORM_ROWS: Record<string, string[]> = {
  "I-130": ["i130-ir", "i130-other"],
  "I-129F": ["i129f"],
  "I-601A": ["i601a"],
  "I-751": ["i751"],
  "I-129": ["i129"],
  "I-140": ["i140"],
  "I-526E": ["i526e"],
  "I-829": ["i829"],
  "I-765": ["i765-aos", "i765-asylum", "i765-other"],
  "I-131": ["i131-ap", "i131-td"],
  "I-539": ["i539"],
  "I-589": ["i589"],
  "I-730": ["i730"],
  "I-821": ["i821"],
  "I-914": ["i914"],
  "I-918": ["i918"],
  "I-360": ["i360"],
  "I-485": ["i485-family", "i485-employment", "i485-asylum", "i485-refugee"],
  "I-90": ["i90"],
  "N-400": ["n400"],
  "N-600": ["n600"],
  "I-290B": ["i290b"],
  "I-601": ["waivers"],
  "I-212": ["waivers"],
  "I-612": ["waivers"],
};

export function rowsForForm(form?: string): StatRow[] {
  if (!form) return [];
  const key = form.toUpperCase().replace(/\s+/g, "").replace(/^([IN])(\d)/, "$1-$2");
  return (FORM_ROWS[key] ?? []).map(statRow).filter((r): r is StatRow => !!r);
}

const MONTH_MS = 30.4375 * 86_400_000;

export type QueueEstimate = {
  quarter: Quarter;
  /** Pending nationally at the end of that quarter. */
  pending: number;
  /** Receipts and completions per month in that quarter. */
  receivedPerMonth: number;
  completedPerMonth: number;
  /** Estimated cases filed before this one and still pending today. */
  ahead: number;
  /** Estimated size of the whole pending queue today. */
  queueNow: number;
  /** Share of today's queue estimated to be ahead, from 0 to 1. */
  shareAhead: number;
  /** Months until the cases ahead are completed at the current pace. */
  monthsLeft: number;
  /** Median months to completion in that quarter, if USCIS reported one. */
  median?: number;
  /** Months since filing. */
  age: number;
};

/**
 * Estimates a case's place in line with a first-in, first-out model of the
 * national queue. Where P is the pending count at the end of the latest
 * quarter, R and C are that quarter's receipts and completions per month, and
 * m is the time in months from filing to the quarter's end:
 *
 *   cases ahead at the quarter's end  = max(0, P - R x m)        when filed before it
 *   cases ahead when filed            = max(0, P + (R - C) x g)  when filed g months after it
 *
 * Completions since then (C per month) are subtracted, and the months left are
 * the remaining cases ahead divided by C. USCIS does not work strictly in
 * filing order and its pace varies by office, so this is a rough guide only.
 */
export function estimateQueue(row: StatRow, filed: Date, now = new Date()): QueueEstimate | undefined {
  const i = latestIndex(row);
  if (i < 0) return undefined;
  const p = row.series[i]!;
  const quarter = QUARTERS[i];
  const P = p.pending!;
  const R = p.received! / 3;
  const C = p.completed! / 3;
  if (C <= 0) return undefined;
  const end = quarterEnd(quarter.fy, quarter.q).getTime();
  const months = (a: number, b: number) => (b - a) / MONTH_MS;

  let ahead: number;
  if (filed.getTime() <= end) {
    const atEnd = Math.max(0, P - R * months(filed.getTime(), end));
    ahead = Math.max(0, atEnd - C * Math.max(0, months(end, now.getTime())));
  } else {
    const atFiling = Math.max(0, P + (R - C) * months(end, filed.getTime()));
    ahead = Math.max(0, atFiling - C * Math.max(0, months(filed.getTime(), now.getTime())));
  }
  const queueNow = Math.max(ahead, P + (R - C) * Math.max(0, months(end, now.getTime())), 1);
  return {
    quarter,
    pending: P,
    receivedPerMonth: R,
    completedPerMonth: C,
    ahead,
    queueNow,
    shareAhead: Math.min(1, ahead / queueNow),
    monthsLeft: ahead / C,
    median: p.median ?? undefined,
    age: Math.max(0, months(filed.getTime(), now.getTime())),
  };
}

/** Rounds a large count for prose: 154,658 becomes "about 155,000". */
export function roughly(n: number) {
  if (n < 1000) return Math.round(n).toLocaleString("en-US");
  const step = n >= 100_000 ? 1000 : 100;
  return (Math.round(n / step) * step).toLocaleString("en-US");
}

export const compact = (n: number) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
