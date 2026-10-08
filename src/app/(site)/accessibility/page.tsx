import type { Metadata } from "next";
import { AccessibilityView } from "@/components/views/AccessibilityView";

export const metadata: Metadata = { title: "Accessibility", description: "RT Law Services accessibility statement." };

export default function AccessibilityPage() {
  return <AccessibilityView />;
}
