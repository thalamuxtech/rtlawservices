"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Maximize2, X } from "lucide-react";
import type { CaseResult } from "@/content/types";
import { cn } from "@/lib/utils";

/**
 * Shows the redacted approval document for a case. Uploaded images are
 * redacted in the back office before upload, so no unredacted original is
 * stored. Without an upload, a stylised sample notice is drawn. It is not a
 * copy of any government form and carries a "Sample" watermark.
 */
export function ApprovalDocument({ c, compact }: { c: CaseResult; compact?: boolean }) {
  const [zoom, setZoom] = useState(false);
  const label = `Approval document for ${c.title}${c.documentUrl ? ", personal details redacted" : ", sample illustration"}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setZoom(true)}
        aria-label={`Enlarge ${label}`}
        className={cn(
          "group relative block w-full overflow-hidden rounded-xl bg-white text-left shadow-[0_30px_60px_-30px_rgba(20,24,31,0.55)] ring-1 ring-ink/10 transition-transform duration-500 hover:-rotate-1",
          compact ? "aspect-[4/5]" : "aspect-[8.5/11]",
        )}
      >
        {c.documentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.documentUrl} alt={label} className="size-full object-cover object-top" loading="lazy" />
        ) : (
          <SampleNotice c={c} compact={compact} />
        )}
        <span className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-ink/80 text-paper opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Maximize2 aria-hidden className="size-4" />
        </span>
      </button>

      <AnimatePresence>
        {zoom && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="fixed inset-0 z-[70] grid place-items-center bg-ink/85 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoom(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className="relative max-h-[90dvh] w-full max-w-2xl overflow-auto rounded-xl bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="aspect-[8.5/11]">
                {c.documentUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.documentUrl} alt={label} className="size-full object-contain" />
                ) : (
                  <SampleNotice c={c} />
                )}
              </div>
              <button
                type="button"
                autoFocus
                onClick={() => setZoom(false)}
                aria-label="Close"
                className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-ink text-paper"
              >
                <X aria-hidden className="size-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Non-interactive preview, for use inside cards that are already links. */
export function DocumentPreview({ c }: { c: CaseResult }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-white ring-1 ring-ink/10">
      <div className="absolute inset-x-0 top-0 origin-top transition-transform duration-700 group-hover:scale-[1.04]">
        {c.documentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.documentUrl} alt="" className="w-full" loading="lazy" />
        ) : (
          <div className="aspect-[8.5/11]">
            <SampleNotice c={c} compact />
          </div>
        )}
      </div>
    </div>
  );
}

const Blur = ({ w, className }: { w: string; className?: string }) => (
  <span aria-hidden className={cn("inline-block h-[0.9em] rounded-sm bg-ink/70 align-middle blur-[3px]", className)} style={{ width: w }} />
);

function SampleNotice({ c, compact }: { c: CaseResult; compact?: boolean }) {
  const approvalDetail = c.details?.find((d) => /approval|decision|oath|issued/i.test(d.label));
  return (
    <div className={cn("relative size-full bg-[#fdfcf9] text-ink", compact ? "p-5 text-[0.55rem]" : "p-8 text-[0.72rem] sm:text-[0.8rem]")} aria-hidden>
      <div className="flex items-start justify-between border-b-2 border-ink pb-3">
        <div>
          <p className="font-bold uppercase tracking-wider">Notice of decision</p>
          <p className="mt-1 opacity-70">Immigration benefit request</p>
        </div>
        <div className="text-right">
          <p className="font-bold">Form {c.form ?? "I-797"}</p>
          <p className="opacity-70">Receipt <Blur w="5.5em" /></p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2">
        <p><span className="opacity-60">Case type</span><br /><strong>{c.category}</strong></p>
        <p><span className="opacity-60">Notice date</span><br /><strong>{c.year}</strong></p>
        <p><span className="opacity-60">Petitioner</span><br /><Blur w="7em" /></p>
        <p><span className="opacity-60">Beneficiary</span><br /><Blur w="6.5em" /></p>
        <p className="col-span-2"><span className="opacity-60">Address</span><br /><Blur w="11em" /><br /><Blur w="8em" className="mt-1" /></p>
      </div>
      <div className="relative mt-6">
        <p className="inline-block -rotate-6 rounded-md border-[3px] border-success px-4 py-1.5 font-serif-display text-[2.4em] font-bold uppercase tracking-widest text-success">Approved</p>
      </div>
      <div className="mt-5 space-y-2 opacity-60">
        <p>The above petition or application has been approved.{approvalDetail ? ` ${approvalDetail.label}: ${approvalDetail.value}.` : ""}</p>
        {[92, 84, 88, 70, 80, 60].map((w, i) => (
          <span key={i} className="block h-[0.7em] rounded-sm bg-ink/15" style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="absolute inset-0 grid place-items-center overflow-hidden">
        <p className="-rotate-[28deg] select-none font-serif-display text-[5em] font-bold uppercase tracking-[0.2em] text-brass/25">Sample</p>
      </div>
    </div>
  );
}
