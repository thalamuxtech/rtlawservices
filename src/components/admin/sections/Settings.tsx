"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock, ExternalLink, GitBranch, Globe2, Link2, Loader2, RefreshCw, Rocket, Trash2, UserPlus } from "lucide-react";
import { adminDelete, adminPost, api, useDoc, type DocumentData, type Timestamp } from "@/lib/api";
import { AreaIn, Btn, Chip, Empty, LinesIn, Loading, type Row, RowsIn, saveContent, SectionHeader, SelectIn, TextIn, Toggle, useDialog, useToast } from "../kit";

/* ---------- Site settings ---------- */

export function SiteSettings() {
  const toast = useToast();
  const stored = useDoc("settings", "site");
  const [edits, setS] = useState<DocumentData | null>(null);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  // Unsaved edits win over the stored copy, which refreshes in the background.
  const s = dirty && edits ? edits : stored === undefined ? null : (stored ?? {});
  if (!s) return <Loading />;
  const set = (p: DocumentData) => {
    setS((cur) => ({ ...(cur ?? s), ...p }));
    setDirty(true);
  };
  const refund = s.refundPolicy ?? { enabled: false, title: "Approval or refund", text: "" };

  const save = async () => {
    setBusy(true);
    try {
      const { updatedAt: _u, updatedBy: _b, ...data } = s;
      void _u;
      void _b;
      await saveContent("settings", "site", data);
      setDirty(false);
      setS(null);
      toast("ok", "Settings saved. The website shows them now.");
    } catch {
      toast("error", "Could not save settings.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid max-w-3xl gap-8">
      <SectionHeader title="Website details" lede="Contact details, hours and home page figures used across the website." action={
          <div className="flex flex-wrap items-center gap-2">
            {dirty && <span className="rounded-full bg-brass-pale px-3 py-1.5 text-sm font-bold text-brass-ink">Unsaved changes</span>}
            <Btn variant="gold" busy={busy} onClick={save}>
              Save changes
            </Btn>
          </div>
        }
      />
      <Group title="Contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextIn label="Phone" value={s.phone} onChange={(v) => set({ phone: v })} />
          <TextIn label="Email" type="email" value={s.email} onChange={(v) => set({ email: v })} />
          <TextIn
            label="Responsible attorney"
            hint="Maryland Rule 19-307.2 requires the name of at least one attorney responsible for the website's content."
            value={s.responsibleAttorney ?? ""}
            onChange={(v) => set({ responsibleAttorney: v || null })}
            className="sm:col-span-2"
          />
          <TextIn label="Announcement bar" hint="Shown at the very top of every page. Leave empty for the default." value={s.announcement} onChange={(v) => set({ announcement: v })} className="sm:col-span-2" />
        </div>
        <RowsIn label="Office hours" rows={s.hours} onChange={(v) => set({ hours: v })} blank={{ days: "", time: "" }} fields={[{ key: "days", label: "Days", width: "w-48" }, { key: "time", label: "Hours" }]} />
        <LinesIn
          label="Official profiles"
          hint="One web address per line, starting with https://. For example the firm's Google Business Profile, LinkedIn page, and bar or lawyer directory listings. Search engines and AI systems use them to recognise the firm. List only profiles the firm controls."
          value={s.profiles}
          onChange={(v) => set({ profiles: v })}
        />
      </Group>

      <Group title="Free evaluation">
        <TextIn label="Response target in business days" type="number" value={s.evaluationDays ?? 1} onChange={(v) => set({ evaluationDays: Math.max(1, Number(v) || 1) })} />
        <Toggle
          label="Show an approval or refund policy"
          hint="Turn on only once the firm has confirmed these terms in writing. They appear on the free evaluation page."
          checked={!!refund.enabled}
          onChange={(v) => set({ refundPolicy: { ...refund, enabled: v } })}
        />
        <TextIn label="Policy title" value={refund.title} onChange={(v) => set({ refundPolicy: { ...refund, title: v } })} />
        <AreaIn label="Policy text" value={refund.text} onChange={(v) => set({ refundPolicy: { ...refund, text: v } })} rows={4} />
      </Group>

      <Group title="Home page figures">
        <p className="text-sm text-stone">Enter only figures the firm can substantiate, such as approvals secured or the Google rating. Leave empty to show the default figures.</p>
        <RowsIn
          label="Figures"
          rows={s.stats}
          onChange={(v) => set({ stats: v })}
          blank={{ value: 0, prefix: "", suffix: "+", label: "" }}
          fields={[
            { key: "prefix", label: "Before", width: "w-16" },
            { key: "value", label: "Number", type: "number", width: "w-24" },
            { key: "suffix", label: "After", width: "w-16" },
            { key: "label", label: "Description" },
          ]}
        />
      </Group>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-5 rounded-2xl border border-line bg-white p-6">
      <h2 className="font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}

/* ---------- Staff ---------- */

export function Staff({ rows, uid, role }: { rows: Row[] | null; uid: string; role: string }) {
  const toast = useToast();
  const dialog = useDialog();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [newRole, setNewRole] = useState("intake");
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<{ email: string; url: string } | null>(null);
  const owner = role === "owner";

  const add = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return toast("error", "Enter a valid email address.");
    setBusy(true);
    try {
      const r = await adminPost<{ emailed: boolean; link?: string }>("staff", { email: email.trim(), name: name.trim(), role: newRole });
      if (r.emailed) toast("ok", `${email.trim()} added. A link to set a password is on its way.`);
      else if (r.link) {
        setLink({ email: email.trim(), url: r.link });
        toast("ok", `${email.trim()} added. Send them the set-password link below.`);
      }
      setEmail("");
      setName("");
    } catch (e) {
      toast("error", (e as Error).message || "Could not add the staff member.");
    } finally {
      setBusy(false);
    }
  };

  // A set-password link, valid for an hour, for someone who cannot receive email from the portal.
  const makeLink = async (r: Row) => {
    try {
      const { link: url } = await adminPost<{ link: string }>(`staff/${encodeURIComponent(r.id)}/link`);
      setLink({ email: String(r.email ?? r.id), url });
    } catch (e) {
      toast("error", (e as Error).message || "Could not create a link.");
    }
  };

  return (
    <div className="grid max-w-4xl gap-8">
      <SectionHeader title="Staff" lede="People who can sign in to this back office. Owners can add and remove staff." />
      {owner && (
        <section className="grid gap-4 rounded-2xl border border-line bg-white p-6">
          <h2 className="font-bold text-ink">Add a staff member</h2>
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_160px]">
            <TextIn label="Name" value={name} onChange={setName} />
            <TextIn label="Email" type="email" value={email} onChange={setEmail} />
            <SelectIn
              label="Role"
              value={newRole}
              onChange={setNewRole}
              options={[
                { value: "owner", label: "Owner" },
                { value: "attorney", label: "Attorney" },
                { value: "intake", label: "Intake" },
                { value: "editor", label: "Editor" },
              ]}
            />
          </div>
          <Btn variant="gold" busy={busy} onClick={add} className="w-fit">
            <UserPlus aria-hidden className="size-4" /> Add and send password link
          </Btn>
        </section>
      )}
      {link && (
        <section role="status" className="grid gap-3 rounded-2xl border border-brass/40 bg-brass-pale p-6">
          <h2 className="font-bold text-ink">Set-password link for {link.email}</h2>
          <p className="text-sm text-stone">Valid for one hour and for one use. Send it to them privately.</p>
          <input readOnly value={link.url} onFocus={(e) => e.currentTarget.select()} className="min-h-11 w-full rounded-xl border border-line bg-white px-3.5 font-mono text-sm" />
          <div className="flex gap-2">
            <Btn onClick={() => navigator.clipboard?.writeText(link.url).then(() => toast("ok", "Link copied"))}>Copy link</Btn>
            <Btn variant="ghost" onClick={() => setLink(null)}>Done</Btn>
          </div>
        </section>
      )}
      {rows === null ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Empty text="No staff records found." />
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-line bg-white">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-4 border-b border-line px-5 py-4 last:border-0">
              <span className="grid size-10 place-items-center rounded-full bg-ink text-sm font-bold text-brass-light">{String(r.name || r.email || "?").slice(0, 1).toUpperCase()}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-ink">{r.name || "Unnamed"}</span>
                <span className="block text-sm text-stone">{r.email || r.id}</span>
              </span>
              <Chip status={r.role} />
              {owner && (
                <button type="button" aria-label={`Set-password link for ${r.email}`} title="Set-password link" onClick={() => makeLink(r)} className="grid size-11 place-items-center rounded-full text-stone hover:bg-mist hover:text-ink">
                  <Link2 aria-hidden className="size-4" />
                </button>
              )}
              {owner && r.id !== uid && (
                <button
                  type="button"
                  aria-label={`Remove ${r.email}`}
                  onClick={async () => {
                    if (!(await dialog.confirm({ title: "Remove access?", message: `${r.name || r.email} will be signed out and can no longer use the back office.`, confirmLabel: "Remove access", danger: true }))) return;
                    try {
                      await adminDelete(`staff/${encodeURIComponent(r.id)}`);
                      toast("ok", "Access removed");
                    } catch {
                      toast("error", "Could not remove access.");
                    }
                  }}
                  className="grid size-11 place-items-center rounded-full text-stone hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 aria-hidden className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- Publishing ---------- */

const when = (d: Date) => d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

type BuildRun = { status: string; conclusion: string | null; createdAt: string; url: string };
type Status = { tokenSaved: boolean; mailReady: boolean; run: BuildRun | null };

export function Publishing() {
  const toast = useToast();
  const meta = useDoc("meta", "content") as { updatedAt?: Timestamp; publishError?: string } | null | undefined;
  const [build, setBuild] = useState<{ builtAt?: string; contentHash?: string } | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [checking, setChecking] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const load = useCallback(
    () =>
      Promise.all([
        fetch(`/build-meta.json?ts=${Date.now()}`)
          .then((r) => (r.ok ? r.json() : null))
          .then(setBuild)
          .catch(() => setBuild(null)),
        api<Status>("/api/admin/publish")
          .then(setStatus)
          .catch(() => setStatus(null)),
      ]),
    [],
  );
  const check = () => {
    setChecking(true);
    load().finally(() => setChecking(false));
  };
  useEffect(() => {
    load();
  }, [load]);
  const run = status?.run ?? null;
  // While a build runs, check its progress every 20 seconds.
  const running = !!run && run.status !== "completed";
  useEffect(() => {
    if (!running) return;
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [running, load]);

  const publishNow = async () => {
    setPublishing(true);
    try {
      const r = await adminPost<{ ok: boolean; error?: string }>("publish");
      if (r.ok) toast("ok", "Rebuild started. The website already shows the latest content.");
      else toast("error", `The website shows the latest content, but the rebuild could not start. ${r.error ?? ""}`);
      setTimeout(load, 4000);
    } catch (e) {
      toast("error", (e as Error).message);
    } finally {
      setPublishing(false);
    }
  };

  const changed = meta?.updatedAt?.toDate?.();
  const built = build?.builtAt ? new Date(build.builtAt) : null;
  const pending = !!(changed && built && changed > built);
  const failed = run?.status === "completed" && run.conclusion === "failure";
  const error = meta?.publishError;

  return (
    <div className="grid max-w-3xl gap-8">
      <SectionHeader
        title="Publishing"
        lede="How saved changes reach the public website."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Btn variant="ghost" busy={checking} onClick={check}><RefreshCw aria-hidden className="size-4" /> Check again</Btn>
            <Btn variant="gold" busy={publishing} onClick={publishNow}><Rocket aria-hidden className="size-4" /> Rebuild now</Btn>
          </div>
        }
      />
      <div className={`flex items-center gap-4 rounded-2xl p-6 ${pending || running ? "bg-brass-pale" : "bg-white ring-1 ring-line"}`}>
        <span className={`grid size-12 shrink-0 place-items-center rounded-full ${pending || running ? "bg-brass text-ink" : "bg-success text-white"}`}>
          {running ? <Loader2 aria-hidden className="size-6 animate-spin" /> : pending ? <Clock aria-hidden className="size-6" /> : <CheckCircle2 aria-hidden className="size-6" />}
        </span>
        <div>
          <p className="font-serif-display text-2xl text-ink">{running ? "Rebuilding the website" : pending ? "Live, rebuild pending" : "Website up to date"}</p>
          <p className="text-sm text-stone">
            Last content change: {changed ? when(changed) : "none recorded"}. Last rebuild: {built ? when(built) : "unknown"}.
          </p>
        </div>
      </div>
      {(failed || error) && (
        <div role="alert" className="rounded-2xl border border-danger/30 bg-danger/5 p-5 text-sm text-ink">
          <p className="font-bold text-danger">{failed ? "The last build failed." : "The rebuild could not start."}</p>
          <p className="mt-1">
            {failed ? (
              <>
                Visitors still see every saved change. Only the copies search engines read are out of date.{" "}
                <a href={run!.url} target="_blank" rel="noopener noreferrer" className="font-bold underline">See the build log</a>.
              </>
            ) : (
              <>{error}. Visitors still see every saved change, and the scheduled rebuild refreshes the copies search engines read.</>
            )}
          </p>
        </div>
      )}
      <ol className="grid gap-4">
        {[
          { icon: CheckCircle2, t: "Save", d: "Saving a story, review, post, attorney, page text or setting records the change in the database instantly." },
          { icon: Globe2, t: "Live at once", d: "Every page reads the newest published content when it opens, so visitors see the change on their next page load." },
          { icon: GitBranch, t: "Automatic rebuild", d: "Each save also starts a rebuild, which refreshes the copies of each page that search engines read. A scheduled job every ten minutes catches any missed change." },
        ].map(({ icon: Icon, t, d }) => (
          <li key={t} className="flex gap-4 rounded-2xl border border-line bg-white p-5">
            <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-brass-ink" />
            <span>
              <span className="block font-bold text-ink">{t}</span>
              <span className="text-sm text-stone">{d}</span>
            </span>
          </li>
        ))}
      </ol>
      <a href="/" target="_blank" className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-paper">
        Open the website <ExternalLink aria-hidden className="size-4" />
      </a>
      {status && (
        <Group title="Connections">
          <ul className="grid gap-2 text-sm text-ink">
            <li>Rebuild on save: {status.tokenSaved ? "connected to GitHub" : "not connected yet, so rebuilds wait for the ten-minute schedule"}.</li>
            <li>Email to clients: {status.mailReady ? "connected" : "not set up yet, so sending from the portal is unavailable"}.</li>
          </ul>
        </Group>
      )}
    </div>
  );
}
