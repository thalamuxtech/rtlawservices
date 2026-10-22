import type { Metadata } from "next";
import { page } from "@/content/seo";
import { DisclaimerView } from "@/components/views/DisclaimerView";

export const metadata: Metadata = page("/legal/disclaimer/", { title: "Disclaimer", description: "Attorney advertising disclaimer for RT Law Services." });

export default function DisclaimerPage() {
  return <DisclaimerView />;
}
