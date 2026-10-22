import type { Metadata } from "next";
import { page } from "@/content/seo";
import { PostView } from "@/components/views/PostView";
import { POSTS, getPost } from "@/content/live";

export function generateStaticParams() {
  // Static export needs one route even when nothing is published; it renders the 404 page.
  return POSTS.length ? POSTS.map((p) => ({ slug: p.slug })) : [{ slug: "none" }];
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const p = getPost((await params).slug);
  return p
    ? page(`/blog/${p.slug}/`, { title: p.title, description: p.dek, type: "article", publishedTime: p.published, modifiedTime: p.updated })
    : { robots: { index: false } };
}

// The page is prerendered from the build's content; PostView then shows the
// newest published version.
export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  return <PostView slug={(await params).slug} />;
}
