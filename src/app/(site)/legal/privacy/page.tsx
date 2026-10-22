import type { Metadata } from "next";
import { page } from "@/content/seo";
import { PrivacyView } from "@/components/views/PrivacyView";

export const metadata: Metadata = page("/legal/privacy/", { title: "Privacy policy", description: "How RT Law Services collects, uses and protects personal information." });

export default function PrivacyPage() {
  return <PrivacyView />;
}
