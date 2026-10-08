import type { Metadata } from "next";
import { PrivacyView } from "@/components/views/PrivacyView";

export const metadata: Metadata = { title: "Privacy policy", description: "How RT Law Services collects, uses and protects personal information." };

export default function PrivacyPage() {
  return <PrivacyView />;
}
