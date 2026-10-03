import type { Track } from "./expertise";

export type Status = "published" | "draft";

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
  photoUrl?: string;
  order?: number;
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
  /** Public URL of the redacted approval document image, if one was uploaded. */
  documentUrl?: string;
  /** Form shown on the sample document when no image exists, for example "I-140". */
  form?: string;
  /** Success-story details, shown as a table: field, position, approval date, processing time and so on. */
  details?: { label: string; value: string }[];
  /** Evidence presented in the petition. */
  evidence?: string[];
  /** Optional quote from the client, published with consent. */
  testimonial?: string;
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
  /** "google" only for reviews copied from the firm's Google Business Profile. */
  source: "google" | "direct" | "sample";
  demo: boolean;
};

export type Source = { title: string; publisher: string; url: string };

export type Post = {
  slug: string;
  title: string;
  dek: string;
  category: string;
  readMinutes: number;
  published: string;
  updated: string;
  author: string;
  /** Markdown subset: ## and ### headings, paragraphs, "- " lists, **bold**, *italic*, [links](url). */
  body: string;
  sources: Source[];
};

export type SiteSettings = {
  phone: string;
  email: string;
  location: string;
  hours: { days: string; time: string }[];
  responsibleAttorney: string | null;
  announcement: string;
  /** Off until the firm confirms it offers this. Shown on the free evaluation page when enabled. */
  refundPolicy?: { enabled: boolean; title: string; text: string };
  /** Business days within which the firm aims to send an evaluation. */
  evaluationDays?: number;
  /** Home page statistics. Enter only figures the firm can substantiate. */
  stats?: { value: number; prefix?: string; suffix?: string; label: string }[];
};
