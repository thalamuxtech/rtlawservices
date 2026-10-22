// Mail sent to the firm's addresses (Email Routing rules point them at this
// Worker). Each message is kept whole in R2 and listed in the database; the
// back office reads and parses it in the browser, which keeps the work done
// here small enough for the free plan's limit of 10 ms of processing.

import { SENDERS } from "../src/lib/email-template";
import { newId, putDoc, ts } from "./lib";

const MAX_BYTES = 20 * 1024 * 1024;

/** Decodes =?charset?B?...?= and =?charset?Q?...?= words in a header. */
export function decodeHeader(v: string | null) {
  if (!v) return "";
  return v
    .replace(/\?=\s+=\?/g, "?==?")
    .replace(/=\?([^?]+)\?([bBqQ])\?([^?]*)\?=/g, (_m, charset: string, enc: string, text: string) => {
      try {
        const bytes =
          enc.toUpperCase() === "B"
            ? Uint8Array.from(atob(text), (c) => c.charCodeAt(0))
            : Uint8Array.from(text.replace(/_/g, " ").replace(/=([0-9A-Fa-f]{2})/g, (_x, h: string) => String.fromCharCode(parseInt(h, 16))), (c) => c.charCodeAt(0));
        return new TextDecoder(charset).decode(bytes);
      } catch {
        return text;
      }
    });
}

/** "Ada Obi <ada@example.com>" -> { name, address }. */
function parseAddress(v: string) {
  const m = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/.exec(v);
  return m ? { name: m[1].trim(), address: m[2].trim().toLowerCase() } : { name: "", address: v.trim().toLowerCase() };
}

export async function receiveEmail(message: ForwardableEmailMessage, env: Env) {
  const to = message.to.toLowerCase();
  if (!SENDERS.some((s) => s === to)) return message.setReject("Unknown address.");
  if (message.rawSize > MAX_BYTES) return message.setReject("Message is larger than 20 MB.");

  const id = newId();
  const raw = await new Response(message.raw).arrayBuffer();
  await env.FILES.put(`inbox/${id}.eml`, raw, { httpMetadata: { contentType: "message/rfc822" } });

  const from = parseAddress(decodeHeader(message.headers.get("from")) || message.from);
  const replyTo = message.headers.get("reply-to");
  await putDoc(env.DB, "inbox", id, {
    mailbox: to,
    fromName: from.name,
    email: (replyTo ? parseAddress(decodeHeader(replyTo)).address : from.address) || message.from.toLowerCase(),
    fromAddress: from.address || message.from.toLowerCase(),
    name: from.name || from.address,
    subject: decodeHeader(message.headers.get("subject")).slice(0, 300) || "(no subject)",
    sentAt: message.headers.get("date") || "",
    messageId: message.headers.get("message-id") || "",
    size: message.rawSize,
    status: "new",
    createdAt: ts(),
  });
}
