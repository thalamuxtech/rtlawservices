import type { Metadata } from "next";
import { AboutView } from "@/components/views/AboutView";

export const metadata: Metadata = {
  title: "About the firm",
  description: "RT Law Services: an immigration-led law practice in Maryland with roots in fiduciary and cross-border advisory work.",
};

export default function AboutPage() {
  return <AboutView />;
}
