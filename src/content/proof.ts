// Reviews, case results and attorney profiles.
// Every record flagged `demo: true` is fictional sample content for layout review.
// Demo records are hidden whenever NEXT_PUBLIC_SITE_MODE=production, and every
// demo card carries a visible "Sample" label (see planning spec section 15.6).

import { SHOW_DEMO } from "./site";
import type { Track } from "./expertise";

export type Attorney = {
  slug: string;
  name: string;
  title: string;
  admissions: string[];
  practiceLimitation?: string;
  education: string[];
  languages: string[];
  memberships: string[];
  leads: string[];
  bio: string[];
  initials: string;
  demo: boolean;
};

export type CaseResult = {
  slug: string;
  title: string;
  track: Track;
  category: string;
  expertise: string;
  clientProfile: string;
  challenge: string;
  approach: string;
  outcome: string;
  headline: string;
  timeline: string;
  year: number;
  attorney: string;
  featured?: boolean;
  demo: boolean;
};

export type Review = {
  id: string;
  name: string;
  location: string;
  matter: string;
  expertise: string;
  rating: number;
  quote: string;
  date: string;
  demo: boolean;
};

const ATTORNEYS_ALL: Attorney[] = [
  {
    slug: "jordan-ellis",
    name: "Jordan Ellis",
    title: "Managing Attorney",
    admissions: ["Maryland, 2012", "U.S. District Court for the District of Maryland"],
    education: ["J.D., University of Maryland Francis King Carey School of Law"],
    languages: ["English", "Yoruba"],
    memberships: ["American Immigration Lawyers Association (AILA)", "Maryland State Bar Association"],
    leads: ["family", "citizenship", "appeals-waivers", "consular-processing", "estates"],
    bio: [
      "Jordan Ellis leads the firm's family and citizenship practice and works with clients from the first consultation to the oath ceremony.",
      "Jordan's work centres on cases that need careful judgement: prior overstays, past denials and families separated across borders.",
    ],
    initials: "JE",
    demo: true,
  },
  {
    slug: "amara-whitfield",
    name: "Amara Whitfield",
    title: "Senior Associate",
    admissions: ["New York, 2017"],
    practiceLimitation: "Practice limited to federal immigration law.",
    education: ["J.D.", "LL.M."],
    languages: ["English", "French"],
    memberships: ["American Immigration Lawyers Association (AILA)"],
    leads: ["extraordinary-ability", "national-interest-waiver", "h-1b", "l-1", "investors-founders", "employers"],
    bio: [
      "Amara Whitfield handles petitions for researchers, founders and employers, with a focus on extraordinary ability and National Interest Waiver cases.",
      "Amara builds each petition as a structured legal argument that ties every exhibit to the standard an officer applies.",
    ],
    initials: "AW",
    demo: true,
  },
];

const CASES_ALL: CaseResult[] = [
  {
    slug: "spouse-green-card-after-overstay",
    title: "Spouse green card after a prior visa overstay",
    track: "individuals", category: "Family green card", expertise: "family",
    clientProfile: "Spouse of a U.S. citizen who entered on a visitor visa and stayed 14 months beyond it.",
    challenge: "The overstay raised questions at intake about whether the spouse could apply from inside the United States.",
    approach: "We confirmed the lawful entry, which keeps adjustment of status available to immediate relatives, and prepared a full record of the marriage with interview preparation.",
    outcome: "Green card approved at interview.", headline: "Approved at interview",
    timeline: "11 months", year: 2025, attorney: "jordan-ellis", featured: true, demo: true,
  },
  {
    slug: "naturalization-with-old-arrest",
    title: "Naturalization with an old arrest record",
    track: "individuals", category: "Citizenship", expertise: "citizenship",
    clientProfile: "Permanent resident for nine years with one dismissed misdemeanor arrest from 2012.",
    challenge: "Disclosure of a dismissed charge and questions about good moral character.",
    approach: "We obtained certified court dispositions, prepared a clear disclosure and practised the interview.",
    outcome: "Naturalization approved and oath ceremony attended.", headline: "Oath taken",
    timeline: "6 months", year: 2025, attorney: "jordan-ellis", demo: true,
  },
  {
    slug: "h4-work-permit-renewal",
    title: "H-4 work permit renewal timed around a new job",
    track: "individuals", category: "Spouse work permit", expertise: "spousal-work-authorization",
    clientProfile: "H-4 spouse of an H-1B engineer, with a job offer waiting.",
    challenge: "The current card expired within five months and automatic extensions no longer applied to new renewal filings.",
    approach: "We filed the H-4 extension and the work permit renewal together on the earliest permitted date and agreed a start-date plan with the employer.",
    outcome: "Work permit approved before the start date.", headline: "Approved before start date",
    timeline: "4 months", year: 2026, attorney: "amara-whitfield", demo: true,
  },
  {
    slug: "rfe-affidavit-of-support",
    title: "Request for evidence on the affidavit of support",
    track: "individuals", category: "Denied or delayed", expertise: "appeals-waivers",
    clientProfile: "Marriage-based case first filed without a lawyer.",
    challenge: "A Request for Evidence stated the sponsor's income fell below 125 percent of the federal poverty guidelines.",
    approach: "We added a qualified joint sponsor with a complete Affidavit of Support and tax transcripts, and responded 30 days before the deadline.",
    outcome: "Request satisfied and green card approved.", headline: "RFE resolved, approved",
    timeline: "3 months from RFE", year: 2026, attorney: "jordan-ellis", demo: true,
  },
  {
    slug: "immigrant-visas-for-parents",
    title: "Immigrant visas for both parents abroad",
    track: "individuals", category: "Family abroad", expertise: "consular-processing",
    clientProfile: "U.S. citizen in Maryland sponsoring both parents in West Africa.",
    challenge: "Civil documents showed inconsistent spellings of the parents' names.",
    approach: "We secured affidavits and corrected records before the National Visa Center stage, then prepared both parents for the embassy interview by video.",
    outcome: "Both immigrant visas issued at the first interview.", headline: "Visas issued, first interview",
    timeline: "16 months", year: 2025, attorney: "jordan-ellis", demo: true,
  },
  {
    slug: "niw-early-career-researcher",
    title: "National Interest Waiver for an early-career researcher",
    track: "professionals", category: "National Interest Waiver", expertise: "national-interest-waiver",
    clientProfile: "Postdoctoral researcher in public health with no employer sponsor.",
    challenge: "A modest citation count for a self-petition.",
    approach: "We built the petition on the three-part Dhanasar test, with letters from independent experts and evidence that public agencies used the research.",
    outcome: "Approved with premium processing, without a request for evidence.", headline: "Approved in 7 weeks",
    timeline: "7 weeks", year: 2026, attorney: "amara-whitfield", featured: true, demo: true,
  },
  {
    slug: "o1a-startup-founder",
    title: "O-1A for a startup founder",
    track: "professionals", category: "Extraordinary ability", expertise: "extraordinary-ability",
    clientProfile: "Founder of a venture-backed financial technology company, previously on student status.",
    challenge: "Evidence spread across press, funding records and judging roles.",
    approach: "We mapped the evidence to four O-1A criteria, prepared expert opinion letters and used an agent as petitioner.",
    outcome: "O-1A approved.", headline: "Approved in 18 days",
    timeline: "18 days with premium processing", year: 2025, attorney: "amara-whitfield", featured: true, demo: true,
  },
  {
    slug: "eb1a-physician-scientist",
    title: "EB-1A for a physician-scientist",
    track: "professionals", category: "Extraordinary ability", expertise: "extraordinary-ability",
    clientProfile: "Academic physician who leads clinical trials.",
    challenge: "Showing sustained acclaim beyond the home institution.",
    approach: "We documented original contributions, peer review, editorial board service and media coverage against five criteria and the final merits standard.",
    outcome: "EB-1A approved.", headline: "Approved in 3 weeks",
    timeline: "3 weeks with premium processing", year: 2026, attorney: "amara-whitfield", demo: true,
  },
  {
    slug: "l1a-new-office",
    title: "L-1A for a manager opening a U.S. office",
    track: "professionals", category: "Intracompany transfer", expertise: "l-1",
    clientProfile: "Operations director of a West African logistics company opening a Maryland subsidiary.",
    challenge: "New office petitions require secured premises and a credible business plan.",
    approach: "We prepared the lease, corporate structure, staffing plan and financials, and planned the EB-1C green card path at the same time.",
    outcome: "L-1A approved for the initial one-year period.", headline: "New office approved",
    timeline: "5 weeks with premium processing", year: 2025, attorney: "amara-whitfield", demo: true,
  },
];

const REVIEWS_ALL: Review[] = [
  { id: "r1", name: "Adaeze O.", location: "Silver Spring, MD", matter: "Spouse green card", expertise: "family", rating: 5, date: "2025-03-14", demo: true,
    quote: "I was nervous about the interview for months. The attorney walked us through every question the officer was likely to ask, and the green card arrived eleven months after we filed. I always knew where things stood." },
  { id: "r2", name: "Daniel M.", location: "Baltimore, MD", matter: "Naturalization", expertise: "citizenship", rating: 5, date: "2025-05-02", demo: true,
    quote: "I put off citizenship for years because of an old travel history question. One consultation answered it. Six months later I took the oath with my children watching." },
  { id: "r3", name: "Priya S.", location: "Columbia, MD", matter: "H-4 work permit", expertise: "spousal-work-authorization", rating: 5, date: "2026-02-20", demo: true,
    quote: "My work permit was close to expiring and a job offer was waiting. They filed on the first possible day and explained the timing to my employer, so nobody was surprised." },
  { id: "r4", name: "Kwame A.", location: "Accra, Ghana", matter: "Visas for parents", expertise: "consular-processing", rating: 5, date: "2025-08-11", demo: true,
    quote: "Most of my questions came late at night in Ghana. The team scheduled calls around my hours and prepared my parents for the embassy interview. Both visas were issued at the first appointment." },
  { id: "r5", name: "Dr. Lina H.", location: "Bethesda, MD", matter: "National Interest Waiver", expertise: "national-interest-waiver", rating: 5, date: "2026-04-09", demo: true,
    quote: "They read my research and built the petition around its national importance, not only my citation count. Approved without a request for evidence." },
  { id: "r6", name: "Marco T.", location: "Arlington, VA", matter: "O-1A visa", expertise: "extraordinary-ability", rating: 5, date: "2025-11-07", demo: true,
    quote: "Founders have little time to collect evidence. They gave me a precise checklist, drafted the expert letters with me and filed with premium processing. Approval came in under three weeks." },
  { id: "r7", name: "Ngozi E.", location: "Houston, TX", matter: "RFE response", expertise: "appeals-waivers", rating: 5, date: "2026-01-16", demo: true,
    quote: "We received a request for evidence on the affidavit of support and panicked. They found the gap, fixed it with a joint sponsor and the case moved forward within two months." },
  { id: "r8", name: "James K.", location: "Rockville, MD", matter: "Removal of conditions", expertise: "family", rating: 4, date: "2026-03-03", demo: true,
    quote: "Good communication and solid preparation. The process took longer than I hoped, which was down to processing times, and the firm kept me updated the whole way." },
  { id: "r9", name: "Fatima B.", location: "Germantown, MD", matter: "Wills and trusts", expertise: "estates", rating: 5, date: "2026-05-22", demo: true,
    quote: "We own property in two countries. They explained how a U.S. will and trust work for our children abroad in language we understood." },
  { id: "r10", name: "HR Director, software company", location: "Nationwide", matter: "Employer sponsorship", expertise: "employers", rating: 5, date: "2026-07-30", demo: true,
    quote: "We moved our sponsorship work to RT for one point of contact. Filings go out on schedule, and our employees get answers directly from the attorney." },
];

const visible = <T extends { demo: boolean }>(rows: T[]) => rows.filter((r) => SHOW_DEMO || !r.demo);

export const ATTORNEYS = visible(ATTORNEYS_ALL);
export const CASES = visible(CASES_ALL);
export const REVIEWS = visible(REVIEWS_ALL);

export const getAttorney = (slug: string) => ATTORNEYS.find((a) => a.slug === slug);
export const getCase = (slug: string) => CASES.find((c) => c.slug === slug);
export const casesFor = (expertise: string) => CASES.filter((c) => c.expertise === expertise);
export const reviewsFor = (expertise: string) => REVIEWS.filter((r) => r.expertise === expertise);
export const casesByAttorney = (slug: string) => CASES.filter((c) => c.attorney === slug);
