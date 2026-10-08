import type { Metadata } from "next";
import { CASES, getCase } from "@/content/live";
import { CaseView } from "@/components/views/CaseView";

export function generateStaticParams() {
  // Static export needs one route even when nothing is published; it renders the 404 page.
  return CASES.length ? CASES.map((c) => ({ slug: c.slug })) : [{ slug: "none" }];
}

export async function generateMetadata({ params }: PageProps<"/case-results/[slug]">): Promise<Metadata> {
  const c = getCase((await params).slug);
  return c ? { title: `Success story: ${c.title}`, description: `${c.category}: ${c.outcome}` } : { robots: { index: false } };
}

// Prerendered from the build's content; the view then shows the newest published version.
export default async function CaseDetail({ params }: PageProps<"/case-results/[slug]">) {
  return <CaseView slug={(await params).slug} />;
}
