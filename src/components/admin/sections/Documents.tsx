"use client";

import { useState } from "react";
import { Download, FileText, Send } from "lucide-react";
import { FIRM_DOCUMENTS, firmDocumentFile } from "@/lib/firm-documents";
import { EmailComposer, type ComposeTarget } from "../EmailComposer";
import { Btn, SectionHeader, useToast } from "../kit";

/** The firm's letterhead in Word and PDF, to download or send by email. */
export function Documents() {
  const toast = useToast();
  const [compose, setCompose] = useState<ComposeTarget>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const send = async (name: string) => {
    const doc = FIRM_DOCUMENTS.find((d) => d.name === name);
    if (!doc) return;
    setBusy(name);
    try {
      setCompose({ files: [await firmDocumentFile(doc)] });
    } catch {
      toast("error", "The document could not be loaded. Try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid max-w-4xl gap-6">
      <SectionHeader
        title="Documents"
        lede="The firm's branded letterhead. Download the Word version to write a letter, or attach any document to an email."
      />
      <ul className="grid gap-3 sm:grid-cols-2">
        {FIRM_DOCUMENTS.map((d) => (
          <li key={d.name} className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brass-pale text-brass-ink">
                <FileText aria-hidden className="size-6" />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-ink">
                  {d.label} <span className="ml-1 rounded-full bg-mist px-2 py-0.5 text-xs font-bold text-stone">{d.kind}</span>
                </p>
                <p className="mt-1 text-sm text-stone">{d.detail}</p>
              </div>
            </div>
            <div className="mt-auto flex flex-wrap gap-2">
              <a
                href={d.href}
                download={d.name}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-paper hover:bg-ink-raised"
              >
                <Download aria-hidden className="size-4" /> Download
              </a>
              <Btn variant="ghost" busy={busy === d.name} onClick={() => send(d.name)}>
                <Send aria-hidden className="size-4" /> Email it
              </Btn>
            </div>
          </li>
        ))}
      </ul>
      {compose && <EmailComposer target={compose} onClose={() => setCompose(null)} />}
    </div>
  );
}
