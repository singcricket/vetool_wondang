'use client'

import { useRef, useCallback } from 'react'
import type { Marker } from '@/types/hospital/derm-type'

interface Props {
  imageUrl: string
  markers: Marker[]           // all markers across all groups
  markerColors: Record<number, string>  // markerNumber → group color
  activeGroupColor?: string   // when set, clicking adds to this group
  onAddMarker?: (x: number, y: number) => void
  onRemoveMarker?: (number: number) => void
  readonly?: boolean
}

export default function DermOverviewCanvas({
  imageUrl,
  markers,
  markerColors,
  activeGroupColor,
  onAddMarker,
  onRemoveMarker,
  readonly = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (readonly || !onAddMarker || !activeGroupColor) return
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      onAddMarker(
        Math.min(Math.max(x, 0), 1),
        Math.min(Math.max(y, 0), 1),
      )
    },
    [readonly, onAddMarker, activeGroupColor],
  )

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={`relative w-full rounded-xl overflow-hidden bg-slate-100 select-none ${
        activeGroupColor && !readonly ? 'cursor-crosshair' : 'cursor-default'
      }`}
      style={{ aspectRatio: '4/3' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="전체 사진"
        className="w-full h-full object-contain"
        draggable={false}
      />

      {/* Marker overlay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {markers.map((marker) => {
          const color = markerColors[marker.number] ?? '#6b7280'
          if (marker.type === 'point') {
            return (
              <g key={marker.number} className="pointer-events-auto">
                <circle
                  cx={marker.x * 100}
                  cy={marker.y * 100}
                  r="2.2"
                  fill={color}
                  stroke="white"
                  strokeWidth="0.6"
                  className={onRemoveMarker ? 'cursor-pointer' : ''}
                  onClick={(e) => {
                    if (!onRemoveMarker || readonly) return
                    e.stopPropagation()
                    onRemoveMarker(marker.number)
                  }}
                />
                <text
                  x={marker.x * 100}
                  y={marker.y * 100 + 0.8}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="2"
                  fill="white"
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  {marker.number}
                </text>
              </g>
            )
          }
          return null
        })}
      </svg>

      {/* Active group indicator */}
      {activeGroupColor && !readonly && (
        <div
          className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold shadow-sm border"
          style={{ borderColor: activeGroupColor, color: activeGroupColor }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: activeGroupColor }}
          />
          클릭하여 마커 추가
        </div>
      )}
    </div>
  )
}
