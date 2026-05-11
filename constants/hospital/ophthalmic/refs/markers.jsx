// Lesion marker symbol icons (legend palette) + on-schematic marker renderer.

const MARKER_COLOR = 'oklch(0.45 0.18 25)'; // clinical red, darker for ink contrast

const MARKER_TYPES = [
  { id: 'ulcer',     ko: '궤양',     en: 'Ulcer' },
  { id: 'trauma',    ko: '외상',     en: 'Trauma' },
  { id: 'tumor',     ko: '종양',     en: 'Tumor' },
  { id: 'foreign',   ko: '이물',     en: 'Foreign Body' },
  { id: 'neo',       ko: '신생혈관', en: 'Neovascularization' },
  { id: 'keratitis', ko: '각막염',   en: 'Keratitis' },
];

// Each glyph drawn within a 24×24 viewBox, centered at (12,12).
function MarkerGlyph({ type, size = 22, color = MARKER_COLOR, withRing = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <Glyph type={type} color={color} withRing={withRing} />
    </svg>
  );
}

function Glyph({ type, color = MARKER_COLOR, withRing = true }) {
  switch (type) {
    case 'ulcer':
      return (
        <g fill="none" stroke={color} strokeWidth="1.6">
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3" fill={color} />
        </g>
      );
    case 'trauma':
      return (
        <g fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round">
          <circle cx="12" cy="12" r="8" />
          <line x1="6.5" y1="6.5" x2="17.5" y2="17.5" />
          <line x1="17.5" y1="6.5" x2="6.5" y2="17.5" />
        </g>
      );
    case 'tumor':
      return (
        <g>
          <circle cx="12" cy="12" r="8" fill={color} opacity="0.85" />
          <circle cx="12" cy="12" r="8" fill="none" stroke={color} strokeWidth="1.4" />
        </g>
      );
    case 'foreign':
      return (
        <g fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round">
          <rect x="5" y="5" width="14" height="14" transform="rotate(45 12 12)" />
        </g>
      );
    case 'neo':
      return (
        <g fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="8" opacity="0.5" />
          <line x1="12" y1="4" x2="12" y2="20" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="6.3" y1="6.3" x2="17.7" y2="17.7" />
          <line x1="17.7" y1="6.3" x2="6.3" y2="17.7" />
        </g>
      );
    case 'keratitis':
      return (
        <g fill="none" stroke={color} strokeWidth="1.4">
          <defs>
            <pattern id="hatch-keratitis" patternUnits="userSpaceOnUse" width="3" height="3" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="3" stroke={color} strokeWidth="1" />
            </pattern>
          </defs>
          <circle cx="12" cy="12" r="8" fill="url(#hatch-keratitis)" opacity="0.7" />
          <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.5" />
        </g>
      );
    default:
      return null;
  }
}

function MarkerOnSchematic({ marker, onRemove }) {
  // marker: { id, type, x, y } where x,y are 0..100 percentages.
  return (
    <button
      className="marker"
      style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
      onClick={(e) => { e.stopPropagation(); onRemove && onRemove(marker.id); }}
      title="클릭하여 삭제"
    >
      <MarkerGlyph type={marker.type} size={18} />
    </button>
  );
}

Object.assign(window, { MARKER_TYPES, MARKER_COLOR, MarkerGlyph, Glyph, MarkerOnSchematic });
