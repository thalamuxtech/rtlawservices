"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Download, Eye, FileText, Maximize2, Minus, Plus, X } from "lucide-react";
import { FIRM_DOCUMENTS, type FirmDocument } from "@/lib/firm-documents";
import { SectionHeader } from "../kit";

/** The firm's letterhead and QR code, to view in the browser or download. */
export function Documents() {
  const [viewing, setViewing] = useState<FirmDocument | null>(null);

  return (
    <div className="grid max-w-4xl gap-6">
      <SectionHeader title="Documents" lede="The firm's branded letterhead and QR code. View them here or download them." />
      <ul className="grid gap-3 sm:grid-cols-2">
        {FIRM_DOCUMENTS.map((d) => (
          <li key={d.name} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
            <button
              type="button"
              onClick={() => setViewing(d)}
              aria-label={`View ${d.label} (${d.kind})`}
              className="group relative grid h-44 place-items-center overflow-hidden border-b border-line bg-mist/60"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.preview} alt="" loading="lazy" className="h-36 w-auto rounded-md bg-white object-contain shadow-md transition-transform duration-300 group-hover:scale-[1.04]" />
              <span className="absolute inset-0 grid place-items-center bg-ink/0 opacity-0 transition-all group-hover:bg-ink/30 group-hover:opacity-100">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-ink shadow">
                  <Eye aria-hidden className="size-4" /> View
                </span>
              </span>
            </button>
            <div className="flex flex-1 flex-col gap-4 p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brass-pale text-brass-ink">
                  <FileText aria-hidden className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-ink">
                    {d.label} <span className="ml-1 rounded-full bg-mist px-2 py-0.5 text-xs font-bold text-stone">{d.kind}</span>
                  </p>
                  <p className="mt-1 text-sm text-stone">{d.detail}</p>
                </div>
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setViewing(d)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-bold text-ink hover:border-ink/40"
                >
                  <Eye aria-hidden className="size-4" /> View
                </button>
                <a href={d.href} download={d.name} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-paper hover:bg-ink-raised">
                  <Download aria-hidden className="size-4" /> Download
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <AnimatePresence>{viewing && <Viewer doc={viewing} onClose={() => setViewing(null)} />}</AnimatePresence>
    </div>
  );
}

const MIN = 0.5;
const MAX = 5;
const clamp = (z: number) => Math.min(MAX, Math.max(MIN, z));

/** Full-screen view of a document: zoom with the buttons, Ctrl + scroll, pinch or double-click, and drag to move around. */
function Viewer({ doc, onClose }: { doc: FirmDocument; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  // The picture's width when it fits the screen; zoom multiplies it.
  const [fit, setFit] = useState(0);
  const natural = useRef({ w: 1, h: 1 });
  const measure = useCallback(() => {
    const el = box.current;
    if (!el) return;
    const pad = window.innerWidth < 640 ? 32 : 64;
    const { w, h } = natural.current;
    setFit(Math.max(80, Math.min(el.clientWidth - pad, ((el.clientHeight - pad) * w) / h)));
  }, []);
  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);

  // Zoom around a point in the view, keeping that point still.
  const zoomTo = useCallback((next: number, at?: { x: number; y: number }) => {
    const el = box.current;
    setZoom((cur) => {
      const z = clamp(next);
      if (el) {
        const px = at?.x ?? el.clientWidth / 2;
        const py = at?.y ?? el.clientHeight / 2;
        const ratio = z / cur;
        requestAnimationFrame(() => {
          el.scrollLeft = (el.scrollLeft + px) * ratio - px;
          el.scrollTop = (el.scrollTop + py) * ratio - py;
        });
      }
      return z;
    });
  }, []);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      } else if (e.key === "+" || e.key === "=") zoomTo(zoom * 1.25);
      else if (e.key === "-") zoomTo(zoom / 1.25);
      else if (e.key === "0") setZoom(1);
    };
    window.addEventListener("keydown", k, true);
    return () => window.removeEventListener("keydown", k, true);
  }, [onClose, zoom, zoomTo]);

  // Ctrl + scroll (and trackpad pinch, which arrives the same way) zooms; plain scrolling moves.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const w = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomTo(zoom * Math.exp(-e.deltaY * 0.01), { x: e.clientX - r.left, y: e.clientY - r.top });
    };
    el.addEventListener("wheel", w, { passive: false });
    return () => el.removeEventListener("wheel", w);
  }, [zoom, zoomTo]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${doc.label} (${doc.kind})`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[85] flex flex-col bg-ink/95 backdrop-blur-sm"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3 text-paper sm:px-6">
        <p className="min-w-0 flex-1 truncate font-bold">
          {doc.label} <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-xs">{doc.kind}</span>
        </p>
        <div className="flex items-center rounded-full bg-white/10 p-1">
          <button type="button" onClick={() => zoomTo(zoom / 1.25)} disabled={zoom <= MIN} aria-label="Zoom out" className="grid size-9 place-items-center rounded-full hover:bg-white/10 disabled:opacity-40">
            <Minus aria-hidden className="size-4" />
          </button>
          <span className="min-w-14 text-center text-sm font-bold tabular-nums" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
          <button type="button" onClick={() => zoomTo(zoom * 1.25)} disabled={zoom >= MAX} aria-label="Zoom in" className="grid size-9 place-items-center rounded-full hover:bg-white/10 disabled:opacity-40">
            <Plus aria-hidden className="size-4" />
          </button>
          <button type="button" onClick={() => setZoom(1)} aria-label="Fit to screen" title="Fit to screen" className="grid size-9 place-items-center rounded-full hover:bg-white/10">
            <Maximize2 aria-hidden className="size-4" />
          </button>
        </div>
        <a href={doc.href} download={doc.name} className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-brass px-4 text-sm font-bold text-ink hover:bg-brass-light">
          <Download aria-hidden className="size-4" /> Download
        </a>
        <button type="button" onClick={onClose} aria-label="Close" className="grid size-10 place-items-center rounded-full hover:bg-white/10">
          <X aria-hidden className="size-5" />
        </button>
      </div>
      {doc.kind === "Word" && (
        <p className="bg-white/5 px-4 py-2 text-center text-xs text-stone-dark">Browsers cannot open Word files, so this shows how the letterhead looks. Download it to edit in Word.</p>
      )}
      <div
        ref={box}
        className={zoom > 1 ? "min-h-0 flex-1 cursor-grab overflow-auto active:cursor-grabbing" : "min-h-0 flex-1 overflow-auto"}
        onDoubleClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          zoomTo(zoom > 1 ? 1 : 2.5, { x: e.clientX - r.left, y: e.clientY - r.top });
        }}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || zoom <= 1) return;
          const el = e.currentTarget;
          drag.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop };
          el.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          e.currentTarget.scrollLeft = d.left - (e.clientX - d.x);
          e.currentTarget.scrollTop = d.top - (e.clientY - d.y);
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <div className="grid min-h-full min-w-full place-items-center p-4 sm:p-8" style={{ width: "max-content" }}>
          <motion.img
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={doc.preview}
            alt={`${doc.label} preview`}
            draggable={false}
            onLoad={(e) => {
              natural.current = { w: e.currentTarget.naturalWidth || 1, h: e.currentTarget.naturalHeight || 1 };
              measure();
            }}
            className="max-w-none select-none rounded-sm bg-white shadow-2xl"
            style={{ width: fit ? fit * zoom : undefined, height: "auto", visibility: fit ? "visible" : "hidden" }}
          />
        </div>
      </div>
      <p className="hidden px-4 py-2 text-center text-xs text-stone-dark sm:block">Double-click or Ctrl + scroll to zoom. Drag to move around. Esc closes.</p>
    </motion.div>
  );
}
