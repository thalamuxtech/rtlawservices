"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Eye, ImageUp, Plus, Star, Trash2 } from "lucide-react";
import { EXPERTISE } from "@/content/expertise";
import { Markdown } from "@/components/site/Markdown";
import { cn } from "@/lib/utils";
import { RedactionTool } from "../RedactionTool";
import {
  AreaIn, Btn, Chip, Empty, LinesIn, Loading, Panel, removeContent, RowsIn, saveContent, Search, SectionHeader, SelectIn, slugify, TextIn, Toggle, useToast, type Row,
} from "../kit";

type Kind = "cases" | "reviews" | "posts" | "attorneys";

const EXPERTISE_OPTIONS = EXPERTISE.map((e) => ({ value: e.slug, label: e.title }));
const STATUS_OPTIONS = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft (hidden from the website)" },
];

const META: Record<Kind, { title: string; lede: string; add: string; idField: string; blank: () => Row }> = {
  cases: {
    title: "Success stories",
    lede: "Case results shown on the website. Upload the approval notice through the redaction tool so personal details are blurred before saving.",
    add: "New success story",
    idField: "slug",
    blank: () => ({ id: "", slug: "", title: "", track: "professionals", category: "", expertise: "national-interest-waiver", clientProfile: "", challenge: "", approach: "", outcome: "", headline: "", timeline: "", year: new Date().getFullYear(), attorney: "", featured: false, form: "I-140", details: [], evidence: [], testimonial: "", demo: false, status: "draft" }),
  },
  reviews: {
    title: "Reviews",
    lede: "Client reviews for the home page marquee and the reviews page. Publish only reviews the client agreed to share.",
    add: "New review",
    idField: "id",
    blank: () => ({ id: "", name: "", location: "", matter: "", expertise: "family", rating: 5, quote: "", date: new Date().toISOString().slice(0, 10), source: "direct", demo: false, status: "draft" }),
  },
  posts: {
    title: "Blog",
    lede: "Posts for the blog and knowledge center. Every post should list the official sources it relies on.",
    add: "New post",
    idField: "slug",
    blank: () => ({ id: "", slug: "", title: "", dek: "", category: "Start here", readMinutes: 4, published: new Date().toISOString().slice(0, 10), updated: new Date().toISOString().slice(0, 10), author: "RT Law Services", body: "## First heading\n\nWrite the post here.", sources: [], status: "draft" }),
  },
  attorneys: {
    title: "Attorneys",
    lede: "Attorney profiles. State bar admissions exactly, including any practice limitation.",
    add: "New attorney",
    idField: "slug",
    blank: () => ({ id: "", slug: "", name: "", title: "", admissions: [], practiceLimitation: "", education: [], languages: ["English"], memberships: [], leads: [], bio: [], initials: "", order: 9, demo: false, status: "draft" }),
  },
};

const subtitle = (k: Kind, r: Row) =>
  k === "cases" ? `${r.category}, ${r.year}` : k === "reviews" ? `${r.matter}, ${r.date}` : k === "posts" ? `${r.category}, ${r.published}` : r.title;

export function ContentManager({ kind, rows, uid }: { kind: Kind; rows: Row[] | null; uid: string }) {
  const meta = META[kind];
  const toast = useToast();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Row | null>(null);
  const [opened, setOpened] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [busy, setBusy] = useState(false);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => !t || `${r.title ?? ""} ${r.name ?? ""} ${r.category ?? ""} ${r.quote ?? ""}`.toLowerCase().includes(t));
  }, [rows, q]);

  const save = async () => {
    if (!edit) return;
    const { id: _ignored, updatedAt: _u, updatedBy: _b, _slugEdited, ...data } = edit;
    void _ignored;
    void _u;
    void _b;
    // The web address follows the full title unless someone typed one.
    const slug = slugify(String(_slugEdited ? data.slug : data.slug && !isNew ? data.slug : data.title || data.name || ""));
    if (meta.idField === "slug") {
      if (!slug) return toast("error", "Add a title or name first.");
      data.slug = slug;
    }
    // Existing records always save to their own document, so a changed title or
    // address never creates a copy. New records must not reuse an address.
    const id = !isNew ? edit.id : meta.idField === "slug" ? slug : `${slugify(String(edit.name || "review"))}-${Date.now().toString(36)}`;
    if (!id) return toast("error", "Add a title or name first.");
    if (isNew && (rows ?? []).some((r) => r.id === id || r.slug === id)) return toast("error", "Another record already uses this web address. Change the title or web address.");
    if (kind === "attorneys" && !data.initials) data.initials = String(data.name || "").split(/\s+/).filter(Boolean).slice(0, 2).map((p: string) => p[0]).join("").toUpperCase();
    if (kind === "posts") data.readMinutes = Math.max(1, Math.round(String(data.body || "").split(/\s+/).length / 220));
    setBusy(true);
    try {
      const wasLive = (rows ?? []).find((r) => r.id === id)?.status === "published";
      await saveContent(kind, id, data, uid, data.status === "published" || wasLive);
      toast("ok", data.status === "published" ? "Saved. It is live on the website now." : "Saved as draft");
      setEdit(null);
    } catch {
      toast("error", "Could not save. Check required fields and your permissions.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!edit?.id || !confirm("Delete this item permanently? This cannot be undone.")) return;
    setBusy(true);
    try {
      await removeContent(kind, edit.id, uid);
      toast("ok", "Deleted");
      setEdit(null);
    } catch {
      toast("error", "Could not delete.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6">
      <SectionHeader
        title={meta.title}
        lede={meta.lede}
        action={
          <div className="flex flex-wrap gap-2">
            <Search value={q} onChange={setQ} />
            <Btn
              variant="gold"
              onClick={() => {
                setIsNew(true);
                const blank = meta.blank();
                setOpened(JSON.stringify(blank));
                setEdit(blank);
              }}
            >
              <Plus aria-hidden className="size-4" /> {meta.add}
            </Btn>
          </div>
        }
      />

      {rows === null ? (
        <Loading />
      ) : list.length === 0 ? (
        <Empty text="Nothing here yet." />
      ) : (
        <ul className={cn("grid gap-3", kind !== "reviews" && "sm:grid-cols-2")}>
          {list.map((r, i) => (
            <motion.li key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.03 }}>
              <button
                type="button"
                onClick={() => {
                  setIsNew(false);
                  setOpened(JSON.stringify(r));
                  setEdit({ ...r });
                }}
                className="flex h-full w-full gap-4 rounded-2xl border border-line bg-white p-4 text-left transition-colors hover:border-ink/40"
              >
                {kind === "cases" && (
                  <span className="grid h-20 w-16 shrink-0 place-items-center overflow-hidden rounded-md bg-mist ring-1 ring-line">
                    {r.documentImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.documentImage} alt="" className="size-full object-cover object-top" />
                    ) : (
                      <span className="text-[0.6rem] font-bold text-stone">No image</span>
                    )}
                  </span>
                )}
                {kind === "attorneys" && (
                  <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-ink font-serif-display text-xl text-brass-light">
                    {r.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.photo} alt="" className="size-full object-cover" />
                    ) : (
                      r.initials
                    )}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-ink">{r.title || r.name}</span>
                  <span className="block truncate text-sm text-stone">{kind === "reviews" ? `"${r.quote}"` : subtitle(kind, r)}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-2">
                    <Chip status={r.status} />
                    {r.demo && <span className="rounded-full border border-brass-ink/40 px-2 text-xs font-bold text-brass-ink">Placeholder, not on website</span>}
                    {r.featured && <span className="rounded-full bg-brass-pale px-2 text-xs font-bold text-brass-ink">Featured</span>}
                    {kind === "reviews" && (
                      <span className="flex items-center gap-0.5 text-brass">
                        {Array.from({ length: r.rating ?? 5 }).map((_, j) => (
                          <Star key={j} aria-hidden className="size-3.5 fill-current" />
                        ))}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </motion.li>
          ))}
        </ul>
      )}

      <Panel
        open={!!edit}
        title={isNew ? meta.add : `Edit ${String(edit?.title || edit?.name || "")}`}
        onClose={() => {
          // Closing with unsaved edits asks first, so Escape or a stray click cannot discard work.
          if (edit && JSON.stringify(edit) !== opened && !confirm("Discard your unsaved changes?")) return;
          setEdit(null);
        }}
        wide
        footer={
          <>
            {!isNew && (
              <Btn variant="danger" onClick={remove} busy={busy} className="mr-auto">
                <Trash2 aria-hidden className="size-4" /> Delete
              </Btn>
            )}
            <Btn variant="ghost" onClick={() => setEdit(null)}>
              Cancel
            </Btn>
            <Btn variant="gold" onClick={save} busy={busy}>
              Save
            </Btn>
          </>
        }
      >
        {edit && <Editor kind={kind} r={edit} set={(patch) => setEdit((cur) => (cur ? { ...cur, ...patch } : cur))} />}
      </Panel>
    </div>
  );
}

function Editor({ kind, r, set }: { kind: Kind; r: Row; set: (p: Partial<Row>) => void }) {
  const [redact, setRedact] = useState(false);
  const [preview, setPreview] = useState(false);
  const common = (
    <div className="grid gap-4 rounded-2xl bg-mist p-4 sm:grid-cols-2">
      <SelectIn label="Visibility" value={r.status} onChange={(v) => set({ status: v })} options={STATUS_OPTIONS} />
      {kind !== "posts" && (
        <div className="pt-6">
          <Toggle
            label="Fictional placeholder"
            hint={kind === "reviews" ? "Shown on the website with a note that reviews are illustrative examples. Turn off once the review is real." : "Kept in the back office only. Never shown on the website. Turn off once the record is real."}
            checked={!!r.demo}
            onChange={(v) => set({ demo: v })}
          />
        </div>
      )}
    </div>
  );

  if (kind === "reviews")
    return (
      <div className="grid gap-5">
        {common}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextIn label="Name as shown" hint="First name and initial, for privacy." value={r.name} onChange={(v) => set({ name: v })} />
          <TextIn label="Location" value={r.location} onChange={(v) => set({ location: v })} />
          <TextIn label="Matter" value={r.matter} onChange={(v) => set({ matter: v })} />
          <SelectIn label="Practice area" value={r.expertise} onChange={(v) => set({ expertise: v })} options={EXPERTISE_OPTIONS} />
          <SelectIn label="Rating" value={String(r.rating)} onChange={(v) => set({ rating: Number(v) })} options={[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} stars` }))} />
          <TextIn label="Date" type="date" value={r.date} onChange={(v) => set({ date: v })} />
          <SelectIn
            label="Source"
            value={r.source}
            onChange={(v) => set({ source: v })}
            options={[
              { value: "google", label: "Google review (shows the Google mark)" },
              { value: "direct", label: "Sent directly to the firm" },
              { value: "sample", label: "Sample" },
            ]}
          />
        </div>
        <AreaIn label="Review text" value={r.quote} onChange={(v) => set({ quote: v })} rows={5} />
      </div>
    );

  if (kind === "posts")
    return (
      <div className="grid gap-5">
        {common}
        <TextIn label="Title" value={r.title} onChange={(v) => set({ title: v, ...(r._slugEdited || r.id ? {} : { slug: slugify(v) }) })} />
        <TextIn label="Web address" hint={`/blog/${r.slug || slugify(r.title || "")}/`} value={r.slug} onChange={(v) => set({ slug: slugify(v), _slugEdited: true })} />
        <AreaIn label="Summary" value={r.dek} onChange={(v) => set({ dek: v })} rows={2} />
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectIn label="Category" value={r.category} onChange={(v) => set({ category: v })} options={["Start here", "Family", "Citizenship", "Work", "Professionals", "Employers", "Estates"].map((c) => ({ value: c, label: c }))} />
          <TextIn label="Published" type="date" value={r.published} onChange={(v) => set({ published: v })} />
          <TextIn label="Updated" type="date" value={r.updated} onChange={(v) => set({ updated: v })} />
        </div>
        <TextIn label="Author" value={r.author} onChange={(v) => set({ author: v })} />
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-ink">Body</span>
            <button type="button" onClick={() => setPreview((p) => !p)} className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-bold text-brass-ink hover:bg-mist">
              <Eye aria-hidden className="size-4" /> {preview ? "Edit" : "Preview"}
            </button>
          </div>
          {preview ? (
            <div className="prose-luxe mt-2 rounded-xl border border-line bg-white p-5">
              <Markdown source={r.body || ""} />
            </div>
          ) : (
            <AreaIn label="" hint="## Heading, ### Subheading, - list item, **bold**, *italic*, [link text](https://...). Leave a blank line between paragraphs." value={r.body} onChange={(v) => set({ body: v })} rows={18} mono />
          )}
        </div>
        <RowsIn
          label="Sources"
          rows={r.sources}
          onChange={(v) => set({ sources: v })}
          blank={{ title: "", publisher: "", url: "https://" }}
          fields={[
            { key: "title", label: "Title" },
            { key: "publisher", label: "Publisher", width: "w-36" },
            { key: "url", label: "URL" },
          ]}
        />
      </div>
    );

  if (kind === "attorneys")
    return (
      <div className="grid gap-5">
        {common}
        <PhotoField value={r.photo} onChange={(v) => set({ photo: v })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextIn label="Full name" value={r.name} onChange={(v) => set({ name: v, ...(r.id ? {} : { slug: slugify(v) }) })} />
          <TextIn label="Title" value={r.title} onChange={(v) => set({ title: v })} />
          <TextIn label="Display order" type="number" value={r.order} onChange={(v) => set({ order: Number(v) })} />
          <TextIn label="Practice limitation" hint="For example: Practice limited to federal immigration law." value={r.practiceLimitation} onChange={(v) => set({ practiceLimitation: v })} />
        </div>
        <LinesIn label="Bar admissions" value={r.admissions} onChange={(v) => set({ admissions: v })} />
        <LinesIn label="Education" value={r.education} onChange={(v) => set({ education: v })} />
        <LinesIn label="Languages" value={r.languages} onChange={(v) => set({ languages: v })} rows={2} />
        <LinesIn label="Memberships" value={r.memberships} onChange={(v) => set({ memberships: v })} />
        <LinesIn label="Biography" hint="One paragraph per line." value={r.bio} onChange={(v) => set({ bio: v })} rows={6} />
        <fieldset>
          <legend className="text-sm font-bold text-ink">Leads matters in</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXPERTISE.map((e) => {
              const on = (r.leads ?? []).includes(e.slug);
              return (
                <button
                  key={e.slug}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set({ leads: on ? r.leads.filter((x: string) => x !== e.slug) : [...(r.leads ?? []), e.slug] })}
                  className={cn("min-h-10 rounded-full border px-3 text-sm font-bold", on ? "border-ink bg-ink text-paper" : "border-line bg-white text-stone")}
                >
                  {e.title}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>
    );

  return (
    <div className="grid gap-5">
      {common}
      <div className="grid gap-4 sm:grid-cols-[150px_1fr]">
        <div>
          <p className="text-sm font-bold text-ink">Approval notice</p>
          <div className="mt-2 grid aspect-[8.5/11] place-items-center overflow-hidden rounded-lg bg-mist ring-1 ring-line">
            {r.documentImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.documentImage} alt="Redacted approval notice" className="size-full object-cover object-top" />
            ) : (
              <span className="p-2 text-center text-xs text-stone">A sample notice is shown until you upload one.</span>
            )}
          </div>
        </div>
        <div className="grid content-start gap-3">
          <Btn variant="ink" onClick={() => setRedact(true)}>
            <ImageUp aria-hidden className="size-4" /> {r.documentImage ? "Replace with a new redacted image" : "Upload and redact"}
          </Btn>
          {r.documentImage && (
            <Btn variant="ghost" onClick={() => set({ documentImage: null })}>
              Remove image
            </Btn>
          )}
          <TextIn label="Form shown on the sample notice" value={r.form} onChange={(v) => set({ form: v })} />
          <Toggle label="Feature on the home page" checked={!!r.featured} onChange={(v) => set({ featured: v })} />
        </div>
      </div>
      <TextIn label="Title" value={r.title} onChange={(v) => set({ title: v, ...(r.id ? {} : { slug: slugify(v) }) })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectIn label="Track" value={r.track} onChange={(v) => set({ track: v })} options={[{ value: "individuals", label: "Individuals and families" }, { value: "professionals", label: "Professionals and employers" }]} />
        <SelectIn label="Practice area" value={r.expertise} onChange={(v) => set({ expertise: v })} options={EXPERTISE_OPTIONS} />
        <TextIn label="Category label" value={r.category} onChange={(v) => set({ category: v })} />
        <TextIn label="Year of decision" type="number" value={r.year} onChange={(v) => set({ year: Number(v) })} />
        <TextIn label="Headline outcome" hint="For example: Approved in 7 weeks" value={r.headline} onChange={(v) => set({ headline: v })} />
        <TextIn label="Time to decision" value={r.timeline} onChange={(v) => set({ timeline: v })} />
      </div>
      <AreaIn label="The client (anonymised)" value={r.clientProfile} onChange={(v) => set({ clientProfile: v })} rows={2} />
      <AreaIn label="The challenge" value={r.challenge} onChange={(v) => set({ challenge: v })} rows={2} />
      <AreaIn label="Our approach" value={r.approach} onChange={(v) => set({ approach: v })} rows={3} />
      <AreaIn label="The outcome" value={r.outcome} onChange={(v) => set({ outcome: v })} rows={2} />
      <RowsIn label="Case details table" rows={r.details} onChange={(v) => set({ details: v })} blank={{ label: "", value: "" }} fields={[{ key: "label", label: "Label", width: "w-44" }, { key: "value", label: "Value" }]} />
      <LinesIn label="Evidence presented" value={r.evidence} onChange={(v) => set({ evidence: v })} />
      <AreaIn label="Client quote (with written consent)" value={r.testimonial} onChange={(v) => set({ testimonial: v })} rows={2} />
      <RedactionTool
        open={redact}
        onClose={() => setRedact(false)}
        onDone={(url) => {
          set({ documentImage: url });
          setRedact(false);
        }}
      />
    </div>
  );
}

function PhotoField({ value, onChange }: { value?: string; onChange: (v: string | null) => void }) {
  const pick = (f: File | null) => {
    if (!f) return;
    // Read as a data URL: the site's content security policy blocks blob URLs.
    const reader = new FileReader();
    reader.onerror = () => alert("The file could not be read. Try another image.");
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => alert("This image could not be opened. Try a PNG or JPEG.");
      img.onload = () => {
        const size = 800;
        const c = document.createElement("canvas");
        const s = Math.min(img.width, img.height);
        c.width = c.height = size;
        c.getContext("2d")!.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
        onChange(c.toDataURL("image/webp", 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(f);
  };
  return (
    <div className="flex items-center gap-4">
      <span className="grid size-24 place-items-center overflow-hidden rounded-full bg-ink text-sm text-stone-dark">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Portrait" className="size-full object-cover" />
        ) : (
          "No photo"
        )}
      </span>
      <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-5 text-sm font-bold text-ink hover:border-ink/40">
        <ImageUp aria-hidden className="size-4" /> Upload portrait
        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
      </label>
      {value && (
        <button type="button" onClick={() => onChange(null)} className="min-h-11 text-sm font-bold text-danger">
          Remove
        </button>
      )}
    </div>
  );
}
