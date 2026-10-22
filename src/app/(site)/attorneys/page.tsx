import type { Metadata } from "next";
import { page } from "@/content/seo";
import { AttorneysView } from "@/components/views/AttorneysView";

export const metadata: Metadata = page("/attorneys/", {
  title: "Our attorneys",
  description: "Meet the attorneys of RT Law Services: admissions, languages and areas of focus.",
});

export default function AttorneysPage() {
  return <AttorneysView />;
}
