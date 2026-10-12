// Default headline and introduction of each page that staff can reword in the
// back office (Page text, Page headings). Pages read their wording from here,
// and PageHero swaps in any published replacement.

export type Heading = { path: string; label: string; title: string; lede?: string };

export const HEADING_LIST: Heading[] = [
  {
    path: "/attorneys/",
    label: "Attorneys",
    title: "The people who will handle your case",
    lede: "Each client works with a named attorney from the first consultation. Every profile lists bar admissions, languages and the matters that attorney leads.",
  },
  {
    path: "/blog/",
    label: "Blog",
    title: "Immigration updates, with the sources",
    lede: "Policy changes, filing guides and explainers in plain words. Every post lists the official sources it relies on, so you can check them yourself.",
  },
  {
    path: "/case-results/",
    label: "Success stories",
    title: "Success stories, documented",
    lede: "Each summary shows the client's situation, the obstacle, our approach and how long the matter took. Names and identifying details are removed, and every result is published with the client's consent.",
  },
  {
    path: "/reviews/",
    label: "Reviews",
    title: "In our clients' words",
  },
  {
    path: "/contact/",
    label: "Contact",
    title: "We are here to help",
    lede: "The fastest way to get advice is to book a consultation. For anything else, call, email or send a message below.",
  },
  {
    path: "/expertise/",
    label: "Expertise",
    title: "Immigration counsel for every stage of the process",
    lede: "Two tracks share one standard of care. Choose the situation that matches yours, or answer three questions to find your path.",
  },
  {
    path: "/faq/",
    label: "FAQ",
    title: "Questions clients ask before they begin",
    lede: "Answers about working with us and about the system in general. Each practice page has its own questions on that topic.",
  },
  {
    path: "/free-evaluation/",
    label: "Free evaluation",
    title: "Find out where you stand, from an attorney, at no cost",
  },
  {
    path: "/knowledge/",
    label: "Knowledge center",
    title: "Knowledge center",
    lede: "Everything we publish, in one place: interactive tools, plain-language guides with official sources, and quick references for every stage of the process.",
  },
  {
    path: "/resources/",
    label: "Resources",
    title: "Guides and tools, written for clarity",
    lede: "General information to help you understand the process. For advice on your own situation, book a consultation.",
  },
  {
    path: "/start-here/",
    label: "Start here",
    title: "U.S. immigration, explained in plain words",
    lede: "If this is your first time dealing with the U.S. immigration system, begin with this page. It takes about ten minutes to read, and every term is defined as it appears.",
  },
  {
    path: "/how-we-work/",
    label: "How we work",
    title: "A clear process, from first call to final decision",
    lede: "Every client follows the same five stages. At any point you can ask which stage you are in and what happens next.",
  },
  {
    path: "/diaspora/",
    label: "Clients abroad",
    title: "A U.S. firm you can reach from anywhere",
    lede: "If you live outside the United States, or your family does, distance should not make the process harder to follow.",
  },
  {
    path: "/book/",
    label: "Book a consultation",
    title: "Choose a time that suits you",
    lede: "Five short steps. Times appear in your own time zone, and our intake team confirms every request by email within one business day.",
  },
  {
    path: "/check-eligibility/",
    label: "Check eligibility",
    title: "See how your record maps to the legal standard",
    lede: "Tick the criteria your record could meet. The meter scores your answers as you go, and one click sends them to an attorney for a free evaluation.",
  },
];

HEADING_LIST.push({
  path: "/case-status-tracker/",
  label: "Case status tracker",
  title: "Follow your USCIS case, step by step",
  lede: "Enter a receipt number for any U.S. Citizenship and Immigration Services (USCIS) form and see the current status, every recorded update and how long each stage has taken, in one clear timeline.",
});

export const HEADINGS: Record<string, Heading> = Object.fromEntries(HEADING_LIST.map((h) => [h.path, h]));
