import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE } from "@/content/site";
import { BlendImage, type HeroImageName } from "@/components/ui/BlendImage";

export function PageHero({
  eyebrow,
  title,
  lede,
  crumbs = [],
  dark = true,
  children,
  aside,
  image,
  imagePosition,
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  crumbs?: { label: string; href?: string }[];
  dark?: boolean;
  children?: ReactNode;
  aside?: ReactNode;
  /** A photograph that fades into the right side of a dark hero. */
  image?: HeroImageName;
  imagePosition?: string;
}) {
  const all = [{ label: "Home", href: "/" }, ...crumbs];
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, ...(c.href ? { item: SITE.url + c.href } : {}) })),
  };
  return (
    <section className={cn("relative isolate overflow-hidden", dark ? "on-dark bg-ink text-paper" : "bg-mist text-ink")}>
      {dark && image && <BlendImage name={image} position={imagePosition} priority />}
      {dark && <div aria-hidden className="grain absolute inset-0" />}
      {dark && (
        <div aria-hidden className="absolute -right-40 -top-40 size-[560px] rounded-full bg-[radial-gradient(circle,rgba(177,151,107,0.18),transparent_65%)]" />
      )}
      <div className={cn("container-luxe relative grid gap-12 pb-20 pt-12 sm:pb-24 sm:pt-16", aside && "lg:grid-cols-[1.4fr_0.6fr] lg:items-end")}>
        <div className={cn(image && !aside && "lg:max-w-[54%]")}>
          <nav aria-label="Breadcrumb" className="rise">
            <ol className={cn("flex flex-wrap items-center gap-1.5 text-sm", dark ? "text-stone-dark" : "text-stone")}>
              {all.map((c, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight aria-hidden className="size-3.5 opacity-60" />}
                  {c.href && i < all.length - 1 ? (
                    <Link href={c.href} className={cn("inline-flex min-h-11 items-center transition-colors", dark ? "hover:text-paper" : "hover:text-ink")}>
                      {c.label}
                    </Link>
                  ) : (
                    <span aria-current={i === all.length - 1 ? "page" : undefined}>{c.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          {eyebrow && (
            <p className={cn("rise eyebrow mt-10 flex items-center gap-3", dark ? "text-brass-light" : "text-brass-ink")} style={{ ["--d" as string]: "80ms" }}>
              <span aria-hidden className={cn("h-px w-8", dark ? "bg-brass-light" : "bg-brass")} />
              {eyebrow}
            </p>
          )}
          <h1
            className={cn("rise font-serif-display mt-5 max-w-4xl text-[2.6rem] text-balance sm:text-6xl lg:text-[4.2rem]", !eyebrow && "mt-10")}
            style={{ ["--d" as string]: "160ms" }}
          >
            {title}
          </h1>
          {lede && (
            <p
              className={cn("rise mt-6 max-w-2xl text-lg leading-relaxed sm:text-xl", dark ? "text-stone-dark" : "text-stone")}
              style={{ ["--d" as string]: "260ms" }}
            >
              {lede}
            </p>
          )}
          {children && <div className="rise mt-9" style={{ ["--d" as string]: "360ms" }}>{children}</div>}
        </div>
        {aside && <div className="rise" style={{ ["--d" as string]: "420ms" }}>{aside}</div>}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </section>
  );
}

export function Accordion({ items, className }: { items: { q: string; a: ReactNode }[]; className?: string }) {
  return (
    <div className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((it, i) => (
        <details key={i} className="group">
          <summary className="flex min-h-16 list-none items-center justify-between gap-6 py-5 text-left text-[1.07rem] font-bold text-ink [&::-webkit-details-marker]:hidden">
            {it.q}
            <span aria-hidden className="relative grid size-9 shrink-0 place-items-center rounded-full border border-line transition-colors duration-300 group-open:border-ink group-open:bg-ink">
              <span className="absolute h-px w-3.5 bg-ink transition-colors group-open:bg-paper" />
              <span className="absolute h-3.5 w-px bg-ink transition-transform duration-300 group-open:scale-y-0" />
            </span>
          </summary>
          <div className="pb-6 pr-14 leading-relaxed text-stone">{it.a}</div>
        </details>
      ))}
    </div>
  );
}
