"use client";

import { useEffect, useState } from "react";
import { initializeApp, deleteApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signOut } from "firebase/auth";
import { deleteDoc, doc, onSnapshot, setDoc, serverTimestamp, type DocumentData, type Timestamp } from "firebase/firestore";
import { CheckCircle2, Clock, ExternalLink, GitBranch, Globe2, Loader2, RefreshCw, Rocket, Trash2, UserPlus } from "lucide-react";
import { auth, db, firebaseApp } from "@/lib/firebase";
import { hasPublishToken, latestBuild, requestPublish, savePublishToken, type BuildRun } from "@/lib/publish";
import { AreaIn, Btn, Chip, Empty, Loading, RowsIn, saveContent, SectionHeader, SelectIn, TextIn, Toggle, useToast, type Row } from "../kit";

/* ---------- Site settings ---------- */

export function SiteSettings({ uid }: { uid: string }) {
  const toast = useToast();
  const [s, setS] = useState<DocumentData | null>(null);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  useEffect(() => onSnapshot(doc(db(), "settings", "site"), (d) => setS((cur) => (cur && dirty ? cur : (d.data() ?? {})))), [dirty]);
  if (!s) return <Loading />;
  const set = (p: DocumentData) => {
    setS((cur) => ({ ...cur, ...p }));
    setDirty(true);
  };
  const refund = s.refundPolicy ?? { enabled: false, title: "Approval or refund", text: "" };

  const save = async () => {
    setBusy(true);
    try {
      const { updatedAt: _u, updatedBy: _b, ...data } = s;
      void _u;
      void _b;
      await saveContent("settings", "site", data, uid);
      setDirty(false);
      toast("ok", "Settings saved. The website updates in a few minutes.");
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
          <TextIn label="Location line" value={s.location} onChange={(v) => set({ location: v })} className="sm:col-span-2" />
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
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [newRole, setNewRole] = useState("intake");
  const [busy, setBusy] = useState(false);
  const owner = role === "owner";

  const add = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return toast("error", "Enter a valid email address.");
    setBusy(true);
    // A secondary app instance creates the account without signing the owner out.
    const second = initializeApp(firebaseApp().options, `staff-${Date.now()}`);
    try {
      const a2 = getAuth(second);
      const temp = crypto.getRandomValues(new Uint32Array(4)).join("-") + "Aa!";
      const cred = await createUserWithEmailAndPassword(a2, email.trim(), temp);
      await setDoc(doc(db(), "staff", cred.user.uid), { email: email.trim().toLowerCase(), name: name.trim(), role: newRole, addedBy: uid, addedAt: serverTimestamp() });
      await sendPasswordResetEmail(auth(), email.trim());
      await signOut(a2);
      toast("ok", `${email.trim()} added. A link to set a password is on its way.`);
      setEmail("");
      setName("");
    } catch (e) {
      const msg = String((e as Error).message || "");
      toast("error", msg.includes("email-already-in-use") ? "That email already has an account. Ask an owner to add its staff record in the console." : "Could not add the staff member.");
    } finally {
      await deleteApp(second).catch(() => {});
      setBusy(false);
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
              {owner && r.id !== uid && (
                <button
                  type="button"
                  aria-label={`Remove ${r.email}`}
                  onClick={async () => {
                    if (!confirm(`Remove back office access for ${r.email}?`)) return;
                    try {
                      await deleteDoc(doc(db(), "staff", r.id));
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

export function Publishing({ uid, role }: { uid: string; role: string }) {
  const toast = useToast();
  const [meta, setMeta] = useState<{ updatedAt?: Timestamp; publishRequestedAt?: Timestamp; publishError?: string } | null>(null);
  const [build, setBuild] = useState<{ builtAt?: string; contentHash?: string } | null>(null);
  const [run, setRun] = useState<BuildRun | null>(null);
  const [tokenSaved, setTokenSaved] = useState<boolean | null>(null);
  const [newToken, setNewToken] = useState("");
  const [checking, setChecking] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const owner = role === "owner";
  useEffect(() => onSnapshot(doc(db(), "meta", "content"), (s) => setMeta(s.data() ?? null)), []);
  const load = () =>
    Promise.all([
      fetch(`/build-meta.json?ts=${Date.now()}`)
        .then((r) => (r.ok ? r.json() : null))
        .then(setBuild)
        .catch(() => setBuild(null)),
      latestBuild().then(setRun),
      hasPublishToken().then(setTokenSaved),
    ]);
  const check = () => {
    setChecking(true);
    load().finally(() => setChecking(false));
  };
  useEffect(() => {
    load();
  }, []);
  // While a build runs, check its progress every 20 seconds.
  const running = !!run && run.status !== "completed";
  useEffect(() => {
    if (!running) return;
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [running]);

  const publishNow = async () => {
    setPublishing(true);
    const r = await requestPublish(uid);
    setPublishing(false);
    if (r.ok) {
      toast("ok", "Publishing started. The website updates in a few minutes.");
      setTimeout(load, 4000);
    } else {
      toast("error", r.reason === "no-token" ? "Add a publishing token first." : `Could not start publishing. ${r.detail ?? ""}`);
    }
  };
  const saveToken = async (value: string) => {
    try {
      await savePublishToken(value.trim(), uid);
      setNewToken("");
      setTokenSaved(!!value.trim());
      toast("ok", value.trim() ? "Publishing token saved." : "Publishing token removed.");
      load();
    } catch {
      toast("error", "Could not save the token.");
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
            <Btn variant="gold" busy={publishing} onClick={publishNow} disabled={tokenSaved === false}><Rocket aria-hidden className="size-4" /> Publish now</Btn>
          </div>
        }
      />
      <div className={`flex items-center gap-4 rounded-2xl p-6 ${pending || running ? "bg-brass-pale" : "bg-white ring-1 ring-line"}`}>
        <span className={`grid size-12 shrink-0 place-items-center rounded-full ${pending || running ? "bg-brass text-ink" : "bg-success text-white"}`}>
          {running ? <Loader2 aria-hidden className="size-6 animate-spin" /> : pending ? <Clock aria-hidden className="size-6" /> : <CheckCircle2 aria-hidden className="size-6" />}
        </span>
        <div>
          <p className="font-serif-display text-2xl text-ink">{running ? "Publishing now" : pending ? "Changes waiting to publish" : "Website up to date"}</p>
          <p className="text-sm text-stone">
            Last content change: {changed ? when(changed) : "none recorded"}. Last publish: {built ? when(built) : "unknown"}.
          </p>
        </div>
      </div>
      {(failed || error) && (
        <div role="alert" className="rounded-2xl border border-danger/30 bg-danger/5 p-5 text-sm text-ink">
          <p className="font-bold text-danger">{failed ? "The last build failed." : "Publishing could not start."}</p>
          <p className="mt-1">
            {failed ? (
              <>
                The website still shows the previous version.{" "}
                <a href={run!.url} target="_blank" rel="noopener noreferrer" className="font-bold underline">See the build log</a>.
              </>
            ) : (
              <>{error}. Changes still go live with the scheduled build, which can take several hours.</>
            )}
          </p>
        </div>
      )}
      <ol className="grid gap-4">
        {[
          { icon: CheckCircle2, t: "Save", d: "Saving a story, review, post, attorney, page text or setting records the change in the database instantly." },
          { icon: GitBranch, t: "Automatic build", d: "Each save starts a rebuild of the website with the latest published content. A scheduled job also checks for missed changes, but GitHub can delay it by several hours." },
          { icon: Globe2, t: "Live", d: "The new version replaces the old one in a few minutes. Visitors always see a complete, fast, static website." },
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
      {owner && (
        <Group title="Publishing token">
          <p className="text-sm text-stone">
            {tokenSaved
              ? "A token is saved. Saves start a rebuild straight away."
              : "No token is saved, so changes wait for the scheduled build. Create a fine-grained GitHub token for the thalamuxtech/rtlawservices repository with the Actions permission set to read and write, and paste it here."}
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <TextIn label={tokenSaved ? "Replace token" : "GitHub token"} type="password" value={newToken} onChange={setNewToken} placeholder="github_pat_…" className="min-w-64 flex-1" />
            <Btn onClick={() => saveToken(newToken)} disabled={!newToken.trim()}>Save token</Btn>
            {tokenSaved && <Btn variant="danger" onClick={() => saveToken("")}>Remove</Btn>}
          </div>
        </Group>
      )}
    </div>
  );
}
