// Body diagram zone definitions for the derm chart system.
// Coordinate space matches the SVG viewBox: 0 0 100 110
// Left half (x 0–50):  ventral view (belly side up)
// Right half (x 50–100): dorsal view (back side up)
// Stored markers use normalized coords (x÷100, y÷110) — multiply back for zone lookup.

interface Zone {
  x1: number; y1: number; x2: number; y2: number
  label: string
  labelEn: string
}

const ZONES: Zone[] = [
  // ── Ventral view (x: 0–50) ───────────────────────────────────
  { x1: 16, y1:  2, x2: 34, y2: 17, label: '얼굴/두부',          labelEn: 'Head/Face' },
  { x1: 20, y1: 17, x2: 30, y2: 27, label: '목/경부 (복측)',     labelEn: 'Neck (ventral)' },
  { x1:  4, y1:  8, x2: 20, y2: 57, label: '앞다리 우측 (복면)', labelEn: 'Right forelimb (ventral)' },
  { x1: 30, y1:  8, x2: 47, y2: 57, label: '앞다리 좌측 (복면)', labelEn: 'Left forelimb (ventral)' },
  { x1: 18, y1: 27, x2: 32, y2: 52, label: '흉부 (복면)',        labelEn: 'Thorax / ventral chest' },
  { x1: 18, y1: 52, x2: 32, y2: 70, label: '복부',               labelEn: 'Abdomen' },
  { x1: 18, y1: 70, x2: 32, y2: 80, label: '서혜부/회음부',      labelEn: 'Inguinal / Perineal' },
  { x1:  4, y1: 57, x2: 21, y2: 107, label: '뒷다리 우측 (복면)', labelEn: 'Right hindlimb (ventral)' },
  { x1: 29, y1: 57, x2: 47, y2: 107, label: '뒷다리 좌측 (복면)', labelEn: 'Left hindlimb (ventral)' },
  { x1: 18, y1: 80, x2: 32, y2: 110, label: '꼬리/항문 주위',    labelEn: 'Tail / Perianal' },

  // ── Dorsal view (x: 50–100) ──────────────────────────────────
  { x1: 66, y1:  2, x2: 84, y2: 17, label: '얼굴/두부',          labelEn: 'Head/Face' },
  { x1: 69, y1: 17, x2: 81, y2: 27, label: '목/경부 (등쪽)',     labelEn: 'Neck / Scruff (dorsal)' },
  { x1: 52, y1:  8, x2: 69, y2: 57, label: '앞다리 우측 (배면)', labelEn: 'Right forelimb (dorsal)' },
  { x1: 81, y1:  8, x2: 98, y2: 57, label: '앞다리 좌측 (배면)', labelEn: 'Left forelimb (dorsal)' },
  { x1: 68, y1: 27, x2: 82, y2: 52, label: '등/흉배부',          labelEn: 'Thoracic spine / Upper back' },
  { x1: 68, y1: 52, x2: 82, y2: 66, label: '요추부/허리',        labelEn: 'Lumbar back' },
  { x1: 68, y1: 66, x2: 82, y2: 79, label: '천골/엉덩이',        labelEn: 'Sacrum / Rump' },
  { x1: 52, y1: 57, x2: 69, y2: 107, label: '뒷다리 우측 (배면)', labelEn: 'Right hindlimb (dorsal)' },
  { x1: 81, y1: 57, x2: 98, y2: 107, label: '뒷다리 좌측 (배면)', labelEn: 'Left hindlimb (dorsal)' },
  { x1: 68, y1: 79, x2: 82, y2: 110, label: '꼬리/항문 주위',    labelEn: 'Tail / Perianal' },
]

// svgX: 0–100,  svgY: 0–110
export function getAnatomicalZone(svgX: number, svgY: number): { label: string; labelEn: string } | null {
  const matches = ZONES.filter(
    (z) => svgX >= z.x1 && svgX <= z.x2 && svgY >= z.y1 && svgY <= z.y2,
  )
  if (matches.length === 0) return null
  return matches.reduce((best, z) => {
    const area = (z.x2 - z.x1) * (z.y2 - z.y1)
    const bestArea = (best.x2 - best.x1) * (best.y2 - best.y1)
    return area < bestArea ? z : best
  })
}

// markers stored as normalized (x÷100, y÷110) — deduplicated zone labels
export function getAnatomicalText(markers: { x: number; y: number }[]): string {
  const labels = markers
    .map((m) => getAnatomicalZone(m.x * 100, m.y * 110)?.label)
    .filter((l): l is string => Boolean(l))
  return [...new Set(labels)].join(', ')
}

export function getAnatomicalTextEn(markers: { x: number; y: number }[]): string {
  const labels = markers
    .map((m) => getAnatomicalZone(m.x * 100, m.y * 110)?.labelEn)
    .filter((l): l is string => Boolean(l))
  return [...new Set(labels)].join(', ')
}
