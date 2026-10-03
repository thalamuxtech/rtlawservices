import Link from "next/link";
import { CalendarCheck, Phone } from "lucide-react";
import { SITE } from "@/content/site";

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
        <Link href="/free-evaluation/" className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-brass font-bold text-ink">
          <CalendarCheck aria-hidden className="size-4" /> Free evaluation
        </Link>
      </div>
    </div>
  );
}
