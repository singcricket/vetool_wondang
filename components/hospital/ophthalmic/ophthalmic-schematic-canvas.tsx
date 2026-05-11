'use client'

import React, { useState, useMemo } from 'react'
import { Plus, X, MousePointer2, Pencil, Eraser, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { Button } from '@/components/ui/button'

// ─── Types ───────────────────────────────────────────────────────────────

export type OphthalmicSchematicKind = 'external' | 'cornea' | 'lens' | 'fundus'

export interface OphthalmicMarker {
  id: string
  type: string
  x: number // 0-100 percentage
  y: number // 0-100 percentage
  side: 'OD' | 'OS'
}

export interface OphthalmicPath {
  id: string
  points: { x: number; y: number }[]
  color: string
  width: number
  side: 'OD' | 'OS'
}

interface MarkerType {
  id: string
  ko: string
  en: string
}

export const MARKER_TYPES: MarkerType[] = [
  { id: 'ulcer', ko: '궤양', en: 'Ulcer' },
  { id: 'trauma', ko: '외상', en: 'Trauma' },
  { id: 'tumor', ko: '종양', en: 'Tumor' },
  { id: 'foreign', ko: '이물', en: 'Foreign Body' },
  { id: 'neo', ko: '신생혈관', en: 'Neovascularization' },
  { id: 'keratitis', ko: '각막염', en: 'Keratitis' },
]

const INK = '#1a1d20'
const SOFT = '#9da19f'
const FAINT = '#d6d4cc'
const MARKER_COLOR = '#e11d48' // rose-600

// ─── SVGs ────────────────────────────────────────────────────────────────

const TickRing = ({ cx, cy, r, count = 12, len = 6, color = SOFT, sw = 1 }: any) => {
  const ticks = []
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2
    const x1 = cx + Math.cos(a) * r
    const y1 = cy + Math.sin(a) * r
    const x2 = cx + Math.cos(a) * (r + len)
    const y2 = cy + Math.sin(a) * (r + len)
    ticks.push(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={sw} strokeLinecap="round" />)
  }
  return <g>{ticks}</g>
}

const ClockNumbers = ({ cx, cy, r, color = SOFT, size = 9 }: any) => {
  const nums = [
    { n: 12, a: -90 }, { n: 3, a: 0 }, { n: 6, a: 90 }, { n: 9, a: 180 },
  ]
  return (
    <g fontFamily="inherit" fontSize={size} fill={color} textAnchor="middle" dominantBaseline="middle" className="font-mono">
      {nums.map(({ n, a }) => {
        const rad = (a * Math.PI) / 180
        const x = cx + Math.cos(rad) * r
        const y = cy + Math.sin(rad) * r
        return <text key={n} x={x} y={y}>{n}</text>
      })}
    </g>
  )
}

export function ExternalSchematic({ species, side }: { species: string; side: 'OD' | 'OS' }) {
  const isDog = species !== 'cat'
  return (
    <svg viewBox="0 0 260 170" className="w-full h-full select-none" preserveAspectRatio="xMidYMid meet">
      <path d="M 20,85 Q 130,8 240,85 Q 130,162 20,85 Z" fill="none" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M 32,78 Q 130,20 228,78" fill="none" stroke={FAINT} strokeWidth="1" />
      {Array.from({ length: 11 }).map((_, i) => {
        const t = 0.08 + (i / 10) * 0.84
        const x = (1 - t) * (1 - t) * 20 + 2 * (1 - t) * t * 130 + t * t * 240
        const y = (1 - t) * (1 - t) * 85 + 2 * (1 - t) * t * 8 + t * t * 85
        const tx = 2 * (1 - t) * (130 - 20) + 2 * t * (240 - 130)
        const ty = 2 * (1 - t) * (8 - 85) + 2 * t * (85 - 8)
        const len = Math.hypot(tx, ty)
        const nx = -ty / len, ny = tx / len
        return <line key={i} x1={x} y1={y} x2={x + nx * 7} y2={y + ny * 7} stroke={SOFT} strokeWidth="0.9" strokeLinecap="round" />
      })}
      <circle cx="130" cy="85" r="55" fill="none" stroke={INK} strokeWidth="1.4" />
      <circle cx="130" cy="85" r="40" fill="none" stroke={SOFT} strokeWidth="1" />
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
      <path d="M 232,85 Q 200,85 188,98" fill="none" stroke={FAINT} strokeWidth="1" />
      <TickRing cx={130} cy={85} r={56} count={12} len={4} color={SOFT} sw={0.9} />
      <g fontFamily="inherit" fontSize="8" fill={SOFT} className="font-mono">
        <text x="244" y="89" textAnchor="start">M</text>
        <text x="16" y="89" textAnchor="end">L</text>
      </g>
      <ClockNumbers cx={130} cy={85} r={72} color={SOFT} size={8} />
    </svg>
  )
}

export function CorneaSchematic() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full select-none" preserveAspectRatio="xMidYMid meet">
      <circle cx="100" cy="100" r="86" fill="none" stroke={INK} strokeWidth="1.5" />
      <circle cx="100" cy="100" r="58" fill="none" stroke={SOFT} strokeWidth="1" strokeDasharray="3 3" />
      <circle cx="100" cy="100" r="28" fill="none" stroke={SOFT} strokeWidth="1" strokeDasharray="3 3" />
      <line x1="100" y1="14" x2="100" y2="186" stroke={FAINT} strokeWidth="0.8" />
      <line x1="14" y1="100" x2="186" y2="100" stroke={FAINT} strokeWidth="0.8" />
      <TickRing cx={100} cy={100} r={86} count={12} len={5} color={INK} sw={1.1} />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = ((i + 0.5) / 12) * Math.PI * 2 - Math.PI / 2
        const x1 = 100 + Math.cos(a) * 86
        const y1 = 100 + Math.sin(a) * 86
        const x2 = 100 + Math.cos(a) * 89
        const y2 = 100 + Math.sin(a) * 89
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={SOFT} strokeWidth="0.7" />
      })}
      <circle cx="100" cy="100" r="1.2" fill={INK} />
      <g fontFamily="inherit" fontSize="9" fill={INK} className="font-mono">
        <text x="100" y="6" textAnchor="middle" dominantBaseline="middle">12</text>
        <text x="195" y="100" textAnchor="middle" dominantBaseline="middle">3</text>
        <text x="100" y="195" textAnchor="middle" dominantBaseline="middle">6</text>
        <text x="5" y="100" textAnchor="middle" dominantBaseline="middle">9</text>
      </g>
      <g fontFamily="inherit" fontSize="6.5" fill={SOFT} letterSpacing="0.5" className="font-mono">
        <text x="100" y="100" textAnchor="middle" dy="-18">CENTRAL</text>
        <text x="100" y="100" textAnchor="middle" dy="-46">PARACENTRAL</text>
        <text x="100" y="100" textAnchor="middle" dy="-72">LIMBUS</text>
      </g>
    </svg>
  )
}

export function LensSchematic({ species }: { species: string }) {
  const cx = 100, cy = 100
  const arms = [-90, 150, 30]
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full select-none" preserveAspectRatio="xMidYMid meet">
      <circle cx={cx} cy={cy} r="86" fill="none" stroke={INK} strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r="58" fill="none" stroke={SOFT} strokeWidth="1" strokeDasharray="3 3" />
      <circle cx={cx} cy={cy} r="22" fill="none" stroke={SOFT} strokeWidth="1" strokeDasharray="3 3" />
      {arms.map((deg) => {
        const a = (deg * Math.PI) / 180
        return (
          <line key={deg} x1={cx} y1={cy} x2={cx + Math.cos(a) * 56} y2={cy + Math.sin(a) * 56} stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
        )
      })}
      <TickRing cx={cx} cy={cy} r={86} count={12} len={4} color={SOFT} sw={0.9} />
      <ClockNumbers cx={cx} cy={cy} r={92} color={SOFT} size={8} />
      <g fontFamily="inherit" fontSize="6" fill={SOFT} letterSpacing="0.5" className="font-mono">
        <text x={cx} y={cy + 80} textAnchor="middle">CORTEX</text>
        <text x={cx} y={cy + 50} textAnchor="middle">NUCLEUS</text>
      </g>
    </svg>
  )
}

export function FundusSchematic({ species, side }: { species: string, side: 'OD' | 'OS' }) {
  const isDog = species !== 'cat'
  const dx = 134, dy = 112
  const tapPath = isDog ? "M 14,100 Q 60,40 100,52 Q 140,40 186,100" : "M 14,108 Q 100,28 186,108"
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full select-none" preserveAspectRatio="xMidYMid meet">
      <circle cx="100" cy="100" r="90" fill="none" stroke={INK} strokeWidth="1.5" />
      <path d={tapPath} fill="none" stroke={SOFT} strokeWidth="1" strokeDasharray="4 3" />
      <line x1="100" y1="10" x2="100" y2="190" stroke={FAINT} strokeWidth="0.8" />
      <line x1="10" y1="100" x2="190" y2="100" stroke={FAINT} strokeWidth="0.8" />
      <circle cx={dx} cy={dy} r="9" fill="none" stroke={INK} strokeWidth="1.3" />
      <circle cx={dx} cy={dy} r="2" fill={INK} opacity="0.4" />
      {[[-140, 38], [140, 36], [-30, 50], [30, 48]].map(([deg, len], i) => {
        const a = (deg * Math.PI) / 180
        const x2 = dx + Math.cos(a) * len
        const y2 = dy + Math.sin(a) * len
        return <path key={i} d={`M ${dx} ${dy} Q ${(dx + x2) / 2 + 3} ${(dy + y2) / 2 - 3} ${x2} ${y2}`} fill="none" stroke={SOFT} strokeWidth="0.9" strokeLinecap="round" />
      })}
      <circle cx={dx - 36} cy={dy - 10} r="1.5" fill={INK} opacity="0.5" />
      <g fontFamily="inherit" fontSize="9" fill={INK} className="font-mono">
        <text x="100" y="6" textAnchor="middle" dominantBaseline="middle">S</text>
        <text x="100" y="195" textAnchor="middle" dominantBaseline="middle">I</text>
        <text x="194" y="100" textAnchor="middle" dominantBaseline="middle">{side === 'OD' ? 'N' : 'T'}</text>
        <text x="6" y="100" textAnchor="middle" dominantBaseline="middle">{side === 'OD' ? 'T' : 'N'}</text>
      </g>
      <text x="100" y="40" fontFamily="inherit" fontSize="6.5" fill={SOFT} textAnchor="middle" letterSpacing="0.5" className="font-mono">TAPETUM LUCIDUM</text>
      <text x="100" y="160" fontFamily="inherit" fontSize="6.5" fill={SOFT} textAnchor="middle" letterSpacing="0.5" className="font-mono">NON-TAPETUM</text>
      <text x={dx} y={dy + 18} fontFamily="inherit" fontSize="6" fill={SOFT} textAnchor="middle" className="font-mono">OPTIC DISC</text>
    </svg>
  )
}

// ─── Marker Glyphs ──────────────────────────────────────────────────────

export function MarkerGlyph({ type, size = 20 }: { type: string, size?: number }) {
  const color = MARKER_COLOR
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="drop-shadow-sm">
      {(() => {
        switch (type) {
          case 'ulcer':
            return (
              <g fill="none" stroke={color} strokeWidth="2">
                <circle cx="12" cy="12" r="8" />
                <circle cx="12" cy="12" r="3" fill={color} />
              </g>
            )
          case 'trauma':
            return (
              <g fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="8" />
                <line x1="7" y1="7" x2="17" y2="17" />
                <line x1="17" y1="7" x2="7" y2="17" />
              </g>
            )
          case 'tumor':
            return (
              <g>
                <circle cx="12" cy="12" r="8" fill={color} opacity="0.8" />
                <circle cx="12" cy="12" r="8" fill="none" stroke={color} strokeWidth="1.5" />
              </g>
            )
          case 'foreign':
            return (
              <g fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round">
                <rect x="6" y="6" width="12" height="12" transform="rotate(45 12 12)" />
              </g>
            )
          case 'neo':
            return (
              <g fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="8" opacity="0.4" />
                <line x1="12" y1="4" x2="12" y2="20" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="6.5" y1="6.5" x2="17.5" y2="17.5" />
                <line x1="17.5" y1="6.5" x2="6.5" y2="17.5" />
              </g>
            )
          case 'keratitis':
            return (
              <g fill="none" stroke={color} strokeWidth="1.5">
                <defs>
                  <pattern id="hatch-keratitis" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="4" stroke={color} strokeWidth="1" />
                  </pattern>
                </defs>
                <circle cx="12" cy="12" r="8" fill="url(#hatch-keratitis)" opacity="0.8" />
                <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.8" />
              </g>
            )
          default: return null
        }
      })()}
    </svg>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────

interface Props {
  kind: OphthalmicSchematicKind
  species: string
  side: 'OD' | 'OS'
  markings: OphthalmicMarker[]
  paths: OphthalmicPath[]
  onAddMarking: (marking: OphthalmicMarker) => void
  onRemoveMarking: (id: string) => void
  onAddPath: (path: OphthalmicPath) => void
  onRemovePath: (id: string) => void
  onClearAll: () => void
}

export default function OphthalmicSchematicCanvas({
  kind,
  species,
  side,
  markings,
  paths,
  onAddMarking,
  onRemoveMarking,
  onAddPath,
  onRemovePath,
  onClearAll
}: Props) {
  const [tool, setTool] = useState<'marker' | 'pen' | 'eraser'>(
    kind === 'external' || kind === 'cornea' ? 'marker' : 'pen'
  )
  const [selectedType, setSelectedType] = useState<string>(MARKER_TYPES[0].id)
  const [drawColor, setDrawColor] = useState<string>('#e11d48') // rose-600
  const [drawWidth, setDrawWidth] = useState<number>(2.5)
  
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([])

  const showMarkers = kind === 'external' || kind === 'cornea'

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    let clientX, clientY
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100
    }
  }

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (tool !== 'pen') return
    setIsDrawing(true)
    const coords = getCoords(e)
    setCurrentPoints([coords])
  }

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || tool !== 'pen') return
    const coords = getCoords(e)
    setCurrentPoints(prev => [...prev, coords])
  }

  const handleEnd = () => {
    if (!isDrawing || tool !== 'pen') return
    setIsDrawing(false)
    if (currentPoints.length > 1) {
      onAddPath({
        id: Math.random().toString(36).substr(2, 9),
        points: currentPoints,
        color: drawColor,
        width: drawWidth,
        side
      })
    }
    setCurrentPoints([])
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (tool !== 'marker' || !showMarkers) return
    const coords = getCoords(e)
    onAddMarking({
      id: Math.random().toString(36).substr(2, 9),
      type: selectedType,
      x: coords.x,
      y: coords.y,
      side
    })
  }

  const filteredMarkings = markings.filter(m => m.side === side)
  const filteredPaths = paths.filter(p => p.side === side)

  const SchematicComp = useMemo(() => {
    switch (kind) {
      case 'external': return ExternalSchematic
      case 'cornea': return CorneaSchematic
      case 'lens': return LensSchematic
      case 'fundus': return FundusSchematic
      default: return CorneaSchematic
    }
  }, [kind])

  return (
    <div className="flex flex-col gap-3">
      {/* Tool Palette */}
      <div className="flex flex-col gap-2 p-3 bg-slate-100/50 rounded-xl border border-slate-200 shadow-sm">
        {/* Row 1: Primary Tools */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex bg-white rounded-lg p-1 border shadow-sm shrink-0">
            {showMarkers && (
              <button
                onClick={() => setTool('marker')}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-1.5 rounded-md transition-all text-xs font-black",
                  tool === 'marker' ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <MousePointer2 className="w-3.5 h-3.5" />
                마커 모드
              </button>
            )}
            <button
              onClick={() => setTool('pen')}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-md transition-all text-xs font-black",
                tool === 'pen' ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <Pencil className="w-3.5 h-3.5" />
              그리기 모드
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-md transition-all text-xs font-black",
                tool === 'eraser' ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <Eraser className="w-3.5 h-3.5" />
              지우개 모드
            </button>
          </div>

          {/* Reset Action always visible or prominent when needed */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-[11px] font-black gap-1.5 px-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
            onClick={onClearAll}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            전체 초기화
          </Button>
        </div>

        {/* Row 2: Marker Palette (Stay visible if domain supports it) */}
        {showMarkers && (
          <div className="pt-2 border-t border-slate-200">
            <div className="flex flex-wrap gap-1.5">
              <div className="flex items-center gap-1.5 px-2 mr-1 border-r border-slate-300">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Markers</span>
              </div>
              {MARKER_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setSelectedType(type.id)
                    setTool('marker') // Auto-switch to marker tool when icon is clicked
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border shadow-sm shrink-0",
                    tool === 'marker' && selectedType === type.id 
                      ? "bg-white border-rose-200 text-rose-600 ring-2 ring-rose-50" 
                      : "bg-white/50 border-transparent text-slate-500 hover:bg-white hover:border-slate-200"
                  )}
                >
                  <MarkerGlyph type={type.id} size={14} />
                  <span className="text-[11px] font-black">{type.ko}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={cn(
          "pt-2 border-t border-slate-200 transition-all",
          tool === 'pen' ? "opacity-100 h-auto" : "opacity-40"
        )}>
          <div className="flex flex-wrap items-center gap-6">
            {/* Color Palette */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 mr-1 border-r border-slate-300">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Colors</span>
              </div>
              <div className="flex gap-2.5">
                {['#e11d48', '#2563eb', '#ca8a04', '#16a34a', '#1a1d20'].map(color => (
                  <button
                    key={color}
                    onClick={() => {
                      setDrawColor(color)
                      setTool('pen')
                    }}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 shadow-sm",
                      drawColor === color ? "border-slate-900 scale-125 ring-2 ring-offset-1 ring-slate-200" : "border-white"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Width Selector */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 mr-1 border-r border-slate-300">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Width</span>
              </div>
              <div className="flex items-center gap-3 bg-white p-1 rounded-lg border">
                {[1, 2.5, 5, 8].map(w => (
                  <button
                    key={w}
                    onClick={() => {
                      setDrawWidth(w)
                      setTool('pen')
                    }}
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded transition-all",
                      drawWidth === w ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:bg-slate-50"
                    )}
                  >
                    <div 
                      className="bg-current rounded-full" 
                      style={{ 
                        width: Math.max(2, w * 1.5), 
                        height: Math.max(2, w * 1.5) 
                      }} 
                    />
                  </button>
                ))}
              </div>
            </div>

            {tool !== 'pen' && (
              <span className="text-[10px] font-bold text-slate-400 animate-pulse italic">
                색상이나 두께를 선택하면 그리기 모드로 전환됩니다.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative group select-none">
        <div 
          className={cn(
            "relative aspect-square bg-white rounded-2xl border-2 border-slate-100 shadow-inner overflow-hidden",
            tool === 'pen' ? "cursor-pencil" : tool === 'eraser' ? "cursor-eraser" : "cursor-crosshair",
            kind === 'external' && side === 'OS' ? "[&_svg.main-schematic]:scale-x-[-1]" : ""
          )}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          onClick={handleCanvasClick}
        >
          {/* Main Schematic SVG */}
          <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
            <div className="w-full h-full main-schematic">
              <SchematicComp species={species} side={side} />
            </div>
          </div>

          {/* Drawing Layer (SVG) */}
          <svg 
            viewBox="0 0 100 100" 
            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
            preserveAspectRatio="none"
          >
            {filteredPaths.map((p) => (
              <polyline
                key={p.id}
                points={p.points.map(pt => `${pt.x},${pt.y}`).join(' ')}
                fill="none"
                stroke={p.color}
                strokeWidth={p.width}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={cn(
                  "transition-opacity", 
                  tool === 'eraser' ? "hover:opacity-30 cursor-pointer pointer-events-auto" : ""
                )}
                onClick={(e) => {
                  if (tool === 'eraser') {
                    e.stopPropagation()
                    onRemovePath(p.id)
                  }
                }}
              />
            ))}
            {isDrawing && currentPoints.length > 1 && (
              <polyline
                points={currentPoints.map(pt => `${pt.x},${pt.y}`).join(' ')}
                fill="none"
                stroke={drawColor}
                strokeWidth={drawWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>

          {/* Markings Overlay */}
          {filteredMarkings.map((m) => (
            <div
              key={m.id}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125 z-10",
                tool === 'eraser' ? "cursor-pointer" : "pointer-events-none"
              )}
              style={{ left: `${m.x}%`, top: `${m.y}%` }}
              onClick={(e) => {
                if (tool === 'eraser') {
                  e.stopPropagation()
                  onRemoveMarking(m.id)
                }
              }}
            >
              <div className="relative group/marker">
                <MarkerGlyph type={m.type} size={24} />
                {tool === 'eraser' && (
                  <div className="absolute -top-1 -right-1 bg-white rounded-full shadow-md p-0.5 border border-rose-100">
                    <X className="w-3 h-3 text-rose-500" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Helper Hint */}
        <div className="mt-2 flex items-center justify-between px-1">
          <p className="text-[10px] font-bold text-slate-400 italic">
            * {side === 'OD' ? '우안(Right Eye)' : '좌안(Left Eye)'} - {tool === 'pen' ? '자유롭게 그림을 그려 소견을 표시하세요.' : tool === 'marker' ? '클릭하여 마커를 배치하세요.' : '마커나 선을 클릭하여 삭제하세요.'}
          </p>
        </div>
      </div>
    </div>
  )
}
