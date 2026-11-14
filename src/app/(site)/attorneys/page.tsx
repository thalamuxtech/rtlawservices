import type { Metadata } from "next";
import { page } from "@/content/seo";
import { AttorneysView } from "@/components/views/AttorneysView";

import { SHOW_ATTORNEYS_PAGE } from "@/content/site";

export const metadata: Metadata = {
  ...page("/attorneys/", {
    title: "Our attorneys",
    description: "Meet the attorneys of RT Law Services: admissions, languages and areas of focus.",
  }),
  // Kept out of search results while the list is hidden.
  ...(SHOW_ATTORNEYS_PAGE ? {} : { robots: { index: false, follow: true } }),
};

export default function AttorneysPage() {
  return <AttorneysView />;
}
