"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, type DocumentData, type Timestamp,
} from "firebase/firestore";
import { ArrowDown, ArrowUp, CheckCircle2, Loader2, Plus, Trash2, X, XCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { requestPublish } from "@/lib/publish";
import { cn } from "@/lib/utils";

/* ---------- data ---------- */

export type Row = DocumentData & { id: string };

const sortKey = (v: unknown) => (v && typeof v === "object" && "toMillis" in v ? (v as Timestamp).toMillis() : (v as string | number | undefined) ?? "");

/**
 * Live rows of a collection, newest first. Sorting happens here rather than in
 * the query, because Firestore leaves out documents that lack the ordered field.
 */
export function useCollection(name: string, order = "createdAt") {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  useEffect(
    () =>
      onSnapshot(
        collection(db(), name),
        (s) => {
          setError("");
          const list = s.docs.map((d) => ({ id: d.id, ...d.data() }) as Row);
          const asc = order === "order";
          list.sort((a, b) => {
            const x = sortKey(a[order]);
            const y = sortKey(b[order]);
            return (x < y ? -1 : x > y ? 1 : 0) * (asc ? 1 : -1);
          });
          setRows(list);
        },
        (e) => {
          setError(e.message);
          setRows((r) => r ?? []);
        },
      ),
    [name, order],
  );
  return { rows, error };
}

/** Records the time of the last content change and starts a site rebuild. */
export async function touchContent(uid: string) {
  await setDoc(doc(db(), "meta", "content"), { updatedAt: serverTimestamp(), updatedBy: uid }, { merge: true });
  // Not awaited: the save has succeeded, and the Publishing screen reports any
  // problem starting the build. The scheduled run remains the fallback.
  void requestPublish(uid);
}

/** Firestore rejects undefined values, so drop them before writing. */
const clean = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(clean)
    : v && typeof v === "object" && !("toDate" in (v as object))
      ? Object.fromEntries(Object.entries(v as object).filter(([, x]) => x !== undefined).map(([k, x]) => [k, clean(x)]))
      : v;

export async function saveContent(col: string, id: string, data: DocumentData, uid: string, affectsSite = true) {
  await setDoc(doc(db(), col, id), { ...(clean(data) as DocumentData), updatedAt: serverTimestamp(), updatedBy: uid }, { merge: false });
  if (affectsSite) await touchContent(uid);
}

export async function removeContent(col: string, id: string, uid: string) {
  await deleteDoc(doc(db(), col, id));
  await touchContent(uid);
}

export const fmtTs = (t?: Timestamp | null, tz = "America/New_York"): string => {
  if (!t?.toDate) return "";
  try {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: tz }).format(t.toDate());
  } catch {
    // An unknown time zone from a form submission must not break the portal.
    return tz === "America/New_York" ? t.toDate().toISOString() : fmtTs(t);
  }
};

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

/* ---------- toasts ---------- */

type Toast = { id: number; kind: "ok" | "error"; text: string };
const ToastCtx = createContext<(kind: Toast["kind"], text: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[80] grid gap-2" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              className={cn(
                "pointer-events-auto flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-bold shadow-2xl",
                t.kind === "ok" ? "bg-ink text-paper" : "bg-danger text-white",
              )}
            >
              {t.kind === "ok" ? <CheckCircle2 aria-hidden className="size-5 text-brass-light" /> : <XCircle aria-hidden className="size-5" />}
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- layout pieces ---------- */

export function SectionHeader({ title, lede, action }: { title: string; lede?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif-display text-4xl text-ink">{title}</h1>
        {lede && <p className="mt-2 max-w-2xl text-stone">{lede}</p>}
      </div>
      {action}
    </div>
  );
}

// Open panels, innermost last, so Escape closes only the panel on top.
const panelStack: symbol[] = [];

export function Panel({ open, title, onClose, children, footer, wide }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const me = Symbol(title);
    panelStack.push(me);
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape" && panelStack[panelStack.length - 1] === me) {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", k);
    return () => {
      window.removeEventListener("keydown", k);
      panelStack.splice(panelStack.indexOf(me), 1);
    };
  }, [open, onClose, title]);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <motion.button
            type="button"
            aria-label="Close panel"
            className="absolute inset-0 cursor-default bg-ink/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 34 }}
            className={cn("absolute inset-y-0 right-0 flex w-full flex-col bg-paper shadow-2xl", wide ? "max-w-3xl" : "max-w-xl")}
          >
            <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
              <h2 className="font-serif-display text-2xl text-ink">{title}</h2>
              <button type="button" onClick={onClose} aria-label="Close" className="grid size-11 place-items-center rounded-full hover:bg-mist">
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
            {footer && <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line px-6 py-4">{footer}</div>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

export function Btn({ children, variant = "ink", busy, className, ...rest }: React.ComponentProps<"button"> & { variant?: "ink" | "gold" | "ghost" | "danger"; busy?: boolean }) {
  return (
    <button
      {...rest}
      disabled={busy || rest.disabled}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition-colors disabled:opacity-50",
        variant === "ink" && "bg-ink text-paper hover:bg-ink-raised",
        variant === "gold" && "bg-brass text-ink hover:bg-brass-light",
        variant === "ghost" && "border border-line bg-white text-ink hover:border-ink/40",
        variant === "danger" && "border border-danger/30 bg-white text-danger hover:bg-danger hover:text-white",
        className,
      )}
    >
      {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export const STATUS_STYLE: Record<string, string> = {
  new: "bg-brass text-ink",
  reviewing: "bg-[#33415c] text-white",
  confirmed: "bg-ink text-paper",
  evaluated: "bg-ink text-paper",
  replied: "bg-ink text-paper",
  held: "bg-success text-white",
  retained: "bg-success text-white",
  published: "bg-success text-white",
  draft: "bg-mist text-stone",
};

export function Chip({ status }: { status?: string }) {
  return (
    <span className={cn("inline-flex h-fit w-fit rounded-full px-3 py-1 text-xs font-bold capitalize", STATUS_STYLE[status ?? ""] ?? "bg-mist text-stone")}>
      {(status ?? "unknown").replace(/-/g, " ")}
    </span>
  );
}

export function Empty({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-white p-12 text-center">
      <p className="text-stone">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Loading() {
  return (
    <div className="grid place-items-center p-16">
      <Loader2 aria-label="Loading" className="size-7 animate-spin text-brass-ink" />
    </div>
  );
}

/* ---------- form fields ---------- */

const inputCls = "mt-1.5 min-h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[0.95rem] text-ink outline-none transition-colors focus:border-ink";

export function F({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="text-sm font-bold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-stone">{hint}</span>}
    </label>
  );
}

export function TextIn({ label, value, onChange, hint, type = "text", className, placeholder }: { label: string; value: string | number | undefined; onChange: (v: string) => void; hint?: string; type?: string; className?: string; placeholder?: string }) {
  return (
    <F label={label} hint={hint} className={className}>
      <input type={type} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </F>
  );
}

export function AreaIn({ label, value, onChange, hint, rows = 4, className, mono }: { label: string; value: string | undefined; onChange: (v: string) => void; hint?: string; rows?: number; className?: string; mono?: boolean }) {
  return (
    <F label={label} hint={hint} className={className}>
      <textarea rows={rows} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={cn(inputCls, "py-2.5 leading-relaxed", mono && "font-mono text-sm")} />
    </F>
  );
}

export function SelectIn({ label, value, onChange, options, className }: { label: string; value: string | undefined; onChange: (v: string) => void; options: { value: string; label: string }[]; className?: string }) {
  return (
    <F label={label} className={className}>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </F>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <span className="relative mt-0.5">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="block h-6 w-11 rounded-full bg-line transition-colors peer-checked:bg-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink" />
        <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
      <span>
        <span className="block text-sm font-bold text-ink">{label}</span>
        {hint && <span className="block text-xs text-stone">{hint}</span>}
      </span>
    </label>
  );
}

/** Edits a list of strings, one per line. Blank lines are dropped when the list is used. */
export function LinesIn({ label, value, onChange, hint, rows = 4 }: { label: string; value: string[] | undefined; onChange: (v: string[]) => void; hint?: string; rows?: number }) {
  // Keep the raw text while typing, so Enter at the end starts a new line.
  const joined = (value ?? []).join("\n");
  const [text, setText] = useState(joined);
  const [synced, setSynced] = useState(joined);
  if (joined !== synced) {
    setSynced(joined);
    if (joined !== text.split("\n").map((x) => x.trim()).filter(Boolean).join("\n")) setText(joined);
  }
  return (
    <AreaIn
      label={label}
      hint={hint ?? "One item per line."}
      rows={rows}
      value={text}
      onChange={(v) => {
        setText(v);
        const list = v.split("\n").map((x) => x.trim()).filter(Boolean);
        setSynced(list.join("\n"));
        onChange(list);
      }}
    />
  );
}

/** Edits a list of objects with the given string fields. */
export function RowsIn<T extends Record<string, string | number>>({
  label, rows, onChange, fields, blank,
}: { label: string; rows: T[] | undefined; onChange: (v: T[]) => void; fields: { key: keyof T & string; label: string; type?: string; width?: string }[]; blank: T }) {
  const list = rows ?? [];
  return (
    <div>
      <p className="text-sm font-bold text-ink">{label}</p>
      <div className="mt-2 grid gap-2">
        {list.map((r, i) => (
          <div key={i} className="flex items-end gap-2 rounded-xl border border-line bg-white p-2.5">
            {fields.map((f) => (
              <label key={f.key} className={cn("block min-w-0", f.width ?? "flex-1")}>
                <span className="sr-only">{f.label}</span>
                <input
                  type={f.type ?? "text"}
                  placeholder={f.label}
                  value={String(r[f.key] ?? "")}
                  onChange={(e) => {
                    const next = [...list];
                    next[i] = { ...r, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value };
                    onChange(next);
                  }}
                  className="min-h-10 w-full rounded-lg border border-line px-2.5 text-sm outline-none focus:border-ink"
                />
              </label>
            ))}
            <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} aria-label="Remove row" className="grid size-10 shrink-0 place-items-center rounded-lg text-stone hover:bg-danger/10 hover:text-danger">
              <Trash2 aria-hidden className="size-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...list, { ...blank }])} className="inline-flex min-h-10 w-fit items-center gap-2 rounded-full px-3 text-sm font-bold text-brass-ink hover:bg-mist">
          <Plus aria-hidden className="size-4" /> Add row
        </button>
      </div>
    </div>
  );
}

export function Search({ value, onChange, placeholder = "Search" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="relative block">
      <span className="sr-only">{placeholder}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-h-11 w-full rounded-full border border-line bg-white px-4 text-sm outline-none focus:border-ink sm:w-64" />
    </label>
  );
}

/* ---------- repeatable items ---------- */

export type ItemField = { key: string; label: string; type?: "text" | "area" | "lines"; rows?: number; hint?: string };

/** Edits a list of objects as cards that can be added, removed and reordered. */
export function ItemsIn({
  label, items, onChange, fields, blank, itemLabel = "item", children,
}: {
  label: string;
  items: Record<string, unknown>[] | undefined;
  onChange: (v: Record<string, unknown>[]) => void;
  fields: ItemField[];
  blank: Record<string, unknown>;
  itemLabel?: string;
  /** Renders extra editors inside each card, such as a nested list. */
  children?: (item: Record<string, unknown>, set: (patch: Record<string, unknown>) => void) => ReactNode;
}) {
  const list = items ?? [];
  const setAt = (i: number, patch: Record<string, unknown>) => onChange(list.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div>
      <p className="text-sm font-bold text-ink">{label}</p>
      <ol className="mt-2 grid gap-3">
        {list.map((it, i) => (
          <li key={i} className="rounded-2xl border border-line bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-bold capitalize text-stone">
                {itemLabel} {i + 1}
              </span>
              <span className="flex gap-1">
                <IconBtn label={`Move ${itemLabel} ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp aria-hidden className="size-4" />
                </IconBtn>
                <IconBtn label={`Move ${itemLabel} ${i + 1} down`} disabled={i === list.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown aria-hidden className="size-4" />
                </IconBtn>
                <IconBtn label={`Remove ${itemLabel} ${i + 1}`} danger onClick={() => onChange(list.filter((_, j) => j !== i))}>
                  <Trash2 aria-hidden className="size-4" />
                </IconBtn>
              </span>
            </div>
            <div className="grid gap-3">
              {fields.map((f) =>
                f.type === "area" ? (
                  <AreaIn key={f.key} label={f.label} hint={f.hint} rows={f.rows ?? 3} value={String(it[f.key] ?? "")} onChange={(v) => setAt(i, { [f.key]: v })} />
                ) : f.type === "lines" ? (
                  <LinesIn key={f.key} label={f.label} hint={f.hint} rows={f.rows} value={(it[f.key] as string[]) ?? []} onChange={(v) => setAt(i, { [f.key]: v })} />
                ) : (
                  <TextIn key={f.key} label={f.label} hint={f.hint} value={String(it[f.key] ?? "")} onChange={(v) => setAt(i, { [f.key]: v })} />
                ),
              )}
              {children?.(it, (patch) => setAt(i, patch))}
            </div>
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => onChange([...list, structuredClone(blank)])} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-dashed border-ink/25 px-4 text-sm font-bold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper">
        <Plus aria-hidden className="size-4" /> Add {itemLabel}
      </button>
    </div>
  );
}

function IconBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn("grid size-11 place-items-center rounded-full text-stone transition-colors disabled:opacity-30", danger ? "hover:bg-danger/10 hover:text-danger" : "hover:bg-mist hover:text-ink")}
    >
      {children}
    </button>
  );
}
