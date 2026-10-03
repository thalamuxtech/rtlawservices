import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { MobileActionBar } from "@/components/site/Chrome";
import { RevealObserver } from "@/components/ui/RevealObserver";
import { SITE } from "@/content/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LegalService",
  name: SITE.name,
  description: SITE.description,
  url: SITE.url,
  telephone: SITE.phone,
  email: SITE.email,
  areaServed: [{ "@type": "State", name: "Maryland" }, { "@type": "Country", name: "United States" }],
  knowsAbout: ["Immigration law", "Family-based immigration", "Naturalization", "Employment-based immigration", "Estate planning"],
  openingHours: ["Mo-Fr 09:00-17:00", "Sa 10:00-14:00"],
};

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-[60] rounded-full bg-ink px-5 py-3 font-bold text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="pb-20 sm:pb-0">
        {children}
      </main>
      <Footer />
      <MobileActionBar />
      <RevealObserver />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
