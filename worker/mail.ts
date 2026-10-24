// Outgoing email through Brevo's transactional email API. Cloudflare's own
// email sending needs the Workers Paid plan, so the firm uses Brevo's free
// plan instead. The API key is the Worker secret BREVO_API_KEY.

export type Mail = {
  /** Sender address; defaults to MAIL_FROM. Replies go back to it. */
  from?: string;
  to: string | string[];
  toName?: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  text: string;
  /** Full HTML document. Without it, the text is sent in a simple layout. */
  html?: string;
  /** Files as base64, passed to Brevo unchanged. */
  attachments?: { name: string; content: string }[];
  replyTo?: string;
};

export type MailResult = { ok: true; messageId?: string } | { ok: false; error: string };

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Plain text to simple HTML: paragraphs from blank lines, line breaks kept. */
const toHtml = (text: string) =>
  `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#14181F">${text
    .split(/\n{2,}/)
    .map((p) => `<p>${escape(p).replace(/\n/g, "<br>")}</p>`)
    .join("")}</div>`;

const list = (v?: string | string[]) => (Array.isArray(v) ? v : v ? [v] : []);

export type Blocked = { email: string; reason: string; code: string; blockedAt: string; senderEmail?: string };

// Blocks that must stay: the person reported spam or asked to stop receiving
// email. Sending again would break anti-spam law and risk the Brevo account.
const KEEP = /spam|unsubscribed/i;

/**
 * Lifts every block that is safe to lift, or only those for `only` addresses.
 * Brevo blocks an address after one hard bounce, which also catches mailboxes
 * that were briefly unavailable. Returns the addresses unblocked.
 */
export async function clearBlocks(env: Env, only?: string[]) {
  const wanted = only?.map((e) => e.toLowerCase());
  const blocked = await blockedContacts(env);
  const lift = blocked.filter((b) => !KEEP.test(b.code) && (!wanted || wanted.includes(b.email.toLowerCase())));
  for (const b of lift) await unblockContact(env, b.email);
  return lift.map((b) => b.email);
}

/**
 * Addresses Brevo has stopped delivering to, usually after a hard bounce.
 * Brevo still accepts emails to them, then drops them, so they need listing.
 */
export async function blockedContacts(env: Env): Promise<Blocked[]> {
  if (!env.BREVO_API_KEY) return [];
  const res = await fetch("https://api.brevo.com/v3/smtp/blockedContacts?limit=100&sort=desc", {
    headers: { "api-key": env.BREVO_API_KEY, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Brevo answered ${res.status}`);
  const data = (await res.json()) as { contacts?: { email: string; senderEmail?: string; reason?: { code?: string; message?: string }; blockedAt?: string }[] };
  return (data.contacts ?? []).map((c) => ({
    email: c.email,
    senderEmail: c.senderEmail,
    reason: c.reason?.message || c.reason?.code || "Blocked",
    code: c.reason?.code ?? "",
    blockedAt: c.blockedAt ?? "",
  }));
}

export type MailEvent = { email: string; event: string; date: string; reason?: string };

/** What happened to one sent email, recipient by recipient: delivered, opened, bounced, blocked. */
export async function mailEvents(env: Env, messageId: string): Promise<MailEvent[]> {
  if (!env.BREVO_API_KEY || !messageId) return [];
  const res = await fetch(`https://api.brevo.com/v3/smtp/statistics/events?limit=50&sort=desc&messageId=${encodeURIComponent(messageId)}`, {
    headers: { "api-key": env.BREVO_API_KEY, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Brevo answered ${res.status}`);
  const data = (await res.json()) as { events?: MailEvent[] };
  return (data.events ?? []).map(({ email, event, date, reason }) => ({ email, event, date, reason }));
}

/** Lets Brevo deliver to an address again. */
export async function unblockContact(env: Env, email: string) {
  if (!env.BREVO_API_KEY) throw new Error("Email sending is not set up yet.");
  const res = await fetch(`https://api.brevo.com/v3/smtp/blockedContacts/${encodeURIComponent(email)}`, {
    method: "DELETE",
    headers: { "api-key": env.BREVO_API_KEY, Accept: "application/json" },
  });
  if (!res.ok && res.status !== 404) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message || `Brevo answered ${res.status}`);
  }
}

export async function sendMail(env: Env, mail: Mail): Promise<MailResult> {
  if (!env.BREVO_API_KEY) return { ok: false, error: "Email sending is not set up yet." };
  const to = list(mail.to);
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: { email: mail.from || env.MAIL_FROM, name: env.MAIL_FROM_NAME },
        to: to.map((email, i) => ({ email, ...(i === 0 && mail.toName ? { name: mail.toName } : {}) })),
        ...(mail.cc?.length ? { cc: mail.cc.map((email) => ({ email })) } : {}),
        ...(mail.bcc?.length ? { bcc: mail.bcc.map((email) => ({ email })) } : {}),
        replyTo: { email: mail.replyTo || mail.from || env.MAIL_FROM },
        subject: mail.subject,
        textContent: mail.text,
        htmlContent: mail.html || toHtml(mail.text),
        ...(mail.attachments?.length ? { attachment: mail.attachments } : {}),
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { messageId?: string; message?: string };
    return res.ok ? { ok: true, messageId: data.messageId } : { ok: false, error: data.message || `Brevo answered ${res.status}` };
  } catch {
    return { ok: false, error: "The email service could not be reached." };
  }
}
