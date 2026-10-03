export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] };

export type Article = {
  slug: string;
  title: string;
  dek: string;
  category: string;
  readMinutes: number;
  updated: string;
  body: Block[];
};

export const ARTICLES: Article[] = [
  {
    slug: "marriage-green-card-what-to-expect",
    title: "The marriage green card, step by step",
    dek: "What happens between filing and the interview when a U.S. citizen sponsors a spouse who lives in the United States.",
    category: "Family",
    readMinutes: 6,
    updated: "2026-09-15",
    body: [
      { type: "p", text: "A U.S. citizen's spouse who entered the country lawfully can usually apply for permanent residence without leaving. Lawyers call this adjustment of status. The process follows a predictable order, and knowing it in advance reduces much of the stress couples describe." },
      { type: "h2", text: "1. The filing package" },
      { type: "p", text: "Most couples file several forms together: the petition that proves the marriage (Form I-130), the green card application (Form I-485), the Affidavit of Support (Form I-864), and often applications for a work permit and travel permission. Filing together is called concurrent filing." },
      { type: "h2", text: "2. Receipts and biometrics" },
      { type: "p", text: "U.S. Citizenship and Immigration Services (USCIS) sends a receipt notice for each form, with a 13-character receipt number. A few weeks later the applicant attends a short biometrics appointment for fingerprints and a photograph." },
      { type: "h2", text: "3. Work and travel documents" },
      { type: "p", text: "If requested, the work permit and travel document often arrive months before the green card decision. Travelling abroad without the travel document while the case is pending can cause the application to be treated as abandoned, so we advise clients to wait for it." },
      { type: "h2", text: "4. The interview" },
      { type: "p", text: "Most marriage cases include an interview at a USCIS field office. The officer reviews the forms under oath and asks about the relationship. Couples who bring originals of their key documents and recent joint records tend to have shorter, calmer interviews, in our observation." },
      { type: "ul", items: ["Bring the interview notice, passports and the original marriage certificate", "Bring recent joint evidence: lease, bank statements, insurance, photographs", "Answer only the question asked, and say so when you do not know"] },
      { type: "h2", text: "5. The decision" },
      { type: "p", text: "If the marriage is under two years old at approval, the green card is conditional and valid for two years. The couple then files to remove the conditions in the 90 days before it expires." },
    ],
  },
  {
    slug: "eb1a-or-national-interest-waiver",
    title: "EB-1A or National Interest Waiver: choosing a path",
    dek: "Two self-petitioned green card routes for professionals, compared on standard, evidence and wait times.",
    category: "Professionals",
    readMinutes: 7,
    updated: "2026-09-02",
    body: [
      { type: "p", text: "Researchers, physicians, engineers and founders often ask which of two self-petitioned green card routes suits them: EB-1A for extraordinary ability, or the EB-2 National Interest Waiver (NIW). Neither requires an employer, and both can be filed with premium processing. They test different things." },
      { type: "h2", text: "What each category asks" },
      { type: "ul", items: ["EB-1A asks whether you have risen to the very top of your field, shown through at least three of ten criteria and a final review of sustained acclaim.", "NIW asks whether your planned work has substantial merit and national importance, whether you are well positioned to advance it, and whether waiving the job offer benefits the United States on balance."] },
      { type: "p", text: "In short, EB-1A looks mainly at your past record, while NIW looks at the value of your future work and your ability to carry it out." },
      { type: "h2", text: "Eligibility floors" },
      { type: "p", text: "NIW applicants must first qualify for EB-2, through an advanced degree (or a bachelor's degree plus five years of progressive experience) or exceptional ability. EB-1A has no degree requirement." },
      { type: "h2", text: "Wait times after approval" },
      { type: "p", text: "Approval of the petition is not the green card itself. The final step depends on visa availability in the monthly Visa Bulletin. EB-1 has historically moved faster than EB-2 for many countries, although both categories can show long waits for applicants born in India or China. We check the current bulletin with each client." },
      { type: "h2", text: "Filing both" },
      { type: "p", text: "Some professionals file both petitions, using an approved EB-1A to move faster while the NIW provides a second route. Whether that is worth the cost depends on the strength of each record, which a profile review can assess." },
    ],
  },
  {
    slug: "avoiding-notario-fraud",
    title: "How to avoid immigration scams",
    dek: "Warning signs of notario fraud and unauthorized practice, and how to check who you are dealing with.",
    category: "Start here",
    readMinutes: 4,
    updated: "2026-08-20",
    body: [
      { type: "p", text: "Every year, people lose money and sometimes their immigration options to individuals who are not authorized to give legal advice. In many countries a notario is a trained lawyer. In the United States a notary public only witnesses signatures and cannot give immigration advice." },
      { type: "h2", text: "Warning signs" },
      { type: "ul", items: ["A promise of guaranteed approval", "A claim of special connections inside the government", "Pressure to sign blank forms or forms with false information", "Refusal to give you copies of what was filed", "Payment demanded in cash with no written agreement"] },
      { type: "h2", text: "Who may help you" },
      { type: "p", text: "Only licensed attorneys and accredited representatives working for organizations recognized by the Department of Justice may give immigration legal advice. You can confirm a Maryland lawyer's status with the Attorney Information System of the Maryland Judiciary." },
      { type: "h2", text: "If something went wrong" },
      { type: "p", text: "Keep every receipt and document, and seek advice from a licensed attorney quickly. Errors made in earlier filings can sometimes be corrected, and the earlier they are addressed, the more options remain." },
    ],
  },
];

export const getArticle = (slug: string) => ARTICLES.find((a) => a.slug === slug);
