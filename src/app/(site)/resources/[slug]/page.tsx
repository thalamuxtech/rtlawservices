import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/site/PageHero";
import { BookingBand } from "@/components/home/Sections";
import { Container } from "@/components/ui/primitives";
import { ARTICLES, getArticle } from "@/content/articles";
import { SITE } from "@/content/site";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/resources/[slug]">): Promise<Metadata> {
  const a = getArticle((await params).slug);
  return a ? { title: a.title, description: a.dek } : {};
}

const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

export default async function ArticlePage({ params }: PageProps<"/resources/[slug]">) {
  const a = getArticle((await params).slug);
  if (!a) notFound();
  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.dek,
    dateModified: a.updated,
    publisher: { "@type": "Organization", name: SITE.name },
  };
  return (
    <>
      <PageHero
        eyebrow={`${a.category}, ${a.readMinutes} min read`}
        title={a.title}
        lede={a.dek}
        crumbs={[{ label: "Resources", href: "/resources/" }, { label: a.title }]}
      />
      <Container className="py-20">
        <article className="prose-luxe mx-auto max-w-2xl text-lg">
          <p className="!mt-0 text-sm text-stone">Updated {fmt(a.updated)}. General information, not legal advice for any individual case.</p>
          {a.body.map((b, i) =>
            b.type === "h2" ? (
              <h2 key={i}>{b.text}</h2>
            ) : b.type === "p" ? (
              <p key={i}>{b.text}</p>
            ) : (
              <ul key={i}>{b.items.map((it) => <li key={it}>{it}</li>)}</ul>
            ),
          )}
        </article>
      </Container>
      <BookingBand />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </>
  );
}
