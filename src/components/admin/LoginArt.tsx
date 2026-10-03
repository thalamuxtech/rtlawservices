// Line drawing of a courthouse with a waving U.S. flag, for the staff sign-in
// panel. The flag is cut into vertical slices that rise and fall in sequence,
// which reads as a wave. Motion stops under reduced motion.

const SLICES = 28;
const COLUMNS = [0, 1, 2, 3, 4, 5];

export function LoginArt() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-[250px] xl:max-w-[340px] [@media(max-height:700px)]:hidden">
      <div className="login-flag absolute left-1/2 top-[2.4%] ml-[2px] flex h-[26%] w-[37%]">
        {Array.from({ length: SLICES }, (_, i) => (
          <span
            key={i}
            className="login-flag-slice h-full flex-1"
            style={{
              backgroundPosition: `${(i / (SLICES - 1)) * 100}% 0`,
              backgroundSize: `${SLICES * 100}% 100%`,
              animationDelay: `${-i * 0.07}s`,
            }}
          />
        ))}
      </div>

      <svg viewBox="0 0 440 330" className="login-court w-full text-brass" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Flagpole */}
        <path className="login-draw" d="M220 6 V118" strokeWidth="2.5" />
        <circle cx="220" cy="5" r="3.5" fill="currentColor" stroke="none" />
        {/* Pediment and entablature */}
        <path className="login-draw" d="M40 168 L220 112 L400 168 Z" />
        <path className="login-draw" d="M78 160 L220 122 L362 160" opacity="0.5" />
        <path className="login-draw" d="M32 168 H408 V186 H32 Z" />
        <path className="login-draw" d="M46 186 H394" opacity="0.5" />
        {/* Columns */}
        {COLUMNS.map((c) => {
          const x = 70 + c * 60;
          return (
            <g key={c}>
              <path className="login-draw" d={`M${x - 14} 194 H${x + 14} M${x - 10} 194 V282 M${x + 10} 194 V282 M${x - 14} 282 H${x + 14}`} />
              <path className="login-draw" d={`M${x - 3} 200 V276 M${x + 3} 200 V276`} opacity="0.35" />
            </g>
          );
        })}
        {/* Steps */}
        <path className="login-draw" d="M28 290 H412 M16 304 H424 M4 318 H436" />
      </svg>
    </div>
  );
}
