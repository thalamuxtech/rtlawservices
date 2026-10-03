"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { ChevronDown, Menu, Phone, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/primitives";
import { EXPERTISE_ICONS } from "@/components/ui/icons";
import { byTrack } from "@/content/expertise";
import { CTA, NAV, SITE, type NavGroup } from "@/content/site";
import { cn } from "@/lib/utils";

const individuals = byTrack("individuals");
const professionals = byTrack("professionals");
const ease = [0.22, 1, 0.36, 1] as const;

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  // Menus are keyed to the route they were opened on, so navigating closes them.
  const [openFor, setOpenFor] = useState<{ path: string; menu: string } | null>(null);
  const open = openFor?.path === pathname ? openFor.menu : null;
  const setOpen = (menu: string | null) => setOpenFor(menu ? { path: pathname, menu } : null);
  const timer = useRef<number | undefined>(undefined);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open === "mobile" ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenFor(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const enter = (menu: string) => {
    window.clearTimeout(timer.current);
    setOpen(menu);
  };
  const leave = () => {
    timer.current = window.setTimeout(() => setOpenFor(null), 180);
  };

  const active = (href?: string) => !!href && href !== "/" && pathname.startsWith(href.replace(/\/$/, ""));
  const groupActive = (g: NavGroup) => active(g.href) || !!g.links?.some((l) => active(l.href));

  return (
    <header className="sticky top-0 z-40">
      <div className="hidden bg-ink text-[0.8rem] text-stone-dark md:block">
        <div className="container-luxe flex h-9 items-center justify-between">
          <p>{SITE.announcement || "Based in Maryland. Serving clients across the United States and abroad."}</p>
          <div className="flex items-center gap-6">
            <span>Mon to Fri 9:00 AM to 5:00 PM ET</span>
            <a href={SITE.phoneHref} className="flex items-center gap-1.5 text-brass-light transition-colors hover:text-paper">
              <Phone aria-hidden className="size-3.5" /> {SITE.phone}
            </a>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "border-b transition-all duration-500 ease-[var(--ease-luxe)]",
          scrolled ? "border-line bg-paper/90 shadow-[0_10px_40px_-24px_rgba(20,24,31,0.35)] backdrop-blur-xl" : "border-transparent bg-paper",
        )}
      >
        <div className={cn("container-luxe flex items-center justify-between gap-4 transition-[height] duration-500", scrolled ? "h-16" : "h-20")}>
          <Link href="/" aria-label="RT Law Services, home" className="shrink-0">
            <Logo className={cn("transition-[width] duration-500", scrolled ? "w-[188px] xl:w-[190px]" : "w-[200px] xl:w-[206px] 2xl:w-[236px]")} />
          </Link>

          <nav aria-label="Main" className="hidden items-center xl:flex">
            {NAV.map((g) => {
              if (g.label === "Expertise") {
                return (
                  <div key={g.label} className="relative" onMouseEnter={() => enter("expertise")} onMouseLeave={leave}>
                    <TopButton label={g.label} open={open === "expertise"} current={groupActive(g)} onClick={() => setOpen(open === "expertise" ? null : "expertise")} controls="menu-expertise" />
                    <Dropdown id="menu-expertise" show={open === "expertise"} wide>
                      <div className="grid grid-cols-2">
                        <MegaColumn title="Individuals and families" items={individuals} />
                        <MegaColumn title="Professionals and employers" items={professionals} dark />
                      </div>
                      <div className="flex items-center justify-between border-t border-line bg-mist px-7 py-4 text-sm">
                        <span className="text-stone">Not sure where you fit? Answer three questions.</span>
                        <Link href="/start-here/#path-finder" className="inline-flex min-h-11 items-center font-bold text-brass-ink hover:text-ink">
                          Find my path
                        </Link>
                      </div>
                    </Dropdown>
                  </div>
                );
              }
              if (g.links) {
                const id = `menu-${g.label.toLowerCase().replace(/\s+/g, "-")}`;
                return (
                  <div key={g.label} className="relative" onMouseEnter={() => enter(g.label)} onMouseLeave={leave}>
                    <TopButton label={g.label} open={open === g.label} current={groupActive(g)} onClick={() => setOpen(open === g.label ? null : g.label)} controls={id} />
                    <Dropdown id={id} show={open === g.label}>
                      <ul className="grid p-3">
                        {g.links.map((l) => (
                          <li key={l.href}>
                            <Link href={l.href} className={cn("block rounded-xl px-4 py-3 transition-colors hover:bg-mist", active(l.href) && "bg-mist")}>
                              <span className="block font-bold text-ink">{l.label}</span>
                              {l.description && <span className="mt-0.5 block text-sm text-stone">{l.description}</span>}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </Dropdown>
                  </div>
                );
              }
              return (
                <Link
                  key={g.label}
                  href={g.href!}
                  className={cn(
                    "relative flex min-h-11 items-center whitespace-nowrap rounded-full px-3 text-[0.92rem] font-bold transition-colors",
                    groupActive(g) ? "text-ink" : "text-stone hover:text-ink",
                  )}
                >
                  {g.label}
                  {groupActive(g) && <motion.span layoutId="nav-dot" className="absolute bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-brass" />}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ButtonLink href={CTA.consultation.href} variant="outline" className="hidden whitespace-nowrap px-5 lg:inline-flex xl:hidden 2xl:inline-flex">
              {CTA.consultation.label}
            </ButtonLink>
            <ButtonLink href={CTA.evaluation.href} className="hidden whitespace-nowrap px-5 sm:inline-flex">
              {CTA.evaluation.label}
            </ButtonLink>
            <button
              type="button"
              className="grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-mist xl:hidden"
              aria-label={open === "mobile" ? "Close menu" : "Open menu"}
              aria-expanded={open === "mobile"}
              onClick={() => setOpen(open === "mobile" ? null : "mobile")}
            >
              {open === "mobile" ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>
        <motion.div aria-hidden style={{ scaleX: progress }} className="h-[2px] origin-left bg-brass" />
      </div>

      <AnimatePresence>{open === "mobile" && <MobileMenu onClose={() => setOpenFor(null)} />}</AnimatePresence>
    </header>
  );
}

function TopButton({ label, open, current, onClick, controls }: { label: string; open: boolean; current: boolean; onClick: () => void; controls: string }) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={controls}
      onClick={onClick}
      className={cn("flex min-h-11 items-center gap-1 whitespace-nowrap rounded-full px-3 text-[0.92rem] font-bold transition-colors", current || open ? "text-ink" : "text-stone hover:text-ink")}
    >
      {label}
      <ChevronDown aria-hidden className={cn("size-4 transition-transform duration-300", open && "rotate-180")} />
    </button>
  );
}

function Dropdown({ id, show, wide, children }: { id: string; show: boolean; wide?: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          id={id}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ duration: 0.25, ease }}
          className={cn(
            "absolute top-full z-50 mt-3 origin-top overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_40px_80px_-30px_rgba(20,24,31,0.45)]",
            wide ? "left-1/2 w-[min(880px,92vw)] -translate-x-1/2" : "left-0 w-80",
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MegaColumn({ title, items, dark }: { title: string; items: ReturnType<typeof byTrack>; dark?: boolean }) {
  return (
    <div className={cn("p-7", dark && "on-dark bg-ink")}>
      <p className={cn("eyebrow mb-4", dark ? "text-brass-light" : "text-brass-ink")}>{title}</p>
      <ul className="grid gap-1">
        {items.map((e) => {
          const Icon = EXPERTISE_ICONS[e.icon];
          return (
            <li key={e.slug}>
              <Link href={`/expertise/${e.slug}/`} className={cn("group flex items-start gap-3 rounded-xl p-2.5 transition-colors", dark ? "hover:bg-ink-raised" : "hover:bg-mist")}>
                <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border", dark ? "border-line-dark text-brass-light" : "border-line text-brass-ink")}>
                  <Icon aria-hidden className="size-4" />
                </span>
                <span>
                  <span className={cn("block font-bold", dark ? "text-paper" : "text-ink")}>{e.title}</span>
                  <span className={cn("block text-[0.82rem] font-bold", dark ? "text-stone-dark" : "text-stone")}>{e.codes}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  const [section, setSection] = useState<string | null>(null);
  const groups: { label: string; href?: string; links?: { label: string; href: string }[] }[] = [
    { label: "Home", href: "/" },
    {
      label: "Expertise",
      links: [
        { label: "All areas of expertise", href: "/expertise/" },
        ...[...individuals, ...professionals].map((e) => ({ label: e.title, href: `/expertise/${e.slug}/` })),
      ],
    },
    ...NAV.filter((g) => g.label !== "Expertise").map((g) => ({ label: g.label, href: g.href, links: g.links })),
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="on-dark fixed inset-0 z-50 overflow-y-auto bg-ink text-paper xl:hidden"
    >
      <div className="container-luxe flex h-20 items-center justify-between">
        <Logo tone="dark" className="w-[210px]" />
        <button type="button" className="grid size-11 place-items-center rounded-full text-paper" aria-label="Close menu" onClick={onClose}>
          <X className="size-6" />
        </button>
      </div>
      <motion.nav
        aria-label="Mobile"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.06 } } }}
        className="container-luxe pb-36 pt-4"
      >
        {groups.map((g) => (
          <motion.div key={g.label} variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.45, ease }} className="border-b border-line-dark">
            {g.links ? (
              <>
                <button
                  type="button"
                  aria-expanded={section === g.label}
                  onClick={() => setSection(section === g.label ? null : g.label)}
                  className="flex min-h-16 w-full items-center justify-between font-serif-display text-3xl"
                >
                  {g.label}
                  <ChevronDown aria-hidden className={cn("size-6 text-brass-light transition-transform duration-300", section === g.label && "rotate-180")} />
                </button>
                <AnimatePresence initial={false}>
                  {section === g.label && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease }}
                      className="overflow-hidden"
                    >
                      {g.links.map((l) => (
                        <li key={l.href}>
                          <Link href={l.href} onClick={onClose} className="flex min-h-11 items-center pl-1 text-lg text-stone-dark transition-colors hover:text-paper">
                            {l.label}
                          </Link>
                        </li>
                      ))}
                      <li className="h-4" />
                    </motion.ul>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <Link href={g.href!} onClick={onClose} className="flex min-h-16 items-center font-serif-display text-3xl">
                {g.label}
              </Link>
            )}
          </motion.div>
        ))}
        <div className="mt-10 grid gap-3">
          <ButtonLink href={CTA.evaluation.href}>Request a free evaluation</ButtonLink>
          <ButtonLink href={CTA.consultation.href} variant="outline-light">
            Book a consultation
          </ButtonLink>
          <ButtonLink href={SITE.phoneHref} variant="outline-light">
            Call {SITE.phone}
          </ButtonLink>
        </div>
      </motion.nav>
    </motion.div>
  );
}
