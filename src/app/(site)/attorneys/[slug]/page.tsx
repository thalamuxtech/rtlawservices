import type { Metadata } from "next";
import { ATTORNEYS, getAttorney } from "@/content/live";
import { AttorneyView } from "@/components/views/AttorneyView";

export function generateStaticParams() {
  // Static export needs one route even when nothing is published; it renders the 404 page.
  return ATTORNEYS.length ? ATTORNEYS.map((a) => ({ slug: a.slug })) : [{ slug: "none" }];
}

export async function generateMetadata({ params }: PageProps<"/attorneys/[slug]">): Promise<Metadata> {
  const a = getAttorney((await params).slug);
  return a ? { title: `${a.name}, ${a.title}`, description: a.bio[0] } : { robots: { index: false } };
}

// Prerendered from the build's content; the view then shows the newest published version.
export default async function AttorneyPage({ params }: PageProps<"/attorneys/[slug]">) {
  return <AttorneyView slug={(await params).slug} />;
}
