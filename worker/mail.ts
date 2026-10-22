// Outgoing email through Brevo's transactional email API. Cloudflare's own
// email sending needs the Workers Paid plan, so the firm uses Brevo's free
// plan instead. The API key is the Worker secret BREVO_API_KEY.

export type Mail = {
  to: string | string[];
  toName?: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  text: string;
  /** Full HTML document. Without it, the text is sent in a simple layout. */
  html?: string;
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

export async function sendMail(env: Env, mail: Mail): Promise<MailResult> {
  if (!env.BREVO_API_KEY) return { ok: false, error: "Email sending is not set up yet." };
  const to = list(mail.to);
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: { email: env.MAIL_FROM, name: env.MAIL_FROM_NAME },
        to: to.map((email, i) => ({ email, ...(i === 0 && mail.toName ? { name: mail.toName } : {}) })),
        ...(mail.cc?.length ? { cc: mail.cc.map((email) => ({ email })) } : {}),
        ...(mail.bcc?.length ? { bcc: mail.bcc.map((email) => ({ email })) } : {}),
        replyTo: { email: mail.replyTo || env.MAIL_FROM },
        subject: mail.subject,
        textContent: mail.text,
        htmlContent: mail.html || toHtml(mail.text),
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { messageId?: string; message?: string };
    return res.ok ? { ok: true, messageId: data.messageId } : { ok: false, error: data.message || `Brevo answered ${res.status}` };
  } catch {
    return { ok: false, error: "The email service could not be reached." };
  }
}
