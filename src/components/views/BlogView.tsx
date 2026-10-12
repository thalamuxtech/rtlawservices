"use client";

import { PageHero } from "@/components/site/PageHero";
import { BlogIndex } from "@/components/site/BlogIndex";
import { BookingBand } from "@/components/home/Sections";
import { Container } from "@/components/ui/primitives";
import { useContent } from "@/content/LiveContent";
import { HEADINGS } from "@/content/headings";

export function BlogView() {
  const { POSTS } = useContent();
  return (
    <>
      <PageHero
        title={HEADINGS["/blog/"].title}
        lede={HEADINGS["/blog/"].lede}
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
