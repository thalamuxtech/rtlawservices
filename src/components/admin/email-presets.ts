// Starting points for the email composer. {{firstName}} and {{name}} are
// filled with the recipient's name when the email is rendered.

import { BLANK_EMAIL, type EmailContent } from "@/lib/email-template";

export type Preset = { id: string; label: string; subject: string; content: Partial<EmailContent> };

export const PRESETS: Preset[] = [
  {
    id: "reply",
    label: "General reply",
    subject: "Your enquiry with RT Law Services",
    content: {
      preheader: "Thank you for contacting RT Law Services.",
      label: "Your enquiry",
      heading: "Thank you for reaching out",
      body: "Thank you for contacting RT Law Services. We have read your message and would be glad to help.\n\nWrite your reply here.",
    },
  },
  {
    id: "consultation",
    label: "Consultation confirmed",
    subject: "Your consultation is confirmed",
    content: {
      preheader: "Your consultation with RT Law Services is confirmed.",
      label: "Consultation confirmed",
      heading: "We look forward to speaking with you",
      body: "Your consultation is confirmed. The details are below.\n\nTo make the most of our time, please have these ready:\n- Your passport and any current visa or status documents\n- Any notices you have received from USCIS (U.S. Citizenship and Immigration Services)\n- A short list of the questions you want answered\n\nIf you need to change the time, reply to this email or call us.",
      detailsEnabled: true,
      detailsTitle: "Consultation details",
      details: "Date:\nTime:\nFormat:\nLength:",
    },
  },
  {
    id: "documents",
    label: "Documents needed",
    subject: "Documents we need for your case",
    content: {
      preheader: "A short list of the documents we need next.",
      label: "Next step",
      heading: "Documents we need from you",
      body: "To move your case forward, please send us the documents below. Clear scans or phone photos are fine.\n\n- First document\n- Second document\n- Third document\n\nReply to this email with the files attached, or tell us if anything is hard to obtain and we will suggest alternatives.",
    },
  },
  {
    id: "evaluation",
    label: "Free evaluation results",
    subject: "Your free evaluation from RT Law Services",
    content: {
      preheader: "Our assessment of your free evaluation.",
      label: "Free evaluation",
      heading: "Your evaluation results",
      body: "Thank you for completing our free evaluation. An attorney has reviewed your answers.\n\nWrite the assessment here.\n\nThis assessment is based only on the answers you gave and is not legal advice. A consultation lets us review your documents and confirm the best route.",
      buttonEnabled: true,
      buttonLabel: "Book a consultation",
      buttonUrl: "https://rtlawservices.com/book/",
    },
  },
  {
    id: "followup",
    label: "Follow-up",
    subject: "Following up on your enquiry",
    content: {
      preheader: "Checking in on your enquiry.",
      label: "Follow-up",
      heading: "Checking in",
      body: "We wanted to follow up on your recent enquiry. If you still need help, reply to this email or book a time that suits you.",
      buttonEnabled: true,
      buttonLabel: "Book a consultation",
      buttonUrl: "https://rtlawservices.com/book/",
    },
  },
  { id: "blank", label: "Blank email", subject: "", content: {} },
];

/** A template as staff see it: built in, built in but edited, or written by staff. */
export type Template = Preset & { builtIn: boolean; edited: boolean };

/**
 * Built-in templates, each replaced by its saved version where staff have
 * edited it, followed by the templates staff have added.
 */
export function mergeTemplates(saved: { id: string; label?: string; subject?: string; content?: Partial<EmailContent> }[]): Template[] {
  const byId = new Map(saved.map((s) => [s.id, s]));
  const builtIn = PRESETS.map((p) => {
    const s = byId.get(p.id);
    return s ? { id: p.id, label: s.label || p.label, subject: s.subject ?? p.subject, content: s.content ?? p.content, builtIn: true, edited: true } : { ...p, builtIn: true, edited: false };
  });
  const custom = saved
    .filter((s) => !PRESETS.some((p) => p.id === s.id))
    .map((s) => ({ id: s.id, label: s.label || "Untitled template", subject: s.subject ?? "", content: s.content ?? {}, builtIn: false, edited: false }))
    .sort((a, b) => a.label.localeCompare(b.label));
  // Blank stays last.
  return [...builtIn.filter((t) => t.id !== "blank"), ...custom, ...builtIn.filter((t) => t.id === "blank")];
}

/** The template's text, signed by the current staff member unless the template names someone. */
export const fromPreset = (p: Preset, signName: string): EmailContent => {
  const content = { ...BLANK_EMAIL, ...p.content };
  return { ...content, signName: content.signName || signName };
};
