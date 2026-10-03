import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { BlogIndex } from "@/components/site/BlogIndex";
import { BookingBand } from "@/components/home/Sections";
import { Container } from "@/components/ui/primitives";
import { POSTS } from "@/content/live";

export const metadata: Metadata = {
  title: "Blog: immigration updates and guides",
  description: "Plain-language updates on U.S. immigration law and policy, with every claim linked to an official source.",
};

export default function BlogPage() {
  return (
    <>
      <PageHero
        title="Immigration updates, with the sources"
        lede="Policy changes, filing guides and explainers in plain words. Every post lists the official sources it relies on, so you can check them yourself."
        crumbs={[{ label: "Blog" }]}
      />
      <section className="py-16 sm:py-20">
        <Container>
          <BlogIndex posts={POSTS} />
        </Container>
      </section>
      <BookingBand />
    </>
  );
}
