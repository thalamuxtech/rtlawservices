import type { Metadata } from "next";
import { KnowledgeView } from "@/components/views/KnowledgeView";

export const metadata: Metadata = {
  title: "Knowledge center",
  description: "Guides, interactive tools and references on U.S. immigration: eligibility self-check, filing fees, processing times, the Visa Bulletin, a glossary and the blog.",
};

export default function KnowledgePage() {
  return <KnowledgeView />;
}
