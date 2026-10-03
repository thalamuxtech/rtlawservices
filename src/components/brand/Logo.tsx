import { cn } from "@/lib/utils";
import { LOGO_DOT, LOGO_PATHS, LOGO_VIEWBOX_FULL, LOGO_VIEWBOX_MARK } from "./logo-paths";

type LogoProps = {
  /** "light" for light grounds, "dark" for the reversed version on ink. */
  tone?: "light" | "dark";
  /** "full" shows the wordmark, "mark" shows the RT monogram only. */
  variant?: "full" | "mark";
  /** Blink the dot on the R. Disabled automatically under reduced motion. */
  beep?: boolean;
  /** Play the one-time draw-in on first paint. */
  intro?: boolean;
  className?: string;
  title?: string;
};

export function Logo({
  tone = "light",
  variant = "full",
  beep = true,
  intro = false,
  className,
  title = "RT Law Services",
}: LogoProps) {
  // The gold stays fixed. The dot and the words take the ink of the version.
  const ink = tone === "dark" ? "#FFFFFF" : "#14181F";
  const gold = "#C7A767";

  return (
    <svg
      viewBox={variant === "full" ? LOGO_VIEWBOX_FULL : LOGO_VIEWBOX_MARK}
      role="img"
      aria-label={title}
      className={cn("rt-logo block h-auto", intro && "rt-logo-intro", className)}
    >
      <title>{title}</title>
      <path className="rt-logo-letters" d={LOGO_PATHS.gold} fill={gold} />
      {variant === "full" && <path className="rt-logo-word" d={LOGO_PATHS.word} fill={ink} />}
      {beep && (
        <circle
          className="rt-logo-ping"
          cx={LOGO_DOT.cx}
          cy={LOGO_DOT.cy}
          r={LOGO_DOT.r}
          fill="none"
          stroke={gold}
          strokeWidth={5}
        />
      )}
      <path className={cn("rt-logo-dot", beep && "is-beeping")} d={LOGO_PATHS.dot} fill={ink} />
    </svg>
  );
}
