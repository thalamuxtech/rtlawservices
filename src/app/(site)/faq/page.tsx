import type { Metadata } from "next";
import Link from "next/link";
import { Accordion, PageHero } from "@/components/site/PageHero";
import { BookingBand } from "@/components/home/Sections";
import { Container } from "@/components/ui/primitives";
import { GENERAL_FAQS } from "@/content/general";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "Answers about consultations, fees, confidentiality and the basics of U.S. immigration.",
};

export default function FaqPage() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: GENERAL_FAQS.flatMap((g) => g.items).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <>
      <PageHero
        title="Questions clients ask before they begin"
        lede="Answers about working with us and about the system in general. Each practice page has its own questions on that topic."
        crumbs={[{ label: "FAQ" }]}
      />
      <section className="py-20">
        <Container className="grid gap-14 lg:grid-cols-[240px_1fr]">
          <nav aria-label="FAQ groups" className="hidden lg:block">
            <ul className="sticky top-32 grid gap-1">
              {GENERAL_FAQS.map((g) => (
                <li key={g.group}>
                  <a href={`#${g.group.toLowerCase().replace(/\s+/g, "-")}`} className="block py-1.5 text-stone hover:text-ink">{g.group}</a>
                </li>
              ))}
              <li className="mt-6">
                <Link href="/expertise/" className="font-bold text-brass-ink hover:text-ink">Practice-specific questions</Link>
              </li>
            </ul>
          </nav>
          <div className="grid gap-16">
            {GENERAL_FAQS.map((g) => (
              <section key={g.group} id={g.group.toLowerCase().replace(/\s+/g, "-")} className="scroll-mt-32">
                <h2 className="font-serif-display text-4xl text-ink">{g.group}</h2>
                <Accordion className="mt-6" items={g.items} />
              </section>
            ))}
          </div>
        </Container>
      </section>
      <BookingBand />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </>
  );
}
