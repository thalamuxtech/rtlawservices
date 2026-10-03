"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, ImageUp, Undo2 } from "lucide-react";
import { Btn, Panel } from "./kit";

type Rect = { x: number; y: number; w: number; h: number };

const MAX_W = 1400;
const MAX_CHARS = 700_000;

/**
 * Redacts an approval document before upload. Each selected area is painted
 * over with one flat colour, so no detail survives to be recovered, and the
 * unredacted original never leaves the browser. Returns a WebP data URL small
 * enough for one Firestore document.
 */
export function RedactionTool({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [rects, setRects] = useState<Rect[]>([]);
  const [drag, setDrag] = useState<Rect | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const start = useRef<{ x: number; y: number } | null>(null);

  const draw = useCallback(
    (preview = true) => {
      const c = canvasRef.current;
      if (!c || !img) return;
      const scale = Math.min(1, MAX_W / img.naturalWidth);
      c.width = Math.round(img.naturalWidth * scale);
      c.height = Math.round(img.naturalHeight * scale);
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, c.width, c.height);
      for (const r of [...rects, ...(drag ? [drag] : [])]) redact(ctx, c, r);
      if (preview) {
        ctx.strokeStyle = "#b1976b";
        ctx.lineWidth = 3;
        for (const r of [...rects, ...(drag ? [drag] : [])]) ctx.strokeRect(r.x, r.y, r.w, r.h);
      }
    },
    [img, rects, drag],
  );

  useEffect(() => draw(), [draw]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const b = c.getBoundingClientRect();
    return { x: ((e.clientX - b.left) / b.width) * c.width, y: ((e.clientY - b.top) / b.height) * c.height };
  };

  const load = (f: File | null) => {
    setError("");
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) return setError("Upload a PNG, JPEG or WebP image. Export a PDF page as an image first.");
    // A data URL is allowed by the site's content security policy; a blob URL is not.
    const reader = new FileReader();
    reader.onerror = () => setError("The file could not be read. Try another image.");
    reader.onload = () => {
      const im = new Image();
      im.onerror = () => setError("This image could not be opened. Try a PNG or JPEG export.");
      im.onload = () => {
        setImg(im);
        setRects([]);
      };
      im.src = String(reader.result);
    };
    reader.readAsDataURL(f);
  };

  const finish = async () => {
    if (!img || !canvasRef.current) return;
    setBusy(true);
    draw(false);
    let out = "";
    for (const q of [0.85, 0.75, 0.65, 0.55, 0.45]) {
      out = canvasRef.current.toDataURL("image/webp", q);
      if (out.length <= MAX_CHARS) break;
    }
    if (out.length > MAX_CHARS) {
      const c2 = document.createElement("canvas");
      c2.width = Math.round(canvasRef.current.width * 0.7);
      c2.height = Math.round(canvasRef.current.height * 0.7);
      c2.getContext("2d")!.drawImage(canvasRef.current, 0, 0, c2.width, c2.height);
      out = c2.toDataURL("image/webp", 0.6);
    }
    setBusy(false);
    if (out.length > MAX_CHARS) return setError("The image is still too large after compression. Crop it and try again.");
    onDone(out);
    setImg(null);
    setRects([]);
  };

  return (
    <Panel
      open={open}
      title="Redact approval document"
      onClose={onClose}
      wide
      footer={
        <>
          <Btn variant="ghost" onClick={() => setRects((r) => r.slice(0, -1))} disabled={!rects.length}>
            <Undo2 aria-hidden className="size-4" /> Undo
          </Btn>
          <Btn variant="ghost" onClick={() => setRects([])} disabled={!rects.length}>
            <Eraser aria-hidden className="size-4" /> Clear
          </Btn>
          <Btn variant="gold" busy={busy} disabled={!img} onClick={finish}>
            Apply redactions and use
          </Btn>
        </>
      }
    >
      <ol className="mb-5 grid gap-1 text-sm text-stone">
        <li>1. Upload the approval notice as an image.</li>
        <li>2. Drag a box over every name, receipt number, address, date of birth and A-number.</li>
        <li>3. Apply. Each area is painted over in the image itself, so the original details are never stored.</li>
      </ol>
      {!img ? (
        <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-line bg-white p-12 text-center hover:border-ink/40">
          <ImageUp aria-hidden className="size-8 text-brass-ink" />
          <span className="font-bold text-ink">Choose an image of the approval notice</span>
          <span className="text-sm text-stone">PNG, JPEG or WebP</span>
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => load(e.target.files?.[0] ?? null)} />
        </label>
      ) : (
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair touch-none rounded-xl ring-1 ring-line"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            start.current = pos(e);
          }}
          onPointerMove={(e) => {
            if (!start.current) return;
            const p = pos(e);
            const s = start.current;
            setDrag({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) });
          }}
          onPointerUp={() => {
            if (drag && drag.w > 6 && drag.h > 6) setRects((r) => [...r, drag]);
            setDrag(null);
            start.current = null;
          }}
        />
      )}
      {img && <p className="mt-3 text-sm text-stone">{rects.length} area{rects.length === 1 ? "" : "s"} redacted.</p>}
      {error && <p role="alert" className="mt-3 text-sm font-bold text-danger">{error}</p>}
    </Panel>
  );
}

/**
 * Covers a region with a single flat colour: the region's average tone, softened
 * toward grey. It reads like a blur on the page, but unlike pixelation or blur it
 * keeps no information that tools could use to reconstruct the text.
 */
function redact(ctx: CanvasRenderingContext2D, c: HTMLCanvasElement, r: Rect) {
  const x = Math.max(0, Math.floor(r.x));
  const y = Math.max(0, Math.floor(r.y));
  const w = Math.min(c.width - x, Math.ceil(r.w));
  const h = Math.min(c.height - y, Math.ceil(r.h));
  if (w < 2 || h < 2) return;
  const one = document.createElement("canvas");
  one.width = one.height = 1;
  const o = one.getContext("2d")!;
  o.drawImage(c, x, y, w, h, 0, 0, 1, 1);
  const [red, green, blue] = o.getImageData(0, 0, 1, 1).data;
  const mix = (v: number) => Math.round(v * 0.55 + 150 * 0.45);
  ctx.save();
  ctx.fillStyle = `rgb(${mix(red)}, ${mix(green)}, ${mix(blue)})`;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(8, h / 3));
  ctx.fill();
  ctx.restore();
}
