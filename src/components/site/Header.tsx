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
import { NAV, SITE } from "@/content/site";
import { cn } from "@/lib/utils";

const individuals = byTrack("individuals");
const professionals = byTrack("professionals");

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  // Menus are keyed to the route they were opened on, so navigating closes them.
  const [mobileFor, setMobileFor] = useState<string | null>(null);
  const [megaFor, setMegaFor] = useState<string | null>(null);
  const mobile = mobileFor === pathname;
  const mega = megaFor === pathname;
  const setMobile = (v: boolean | ((p: boolean) => boolean)) =>
    setMobileFor((cur) => ((typeof v === "function" ? v(cur === pathname) : v) ? pathname : null));
  const setMega = (v: boolean | ((p: boolean) => boolean)) =>
    setMegaFor((cur) => ((typeof v === "function" ? v(cur === pathname) : v) ? pathname : null));
  const megaTimer = useRef<number | undefined>(undefined);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = mobile ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileFor(null);
        setMegaFor(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobile]);

  const openMega = () => {
    window.clearTimeout(megaTimer.current);
    setMega(true);
  };
  const closeMega = () => {
    megaTimer.current = window.setTimeout(() => setMega(false), 160);
  };

  const active = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40">
      <div className="hidden bg-ink text-[0.8rem] text-stone-dark md:block">
        <div className="container-luxe flex h-9 items-center justify-between">
          <p>Based in Maryland. Serving clients across the United States and abroad.</p>
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
        <div className={cn("container-luxe flex items-center justify-between gap-6 transition-[height] duration-500", scrolled ? "h-16" : "h-20")}>
          <Link href="/" aria-label="RT Law Services, home" className="shrink-0">
            <Logo className={cn("transition-[width] duration-500", scrolled ? "w-[168px]" : "w-[196px]")} />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 xl:flex">
            <div className="relative" onMouseEnter={openMega} onMouseLeave={closeMega}>
              <button
                type="button"
                aria-expanded={mega}
                aria-controls="mega-expertise"
                onClick={() => setMega((v) => !v)}
                className={cn(
                  "flex min-h-11 items-center gap-1 rounded-full px-3.5 text-[0.93rem] font-bold transition-colors",
                  active("/expertise") ? "text-ink" : "text-stone hover:text-ink",
                )}
              >
                Expertise
                <ChevronDown aria-hidden className={cn("size-4 transition-transform duration-300", mega && "rotate-180")} />
              </button>
              <AnimatePresence>
                {mega && (
                  <motion.div
                    id="mega-expertise"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-1/2 top-full z-50 mt-3 w-[min(880px,92vw)] -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_40px_80px_-30px_rgba(20,24,31,0.45)]"
                  >
                    <div className="grid grid-cols-2">
                      <MegaColumn title="Individuals and families" items={individuals} />
                      <MegaColumn title="Professionals and employers" items={professionals} dark />
                    </div>
                    <div className="flex items-center justify-between border-t border-line bg-mist px-7 py-4 text-sm">
                      <span className="text-stone">Not sure where you fit? Answer three questions.</span>
                      <Link href="/start-here/#path-finder" className="font-bold text-brass-ink hover:text-ink">
                        Find my path
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {NAV.slice(1).map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "relative flex min-h-11 items-center rounded-full px-3.5 text-[0.93rem] font-bold transition-colors",
                  active(n.href) ? "text-ink" : "text-stone hover:text-ink",
                )}
              >
                {n.label}
                {active(n.href) && (
                  <motion.span layoutId="nav-dot" className="absolute bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-brass" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ButtonLink href="/book/" className="hidden sm:inline-flex">
              Book a consultation
            </ButtonLink>
            <button
              type="button"
              className="grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-mist xl:hidden"
              aria-label={mobile ? "Close menu" : "Open menu"}
              aria-expanded={mobile}
              onClick={() => setMobile((v) => !v)}
            >
              {mobile ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>
        <motion.div aria-hidden style={{ scaleX: progress }} className="h-[2px] origin-left bg-brass" />
      </div>

      <AnimatePresence>
        {mobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="on-dark fixed inset-0 top-0 z-50 overflow-y-auto bg-ink text-paper xl:hidden"
          >
            <div className="container-luxe flex h-20 items-center justify-between">
              <Logo tone="dark" className="w-[180px]" />
              <button
                type="button"
                className="grid size-11 place-items-center rounded-full text-paper"
                aria-label="Close menu"
                onClick={() => setMobile(false)}
              >
                <X className="size-6" />
              </button>
            </div>
            <motion.nav
              aria-label="Mobile"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } } }}
              className="container-luxe pb-32 pt-6"
            >
              {[{ label: "Home", href: "/" }, ...NAV].map((n) => (
                <motion.div
                  key={n.href}
                  variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={n.href}
                    className="flex min-h-14 items-center justify-between border-b border-line-dark font-serif-display text-3xl"
                  >
                    {n.label}
                  </Link>
                </motion.div>
              ))}
              <div className="mt-10 grid gap-3">
                <ButtonLink href="/book/">
                  Book a consultation
                </ButtonLink>
                <ButtonLink href={SITE.phoneHref} variant="outline-light">
                  Call {SITE.phone}
                </ButtonLink>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
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
              <Link
                href={`/expertise/${e.slug}/`}
                className={cn(
                  "group flex items-start gap-3 rounded-xl p-2.5 transition-colors",
                  dark ? "hover:bg-ink-raised" : "hover:bg-mist",
                )}
              >
                <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border", dark ? "border-line-dark text-brass-light" : "border-line text-brass-ink")}>
                  <Icon aria-hidden className="size-4" />
                </span>
                <span>
                  <span className={cn("block font-bold", dark ? "text-paper" : "text-ink")}>{e.title}</span>
                  <span className={cn("block text-[0.82rem] font-bold ", dark ? "text-stone-dark" : "text-stone")}>{e.codes}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
