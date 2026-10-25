// Tells the firm about a new consultation request or free evaluation with a
// branded email to info@ (an alias of the clientservice@ mailbox in Hostinger).
// Replying answers the client directly. A failure here never affects the
// visitor's submission, which is already saved.

import { BLANK_EMAIL, DEFAULT_BRAND, renderEmail } from "../src/lib/email-template";
import type { Doc } from "./lib";
import { sendMail } from "./mail";

const NOTIFY_TO = "info@rtlawservices.com";

/** One "Label: value" line for the details box; line breaks would split it. */
const line = (label: string, value: unknown) => {
  const v = Array.isArray(value) ? value.join(", ") : String(value ?? "").trim();
  return v ? `${label}: ${v.replace(/\s*\n\s*/g, " ").slice(0, 400)}` : "";
};

const words = (key: string) => key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

async function notify(env: Env, opts: { subject: string; label: string; heading: string; body: string; details: string[]; replyTo: string; replyName: string; link: string }) {
  const { html, text } = renderEmail(
    {
      ...BLANK_EMAIL,
      preheader: opts.heading,
      label: opts.label,
      heading: opts.heading,
      greeting: "",
      body: opts.body,
      detailsEnabled: true,
      detailsTitle: "Summary",
      details: opts.details.filter(Boolean).join("\n"),
      buttonEnabled: true,
      buttonLabel: "Open in the back office",
      buttonUrl: opts.link,
      closing: "",
      signName: "",
      signTitle: "",
      showContact: false,
      showNotice: true,
    },
    {},
    { ...DEFAULT_BRAND, website: env.SITE_URL },
  );
  const result = await sendMail(env, { from: NOTIFY_TO, to: NOTIFY_TO, replyTo: opts.replyTo, subject: opts.subject, html, text });
  console.log(`notify: ${opts.subject} -> ${result.ok ? "sent" : `failed, ${result.error}`}`);
}

export async function notifyBooking(env: Env, b: Doc, start: Date) {
  const et = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }).format(start);
  let local = "";
  try {
    if (b.visitorTz && b.visitorTz !== "America/New_York")
      local = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: String(b.visitorTz), timeZoneName: "short" }).format(start);
  } catch {}
  await notify(env, {
    subject: `New consultation request: ${b.name}, ${b.matterLabel}`,
    label: "New consultation request",
    heading: `${b.name} asked for a consultation`,
    body: `A consultation was requested on the website. Confirm it with the client after the conflict check. Reply to this email to write to ${b.name} directly.`,
    details: [
      line("Matter", b.matterLabel),
      line("When", `${et} Eastern Time${local ? ` (${local} for the client)` : ""}`),
      line("Format", b.mode === "phone" ? "Phone call" : "Video call"),
      line("Length", `${b.durationMin} minutes`),
      line("Name", b.name),
      line("Email", b.email),
      line("Phone", b.phone),
      line("Country", b.country),
      line("Language", b.language),
      line("Other parties", b.otherParties),
      line("Notes", b.notes),
      line("Heard about us", b.source),
    ],
    replyTo: String(b.email),
    replyName: String(b.name),
    link: `${env.SITE_URL}/admin/#bookings`,
  });
}

export async function notifyEvaluation(env: Env, e: Doc) {
  const answers = Object.entries((e.answers ?? {}) as Record<string, unknown>)
    .filter(([, v]) => (Array.isArray(v) ? v.length : String(v ?? "").trim()))
    .slice(0, 24)
    .map(([k, v]) => line(words(k), v));
  const file = e.file as { name?: string } | null;
  await notify(env, {
    subject: `New free evaluation: ${e.name} (${e.track === "professional" ? "professional" : "family"})`,
    label: "New free evaluation",
    heading: `${e.name} submitted a free evaluation`,
    body: `A free evaluation questionnaire was submitted on the website.${file?.name ? " The CV is in the back office." : ""} Reply to this email to write to ${e.name} directly.`,
    details: [
      line("Track", e.track === "professional" ? "Professional or employer petition" : "Family, citizenship or problem case"),
      line("Name", e.name),
      line("Email", e.email),
      line("Phone", e.phone),
      line("Country of birth", e.birthCountry),
      line("CV", file?.name),
      ...answers,
    ],
    replyTo: String(e.email),
    replyName: String(e.name),
    link: `${env.SITE_URL}/admin/#evaluations`,
  });
}
