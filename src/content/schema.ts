// Schema.org structured data (JSON-LD). Every node has a stable @id, so the
// firm, its website, its attorneys, its services and its articles link into
// one graph that search engines and AI systems can follow.
//
// The firm works online and by phone across the United States, so it has no
// public street address; areaServed says where it works instead. Reviews are
// not marked up: sample reviews must never appear as ratings.

import type { Expertise } from "./expertise";
import type { Attorney, Post } from "./types";

type Site = { name: string; url: string; description: string; tagline: string; phone: string; email: string; hours: { days: string; time: string }[]; profiles: string[] };

export const ids = {
  firm: (s: Pick<Site, "url">) => `${s.url}/#firm`,
  website: (s: Pick<Site, "url">) => `${s.url}/#website`,
  person: (s: Pick<Site, "url">, slug: string) => `${s.url}/attorneys/${slug}/#person`,
  service: (s: Pick<Site, "url">, slug: string) => `${s.url}/expertise/${slug}/#service`,
};

const US = { "@type": "Country", name: "United States" };
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** "Monday to Friday" + "9:00 AM to 5:00 PM" as opening hours. Rows that do not parse, such as "Closed", are left out. */
function openingHours(hours: Site["hours"]) {
  const t24 = (t: string) => {
    const m = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i.exec(t.trim());
    if (!m) return null;
    let h = Number(m[1]) % 12;
    if (m[3].toUpperCase() === "PM") h += 12;
    return `${String(h).padStart(2, "0")}:${m[2] ?? "00"}`;
  };
  return hours.flatMap(({ days, time }) => {
    const [from, to] = days.split(/\s+to\s+/i).map((d) => DAYS.find((x) => x.toLowerCase() === d.trim().toLowerCase()));
    const [opens, closes] = time.split(/\s+to\s+/i).map(t24);
    if (!from || !opens || !closes) return [];
    const range = to ? DAYS.slice(DAYS.indexOf(from), DAYS.indexOf(to) + 1) : [from];
    return [{ "@type": "OpeningHoursSpecification", dayOfWeek: range, opens, closes }];
  });
}

/** The firm and its website, included on every public page. */
export function firmGraph(site: Site, expertise: Pick<Expertise, "slug" | "title">[], attorneys: Pick<Attorney, "slug">[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["LegalService", "Organization"],
        "@id": ids.firm(site),
        name: site.name,
        alternateName: ["RT Immigration Law Services", "RT Law"],
        url: `${site.url}/`,
        description: site.description,
        slogan: site.tagline,
        logo: { "@type": "ImageObject", url: `${site.url}/brand/rt-logo-512.png`, width: 512, height: 512 },
        image: `${site.url}/og/rt-law-services.png`,
        telephone: site.phone,
        email: site.email,
        areaServed: US,
        availableLanguage: ["English"],
        knowsAbout: ["Immigration law", ...expertise.map((e) => e.title)],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          telephone: site.phone,
          email: site.email,
          areaServed: "US",
          availableLanguage: ["English"],
        },
        openingHoursSpecification: openingHours(site.hours),
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Immigration and related legal services",
          itemListElement: expertise.map((e) => ({ "@type": "Offer", itemOffered: { "@id": ids.service(site, e.slug), name: e.title } })),
        },
        ...(attorneys.length ? { employee: attorneys.map((a) => ({ "@id": ids.person(site, a.slug) })) } : {}),
        ...(site.profiles.length ? { sameAs: site.profiles } : {}),
      },
      {
        "@type": "WebSite",
        "@id": ids.website(site),
        url: `${site.url}/`,
        name: site.name,
        description: site.description,
        inLanguage: "en-US",
        publisher: { "@id": ids.firm(site) },
      },
    ],
  };
}

/** A practice area as a service the firm provides. */
export function serviceLd(site: Site, e: Pick<Expertise, "slug" | "title" | "summary" | "codes">) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": ids.service(site, e.slug),
    name: e.title,
    serviceType: e.title,
    description: e.summary,
    url: `${site.url}/expertise/${e.slug}/`,
    provider: { "@id": ids.firm(site) },
    areaServed: US,
    ...(e.codes ? { alternateName: e.codes } : {}),
  };
}

export function personLd(site: Site, a: Attorney, practice: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": ids.person(site, a.slug),
    name: a.name,
    jobTitle: a.title,
    url: `${site.url}/attorneys/${a.slug}/`,
    description: a.bio[0],
    worksFor: { "@id": ids.firm(site) },
    ...(a.photoUrl ? { image: a.photoUrl.startsWith("http") ? a.photoUrl : `${site.url}${a.photoUrl}` } : {}),
    ...(a.languages.length ? { knowsLanguage: a.languages } : {}),
    ...(practice.length ? { knowsAbout: practice } : {}),
  };
}

export function articleLd(site: Site, p: Post) {
  const url = `${site.url}/blog/${p.slug}/`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    mainEntityOfPage: url,
    url,
    headline: p.title,
    description: p.dek,
    datePublished: p.published,
    dateModified: p.updated || p.published,
    inLanguage: "en-US",
    image: `${site.url}/og/rt-law-services.png`,
    author: p.author === site.name ? { "@id": ids.firm(site) } : { "@type": "Person", name: p.author },
    publisher: { "@id": ids.firm(site) },
    isPartOf: { "@id": ids.website(site) },
    articleSection: p.category,
    citation: p.sources.map((s) => s.url),
  };
}
