// What each recorded case event means, grouped into plain categories, and the
// case summary built from them. Meanings come from the published USCIS status
// code list (status-codes.ts). Codes outside that list are shown as such and
// never given a meaning USCIS has not published.

import { STATUS_CODES } from "./status-codes";

export type Category =
  | "filing" | "receipt" | "biometrics" | "checks" | "interview" | "evidence" | "review" | "transfer"
  | "approved" | "denied" | "rejected" | "decision" | "card" | "notice" | "silent" | "other";

export const CATEGORIES: Record<Category, { label: string; explain: string }> = {
  filing: { label: "Filing", explain: "The date USCIS records as the filing date for this case." },
  receipt: { label: "Receipt", explain: "USCIS recorded the case as received and issued a receipt number. A receipt notice (Form I-797C) usually follows." },
  biometrics: { label: "Biometrics", explain: "A step involving fingerprints, a photograph and a signature, usually taken at an Application Support Center appointment or reused from an earlier one." },
  checks: { label: "Background checks", explain: "USCIS recorded results of routine security and background checks, which generally rely on the biometrics on file. This is an expected step." },
  interview: { label: "Interview", explain: "A step about an interview: placing the case in line, scheduling it, sending the notice, changing it or holding it." },
  evidence: { label: "Evidence request", explain: "USCIS asked for more evidence or gave notice of a possible adverse decision. These notices carry a firm response deadline." },
  review: { label: "Review", explain: "An internal processing step, such as a review, a hold or a record update." },
  transfer: { label: "Transfer", explain: "The file moved to another office. Transfers are common and do not by themselves signal a problem." },
  approved: { label: "Approved", explain: "USCIS recorded an approval. A written decision notice usually follows by mail or in the online account." },
  denied: { label: "Adverse decision", explain: "USCIS recorded a denial, revocation or similar adverse decision. Deadlines to appeal or file a motion are short." },
  rejected: { label: "Rejected", explain: "USCIS returned the filing without accepting it, usually for a fee, signature or form version problem." },
  decision: { label: "Decision", explain: "USCIS recorded a final action on the case." },
  card: { label: "Card", explain: "A step in producing or delivering a card, such as a Permanent Resident Card or an Employment Authorization Document. A card is produced only after an approval." },
  notice: { label: "Notice", explain: "USCIS recorded that it generated or sent a notice." },
  silent: { label: "Record update", explain: "The case record changed after its latest recorded event, without a new event code. USCIS records can change this way, for example when an officer opens or updates the file. The record does not say why." },
  other: { label: "Update", explain: "A recorded update whose meaning USCIS has not published." },
};

// Code families from the published list, most specific first.
const CODE_CATEGORY: [RegExp, Category][] = [
  [/^(LAA|LAB|LBA|LDA|LEA|LEB|LEC|LC|LFA|LFB|LFC|LGA|LGB|LDB|LO|LPA|LSP|LM|LLM|L[A-Z]+)$/, "card"],
  [/^(D[A-I]|DAEA|IEA|IEB|IEE|HA1|AKB)$/, "approved"],
  [/^(E[A-F]|EI|EJ|EL|EO|EP|EQ|ER|EW0|IFA[A-F]?|IFB|IYB|IYC|HA2|AJC|ALB|ALC)$/, "denied"],
  [/^(AF[A-Z]*|IC|IBC|ACC|ALA|IWD|IWF)$/, "rejected"],
  [/^(EA0|EK|EM|EN|IT|EX0)$/, "decision"],
  [/^(FA|FB0|FB[A-C]|FC|FCA0|FCB0|IK[A-Z]*|II|IU|IV|IYA)$/, "evidence"],
  [/^(FH[A-Z]?|FI|FJ|FKB|FL|FM|FXA|HE|HG|IM|IX[A-Z]*)$/, "interview"],
  [/^(FN|FN[A-I]|IMAF|KAE|IAE|IBE|ICA|AAB)$/, "biometrics"],
  [/^FTA[0-9A-Z]*$/, "checks"],
  [/^(FOA|FOB|IP|B[A-Z]|CD)$/, "transfer"],
  [/^(IA[A-Z0-9]*|IAF|A[A-Z0-9]*)$/, "receipt"],
  [/^(TA|K[A-Z0-9]*|FR|FS|FF2|F[A-Z0-9]*|H[A-Z]*[0-9]*)$/, "review"],
  [/^I[A-Z0-9]*$/, "notice"],
];

const TEXT_CATEGORY: [RegExp, Category][] = [
  [/(card (is being |was |)(produced|mailed|delivered|picked up)|new card is being produced|card mailed|card personally given|document (was |is being )?(mailed|produced))/i, "card"],
  [/(reject)/i, "rejected"],
  [/(denied|denial|revoked|terminated)/i, "denied"],
  [/(approved|approval|oath ceremony)/i, "approved"],
  [/(request for (initial |additional )?evidence|evidence request|intent to (deny|revoke|rescind|terminate))/i, "evidence"],
  [/(interview)/i, "interview"],
  [/(fingerprints? (were |was )?(taken|captured)|biometric|fingerprint (appointment|processing))/i, "biometrics"],
  [/(background|database checks)/i, "checks"],
  [/(transferred|relocated|new office)/i, "transfer"],
  [/(received|receipt|accepted)/i, "receipt"],
  [/(review|hold|response was received|updated)/i, "review"],
];

export type EventInfo = { title: string; category: Category; source: "published" | "unpublished" | "text" };

/** Title and category of an event, from its USCIS code where there is one. */
export function describeEvent(code?: string, text?: string): EventInfo {
  const c = code?.toUpperCase();
  const published = c ? STATUS_CODES[c] : undefined;
  if (c) {
    const category = (published ? CODE_CATEGORY.find(([re]) => re.test(c))?.[1] : undefined) ?? "other";
    if (published) return { title: published, category, source: "published" };
    return { title: `Internal update (code ${c})`, category: "other", source: "unpublished" };
  }
  const t = text ?? "";
  return { title: t || "Status update", category: TEXT_CATEGORY.find(([re]) => re.test(t))?.[1] ?? "other", source: "text" };
}

/** The forms whose approval leads to a card or a similar document. */
export const CARD_FORMS = /^(I-?485|I-?765|I-?90|I-?751|I-?829|I-?821D|I-?131|N-?400|N-?565|N-?600)$/i;
