import Link from "next/link";
import { CalendarCheck, Phone } from "lucide-react";
import { SITE, SITE_MODE } from "@/content/site";

export function PreviewBanner() {
  if (SITE_MODE !== "preview") return null;
  return (
    <div className="relative z-50 bg-brass px-4 py-2 text-center text-[0.8rem] font-bold text-ink">
      Preview site. Items marked &ldquo;Sample&rdquo; are fictional and shown for design review only.
    </div>
  );
}

export function MobileActionBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 p-3 backdrop-blur-xl sm:hidden">
      <div className="grid grid-cols-2 gap-3">
        <a
          href={SITE.phoneHref}
          className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink/20 font-bold text-ink"
        >
          <Phone aria-hidden className="size-4" /> Call
        </a>
        <Link href="/book/" className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-brass font-bold text-ink">
          <CalendarCheck aria-hidden className="size-4" /> Book
        </Link>
      </div>
    </div>
  );
}
