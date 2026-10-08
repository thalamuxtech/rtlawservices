import type { Metadata } from "next";
import { StartHereView } from "@/components/views/StartHereView";

export const metadata: Metadata = {
  title: "Start here: U.S. immigration explained",
  description: "A plain-language guide for first-time applicants: who decides cases, the main paths, what a consultation involves, a glossary and a path finder.",
};

export default function StartHerePage() {
  return <StartHereView />;
}
