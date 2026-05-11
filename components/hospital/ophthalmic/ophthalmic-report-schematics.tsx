'use client'

import React from 'react'
import { 
  ExternalSchematic, 
  CorneaSchematic, 
  LensSchematic, 
  FundusSchematic, 
  MarkerGlyph,
  OphthalmicMarker,
  OphthalmicPath,
  MARKER_TYPES
} from './ophthalmic-schematic-canvas'
import { cn } from '@/lib/utils/utils'

interface SchematicViewProps {
  kind: 'external' | 'cornea' | 'lens' | 'fundus'
  species: string
  side: 'OD' | 'OS'
  markings: OphthalmicMarker[]
  paths: OphthalmicPath[]
  label: string
}

function SchematicView({ kind, species, side, markings, paths, label }: SchematicViewProps) {
  const filteredMarkings = markings.filter(m => m.side === side)
  const filteredPaths = paths.filter(p => p.side === side)

  const SchematicComp = (() => {
    switch (kind) {
      case 'external': return ExternalSchematic
      case 'cornea': return CorneaSchematic
      case 'lens': return LensSchematic
      case 'fundus': return FundusSchematic
      default: return CorneaSchematic
    }
  })()

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-64 h-64 md:w-80 md:h-80 bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden p-4">
        <div className={cn(
          "w-full h-full flex items-center justify-center",
          kind === 'external' && side === 'OS' ? "[&_svg]:scale-x-[-1]" : ""
        )}>
          <SchematicComp species={species} side={side} />
        </div>
        
        {/* Drawing Overlay */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
          {filteredPaths.map((p) => (
            <polyline
              key={p.id}
              points={p.points.map(pt => `${pt.x},${pt.y}`).join(' ')}
              fill="none"
              stroke={p.color}
              strokeWidth={p.width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>

        {/* Markings Overlay */}
        {filteredMarkings.map((m) => (
          <div
            key={m.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${m.x}%`, top: `${m.y}%` }}
          >
            <MarkerGlyph type={m.type} size={14} />
          </div>
        ))}
      </div>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
        {side} {label}
      </span>
    </div>
  )
}

interface Props {
  results: Record<string, any>
  species: string
}

export default function OphthalmicReportSchematics({ results, species }: Props) {
  const domains = [
    { key: 'gross_inspection', kind: 'external' as const, label: '육안' },
    { key: 'slit_lamp_cornea', kind: 'cornea' as const, label: '각막' },
    { key: 'slit_lamp_lens', kind: 'lens' as const, label: '수정체' },
    { key: 'fundoscopy', kind: 'fundus' as const, label: '안저' },
  ]

  return (
    <div className="grid grid-cols-1 gap-8 py-6 border-y border-slate-100 bg-slate-50/30 px-4 rounded-3xl">
      {domains.map((domain) => {
        const markings = (results[`markings_${domain.key}`] as OphthalmicMarker[]) || []
        const paths = (results[`drawings_${domain.key}`] as OphthalmicPath[]) || []

        // Only show if there's data
        if (markings.length === 0 && paths.length === 0) return null

        return (
          <div key={domain.key} className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-4 w-1 bg-blue-500 rounded-full" />
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">{domain.label} 검사 모식도 소견</h4>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              <SchematicView
                kind={domain.kind}
                species={species}
                side="OD"
                markings={markings}
                paths={paths}
                label={domain.label}
              />
              <SchematicView
                kind={domain.kind}
                species={species}
                side="OS"
                markings={markings}
                paths={paths}
                label={domain.label}
              />
            </div>
          </div>
        )
      })}

      {/* Marker Legend Index */}
      <div className="mt-4 pt-6 border-t border-slate-200 flex flex-wrap justify-center gap-x-8 gap-y-4">
        <div className="w-full flex justify-center mb-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 -mt-8 border rounded-full">
            Marker Legend
          </span>
        </div>
        {MARKER_TYPES.map((type) => (
          <div key={type.id} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-100 shadow-sm">
            <MarkerGlyph type={type.id} size={16} />
            <span className="text-xs font-black text-slate-700">{type.ko}</span>
          </div>
        ))}
        {/* Draw Line Hint */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-100 shadow-sm">
          <div className="w-4 h-1 bg-rose-500 rounded-full" />
          <span className="text-xs font-black text-slate-700">자유선 (기타 소견)</span>
        </div>
      </div>
    </div>
  )
}
