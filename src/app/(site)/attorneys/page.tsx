import type { Metadata } from "next";
import { AttorneysView } from "@/components/views/AttorneysView";

export const metadata: Metadata = {
  title: "Our attorneys",
  description: "Meet the attorneys of RT Law Services: admissions, languages and areas of focus.",
};

export default function AttorneysPage() {
  return <AttorneysView />;
}
