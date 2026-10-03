"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { collection, doc, getDoc, limit, onSnapshot, orderBy, query, serverTimestamp, Timestamp, updateDoc } from "firebase/firestore";
import { CalendarClock, Inbox, Loader2, LogOut, Mail, Phone, Search, ShieldAlert, Users } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/primitives";
import { auth, db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

type Booking = {
  id: string; matterLabel: string; mode: string; attorney: string; start: Timestamp; durationMin: number; visitorTz: string;
  name: string; email: string; phone: string; country: string; language: string; otherParties: string; notes: string; source: string;
  status: string; createdAt?: Timestamp; staffNote?: string;
};
type Message = { id: string; name: string; email: string; phone: string; topic: string; message: string; status: string; createdAt?: Timestamp };

const BOOKING_STAGES = ["new", "confirmed", "held", "retained", "referred", "not-a-fit", "no-show", "cancelled"] as const;
const MESSAGE_STAGES = ["new", "replied", "closed"] as const;

const stageColor: Record<string, string> = {
  new: "bg-brass text-ink",
  confirmed: "bg-ink text-paper",
  held: "bg-success text-white",
  retained: "bg-success text-white",
  replied: "bg-ink text-paper",
};

const fmt = (t?: Timestamp, tz = "America/New_York") =>
  t ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: tz }).format(t.toDate()) : "";

export function AdminApp() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [staff, setStaff] = useState<{ role: string; name?: string } | null | undefined>(undefined);

  useEffect(
    () =>
      onAuthStateChanged(auth(), async (u) => {
        setUser(u);
        if (!u) return setStaff(null);
        try {
          const snap = await getDoc(doc(db(), "staff", u.uid));
          setStaff(snap.exists() ? (snap.data() as { role: string; name?: string }) : null);
        } catch {
          setStaff(null);
        }
      }),
    [],
  );

  if (user === undefined || (user && staff === undefined)) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Loader2 aria-label="Loading" className="size-8 animate-spin text-brass-ink" />
      </div>
    );
  }
  if (!user) return <Login />;
  if (!staff) return <NotStaff user={user} />;
  return <Dashboard user={user} role={staff.role} />;
}

function Shell({ children, user }: { children: React.ReactNode; user?: User }) {
  return (
    <div>
      <header className="on-dark bg-ink text-paper">
        <div className="container-luxe flex h-16 items-center justify-between">
          <Link href="/" aria-label="Back to website"><Logo tone="dark" className="w-[160px]" /></Link>
          {user && (
            <div className="flex items-center gap-4 text-sm">
              <span className="hidden text-stone-dark sm:inline">{user.email}</span>
              <button type="button" onClick={() => signOut(auth())} className="inline-flex min-h-11 items-center gap-2 font-bold text-brass-light hover:text-paper">
                <LogOut aria-hidden className="size-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth(), email.trim(), password);
    } catch {
      setError("Sign-in failed. Check your email and password.");
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!email.trim()) return setError("Enter your email first, then choose reset.");
    try {
      await sendPasswordResetEmail(auth(), email.trim());
    } catch {
      // Do not reveal whether an account exists.
    }
    setInfo("If an account exists for that email, a reset link is on its way.");
  };

  return (
    <Shell>
      <div className="container-luxe grid min-h-[calc(100dvh-4rem)] place-items-center py-16">
        <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-line bg-white p-8 shadow-[0_30px_80px_-40px_rgba(20,24,31,0.4)] sm:p-10">
          <p className="eyebrow text-brass-ink">Staff only</p>
          <h1 className="font-serif-display mt-3 text-4xl text-ink">Sign in</h1>
          <label htmlFor="a-email" className="mt-8 block text-sm font-bold text-ink">Email</label>
          <input id="a-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-line px-4 outline-none focus:border-ink" required />
          <label htmlFor="a-pass" className="mt-5 block text-sm font-bold text-ink">Password</label>
          <input id="a-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-line px-4 outline-none focus:border-ink" required />
          {error && <p role="alert" className="mt-4 text-sm font-bold text-danger">{error}</p>}
          {info && <p role="status" className="mt-4 text-sm text-success">{info}</p>}
          <Button type="submit" variant="ink" className="mt-8 w-full" disabled={busy}>
            {busy && <Loader2 aria-hidden className="size-4 animate-spin" />} Sign in
          </Button>
          <button type="button" onClick={reset} className="mt-4 min-h-11 w-full text-sm font-bold text-stone hover:text-ink">Forgot password?</button>
        </form>
      </div>
    </Shell>
  );
}

function NotStaff({ user }: { user: User }) {
  return (
    <Shell user={user}>
      <div className="container-luxe grid min-h-[60dvh] place-items-center text-center">
        <div className="max-w-md">
          <ShieldAlert aria-hidden className="mx-auto size-10 text-brass-ink" />
          <h1 className="font-serif-display mt-6 text-3xl text-ink">Access not yet granted</h1>
          <p className="mt-3 text-stone">
            You are signed in as {user.email}, but this account is not on the staff list. Ask the managing attorney to add it.
          </p>
          <p className="mt-3 text-xs text-stone">Account ID: {user.uid}</p>
        </div>
      </div>
    </Shell>
  );
}

function Dashboard({ user, role }: { user: User; role: string }) {
  const [tab, setTab] = useState<"bookings" | "messages">("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [now] = useState(() => Date.now());

  useEffect(() => {
    const u1 = onSnapshot(query(collection(db(), "bookings"), orderBy("createdAt", "desc"), limit(300)), (s) =>
      setBookings(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Booking, "id">) }))),
    );
    const u2 = onSnapshot(query(collection(db(), "messages"), orderBy("createdAt", "desc"), limit(300)), (s) =>
      setMessages(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Message, "id">) }))),
    );
    return () => {
      u1();
      u2();
    };
  }, []);

  const stats = [
    { label: "New requests", value: bookings.filter((b) => b.status === "new").length, icon: Inbox },
    { label: "Upcoming consultations", value: bookings.filter((b) => b.start?.toMillis() > now && ["new", "confirmed"].includes(b.status)).length, icon: CalendarClock },
    { label: "Retained", value: bookings.filter((b) => b.status === "retained").length, icon: Users },
    { label: "Unanswered messages", value: messages.filter((m) => m.status === "new").length, icon: Mail },
  ];

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const rows = tab === "bookings" ? bookings : messages;
    return rows.filter(
      (r) => (filter === "all" || r.status === filter) && (!term || `${r.name} ${r.email}`.toLowerCase().includes(term)),
    );
  }, [tab, bookings, messages, filter, q]);

  const current = tab === "bookings" ? bookings.find((b) => b.id === selected) : messages.find((m) => m.id === selected);
  const stages = tab === "bookings" ? BOOKING_STAGES : MESSAGE_STAGES;

  const setStatus = async (id: string, status: string) => {
    await updateDoc(doc(db(), tab, id), { status, updatedAt: serverTimestamp(), updatedBy: user.uid });
  };

  return (
    <Shell user={user}>
      <div className="container-luxe py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-brass-ink">Back office, {role}</p>
            <h1 className="font-serif-display mt-2 text-4xl text-ink">Requests and messages</h1>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-line bg-white p-5">
              <Icon aria-hidden className="size-5 text-brass-ink" />
              <p className="font-serif-display mt-3 text-4xl text-ink">{value}</p>
              <p className="text-sm text-stone">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <div role="tablist" className="inline-flex rounded-full border border-line bg-white p-1">
            {(["bookings", "messages"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => {
                  setTab(t);
                  setFilter("all");
                  setSelected(null);
                }}
                className={cn("min-h-10 rounded-full px-5 text-sm font-bold capitalize", tab === t ? "bg-ink text-paper" : "text-stone hover:text-ink")}
              >
                {t === "bookings" ? "Consultation requests" : "Messages"}
              </button>
            ))}
          </div>
          <label className="relative ml-auto">
            <span className="sr-only">Search by name or email</span>
            <Search aria-hidden className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" className="min-h-11 rounded-full border border-line bg-white pl-9 pr-4 text-sm outline-none focus:border-ink" />
          </label>
          <label>
            <span className="sr-only">Filter by status</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="min-h-11 rounded-full border border-line bg-white px-4 text-sm capitalize">
              <option value="all">All statuses</option>
              {stages.map((s) => <option key={s} value={s}>{s.replace(/-/g, " ")}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            {list.length === 0 ? (
              <p className="p-10 text-center text-stone">Nothing here yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {list.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(r.id)}
                      className={cn("grid w-full gap-1 p-4 text-left transition-colors hover:bg-mist sm:grid-cols-[1fr_auto]", selected === r.id && "bg-mist")}
                    >
                      <span>
                        <span className="block font-bold text-ink">{r.name}</span>
                        <span className="block text-sm text-stone">
                          {"matterLabel" in r ? `${r.matterLabel}, ${fmt(r.start)} ET` : `${r.topic}, ${fmt(r.createdAt)}`}
                        </span>
                      </span>
                      <span className={cn("h-fit w-fit rounded-full px-3 py-1 text-xs font-bold capitalize", stageColor[r.status] ?? "bg-mist text-stone")}>
                        {r.status.replace(/-/g, " ")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <aside className="h-fit rounded-2xl border border-line bg-white p-6 lg:sticky lg:top-6">
            {!current ? (
              <p className="text-stone">Select a row to see details.</p>
            ) : (
              <div>
                <p className="eyebrow text-brass-ink">{"matterLabel" in current ? current.matterLabel : current.topic}</p>
                <h2 className="font-serif-display mt-2 text-3xl text-ink">{current.name}</h2>
                <div className="mt-4 grid gap-2 text-sm">
                  <a href={`mailto:${current.email}`} className="inline-flex min-h-9 items-center gap-2 font-bold text-brass-ink hover:text-ink"><Mail aria-hidden className="size-4" /> {current.email}</a>
                  {current.phone && <a href={`tel:${current.phone}`} className="inline-flex min-h-9 items-center gap-2 font-bold text-brass-ink hover:text-ink"><Phone aria-hidden className="size-4" /> {current.phone}</a>}
                </div>
                <dl className="mt-5 grid gap-3 border-t border-line pt-5 text-sm">
                  {"matterLabel" in current ? (
                    <>
                      <Row k="When (ET)" v={`${fmt(current.start)}, ${current.durationMin} min`} />
                      <Row k="Client time" v={`${fmt(current.start, current.visitorTz)} (${current.visitorTz})`} />
                      <Row k="Format" v={current.mode} />
                      <Row k="Attorney" v={current.attorney} />
                      <Row k="Country" v={current.country} />
                      <Row k="Language" v={current.language} />
                      <Row k="Other parties" v={current.otherParties || "None given"} />
                      <Row k="Notes" v={current.notes || "None"} />
                      <Row k="Source" v={current.source || "Not given"} />
                      <Row k="Received" v={fmt(current.createdAt)} />
                    </>
                  ) : (
                    <>
                      <Row k="Received" v={fmt(current.createdAt)} />
                      <Row k="Message" v={current.message} />
                    </>
                  )}
                </dl>
                <label className="mt-6 block text-sm font-bold text-ink" htmlFor="status">Status</label>
                <select id="status" value={current.status} onChange={(e) => setStatus(current.id, e.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-line px-3 capitalize">
                  {stages.map((s) => <option key={s} value={s}>{s.replace(/-/g, " ")}</option>)}
                </select>
              </div>
            )}
          </aside>
        </div>
      </div>
    </Shell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3">
      <dt className="text-stone">{k}</dt>
      <dd className="whitespace-pre-wrap break-words text-ink">{v}</dd>
    </div>
  );
}
