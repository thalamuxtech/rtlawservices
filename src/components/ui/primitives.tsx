import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "gold" | "ink" | "outline" | "outline-light" | "ghost";

const variants: Record<Variant, string> = {
  gold: "bg-brass text-ink hover:bg-brass-light shadow-[0_8px_30px_-12px_rgba(177,151,107,0.7)]",
  ink: "bg-ink text-paper hover:bg-ink-raised",
  outline: "border border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-paper",
  "outline-light": "border border-brass-light/50 text-brass-light hover:border-brass-light hover:bg-brass-light hover:text-ink",
  ghost: "text-brass-ink hover:text-ink",
};

const base =
  "group inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-3 text-[0.95rem] font-bold tracking-wide transition-colors duration-300 ease-[var(--ease-luxe)] disabled:cursor-not-allowed disabled:opacity-50";

export function ButtonLink({
  href,
  variant = "gold",
  className,
  children,
  ...rest
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  const external = typeof href === "string" && /^(https?:|tel:|mailto:)/.test(href);
  const inner = children;
  if (external) {
    return (
      <a href={href as string} className={cn(base, variants[variant], className)} {...(rest as ComponentProps<"a">)}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={cn(base, variants[variant], className)} {...rest}>
      {inner}
    </Link>
  );
}

export function Button({
  variant = "gold",
  className,
  ...rest
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cn(base, variants[variant], className)} {...rest} />;
}

export function Eyebrow({ children, dark, className }: { children: ReactNode; dark?: boolean; className?: string }) {
  return (
    <p className={cn("eyebrow", dark ? "text-brass-light" : "text-brass-ink", className)}>{children}</p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lede,
  dark,
  center,
  className,
  as: As = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  dark?: boolean;
  center?: boolean;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("max-w-3xl", center && "mx-auto text-center", className)} data-reveal>
      {eyebrow && <Eyebrow dark={dark} className={cn("mb-5", center && "justify-center")}>{eyebrow}</Eyebrow>}
      <As
        className={cn(
          "font-serif-display text-balance",
          As === "h1" ? "text-[2.6rem] sm:text-6xl lg:text-[4.25rem]" : "text-[2.1rem] sm:text-5xl",
          dark ? "text-paper" : "text-ink",
        )}
      >
        {title}
      </As>
      {lede && (
        <p className={cn("mt-6 text-lg leading-relaxed text-pretty", dark ? "text-stone-dark" : "text-stone")}>{lede}</p>
      )}
    </div>
  );
}

export function SampleBadge({ dark, className }: { dark?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.72rem] font-bold",
        dark ? "border-brass-light/40 text-brass-light" : "border-brass-ink/40 text-brass-ink",
        className,
      )}
      title="Fictional sample content shown for design review. Replaced by real, consented material before launch."
    >
      Sample
    </span>
  );
}

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("flex gap-0.5", className)} role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" aria-hidden className={cn("size-4", i < rating ? "fill-brass" : "fill-line")}>
          <path d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L1.3 7.8l6.1-.7z" />
        </svg>
      ))}
    </span>
  );
}

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("container-luxe", className)}>{children}</div>;
}
