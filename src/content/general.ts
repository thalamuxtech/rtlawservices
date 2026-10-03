import type { Faq } from "./expertise";

export const PROCESS = [
  { n: "01", title: "Assess", text: "We review your goals, history and documents, then explain which paths fit and what each involves. You leave the consultation with a clear next step." },
  { n: "02", title: "Prepare", text: "We build the filing: forms, evidence and, where needed, a written legal argument. You receive a checklist and we review each document you send." },
  { n: "03", title: "Represent", text: "We file, track the case and answer government requests. We prepare you for interviews and attend where the rules allow." },
  { n: "04", title: "Plan ahead", text: "Approval is often one step in a longer path. We map the route from visa to green card to citizenship and flag dates to watch." },
  { n: "05", title: "Stay compliant", text: "We help you and your employer keep status, renew on time and avoid errors that could affect future applications." },
] as const;

export const PILLARS = [
  { title: "Personal attention", text: "One case at a time. A named attorney leads your matter, and you can book directly with that attorney." },
  { title: "Demonstrated results", text: "We publish anonymised outcomes with client consent, so you can judge our work on the record." },
  { title: "Global families", text: "Video consultations scheduled in your own time zone, for clients across the United States and abroad." },
  { title: "Long-term planning", text: "From a first visa to citizenship and estate planning, we think in years, not single filings." },
] as const;

export const GENERAL_FAQS: { group: string; items: Faq[] }[] = [
  {
    group: "Consultations",
    items: [
      { q: "How do I book a consultation?", a: "Choose a time on our booking page. You pick the matter type, the format (video, phone or office) and a time shown in your own time zone. You receive a confirmation email with the details." },
      { q: "What should I prepare?", a: "Bring your passport, any immigration documents and notices you have received, and a short list of questions. We send a tailored checklist after you book." },
      { q: "Do you work with clients outside Maryland?", a: "Yes. Immigration law is federal, so we represent clients across the United States and abroad. Estate planning matters are limited to Maryland law." },
      { q: "Do you offer consultations in other languages?", a: "Consultations take place in English. If you are more comfortable in another language, tell us when you book and we will arrange an interpreter." },
    ],
  },
  {
    group: "Working with us",
    items: [
      { q: "How do your fees work?", a: "We agree the fee in writing before any work begins, so you know the cost in advance. Government filing fees are separate and paid to the agency." },
      { q: "How will I know what is happening with my case?", a: "You have a named attorney and receive updates at each milestone. We aim to answer messages within one business day." },
      { q: "Can you guarantee approval?", a: "No lawyer can guarantee an outcome, because decisions rest with government officers. We can promise careful preparation and honest advice about risk." },
      { q: "Is my information confidential?", a: "Yes. Information you share for legal advice is protected by our duty of confidentiality. Please avoid sending sensitive details through the website form until we confirm we can represent you." },
    ],
  },
  {
    group: "Immigration basics",
    items: [
      { q: "What is the difference between a visa and a green card?", a: "A visa is permission to travel to a U.S. port of entry for a purpose. A green card is lawful permanent residence, which lets a person live and work in the United States without a time limit." },
      { q: "What is USCIS?", a: "U.S. Citizenship and Immigration Services (USCIS) is the federal agency that decides most applications filed inside the United States, including green cards and citizenship." },
      { q: "What is the Visa Bulletin?", a: "A monthly U.S. Department of State publication that shows which applicants in limited categories can move forward, based on their priority date and country of birth." },
      { q: "How do I check my case status?", a: "Enter the 13-character receipt number from your notice on the official USCIS case status page. Our resources page explains how to read the result." },
    ],
  },
];

export const GLOSSARY: { term: string; def: string }[] = [
  { term: "Adjustment of status", def: "Applying for a green card from inside the United States, without leaving for an embassy interview." },
  { term: "Affidavit of Support (I-864)", def: "A sponsor's legal promise to support an immigrant financially." },
  { term: "Biometrics", def: "Fingerprints, a photograph and a signature taken at a USCIS appointment for background checks." },
  { term: "Consular processing", def: "Applying for an immigrant visa at a U.S. embassy or consulate abroad." },
  { term: "EAD", def: "Employment Authorization Document, the card that proves permission to work." },
  { term: "Green card", def: "Lawful permanent residence, the right to live and work in the United States permanently." },
  { term: "I-94", def: "The electronic arrival record showing how and when a person entered and how long they may stay." },
  { term: "Immediate relative", def: "A U.S. citizen's spouse, unmarried child under 21, or parent (when the citizen is 21 or older)." },
  { term: "Naturalization", def: "The process by which a permanent resident becomes a U.S. citizen." },
  { term: "Notario fraud", def: "Unlicensed people who claim to offer immigration legal help. In the United States a notary public is not a lawyer." },
  { term: "Petitioner", def: "The person or employer who files a petition on someone's behalf." },
  { term: "Beneficiary", def: "The person a petition is filed for." },
  { term: "Premium processing", def: "An optional extra fee for a faster USCIS decision on certain petitions." },
  { term: "Priority date", def: "Your place in line for a limited green card category, usually the date the petition was filed." },
  { term: "Receipt notice (I-797C)", def: "The USCIS notice confirming a filing, with the receipt number used to track the case." },
  { term: "RFE", def: "Request for Evidence, a USCIS letter asking for more documents before a decision." },
  { term: "Unlawful presence", def: "Time spent in the United States after authorized stay ends, which can trigger bars to returning." },
  { term: "USCIS", def: "U.S. Citizenship and Immigration Services, the agency that decides most immigration applications filed in the country." },
  { term: "Visa Bulletin", def: "The monthly U.S. Department of State chart showing which priority dates can move forward." },
  { term: "Waiver", def: "A request that the government forgive a ground that would otherwise block a visa or green card." },
];

export const PATH_QUIZ = [
  {
    id: "goal",
    q: "What would you like to achieve?",
    options: [
      { label: "Bring or keep a family member in the United States", value: "family" },
      { label: "Become a U.S. citizen", value: "citizenship" },
      { label: "Work in the United States", value: "work" },
      { label: "Fix a problem with a pending or denied case", value: "problem" },
    ],
  },
  {
    id: "where",
    q: "Where does the person who will immigrate live now?",
    options: [
      { label: "Inside the United States", value: "inside" },
      { label: "Outside the United States", value: "outside" },
    ],
  },
  {
    id: "profile",
    q: "Which describes you best?",
    options: [
      { label: "I have a family connection to a U.S. citizen or green card holder", value: "relative" },
      { label: "I have an advanced degree or a distinguished record in my field", value: "distinguished" },
      { label: "A U.S. employer wants to hire me", value: "employer" },
      { label: "None of these, or I am not sure", value: "unsure" },
    ],
  },
] as const;

export function suggestPath(a: Record<string, string>): { slug: string; label: string; why: string } {
  if (a.goal === "citizenship") return { slug: "citizenship", label: "Citizenship", why: "Naturalization is the route for green card holders who meet the residence requirements." };
  if (a.goal === "problem") return { slug: "appeals-waivers", label: "Denied or delayed", why: "Notices, denials and long delays need a review of the record and the deadline." };
  if (a.goal === "family") {
    return a.where === "outside"
      ? { slug: "consular-processing", label: "Family abroad", why: "Relatives abroad usually apply for an immigrant visa through a U.S. embassy." }
      : { slug: "family", label: "Family green cards", why: "Relatives in the United States may be able to adjust status without leaving." };
  }
  if (a.profile === "distinguished") return { slug: "extraordinary-ability", label: "Extraordinary ability or National Interest Waiver", why: "Distinguished records can support self-petitioned routes that need no employer." };
  if (a.profile === "employer") return { slug: "h-1b", label: "Employer-sponsored work visas", why: "An employer offer opens H-1B and other sponsored routes." };
  return { slug: "", label: "A general assessment", why: "A short consultation is the quickest way to see which routes fit your facts." };
}

// Source: USCIS Form G-1055, Fee Schedule, edition 10/01/26 (uscis.gov/g-1055).
export const FEES_AS_OF = "1 October 2026";
export const FEES: { form: string; name: string; paper: string; online?: string; note?: string }[] = [
  { form: "I-130", name: "Petition for Alien Relative", paper: "$675", online: "$625" },
  { form: "I-485", name: "Application to Adjust Status (age 14 and over)", paper: "$1,440", online: "$1,390" },
  { form: "I-765", name: "Application for Employment Authorization", paper: "$520", online: "$470", note: "$260 when filed with or after an I-485 paid on or after 1 April 2024 that is still pending" },
  { form: "I-751", name: "Petition to Remove Conditions on Residence", paper: "$750", online: "$700" },
  { form: "N-400", name: "Application for Naturalization", paper: "$760", online: "$710", note: "Reduced fee available for some income levels" },
  { form: "I-140", name: "Immigrant Petition for Alien Workers", paper: "$715", note: "Plus the Asylum Program Fee: $600, $300 for small employers and self-petitioners, $0 for nonprofits" },
  { form: "I-129 (O)", name: "Petition for a Nonimmigrant Worker, O classification", paper: "$1,055", note: "$530 for small employers and nonprofits, plus additional fees where applicable" },
  { form: "I-601A", name: "Provisional Unlawful Presence Waiver", paper: "$795" },
  { form: "I-864", name: "Affidavit of Support", paper: "$0" },
  { form: "I-526 / I-526E", name: "Immigrant Petition by Investor", paper: "$3,675" },
  { form: "I-907", name: "Premium Processing (I-129 and I-140 EB-1, EB-2, EB-3)", paper: "$2,965", note: "In addition to all other filing fees" },
];
