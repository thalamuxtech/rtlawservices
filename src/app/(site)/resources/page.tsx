import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/PageHero";
import { BookingBand } from "@/components/home/Sections";
import { Container } from "@/components/ui/primitives";
import { POSTS } from "@/content/live";

export const metadata: Metadata = {
  title: "Resources",
  description: "Guides, the current USCIS filing fees, and explainers on processing times, the Visa Bulletin and case status.",
};

const TOOLS = [
  { href: "/resources/filing-fees/", title: "Filing fees", text: "Current government fees for common forms, from the official USCIS fee schedule." },
  { href: "/resources/processing-times/", title: "Processing times", text: "How to read official processing times and what affects them." },
  { href: "/resources/visa-bulletin/", title: "The Visa Bulletin", text: "What the monthly bulletin shows and how to find your place in line." },
  { href: "/resources/case-status/", title: "Case status", text: "How to check a USCIS case and understand the result." },
];

const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        title="Guides and tools, written for clarity"
        lede="General information to help you understand the process. For advice on your own situation, book a consultation."
        crumbs={[{ label: "Resources" }]}
      />
      <section className="py-20">
        <Container className="grid gap-20">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <h2 className="font-serif-display text-4xl text-ink">Reference</h2>
            <ul className="grid border-t border-ink/15 sm:grid-cols-2 sm:gap-x-10">
              {TOOLS.map((t) => (
                <li key={t.href}>
                  <Link href={t.href} className="group block border-b border-ink/15 py-6">
                    <span className="font-serif-display block text-2xl text-ink decoration-1 underline-offset-[6px] group-hover:underline">{t.title}</span>
                    <span className="mt-1.5 block leading-relaxed text-stone">{t.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <h2 className="font-serif-display text-4xl text-ink">Guides</h2>
            <ul className="border-t border-ink/15">
              {POSTS.map((a) => (
                <li key={a.slug}>
                  <Link href={`/blog/${a.slug}/`} className="group grid gap-2 border-b border-ink/15 py-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-10">
                    <span>
                      <span className="font-serif-display block text-[1.75rem] leading-tight text-ink decoration-1 underline-offset-[6px] group-hover:underline">{a.title}</span>
                      <span className="mt-2 block max-w-[62ch] leading-relaxed text-stone">{a.dek}</span>
                    </span>
                    <span className="text-sm text-stone sm:text-right">
                      {a.category}
                      <span className="block">Updated {fmt(a.updated)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>
      <BookingBand />
    </>
  );
}
