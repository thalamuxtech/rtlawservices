import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { MobileActionBar } from "@/components/site/Chrome";
import { RevealObserver } from "@/components/ui/RevealObserver";
import { CookieConsent } from "@/components/site/CookieConsent";
import { MotionProvider } from "@/components/ui/MotionProvider";
import { SITE } from "@/content/site";
import { LiveContentProvider } from "@/content/LiveContent";
import { firmGraph } from "@/content/schema";
import { EXPERTISE } from "@/content/expertise";
import { ATTORNEYS } from "@/content/live";

// The firm and its website, on every public page (src/content/schema.ts).
const jsonLd = firmGraph(SITE, EXPERTISE, ATTORNEYS);

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <LiveContentProvider>
      <MotionProvider>
        <a
          href="#main"
          className="sr-only z-[60] rounded-full bg-ink px-5 py-3 font-bold text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <Header />
        <main id="main">
          {children}
        </main>
        <Footer />
        <MobileActionBar />
        <RevealObserver />
        <CookieConsent />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </MotionProvider>
    </LiveContentProvider>
  );
}
