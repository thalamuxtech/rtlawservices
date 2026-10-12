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

export type HistoryItem = { date?: Date; rawDate?: string; title: string; detail?: string; code?: string };
export type Notice = { title: string; date?: Date; fields: { label: string; value: string }[] };

export type CaseRecord = {
  source: "api" | "account";
  receiptNumber: string;
  formType?: string;
  submitted?: Date;
  modified?: Date;
  statusTitle?: string;
  statusText?: string;
  closed?: boolean;
  actionRequired?: boolean;
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
  const us = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(.*)$/.exec(v);
  const d = us ? new Date(`${us[3]}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}${us[4] || "T12:00:00Z"}`) : new Date(/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T12:00:00Z` : v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

const byDate = (a: { date?: Date }, b: { date?: Date }) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0);

function fromApi(c: Obj): CaseRecord {
  const hist = Array.isArray(c.hist_case_status) ? c.hist_case_status : Array.isArray(c.history) ? c.history : [];
  const history: HistoryItem[] = hist.filter(isObj).map((h) => {
    const rawDate = first(h, ["date", "completed_date", "statusDate", "modifiedDate"]);
    return {
      rawDate,
      date: parseDate(rawDate),
      title: first(h, ["completed_text_en", "text_en", "status_text_en", "statusText", "status"]) ?? "Status update",
      detail: first(h, ["completed_desc_en", "desc_en", "status_desc_en", "description"]),
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
  return record;
}

const DATE_KEY = /(date|time|timestamp|at)$/i;
const label = (k: string) => k.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

function fromAccount(d: Obj): CaseRecord {
  const events = Array.isArray(d.events) ? d.events.filter(isObj) : [];
  const history: HistoryItem[] = events.map((e) => {
    const code = first(e, ["eventCode", "code"]);
    const rawDate = first(e, ["eventDateTime", "eventTimestamp", "eventDate", "createdAt", "createdAtTimestamp"]);
    return { code, rawDate, date: parseDate(rawDate), title: codeMeaning(code) ?? (code ? `Status code ${code}` : "Case event") };
  });
  const notices: Notice[] = (Array.isArray(d.notices) ? d.notices.filter(isObj) : []).map((n) => {
    const fields = Object.entries(n)
      .filter(([k, v]) => k !== "receiptNumber" && (typeof v === "string" || typeof v === "number") && String(v).trim())
      .map(([k, v]) => {
        const date = DATE_KEY.test(k) ? parseDate(String(v)) : undefined;
        return { label: label(k), value: date ? date.toLocaleDateString("en-US", { dateStyle: "medium" }) : String(v) };
      });
    return {
      title: first(n, ["actionType", "noticeType", "letterType", "type", "title"]) ?? "Notice",
      date: parseDate(first(n, ["generationDate", "mailingDate", "noticeDate", "createdAt"])),
      fields,
    };
  });
  const latest = [...history].sort(byDate)[0];
  return {
    source: "account",
    receiptNumber: first(d, ["receiptNumber", "receipt_number"]) ?? "",
    formType: first(d, ["formType", "form_type"]),
    submitted: parseDate(first(d, ["submissionDate", "submissionTimestamp", "submittedDate"])),
    modified: parseDate(first(d, ["updatedAt", "updatedAtTimestamp", "modifiedDate"])),
    statusTitle: latest?.title,
    statusText: latest?.code ? `Latest status code ${latest.code}, as published in the USCIS status code list.` : undefined,
    closed: typeof d.closed === "boolean" ? d.closed : undefined,
    actionRequired: typeof d.actionRequired === "boolean" ? d.actionRequired : undefined,
    history: history.sort(byDate),
    notices: notices.sort(byDate),
  };
}

/** Reads case data in either format. Throws with a plain message if it cannot. */
export function parseCase(input: unknown): CaseRecord {
  const root = typeof input === "string" ? JSON.parse(input) : input;
  if (!isObj(root)) throw new Error("This does not look like case data.");
  if (isObj(root.case_status)) return fromApi(root.case_status);
  const data = isObj(root.data) ? root.data : root;
  if (Array.isArray(data.events) || Array.isArray(data.notices)) return fromAccount(data);
  if ("current_case_status_text_en" in data || "hist_case_status" in data) return fromApi(data);
  throw new Error("No case status was found in this data. Paste the full response, starting with the first curly bracket.");
}

/** Sorts a status message into a tone, used only for colour and wording. */
export function toneOf(text = ""): Tone {
  const t = text.toLowerCase();
  if (/(denied|rejected|terminated|revoked|withdrawn|abandoned|not approved|dismissed)/.test(t)) return "negative";
  if (/(request for (initial )?evidence|intent to deny|\brfe\b|noid|evidence was sent|need(s)? more)/.test(t)) return "action";
  if (/(approved|card was (produced|mailed|delivered|picked up)|card produced|oath ceremony|welcomed|document was (mailed|produced))/.test(t)) return "positive";
  return "progress";
}

export const STAGES = ["Received", "Biometrics", "In review", "Decision", "Delivered"] as const;

const STAGE_RULES: [number, RegExp][] = [
  [4, /(card was (mailed|delivered|picked up)|delivered|document was mailed|oath ceremony was (completed|held)|card mailed)/i],
  [3, /(approved|denied|decision|oath ceremony|rejected|notice ordered|terminated)/i],
  [2, /(review|interview|evidence|transferred|relocated|ready for|pre-adjudicated|adjudicat)/i],
  [1, /(biometric|fingerprint)/i],
  [0, /(receiv|receipt|accepted|filed)/i],
];

/** How far the case appears to have moved, judged only from its status messages. */
export function stageOf(c: CaseRecord) {
  const texts = [c.statusTitle ?? "", ...c.history.map((h) => h.title)];
  let stage = -1;
  for (const t of texts) for (const [s, re] of STAGE_RULES) if (s > stage && re.test(t)) stage = s;
  return Math.max(0, stage);
}

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
      { date: "2026-03-20", completed_text_en: "Fingerprint Fee Was Received" },
      { date: "2026-02-12", completed_text_en: "Case Was Received" },
    ],
  },
};
