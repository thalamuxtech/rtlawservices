// The firm's branded email. The back office uses it for the live preview and
// the Worker (worker/admin.ts) uses it to build the message it sends, so the
// preview is exactly what the client receives.
//
// Email programs ignore most modern CSS, so the layout uses tables and inline
// styles, web-safe fonts, and a PNG logo hosted on the website.

export type EmailContent = {
  /** Short summary that inboxes show after the subject line. */
  preheader: string;
  headerStyle: "dark" | "light";
  accent: "gold" | "ink";
  /** Small label above the heading, for example "Consultation confirmed". */
  label: string;
  heading: string;
  greeting: string;
  /** Plain text. Blank lines separate paragraphs; see `formatBody` for the rest. */
  body: string;
  detailsEnabled: boolean;
  detailsTitle: string;
  /** One "Label: value" pair per line. */
  details: string;
  buttonEnabled: boolean;
  buttonLabel: string;
  buttonUrl: string;
  closing: string;
  signName: string;
  signTitle: string;
  showContact: boolean;
  showNotice: boolean;
  /** The message being replied to or forwarded, shown below the sign-off. */
  quoteHeader: string;
  quote: string;
};

export type EmailBrand = { name: string; phone: string; email: string; website: string };

export type EmailVars = { name?: string; email?: string };

/** The firm's addresses that can receive mail (the back-office inbox, when it is switched on). */
export const MAILBOXES = ["clientservice@rtlawservices.com", "info@rtlawservices.com"] as const;

/** Addresses staff can send from in the back office. Each must be a sender in Brevo. */
export const SENDERS = ["info@rtlawservices.com"] as const;

/** Staff type the reply-to address for each email; there is no default. */
export const DEFAULT_REPLY_TO = "";

export const DEFAULT_BRAND: EmailBrand = {
  name: "RT Law Services",
  phone: "+1 (617) 642-6344",
  email: "clientservice@rtlawservices.com",
  website: "https://rtlawservices.com",
};

export const BLANK_EMAIL: EmailContent = {
  preheader: "",
  headerStyle: "dark",
  accent: "gold",
  label: "",
  heading: "",
  greeting: "Dear {{firstName}},",
  body: "",
  detailsEnabled: false,
  detailsTitle: "Details",
  details: "",
  buttonEnabled: false,
  buttonLabel: "",
  buttonUrl: "https://rtlawservices.com/",
  closing: "Kind regards,",
  signName: "",
  signTitle: "RT Law Services",
  showContact: true,
  showNotice: true,
  quoteHeader: "",
  quote: "",
};

const C = {
  ink: "#14181F",
  inkRaised: "#1D232C",
  paper: "#FBFBFA",
  mist: "#EFF1F1",
  line: "#E1E4E6",
  stone: "#51565C",
  brass: "#B1976B",
  brassInk: "#7D6638",
  brassPale: "#F1EADC",
};
const SERIF = "Georgia, 'Times New Roman', Times, serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Only web, email and phone links; anything else is shown as plain text. */
const safeUrl = (u: string) => (/^(https?:\/\/|mailto:|tel:)/i.test(u.trim()) ? u.trim() : "");

/** Fills {{firstName}}, {{name}} and {{email}} from the recipient. */
export function fillVars(text: string, vars: EmailVars) {
  const name = (vars.name || "").trim();
  // "Dr. Ada Obi" -> "Ada": skip a leading title so greetings read naturally.
  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts.length > 1 && /^(mr|mrs|ms|miss|dr|prof)\.?$/i.test(parts[0]) ? parts[1] : parts[0] || "";
  return text
    .replace(/\{\{\s*firstName\s*\}\}/g, first || "there")
    .replace(/\{\{\s*name\s*\}\}/g, name || "there")
    .replace(/\{\{\s*email\s*\}\}/g, vars.email || "");
}

/** **bold** and [label](https://link) inside already escaped text. */
function inline(s: string, accent: string) {
  return s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, url: string) => {
      const href = safeUrl(url.replace(/&amp;/g, "&"));
      return href ? `<a href="${esc(href)}" style="color:${accent};text-decoration:underline">${label}</a>` : label;
    });
}

/**
 * Turns the body text into email HTML. Blank lines separate paragraphs, lines
 * starting with "- " become a bulleted list, lines starting with "1. " a
 * numbered list, **text** is bold and [label](https://...) is a link.
 */
export function formatBody(body: string, accent: string) {
  const p = `margin:0 0 18px;font-family:${SANS};font-size:16px;line-height:1.7;color:${C.ink}`;
  const listStyle = `margin:0 0 18px;padding-left:22px;font-family:${SANS};font-size:16px;line-height:1.7;color:${C.ink}`;
  const BULLET = /^\s*[-*]\s+/;
  const NUMBER = /^\s*\d+[.)]\s+/;
  const kind = (l: string) => (BULLET.test(l) ? "ul" : NUMBER.test(l) ? "ol" : "p");
  const out: string[] = [];
  for (const block of body.trim().split(/\n\s*\n/)) {
    // Within a paragraph, consecutive list lines form a list and other lines stay text.
    const lines = block.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim());
    for (let i = 0; i < lines.length; ) {
      const k = kind(lines[i]);
      let j = i;
      while (j < lines.length && kind(lines[j]) === k) j++;
      const run = lines.slice(i, j);
      if (k === "p") out.push(`<p style="${p}">${run.map((l) => inline(esc(l), accent)).join("<br>")}</p>`);
      else
        out.push(
          `<${k} style="${listStyle}">${run
            .map((l) => `<li style="margin:0 0 8px;padding-left:4px">${inline(esc(l.replace(k === "ul" ? BULLET : NUMBER, "")), accent)}</li>`)
            .join("")}</${k}>`,
        );
      i = j;
    }
  }
  // A paragraph directly before a list reads as its introduction, so it sits closer.
  return out.join("").replace(/margin:0 0 18px(;font-family[^"]*">(?:(?!<\/p>).)*<\/p>)(?=<[uo]l )/g, "margin:0 0 8px$1");
}

const detailRows = (details: string) =>
  details
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf(":");
      return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : ["", l];
    });

export function renderEmail(content: EmailContent, vars: EmailVars = {}, brand: EmailBrand = DEFAULT_BRAND): { html: string; text: string } {
  const c = { ...BLANK_EMAIL, ...content };
  const f = (s: string) => fillVars(s || "", vars);
  const accent = c.accent === "ink" ? C.ink : C.brass;
  const accentText = c.accent === "ink" ? C.ink : C.brassInk;
  const dark = c.headerStyle === "dark";
  const logo = `${brand.website}/brand/rt-logo-email-${dark ? "dark" : "light"}.png`;
  const site = brand.website.replace(/^https?:\/\//, "");
  const phoneHref = `tel:${brand.phone.replace(/[^\d+]/g, "")}`;
  const button = c.buttonEnabled && c.buttonLabel.trim() && safeUrl(c.buttonUrl);
  const rows = c.detailsEnabled ? detailRows(f(c.details)) : [];

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(f(c.heading) || brand.name)}</title>
<style>
  @media (max-width: 620px) {
    .rt-pad { padding-left: 24px !important; padding-right: 24px !important; }
    .rt-h1 { font-size: 26px !important; }
  }
  a { color: ${accent}; }
</style>
</head>
<body style="margin:0;padding:0;background:${C.mist};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(f(c.preheader))}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.mist}">
<tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#FFFFFF;border-radius:14px;overflow:hidden;border:1px solid ${C.line}">
  <tr><td style="background:${dark ? C.ink : "#FFFFFF"};padding:30px 40px;${dark ? "" : `border-bottom:1px solid ${C.line};`}" class="rt-pad">
    <a href="${esc(brand.website)}" style="text-decoration:none"><img src="${esc(logo)}" width="210" height="44" alt="${esc(brand.name)}" style="display:block;width:210px;height:auto;border:0"></a>
  </td></tr>
  <tr><td style="height:4px;line-height:4px;font-size:0;background:${accent}">&nbsp;</td></tr>
  <tr><td class="rt-pad" style="padding:44px 48px 12px">
    ${c.label.trim() ? `<p style="margin:0 0 12px;font-family:${SANS};font-size:13px;font-weight:bold;letter-spacing:0.4px;color:${accentText}">${esc(f(c.label))}</p>` : ""}
    ${c.heading.trim() ? `<h1 class="rt-h1" style="margin:0 0 28px;font-family:${SERIF};font-size:32px;line-height:1.2;font-weight:normal;color:${C.ink}">${esc(f(c.heading))}</h1>` : ""}
    ${c.greeting.trim() ? `<p style="margin:0 0 18px;font-family:${SANS};font-size:16px;line-height:1.7;color:${C.ink}">${esc(f(c.greeting))}</p>` : ""}
    ${formatBody(f(c.body), accent)}
  </td></tr>
  ${
    rows.length
      ? `<tr><td class="rt-pad" style="padding:6px 48px 18px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.brassPale};border-radius:10px;border-left:4px solid ${accent}">
      <tr><td style="padding:22px 24px">
        ${c.detailsTitle.trim() ? `<p style="margin:0 0 12px;font-family:${SERIF};font-size:19px;color:${C.ink}">${esc(f(c.detailsTitle))}</p>` : ""}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${rows
            .map(
              ([k, v]) =>
                `<tr>${k ? `<td valign="top" style="padding:5px 16px 5px 0;font-family:${SANS};font-size:14px;font-weight:bold;color:${C.stone};white-space:nowrap">${esc(k)}</td>` : ""}<td valign="top" ${k ? "" : 'colspan="2"'} style="padding:5px 0;font-family:${SANS};font-size:15px;color:${C.ink}">${inline(esc(v), accent)}</td></tr>`,
            )
            .join("")}
        </table>
      </td></tr>
    </table>
  </td></tr>`
      : ""
  }
  ${
    button
      ? `<tr><td class="rt-pad" style="padding:14px 48px 26px">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="border-radius:999px;background:${accent}">
        <a href="${esc(button)}" style="display:inline-block;padding:15px 34px;font-family:${SANS};font-size:15px;font-weight:bold;color:${c.accent === "ink" ? "#FFFFFF" : C.ink};text-decoration:none;border-radius:999px">${esc(f(c.buttonLabel))}</a>
      </td>
    </tr></table>
  </td></tr>`
      : ""
  }
  <tr><td class="rt-pad" style="padding:8px 48px 44px">
    ${c.closing.trim() ? `<p style="margin:0 0 6px;font-family:${SANS};font-size:16px;line-height:1.7;color:${C.ink}">${esc(f(c.closing))}</p>` : ""}
    ${c.signName.trim() ? `<p style="margin:0;font-family:${SERIF};font-size:20px;color:${C.ink}">${esc(f(c.signName))}</p>` : ""}
    ${c.signTitle.trim() ? `<p style="margin:2px 0 0;font-family:${SANS};font-size:14px;color:${C.stone}">${esc(f(c.signTitle))}</p>` : ""}
  </td></tr>
  ${
    c.quote.trim()
      ? `<tr><td class="rt-pad" style="padding:0 48px 40px">
    <div style="border-top:1px solid ${C.line};padding-top:22px">
      ${c.quoteHeader.trim() ? `<p style="margin:0 0 10px;font-family:${SANS};font-size:13px;color:${C.stone}">${esc(c.quoteHeader).replace(/\n/g, "<br>")}</p>` : ""}
      <div style="border-left:3px solid ${C.line};padding:2px 0 2px 16px;font-family:${SANS};font-size:14px;line-height:1.6;color:${C.stone}">${esc(c.quote.trim()).replace(/\n/g, "<br>")}</div>
    </div>
  </td></tr>`
      : ""
  }
  ${
    c.showContact
      ? `<tr><td class="rt-pad" style="background:${C.ink};padding:26px 48px">
    <p style="margin:0 0 6px;font-family:${SERIF};font-size:17px;color:#FFFFFF">${esc(brand.name)}</p>
    <p style="margin:0;font-family:${SANS};font-size:14px;line-height:1.8;color:#C9CDD2">
      <a href="${esc(phoneHref)}" style="color:#C9CDD2;text-decoration:none">${esc(brand.phone)}</a>
      &nbsp;<span style="color:${C.brass}">&middot;</span>&nbsp;
      <a href="mailto:${esc(brand.email)}" style="color:#C9CDD2;text-decoration:none">${esc(brand.email)}</a>
      &nbsp;<span style="color:${C.brass}">&middot;</span>&nbsp;
      <a href="${esc(brand.website)}" style="color:${C.brass};text-decoration:none">${esc(site)}</a>
    </p>
  </td></tr>`
      : ""
  }
</table>
${
  c.showNotice
    ? `<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px">
  <tr><td style="padding:20px 24px 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${C.stone};text-align:center">
    This email may contain confidential or legally privileged information. If you received it by mistake, please tell us by replying and delete it.
    Receiving this email does not by itself create an attorney-client relationship.
  </td></tr>
</table>`
    : ""
}
</td></tr>
</table>
</body>
</html>`;

  const text = [
    f(c.label),
    f(c.heading),
    "",
    f(c.greeting),
    "",
    f(c.body).replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1 ($2)"),
    rows.length ? `\n${f(c.detailsTitle)}\n${rows.map(([k, v]) => (k ? `${k}: ${v}` : v)).join("\n")}` : "",
    button ? `\n${f(c.buttonLabel)}: ${button}` : "",
    "",
    f(c.closing),
    f(c.signName),
    f(c.signTitle),
    c.quote.trim() ? `\n${c.quoteHeader}\n${c.quote.trim().split("\n").map((l) => `> ${l}`).join("\n")}` : "",
    c.showContact ? `\n${brand.name}\n${brand.phone} | ${brand.email} | ${site}` : "",
    c.showNotice
      ? "\nThis email may contain confidential or legally privileged information. If you received it by mistake, please tell us by replying and delete it. Receiving this email does not by itself create an attorney-client relationship."
      : "",
  ]
    .filter((l, i, a) => !(l === "" && a[i - 1] === ""))
    .join("\n")
    .trim();

  return { html, text };
}
