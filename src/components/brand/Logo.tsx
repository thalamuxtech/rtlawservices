import { cn } from "@/lib/utils";
import { LOGO_GEO, LOGO_PATHS, LOGO_VIEWBOX_FULL, LOGO_VIEWBOX_MARK } from "./logo-paths";

type LogoProps = {
  /** "light" for light grounds, "dark" for the reversed version on ink. */
  tone?: "light" | "dark";
  /** "full" shows the wordmark, "mark" shows the RT monogram only. */
  variant?: "full" | "mark";
  /** Pulse the dot on the R. Disabled automatically under reduced motion. */
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
  const dark = tone === "dark";
  // Reversed logo swaps the black and white elements; the gold stays.
  const disc = dark ? "#FAF8F5" : "#14181F";
  const dotFill = dark ? "#14181F" : "#FAF8F5";
  const word = dark ? "#FAF8F5" : "#14181F";
  const gold = "#B1976B";
  const { topCircle: tc, dot, bottomCircle: bc, bar, square } = LOGO_GEO;

  return (
    <svg
      viewBox={variant === "full" ? LOGO_VIEWBOX_FULL : LOGO_VIEWBOX_MARK}
      role="img"
      aria-label={title}
      className={cn("rt-logo block h-auto", intro && "rt-logo-intro", className)}
    >
      <title>{title}</title>
      <path className="rt-logo-letters" d={LOGO_PATHS.rt} fill={gold} />
      {beep && (
        <circle
          className="rt-logo-ping"
          cx={tc.cx}
          cy={tc.cy}
          r={tc.r}
          fill="none"
          stroke={dark ? "#C9B48A" : gold}
          strokeWidth={5}
        />
      )}
      {beep && (
        <circle
          className="rt-logo-ping rt-logo-ping-2"
          cx={tc.cx}
          cy={tc.cy}
          r={tc.r}
          fill="none"
          stroke={dark ? "#C9B48A" : gold}
          strokeWidth={3}
        />
      )}
      <g className={cn("rt-logo-beat", beep && "is-beeping")}>
        <circle className="rt-logo-disc" cx={tc.cx} cy={tc.cy} r={tc.r} fill={disc} />
        <circle className="rt-logo-dot" cx={dot.cx} cy={dot.cy} r={dot.r} fill={dotFill} />
      </g>
      <circle className="rt-logo-disc rt-logo-disc-b" cx={bc.cx} cy={bc.cy} r={bc.r} fill={disc} />
      {variant === "full" && (
        <g className="rt-logo-word">
          <path d={LOGO_PATHS.immigration} fill={word} />
          <rect className="rt-logo-bar" x={bar.x} y={bar.y} width={bar.width} height={bar.height} fill={word} />
          <rect x={square.x} y={square.y} width={square.width} height={square.height} fill={gold} />
          <path d={LOGO_PATHS.lawServices} fill={word} />
        </g>
      )}
    </svg>
  );
}
