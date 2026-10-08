"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Markdown, headings } from "@/components/site/Markdown";
import { BookingBand } from "@/components/home/Sections";
import { Container } from "@/components/ui/primitives";
import { Missing } from "@/components/views/Missing";
import { useContent, useContentFresh } from "@/content/LiveContent";
import { SITE } from "@/content/site";

const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

export function PostView({ slug }: { slug: string }) {
  const { POSTS, getPost } = useContent();
  const fresh = useContentFresh();
  const p = getPost(slug);
  if (!p) return fresh ? <Missing what="post" back={{ label: "All posts", href: "/blog/" }} /> : null;
  const toc = headings(p.body);
  const related = POSTS.filter((x) => x.slug !== p.slug && x.category === p.category).concat(POSTS.filter((x) => x.slug !== p.slug && x.category !== p.category)).slice(0, 3);
  const ld = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p.title,
    description: p.dek,
    datePublished: p.published,
    dateModified: p.updated,
    author: { "@type": "Organization", name: p.author },
    publisher: { "@type": "Organization", name: SITE.name },
    citation: p.sources.map((s) => s.url),
  };

  return (
    <>
      <PageHero title={p.title} lede={p.dek} crumbs={[{ label: "Blog", href: "/blog/" }, { label: p.category }]}>
        <p className="text-sm text-stone-dark">
          {p.author}. Published {fmt(p.published)}
          {p.updated !== p.published && <>, updated {fmt(p.updated)}</>}. {p.readMinutes} minute read.
        </p>
      </PageHero>

      <Container className="grid gap-14 py-16 lg:grid-cols-[220px_minmax(0,1fr)] lg:py-20">
        <aside className="hidden lg:block">
          <nav aria-label="In this post" className="sticky top-32">
            <p className="eyebrow text-brass-ink">In this post</p>
            <ul className="mt-4 grid gap-1 border-l border-line">
              {toc.map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="-ml-px block border-l border-transparent py-1.5 pl-4 text-sm text-stone transition-colors hover:border-brass hover:text-ink">
                    {t.text}
                  </a>
                </li>
              ))}
              <li>
                <a href="#sources" className="-ml-px block border-l border-transparent py-1.5 pl-4 text-sm text-stone transition-colors hover:border-brass hover:text-ink">
                  Sources
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        <div className="min-w-0">
          <article className="prose-luxe max-w-[68ch] text-[1.12rem]">
            <Markdown source={p.body} />
          </article>

          <section id="sources" className="mt-16 max-w-[68ch] scroll-mt-32 border-t-2 border-brass pt-8">
            <h2 className="font-serif-display text-3xl text-ink">Sources</h2>
            <ol className="mt-6 grid gap-4">
              {p.sources.map((s, i) => (
                <li key={s.url} className="grid grid-cols-[2rem_1fr] gap-2">
                  <span className="font-bold text-brass-ink">{i + 1}.</span>
                  <span>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-bold text-ink underline decoration-brass underline-offset-4 hover:text-brass-ink">
                      {s.title}
                      <ExternalLink aria-hidden className="ml-1 inline size-3.5 align-[-2px]" />
                    </a>
                    <span className="block text-sm text-stone">{s.publisher}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-8 rounded-2xl bg-mist p-5 text-sm leading-relaxed text-stone">
              General information, not legal advice for any individual case. Law and policy change often. Check the sources
              above for the current position, and book a consultation for advice on your situation.
            </p>
          </section>

          {related.length > 0 && (
            <section className="mt-20">
              <h2 className="font-serif-display text-3xl text-ink">Keep reading</h2>
              <ul className="mt-6 grid border-t border-ink/15 sm:grid-cols-3 sm:gap-x-8">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/blog/${r.slug}/`} className="group block border-b border-ink/15 py-6">
                      <span className="text-sm text-stone">{r.category}</span>
                      <span className="font-serif-display mt-1 block text-xl leading-snug text-ink decoration-1 underline-offset-4 group-hover:underline">{r.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </Container>
      <BookingBand />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </>
  );
}
