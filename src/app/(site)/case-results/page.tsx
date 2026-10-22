import type { Metadata } from "next";
import { page } from "@/content/seo";
import { CaseResultsView } from "@/components/views/CaseResultsView";

export const metadata: Metadata = page("/case-results/", {
  title: "Success stories",
  description: "Anonymised outcomes from family, citizenship, extraordinary ability, National Interest Waiver and employer matters, published with client consent.",
});

export default function CaseResultsPage() {
  return <CaseResultsView />;
}
