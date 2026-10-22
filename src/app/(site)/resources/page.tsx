import type { Metadata } from "next";
import { page } from "@/content/seo";
import { ResourcesView } from "@/components/views/ResourcesView";

export const metadata: Metadata = page("/resources/", {
  title: "Resources",
  description: "Guides, the current U.S. Citizenship and Immigration Services (USCIS) filing fees, and explainers on processing times, the Visa Bulletin and case status.",
});

export default function ResourcesPage() {
  return <ResourcesView />;
}
