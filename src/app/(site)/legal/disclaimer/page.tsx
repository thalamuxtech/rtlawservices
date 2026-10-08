import type { Metadata } from "next";
import { DisclaimerView } from "@/components/views/DisclaimerView";

export const metadata: Metadata = { title: "Disclaimer", description: "Attorney advertising disclaimer for RT Law Services." };

export default function DisclaimerPage() {
  return <DisclaimerView />;
}
