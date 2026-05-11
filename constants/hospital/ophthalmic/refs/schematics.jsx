// Veterinary ophthalmic marking template — pure SVG schematics.
// Geometric line art only. Two species (dog/cat), four schematics, two sides each.

const INK = '#1a1d20';
const SOFT = '#9da19f';
const FAINT = '#d6d4cc';

// ─── shared helpers ──────────────────────────────────────────────────────

const TickRing = ({ cx, cy, r, count = 12, len = 6, color = SOFT, sw = 1 }) => {
  const ticks = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    const x1 = cx + Math.cos(a) * r;
    const y1 = cy + Math.sin(a) * r;
    const x2 = cx + Math.cos(a) * (r + len);
    const y2 = cy + Math.sin(a) * (r + len);
    ticks.push(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={sw} strokeLinecap="round" />);
  }
  return <g>{ticks}</g>;
};

const ClockNumbers = ({ cx, cy, r, color = SOFT, size = 9 }) => {
  const nums = [
    { n: 12, a: -90 }, { n: 3, a: 0 }, { n: 6, a: 90 }, { n: 9, a: 180 },
  ];
  return (
    <g fontFamily="'IBM Plex Mono', monospace" fontSize={size} fill={color} textAnchor="middle" dominantBaseline="middle">
      {nums.map(({ n, a }) => {
        const rad = (a * Math.PI) / 180;
        const x = cx + Math.cos(rad) * r;
        const y = cy + Math.sin(rad) * r;
        return <text key={n} x={x} y={y}>{n}</text>;
      })}
    </g>
  );
};

// ─── 01 External (front view) ────────────────────────────────────────────

function External({ species, side }) {
  // Drawn for OD; OS mirrors via SVG transform in parent.
  // For OD: medial canthus on right (toward midline of body).
  const isDog = species === 'dog';
  return (
    <svg viewBox="0 0 260 170" width="100%" preserveAspectRatio="xMidYMid meet">
      {/* palpebral fissure */}
      <path d="M 20,85 Q 130,8 240,85 Q 130,162 20,85 Z" fill="none" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      {/* upper lid crease (faint) */}
      <path d="M 32,78 Q 130,20 228,78" fill="none" stroke={FAINT} strokeWidth="1" />
      {/* eyelashes — short ticks along upper lid */}
      {Array.from({ length: 11 }).map((_, i) => {
        const t = 0.08 + (i / 10) * 0.84;
        // quadratic curve approx point
        const x = (1 - t) * (1 - t) * 20 + 2 * (1 - t) * t * 130 + t * t * 240;
        const y = (1 - t) * (1 - t) * 85 + 2 * (1 - t) * t * 8 + t * t * 85;
        // normal direction outward (up)
        const tx = 2 * (1 - t) * (130 - 20) + 2 * t * (240 - 130);
        const ty = 2 * (1 - t) * (8 - 85) + 2 * t * (85 - 8);
        const len = Math.hypot(tx, ty);
        const nx = -ty / len, ny = tx / len;
        return <line key={i} x1={x} y1={y} x2={x + nx * 7} y2={y + ny * 7} stroke={SOFT} strokeWidth="0.9" strokeLinecap="round" />;
      })}
      {/* limbus */}
      <circle cx="130" cy="85" r="55" fill="none" stroke={INK} strokeWidth="1.4" />
      {/* iris */}
      <circle cx="130" cy="85" r="40" fill="none" stroke={SOFT} strokeWidth="1" />
      {/* pupil */}
      {isDog ? (
        <circle cx="130" cy="85" r="14" fill="none" stroke={INK} strokeWidth="1.2" />
      ) : (
        <g>
          <clipPath id={`iris-clip-${side}`}>
            <circle cx="130" cy="85" r="40" />
          </clipPath>
          <ellipse cx="130" cy="85" rx="4" ry="38" fill="none" stroke={INK} strokeWidth="1.2" clipPath={`url(#iris-clip-${side})`} />
        </g>
      )}
      {/* third eyelid hint — small curve at medial canthus (right side for OD) */}
      <path d="M 232,85 Q 200,85 188,98" fill="none" stroke={FAINT} strokeWidth="1" />
      {/* clock ticks outside limbus */}
      <TickRing cx={130} cy={85} r={56} count={12} len={4} color={SOFT} sw={0.9} />
      {/* M / L canthus markers */}
      <g fontFamily="'IBM Plex Mono', monospace" fontSize="8" fill={SOFT}>
        <text x="244" y="89" textAnchor="start">M</text>
        <text x="16" y="89" textAnchor="end">L</text>
      </g>
      {/* clock numbers */}
      <ClockNumbers cx={130} cy={85} r={72} color={SOFT} size={8} />
    </svg>
  );
}

// ─── 02 Cornea clock map (en-face cornea, concentric zones) ──────────────

function Cornea({ species, side }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" preserveAspectRatio="xMidYMid meet">
      {/* limbus */}
      <circle cx="100" cy="100" r="86" fill="none" stroke={INK} strokeWidth="1.5" />
      {/* paracentral zone */}
      <circle cx="100" cy="100" r="58" fill="none" stroke={SOFT} strokeWidth="1" strokeDasharray="3 3" />
      {/* central zone */}
      <circle cx="100" cy="100" r="28" fill="none" stroke={SOFT} strokeWidth="1" strokeDasharray="3 3" />
      {/* crosshair (very faint) */}
      <line x1="100" y1="14" x2="100" y2="186" stroke={FAINT} strokeWidth="0.8" />
      <line x1="14" y1="100" x2="186" y2="100" stroke={FAINT} strokeWidth="0.8" />
      {/* hourly ticks */}
      <TickRing cx={100} cy={100} r={86} count={12} len={5} color={INK} sw={1.1} />
      {/* half-hourly minor ticks */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = ((i + 0.5) / 12) * Math.PI * 2 - Math.PI / 2;
        const x1 = 100 + Math.cos(a) * 86;
        const y1 = 100 + Math.sin(a) * 86;
        const x2 = 100 + Math.cos(a) * 89;
        const y2 = 100 + Math.sin(a) * 89;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={SOFT} strokeWidth="0.7" />;
      })}
      {/* center dot */}
      <circle cx="100" cy="100" r="1.2" fill={INK} />
      {/* clock numbers */}
      <g fontFamily="'IBM Plex Mono', monospace" fontSize="9" fill={INK}>
        <text x="100" y="6" textAnchor="middle" dominantBaseline="middle">12</text>
        <text x="195" y="100" textAnchor="middle" dominantBaseline="middle">3</text>
        <text x="100" y="195" textAnchor="middle" dominantBaseline="middle">6</text>
        <text x="5" y="100" textAnchor="middle" dominantBaseline="middle">9</text>
      </g>
      {/* zone labels (faint) */}
      <g fontFamily="'IBM Plex Mono', monospace" fontSize="6.5" fill={SOFT} letterSpacing="0.5">
        <text x="100" y="100" textAnchor="middle" dy="-18">CENTRAL</text>
        <text x="100" y="100" textAnchor="middle" dy="-46">PARACENTRAL</text>
        <text x="100" y="100" textAnchor="middle" dy="-72">LIMBUS</text>
      </g>
    </svg>
  );
}

// ─── 03 Lens (anterior view, Y-suture, cortex/nucleus zones) ─────────────

function Lens({ species, side }) {
  // Y-suture: upright Y from center, three arms at 90° / 210° / 330° (anterior)
  const cx = 100, cy = 100;
  const arms = species === 'cat'
    // cat: more pronounced, also Y but slightly different — keep same form for schematic
    ? [-90, 150, 30]
    : [-90, 150, 30];
  return (
    <svg viewBox="0 0 200 200" width="100%" preserveAspectRatio="xMidYMid meet">
      {/* capsule / equator */}
      <circle cx={cx} cy={cy} r="86" fill="none" stroke={INK} strokeWidth="1.5" />
      {/* cortex / nucleus boundary */}
      <circle cx={cx} cy={cy} r="58" fill="none" stroke={SOFT} strokeWidth="1" strokeDasharray="3 3" />
      {/* embryonic nucleus */}
      <circle cx={cx} cy={cy} r="22" fill="none" stroke={SOFT} strokeWidth="1" strokeDasharray="3 3" />
      {/* Y suture */}
      {arms.map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <line key={deg}
            x1={cx} y1={cy}
            x2={cx + Math.cos(a) * 56}
            y2={cy + Math.sin(a) * 56}
            stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
        );
      })}
      {/* hour ticks */}
      <TickRing cx={cx} cy={cy} r={86} count={12} len={4} color={SOFT} sw={0.9} />
      {/* clock numbers */}
      <g fontFamily="'IBM Plex Mono', monospace" fontSize="8" fill={SOFT}>
        <text x="100" y="7" textAnchor="middle" dominantBaseline="middle">12</text>
        <text x="194" y="100" textAnchor="middle" dominantBaseline="middle">3</text>
        <text x="100" y="194" textAnchor="middle" dominantBaseline="middle">6</text>
        <text x="6" y="100" textAnchor="middle" dominantBaseline="middle">9</text>
      </g>
      {/* zone labels */}
      <g fontFamily="'IBM Plex Mono', monospace" fontSize="6" fill={SOFT} letterSpacing="0.5">
        <text x={cx} y={cy + 80} textAnchor="middle">CORTEX</text>
        <text x={cx} y={cy + 50} textAnchor="middle">NUCLEUS</text>
      </g>
    </svg>
  );
}

// ─── 04 Fundus (back of eye, optic disc + tapetal boundary) ──────────────

function Fundus({ species, side }) {
  // Convention: optic disc drawn slightly inferior, on the NASAL side of fundus.
  // OD: nasal = right side of image (closer to midline of body, examiner view).
  // OS: mirror.
  const isDog = species === 'dog';
  // disc position: nasal-inferior
  const dx = 134, dy = 112;
  // tapetum boundary — upper portion, curve. dog = more wedge/triangular, cat = more dome.
  const tapPath = isDog
    ? "M 14,100 Q 60,40 100,52 Q 140,40 186,100"
    : "M 14,108 Q 100,28 186,108";

  return (
    <svg viewBox="0 0 200 200" width="100%" preserveAspectRatio="xMidYMid meet">
      {/* fundus circle */}
      <circle cx="100" cy="100" r="90" fill="none" stroke={INK} strokeWidth="1.5" />
      {/* tapetal boundary (dashed) */}
      <path d={tapPath} fill="none" stroke={SOFT} strokeWidth="1" strokeDasharray="4 3" />
      {/* horizontal + vertical meridians */}
      <line x1="100" y1="10" x2="100" y2="190" stroke={FAINT} strokeWidth="0.8" />
      <line x1="10" y1="100" x2="190" y2="100" stroke={FAINT} strokeWidth="0.8" />
      {/* optic disc */}
      <circle cx={dx} cy={dy} r="9" fill="none" stroke={INK} strokeWidth="1.3" />
      <circle cx={dx} cy={dy} r="2" fill={INK} opacity="0.4" />
      {/* major vessel stubs from optic disc */}
      {[
        [-140, 38], [140, 36], [-30, 50], [30, 48],
      ].map(([deg, len], i) => {
        const a = (deg * Math.PI) / 180;
        const x2 = dx + Math.cos(a) * len;
        const y2 = dy + Math.sin(a) * len;
        return <path key={i} d={`M ${dx} ${dy} Q ${(dx + x2) / 2 + 3} ${(dy + y2) / 2 - 3} ${x2} ${y2}`} fill="none" stroke={SOFT} strokeWidth="0.9" strokeLinecap="round" />;
      })}
      {/* area centralis — small dot temporal-superior to disc */}
      <circle cx={dx - 36} cy={dy - 10} r="1.5" fill={INK} opacity="0.5" />
      {/* compass labels: S / I / N / T (N + T flip with side) */}
      <g fontFamily="'IBM Plex Mono', monospace" fontSize="9" fill={INK}>
        <text x="100" y="6" textAnchor="middle" dominantBaseline="middle">S</text>
        <text x="100" y="195" textAnchor="middle" dominantBaseline="middle">I</text>
        <text x="194" y="100" textAnchor="middle" dominantBaseline="middle">{side === 'OD' ? 'N' : 'T'}</text>
        <text x="6" y="100" textAnchor="middle" dominantBaseline="middle">{side === 'OD' ? 'T' : 'N'}</text>
      </g>
      {/* tapetum label */}
      <text x="100" y="40" fontFamily="'IBM Plex Mono', monospace" fontSize="6.5" fill={SOFT} textAnchor="middle" letterSpacing="0.5">TAPETUM LUCIDUM</text>
      <text x="100" y="160" fontFamily="'IBM Plex Mono', monospace" fontSize="6.5" fill={SOFT} textAnchor="middle" letterSpacing="0.5">NON-TAPETUM</text>
      {/* disc label */}
      <text x={dx} y={dy + 18} fontFamily="'IBM Plex Mono', monospace" fontSize="6" fill={SOFT} textAnchor="middle">OPTIC DISC</text>
    </svg>
  );
}

// ─── Wrapper that adds OS mirroring and click handling ───────────────────

function Schematic({ kind, species, side, onClick, children }) {
  const Comp = { external: External, cornea: Cornea, lens: Lens, fundus: Fundus }[kind];
  // OS = horizontal mirror via CSS transform on outer; but markers should also flip.
  // Simpler: render content directly for both sides; species-aware components vary by side
  // (Fundus already swaps disc + labels). For External we mirror the SVG group.
  return (
    <div className="schematic" data-kind={kind} data-side={side} onClick={onClick}>
      <div className={`schematic-svg ${kind === 'external' && side === 'OS' ? 'mirror-x' : ''}`}>
        <Comp species={species} side={side} />
      </div>
      {children /* marker overlay */}
    </div>
  );
}

Object.assign(window, { External, Cornea, Lens, Fundus, Schematic, TickRing, ClockNumbers });
