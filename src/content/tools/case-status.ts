// Logic behind the case status tracker: receipt numbers, form names, and the
// two kinds of case data it reads.
//
// 1. The USCIS Case Status API (Torch), reached through the firm's relay
//    (workers/case-status). Its response holds a `case_status` object with the
//    receipt number, form type, dates, current status and status history.
// 2. The case data a person can open in their own myUSCIS account, which lists
//    events by USCIS status code (see status-codes.ts) and notices.
//
// Field names differ between the two and USCIS has changed them before, so the
// parser looks for each value under the names known to be used and ignores the
// rest. Everything here runs in the visitor's browser.

import { STATUS_CODES } from "./status-codes";
import { CARD_FORMS, describeEvent, type Category } from "./case-events";

/** Three letters followed by ten digits, for example EAC2190000001. */
export const RECEIPT = /^[A-Z]{3}\d{10}$/;

export const normalizeReceipt = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

/** The office a receipt number's first three letters usually point to. */
const CENTERS: Record<string, string> = {
  EAC: "Vermont Service Center",
  VSC: "Vermont Service Center",
  WAC: "California Service Center",
  CSC: "California Service Center",
  LIN: "Nebraska Service Center",
  NSC: "Nebraska Service Center",
  SRC: "Texas Service Center",
  TSC: "Texas Service Center",
  MSC: "National Benefits Center",
  NBC: "National Benefits Center",
  YSC: "Potomac Service Center",
  IOE: "USCIS online filing (Electronic Immigration System)",
};

export function receiptOffice(receipt: string) {
  const prefix = receipt.slice(0, 3);
  return CENTERS[prefix] ?? (/^[A-Z]{3}$/.test(prefix) ? `A USCIS office (code ${prefix})` : undefined);
}

/** Official titles of common USCIS forms. */
const FORMS: Record<string, string> = {
  "I-90": "Application to Replace Permanent Resident Card",
  "I-102": "Application for Replacement/Initial Nonimmigrant Arrival-Departure Document",
  "I-129": "Petition for a Nonimmigrant Worker",
  "I-129F": "Petition for Alien Fiancé(e)",
  "I-130": "Petition for Alien Relative",
  "I-131": "Application for Travel Document",
  "I-140": "Immigrant Petition for Alien Worker",
  "I-290B": "Notice of Appeal or Motion",
  "I-360": "Petition for Amerasian, Widow(er), or Special Immigrant",
  "I-485": "Application to Register Permanent Residence or Adjust Status",
  "I-526": "Immigrant Petition by Standalone Investor",
  "I-526E": "Immigrant Petition by Regional Center Investor",
  "I-539": "Application to Extend/Change Nonimmigrant Status",
  "I-589": "Application for Asylum and for Withholding of Removal",
  "I-601": "Application for Waiver of Grounds of Inadmissibility",
  "I-601A": "Application for Provisional Unlawful Presence Waiver",
  "I-730": "Refugee/Asylee Relative Petition",
  "I-751": "Petition to Remove Conditions on Residence",
  "I-765": "Application for Employment Authorization",
  "I-821": "Application for Temporary Protected Status",
  "I-821D": "Consideration of Deferred Action for Childhood Arrivals",
  "I-824": "Application for Action on an Approved Application or Petition",
  "I-829": "Petition by Investor to Remove Conditions on Permanent Resident Status",
  "I-907": "Request for Premium Processing Service",
  "I-914": "Application for T Nonimmigrant Status",
  "I-918": "Petition for U Nonimmigrant Status",
  "N-400": "Application for Naturalization",
  "N-565": "Application for Replacement Naturalization/Citizenship Document",
  "N-600": "Application for Certificate of Citizenship",
};

export function formName(code?: string) {
  if (!code) return undefined;
  const key = code.toUpperCase().replace(/\s+/g, "").replace(/^([IN])(\d)/, "$1-$2");
  return FORMS[key];
}

export const codeMeaning = (code?: string) => (code ? STATUS_CODES[code.toUpperCase()] : undefined);

export type Tone = "positive" | "action" | "negative" | "progress";

export type HistoryItem = {
  /** When the event happened, as USCIS records it. */
  date?: Date;
  rawDate?: string;
  /** When USCIS entered it in the record, if that differs. */
  recorded?: Date;
  title: string;
  detail?: string;
  code?: string;
  id?: string;
  category?: Category;
  source?: "published" | "unpublished" | "text";
  /** Entries the tracker adds: the filing date, and a record change with no event. */
  kind?: "event" | "filed" | "silent";
};

export type Notice = { title: string; date?: Date; appointment?: Date; letterId?: string; receipt?: string; fields: { label: string; value: string }[] };

export type CaseRecord = {
  source: "api" | "account";
  receiptNumber: string;
  formType?: string;
  formName?: string;
  applicant?: string;
  channel?: string;
  submitted?: Date;
  modified?: Date;
  statusTitle?: string;
  statusText?: string;
  statusCategory?: Category;
  closed?: boolean;
  actionRequired?: boolean;
  /** USCIS flags from the account data, shown only when present. */
  acked?: boolean;
  premium?: boolean;
  groupComplete?: boolean;
  evidenceOpen?: number;
  history: HistoryItem[];
  notices: Notice[];
};

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : typeof v === "number" ? String(v) : undefined);
const first = (o: Obj, keys: string[]) => keys.map((k) => str(o[k])).find(Boolean);

/** Reads the date formats USCIS uses: ISO 8601, MM-DD-YYYY and written-out dates. */
export function parseDate(v?: string): Date | undefined {
  if (!v) return undefined;
  if (/^\d{10,13}$/.test(v)) return new Date(Number(v) * (v.length === 10 ? 1000 : 1));
  const us = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(.*)$/.exec(v);
  const d = us ? new Date(`${us[3]}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}${us[4] || "T12:00:00Z"}`) : new Date(/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T12:00:00Z` : v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

const byDate = (a: { date?: Date }, b: { date?: Date }) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0);

function fromApi(c: Obj): CaseRecord {
  const hist = Array.isArray(c.hist_case_status) ? c.hist_case_status : Array.isArray(c.history) ? c.history : [];
  const history: HistoryItem[] = hist.filter(isObj).map((h) => {
    const rawDate = first(h, ["date", "completed_date", "statusDate", "modifiedDate"]);
    const text = first(h, ["completed_text_en", "text_en", "status_text_en", "statusText", "status"]) ?? "Status update";
    const info = describeEvent(undefined, text);
    return {
      rawDate,
      date: parseDate(rawDate),
      title: text,
      detail: first(h, ["completed_desc_en", "desc_en", "status_desc_en", "description"]),
      category: info.category,
      source: info.source,
      kind: "event" as const,
    };
  });
  const record: CaseRecord = {
    source: "api",
    receiptNumber: first(c, ["receiptNumber", "receipt_number"]) ?? "",
    formType: first(c, ["formType", "form_type"]),
    submitted: parseDate(first(c, ["submittedDate", "submitted_date", "submissionDate"])),
    modified: parseDate(first(c, ["modifiedDate", "modified_date", "updatedAt"])),
    statusTitle: first(c, ["current_case_status_text_en", "statusText", "status"]),
    statusText: first(c, ["current_case_status_desc_en", "statusDescription", "description"]),
    history: history.sort(byDate),
    notices: [],
  };
  record.statusCategory = describeEvent(undefined, record.statusTitle).category;
  if (record.submitted && !record.history.some((h) => h.category === "filing")) record.history.push({ date: record.submitted, title: "Filed", category: "filing", kind: "filed" });
  return record;
}

const DATE_KEY = /(date|time|timestamp|at)$/i;
const label = (k: string) => k.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

const bool = (v: unknown) => (typeof v === "boolean" ? v : undefined);
const findKey = (o: Obj, re: RegExp) => Object.keys(o).find((k) => re.test(k));

function fromAccount(d: Obj): CaseRecord {
  const events = Array.isArray(d.events) ? d.events.filter(isObj) : [];
  const history: HistoryItem[] = events.map((e) => {
    const code = first(e, ["eventCode", "code"]);
    const rawDate = first(e, ["eventDateTime", "eventTimestamp", "eventDate"]) ?? first(e, ["createdAtTimestamp", "createdAt"]);
    const date = parseDate(rawDate);
    const recorded = parseDate(first(e, ["createdAtTimestamp", "createdAt"]));
    const info = describeEvent(code);
    return {
      code,
      id: first(e, ["eventId", "id"]),
      rawDate,
      date,
      // Show the entry date only when it is a different day from the event.
      recorded: recorded && date && Math.abs(recorded.getTime() - date.getTime()) > 12 * 3_600_000 ? recorded : undefined,
      title: info.title,
      category: info.category,
      source: info.source,
      kind: "event" as const,
    };
  });

  const notices: Notice[] = (Array.isArray(d.notices) ? d.notices.filter(isObj) : []).map((n) => {
    const skip = new Set(["receiptNumber", "letterId", "generationDate", "appointmentDateTime", "actionType", "noticeType", "letterType", "type", "title"]);
    const fields = Object.entries(n)
      .filter(([k, v]) => !skip.has(k) && (typeof v === "string" || typeof v === "number" || typeof v === "boolean") && String(v).trim())
      .map(([k, v]) => {
        const date = DATE_KEY.test(k) ? parseDate(String(v)) : undefined;
        return { label: label(k), value: date ? date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : String(v) };
      });
    const kind = first(n, ["actionType", "noticeType", "letterType", "type", "title"]);
    return {
      title: kind ? label(kind.replace(/_/g, " ").toLowerCase()) : "Notice",
      date: parseDate(first(n, ["generationDate", "mailingDate", "noticeDate", "createdAt"])),
      appointment: parseDate(first(n, ["appointmentDateTime", "appointmentDate", "appointmentTimestamp"])),
      letterId: first(n, ["letterId", "noticeId", "documentId"]),
      receipt: first(n, ["receiptNumber"]),
      fields,
    };
  });

  const submitted = parseDate(first(d, ["submissionTimestamp", "submissionDate", "submittedDate"]));
  const modified = parseDate(first(d, ["updatedAtTimestamp", "updatedAt", "modifiedDate"]));
  const sorted = history.sort(byDate);
  // The headline is the latest event with a published meaning, else the latest event.
  const head = sorted.find((h) => h.source === "published") ?? sorted[0];

  const latestEntry = Math.max(0, ...sorted.map((h) => Math.max(h.date?.getTime() ?? 0, h.recorded?.getTime() ?? 0)));
  if (modified && latestEntry && modified.getTime() - latestEntry > 60_000) sorted.unshift({ date: modified, title: "Case record updated", category: "silent", kind: "silent" });
  if (submitted) sorted.push({ date: submitted, title: "Application filed", category: "filing", kind: "filed" });

  const premiumKey = findKey(d, /premium/i);
  const evidenceKey = findKey(d, /(evidenceRequest|rfe)/i);
  const evidence = evidenceKey ? d[evidenceKey] : undefined;
  return {
    source: "account",
    receiptNumber: first(d, ["receiptNumber", "receipt_number"]) ?? "",
    formType: first(d, ["formType", "form_type"]),
    formName: first(d, ["formName", "form_name"]),
    applicant: first(d, ["applicantName", "beneficiaryName", "name"]),
    channel: first(d, ["elisChannelType", "channelType", "filingChannel"]),
    submitted,
    modified,
    statusTitle: head?.title,
    statusText: head?.code
      ? head.source === "published"
        ? `USCIS status code ${head.code}, recorded ${head.date ? head.date.toLocaleDateString("en-US", { dateStyle: "long" }) : "on an unknown date"}.`
        : `USCIS recorded code ${head.code}, which is not in the published code list.`
      : undefined,
    statusCategory: head?.category,
    closed: bool(d.closed),
    actionRequired: bool(d.actionRequired),
    acked: bool(d.ackedByAdjudicatorAndCms),
    premium: premiumKey ? bool(d[premiumKey]) : undefined,
    groupComplete: bool(d.areAllGroupStatusesComplete),
    evidenceOpen: Array.isArray(evidence) ? evidence.length : typeof evidence === "boolean" ? Number(evidence) : undefined,
    history: sorted,
    notices: notices.sort(byDate),
  };
}

const SIGNED_OUT =
  "It looks like you were not signed in to your USCIS account when this was copied. Sign in at myaccount.uscis.gov first (step 1), then open your case data again.";

/** Why case data could not be read, so the tracker can say what to do next. */
export type CaseDataProblem = "signed-out" | "not-case-data" | "uscis-error" | "no-status";

export class CaseDataError extends Error {
  constructor(readonly kind: CaseDataProblem, message: string) {
    super(message);
  }
}

/** Reads case data in either format. Throws with a plain message if it cannot. */
export function parseCase(input: unknown): CaseRecord {
  let root = input;
  if (typeof input === "string") {
    const text = input.trim();
    // Copied text sometimes carries words before or after the data; keep the outermost braces.
    const json = text.slice(Math.max(0, text.indexOf("{")), text.lastIndexOf("}") + 1);
    try {
      root = JSON.parse(json || text);
    } catch {
      if (/(sign[ -]?in|log[ -]?in|session|password|unauthori[sz]ed|access denied)/i.test(text)) throw new CaseDataError("signed-out", SIGNED_OUT);
      throw new CaseDataError("not-case-data", "This is not case data. On the USCIS case data page, select all the text, copy it, and try again.");
    }
  }
  if (!isObj(root)) throw new CaseDataError("not-case-data", "This does not look like case data.");
  // USCIS answers with an error object when the person is signed out or the case is not theirs.
  const err = !isObj(root.data) && !isObj(root.case_status) ? first(root, ["error", "message", "error_description"]) ?? (Array.isArray(root.errors) && isObj(root.errors[0]) ? first(root.errors[0], ["message"]) : undefined) : undefined;
  if (err) {
    if (/(auth|sign|log|session|token|forbidden|401|403)/i.test(err)) throw new CaseDataError("signed-out", SIGNED_OUT);
    throw new CaseDataError("uscis-error", `USCIS answered: "${err}". Check the receipt number and that you are signed in to the account that filed it.`);
  }
  if (isObj(root.case_status)) return fromApi(root.case_status);
  const data = isObj(root.data) ? root.data : root;
  if (Array.isArray(data.events) || Array.isArray(data.notices)) return fromAccount(data);
  if ("current_case_status_text_en" in data || "hist_case_status" in data) return fromApi(data);
  throw new CaseDataError("no-status", "No case status was found in this data. Paste the full response, starting with the first curly bracket.");
}

/** Sorts a status message into a tone, used only for colour and wording. */
export function toneOf(text = ""): Tone {
  const t = text.toLowerCase();
  if (/(denied|denial|rejected|reject\b|terminated|revoked|withdrawn|abandon|not approved|dismissed|undeliverable|destroyed)/.test(t)) return "negative";
  if (/(request for (initial |additional )?evidence|evidence request|evidence requested|intent to (deny|revoke|rescind|terminate)|\brfe\b|noid|need(s)? more|failed to appear)/.test(t)) return "action";
  if (/(approved|approval|card (is being |was |)(produced|mailed|delivered|picked up)|new card is being produced|card mailed|card personally given|oath ceremony|welcomed|document was (mailed|produced))/.test(t)) return "positive";
  return "progress";
}

export const STAGES = ["Received", "Biometrics", "In review", "Decision", "Card or document"] as const;

const STAGE_OF: Partial<Record<Category, number>> = {
  filing: 0, receipt: 0,
  biometrics: 1, checks: 1,
  interview: 2, evidence: 2, review: 2, transfer: 2, notice: 2,
  approved: 3, denied: 3, rejected: 3, decision: 3,
  card: 4,
};

/**
 * How far the case appears to have moved: the furthest stage any recorded
 * event reaches, by its category. Returns the event that decided it, so the
 * page can show the basis.
 */
export function stageOf(c: CaseRecord): { stage: number; basis?: HistoryItem } {
  let stage = -1;
  let basis: HistoryItem | undefined;
  for (const h of c.history) {
    if (h.kind === "silent") continue;
    const s = h.category ? (STAGE_OF[h.category] ?? -1) : -1;
    if (s > stage || (s === stage && basis && (h.date?.getTime() ?? 0) > (basis.date?.getTime() ?? 0))) {
      stage = s;
      basis = h;
    }
  }
  const head = c.statusCategory ? (STAGE_OF[c.statusCategory] ?? -1) : -1;
  if (head > stage) {
    stage = head;
    basis = { title: c.statusTitle ?? "", category: c.statusCategory };
  }
  return { stage: Math.max(0, stage), basis };
}

/** Tone of the case, from its furthest decisive event. */
export function caseTone(c: CaseRecord): Tone {
  const cats = new Set(c.history.map((h) => h.category));
  if (cats.has("denied") || cats.has("rejected")) return "negative";
  if (cats.has("card") || cats.has("approved")) return "positive";
  if (c.statusCategory === "evidence" || c.actionRequired) return "action";
  return toneOf(c.statusTitle);
}

export { CARD_FORMS };

export const daysBetween = (a: Date, b: Date) => Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000));

/** A fictional case in the API format, for trying the tracker. */
export const SAMPLE = {
  case_status: {
    receiptNumber: "EAC9999103403",
    formType: "I-130",
    submittedDate: "2026-02-09",
    modifiedDate: "2026-09-18",
    current_case_status_text_en: "Case Is Being Actively Reviewed By USCIS",
    current_case_status_desc_en:
      "This is a fictional example. In a real case, this message explains that an officer is reviewing the file and that USCIS will send a notice if it needs anything else.",
    hist_case_status: [
      { date: "2026-09-18", completed_text_en: "Case Is Being Actively Reviewed By USCIS" },
      { date: "2026-06-02", completed_text_en: "Case Was Transferred And A New Office Has Jurisdiction" },
      { date: "2026-03-20", completed_text_en: "Case Was Updated To Show Fingerprints Were Taken" },
      { date: "2026-02-12", completed_text_en: "Case Was Received" },
    ],
  },
};

const ev = (eventId: string, eventCode: string, eventDateTime: string, createdAtTimestamp = eventDateTime) => ({ eventId, eventCode, eventDateTime, createdAtTimestamp });

/** A fictional case in the myUSCIS account format, for trying the detailed view. */
export const SAMPLE_ACCOUNT = {
  data: {
    receiptNumber: "IOE0912345678",
    formType: "I-485",
    formName: "Application to Register Permanent Residence or Adjust Status",
    applicantName: "SAMPLE, ALEX",
    submissionDate: "2025-03-17",
    submissionTimestamp: "2025-03-17T00:00:00Z",
    updatedAtTimestamp: "2026-07-22T20:13:00Z",
    elisChannelType: "Lockbox",
    closed: true,
    ackedByAdjudicatorAndCms: true,
    areAllGroupStatusesComplete: false,
    actionRequired: false,
    events: [
      ev("example-07", "LDA", "2026-07-22T20:13:00Z", "2026-07-22T20:17:00Z"),
      ev("example-06", "H008", "2026-07-17T18:43:00Z"),
      ev("example-05", "FTA0", "2025-04-01T12:31:00Z", "2026-07-16T16:54:00Z"),
      ev("example-04", "FTA0", "2025-04-01T12:31:00Z"),
      ev("example-03", "FNB", "2025-04-07T14:20:00Z"),
      ev("example-02", "IAF", "2025-03-17T00:00:00Z", "2025-03-25T14:22:00Z"),
    ],
    notices: [{ generationDate: "2025-03-21T23:38:00Z", appointmentDateTime: "2025-04-07T14:00:00Z", actionType: "APPOINTMENT_SCHEDULED", letterId: "000000001" }],
  },
};
