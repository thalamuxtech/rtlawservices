"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen, CalendarClock, ClipboardCheck, ExternalLink, Eye, EyeOff, FileBadge, FileText, FolderOpen, Gauge, Globe2, Inbox as InboxIcon, KeyRound, LayoutDashboard, Loader2, Lock, LogOut, Mail, Menu, MessagesSquare, PanelLeftClose, PanelLeftOpen, Rocket, Send, Settings, ShieldAlert, Star, Users, UserSquare2, X,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { GuillocheRosette, GuillocheWeave } from "@/components/brand/Guilloche";
import { LoginArt } from "./LoginArt";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ToastProvider, useCollection, useDialog, useToast } from "./kit";
import { Overview } from "./sections/Overview";
import { BOOKINGS, EVALUATIONS, MESSAGES, Requests } from "./sections/Requests";
import { ContentManager } from "./sections/Content";
import { Emails } from "./sections/Emails";
import { Inbox } from "./sections/Inbox";
import { Publishing, SiteSettings, Staff } from "./sections/Settings";
import { PagesEditor } from "./sections/Pages";
import { Documents } from "./sections/Documents";
import { INBOX_MAILBOX } from "@/lib/email-template";

type StaffDoc = { role: string; name?: string; email?: string };
type User = { uid: string; email: string };
type Session = { user: User; staff: StaffDoc } | { user: null; email: string | null };

async function readSession(): Promise<Session> {
  const r = await api<{ staff: (StaffDoc & User) | null; email?: string | null }>("/api/auth/me");
  return r.staff ? { user: { uid: r.staff.uid, email: r.staff.email }, staff: r.staff } : { user: null, email: r.email ?? null };
}

export async function signOut() {
  await api("/api/auth/logout", { method: "POST" }).catch(() => {});
  location.reload();
}

/** The token in a set-password link (/admin/#reset=...), if this visit came from one. */
const resetToken = () => (typeof window !== "undefined" && window.location.hash.startsWith("#reset=") ? window.location.hash.slice(7) : "");

export function AdminApp() {
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [token, setToken] = useState(resetToken);
  const refresh = useCallback(
    () =>
      readSession()
        .then(setSession)
        .catch(() => setSession({ user: null, email: null })),
    [],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (token)
    return (
      <SetPassword
        token={token}
        done={() => {
          history.replaceState(null, "", "/admin/");
          setToken("");
          refresh();
        }}
      />
    );
  if (session === undefined) {
    return (
      <div className="grid min-h-dvh place-items-center bg-ink">
        <Logo tone="dark" variant="mark" className="w-24" />
      </div>
    );
  }
  if (!session.user) return session.email ? <NotStaff email={session.email} /> : <Login onSignedIn={refresh} />;
  return (
    <ToastProvider>
      <Shell user={session.user} staff={session.staff} onProfileChange={refresh} />
    </ToastProvider>
  );
}

/* ---------- sign-in ---------- */

// The portal email is not secret, so it is pre-filled. Passwords are never
// stored by the site; the browser's own password manager can offer them.
const DEFAULT_EMAIL = "admin@rtlawservices.com";

// Earlier versions kept the password in this browser storage key for an
// Autoload button. Remove any copy still there.
try {
  if (typeof window !== "undefined") localStorage.removeItem("rt-admin-login");
} catch {}

function Login({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState(() => {
    try {
      return (typeof window !== "undefined" && localStorage.getItem("rt-admin-email")) || DEFAULT_EMAIL;
    } catch {
      return DEFAULT_EMAIL;
    }
  });
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const signIn = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const em = email.trim();
    const pw = password;
    if (!em || !pw) return setError("Enter your email and password.");
    setBusy(true);
    setError("");
    try {
      await api("/api/auth/login", { method: "POST", json: { email: em, password: pw } });
      try {
        localStorage.setItem("rt-admin-email", em);
      } catch {}
      onSignedIn();
    } catch (e) {
      setError((e as Error).message || "Sign-in failed. Check your email and password.");
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!email.trim()) return setError("Enter your email first, then choose reset.");
    try {
      await api("/api/auth/reset-request", { method: "POST", json: { email: email.trim() } });
      setInfo("If an account exists for that email, a reset link is on its way.");
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_0.9fr]">
      <div className="on-dark relative hidden overflow-hidden bg-ink p-14 text-paper lg:flex lg:flex-col lg:items-center lg:justify-between lg:text-center">
        <div aria-hidden className="grain absolute inset-0" />
        <GuillocheRosette className="pointer-events-none absolute -left-48 -top-48 size-[38rem] text-brass opacity-[0.13]" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 text-brass [mask-image:linear-gradient(to_top,black,transparent)]">
          <GuillocheWeave className="size-full opacity-60" />
        </div>
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
        <div className="relative flex flex-col items-center">
          <LoginArt />
          <p className="mt-8 text-sm font-bold text-brass-light xl:mt-10">Staff portal</p>
          <p className="font-serif-display mt-2 text-4xl leading-tight xl:text-5xl">Client matters, managed with care</p>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-stone-dark">
            Review free evaluations, confirm consultations and reply to client messages. Approve success stories, reviews and
            articles before they appear on the website.
          </p>
          <ul className="mt-8 grid max-w-lg gap-3 text-left [@media(max-height:860px)]:hidden text-[0.97rem] text-paper/90">
            {[
              { icon: ClipboardCheck, text: "Free evaluations and consultation requests" },
              { icon: MessagesSquare, text: "Client messages and follow-up" },
              { icon: Globe2, text: "Website content and publishing" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line-dark text-brass-light">
                  <Icon aria-hidden className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative flex items-center justify-center gap-2 text-sm text-stone-dark">
          <Lock aria-hidden className="size-4 text-brass-light" />
          Authorized staff only. Client information in this portal is confidential.
        </p>
      </div>

      <div className="relative grid place-items-center overflow-hidden bg-paper px-4 py-16">
        <GuillocheRosette className="pointer-events-none absolute -bottom-52 -right-52 size-[32rem] text-brass opacity-[0.1]" />
        <motion.form onSubmit={signIn} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative w-full max-w-md">
          <Logo className="mb-10 w-56 lg:hidden" />
          <p className="text-sm font-bold text-brass-ink">Staff sign-in</p>
          <h1 className="font-serif-display mt-2 text-5xl text-ink">Welcome back</h1>
          <span aria-hidden className="mt-4 flex items-center gap-1.5">
            <span className="h-px w-14 bg-gradient-to-r from-brass to-brass/20" />
            <span className="size-1.5 rotate-45 bg-brass" />
          </span>

          <label htmlFor="a-email" className="mt-10 block text-sm font-bold text-ink">
            Email
          </label>
          <input id="a-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-line bg-white px-4 outline-none focus:border-ink" />
          <label htmlFor="a-pass" className="mt-5 block text-sm font-bold text-ink">
            Password
          </label>
          <div className="relative mt-2">
            <input
              id="a-pass"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-line bg-white pl-4 pr-14 outline-none focus:border-ink"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              aria-pressed={showPw}
              className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-stone transition-colors hover:text-ink"
            >
              {showPw ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
            </button>
          </div>
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

function NotStaff({ email }: { email: string }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-4 text-center">
      <div className="max-w-md">
        <ShieldAlert aria-hidden className="mx-auto size-10 text-brass-ink" />
        <h1 className="font-serif-display mt-6 text-3xl text-ink">Access not yet granted</h1>
        <p className="mt-3 text-stone">You are signed in as {email}, but this account is not on the staff list. Ask an owner to add it.</p>
        <button type="button" onClick={signOut} className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-6 font-bold text-paper">
          <LogOut aria-hidden className="size-4" /> Sign out
        </button>
      </div>
    </div>
  );
}

/** Reached from a set-password link in an email or from an owner. */
function SetPassword({ token, done }: { token: string; done: () => void }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 10) return setError("Use at least 10 characters.");
    if (pw !== pw2) return setError("The two passwords do not match.");
    setBusy(true);
    setError("");
    try {
      await api("/api/auth/reset", { method: "POST", json: { token, password: pw } });
      done();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-4 py-16">
      <form onSubmit={submit} className="w-full max-w-md">
        <Logo className="mb-10 w-56" />
        <p className="text-sm font-bold text-brass-ink">Staff portal</p>
        <h1 className="font-serif-display mt-2 text-5xl text-ink">Set your password</h1>
        <p className="mt-4 text-stone">Choose a password of at least 10 characters. You will be signed in straight after.</p>
        <label htmlFor="n-pass" className="mt-8 block text-sm font-bold text-ink">
          New password
        </label>
        <input id="n-pass" type={show ? "text" : "password"} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-line bg-white px-4 outline-none focus:border-ink" />
        <label htmlFor="n-pass2" className="mt-5 block text-sm font-bold text-ink">
          Repeat the password
        </label>
        <input id="n-pass2" type={show ? "text" : "password"} autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-line bg-white px-4 outline-none focus:border-ink" />
        <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 text-sm text-stone">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="size-5 accent-ink" />
          Show passwords
        </label>
        {error && (
          <p role="alert" className="mt-4 text-sm font-bold text-danger">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="mt-8 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink font-bold text-paper transition-colors hover:bg-ink-raised disabled:opacity-60">
          {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <KeyRound aria-hidden className="size-4" />} Save password
        </button>
      </form>
    </div>
  );
}

/* ---------- shell ---------- */

const SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, group: "Dashboard" },
  { id: "inbox", label: "Inbox", icon: InboxIcon, group: "Requests" },
  { id: "evaluations", label: "Free evaluations", icon: ClipboardCheck, group: "Requests" },
  { id: "bookings", label: "Consultations", icon: CalendarClock, group: "Requests" },
  { id: "messages", label: "Messages", icon: Mail, group: "Requests" },
  { id: "emails", label: "Emails", icon: Send, group: "Requests" },
  { id: "documents", label: "Documents", icon: FolderOpen, group: "Requests" },
  { id: "cases", label: "Success stories", icon: FileBadge, group: "Website" },
  { id: "reviews", label: "Reviews", icon: Star, group: "Website" },
  { id: "posts", label: "Blog", icon: BookOpen, group: "Website" },
  { id: "attorneys", label: "Attorneys", icon: UserSquare2, group: "Website" },
  { id: "pages", label: "Page text", icon: FileText, group: "Website" },
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

function Shell({ user, staff, onProfileChange }: { user: User; staff: StaffDoc; onProfileChange: () => void }) {
  const dialog = useDialog();
  const toast = useToast();
  // Staff choose the name shown here, as "sent by" on emails and as the default email sign-off.
  const rename = async () => {
    const name = await dialog.prompt({
      title: "Your name",
      message: "Shown in the portal, as the sender on emails you send, and as the default sign-off in the email composer.",
      confirmLabel: "Save name",
      input: { label: "Name", value: staff.name ?? "", required: "Enter a name." },
    });
    if (!name || name === staff.name) return;
    try {
      await api("/api/auth/profile", { method: "POST", json: { name } });
      toast("ok", "Name saved");
      onProfileChange();
    } catch (e) {
      toast("error", (e as Error).message);
    }
  };
  const [section, setSection] = useState<SectionId>(initialSection);
  const [nav, setNav] = useState(false);
  // The desktop sidebar can shrink to an icon rail. The choice is remembered per browser.
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("rt-admin-collapsed") === "1";
    } catch {
      return false;
    }
  });
  const toggleCollapsed = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem("rt-admin-collapsed", c ? "0" : "1");
      } catch {}
      return !c;
    });
  const [today] = useState(() => new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));
  const evaluations = useCollection("evaluations");
  const bookings = useCollection("bookings");
  const messages = useCollection("messages");
  const emails = useCollection("emails");
  const inbox = useCollection("inbox");
  const infoInbox = inbox.rows ? inbox.rows.filter((r) => r.mailbox === INBOX_MAILBOX) : null;
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
    inbox: infoInbox?.filter((r) => r.status === "new").length,
  };

  // The brand's engraved pattern behind the dark sidebar, with a gold edge.
  const sidebarArt = (
    <>
      <GuillocheRosette className="pointer-events-none absolute -bottom-40 -left-44 size-[28rem] text-brass opacity-[0.11]" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-28 text-brass [mask-image:linear-gradient(to_bottom,black,transparent)]">
        <GuillocheWeave className="size-full opacity-40" />
      </div>
      <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-brass/10 via-brass/60 to-brass/10" />
    </>
  );

  const sidebar = (compact: boolean) => (
    <nav aria-label="Back office" className="relative flex h-full flex-col">
      <div className={cn("pb-6 pt-7", compact ? "flex justify-center px-2" : "px-6")}>
        {compact ? <Logo tone="dark" variant="mark" className="w-11" /> : <Logo tone="dark" className="w-44" />}
      </div>
      <div className={cn("flex-1 overflow-y-auto overflow-x-hidden", compact ? "px-2" : "px-3")}>
        {["Dashboard", "Requests", "Website", "System"].map((g) => (
          <div key={g} className="mb-5">
            {compact ? <span aria-hidden className="mx-auto mb-2 block h-px w-8 bg-line-dark" /> : <p className="px-3 pb-2 text-xs font-bold text-stone-dark">{g}</p>}
            <ul className="grid gap-0.5">
              {SECTIONS.filter((s) => s.group === g).map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => go(s.id)}
                    aria-current={section === s.id ? "page" : undefined}
                    aria-label={compact ? `${s.label}${badge[s.id] ? `, ${badge[s.id]} new` : ""}` : undefined}
                    title={compact ? s.label : undefined}
                    className={cn(
                      "relative flex min-h-11 w-full items-center gap-3 rounded-xl text-sm font-bold transition-colors",
                      compact ? "justify-center" : "px-3",
                      section === s.id ? "text-ink" : "text-stone-dark hover:bg-paper hover:text-ink",
                    )}
                  >
                    {section === s.id && <motion.span layoutId={compact ? "side-active-rail" : "side-active"} className="absolute inset-0 rounded-xl bg-brass" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                    <s.icon aria-hidden className="relative size-[18px]" />
                    {!compact && <span className="relative flex-1 text-left">{s.label}</span>}
                    {!!badge[s.id] &&
                      (compact ? (
                        <span aria-hidden className={cn("absolute right-2 top-2 size-2 rounded-full", section === s.id ? "bg-ink" : "bg-brass")} />
                      ) : (
                        <span className={cn("relative rounded-full px-2 py-0.5 text-xs", section === s.id ? "bg-ink text-paper" : "bg-brass text-ink")}>{badge[s.id]}</span>
                      ))}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className={cn("border-t border-line-dark", compact ? "grid justify-items-center gap-1 px-2 py-4" : "p-4")}>
        <div className={cn("flex items-center rounded-xl", compact ? "flex-col gap-1" : "gap-3 px-2 py-2")}>
          <button
            type="button"
            onClick={rename}
            title={compact ? `${staff.name || "Staff"}, ${staff.role}. Change your name` : "Change your name"}
            aria-label={`${staff.name || "Staff"}, ${staff.role}. Change your name`}
            className={cn("flex min-w-0 items-center gap-3 rounded-xl text-left transition-colors hover:bg-paper/10", compact ? "" : "flex-1 py-1 pr-2")}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brass text-sm font-bold text-ink">
              {(staff.name || user.email || "?").slice(0, 1).toUpperCase()}
            </span>
            {!compact && (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-paper">{staff.name || "Staff"}</span>
                <span className="block truncate text-xs capitalize text-stone-dark">{staff.role}</span>
              </span>
            )}
          </button>
          <button type="button" onClick={signOut} aria-label="Sign out" title="Sign out" className="grid size-11 place-items-center rounded-full text-stone-dark transition-colors hover:bg-paper hover:text-ink">
            <LogOut aria-hidden className="size-4" />
          </button>
        </div>
        <Link
          href="/"
          target="_blank"
          aria-label={compact ? "View website" : undefined}
          title={compact ? "View website" : undefined}
          className={cn("mt-1 flex min-h-11 items-center gap-2 rounded-xl text-sm font-bold text-stone-dark transition-colors hover:bg-paper hover:text-ink", compact ? "w-11 justify-center" : "px-3")}
        >
          <ExternalLink aria-hidden className="size-4" /> {!compact && "View website"}
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-mist">
      <aside className={cn("on-dark fixed inset-y-0 left-0 z-40 hidden bg-ink transition-[width] duration-300 ease-out lg:block overflow-hidden", collapsed ? "w-20" : "w-72")}>
        {sidebarArt}
        {sidebar(collapsed)}
      </aside>
      <AnimatePresence>
        {nav && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.button type="button" aria-label="Close menu" className="absolute inset-0 bg-ink/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setNav(false)} />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 300, damping: 34 }} className="on-dark absolute inset-y-0 left-0 w-72 overflow-hidden bg-ink">
              {sidebarArt}
              {sidebar(false)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className={cn("transition-[padding] duration-300 ease-out", collapsed ? "lg:pl-20" : "lg:pl-72")}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-paper/90 px-4 backdrop-blur-xl sm:px-8">
          <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-brass/0 via-brass/70 to-brass/0" />
          <button type="button" className="grid size-11 place-items-center rounded-full hover:bg-mist lg:hidden" aria-label="Open menu" onClick={() => setNav(true)}>
            {nav ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden size-11 place-items-center rounded-full text-ink transition-colors duration-300 hover:bg-ink hover:text-paper lg:grid"
          >
            {collapsed ? <PanelLeftOpen aria-hidden className="size-5" /> : <PanelLeftClose aria-hidden className="size-5" />}
          </button>
          <Gauge aria-hidden className="hidden size-5 text-brass-ink sm:block" />
          <p className="font-bold text-ink">{SECTIONS.find((s) => s.id === section)?.label}</p>
          <p className="ml-auto hidden text-sm text-stone sm:block" suppressHydrationWarning>
            {today}
          </p>
        </header>
        <main className="px-4 py-8 sm:px-8">
          {[evaluations, bookings, messages, cases, reviews, posts, attorneys, staffRows].some((c) => c.error) && (
            <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger/30 bg-danger/5 px-5 py-4 text-sm">
              <span className="font-bold text-danger">Some records could not be loaded. Check your connection, or ask an owner to confirm your access.</span>
              <button type="button" onClick={() => location.reload()} className="min-h-11 rounded-full border border-danger/30 bg-white px-4 font-bold text-danger hover:bg-danger hover:text-white">
                Try again
              </button>
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div key={section} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
              {section === "overview" && (
                <Overview
                  evaluations={evaluations.rows}
                  bookings={bookings.rows}
                  messages={messages.rows}
                  content={{ cases: cases.rows, reviews: reviews.rows, posts: posts.rows, attorneys: attorneys.rows }}
                  name={staff.name || user.email || ""}
                  go={go}
                />
              )}
              {section === "evaluations" && <Requests cfg={EVALUATIONS} rows={evaluations.rows} role={staff.role} />}
              {section === "bookings" && <Requests cfg={BOOKINGS} rows={bookings.rows} role={staff.role} />}
              {section === "messages" && <Requests cfg={MESSAGES} rows={messages.rows} role={staff.role} />}
              {section === "emails" && <Emails rows={emails.rows} />}
              {section === "documents" && <Documents />}
              {section === "inbox" && <Inbox rows={infoInbox} role={staff.role} />}
              {section === "cases" && <ContentManager kind="cases" rows={cases.rows} />}
              {section === "reviews" && <ContentManager kind="reviews" rows={reviews.rows} />}
              {section === "posts" && <ContentManager kind="posts" rows={posts.rows} />}
              {section === "attorneys" && <ContentManager kind="attorneys" rows={attorneys.rows} />}
              {section === "pages" && <PagesEditor />}
              {section === "settings" && <SiteSettings />}
              {section === "publishing" && <Publishing />}
              {section === "staff" && <Staff rows={staffRows.rows} uid={user.uid} role={staff.role} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
