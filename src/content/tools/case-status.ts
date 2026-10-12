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

const SIGNED_OUT =
  "It looks like you were not signed in to your USCIS account when this was copied. Sign in at myaccount.uscis.gov first (step 1), then open your case data again.";

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
      if (/(sign[ -]?in|log[ -]?in|session|password|unauthori[sz]ed|access denied)/i.test(text)) throw new Error(SIGNED_OUT);
      throw new Error("This is not case data. On the USCIS case data page, select all the text, copy it, and try again.");
    }
  }
  if (!isObj(root)) throw new Error("This does not look like case data.");
  // USCIS answers with an error object when the person is signed out or the case is not theirs.
  const err = !isObj(root.data) && !isObj(root.case_status) ? first(root, ["error", "message", "error_description"]) ?? (Array.isArray(root.errors) && isObj(root.errors[0]) ? first(root.errors[0], ["message"]) : undefined) : undefined;
  if (err) throw new Error(/(auth|sign|log|session|token|forbidden|401|403)/i.test(err) ? SIGNED_OUT : `USCIS answered: "${err}". Check the receipt number and that you are signed in to the account that filed it.`);
  if (isObj(root.case_status)) return fromApi(root.case_status);
  const data = isObj(root.data) ? root.data : root;
  if (Array.isArray(data.events) || Array.isArray(data.notices)) return fromAccount(data);
  if ("current_case_status_text_en" in data || "hist_case_status" in data) return fromApi(data);
  throw new Error("No case status was found in this data. Paste the full response, starting with the first curly bracket.");
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

// Stage of each USCIS status code, by the families in the NIEM code list
// (status-codes.ts). Codes not listed here do not move the stage.
const CODE_STAGES: [RegExp, number][] = [
  // Card ordered, produced, mailed or handed over.
  [/^(LAA|LAB|LBA|LDA|LEA|LEB|LEC)$/, 4],
  // Approvals, denials, rejections and their notices; petition sent on to the Department of State.
  [/^(D[A-I]|DAEA|E[A-F]|E[I-R]|EA0|EW0|IEA|IEB|IEE|IFA[A-F]?|IFB|IYB|IYC|AF[A-Z]*|IC|IBC|KO)$/, 3],
  // Fingerprints and biometrics.
  [/^(FN|FN[A-I]|FTA[0-9A-Z]*|IMAF|KAE)$/, 1],
  // Review: evidence requests, interviews, transfers, holds and intent notices.
  [/^(F[A-Z0-9]*|H[A-Z0-9]*|II|IK[A-Z]*|IM|IP|IU|IV|IX[A-Z]*|IYA|B[A-Z]|CD|K[A-Z0-9]*|TA)$/, 2],
  // Receipt and intake.
  [/^(IA[A-Z0-9]*|IAF|A[A-Z0-9]*)$/, 0],
];

// Stage of a status message in words, for data without codes (the Case Status API).
const TEXT_STAGES: [RegExp, number][] = [
  [/(card (is being |was |)(produced|mailed|delivered|picked up)|new card is being produced|card mailed|card personally given|document (was |is being )?(mailed|produced)|delivered to me)/i, 4],
  [/(approved|approval|denied|denial|decision|notice ordered|rejected|terminated|revoked|withdrawal acknowledg|oath ceremony)/i, 3],
  [/(fingerprints? (were |was )?(taken|captured)|biometrics? (appointment|services|were taken|was taken)|fingerprint (appointment|processing))/i, 1],
  [/(review|interview|evidence|transferred|relocated|ready for|pre-adjudicated|adjudicat|intent to|response was received|hold)/i, 2],
  [/(receiv|receipt|accepted)/i, 0],
];

function stageOfItem(title: string, code?: string) {
  if (code) {
    const hit = CODE_STAGES.find(([re]) => re.test(code.toUpperCase()));
    if (hit) return hit[1];
  }
  return TEXT_STAGES.find(([re]) => re.test(title))?.[1] ?? -1;
}

/**
 * How far the case appears to have moved: the furthest stage any recorded
 * update reaches, using its USCIS status code where there is one. Returns the
 * update that decided it, so the page can show the basis.
 */
export function stageOf(c: CaseRecord): { stage: number; basis?: HistoryItem } {
  const items: HistoryItem[] = [...c.history, ...(c.statusTitle && !c.history.some((h) => h.title === c.statusTitle) ? [{ title: c.statusTitle }] : [])];
  let stage = -1;
  let basis: HistoryItem | undefined;
  for (const h of items) {
    const s = stageOfItem(h.title, h.code);
    if (s > stage || (s === stage && basis && (h.date?.getTime() ?? 0) > (basis.date?.getTime() ?? 0))) {
      stage = s;
      basis = h;
    }
  }
  // A closed case with a favourable last update has, at least, a decision.
  if (c.closed && toneOf(c.statusTitle) === "positive" && stage < 3) stage = 3;
  return { stage: Math.max(0, stage), basis };
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
      { date: "2026-03-20", completed_text_en: "Case Was Updated To Show Fingerprints Were Taken" },
      { date: "2026-02-12", completed_text_en: "Case Was Received" },
    ],
  },
};
