// Content of group.rtlawservices.com. The business names come from the firm's
// list of its four businesses; the descriptions and team text come from the
// firm's own documents (planning/brand/website pitch_v2.docx and
// WEBSITE PITCH_Team_v1.docx, November 2026), with only light corrections.

export const SITE = {
  url: "https://group.rtlawservices.com",
  firmUrl: "https://rtlawservices.com",
  name: "RT Law Services",
  phone: "+1 (617) 642-6344",
  phoneHref: "tel:+16176426344",
  email: "info@rtlawservices.com",
  motto: "Law services you can trust",
  headline: "Strategic Legal Solutions for a Global World",
  intro:
    "At RT Law Services, we serve as trusted advisors to clients navigating the legal challenges and opportunities of an interconnected world. Combining legal excellence with global perspective, we help individuals, families, entrepreneurs, and organizations protect their interests, achieve their goals, and build lasting success across borders.",
};

/**
 * The four businesses. `external` sends visitors to the firm's main website
 * instead of a page here. `focus` repeats, as short labels, matters the
 * description already names.
 */
export const BUSINESSES = [
  {
    slug: "africa-us-business-law",
    number: "01",
    name: "Africa-U.S. Business Law Intersection",
    tagline: "Bridging Opportunities Between Africa and the United States",
    icon: "bridge",
    body: "The African and U.S. markets present extraordinary opportunities for entrepreneurs, investors, corporations, and governments. RT Law Services helps clients navigate the complex legal, regulatory, and cultural landscape that exists at the intersection of African and American business. From cross-border transactions and market entry strategies to compliance, contracts, and investment protection, we provide practical legal solutions that drive international growth and long-term success. We are committed to helping clients build profitable, sustainable, and legally sound ventures across continents.",
    focus: ["Cross-border transactions", "Market entry strategies", "Compliance", "Contracts", "Investment protection"],
    audience: ["Entrepreneurs", "Investors", "Corporations", "Governments"],
  },
  {
    slug: "global-asset-recovery",
    number: "02",
    name: "Global Asset Recovery",
    tagline: "Recovering Assets. Restoring Justice. Protecting Wealth.",
    icon: "shield",
    body: "When assets are lost, concealed, misappropriated, or transferred across jurisdictions, recovering them requires sophisticated legal strategy and international coordination. RT Law Services assists individuals, businesses, and institutions in tracing, identifying, freezing, and recovering assets worldwide. Our goal is to help clients reclaim what rightfully belongs to them while minimizing financial loss and legal exposure. We combine strategic advocacy, investigative resources, and cross-border legal experience to pursue results in even the most complex cases.",
    focus: ["Tracing", "Identifying", "Freezing", "Recovering"],
    audience: ["Individuals", "Businesses", "Institutions"],
  },
  {
    slug: "immigration-law",
    number: "03",
    name: "Immigration Law",
    tagline: "Creating Pathways to New Opportunities",
    icon: "path",
    external: "https://rtlawservices.com/",
    body: "Immigration is more than a legal process; it is a life-changing journey. RT Law Services provides compassionate and strategic legal guidance to individuals, families, professionals, and businesses navigating immigration and resettlement matters. Whether pursuing visas, permanent residence, citizenship, family reunification, or relocation opportunities, we advocate for our clients every step of the way. Our mission is to help people build secure futures, unlock opportunities, and successfully transition into new communities with confidence.",
    focus: ["Visas", "Permanent residence", "Citizenship", "Family reunification", "Relocation"],
    audience: ["Individuals", "Families", "Professionals", "Businesses"],
  },
  {
    slug: "risk-management-advisory",
    number: "04",
    name: "Risk Management Advisory",
    tagline: "Anticipate Risks. Protect What Matters. Grow with Confidence.",
    icon: "compass",
    body: "In an increasingly complex global environment, proactive risk management is essential to protecting businesses, investments, and reputations. RT Law Services helps clients identify legal, regulatory, operational, and strategic risks before they become costly problems. We develop tailored risk mitigation strategies that strengthen compliance, enhance decision-making, and support sustainable growth. By helping clients anticipate challenges and respond effectively, we empower them to move forward with confidence and resilience.",
    focus: ["Legal risk", "Regulatory risk", "Operational risk", "Strategic risk"],
    audience: ["Businesses", "Investors"],
  },
];

export const DISCLAIMER =
  "Attorney advertising. The information on this website is general information, not legal advice for any individual case. Using this website or contacting us does not create an attorney-client relationship. Prior results do not guarantee a similar outcome.";
