import type { Metadata } from "next";
import { page } from "@/content/seo";
import { StartHereView } from "@/components/views/StartHereView";

export const metadata: Metadata = page("/start-here/", {
  title: "Start here: U.S. immigration explained",
  description: "A plain-language guide for first-time applicants: who decides cases, the main paths, what a consultation involves, a glossary and a path finder.",
});

export default function StartHerePage() {
  return <StartHereView />;
}
