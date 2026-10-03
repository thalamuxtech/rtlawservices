import type { Post } from "./types";

// Seed blog posts. Once the back office publishes posts to Firestore, the
// build uses those instead. Every factual statement points to a listed source.

export const SEED_POSTS: Post[] = [
  {
    slug: "h1b-100000-payment-status-2026",
    title: "The $100,000 H-1B payment: where things stand in October 2026",
    dek: "A September 2025 proclamation added a $100,000 payment to certain new H-1B petitions. A court order has since blocked the guidance that applied it, and a new proclamation extended the policy to 2027.",
    category: "Professionals",
    readMinutes: 6,
    published: "2026-10-03",
    updated: "2026-10-03",
    author: "RT Law Services",
    body: `For employers and professionals planning an H-1B filing, the rules around the $100,000 payment have changed several times in a year. This post sets out the sequence of events, based on official sources, and what it suggests for a filing today.

## The 2025 proclamation

On 19 September 2025, the President issued Proclamation 10973, *Restriction on Entry of Certain Nonimmigrant Workers*. Under it, new H-1B petitions filed at or after 12:01 a.m. Eastern Daylight Time on 21 September 2025 had to include an additional $100,000 payment, made through pay.gov, unless the Secretary of Homeland Security granted an exception.

On 20 October 2025, U.S. Citizenship and Immigration Services (USCIS) published guidance on which petitions the payment covered. In summary, it applied mainly to new petitions for workers outside the United States who did not hold a valid H-1B visa. It did not apply to extensions, amendments or changes of status approved inside the country.

## The court order

On 8 June 2026, the U.S. District Court for the District of Massachusetts vacated the agency guidance that implemented the payment, in *State of California v. Mullin*, No. 1:25-cv-13829. The government asked the Court of Appeals for the First Circuit to pause that order. On 24 July 2026, the First Circuit denied the request.

USCIS states that the Department of Homeland Security (DHS) disagrees with the ruling but **will comply with the court's order while it considers next steps**, and that it still plans to collect the payment if the order is later lifted.

## The 2026 extension

On 18 September 2026, the President signed Proclamation 11069, published in the Federal Register on 23 September 2026. It extends the 2025 proclamation for 12 more months, until 12:00 a.m. Eastern Daylight Time on 21 September 2027. The proclamation reports that the payment had been made for more than 700 petitions.

## What this means for a filing now

- The legal position is unsettled. The policy has been extended, while a court order blocks the guidance that applied it.
- Petitioners should check the current USCIS alert immediately before filing, because the status can change with a single court decision.
- Workers already in the United States and changing status, extending or amending, were outside the payment under the October 2025 guidance.

## The cap lottery has changed too

Separately, DHS published a final rule on 29 December 2025 that replaced the random H-1B cap selection with a weighted process favouring higher-paid, higher-skilled positions. The rule took effect on 27 February 2026 and applied to the fiscal year 2027 cap season.

This post is general information. The right approach for a specific petition depends on the worker's location, status and role, so speak with an attorney before filing.`,
    sources: [
      { title: "Presidential Proclamation on Restriction on Entry of Certain Nonimmigrant Workers (alert, updated 15 June 2026)", publisher: "U.S. Citizenship and Immigration Services", url: "https://www.uscis.gov/newsroom/alerts/presidential-proclamation-on-restriction-on-entry-of-certain-nonimmigrant-workers" },
      { title: "Proclamation 11069, Restriction on Entry of Certain Nonimmigrant Workers, 91 FR 60497", publisher: "Federal Register", url: "https://www.federalregister.gov/documents/2026/09/23/2026-19554/restriction-on-entry-of-certain-nonimmigrant-workers" },
      { title: "Weighted Selection Process for Registrants and Petitioners Seeking To File Cap-Subject H-1B Petitions", publisher: "Federal Register", url: "https://www.federalregister.gov/documents/2025/12/29/2025-23853/weighted-selection-process-for-registrants-and-petitioners-seeking-to-file-cap-subject-h-1b" },
      { title: "H-1B Specialty Occupations", publisher: "U.S. Citizenship and Immigration Services", url: "https://www.uscis.gov/working-in-the-united-states/h-1b-specialty-occupations" },
    ],
  },
  {
    slug: "automatic-ead-extensions-ended",
    title: "Automatic work permit extensions ended: how to avoid a gap",
    dek: "Since 30 October 2025, most people renewing an Employment Authorization Document no longer receive an automatic extension while the renewal is pending.",
    category: "Work",
    readMinutes: 5,
    published: "2026-10-03",
    updated: "2026-10-03",
    author: "RT Law Services",
    body: `An Employment Authorization Document (EAD) is the card that proves a person may work in the United States. For years, many people who filed a renewal on time kept working after their card expired, because the law gave them an automatic extension of up to 540 days. That changed in October 2025.

## What changed

The Department of Homeland Security (DHS) published an interim final rule in the Federal Register on 30 October 2025, effective the same day. People who file to renew an EAD **on or after 30 October 2025** no longer receive the automatic extension in most categories.

Renewals filed before that date keep the extension they were eligible for.

## The exceptions

The rule keeps extensions that are provided by law, and those given through a Federal Register notice for Temporary Protected Status (TPS) documentation. F-1 students who file on time for the STEM Optional Practical Training extension keep a separate 180-day extension.

## Who feels it most

Spouses on H-4 and other workers who renew cards regularly now face a real risk of a gap between the old card's expiry and the new card's approval. During a gap, the person must stop working.

## How to reduce the risk

- **File early.** Most renewals can be filed up to 180 days before the current card expires.
- **Check the category.** The rules differ by eligibility category, so confirm yours before filing.
- **Tell the employer early.** Human resources teams can plan coverage or leave if approval arrives late.
- **Keep the receipt notice.** It proves the date the renewal was filed.

If a gap seems likely, speak with an attorney about the timing of related filings, such as an H-4 extension filed together with the work permit.`,
    sources: [
      { title: "DHS Ends Automatic Extension of Employment Authorization", publisher: "U.S. Citizenship and Immigration Services", url: "https://www.uscis.gov/newsroom/news-releases/dhs-ends-automatic-extension-of-employment-authorization" },
      { title: "Removal of the Automatic Extension of Employment Authorization Documents (interim final rule)", publisher: "Federal Register", url: "https://www.federalregister.gov/documents/2025/10/30/2025-19702/removal-of-the-automatic-extension-of-employment-authorization-documents" },
      { title: "I-765, Application for Employment Authorization", publisher: "U.S. Citizenship and Immigration Services", url: "https://www.uscis.gov/i-765" },
    ],
  },
  {
    slug: "uscis-filing-fees-2026",
    title: "USCIS filing fees in 2026: what common applications cost",
    dek: "Government fees for the forms most families and employers file, read directly from the USCIS fee schedule in effect on 1 October 2026.",
    category: "Start here",
    readMinutes: 5,
    published: "2026-10-03",
    updated: "2026-10-03",
    author: "RT Law Services",
    body: `Government filing fees are separate from attorney fees and are paid to U.S. Citizenship and Immigration Services (USCIS). An application with the wrong fee is rejected, so the amount matters. The figures below come from Form G-1055, the USCIS fee schedule, edition dated 1 October 2026.

## Family and citizenship

- **Form I-130**, Petition for Alien Relative: $675 on paper, $625 online.
- **Form I-485**, application for a green card from inside the United States (age 14 and over): $1,440 on paper, $1,390 online.
- **Form I-765**, work permit: $520 on paper, $470 online. The fee drops to $260 for applicants with a pending I-485 filed with a fee on or after 1 April 2024.
- **Form I-751**, removing conditions on residence: $750 on paper, $700 online.
- **Form N-400**, naturalization: $760 on paper, $710 online, with a reduced fee for some household incomes.
- **Form I-864**, Affidavit of Support: no fee.

## Employment

- **Form I-140**, immigrant petition for workers: $715, plus an Asylum Program Fee of $600 for most employers, $300 for small employers and self-petitioners, and $0 for nonprofits.
- **Form I-129** for O workers: $1,055, or $530 for small employers and nonprofits, plus any additional fees that apply.
- **Form I-907**, premium processing for most I-129 and I-140 categories: $2,965, paid on top of all other fees.

## Investors

Forms I-526 and I-526E list $3,675 in the 1 October 2026 schedule. A final rule published on 30 September 2026 adjusts EB-5 fees from 30 November 2026, so investors filing after that date should confirm the new amount.

## Saving on fees

The fee schedule notes that filing online often costs $50 less. Some applicants qualify for a fee waiver (Form I-912) or a reduced fee. The USCIS fee calculator gives the exact amount for a specific case.`,
    sources: [
      { title: "Form G-1055, Fee Schedule (edition 10/01/26)", publisher: "U.S. Citizenship and Immigration Services", url: "https://www.uscis.gov/g-1055" },
      { title: "Fee Calculator", publisher: "U.S. Citizenship and Immigration Services", url: "https://www.uscis.gov/feecalculator" },
      { title: "EB-5 Fee Rule (final rule, effective 30 November 2026)", publisher: "Federal Register", url: "https://www.federalregister.gov/documents/2026/09/30/2026-20016/us-citizenship-and-immigration-services-employment-based-immigrant-visa-fifth-preference-eb-5-fee" },
    ],
  },
  {
    slug: "naturalization-eligibility-basics",
    title: "Are you ready to apply for U.S. citizenship?",
    dek: "The core eligibility rules for naturalization, explained in plain words, with the issues that most often need a closer look.",
    category: "Citizenship",
    readMinutes: 6,
    published: "2026-10-03",
    updated: "2026-10-03",
    author: "RT Law Services",
    body: `Naturalization is the process by which a lawful permanent resident (a green card holder) becomes a U.S. citizen. The application is Form N-400. Most applicants qualify on one of two timelines.

## The two timelines

- **Five years** as a permanent resident, for most applicants.
- **Three years** as a permanent resident for people married to and living with a U.S. citizen during that time, when the spouse has been a citizen for the whole period.

U.S. Citizenship and Immigration Services (USCIS) accepts applications up to 90 days before the applicant reaches the required period.

## Residence and presence

Two separate tests apply, and they are often confused:

- **Continuous residence** asks whether the person kept their home in the United States. Long trips abroad can break it. A trip of six months or more raises questions, and a trip of one year or more generally breaks continuous residence.
- **Physical presence** counts days actually spent in the country. Applicants need at least half of the required period.

## Good moral character

Officers review the applicant's conduct during the eligibility period, including taxes, child support and any arrests. Every arrest must be disclosed, even one that led to no charge. Certified court records help an officer assess it.

## The tests

The interview includes an English test (reading, writing and speaking) and a civics test on U.S. history and government. Some older long-term residents and applicants with qualifying medical conditions may receive exceptions.

## The fee

The fee schedule in effect on 1 October 2026 lists $760 for a paper N-400 and $710 online.

## When to get advice first

A short review before filing is sensible for anyone with long trips abroad, any arrest or citation, unfiled tax returns, or doubts about how they obtained their green card. Problems found at the interview are harder to fix than problems found before filing.`,
    sources: [
      { title: "Citizenship and Naturalization", publisher: "U.S. Citizenship and Immigration Services", url: "https://www.uscis.gov/citizenship/learn-about-citizenship/citizenship-and-naturalization" },
      { title: "N-400, Application for Naturalization", publisher: "U.S. Citizenship and Immigration Services", url: "https://www.uscis.gov/n-400" },
      { title: "Form G-1055, Fee Schedule (edition 10/01/26)", publisher: "U.S. Citizenship and Immigration Services", url: "https://www.uscis.gov/g-1055" },
    ],
  },
  {
    slug: "marriage-green-card-what-to-expect",
    title: "The marriage green card, step by step",
    dek: "What happens between filing and the interview when a U.S. citizen sponsors a spouse who lives in the United States.",
    category: "Family",
    readMinutes: 6,
    published: "2026-09-15",
    updated: "2026-10-03",
    author: "RT Law Services",
    body: `A U.S. citizen's spouse who entered the country lawfully can usually apply for permanent residence without leaving. Lawyers call this adjustment of status. Spouses of U.S. citizens are immediate relatives, so they do not wait for a visa number in the monthly Visa Bulletin.

## 1. The filing package

Most couples file several forms together: the petition that proves the marriage (Form I-130), the green card application (Form I-485), the Affidavit of Support (Form I-864), and often applications for a work permit and travel permission. Filing them together is called concurrent filing.

## 2. Receipts and biometrics

U.S. Citizenship and Immigration Services (USCIS) sends a receipt notice for each form, with a 13-character receipt number. Some weeks later the applicant attends a short biometrics appointment for fingerprints and a photograph.

## 3. Work and travel documents

The work permit and travel document often arrive months before the green card decision. Travelling abroad without the travel document while the case is pending can lead USCIS to treat the application as abandoned, so we advise clients to wait for it.

## 4. The affidavit of support

The sponsor's household income generally needs to reach at least 125 percent of the federal poverty guidelines for the household size. If it does not, a joint sponsor can add their income.

## 5. The interview

Most marriage cases include an interview at a USCIS field office. The officer reviews the forms under oath and asks about the relationship.

- Bring the interview notice, passports and the original marriage certificate.
- Bring recent joint evidence: lease, bank statements, insurance, photographs.
- Answer only the question asked, and say so when you do not know.

## 6. The decision

If the marriage is less than two years old at approval, the green card is conditional and valid for two years. The couple then files Form I-751 in the 90 days before it expires to receive a 10-year card.`,
    sources: [
      { title: "Green Card for Immediate Relatives of U.S. Citizen", publisher: "U.S. Citizenship and Immigration Services", url: "https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-immediate-relatives-of-us-citizen" },
      { title: "I-130, Petition for Alien Relative", publisher: "U.S. Citizenship and Immigration Services", url: "https://www.uscis.gov/i-130" },
      { title: "I-485, Application to Register Permanent Residence or Adjust Status", publisher: "U.S. Citizenship and Immigration Services", url: "https://www.uscis.gov/i-485" },
      { title: "I-864, Affidavit of Support Under Section 213A of the INA", publisher: "U.S. Citizenship and Immigration Services", url: "https://www.uscis.gov/i-864" },
      { title: "I-751, Petition to Remove Conditions on Residence", publisher: "U.S. Citizenship and Immigration Services", url: "https://www.uscis.gov/i-751" },
    ],
  },
  {
    slug: "eb1a-or-national-interest-waiver",
    title: "EB-1A or National Interest Waiver: choosing a path",
    dek: "Two self-petitioned green card routes for professionals, compared on legal standard, evidence and wait times.",
    category: "Professionals",
    readMinutes: 7,
    published: "2026-09-02",
    updated: "2026-10-03",
    author: "RT Law Services",
    body: `Researchers, physicians, engineers and founders often ask which of two self-petitioned green card routes suits them: EB-1A for extraordinary ability, or the EB-2 National Interest Waiver (NIW). Neither requires an employer, and both can be filed with premium processing. They test different things.

## What each category asks

- **EB-1A** asks whether you have risen to the very top of your field. You show either a major, internationally recognized award or at least three of ten regulatory criteria, and the officer then makes a final judgment on sustained acclaim.
- **NIW** applies the three-part test from *Matter of Dhanasar* (2016): the proposed work has substantial merit and national importance, you are well positioned to advance it, and on balance waiving the job offer and labor certification benefits the United States.

In short, EB-1A looks mainly at your past record, while NIW looks at the value of your planned work and your ability to carry it out.

## Eligibility floors

NIW applicants must first qualify for EB-2, through an advanced degree (or a bachelor's degree plus five years of progressive experience) or exceptional ability. EB-1A has no degree requirement.

## Wait times after approval

Approval of the petition is not the green card itself. The final step depends on visa availability in the monthly Visa Bulletin published by the U.S. Department of State. Applicants born in high-demand countries, such as India or China, often wait longer in both categories. We check the current bulletin with each client.

## Filing both

Some professionals file both petitions. Whether that is worth the cost depends on the strength of each record, which a profile review can assess.`,
    sources: [
      { title: "Employment-Based Immigration: First Preference EB-1", publisher: "U.S. Citizenship and Immigration Services", url: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1" },
      { title: "Employment-Based Immigration: Second Preference EB-2", publisher: "U.S. Citizenship and Immigration Services", url: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-second-preference-eb-2" },
      { title: "Matter of Dhanasar, 26 I&N Dec. 884 (AAO 2016)", publisher: "U.S. Department of Justice", url: "https://www.justice.gov/eoir/page/file/920996/download" },
      { title: "The Visa Bulletin", publisher: "U.S. Department of State", url: "https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html" },
    ],
  },
  {
    slug: "avoiding-notario-fraud",
    title: "How to avoid immigration scams",
    dek: "Warning signs of notario fraud and unauthorized practice, and how to check who you are dealing with.",
    category: "Start here",
    readMinutes: 4,
    published: "2026-08-20",
    updated: "2026-10-03",
    author: "RT Law Services",
    body: `Every year, people lose money and sometimes their immigration options to individuals who are not authorized to give legal advice. In many countries a notario is a trained lawyer. In the United States a notary public only witnesses signatures and cannot give immigration advice.

## Warning signs

- A promise of guaranteed approval
- A claim of special connections inside the government
- Pressure to sign blank forms or forms with false information
- Refusal to give you copies of what was filed
- Payment demanded in cash with no written agreement

## Who may help you

Only licensed attorneys and accredited representatives working for organizations recognized by the Department of Justice may give immigration legal advice. The Department of Justice publishes a list of recognized organizations and accredited representatives.

## If something went wrong

Keep every receipt and document, and seek advice from a licensed attorney quickly. Errors in earlier filings can sometimes be corrected, and the earlier they are addressed, the more options remain.`,
    sources: [
      { title: "Common Scams", publisher: "U.S. Citizenship and Immigration Services", url: "https://www.uscis.gov/scams-fraud-and-misconduct/avoid-scams/common-scams" },
      { title: "Find Legal Representation", publisher: "U.S. Department of Justice, Executive Office for Immigration Review", url: "https://www.justice.gov/eoir/find-legal-representation" },
    ],
  },
];
