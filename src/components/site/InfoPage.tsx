import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { BookingBand } from "@/components/home/Sections";
import { Container } from "@/components/ui/primitives";

export function OfficialLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-6 font-bold text-paper transition-colors hover:bg-ink-raised"
    >
      {children} <ExternalLink aria-hidden className="size-4" />
    </a>
  );
}

export function InfoPage({
  title,
  lede,
  crumb,
  parent,
  children,
}: {
  title: string;
  lede: string;
  crumb: string;
  parent?: { label: string; href: string };
  children: ReactNode;
}) {
  return (
    <>
      <PageHero title={title} lede={lede} crumbs={[...(parent ? [parent] : []), { label: crumb }]} />
      <Container className="py-20">
        <div className="prose-luxe mx-auto max-w-2xl text-lg">{children}</div>
      </Container>
      <BookingBand />
    </>
  );
}
