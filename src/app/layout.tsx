import type { Metadata, Viewport } from "next";
import { EB_Garamond, Lato } from "next/font/google";
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
    default: "RT Law Services | Immigration Law Firm in Maryland, Serving the U.S.",
    template: "%s | RT Law Services",
  },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: "RT Law Services | Immigration counsel from Maryland",
    description: SITE.description,
    url: SITE.url,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
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
