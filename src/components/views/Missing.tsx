import Link from "next/link";
import { Container } from "@/components/ui/primitives";

/** Shown in place of a record that was unpublished after the last build. */
export function Missing({ what, back }: { what: string; back: { label: string; href: string } }) {
  return (
    <section className="py-32">
      <Container className="text-center">
        <p className="eyebrow text-brass-ink">Not available</p>
        <h1 className="font-serif-display mt-4 text-4xl text-ink sm:text-5xl">This {what} is no longer published</h1>
        <Link href={back.href} className="mt-10 inline-flex min-h-11 items-center rounded-full bg-ink px-6 font-bold text-paper hover:bg-ink-raised">
          {back.label}
        </Link>
      </Container>
    </section>
  );
}
