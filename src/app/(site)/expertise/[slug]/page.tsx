import type { Metadata } from "next";
import { EXPERTISE, getExpertise } from "@/content/expertise";
import { ExpertiseView } from "@/components/views/ExpertiseView";

export function generateStaticParams() {
  return EXPERTISE.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: PageProps<"/expertise/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const e = getExpertise(slug);
  if (!e) return {};
  return { title: `${e.title} (${e.codes})`, description: e.summary };
}

// Prerendered from the build's content; the view then shows the newest published version.
export default async function ExpertiseDetail({ params }: PageProps<"/expertise/[slug]">) {
  return <ExpertiseView slug={(await params).slug} />;
}
