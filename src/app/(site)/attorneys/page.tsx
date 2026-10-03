import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { AttorneyCard } from "@/components/site/cards";
import { BookingBand } from "@/components/home/Sections";
import { Container } from "@/components/ui/primitives";
import { ATTORNEYS } from "@/content/live";

export const metadata: Metadata = {
  title: "Our attorneys",
  description: "Meet the attorneys of RT Law Services: admissions, languages and areas of focus.",
};

export default function AttorneysPage() {
  return (
    <>
      <PageHero
        title="The people who will handle your case"
        lede="Each client works with a named attorney from the first consultation. Every profile lists bar admissions, languages and the matters that attorney leads."
        crumbs={[{ label: "Attorneys" }]}
      />
      <section className="py-20">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ATTORNEYS.map((a, i) => <AttorneyCard key={a.slug} a={a} index={i} />)}
          </div>
          <div className="mt-14 max-w-3xl rounded-2xl border border-line bg-mist p-6 text-sm leading-relaxed text-stone">
            <strong className="text-ink">About admissions.</strong> Immigration law is federal, so an attorney admitted in
            any U.S. state may represent clients before U.S. Citizenship and Immigration Services (USCIS) nationwide.
            Attorneys not admitted in Maryland limit their practice to federal immigration law, and each profile says so.
          </div>
        </Container>
      </section>
      <BookingBand />
    </>
  );
}
