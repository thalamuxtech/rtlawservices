import type { Metadata } from "next";
import { ExpertiseIndexView } from "@/components/views/ExpertiseIndexView";

export const metadata: Metadata = {
  title: "Areas of expertise",
  description:
    "Family green cards, citizenship, spouse work permits, appeals and waivers, consular processing, O-1, EB-1A, National Interest Waiver, H-1B, L-1, investor visas, PERM and estate planning.",
};

export default function ExpertisePage() {
  return <ExpertiseIndexView />;
}
