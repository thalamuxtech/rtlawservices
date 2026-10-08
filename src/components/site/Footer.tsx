"use client";

import Link from "next/link";
import { Lock, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useContent } from "@/content/LiveContent";
import { NO_RELATIONSHIP } from "@/content/site";

export function Footer() {
  const { SITE, CASES, byTrack } = useContent();
  const year = new Date().getFullYear();
  const cols = [
    { title: "Individuals", links: byTrack("individuals").map((e) => ({ label: e.title, href: `/expertise/${e.slug}/` })) },
    { title: "Professionals", links: byTrack("professionals").map((e) => ({ label: e.title, href: `/expertise/${e.slug}/` })) },
    {
      title: "Firm",
      links: [
        { label: "About", href: "/about/" },
        { label: "Attorneys", href: "/attorneys/" },
        ...(CASES.length ? [{ label: "Success stories", href: "/case-results/" }] : []),
        { label: "Free evaluation", href: "/free-evaluation/" },
        { label: "Check eligibility", href: "/check-eligibility/" },
        { label: "Knowledge center", href: "/knowledge/" },
        { label: "Blog", href: "/blog/" },
        { label: "Client reviews", href: "/reviews/" },
        { label: "How we work", href: "/how-we-work/" },
        { label: "Diaspora clients", href: "/diaspora/" },
        { label: "FAQ", href: "/faq/" },
      ],
    },
  ];
  return (
    <footer className="on-dark relative overflow-hidden bg-ink pb-24 text-stone-dark sm:pb-0">
      <div aria-hidden className="grain pointer-events-none absolute inset-0 opacity-60" />
      <div className="container-luxe relative">
        <div className="grid gap-12 border-b border-line-dark py-16 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Logo tone="dark" className="w-[260px]" />
            <p className="mt-6 max-w-sm leading-relaxed">
              Immigration counsel from Maryland for families, professionals and employers across the United States.
            </p>
            <ul className="mt-8 grid gap-3 text-[0.95rem]">
              <li>
                <a href={SITE.phoneHref} className="inline-flex min-h-11 items-center gap-3 text-paper transition-colors hover:text-brass-light">
                  <Phone aria-hidden className="size-4 text-brass" /> {SITE.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${SITE.email}`} className="inline-flex min-h-11 items-center gap-3 text-paper transition-colors hover:text-brass-light">
                  <Mail aria-hidden className="size-4 text-brass" /> {SITE.email}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MapPin aria-hidden className="size-4 text-brass" /> {SITE.location}
              </li>
            </ul>
          </div>
          <div className="grid gap-10 sm:grid-cols-3">
            {cols.map((c) => (
              <div key={c.title}>
                <p className="eyebrow mb-4 text-brass-light">{c.title}</p>
                <ul className="grid">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="inline-flex min-h-11 items-center text-[0.95rem] transition-colors hover:text-paper">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 py-10 text-[0.85rem] leading-relaxed lg:grid-cols-[2fr_1fr]">
          <div className="space-y-3">
            <p>
              <strong className="text-paper">Attorney advertising.</strong> The information on this website is general
              information, not legal advice for any individual case. {NO_RELATIONSHIP} Prior results do not guarantee a
              similar outcome.
            </p>
            <p>
              Responsible attorney:{" "}
              {SITE.responsibleAttorney}. Office: {SITE.region}.
            </p>
          </div>
          <div className="flex flex-wrap items-start gap-x-6 gap-y-2 lg:justify-end">
            <Link href="/legal/disclaimer/" className="inline-flex min-h-11 items-center hover:text-paper">Disclaimer</Link>
            <Link href="/legal/privacy/" className="inline-flex min-h-11 items-center hover:text-paper">Privacy</Link>
            <Link href="/legal/terms/" className="inline-flex min-h-11 items-center hover:text-paper">Terms</Link>
            <Link href="/accessibility/" className="inline-flex min-h-11 items-center hover:text-paper">Accessibility</Link>
            <Link
              href="/admin/"
              aria-label="Staff sign-in"
              title="Staff sign-in"
              className="grid size-11 place-items-center rounded-full border border-line-dark text-stone-dark transition-colors hover:border-brass-light hover:text-brass-light"
            >
              <Lock aria-hidden className="size-4" />
            </Link>
            <p className="w-full lg:text-right">© {year} {SITE.name}</p>
            <p className="w-full lg:text-right">
              Powered by{" "}
              <a
                href="https://thalamux-tech.web.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-paper underline-offset-4 transition-colors hover:text-brass-light hover:underline"
              >
                Thalamux Tech
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
