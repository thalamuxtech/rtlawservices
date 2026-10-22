import type { Metadata } from "next";
import { page } from "@/content/seo";
import { FreeEvaluationView } from "@/components/views/FreeEvaluationView";

export const metadata: Metadata = page("/free-evaluation/", {
  title: "Free evaluation",
  description:
    "Send your background for a free evaluation by an immigration attorney: EB-1A, National Interest Waiver, O-1, H-1B, family green cards and citizenship.",
});

export default function FreeEvaluationPage() {
  return <FreeEvaluationView />;
}
