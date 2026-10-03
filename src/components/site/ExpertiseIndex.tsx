import Link from "next/link";
import type { Expertise } from "@/content/expertise";
import { cn } from "@/lib/utils";

/**
 * Areas of expertise set as an index, the way a legal reference lists its
 * sections: matter on the left, the forms and visa codes it concerns on the right.
 */
export function ExpertiseIndex({ items, dark, meta }: { items: Expertise[]; dark?: boolean; meta?: (e: Expertise) => string | undefined }) {
  return (
    <ul className={cn("border-t", dark ? "border-line-dark" : "border-ink/15")}>
      {items.map((e) => {
        const m = meta?.(e);
        return (
          <li key={e.slug}>
            <Link
              href={`/expertise/${e.slug}/`}
              className={cn(
                "group grid gap-x-10 gap-y-2 border-b py-7 transition-colors duration-300 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline",
                dark ? "border-line-dark hover:bg-ink-raised/60" : "border-ink/15 hover:bg-white",
              )}
            >
              <span className="min-w-0 sm:pl-2">
                <span
                  className={cn(
                    "font-serif-display block text-[1.75rem] leading-tight decoration-1 underline-offset-[6px] group-hover:underline sm:text-[2rem]",
                    dark ? "text-paper decoration-brass-light" : "text-ink decoration-brass",
                  )}
                >
                  {e.title}
                </span>
                <span className={cn("mt-2 block max-w-[62ch] leading-relaxed", dark ? "text-stone-dark" : "text-stone")}>{e.summary}</span>
                {m && <span className={cn("mt-2 block text-sm", dark ? "text-stone-dark" : "text-stone")}>{m}</span>}
              </span>
              <span className={cn("text-sm font-bold sm:pr-2 sm:text-right", dark ? "text-brass-light" : "text-brass-ink")}>{e.codes}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
