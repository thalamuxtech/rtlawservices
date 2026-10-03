import { TZDate } from "@date-fns/tz";
import { addDays, format } from "date-fns";
import { EXPERTISE } from "@/content/expertise";
import { ATTORNEYS } from "@/content/proof";

export const FIRM_TZ = "America/New_York";
export const MIN_NOTICE_HOURS = 24;
export const HORIZON_DAYS = 30;

export type Mode = "video" | "phone" | "office";

export const MODES: { id: Mode; label: string; detail: string }[] = [
  { id: "video", label: "Video", detail: "Secure video link sent with the confirmation" },
  { id: "phone", label: "Phone", detail: "We call you at the number you provide" },
  { id: "office", label: "In office", detail: "At our Maryland office" },
];

export const MATTERS = [
  ...EXPERTISE.map((e) => ({ id: e.slug, label: e.title, codes: e.codes, track: e.track })),
  { id: "general", label: "General assessment", codes: "Not sure yet", track: "other" as const },
];

export const durationFor = (matter: string) =>
  MATTERS.find((m) => m.id === matter)?.track === "professionals" ? 60 : 30;

/** Weekly windows in firm local time: [startHour, endHour) by weekday (0 = Sunday). */
const WINDOWS: Record<number, [number, number] | null> = {
  0: null,
  1: [9.5, 16.5],
  2: [9.5, 16.5],
  3: [9.5, 16.5],
  4: [9.5, 16.5],
  5: [9.5, 16.5],
  6: [10, 13],
};

export function attorneyFor(matter: string, preferred?: string | null) {
  if (preferred && ATTORNEYS.some((a) => a.slug === preferred)) return preferred;
  return ATTORNEYS.find((a) => a.leads.includes(matter))?.slug ?? ATTORNEYS[0]?.slug ?? "firm";
}

/** Business days in firm time zone, from tomorrow until the horizon, excluding holidays. */
export function bookableDays(holidays: Set<string>, now = new Date()): string[] {
  const out: string[] = [];
  const todayFirm = new TZDate(now, FIRM_TZ);
  for (let i = 0; i <= HORIZON_DAYS; i++) {
    const d = addDays(todayFirm, i);
    const key = format(d, "yyyy-MM-dd");
    if (!WINDOWS[d.getDay()] || holidays.has(key)) continue;
    if (slotsFor(key, 30, now).length === 0) continue;
    out.push(key);
  }
  return out;
}

/** Slot start instants (UTC Date) for a firm-local day. */
export function slotsFor(day: string, duration: number, now = new Date()): Date[] {
  const [y, m, d] = day.split("-").map(Number);
  const probe = new TZDate(y, m - 1, d, 12, 0, FIRM_TZ);
  const win = WINDOWS[probe.getDay()];
  if (!win) return [];
  const earliest = now.getTime() + MIN_NOTICE_HOURS * 3600_000;
  const res: Date[] = [];
  for (let t = win[0]; t + duration / 60 <= win[1]; t += 0.5) {
    const h = Math.floor(t);
    const min = Math.round((t - h) * 60);
    const inst = new TZDate(y, m - 1, d, h, min, FIRM_TZ);
    if (inst.getTime() >= earliest) res.push(new Date(inst.getTime()));
  }
  return res;
}

export const slotId = (attorney: string, start: Date) => `${attorney}_${start.toISOString().replace(/[:.]/g, "-")}`;

export function visitorTz() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || FIRM_TZ;
  } catch {
    return FIRM_TZ;
  }
}

export function fmtTime(d: Date, tz: string) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz }).format(d);
}

export function fmtDayLong(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d, 12)),
  );
}

export function tzLabel(tz: string, at = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(at);
    return parts.find((p) => p.type === "timeZoneName")?.value ?? tz;
  } catch {
    return tz;
  }
}

/** U.S. federal holidays from the public Nager.Date API (no key, HTTPS, CORS enabled). */
export async function fetchUsHolidays(years: number[]): Promise<Set<string>> {
  const set = new Set<string>();
  await Promise.all(
    years.map(async (y) => {
      try {
        const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${y}/US`, { cache: "force-cache" });
        if (!res.ok) return;
        const rows: { date: string; global: boolean }[] = await res.json();
        rows.filter((r) => r.global).forEach((r) => set.add(r.date));
      } catch {
        // Offline or blocked: fall back to weekday rules only.
      }
    }),
  );
  return set;
}

export function icsFile(opts: { start: Date; minutes: number; title: string; description: string }) {
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = new Date(opts.start.getTime() + opts.minutes * 60_000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RT Law Services//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${stamp(opts.start)}-${Math.random().toString(36).slice(2)}@rtlawservices.com`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(opts.start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${opts.title}`,
    `DESCRIPTION:${opts.description.replace(/\n/g, "\\n")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
