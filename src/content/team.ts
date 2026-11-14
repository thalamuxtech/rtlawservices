// The firm's leadership and advisors, from the firm's own team profiles
// (planning/brand/WEBSITE PITCH_Team_v1.docx, November 2026). The text is the
// firm's, with only light corrections. Attorneys keep their full profiles on
// /attorneys/; this list adds the people who are not on that page.

import { BIO_TIJANI } from "./proof";

export type TeamMember = {
  slug: string;
  name: string;
  /** Degrees or credentials shown under the name, spelled out. */
  credentials?: string[];
  role: string;
  group: "Leadership" | "Advisors";
  initials: string;
  /** Portrait under /public. Without one, the card shows the firm's emblem. */
  photo?: string;
  /** CSS object-position for the portrait, so the face stays in a cropped frame. */
  photoPosition?: string;
  bio: string[];
  /** A full profile elsewhere on the site, when there is one. */
  profile?: string;
};

export const TEAM: TeamMember[] = [
  {
    slug: "temitayo-tijani",
    name: "Temitayo M. Tijani",
    role: "Managing Partner",
    group: "Leadership",
    initials: "TT",
    photo: "/images/team/temitayo-tijani.webp",
    bio: [BIO_TIJANI[0], BIO_TIJANI[1]],
    profile: "/attorneys/temitayo-tijani/",
  },
  {
    slug: "bettina-carroll",
    name: "Dr. Bettina Carroll",
    credentials: ["Doctor of Criminal Justice (DCJ)", "Master of Public Administration (MPA)", "Master of Science in Criminal Justice (MSCJ)"],
    role: "Director of Practice & People",
    group: "Leadership",
    initials: "BC",
    photo: "/images/team/bettina-carroll.webp",
    bio: [
      "Dr. Bettina Carroll brings extensive experience in criminal justice, public administration, mediation, counseling, and legal services to her role as Director of Practice & People at RT Law Services. Holding a Doctorate in Criminal Justice, a Master of Science in Criminal Justice, a Master of Public Administration, and professional certifications in Mediation and Paralegal Studies, Dr. Carroll is dedicated to fostering excellence in client service, professional development, and organizational culture. Her career reflects a longstanding commitment to advocacy, conflict resolution, and empowering individuals through compassionate, results-driven support.",
    ],
  },
  {
    slug: "olayiwola-obayan",
    name: "Olayiwola Obayan",
    role: "Director of Government Relations & Counsel",
    group: "Leadership",
    initials: "OO",
    photo: "/images/team/olayiwola-obayan.webp",
    // A tall photo with the face in the upper third.
    photoPosition: "50% 22%",
    bio: [
      "Mr. Olayiwola Obayan serves as Director of Government Relations and Counsel at RT Law Services, bringing extensive experience in government affairs, international law, regulatory strategy, and cross-border legal practice. His distinguished career spans public service, international legal advisory, immigration law, trade and investment, and strategic engagement with governmental and institutional stakeholders.",
      "As a seasoned legal professional, Mr. Obayan provides invaluable insight into the intersection of law, public policy, and international business. His experience includes advising on complex cross-border transactions, international agreements, regulatory compliance, investment frameworks, and immigration matters affecting individuals, businesses, and institutions operating across multiple jurisdictions.",
      "Prior to joining RT Law Services, Mr. Obayan served as Principal State Counsel with the Federal Ministry of Justice, where he participated in the negotiation and drafting of international agreements, mutual legal assistance treaties, investment agreements, and bilateral cooperation frameworks. This experience has equipped him with a sophisticated understanding of government processes, legislative developments, and international legal cooperation.",
      "At RT Law Services, he leads government relations initiatives and helps clients navigate regulatory environments, governmental engagement strategies, international compliance matters, and policy-related challenges. His practical and strategic approach enables clients to identify opportunities, manage risk, and advance their objectives in an increasingly interconnected global marketplace.",
      "Mr. Obayan is committed to delivering forward-thinking legal counsel and fostering productive relationships between businesses, government institutions, and international stakeholders. His leadership strengthens RT Law Services' mission of providing innovative legal solutions for clients operating at the crossroads of global commerce, regulation, and public policy.",
    ],
  },
  {
    slug: "rabiat-akande",
    name: "Dr. Rabiat Akande",
    role: "Advisor",
    group: "Advisors",
    initials: "RA",
    bio: [
      "RT Law Services is honored to have Dr. Rabiat Akande serve as an Advisor to the firm. An internationally recognized legal scholar, thought leader, and authority on international law, legal history, comparative constitutional law, law and religion, and African legal systems, Dr. Akande brings exceptional intellectual depth and global perspective to the firm's advisory network.",
      "As an accomplished scholar and professor, Dr. Akande's work explores the intersection of law, governance, international relations, institutions, and social change. Her research and publications have received international recognition and have contributed significantly to contemporary discussions on international law, constitutional development, religion-state relations, and Africa's place in the evolving global legal order.",
      "In her role as Advisor, Dr. Akande provides strategic insight that helps RT Law Services navigate complex legal, policy, and cross-border issues affecting clients operating in increasingly interconnected markets. Her expertise enhances the firm's ability to understand emerging global trends, evaluate regulatory and institutional challenges, and develop innovative solutions for matters involving international commerce, governance, public policy, and legal risk.",
      "Beyond her scholarship, Dr. Akande is widely respected for her leadership in advancing legal thought concerning Africa, international institutions, and the historical forces that continue to shape modern legal systems. Her global network, academic influence, and commitment to excellence make her an invaluable resource to RT Law Services and its clients.",
      "Through the guidance of distinguished advisors such as Dr. Akande, RT Law Services continues to provide clients with sophisticated, forward-looking counsel informed by world-class expertise, global awareness, and a deep understanding of the legal and policy environments that shape business and society.",
    ],
  },
];
