"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Check, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { NO_RELATIONSHIP } from "@/content/site";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

const TOPICS = ["A new matter", "An existing case", "Fees and billing", "Something else"];

export function ContactForm() {
  const [f, setF] = useState({ name: "", email: "", phone: "", topic: TOPICS[0], message: "", consent: false, website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) er.email = "Enter a valid email address.";
    if (f.message.trim().length < 10) er.message = "Tell us a little more (at least 10 characters).";
    if (!f.consent) er.consent = "Please confirm you have read this notice.";
    setErrors(er);
    if (Object.keys(er).length) return;
    if (f.website) {
      setState("sent");
      return;
    }
    setState("sending");
    try {
      await addDoc(collection(db(), "messages"), {
        name: f.name.trim(),
        email: f.email.trim().toLowerCase(),
        phone: f.phone.trim(),
        topic: f.topic,
        message: f.message.trim(),
        status: "new",
        createdAt: serverTimestamp(),
      });
      setState("sent");
    } catch {
      setState("error");
    }
  };

  if (state === "sent") {
    return (
      <div className="rounded-3xl border border-line bg-white p-10 text-center" role="status">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-brass text-ink">
          <Check aria-hidden className="size-6" />
        </span>
        <h2 className="font-serif-display mt-6 text-3xl text-ink">Message received</h2>
        <p className="mt-3 text-stone">We aim to reply within one business day.</p>
      </div>
    );
  }

  const input = (err?: string) =>
    cn(
      "mt-2 min-h-12 w-full rounded-xl border bg-white px-4 text-base text-ink outline-none transition-colors focus:border-ink",
      err ? "border-danger" : "border-line",
    );

  return (
    <form noValidate onSubmit={submit} className="grid gap-5 rounded-3xl border border-line bg-white p-7 sm:p-10">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="text-sm font-bold text-ink">
            Name <span aria-hidden className="text-danger">*</span>
          </label>
          <input id="c-name" autoComplete="name" className={input(errors.name)} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} aria-invalid={!!errors.name} aria-describedby={errors.name ? "c-name-err" : undefined} maxLength={120} />
          {errors.name && <p id="c-name-err" role="alert" className="mt-1.5 text-sm font-bold text-danger">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="c-email" className="text-sm font-bold text-ink">
            Email <span aria-hidden className="text-danger">*</span>
          </label>
          <input id="c-email" type="email" autoComplete="email" className={input(errors.email)} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} aria-invalid={!!errors.email} aria-describedby={errors.email ? "c-email-err" : undefined} maxLength={160} />
          {errors.email && <p id="c-email-err" role="alert" className="mt-1.5 text-sm font-bold text-danger">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="c-phone" className="text-sm font-bold text-ink">Phone (optional)</label>
          <input id="c-phone" type="tel" autoComplete="tel" className={input()} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} maxLength={40} />
        </div>
        <div>
          <label htmlFor="c-topic" className="text-sm font-bold text-ink">Topic</label>
          <select id="c-topic" className={input()} value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })}>
            {TOPICS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="c-msg" className="text-sm font-bold text-ink">
          Message <span aria-hidden className="text-danger">*</span>
        </label>
        <textarea id="c-msg" rows={6} maxLength={2000} className={cn(input(errors.message), "py-3")} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} aria-invalid={!!errors.message} aria-describedby={errors.message ? "c-msg-err" : "c-msg-hint"} />
        <p id="c-msg-hint" className="mt-1.5 text-xs text-stone">Please do not include passport numbers, file numbers or other sensitive details.</p>
        {errors.message && <p id="c-msg-err" role="alert" className="mt-1.5 text-sm font-bold text-danger">{errors.message}</p>}
      </div>
      <div className="hidden" aria-hidden>
        <label htmlFor="c-web">Website</label>
        <input id="c-web" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} />
      </div>
      <div className="rounded-2xl bg-mist p-5">
        <div className="flex gap-3">
          <input id="c-consent" type="checkbox" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} className="mt-1 size-5 shrink-0 accent-ink" aria-invalid={!!errors.consent} />
          <label htmlFor="c-consent" className="text-sm leading-relaxed text-ink-soft">I understand: {NO_RELATIONSHIP}</label>
        </div>
        {errors.consent && <p role="alert" className="ml-8 mt-1 text-sm font-bold text-danger">{errors.consent}</p>}
      </div>
      {state === "error" && <p role="alert" className="text-sm font-bold text-danger">The message could not be sent. Please try again or call us.</p>}
      <div>
        <Button type="submit" disabled={state === "sending"}>
          {state === "sending" ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Send aria-hidden className="size-4" />}
          {state === "sending" ? "Sending" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
