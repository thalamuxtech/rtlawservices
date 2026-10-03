import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { BookingBand } from "@/components/home/Sections";
import { Container } from "@/components/ui/primitives";
import { FEES, FEES_AS_OF } from "@/content/general";

export const metadata: Metadata = {
  title: "USCIS filing fees",
  description: `Government filing fees for common immigration forms, from the USCIS fee schedule (Form G-1055) in effect as of ${FEES_AS_OF}.`,
};

export default function FeesPage() {
  return (
    <>
      <PageHero
        title="Government filing fees"
        lede={`Fees for common forms, taken from the U.S. Citizenship and Immigration Services (USCIS) fee schedule, Form G-1055, edition dated ${FEES_AS_OF}. Fees change, so confirm the amount on the official schedule before you file.`}
        crumbs={[{ label: "Resources", href: "/resources/" }, { label: "Filing fees" }]}
      />
      <section className="py-20">
        <Container>
          <div className="overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full min-w-[640px] text-left">
              <caption className="sr-only">USCIS filing fees as of {FEES_AS_OF}</caption>
              <thead className="bg-ink text-paper">
                <tr>
                  <th scope="col" className="px-6 py-4 text-sm font-bold">Form</th>
                  <th scope="col" className="px-6 py-4 text-sm font-bold">Purpose</th>
                  <th scope="col" className="px-6 py-4 text-sm font-bold">Paper filing</th>
                  <th scope="col" className="px-6 py-4 text-sm font-bold">Online filing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {FEES.map((f) => (
                  <tr key={f.form} className="align-top transition-colors hover:bg-mist/60">
                    <th scope="row" className="whitespace-nowrap px-6 py-4 font-bold text-ink">{f.form}</th>
                    <td className="px-6 py-4 text-stone">
                      {f.name}
                      {f.note && <span className="mt-1 block text-sm text-stone/90">{f.note}</span>}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-bold text-ink">{f.paper}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-ink">{f.online ?? "Not listed"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-8 grid gap-4 text-sm leading-relaxed text-stone sm:grid-cols-2">
            <p>
              Online filing is available only for some forms and often costs $50 less. Fee waivers (Form I-912) and reduced
              fees exist for some applicants. Premium processing fees are paid in addition to all other fees.
            </p>
            <p>
              Source: USCIS Form G-1055, Fee Schedule.{" "}
              <a href="https://www.uscis.gov/g-1055" target="_blank" rel="noopener noreferrer" className="font-bold text-brass-ink underline underline-offset-4">
                Official fee schedule <ExternalLink aria-hidden className="ml-1 inline size-3.5 align-[-2px]" />
              </a>{" "}
              and{" "}
              <a href="https://www.uscis.gov/feecalculator" target="_blank" rel="noopener noreferrer" className="font-bold text-brass-ink underline underline-offset-4">
                fee calculator <ExternalLink aria-hidden className="ml-1 inline size-3.5 align-[-2px]" />
              </a>
              .
            </p>
          </div>
        </Container>
      </section>
      <BookingBand />
    </>
  );
}
