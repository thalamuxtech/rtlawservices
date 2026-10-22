// /llms.txt: a plain-text summary of the firm and links to its main pages,
// following the llmstxt.org proposal. It is experimental and supplements, but
// does not replace, the structured data, sitemap and page content. Written
// at build time from the same content as the pages, so it stays accurate.

import { EXPERTISE, TRACK_LABELS, type Track } from "@/content/expertise";
import { ATTORNEYS, POSTS } from "@/content/live";
import { SITE } from "@/content/site";

export const dynamic = "force-static";

export function GET() {
  const u = (path: string) => `${SITE.url}${path}`;
  const tracks = [...new Set(EXPERTISE.map((e) => e.track))] as Track[];
  const lines = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.description}`,
    "",
    `${SITE.name} is an immigration-led U.S. law practice. It represents clients across the United States and abroad, because U.S. immigration law is federal. Consultations take place by video or phone; the firm does not hold in-person office meetings. Estate planning work is limited to Maryland law.`,
    "",
    `- Website: ${u("/")}`,
    `- Telephone: ${SITE.phone}`,
    `- Email: ${SITE.email}`,
    `- Book a consultation: ${u("/book/")}`,
    `- Free evaluation questionnaire: ${u("/free-evaluation/")}`,
    ...(ATTORNEYS.length ? [`- Attorneys: ${ATTORNEYS.map((a) => `${a.name}, ${a.title}`).join("; ")}`] : []),
    "",
    "Information on this website is general and is not legal advice for any individual case. Visiting the website or sending a message does not create an attorney-client relationship.",
    "",
    ...tracks.flatMap((t) => [
      `## Practice areas: ${TRACK_LABELS[t]}`,
      "",
      ...EXPERTISE.filter((e) => e.track === t).map((e) => `- [${e.title}](${u(`/expertise/${e.slug}/`)}): ${e.summary}`),
      "",
    ]),
    "## Guides and tools",
    "",
    `- [Start here](${u("/start-here/")}): where to begin for first-time applicants`,
    `- [Frequently asked questions](${u("/faq/")}): fees, timing, eligibility and working with the firm`,
    `- [Knowledge center](${u("/knowledge/")}): guides, a glossary of immigration terms and tools`,
    `- [USCIS filing fees](${u("/resources/filing-fees/")}): government fees from the USCIS fee schedule, Form G-1055`,
    `- [Processing times](${u("/resources/processing-times/")}): where to find official USCIS processing times`,
    `- [Visa Bulletin](${u("/resources/visa-bulletin/")}): how priority dates and the monthly Visa Bulletin work`,
    `- [USCIS case status tracker](${u("/case-status-tracker/")}): reads a USCIS case record and explains each stage`,
    `- [Eligibility check](${u("/check-eligibility/")}): a self-assessment for EB-1A, O-1A and National Interest Waiver`,
    "",
    ...(POSTS.length
      ? ["## Articles", "", ...POSTS.map((p) => `- [${p.title}](${u(`/blog/${p.slug}/`)}): ${p.dek} (updated ${p.updated || p.published})`), ""]
      : []),
    "## The firm",
    "",
    `- [About](${u("/about/")})`,
    `- [How we work](${u("/how-we-work/")})`,
    `- [Attorneys](${u("/attorneys/")})`,
    `- [Contact](${u("/contact/")})`,
    `- [Legal disclaimer](${u("/legal/disclaimer/")})`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
