// The engraved guilloche pattern from the business card and letterhead:
// woven gold waves that drift slowly, and a rosette that turns. Decorative
// only; it stands still for visitors who ask for reduced motion.

const W = 1600;
const H = 140;

/** Woven bands: [centre y, amplitude, wavelength, strands, opacity]. */
const BANDS = [
  [70, 30, 160, 9, 0.5],
  [70, 48, 240, 5, 0.32],
] as const;

function wave(cy: number, amp: number, len: number, phase: number) {
  const pts: string[] = [];
  // One wavelength beyond the visible width, so the drift loops seamlessly.
  for (let x = 0; x <= W + len; x += 4) pts.push(`${x} ${(cy + amp * Math.sin(((x + phase) / len) * Math.PI * 2)).toFixed(1)}`);
  return `M${pts.join("L")}`;
}

const WEAVE = BANDS.map(([cy, amp, len, strands, opacity]) => ({
  len,
  opacity,
  paths: Array.from({ length: strands }, (_, j) => wave(cy, amp, len, (j * len) / strands)),
}));

function rosettePaths(size: number) {
  const c = size / 2;
  const out: string[] = [];
  for (const [rad, amp, petals, strands] of [[0.86, 0.1, 14, 9], [0.56, 0.08, 10, 7], [0.3, 0.06, 7, 5]]) {
    for (let j = 0; j < strands; j++) {
      const pts: string[] = [];
      for (let i = 0; i <= 360; i++) {
        const t = (i / 360) * Math.PI * 2;
        const r = c * (rad + amp * Math.sin(petals * t + (j / strands) * Math.PI * 2));
        pts.push(`${(c + r * Math.cos(t)).toFixed(1)} ${(c + r * Math.sin(t)).toFixed(1)}`);
      }
      out.push(`M${pts.join("L")}Z`);
    }
  }
  return out;
}

const ROSETTE = rosettePaths(400);

export function GuillocheWeave({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={className} fill="none" stroke="currentColor">
      {WEAVE.map((b, i) => (
        <g key={i} className="guilloche-drift" opacity={b.opacity} style={{ "--drift": `${-b.len}px`, "--drift-time": `${14 + i * 8}s` } as React.CSSProperties}>
          {b.paths.map((d, j) => (
            <path key={j} d={d} strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
      ))}
    </svg>
  );
}

export function GuillocheRosette({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 400 400" className={className} fill="none" stroke="currentColor">
      <g className="guilloche-turn">
        {ROSETTE.map((d, i) => (
          <path key={i} d={d} strokeWidth={0.6} />
        ))}
      </g>
    </svg>
  );
}
