import { cn } from "@/lib/utils";

export type HeroImageName = "legal-library" | "law-consultation" | "case-preparation" | "global-connection" | "path-forward";

/**
 * A decorative photograph for the right side of a dark hero. A mask fades it
 * into the ink background toward the text on the left and toward the bottom,
 * so the picture and the writing read as one surface. On small screens it sits
 * faintly behind the text instead.
 */
export function BlendImage({ name, position = "60% 30%", priority = false, className }: { name: HeroImageName; position?: string; priority?: boolean; className?: string }) {
  const src = (w: number) => `/images/${name}-${w}.webp`;
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-y-0 right-0 -z-10 w-full overflow-hidden lg:w-[60%]", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src(840)}
        srcSet={`${src(560)} 560w, ${src(840)} 840w, ${src(1120)} 1120w`}
        sizes="(min-width: 1024px) 60vw, 100vw"
        alt=""
        width={1120}
        height={1400}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className="blend-img size-full object-cover"
        style={{ objectPosition: position }}
      />
    </div>
  );
}
