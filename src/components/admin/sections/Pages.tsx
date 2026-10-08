"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { doc, onSnapshot, type DocumentData } from "firebase/firestore";
import { ExternalLink, RotateCcw } from "lucide-react";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { BASE_EXPERTISE, type Expertise } from "@/content/expertise";
import { DEFAULT_GENERAL_FAQS } from "@/content/general";
import { DEFAULT_PAGES, type PagesContent } from "@/content/pages";
import { AreaIn, Btn, ItemsIn, LinesIn, Loading, saveContent, SectionHeader, SelectIn, TextIn, useToast } from "../kit";

type Tab = "home" | "about" | "approach" | "faq" | "expertise" | "firm";

const TABS: { id: Tab; label: string; page: string }[] = [
  { id: "home", label: "Home page", page: "/" },
  { id: "about", label: "About", page: "/about/" },
  { id: "approach", label: "Process and pillars", page: "/how-we-work/" },
  { id: "faq", label: "FAQ", page: "/faq/" },
  { id: "expertise", label: "Practice areas", page: "/expertise/" },
  { id: "firm", label: "Firm details", page: "/" },
];

type Items = Record<string, unknown>[];

/** The editor starts from what the website shows now: published text, else the default. */
function current(saved: Partial<PagesContent>): PagesContent {
  const pick = <T,>(v: T | undefined, d: T) => (v == null || (Array.isArray(v) && v.length === 0) ? d : v);
  return {
    firm: { ...DEFAULT_PAGES.firm, ...saved.firm },
    home: { ...DEFAULT_PAGES.home, ...saved.home },
    about: { ...DEFAULT_PAGES.about, ...saved.about },
    process: pick(saved.process, DEFAULT_PAGES.process),
    pillars: pick(saved.pillars, DEFAULT_PAGES.pillars),
    faqs: pick(saved.faqs, DEFAULT_GENERAL_FAQS),
    expertise: saved.expertise ?? {},
  };
}

export function PagesEditor({ uid }: { uid: string }) {
  const toast = useToast();
  const [data, setData] = useState<PagesContent | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("home");

  useEffect(
    () =>
      onSnapshot(doc(db(), "settings", "pages"), (s) => {
        // Keep unsaved edits if another device saves meanwhile.
        setData((cur) => (cur && dirty ? cur : current((s.data() ?? {}) as Partial<PagesContent>)));
      }),
    [dirty],
  );

  if (!data) return <Loading />;

  const patch = <K extends keyof PagesContent>(k: K, v: PagesContent[K]) => {
    setData((cur) => (cur ? { ...cur, [k]: v } : cur));
    setDirty(true);
  };

  const save = async () => {
    setBusy(true);
    try {
      await saveContent("settings", "pages", changesOnly(data), uid);
      setDirty(false);
      toast("ok", "Page text saved. The website shows it now.");
    } catch {
      toast("error", "Could not save the page text.");
    } finally {
      setBusy(false);
    }
  };

  const restore = () => {
    if (!confirm("Restore the original wording for this tab? Your change is saved only when you choose Save changes.")) return;
    const d = current({});
    if (tab === "home") patch("home", d.home);
    if (tab === "about") patch("about", d.about);
    if (tab === "approach") {
      patch("process", d.process);
      patch("pillars", d.pillars);
    }
    if (tab === "faq") patch("faqs", d.faqs);
    if (tab === "firm") patch("firm", d.firm);
  };

  const page = TABS.find((t) => t.id === tab)!.page;

  return (
    <div className="grid max-w-4xl gap-6">
      <SectionHeader
        title="Page text"
        lede="Change the wording of the website's pages. The editor shows the text visitors see now. Save, and the change shows on the website at once."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {dirty && <span className="rounded-full bg-brass-pale px-3 py-1.5 text-sm font-bold text-brass-ink">Unsaved changes</span>}
            <Btn variant="gold" busy={busy} disabled={!dirty} onClick={save}>
              Save changes
            </Btn>
          </div>
        }
      />

      <div role="tablist" aria-label="Pages" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "min-h-11 rounded-full border px-4 text-sm font-bold transition-colors duration-300",
              tab === t.id ? "border-ink bg-ink text-paper" : "border-line bg-white text-stone hover:border-ink hover:bg-ink hover:text-paper",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <a href={page} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1.5 font-bold text-brass-ink hover:text-ink">
          Open this page on the website <ExternalLink aria-hidden className="size-4" />
        </a>
        {tab !== "expertise" && (
          <button type="button" onClick={restore} className="inline-flex min-h-11 items-center gap-1.5 font-bold text-stone hover:text-ink">
            <RotateCcw aria-hidden className="size-4" /> Restore original wording
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="grid gap-6">
          {tab === "home" && (
            <Group title="Opening section">
              <TextIn label="Small heading" value={data.home.eyebrow} onChange={(v) => patch("home", { ...data.home, eyebrow: v })} />
              <AreaIn label="Main headline" hint="Each word animates in on the page." rows={2} value={data.home.headline} onChange={(v) => patch("home", { ...data.home, headline: v })} />
              <AreaIn label="Introduction" rows={3} value={data.home.lede} onChange={(v) => patch("home", { ...data.home, lede: v })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextIn label="Gold button" value={data.home.primaryCta} onChange={(v) => patch("home", { ...data.home, primaryCta: v })} />
                <TextIn label="Outline button" value={data.home.secondaryCta} onChange={(v) => patch("home", { ...data.home, secondaryCta: v })} />
              </div>
              <p className="text-sm text-stone">Figures under the opening section are edited in Website details.</p>
            </Group>
          )}

          {tab === "about" && (
            <>
              <Group title="Page opening">
                <AreaIn label="Title" rows={2} value={data.about.title} onChange={(v) => patch("about", { ...data.about, title: v })} />
                <AreaIn label="Introduction" rows={3} value={data.about.lede} onChange={(v) => patch("about", { ...data.about, lede: v })} />
              </Group>
              <Group title="Our story">
                <TextIn label="Heading" value={data.about.storyHeading} onChange={(v) => patch("about", { ...data.about, storyHeading: v })} />
                <AreaIn label="Text" hint="Leave a blank line between paragraphs." rows={6} value={data.about.storyText} onChange={(v) => patch("about", { ...data.about, storyText: v })} />
                <ItemsIn
                  label="Timeline"
                  itemLabel="milestone"
                  items={data.about.timeline as unknown as Items}
                  onChange={(v) => patch("about", { ...data.about, timeline: v as PagesContent["about"]["timeline"] })}
                  blank={{ year: "", title: "", text: "" }}
                  fields={[{ key: "year", label: "When" }, { key: "title", label: "Title" }, { key: "text", label: "Text", type: "area" }]}
                />
              </Group>
              <Group title="Values">
                <TextIn label="Heading" value={data.about.valuesHeading} onChange={(v) => patch("about", { ...data.about, valuesHeading: v })} />
                <ItemsIn
                  label="Values"
                  itemLabel="value"
                  items={data.about.values as unknown as Items}
                  onChange={(v) => patch("about", { ...data.about, values: v as PagesContent["about"]["values"] })}
                  blank={{ title: "", text: "" }}
                  fields={[{ key: "title", label: "Title" }, { key: "text", label: "Text", type: "area", rows: 2 }]}
                />
              </Group>
            </>
          )}

          {tab === "approach" && (
            <>
              <Group title="Process steps" sub="Shown on the home page and the How we work page. Steps are numbered in this order.">
                <ItemsIn label="Steps" itemLabel="step" items={data.process as unknown as Items} onChange={(v) => patch("process", v as PagesContent["process"])} blank={{ title: "", text: "" }} fields={[{ key: "title", label: "Title" }, { key: "text", label: "Text", type: "area" }]} />
              </Group>
              <Group title="Pillars" sub="Shown on the home page and the About page.">
                <ItemsIn label="Pillars" itemLabel="pillar" items={data.pillars as unknown as Items} onChange={(v) => patch("pillars", v as PagesContent["pillars"])} blank={{ title: "", text: "" }} fields={[{ key: "title", label: "Title" }, { key: "text", label: "Text", type: "area", rows: 2 }]} />
              </Group>
            </>
          )}

          {tab === "faq" && (
            <Group title="Frequently asked questions" sub="Grouped by topic on the FAQ page. Practice area questions are edited under Practice areas.">
              <ItemsIn
                label="Topics"
                itemLabel="topic"
                items={data.faqs as unknown as Items}
                onChange={(v) => patch("faqs", v as PagesContent["faqs"])}
                blank={{ group: "", items: [] }}
                fields={[{ key: "group", label: "Topic name" }]}
              >
                {(it, set) => (
                  <ItemsIn label="Questions" itemLabel="question" items={it.items as Items} onChange={(v) => set({ items: v })} blank={{ q: "", a: "" }} fields={[{ key: "q", label: "Question" }, { key: "a", label: "Answer", type: "area" }]} />
                )}
              </ItemsIn>
            </Group>
          )}

          {tab === "expertise" && <ExpertiseEditor value={data.expertise} onChange={(v) => patch("expertise", v)} />}

          {tab === "firm" && (
            <Group title="Firm details">
              <TextIn label="Tagline" value={data.firm.tagline} onChange={(v) => patch("firm", { ...data.firm, tagline: v })} />
              <AreaIn label="Description for search engines and link previews" hint="About 150 to 160 characters reads best in search results." rows={3} value={data.firm.description} onChange={(v) => patch("firm", { ...data.firm, description: v })} />
              <p className="text-sm text-stone">{data.firm.description.length} characters</p>
            </Group>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Keeps only the fields that differ from the original wording. */
function changesOnly(data: PagesContent): DocumentData {
  const base = current({});
  // Compare with sorted keys: Firestore returns map fields in alphabetical order.
  const stable = (v: unknown): unknown =>
    Array.isArray(v) ? v.map(stable) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, stable((v as Record<string, unknown>)[k])])) : v;
  const same = (a: unknown, b: unknown) => JSON.stringify(stable(a)) === JSON.stringify(stable(b));
  const out: DocumentData = {};
  for (const k of Object.keys(data) as (keyof PagesContent)[]) {
    const v = data[k] as unknown;
    const d = base[k] as unknown;
    if (k === "expertise") {
      const edited = Object.fromEntries(Object.entries(data.expertise).filter(([, o]) => o && Object.keys(o).length));
      if (Object.keys(edited).length) out.expertise = edited;
    } else if (Array.isArray(v)) {
      if (!same(v, d)) out[k] = v;
    } else {
      const fields = Object.fromEntries(Object.entries(v as object).filter(([f, x]) => !same(x, (d as Record<string, unknown>)[f])));
      if (Object.keys(fields).length) out[k] = fields;
    }
  }
  return out;
}

type Over = PagesContent["expertise"][string];

function ExpertiseEditor({ value, onChange }: { value: PagesContent["expertise"]; onChange: (v: PagesContent["expertise"]) => void }) {
  const [slug, setSlug] = useState(BASE_EXPERTISE[0].slug);
  const base = useMemo(() => BASE_EXPERTISE.find((e) => e.slug === slug)!, [slug]);
  const e: Expertise = { ...base, ...(value[slug] ?? {}) } as Expertise;
  const edited = !!value[slug] && Object.keys(value[slug]).length > 0;
  const set = (p: Over) => onChange({ ...value, [slug]: { ...(value[slug] ?? {}), ...p } });
  const reset = () => {
    if (!confirm(`Restore the original wording for ${base.title}? Your change is saved only when you choose Save changes.`)) return;
    const next = { ...value };
    delete next[slug];
    onChange(next);
  };

  return (
    <>
      <div className="flex flex-wrap items-end gap-3">
        <SelectIn label="Practice area" value={slug} onChange={setSlug} options={BASE_EXPERTISE.map((x) => ({ value: x.slug, label: `${x.title}${value[x.slug] ? " (edited)" : ""}` }))} className="min-w-64 flex-1" />
        <a href={`/expertise/${slug}/`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-brass-ink hover:text-ink">
          Open page <ExternalLink aria-hidden className="size-4" />
        </a>
        {edited && (
          <button type="button" onClick={reset} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-stone hover:text-ink">
            <RotateCcw aria-hidden className="size-4" /> Restore original
          </button>
        )}
      </div>
      <Group title="Overview">
        <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
          <TextIn label="Title" value={e.title} onChange={(v) => set({ title: v })} />
          <TextIn label="Form codes" value={e.codes} onChange={(v) => set({ codes: v })} />
        </div>
        <AreaIn label="Summary" hint="Shown in menus and cards." rows={2} value={e.summary} onChange={(v) => set({ summary: v })} />
        <AreaIn label="Introduction" rows={4} value={e.intro} onChange={(v) => set({ intro: v })} />
        <AreaIn label="New to this? (plain-words explainer)" rows={3} value={e.newToThis} onChange={(v) => set({ newToThis: v })} />
        <LinesIn label="Who it is for" value={e.whoFor} onChange={(v) => set({ whoFor: v })} rows={5} />
      </Group>
      <Group title="How we help">
        <ItemsIn label="Services" itemLabel="service" items={e.howWeHelp as unknown as Items} onChange={(v) => set({ howWeHelp: v as Expertise["howWeHelp"] })} blank={{ title: "", text: "" }} fields={[{ key: "title", label: "Title" }, { key: "text", label: "Text", type: "area", rows: 2 }]} />
      </Group>
      {e.criteria && (
        <Group title={e.criteria.title}>
          <AreaIn label="Introduction" rows={2} value={e.criteria.intro} onChange={(v) => set({ criteria: { ...e.criteria!, intro: v } })} />
          <LinesIn label="Criteria" value={e.criteria.items} onChange={(v) => set({ criteria: { ...e.criteria!, items: v } })} rows={8} />
          <AreaIn label="Note" rows={2} value={e.criteria.note} onChange={(v) => set({ criteria: { ...e.criteria!, note: v } })} />
        </Group>
      )}
      <Group title="Forms, timing and checklist">
        <ItemsIn label="Forms" itemLabel="form" items={e.forms as unknown as Items} onChange={(v) => set({ forms: v as Expertise["forms"] })} blank={{ code: "", name: "" }} fields={[{ key: "code", label: "Code" }, { key: "name", label: "Name" }]} />
        <AreaIn label="Typical timeline" rows={3} value={e.timeline} onChange={(v) => set({ timeline: v })} />
        <LinesIn label="Document checklist" value={e.checklist} onChange={(v) => set({ checklist: v })} rows={6} />
      </Group>
      <Group title="Questions">
        <ItemsIn label="Questions" itemLabel="question" items={e.faqs as unknown as Items} onChange={(v) => set({ faqs: v as Expertise["faqs"] })} blank={{ q: "", a: "" }} fields={[{ key: "q", label: "Question" }, { key: "a", label: "Answer", type: "area" }]} />
      </Group>
    </>
  );
}

function Group({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-5 rounded-2xl border border-line bg-white p-6">
      <div>
        <h2 className="font-bold text-ink">{title}</h2>
        {sub && <p className="mt-1 text-sm text-stone">{sub}</p>}
      </div>
      {children}
    </section>
  );
}
