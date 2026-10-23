import type { Metadata, Viewport } from "next";
import { EB_Garamond, Lato } from "next/font/google";
import { OG_IMAGE } from "@/content/seo";
import { SITE } from "@/content/site";
import "./globals.css";

const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "RT Law Services | Immigration Law Firm Serving Clients Across the U.S.",
    template: "%s | RT Law Services",
  },
  description: SITE.description,
  applicationName: SITE.name,
  // Each public page sets its own canonical address and link-preview tags
  // (src/content/seo.ts); these are the fallback for anything that does not.
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: "RT Law Services | Immigration counsel across the United States",
    description: SITE.description,
    locale: "en_US",
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#14181F",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${garamond.variable} ${lato.variable}`} suppressHydrationWarning>
      <head>
        {/* Marks the document ready for scroll reveals. Without it, content stays visible. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js-ready')" }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
