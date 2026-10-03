// Single source of truth for firm details. A rename or new number changes here only.

export const SITE_MODE: "preview" | "production" =
  process.env.NEXT_PUBLIC_SITE_MODE === "production" ? "production" : "preview";

export const SHOW_DEMO = SITE_MODE !== "production";

export const SITE = {
  name: "RT Law Services",
  shortName: "RT Law",
  tagline: "Committed to helping our clients succeed",
  url: "https://rtlawservice.web.app",
  description:
    "RT Law Services is a Maryland immigration law firm serving families, professionals and employers across the United States, with clear guidance for first-time applicants and exacting work on employment and extraordinary ability petitions.",
  phone: "+1 (617) 642-6344",
  phoneHref: "tel:+16176426344",
  email: "clientservice@rtlawservices.com",
  location: "Maryland, serving clients nationwide",
  region: "Maryland",
  hours: [
    { days: "Monday to Friday", time: "9:00 AM to 5:00 PM" },
    { days: "Saturday", time: "10:00 AM to 2:00 PM" },
    { days: "Sunday", time: "Closed" },
  ],
  timezone: "America/New_York",
  // Maryland Rule 19-307.2 requires the name of at least one responsible attorney.
  // Pending confirmation by the firm (decision D15).
  responsibleAttorney: null as string | null,
  social: [] as { label: string; href: string }[],
} as const;

export const NAV = [
  { label: "Expertise", href: "/expertise/" },
  { label: "Case results", href: "/case-results/" },
  { label: "Attorneys", href: "/attorneys/" },
  { label: "Start here", href: "/start-here/" },
  { label: "Resources", href: "/resources/" },
  { label: "About", href: "/about/" },
  { label: "Contact", href: "/contact/" },
] as const;

export const RESULTS_CAVEAT =
  "Prior results do not guarantee a similar outcome. Each case depends on its own facts.";

export const NO_RELATIONSHIP =
  "Using this website or sending us information does not create an attorney-client relationship. Please do not send confidential details until we confirm that we can represent you.";
