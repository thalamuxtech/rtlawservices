import type { Metadata } from "next";
import { page } from "@/content/seo";
import { FaqView } from "@/components/views/FaqView";

export const metadata: Metadata = page("/faq/", {
  title: "Frequently asked questions",
  description: "Answers about consultations, fees, confidentiality and the basics of U.S. immigration.",
});

export default function FaqPage() {
  return <FaqView />;
}
