// Firm details. Values published from the back office (settings/site) override
// these defaults, so a new phone number changes in one place. deriveSite runs at
// build time and again in the browser when newer content is published.

import { ATTORNEYS, CASES, LIVE_SITE } from "./live";
import { PAGES, type Pages } from "./pages";
import type { Attorney, CaseResult, SiteSettings } from "./types";

export const SITE_MODE: "preview" | "production" =
  process.env.NEXT_PUBLIC_SITE_MODE === "production" ? "production" : "preview";

export const SHOW_DEMO = SITE_MODE !== "production";

const SITE_NAME = "RT Law Services";

export type NavLink = { label: string; href: string; description?: string };
export type NavGroup = { label: string; href?: string; links?: NavLink[] };

export function deriveSite(LIVE_SITE: Partial<SiteSettings>, ATTORNEYS: Attorney[], CASES: CaseResult[], PAGES: Pages) {
  const phone = LIVE_SITE.phone || "+1 (617) 642-6344";

  const SITE = {
    name: SITE_NAME,
    shortName: "RT Law",
    tagline: PAGES.firm.tagline,
    url: "https://rtlawservice.web.app",
    description: PAGES.firm.description,
    phone,
    phoneHref: `tel:${phone.replace(/[^\d+]/g, "")}`,
    email: LIVE_SITE.email || "clientservice@rtlawservices.com",
    location: LIVE_SITE.location || "Maryland, serving clients nationwide",
    region: "Maryland",
    hours: LIVE_SITE.hours?.length
      ? LIVE_SITE.hours
      : [
          { days: "Monday to Friday", time: "9:00 AM to 5:00 PM" },
          { days: "Saturday", time: "10:00 AM to 2:00 PM" },
          { days: "Sunday", time: "Closed" },
        ],
    timezone: "America/New_York",
    // Maryland Rule 19-307.2 requires the name of at least one responsible attorney.
    responsibleAttorney: (LIVE_SITE.responsibleAttorney ||
      ATTORNEYS.find((a) => /managing/i.test(a.title))?.name ||
      ATTORNEYS[0]?.name ||
      SITE_NAME) as string,
    announcement: LIVE_SITE.announcement || "",
    refundPolicy: LIVE_SITE.refundPolicy?.enabled ? LIVE_SITE.refundPolicy : null,
    evaluationDays: LIVE_SITE.evaluationDays || 1,
    // Verifiable defaults until the firm enters its own figures in the back office.
    stats: LIVE_SITE.stats?.length
      ? LIVE_SITE.stats
      : [
          { value: new Date().getFullYear() - 2015, suffix: "+", label: "Years serving families across borders, since RT began in 2015" },
          { value: 12, label: "Practice guides covering family, professional and estate matters" },
          { value: 1, label: "Business day target to answer a free evaluation request" },
        ],
  };

  const NAV: NavGroup[] = [
    { label: "Expertise", href: "/expertise/" },
    // Hidden until at least one success story is published.
    ...(CASES.length ? [{ label: "Success stories", href: "/case-results/" }] : []),
    { label: "Reviews", href: "/reviews/" },
    {
      label: "Knowledge center",
      links: [
        { label: "Knowledge center", href: "/knowledge/", description: "Guides, tools and references in one place" },
        { label: "Blog", href: "/blog/", description: "Policy updates and guides, with sources" },
        { label: "Check eligibility", href: "/check-eligibility/", description: "Score your record for EB-1A, O-1A or NIW" },
        { label: "Filing fees", href: "/resources/filing-fees/", description: "Current government fees for common forms" },
        { label: "Processing times", href: "/resources/processing-times/", description: "How to read official timelines" },
        { label: "Visa Bulletin", href: "/resources/visa-bulletin/", description: "Priority dates, explained" },
      ],
    },
    {
      label: "The firm",
      links: [
        { label: "About", href: "/about/", description: "Our story and how we practise" },
        { label: "Attorneys", href: "/attorneys/", description: "Admissions, languages and focus" },
        { label: "How we work", href: "/how-we-work/", description: "Five stages, from first call to decision" },
        { label: "Start here", href: "/start-here/", description: "U.S. immigration in plain words" },
        { label: "Clients abroad", href: "/diaspora/", description: "Consultations in your time zone" },
        { label: "FAQ", href: "/faq/", description: "Answers before you begin" },
      ],
    },
    { label: "Contact", href: "/contact/" },
  ];

  return { SITE, NAV };
}

export const { SITE, NAV } = deriveSite(LIVE_SITE, ATTORNEYS, CASES, PAGES);

export type Site = typeof SITE;

export const CTA = {
  evaluation: { label: "Free evaluation", href: "/free-evaluation/" },
  consultation: { label: "Consultation", href: "/book/" },
};

export const RESULTS_CAVEAT =
  "No guarantee of results. Prior results do not guarantee a similar outcome, and each case depends on its own facts.";

export const NO_RELATIONSHIP =
  "Using this website, requesting a free evaluation or sending us information does not create an attorney-client relationship. Please do not send confidential details until we confirm that we can represent you.";
