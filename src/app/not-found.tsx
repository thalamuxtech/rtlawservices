import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <main className="on-dark grid min-h-dvh place-items-center bg-ink px-4 text-center text-paper">
      <div>
        <div className="mx-auto grid size-40 place-items-center rounded-full bg-paper">
          <Logo variant="mark" className="w-24" />
        </div>
        <p className="eyebrow mt-10 text-brass-light">Page not found</p>
        <h1 className="font-serif-display mt-4 text-5xl">This page has moved or never existed</h1>
        <p className="mx-auto mt-5 max-w-md text-stone-dark">Use the links below to find your way.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex min-h-11 items-center rounded-full bg-brass px-6 font-bold text-ink hover:bg-brass-light">Home</Link>
          <Link href="/expertise/" className="inline-flex min-h-11 items-center rounded-full border border-brass-light/50 px-6 font-bold text-brass-light hover:bg-brass-light hover:text-ink">Expertise</Link>
          <Link href="/book/" className="inline-flex min-h-11 items-center rounded-full border border-brass-light/50 px-6 font-bold text-brass-light hover:bg-brass-light hover:text-ink">Book a consultation</Link>
        </div>
      </div>
    </main>
  );
}
