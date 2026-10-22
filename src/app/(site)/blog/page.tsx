import type { Metadata } from "next";
import { page } from "@/content/seo";
import { BlogView } from "@/components/views/BlogView";

export const metadata: Metadata = page("/blog/", {
  title: "Blog: immigration updates and guides",
  description: "Plain-language updates on U.S. immigration law and policy, with every claim linked to an official source.",
});

export default function BlogPage() {
  return <BlogView />;
}
