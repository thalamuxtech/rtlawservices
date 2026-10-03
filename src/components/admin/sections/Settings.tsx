"use client";

import { useEffect, useState } from "react";
import { initializeApp, deleteApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signOut } from "firebase/auth";
import { deleteDoc, doc, onSnapshot, setDoc, serverTimestamp, type DocumentData, type Timestamp } from "firebase/firestore";
import { CheckCircle2, Clock, ExternalLink, GitBranch, Globe2, RefreshCw, Trash2, UserPlus } from "lucide-react";
import { auth, db, firebaseApp } from "@/lib/firebase";
import { AreaIn, Btn, Chip, Empty, Loading, RowsIn, saveContent, SectionHeader, SelectIn, TextIn, Toggle, useToast, type Row } from "../kit";

/* ---------- Site settings ---------- */

export function SiteSettings({ uid }: { uid: string }) {
  const toast = useToast();
  const [s, setS] = useState<DocumentData | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => onSnapshot(doc(db(), "settings", "site"), (d) => setS(d.data() ?? {})), []);
  if (!s) return <Loading />;
  const set = (p: DocumentData) => setS((cur) => ({ ...cur, ...p }));
  const refund = s.refundPolicy ?? { enabled: false, title: "Approval or refund", text: "" };

  const save = async () => {
    setBusy(true);
    try {
      const { updatedAt: _u, updatedBy: _b, ...data } = s;
      void _u;
      void _b;
      await saveContent("settings", "site", data, uid);
      toast("ok", "Settings saved. The website updates with the next publish.");
    } catch {
      toast("error", "Could not save settings.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid max-w-3xl gap-8">
      <SectionHeader title="Website details" lede="Contact details, hours and home page figures used across the website." action={<Btn variant="gold" busy={busy} onClick={save}>Save changes</Btn>} />
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

export function Publishing() {
  const [meta, setMeta] = useState<{ updatedAt?: Timestamp } | null>(null);
  const [build, setBuild] = useState<{ builtAt?: string; contentHash?: string } | null>(null);
  const [checking, setChecking] = useState(false);
  useEffect(() => onSnapshot(doc(db(), "meta", "content"), (s) => setMeta(s.data() ?? null)), []);
  const load = () =>
    fetch(`/build-meta.json?ts=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setBuild)
      .catch(() => setBuild(null));
  const check = () => {
    setChecking(true);
    load().finally(() => setChecking(false));
  };
  useEffect(() => {
    load();
  }, []);
  const changed = meta?.updatedAt?.toDate?.();
  const built = build?.builtAt ? new Date(build.builtAt) : null;
  const pending = !!(changed && built && changed > built);

  return (
    <div className="grid max-w-3xl gap-8">
      <SectionHeader title="Publishing" lede="How saved changes reach the public website." action={<Btn variant="ghost" busy={checking} onClick={check}><RefreshCw aria-hidden className="size-4" /> Check again</Btn>} />
      <div className={`flex items-center gap-4 rounded-2xl p-6 ${pending ? "bg-brass-pale" : "bg-white ring-1 ring-line"}`}>
        <span className={`grid size-12 place-items-center rounded-full ${pending ? "bg-brass text-ink" : "bg-success text-white"}`}>
          {pending ? <Clock aria-hidden className="size-6" /> : <CheckCircle2 aria-hidden className="size-6" />}
        </span>
        <div>
          <p className="font-serif-display text-2xl text-ink">{pending ? "Changes waiting to publish" : "Website up to date"}</p>
          <p className="text-sm text-stone">
            Last content change: {changed ? changed.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "none recorded"}. Last publish:{" "}
            {built ? built.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "unknown"}.
          </p>
        </div>
      </div>
      <ol className="grid gap-4">
        {[
          { icon: CheckCircle2, t: "Save", d: "Saving a story, review, post, attorney or setting records the change in the database instantly." },
          { icon: GitBranch, t: "Automatic build", d: "Every 30 minutes, an automated job checks for changes. If there are any, it rebuilds the website with the latest published content." },
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
    </div>
  );
}
