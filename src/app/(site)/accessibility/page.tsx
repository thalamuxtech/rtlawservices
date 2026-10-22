import type { Metadata } from "next";
import { page } from "@/content/seo";
import { AccessibilityView } from "@/components/views/AccessibilityView";

export const metadata: Metadata = page("/accessibility/", { title: "Accessibility", description: "How the RT Law Services website meets accessibility standards, and how to tell us about a barrier you find." });

export default function AccessibilityPage() {
  return <AccessibilityView />;
}
