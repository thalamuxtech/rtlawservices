// Practice content. Every page spells out acronyms at first use, because each
// page can be a visitor's first entry point. Timelines are hedged ranges, not promises.

import { applyOverrides, withOverrides, type Pages } from "./pages";

export type Track = "individuals" | "professionals" | "other";

export type Faq = { q: string; a: string };

export type Expertise = {
  slug: string;
  track: Track;
  title: string;
  codes: string;
  summary: string;
  intro: string;
  newToThis?: string;
  whoFor: string[];
  howWeHelp: { title: string; text: string }[];
  forms: { code: string; name: string }[];
  criteria?: { title: string; intro: string; items: string[]; note?: string };
  timeline: string;
  checklist: string[];
  faqs: Faq[];
  icon: "users" | "flag" | "briefcase" | "scale" | "globe" | "star" | "award" | "building" | "plane" | "trending" | "factory" | "landmark";
};

export const BASE_EXPERTISE: Expertise[] = [
  {
    slug: "family",
    track: "individuals",
    icon: "users",
    title: "Family green cards",
    codes: "I-130, I-485",
    summary: "Bring a spouse, parent, child or sibling to the United States, or help them become permanent residents.",
    intro:
      "U.S. citizens and lawful permanent residents (green card holders) can sponsor certain relatives for permanent residence. The path depends on the relationship, on the sponsor's status and on where the relative lives today. We assess which category applies, prepare a complete filing and stay with the family through the interview.",
    newToThis:
      "A green card is the common name for lawful permanent residence, the status that lets a person live and work in the United States without a time limit. Family sponsorship is the most common route to one.",
    whoFor: [
      "U.S. citizens married to a foreign national, in the United States or abroad",
      "U.S. citizens aged 21 or older sponsoring a parent",
      "Green card holders sponsoring a spouse or unmarried child",
      "Families where the relative entered on a visa and now wishes to stay",
      "Couples who received a conditional, two-year green card and need to remove the conditions",
    ],
    howWeHelp: [
      { title: "Eligibility review", text: "We confirm the category, check for issues such as past overstays or travel history, and explain the likely route before any form is filed." },
      { title: "Evidence of the relationship", text: "We assemble civil documents and, for marriages, the joint records that show a genuine relationship." },
      { title: "Financial sponsorship", text: "We prepare the Affidavit of Support (Form I-864) and add a joint sponsor when the household income falls short." },
      { title: "Interview preparation", text: "We rehearse the questions officers tend to ask and attend the interview where appropriate." },
    ],
    forms: [
      { code: "I-130", name: "Petition for Alien Relative" },
      { code: "I-485", name: "Application to Register Permanent Residence or Adjust Status" },
      { code: "I-864", name: "Affidavit of Support" },
      { code: "I-765", name: "Application for Employment Authorization" },
      { code: "I-131", name: "Application for Travel Documents" },
      { code: "I-751", name: "Petition to Remove Conditions on Residence" },
    ],
    timeline:
      "For spouses, parents and unmarried children under 21 of U.S. citizens, many cases filed inside the United States take roughly 10 to 18 months from filing to decision, based on our observations of recent processing. Other family categories wait for a visa number under the monthly Visa Bulletin, which can add years. Current U.S. Citizenship and Immigration Services (USCIS) processing times are published on the official USCIS website.",
    checklist: [
      "Sponsor's proof of U.S. citizenship or permanent residence",
      "Birth certificates and, for spouses, the marriage certificate",
      "Proof that any prior marriages ended (divorce decrees, death certificates)",
      "Passport, visa and I-94 arrival record of the relative",
      "Recent federal tax returns or transcripts of the sponsor",
      "Joint evidence of the marriage: lease or deed, bank accounts, insurance, photographs",
      "Two passport-style photographs of each applicant",
    ],
    faqs: [
      { q: "Who counts as an immediate relative?", a: "Under U.S. immigration law, immediate relatives are the spouse of a U.S. citizen, unmarried children under 21 of a U.S. citizen, and parents of a U.S. citizen who is at least 21. Immediate relatives are not subject to the annual limits that create waiting lines in other family categories." },
      { q: "Can my spouse apply for a green card without leaving the United States?", a: "In many cases, yes. A spouse of a U.S. citizen who entered the country lawfully (for example, with a visa and an inspection at the border) can usually file for adjustment of status from inside the United States, even after the visa has expired. The facts of the entry matter, so we review them first." },
      { q: "What is the Affidavit of Support?", a: "Form I-864 is a contract in which the sponsor promises financial support. The sponsor's household income generally needs to reach at least 125 percent of the federal poverty guidelines for the household size. If it does not, a joint sponsor can add their income." },
      { q: "Can my relative work while the case is pending?", a: "An applicant who files for adjustment of status can also apply for an Employment Authorization Document (EAD), a work permit card. Work begins only once the card is approved." },
      { q: "Is the green card permanent from the start?", a: "If the marriage is less than two years old when the green card is approved, the spouse receives a conditional green card valid for two years. The couple then files Form I-751 during the 90 days before it expires to receive a 10-year card." },
      { q: "What happens at the interview?", a: "A USCIS officer reviews the forms under oath, checks original documents and, for marriages, asks about the relationship. Preparation reduces stress and helps answers stay consistent with the record." },
      { q: "What if my relative lives abroad?", a: "The case follows consular processing: after USCIS approves the petition, the National Visa Center collects documents and the U.S. embassy or consulate holds the interview. See our page on family abroad." },
      { q: "Do you handle cases with a prior overstay or a past denial?", a: "Yes. These cases need careful review because the right strategy depends on how the person entered, how long they stayed and what was filed before. We explain the options and any risks plainly." },
    ],
  },
  {
    slug: "citizenship",
    track: "individuals",
    icon: "flag",
    title: "Citizenship",
    codes: "N-400, N-600",
    summary: "Become a U.S. citizen through naturalization, or confirm citizenship your child already holds.",
    intro:
      "Naturalization is the process by which a green card holder becomes a U.S. citizen. It requires a period of permanent residence, physical presence in the country, good moral character, and passing English and civics tests. We review eligibility first, because issues such as long trips abroad, tax filings or old arrests deserve attention before filing.",
    newToThis:
      "Citizenship gives the right to vote, to hold a U.S. passport and to sponsor more relatives. Once naturalized, a person no longer needs to renew a green card.",
    whoFor: [
      "Green card holders with five years of permanent residence",
      "Green card holders married to, and living with, a U.S. citizen for three years",
      "Applicants with long trips abroad, past arrests or tax questions who want a review first",
      "Parents who want proof that a child already became a citizen automatically",
    ],
    howWeHelp: [
      { title: "Eligibility check", text: "We count residence and physical presence days, review travel history and flag anything that needs an explanation." },
      { title: "Clean, consistent application", text: "We prepare Form N-400 so that every answer matches earlier immigration records." },
      { title: "Test and interview preparation", text: "We help you prepare for the English and civics tests and practise the interview questions." },
      { title: "Children's citizenship", text: "We file Form N-600 to document citizenship for children who acquired or derived it through a parent." },
    ],
    forms: [
      { code: "N-400", name: "Application for Naturalization" },
      { code: "N-600", name: "Application for Certificate of Citizenship" },
      { code: "N-648", name: "Medical Certification for Disability Exceptions" },
    ],
    timeline:
      "Many naturalization cases take roughly 6 to 12 months from filing to the oath ceremony, based on recent processing patterns. Times vary by USCIS field office, and current figures appear on the official U.S. Citizenship and Immigration Services (USCIS) processing-times page.",
    checklist: [
      "Green card (front and back)",
      "List of every trip outside the United States during the eligibility period",
      "Marriage certificate and spouse's proof of citizenship, if filing on the three-year basis",
      "Federal tax return transcripts",
      "Certified court records for any arrest, citation or charge, even if dismissed",
      "Proof of child support payments, if applicable",
    ],
    faqs: [
      { q: "When can I apply?", a: "Most applicants can file after five years as a permanent resident, or three years if married to and living with a U.S. citizen during that time. USCIS accepts applications up to 90 days before the anniversary." },
      { q: "Do trips abroad affect eligibility?", a: "They can. A single trip of six months or more raises questions about continuous residence, and a trip of one year or more generally breaks it. Applicants also need physical presence in the United States for at least half of the eligibility period." },
      { q: "What are the tests?", a: "The interview includes an English test (reading, writing and speaking) and a civics test on U.S. history and government. Some older long-term residents and applicants with qualifying disabilities may receive exceptions." },
      { q: "Does an old arrest prevent citizenship?", a: "Not necessarily. The answer depends on the offence, its outcome and when it happened. Every arrest must be disclosed, even when a charge was dismissed, so we obtain the court records and assess them before filing." },
      { q: "Can my children become citizens with me?", a: "Children under 18 who hold green cards and live in the legal and physical custody of a parent who naturalizes generally become citizens automatically. Form N-600 provides a certificate that proves it." },
      { q: "Will I have to give up my other citizenship?", a: "U.S. law does not require it, but your other country's law might. Check with that country's authorities before the oath." },
      { q: "What is the filing fee?", a: "The fee schedule in effect as of 1 October 2026 lists $760 for paper filing and $710 for online filing. Reduced fees and waivers exist for some income levels. See our filing fees page for the source." },
      { q: "What happens after approval?", a: "You attend an oath ceremony and receive a Certificate of Naturalization. You can then apply for a U.S. passport." },
    ],
  },
  {
    slug: "spousal-work-authorization",
    track: "individuals",
    icon: "briefcase",
    title: "Spouse work permits",
    codes: "H-4, L-2, EAD",
    summary: "Work authorization for spouses of H-1B and L-1 professionals.",
    intro:
      "Spouses of some work-visa holders may work in the United States, under rules that differ by category. H-4 spouses of H-1B workers need an Employment Authorization Document (EAD) and qualify only in certain situations. L-2 spouses of L-1 workers are authorized to work because of their status. We confirm eligibility, file on time and help employers understand the documents.",
    newToThis:
      "An Employment Authorization Document, or EAD, is a card issued by U.S. Citizenship and Immigration Services that proves a person may work in the United States for a set period.",
    whoFor: [
      "H-4 spouses whose H-1B partner has an approved immigrant petition (Form I-140)",
      "H-4 spouses whose H-1B partner extended status beyond six years under the AC21 rules",
      "L-2 spouses who need documents that satisfy an employer's I-9 verification",
      "Spouses facing a gap between an expiring card and a new job",
    ],
    howWeHelp: [
      { title: "Eligibility and timing", text: "We confirm the basis for eligibility and plan the filing date, since renewal applications filed on or after 30 October 2025 no longer receive an automatic extension." },
      { title: "Combined filings", text: "Where it helps, we file the H-4 extension and the work permit application together." },
      { title: "Employer communication", text: "We explain the documents to human resources teams so the spouse can start work as soon as authorization allows." },
    ],
    forms: [
      { code: "I-765", name: "Application for Employment Authorization" },
      { code: "I-539", name: "Application to Extend or Change Nonimmigrant Status" },
    ],
    timeline:
      "Work permit applications commonly take a few months, and times shift often. Because automatic extensions ended for most renewals filed on or after 30 October 2025, we recommend filing a renewal as early as the rules allow, which is generally up to 180 days before the current card expires.",
    checklist: [
      "Marriage certificate",
      "Spouse's approval notice (I-797) and, for H-4 EAD, the approved I-140 or AC21 extension evidence",
      "Current I-94 records for both spouses",
      "Passport and current EAD card, if renewing",
      "Two passport-style photographs",
    ],
    faqs: [
      { q: "Can every H-4 spouse work?", a: "No. An H-4 spouse may apply for work authorization when the H-1B spouse has an approved Form I-140 immigrant petition, or has extended H-1B status beyond the usual six years under the American Competitiveness in the 21st Century Act (AC21)." },
      { q: "Do L-2 spouses need a work permit card?", a: "L-2 spouses are authorized to work incident to their status. An I-94 record showing the L-2 spouse designation, together with an unexpired passport, can serve as evidence for employment verification. Some spouses still choose to hold an EAD card for convenience." },
      { q: "Will my card be extended automatically while the renewal is pending?", a: "For most renewal applications filed on or after 30 October 2025, no. A Department of Homeland Security rule ended the automatic extension, so early filing matters." },
      { q: "When can I file a renewal?", a: "Generally up to 180 days before the current card expires." },
      { q: "Can I start a business on an H-4 EAD?", a: "An H-4 EAD is not tied to one employer, so self-employment is generally permitted while the card is valid. The visa status itself still depends on the H-1B spouse." },
      { q: "What if my spouse changes employers?", a: "A new H-1B employer files a new petition, and the H-4 status and EAD eligibility should be reviewed at the same time." },
    ],
  },
  {
    slug: "appeals-waivers",
    track: "individuals",
    icon: "scale",
    title: "Denied or delayed",
    codes: "RFE, I-290B, I-601A",
    summary: "Responses to requests for evidence, motions, appeals and waivers of inadmissibility.",
    intro:
      "A request for more evidence, a notice of intent to deny or a denial is not always the end of a case. Deadlines are short and the right response depends on exactly what the officer found missing. We review the notice and the full record, then choose between a response, a motion, an appeal, a new filing or a waiver.",
    newToThis:
      "A Request for Evidence (RFE) asks for documents the officer considers missing. A Notice of Intent to Deny (NOID) warns that the officer plans to deny the case. A waiver asks the government to forgive a ground of inadmissibility, such as past unlawful presence.",
    whoFor: [
      "Applicants who received an RFE or NOID",
      "Applicants whose case was denied and who are within the deadline to act",
      "Families affected by the 3-year or 10-year unlawful presence bars",
      "Cases stuck well beyond normal processing times",
    ],
    howWeHelp: [
      { title: "Notice review", text: "We read the notice against the record to identify exactly what the officer needs." },
      { title: "Targeted response", text: "We gather the missing evidence and write a legal argument that addresses each point." },
      { title: "Motions and appeals", text: "Where an officer made an error, we file a motion to reopen or reconsider, or an appeal to the right body." },
      { title: "Waivers", text: "We prepare waiver applications built on documented hardship to qualifying relatives." },
    ],
    forms: [
      { code: "I-290B", name: "Notice of Appeal or Motion" },
      { code: "I-601", name: "Application for Waiver of Grounds of Inadmissibility" },
      { code: "I-601A", name: "Application for Provisional Unlawful Presence Waiver" },
      { code: "I-212", name: "Application for Permission to Reapply for Admission" },
    ],
    timeline:
      "An RFE response is due by the date printed on the notice. Most motions and appeals of U.S. Citizenship and Immigration Services (USCIS) decisions must be filed within 30 days of the decision, or 33 days if it was mailed. Waiver applications often take a year or more to decide.",
    checklist: [
      "The full notice, including all pages",
      "A copy of everything filed in the original case",
      "Any new evidence related to the issue raised",
      "For waivers: evidence of hardship to the qualifying relative (medical, financial, family, country conditions)",
    ],
    faqs: [
      { q: "How long do I have to answer an RFE?", a: "The deadline is printed on the notice. USCIS generally does not extend it, so we recommend sending us the notice as soon as it arrives." },
      { q: "What is the difference between a motion and an appeal?", a: "A motion asks the same office to look again, either because of new facts (motion to reopen) or a legal error (motion to reconsider). An appeal asks a higher body, such as the Administrative Appeals Office, to review the decision." },
      { q: "Where does a family petition appeal go?", a: "Denials of Form I-130 petitions are generally appealed to the Board of Immigration Appeals, not through Form I-290B." },
      { q: "What are the unlawful presence bars?", a: "A person who stays in the United States unlawfully for more than 180 days and then leaves can face a 3-year bar to returning. More than one year can lead to a 10-year bar. Waivers exist for some applicants with a qualifying U.S. citizen or permanent resident spouse or parent." },
      { q: "What is the provisional waiver?", a: "Form I-601A lets certain applicants ask for a waiver of the unlawful presence bars before leaving the United States for a consular interview, which reduces time spent apart from family." },
      { q: "What does extreme hardship mean?", a: "It means hardship to a qualifying relative beyond the ordinary difficulties of separation or relocation. Health, finances, family ties and conditions in the other country all count, and documentation carries the case." },
      { q: "Is it better to refile than to appeal?", a: "Sometimes. If the denial came from missing evidence that is now available, a new filing may be faster. We compare both routes for each case." },
      { q: "My case has been pending far too long. What can be done?", a: "Options include service requests, case inquiries, congressional assistance and, in some situations, a federal court action to compel a decision. We review which step fits the delay." },
    ],
  },
  {
    slug: "consular-processing",
    track: "individuals",
    icon: "plane",
    title: "Family abroad",
    codes: "NVC, DS-260",
    summary: "Immigrant visas for relatives living outside the United States, from petition to embassy interview.",
    intro:
      "When a sponsored relative lives abroad, the green card process runs through the U.S. Department of State. After approval of the petition, the National Visa Center (NVC) collects forms and documents, and a U.S. embassy or consulate interviews the applicant. We prepare families for each stage, including those in different time zones from us.",
    newToThis:
      "Consular processing means applying for an immigrant visa at a U.S. embassy or consulate abroad. The green card arrives by mail after the person enters the United States on that visa.",
    whoFor: [
      "U.S. citizens and green card holders sponsoring relatives abroad",
      "Families with documents from more than one country or with spelling differences",
      "Applicants preparing for an embassy interview",
    ],
    howWeHelp: [
      { title: "Document readiness", text: "We check civil documents against the Department of State's country-specific requirements before submission." },
      { title: "National Visa Center stage", text: "We complete the online immigrant visa application (Form DS-260) and the financial documents." },
      { title: "Interview preparation", text: "We prepare applicants by video, in their time zone." },
    ],
    forms: [
      { code: "I-130", name: "Petition for Alien Relative" },
      { code: "DS-260", name: "Immigrant Visa Electronic Application" },
      { code: "I-864", name: "Affidavit of Support" },
    ],
    timeline:
      "For immediate relatives of U.S. citizens, the full process often takes around 12 to 20 months, based on our observations, and depends on the embassy's interview backlog. Family preference categories also wait for the Visa Bulletin.",
    checklist: [
      "Birth certificate and passport of the applicant",
      "Marriage and divorce records, as applicable",
      "Police certificates from countries of residence, as required by the Department of State",
      "Sponsor's tax records and Affidavit of Support",
      "Medical examination by an embassy-approved panel physician",
    ],
    faqs: [
      { q: "What does the National Visa Center do?", a: "The National Visa Center, part of the U.S. Department of State, receives approved petitions, collects fees, forms and civil documents, and schedules the interview once the case is complete." },
      { q: "Who performs the medical exam?", a: "Only a panel physician approved by the U.S. embassy or consulate may perform it." },
      { q: "What if names are spelled differently across documents?", a: "We address discrepancies before submission, often with affidavits or corrected records, because unresolved differences can delay the interview." },
      { q: "When does the green card arrive?", a: "After entry on the immigrant visa and payment of the USCIS immigrant fee, U.S. Citizenship and Immigration Services mails the card to the U.S. address on file." },
      { q: "Can you attend the embassy interview?", a: "Attorneys generally cannot attend consular interviews. We prepare the applicant in advance and remain available to the family." },
      { q: "What is administrative processing?", a: "It is additional review after the interview, sometimes for security checks or missing documents. Its length varies and the consulate controls it." },
    ],
  },
  {
    slug: "extraordinary-ability",
    track: "professionals",
    icon: "star",
    title: "Extraordinary ability",
    codes: "O-1, EB-1A, EB-1B",
    summary: "Visas and green cards for researchers, founders, artists, athletes and leaders with distinguished records.",
    intro:
      "The O-1 visa and the EB-1A green card reward people at the top of their field. The EB-1B green card serves outstanding professors and researchers. Each category has its own legal standard and list of evidentiary criteria, and the strength of a petition depends on how evidence is selected and explained. We map a client's record to the criteria, plan any missing evidence and write the petition.",
    whoFor: [
      "Scientists, engineers and physicians with publications, citations or patents",
      "Founders and executives with funding, press coverage or high pay",
      "Artists, performers and creative professionals with critical recognition",
      "Athletes and coaches with national or international results",
      "Professors and researchers with offers from universities or research employers",
    ],
    howWeHelp: [
      { title: "Profile review", text: "We assess the record against each criterion and give a candid view of strength and gaps." },
      { title: "Evidence strategy", text: "We plan expert letters, independent documentation and comparative evidence such as salary data." },
      { title: "Petition writing", text: "We write a structured legal brief that connects every exhibit to a criterion and to the overall standard." },
      { title: "Premium processing", text: "Where available, we use premium processing for a faster decision window." },
    ],
    forms: [
      { code: "I-129", name: "Petition for a Nonimmigrant Worker (O-1)" },
      { code: "I-140", name: "Immigrant Petition for Alien Workers (EB-1A, EB-1B)" },
      { code: "I-907", name: "Request for Premium Processing Service" },
    ],
    criteria: {
      title: "The EB-1A criteria in plain words",
      intro:
        "An EB-1A applicant shows either a major, internationally recognized award or at least three of the ten criteria below. Meeting three is the first step. Officers then make a final merits decision on whether the full record shows sustained acclaim, following the two-step approach described in Kazarian v. USCIS (2010).",
      items: [
        "Nationally or internationally recognized prizes or awards for excellence",
        "Membership in associations that require outstanding achievement",
        "Published material about you in professional or major media",
        "Judging the work of others, such as peer review",
        "Original contributions of major significance to the field",
        "Authorship of scholarly articles",
        "Display of your work at artistic exhibitions or showcases",
        "A leading or critical role for distinguished organizations",
        "A high salary compared with others in the field",
        "Commercial success in the performing arts",
      ],
      note: "O-1A uses a similar list of eight criteria, of which three are required, and requires a U.S. employer or agent as petitioner.",
    },
    timeline:
      "With premium processing, U.S. Citizenship and Immigration Services (USCIS) commits to act on O-1 and EB-1A petitions within a short, published window. Evidence preparation usually takes longer than the decision itself, commonly 4 to 10 weeks depending on the record.",
    checklist: [
      "Current CV with a full list of publications, patents, awards and media",
      "Citation records (for example, a Google Scholar profile)",
      "Letters or contact details for independent experts",
      "Evidence of judging, peer review or panel service",
      "Pay records and salary comparison data",
      "For O-1: the U.S. employment or agency agreement and an itinerary",
    ],
    faqs: [
      { q: "Do I need a job offer for EB-1A?", a: "No. EB-1A allows self-petitioning, though the applicant must show they plan to keep working in the field in the United States." },
      { q: "What is the difference between O-1 and EB-1A?", a: "O-1 is a temporary work visa and needs a U.S. petitioner. EB-1A is a green card category and allows self-petitioning. Many clients start with O-1 and later file EB-1A." },
      { q: "How many citations do I need?", a: "There is no fixed number. Officers look at what the citations show about impact. A focused argument with strong independent letters can outweigh raw counts." },
      { q: "What is premium processing?", a: "An optional service in which USCIS commits to act within a set period for an extra fee. As of 1 October 2026 the fee schedule lists $2,965 for O-1 and EB-1 petitions." },
      { q: "Can my spouse and children come with me?", a: "Yes. Spouses and unmarried children under 21 can accompany O-1 holders in O-3 status and EB-1 applicants as derivatives." },
      { q: "Do founders qualify for O-1?", a: "Often, yes. Funding from established investors, press coverage, judging roles and a critical role in a distinguished company can all support the case. The company itself can act as petitioner." },
      { q: "What is EB-1B?", a: "EB-1B is for outstanding professors and researchers with international recognition and at least three years of experience. It requires a qualifying job offer and at least two of six criteria." },
      { q: "Can a request for evidence (RFE) be avoided?", a: "No method guarantees it. A well-organized petition that addresses each criterion with independent evidence leaves fewer gaps for an officer to question." },
    ],
  },
  {
    slug: "national-interest-waiver",
    track: "professionals",
    icon: "award",
    title: "National Interest Waiver",
    codes: "EB-2 NIW",
    summary: "A self-petitioned green card for advanced-degree professionals whose work benefits the United States.",
    intro:
      "The National Interest Waiver (NIW) lets a qualified professional skip the job offer and labor certification normally required in the EB-2 category. It suits researchers, physicians, engineers and entrepreneurs whose work carries national importance. We build the petition around the legal test set in Matter of Dhanasar (2016).",
    whoFor: [
      "Holders of a U.S. master's degree or higher, or a foreign equivalent",
      "Holders of a bachelor's degree plus five years of progressive experience",
      "Professionals with exceptional ability in the sciences, arts or business",
      "Early-career researchers with work that has clear public value",
    ],
    howWeHelp: [
      { title: "Proposed endeavor", text: "We define the specific work you plan to do in the United States, in terms an officer can assess." },
      { title: "National importance", text: "We document why the work matters beyond one employer, using government priorities, data and expert views." },
      { title: "Positioning", text: "We show your record, plans and progress make you well positioned to advance the work." },
      { title: "Balancing", text: "We explain why waiving the job offer benefits the United States on balance." },
    ],
    forms: [
      { code: "I-140", name: "Immigrant Petition for Alien Workers" },
      { code: "I-907", name: "Request for Premium Processing Service" },
      { code: "I-485", name: "Application to Adjust Status (when a visa number is available)" },
    ],
    criteria: {
      title: "The three-part Dhanasar test",
      intro: "Officers grant the waiver when the petition shows all three elements:",
      items: [
        "The proposed endeavor has both substantial merit and national importance",
        "The applicant is well positioned to advance the proposed endeavor",
        "On balance, waiving the job offer and labor certification would benefit the United States",
      ],
      note: "The applicant must also qualify for EB-2 through an advanced degree or exceptional ability.",
    },
    timeline:
      "Premium processing is available for NIW petitions at the fee in the current U.S. Citizenship and Immigration Services (USCIS) schedule. After approval, the wait for a green card depends on the Visa Bulletin for the applicant's country of birth, which can be long for some countries.",
    checklist: [
      "Degree certificates and transcripts, with evaluations for foreign degrees",
      "CV, publications, citations and patents",
      "A short description of your planned work in the United States",
      "Letters from independent experts and users of your work",
      "Evidence of funding, adoption, media or government interest",
    ],
    faqs: [
      { q: "Do I need an employer?", a: "No. NIW applicants can self-petition, which is one reason the category suits researchers and entrepreneurs." },
      { q: "Can a recent graduate qualify?", a: "Possibly. Officers assess the endeavor and the applicant's positioning, not seniority alone. Strong evidence of progress and support matters more than years in the field." },
      { q: "NIW or EB-1A?", a: "EB-1A asks for top-of-field acclaim, while NIW focuses on the national importance of future work. Some clients file both. We assess which is stronger for the record." },
      { q: "Why does my country of birth matter?", a: "Green card numbers are limited per country each year. Applicants born in high-demand countries such as India or China may wait longer for a visa number after approval." },
      { q: "Can my family be included?", a: "Yes. A spouse and unmarried children under 21 can receive green cards as derivatives." },
      { q: "Is premium processing worth it?", a: "It shortens the wait for a decision on the petition, which helps when status deadlines or visa availability matter. It does not change the Visa Bulletin wait." },
    ],
  },
  {
    slug: "h-1b",
    track: "professionals",
    icon: "building",
    title: "H-1B professionals",
    codes: "H-1B, LCA",
    summary: "Specialty occupation visas for degree-holding professionals and the employers who hire them.",
    intro:
      "The H-1B visa allows U.S. employers to hire professionals in specialty occupations, which are jobs that normally require at least a bachelor's degree in a specific field. Most new H-1B workers enter through an annual registration and selection process. We advise employers and employees on registrations, petitions, transfers, extensions and recent policy changes.",
    whoFor: [
      "Employers registering candidates in the annual H-1B selection",
      "Professionals changing employers (H-1B transfer)",
      "Workers extending status, including beyond six years",
      "Universities and research organizations hiring cap-exempt workers",
    ],
    howWeHelp: [
      { title: "Specialty occupation analysis", text: "We align the job duties and degree requirements so the position meets the legal standard." },
      { title: "Labor Condition Application", text: "We prepare the Labor Condition Application (LCA) with the Department of Labor, including the prevailing wage." },
      { title: "Petition and policy review", text: "We check each case against current rules, including the weighted cap selection and the H-1B proclamations of 2025 and 2026." },
    ],
    forms: [
      { code: "LCA", name: "Labor Condition Application (ETA-9035)" },
      { code: "I-129", name: "Petition for a Nonimmigrant Worker" },
      { code: "I-907", name: "Request for Premium Processing Service" },
    ],
    timeline:
      "Cap registration takes place each spring, and selected cases may file from 1 April for an October start. Since the fiscal year 2027 season, selection is weighted toward higher-paid positions under a rule effective 27 February 2026. Transfers and extensions can be filed year-round, and premium processing gives a decision window set by U.S. Citizenship and Immigration Services (USCIS).",
    checklist: [
      "Degree certificates and transcripts, with evaluations for foreign degrees",
      "Detailed job description and offer letter",
      "Passport, visa and I-94 records",
      "Recent pay statements, for transfers and extensions",
    ],
    faqs: [
      { q: "What counts as a specialty occupation?", a: "A role that normally requires at least a bachelor's degree, or its equivalent, in a specific specialty related to the job." },
      { q: "Does the $100,000 payment apply to my case?", a: "The position is unsettled. A September 2025 proclamation added a $100,000 payment for certain new H-1B petitions, mainly for workers outside the United States. On 8 June 2026 a federal court vacated the guidance that applied it, and on 24 July 2026 the appeals court declined to pause that order, so USCIS states it is complying with the court while the government considers next steps. A new proclamation of 18 September 2026 extends the policy to 21 September 2027. We check the current USCIS alert before every filing. See our blog post on the payment for the sources." },
      { q: "Can I change employers?", a: "Yes. A new employer files a petition, and in many cases the worker can start once it is filed, under the portability rules." },
      { q: "What happens after six years?", a: "Workers with a pending labor certification or an approved immigrant petition can often extend beyond six years under the American Competitiveness in the 21st Century Act (AC21)." },
      { q: "Which employers are cap-exempt?", a: "Institutions of higher education, their affiliated nonprofits, and nonprofit or government research organizations are generally exempt from the annual cap." },
      { q: "Can my spouse work?", a: "In some situations. See our page on spouse work permits for the H-4 rules." },
    ],
  },
  {
    slug: "l-1",
    track: "professionals",
    icon: "globe",
    title: "Intracompany transfers",
    codes: "L-1A, L-1B, EB-1C",
    summary: "Transfers for managers, executives and specialists of multinational companies, including new U.S. offices.",
    intro:
      "The L-1 visa lets a multinational company transfer an employee to a related U.S. office. L-1A covers managers and executives, and L-1B covers employees with specialized knowledge. Companies opening their first U.S. office can also use the category. The L-1A path often leads to a green card through the EB-1C category.",
    whoFor: [
      "Managers and executives of companies with operations abroad",
      "Specialists with knowledge of the company's products or processes",
      "Foreign companies opening a U.S. subsidiary, branch or affiliate",
    ],
    howWeHelp: [
      { title: "Corporate relationship", text: "We document the qualifying relationship between the foreign and U.S. entities." },
      { title: "Role analysis", text: "We describe managerial, executive or specialized duties in the detail officers expect." },
      { title: "New office petitions", text: "We prepare the lease, structure, staffing plan and business plan for a first U.S. office." },
      { title: "Green card planning", text: "We plan the EB-1C petition alongside the L-1 where it fits." },
    ],
    forms: [
      { code: "I-129", name: "Petition for a Nonimmigrant Worker (L-1)" },
      { code: "I-140", name: "Immigrant Petition for Alien Workers (EB-1C)" },
    ],
    timeline:
      "Premium processing is available for L-1 petitions. New office approvals are usually granted for one year, followed by an extension that shows the office has grown.",
    checklist: [
      "Organizational charts for the foreign and U.S. entities",
      "Evidence of ownership and the corporate relationship",
      "Proof of one continuous year of employment abroad within the last three years",
      "For new offices: lease, business plan and funding evidence",
    ],
    faqs: [
      { q: "How long must I have worked abroad?", a: "At least one continuous year within the three years before the petition, for a qualifying related company." },
      { q: "How long can I stay?", a: "L-1A allows up to seven years in total and L-1B up to five years." },
      { q: "Can a small company use L-1?", a: "Yes, if the corporate relationship and the role qualify. Officers look closely at whether a manager will manage people or an essential function, not only perform daily tasks." },
      { q: "What is EB-1C?", a: "A green card category for multinational managers and executives. It does not require labor certification." },
      { q: "Can my spouse work?", a: "L-2 spouses are authorized to work incident to status. See our page on spouse work permits." },
      { q: "Is there an extra fee for large employers?", a: "Petitioners with 50 or more U.S. employees, more than half of whom hold H-1B or L-1 status, pay an additional $4,500 under Public Law 114-113, according to the current fee schedule." },
    ],
  },
  {
    slug: "investors-founders",
    track: "professionals",
    icon: "trending",
    title: "Investors and founders",
    codes: "E-2, EB-5",
    summary: "Investment-based visas and green cards for entrepreneurs and investors.",
    intro:
      "Investors can reach the United States through two main routes. The E-2 treaty investor visa suits nationals of treaty countries who invest in and direct a U.S. business. The EB-5 program offers a green card for a qualifying investment that creates U.S. jobs. We assess eligibility, structure the investment documentation and coordinate with business advisers.",
    whoFor: [
      "Nationals of E-2 treaty countries buying or starting a U.S. business",
      "Investors seeking permanent residence through EB-5",
      "Founders comparing investor routes with O-1 or National Interest Waiver options",
    ],
    howWeHelp: [
      { title: "Route comparison", text: "We compare E-2, EB-5, O-1 and NIW options against the client's nationality, capital and goals." },
      { title: "Source of funds", text: "We document the lawful source and path of investment funds, which officers examine closely." },
      { title: "Business documentation", text: "We prepare business plans and corporate records that meet the legal standard." },
    ],
    forms: [
      { code: "DS-160", name: "Nonimmigrant Visa Application (E-2, at a consulate)" },
      { code: "I-526", name: "Immigrant Petition by Standalone Investor" },
      { code: "I-526E", name: "Immigrant Petition by Regional Center Investor" },
      { code: "I-829", name: "Petition to Remove Conditions (EB-5)" },
    ],
    criteria: {
      title: "Key EB-5 requirements",
      intro: "Under the EB-5 Reform and Integrity Act of 2022, the main thresholds are:",
      items: [
        "A standard minimum investment of $1,050,000",
        "A reduced minimum of $800,000 in a targeted employment area or an infrastructure project",
        "Creation of at least 10 full-time U.S. jobs per investor",
        "Lawful source of all invested funds",
      ],
      note: "E-2 eligibility depends on a treaty between the United States and the investor's country of nationality. Some countries, including Nigeria, do not hold E-2 treaty status, so we review alternatives early.",
    },
    timeline:
      "E-2 visas are processed at U.S. consulates and timelines depend on the post. EB-5 petitions often take a year or more, and investors receive a conditional two-year green card before filing to remove conditions.",
    checklist: [
      "Passport and proof of nationality",
      "Business plan and corporate documents",
      "Evidence of the investment and the source of funds",
      "Tax and bank records tracing the funds",
    ],
    faqs: [
      { q: "How much must I invest for E-2?", a: "The law sets no fixed minimum. The investment must be substantial for the type of business and placed at risk." },
      { q: "Is my country an E-2 treaty country?", a: "The U.S. Department of State publishes the list of treaty countries. Nigeria, for example, is not on it, so Nigerian nationals generally consider other routes." },
      { q: "Does EB-5 lead to a permanent green card?", a: "Investors first receive a conditional green card for two years, then file Form I-829 to remove conditions once the investment and job creation are shown." },
      { q: "What is a regional center?", a: "An entity approved by U.S. Citizenship and Immigration Services that pools EB-5 investments into projects and can count indirect jobs." },
      { q: "Can founders use other routes?", a: "Yes. Founders with strong records often qualify for O-1 or a National Interest Waiver without a set investment amount." },
      { q: "Do you provide investment advice?", a: "No. We advise on immigration law and coordinate with your financial and business advisers." },
    ],
  },
  {
    slug: "employers",
    track: "professionals",
    icon: "factory",
    title: "Employer sponsorship",
    codes: "PERM, I-140, I-9",
    summary: "A single point of contact for employers sponsoring workers and staying compliant.",
    intro:
      "Employers sponsoring foreign workers need accurate filings and predictable timelines. We support human resources teams through the Program Electronic Review Management (PERM) labor certification process, immigrant petitions and employment eligibility compliance, with one attorney accountable for each matter.",
    whoFor: [
      "Employers sponsoring employees for green cards",
      "Human resources teams managing H-1B, L-1 and O-1 workers",
      "Companies reviewing Form I-9 and E-Verify practices",
    ],
    howWeHelp: [
      { title: "PERM labor certification", text: "We manage the prevailing wage request, the recruitment process and the labor certification filing with the Department of Labor." },
      { title: "Immigrant petitions", text: "We prepare the Form I-140 and plan the employee's adjustment of status." },
      { title: "Compliance", text: "We review Form I-9 practices and help employers respond to audits and site visits." },
      { title: "Program management", text: "We track deadlines across the workforce and give HR a clear status view." },
    ],
    forms: [
      { code: "ETA-9089", name: "Application for Permanent Employment Certification" },
      { code: "I-140", name: "Immigrant Petition for Alien Workers" },
      { code: "I-9", name: "Employment Eligibility Verification" },
    ],
    timeline:
      "PERM cases include a prevailing wage determination, a recruitment period and Department of Labor review, and together these steps commonly take more than a year. Current Department of Labor processing times are published by its Office of Foreign Labor Certification.",
    checklist: [
      "Job description and minimum requirements",
      "Employee's resume, degrees and experience letters",
      "Company information and ability-to-pay evidence",
      "Recruitment records, once the process begins",
    ],
    faqs: [
      { q: "What is PERM?", a: "PERM is the Department of Labor process that tests the U.S. labor market. The employer shows no qualified U.S. worker is available for the role at the prevailing wage." },
      { q: "Who pays PERM costs?", a: "Department of Labor rules require the employer to pay the costs of the labor certification, including attorney fees for that step." },
      { q: "What is the Asylum Program Fee?", a: "A fee added to Form I-140 and many Form I-129 petitions. The current schedule lists $600 for most employers, $300 for small employers and $0 for nonprofits." },
      { q: "Can an employee change jobs during the green card process?", a: "In some situations, once the I-485 has been pending 180 days, the portability rules allow a move to a same or similar job." },
      { q: "Do you handle I-9 audits?", a: "Yes. We review records, correct errors where allowed and represent employers in Immigration and Customs Enforcement inspections." },
      { q: "Can you work with our existing HR systems?", a: "Yes. We agree a reporting format at the start so HR always knows where each case stands." },
    ],
  },
  {
    slug: "estates",
    track: "other",
    icon: "landmark",
    title: "Wills and trusts for global families",
    codes: "Wills, Trusts",
    summary: "Estate planning for families with property, heirs or citizenship in more than one country.",
    intro:
      "RT began as a fiduciary practice, and planning for families across borders remains part of our work. Families with assets or heirs in more than one country face questions that domestic templates rarely answer. We prepare Maryland wills, trusts and powers of attorney, and coordinate with advisers abroad where foreign assets are involved.",
    whoFor: [
      "Families with property in the United States and another country",
      "Parents naming guardians for minor children",
      "Couples where one spouse is not a U.S. citizen",
      "Families who want planning consistent with their faith, including Sharia-compliant structures",
    ],
    howWeHelp: [
      { title: "Wills and guardianship", text: "We draft Maryland wills that name guardians and executors." },
      { title: "Trusts", text: "We prepare revocable living trusts and specialty trusts, including special needs trusts." },
      { title: "Non-citizen spouses", text: "We plan for the federal estate tax rules that treat non-citizen spouses differently, including the qualified domestic trust (QDOT)." },
      { title: "Incapacity planning", text: "We draft financial powers of attorney and advance health care directives." },
    ],
    forms: [],
    timeline: "Most plans are signed within four to eight weeks of the first meeting, depending on complexity.",
    checklist: [
      "List of assets in each country, with approximate values",
      "Names and contact details of heirs, executors and guardians",
      "Existing wills, trusts or beneficiary designations",
      "Citizenship and residence of each spouse",
    ],
    faqs: [
      { q: "Does Maryland have an estate tax?", a: "Yes. Maryland applies an estate tax to estates above a state exemption of $5 million, and a separate inheritance tax of 10 percent on transfers to some beneficiaries outside close family. Rates and exemptions can change, so we confirm them at the time of planning." },
      { q: "Why does a non-citizen spouse matter?", a: "The unlimited federal marital deduction does not apply to transfers to a spouse who is not a U.S. citizen, unless assets pass through a qualified domestic trust (QDOT) or another exception applies." },
      { q: "Will my U.S. will cover property abroad?", a: "Sometimes, but foreign law may control property located in that country. We coordinate with local counsel where needed." },
      { q: "What is a revocable living trust?", a: "A trust you control during your life that can pass assets to heirs without probate court in Maryland." },
      { q: "Can you prepare a Sharia-compliant plan?", a: "Yes. We prepare plans that follow the distribution rules a family chooses, within the limits of Maryland law." },
      { q: "Do I need a guardian designation?", a: "Parents of minor children should name a guardian. Without one, a court decides." },
    ],
  },
];

// Published back office edits replace the wording field by field.
export const deriveExpertise = (pages: Pages): Expertise[] => BASE_EXPERTISE.map((e) => applyOverrides(pages, e));

export const EXPERTISE: Expertise[] = BASE_EXPERTISE.map(withOverrides);

export const byTrack = (track: Track) => EXPERTISE.filter((e) => e.track === track);
export const getExpertise = (slug: string) => EXPERTISE.find((e) => e.slug === slug);
