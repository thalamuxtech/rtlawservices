"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  BookOpen, CalendarClock, ClipboardCheck, ExternalLink, FileBadge, Gauge, KeyRound, LayoutDashboard, Loader2, LogOut, Mail, Menu, Rocket, Settings, ShieldAlert, Star, Users, UserSquare2, Wand2, X,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { auth, db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { ToastProvider, useCollection } from "./kit";
import { Overview } from "./sections/Overview";
import { BOOKINGS, EVALUATIONS, MESSAGES, Requests } from "./sections/Requests";
import { ContentManager } from "./sections/Content";
import { Publishing, SiteSettings, Staff } from "./sections/Settings";

type StaffDoc = { role: string; name?: string; email?: string };

export function AdminApp() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [staff, setStaff] = useState<StaffDoc | null | undefined>(undefined);

  useEffect(
    () =>
      onAuthStateChanged(auth(), async (u) => {
        setUser(u);
        if (!u) return setStaff(null);
        setStaff(undefined);
        try {
          const snap = await getDoc(doc(db(), "staff", u.uid));
          setStaff(snap.exists() ? (snap.data() as StaffDoc) : null);
        } catch {
          setStaff(null);
        }
      }),
    [],
  );

  if (user === undefined || (user && staff === undefined)) {
    return (
      <div className="grid min-h-dvh place-items-center bg-ink">
        <Logo tone="dark" variant="mark" className="w-24" />
      </div>
    );
  }
  if (!user) return <Login />;
  if (!staff) return <NotStaff user={user} />;
  return (
    <ToastProvider>
      <Shell user={user} staff={staff} />
    </ToastProvider>
  );
}

/* ---------- sign-in ---------- */

type PasswordCred = Credential & { password?: string; id: string };

function Login() {
  const [email, setEmail] = useState(() => {
    try {
      return typeof window === "undefined" ? "" : localStorage.getItem("rt-admin-email") || "";
    } catch {
      return "";
    }
  });
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const signIn = async (e?: React.FormEvent, creds?: { email: string; password: string }) => {
    e?.preventDefault();
    const em = (creds?.email ?? email).trim();
    const pw = creds?.password ?? password;
    if (!em || !pw) return setError("Enter your email and password, or use Autoload.");
    setBusy(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth(), em, pw);
      try {
        localStorage.setItem("rt-admin-email", em);
        // Offer the browser's password manager, so Autoload works next time.
        const PC = (window as unknown as { PasswordCredential?: new (d: { id: string; password: string; name?: string }) => Credential }).PasswordCredential;
        if (PC && navigator.credentials?.store) await navigator.credentials.store(new PC({ id: em, password: pw, name: "RT Law Services staff" }));
      } catch {}
    } catch {
      setError("Sign-in failed. Check your email and password.");
    } finally {
      setBusy(false);
    }
  };

  const autoload = async () => {
    setError("");
    setInfo("");
    try {
      const cred = (await navigator.credentials?.get({ password: true, mediation: "optional" } as CredentialRequestOptions)) as PasswordCred | null;
      if (cred?.id && cred.password) {
        setEmail(cred.id);
        setPassword(cred.password);
        setInfo("Details loaded. Signing you in.");
        await signIn(undefined, { email: cred.id, password: cred.password });
        return;
      }
    } catch {}
    let last: string | null = null;
    try {
      last = localStorage.getItem("rt-admin-email");
    } catch {}
    if (last) {
      setEmail(last);
      setInfo("Email loaded. Enter your password, or let your browser fill it in.");
    } else {
      setInfo("No saved details on this device yet. Sign in once and let your browser save them.");
    }
  };

  const reset = async () => {
    if (!email.trim()) return setError("Enter your email first, then choose reset.");
    try {
      await sendPasswordResetEmail(auth(), email.trim());
    } catch {}
    setInfo("If an account exists for that email, a reset link is on its way.");
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_0.9fr]">
      <div className="on-dark relative hidden overflow-hidden bg-ink p-14 text-paper lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="grain absolute inset-0" />
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            aria-hidden
            className="absolute -bottom-40 -right-40 rounded-full border border-brass/25"
            style={{ width: 380 + i * 160, height: 380 + i * 160 }}
            animate={{ rotate: i % 2 ? -360 : 360 }}
            transition={{ duration: 80 + i * 30, repeat: Infinity, ease: "linear" }}
          >
            <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brass" />
          </motion.div>
        ))}
        <Logo tone="dark" className="relative w-64" />
        <div className="relative">
          <p className="font-serif-display text-5xl leading-tight">The back office</p>
          <p className="mt-4 max-w-md text-lg text-stone-dark">Evaluations, consultations, success stories, reviews, the blog and every detail of the website, in one place.</p>
        </div>
        <p className="relative text-sm text-stone-dark">Staff only. Activity is recorded.</p>
      </div>

      <div className="grid place-items-center bg-paper px-4 py-16">
        <motion.form onSubmit={signIn} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <Logo className="mb-10 w-56 lg:hidden" />
          <p className="text-sm font-bold text-brass-ink">Staff sign-in</p>
          <h1 className="font-serif-display mt-2 text-5xl text-ink">Welcome back</h1>

          <button
            type="button"
            onClick={autoload}
            className="group mt-10 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-ink/20 bg-white text-base font-bold text-ink transition-colors hover:border-ink"
          >
            <Wand2 aria-hidden className="size-5 text-brass-ink transition-transform group-hover:rotate-12" /> Autoload my details
          </button>
          <div className="my-6 flex items-center gap-4 text-sm text-stone">
            <span className="h-px flex-1 bg-line" /> or sign in <span className="h-px flex-1 bg-line" />
          </div>

          <label htmlFor="a-email" className="block text-sm font-bold text-ink">
            Email
          </label>
          <input id="a-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-line bg-white px-4 outline-none focus:border-ink" />
          <label htmlFor="a-pass" className="mt-5 block text-sm font-bold text-ink">
            Password
          </label>
          <input id="a-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-line bg-white px-4 outline-none focus:border-ink" />
          <AnimatePresence>
            {(error || info) && (
              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} role={error ? "alert" : "status"} className={cn("mt-4 text-sm font-bold", error ? "text-danger" : "text-success")}>
                {error || info}
              </motion.p>
            )}
          </AnimatePresence>
          <button type="submit" disabled={busy} className="mt-8 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink font-bold text-paper transition-colors hover:bg-ink-raised disabled:opacity-60">
            {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <KeyRound aria-hidden className="size-4" />} Sign in
          </button>
          <div className="mt-4 flex justify-between">
            <button type="button" onClick={reset} className="min-h-11 text-sm font-bold text-stone hover:text-ink">
              Forgot password?
            </button>
            <Link href="/" className="inline-flex min-h-11 items-center text-sm font-bold text-stone hover:text-ink">
              Back to website
            </Link>
          </div>
        </motion.form>
      </div>
    </div>
  );
}

function NotStaff({ user }: { user: User }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-4 text-center">
      <div className="max-w-md">
        <ShieldAlert aria-hidden className="mx-auto size-10 text-brass-ink" />
        <h1 className="font-serif-display mt-6 text-3xl text-ink">Access not yet granted</h1>
        <p className="mt-3 text-stone">You are signed in as {user.email}, but this account is not on the staff list. Ask an owner to add it.</p>
        <button type="button" onClick={() => signOut(auth())} className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-6 font-bold text-paper">
          <LogOut aria-hidden className="size-4" /> Sign out
        </button>
      </div>
    </div>
  );
}

/* ---------- shell ---------- */

const SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, group: "Dashboard" },
  { id: "evaluations", label: "Free evaluations", icon: ClipboardCheck, group: "Requests" },
  { id: "bookings", label: "Consultations", icon: CalendarClock, group: "Requests" },
  { id: "messages", label: "Messages", icon: Mail, group: "Requests" },
  { id: "cases", label: "Success stories", icon: FileBadge, group: "Website" },
  { id: "reviews", label: "Reviews", icon: Star, group: "Website" },
  { id: "posts", label: "Blog", icon: BookOpen, group: "Website" },
  { id: "attorneys", label: "Attorneys", icon: UserSquare2, group: "Website" },
  { id: "settings", label: "Website details", icon: Settings, group: "Website" },
  { id: "publishing", label: "Publishing", icon: Rocket, group: "System" },
  { id: "staff", label: "Staff", icon: Users, group: "System" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const initialSection = (): SectionId => {
  if (typeof window === "undefined") return "overview";
  const h = window.location.hash.slice(1) as SectionId;
  return SECTIONS.some((s) => s.id === h) ? h : "overview";
};

function Shell({ user, staff }: { user: User; staff: StaffDoc }) {
  const [section, setSection] = useState<SectionId>(initialSection);
  const [nav, setNav] = useState(false);
  const [today] = useState(() => new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));
  const evaluations = useCollection("evaluations");
  const bookings = useCollection("bookings");
  const messages = useCollection("messages");
  const cases = useCollection("cases", "year");
  const reviews = useCollection("reviews", "date");
  const posts = useCollection("posts", "published");
  const attorneys = useCollection("attorneys", "order");
  const staffRows = useCollection("staff", "email");

  const go = (id: string) => {
    setSection(id as SectionId);
    setNav(false);
    history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0 });
  };

  const badge: Partial<Record<SectionId, number>> = {
    evaluations: evaluations.rows?.filter((r) => r.status === "new").length,
    bookings: bookings.rows?.filter((r) => r.status === "new").length,
    messages: messages.rows?.filter((r) => r.status === "new").length,
  };

  const sidebar = (
    <nav aria-label="Back office" className="flex h-full flex-col">
      <div className="px-6 pb-6 pt-7">
        <Logo tone="dark" className="w-44" />
      </div>
      <div className="flex-1 overflow-y-auto px-3">
        {["Dashboard", "Requests", "Website", "System"].map((g) => (
          <div key={g} className="mb-5">
            <p className="px-3 pb-2 text-xs font-bold text-stone-dark">{g}</p>
            <ul className="grid gap-0.5">
              {SECTIONS.filter((s) => s.group === g).map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => go(s.id)}
                    aria-current={section === s.id ? "page" : undefined}
                    className={cn("relative flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold transition-colors", section === s.id ? "text-ink" : "text-stone-dark hover:bg-ink-raised hover:text-paper")}
                  >
                    {section === s.id && <motion.span layoutId="side-active" className="absolute inset-0 rounded-xl bg-brass" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                    <s.icon aria-hidden className="relative size-[18px]" />
                    <span className="relative flex-1 text-left">{s.label}</span>
                    {!!badge[s.id] && <span className={cn("relative rounded-full px-2 py-0.5 text-xs", section === s.id ? "bg-ink text-paper" : "bg-brass text-ink")}>{badge[s.id]}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line-dark p-4">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="grid size-9 place-items-center rounded-full bg-brass text-sm font-bold text-ink">{(staff.name || user.email || "?").slice(0, 1).toUpperCase()}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-paper">{staff.name || "Staff"}</span>
            <span className="block truncate text-xs capitalize text-stone-dark">{staff.role}</span>
          </span>
          <button type="button" onClick={() => signOut(auth())} aria-label="Sign out" className="grid size-10 place-items-center rounded-full text-stone-dark hover:bg-ink-raised hover:text-paper">
            <LogOut aria-hidden className="size-4" />
          </button>
        </div>
        <Link href="/" target="_blank" className="mt-1 flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-stone-dark hover:bg-ink-raised hover:text-paper">
          <ExternalLink aria-hidden className="size-4" /> View website
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-mist">
      <aside className="on-dark fixed inset-y-0 left-0 z-40 hidden w-72 bg-ink lg:block">{sidebar}</aside>
      <AnimatePresence>
        {nav && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.button type="button" aria-label="Close menu" className="absolute inset-0 bg-ink/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setNav(false)} />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 300, damping: 34 }} className="on-dark absolute inset-y-0 left-0 w-72 bg-ink">
              {sidebar}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-paper/90 px-4 backdrop-blur-xl sm:px-8">
          <button type="button" className="grid size-11 place-items-center rounded-full hover:bg-mist lg:hidden" aria-label="Open menu" onClick={() => setNav(true)}>
            {nav ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <Gauge aria-hidden className="hidden size-5 text-brass-ink sm:block" />
          <p className="font-bold text-ink">{SECTIONS.find((s) => s.id === section)?.label}</p>
          <p className="ml-auto hidden text-sm text-stone sm:block" suppressHydrationWarning>
            {today}
          </p>
        </header>
        <main className="px-4 py-8 sm:px-8">
          <AnimatePresence mode="wait">
            <motion.div key={section} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
              {section === "overview" && <Overview evaluations={evaluations.rows} bookings={bookings.rows} messages={messages.rows} go={go} />}
              {section === "evaluations" && <Requests cfg={EVALUATIONS} rows={evaluations.rows} uid={user.uid} />}
              {section === "bookings" && <Requests cfg={BOOKINGS} rows={bookings.rows} uid={user.uid} />}
              {section === "messages" && <Requests cfg={MESSAGES} rows={messages.rows} uid={user.uid} />}
              {section === "cases" && <ContentManager kind="cases" rows={cases.rows} uid={user.uid} />}
              {section === "reviews" && <ContentManager kind="reviews" rows={reviews.rows} uid={user.uid} />}
              {section === "posts" && <ContentManager kind="posts" rows={posts.rows} uid={user.uid} />}
              {section === "attorneys" && <ContentManager kind="attorneys" rows={attorneys.rows} uid={user.uid} />}
              {section === "settings" && <SiteSettings uid={user.uid} />}
              {section === "publishing" && <Publishing />}
              {section === "staff" && <Staff rows={staffRows.rows} uid={user.uid} role={staff.role} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
