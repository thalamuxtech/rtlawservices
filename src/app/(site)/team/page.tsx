import type { Metadata } from "next";
import { page } from "@/content/seo";
import { TeamView } from "@/components/views/TeamView";

export const metadata: Metadata = page("/team/", {
  title: "Our team",
  description: "The leadership and advisors of RT Law Services: the Managing Partner, the directors of practice and government relations, and the firm's advisors.",
});

export default function TeamPage() {
  return <TeamView />;
}
