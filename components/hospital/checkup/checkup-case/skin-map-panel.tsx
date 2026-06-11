'use client'

import { useState, useRef, useEffect } from 'react'
import { X, MapPin } from 'lucide-react'
import type { SkinLesion } from '@/types/hospital/checkup-type'

// ── 타입 ──────────────────────────────────────────────────────

export interface SkinMapMarker {
  id: string
  lesion_id: string
  x: number   // % of image width  (0–100)
  y: number   // % of image height (0–100)
}

// ── 색상 팔레트 ───────────────────────────────────────────────

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#a855f7', '#ec4899', '#06b6d4',
]
export function getLesionColor(index: number): string {
  return COLORS[index % COLORS.length]
}

// ── 리포트용 읽기 전용 썸네일 ────────────────────────────────

interface ThumbnailProps {
  species: string
  lesionId: string
  lesionIndex: number
  markers: SkinMapMarker[]
  className?: string
}

export function SkinMapThumbnail({ species, lesionId, lesionIndex, markers, className }: ThumbnailProps) {
  const myMarkers = markers.filter((m) => m.lesion_id === lesionId)
  if (myMarkers.length === 0) return null

  const imageSrc = /^(cat|feline)/i.test(species)
    ? '/checkup/skin/cat-skin.png'
    : '/checkup/skin/dog-skin.png'
  const color = getLesionColor(lesionIndex)

  return (
    <div
      className={`shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white ${className ?? 'h-28 w-28'}`}
      title={`병변 ${lesionIndex + 1} 위치 (${myMarkers.length}곳)`}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ display: 'block' }}>
        <image
          href={imageSrc}
          x="0" y="0" width="100" height="100"
          preserveAspectRatio="xMidYMid meet"
        />
        {myMarkers.map((marker) => (
          <g key={marker.id}>
            <circle cx={marker.x} cy={marker.y} r={4} fill={color + 'bb'} stroke={color} strokeWidth={1} />
            <text
              x={marker.x} y={marker.y + 1.2}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="3.2" fontWeight="bold" fill="#fff"
            >
              {lesionIndex + 1}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────

interface Props {
  species: string
  lesions: SkinLesion[]
  markers: SkinMapMarker[]
  onChange: (markers: SkinMapMarker[]) => void
}

interface PendingState { x: number; y: number }
interface SelectedState { marker: SkinMapMarker }

// ── 컴포넌트 ──────────────────────────────────────────────────

export default function SkinMapPanel({ species, lesions, markers, onChange }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [pending, setPending] = useState<PendingState | null>(null)
  const [selected, setSelected] = useState<SelectedState | null>(null)

  const imageSrc = /^(cat|feline)/i.test(species)
    ? '/checkup/skin/cat-skin.png'
    : '/checkup/skin/dog-skin.png'

  // 팝오버 외부 클릭 닫기
  useEffect(() => {
    if (!pending && !selected) return
    const handler = (e: MouseEvent) => {
      if ((e.target as Element).closest('[data-popover]')) return
      setPending(null)
      setSelected(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pending, selected])

  // SVG 단일 클릭 핸들러 — 마커 클릭 vs 빈 영역 구분
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const markerEl = (e.target as Element).closest('[data-marker-id]')
    if (markerEl) {
      const id = markerEl.getAttribute('data-marker-id')!
      const marker = markers.find((m) => m.id === id)
      if (marker) {
        setSelected({ marker })
        setPending(null)
      }
      return
    }
    // SVG 내부 좌표로 변환 (preserveAspectRatio 오프셋 포함)
    const svgEl = e.currentTarget
    const pt = svgEl.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgPt = pt.matrixTransform(svgEl.getScreenCTM()!.inverse())
    const x = svgPt.x
    const y = svgPt.y
    setPending({ x, y })
    setSelected(null)
  }

  const addMarker = (lesionId: string) => {
    if (!pending) return
    onChange([...markers, {
      id: crypto.randomUUID(),
      lesion_id: lesionId,
      x: pending.x,
      y: pending.y,
    }])
    setPending(null)
  }

  const removeMarker = (markerId: string) => {
    onChange(markers.filter((m) => m.id !== markerId))
    setSelected(null)
  }

  // 팝오버 위치: SVG viewBox 좌표(0-100) → % 변환, 경계 보정
  const popoverStyle = (x: number, y: number): React.CSSProperties => {
    const flipX = x > 58
    return {
      position: 'absolute',
      left: `${Math.max(2, Math.min(x, 95))}%`,
      top: `${Math.max(2, Math.min(y, 80))}%`,
      transform: flipX ? 'translateX(-105%)' : 'translateX(5%)',
      zIndex: 20,
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-0.5 rounded-full bg-teal-500" />
        <p className="text-xs font-bold text-slate-700">피부 병변 위치도</p>
        {markers.length > 0 && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
            {markers.length}개 마커
          </span>
        )}
      </div>

      {/* ── 맵 + 팝오버 컨테이너 ── */}
      <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white" style={{ maxWidth: 480 }}>
        {/* SVG가 이미지 역할 + 모든 클릭 처리 */}
        <svg
          ref={svgRef}
          viewBox="0 0 100 110"
          className="w-full cursor-crosshair select-none"
          style={{ display: 'block' }}
          onClick={handleSvgClick}
        >
          <image
            href={imageSrc}
            x="0"
            y="0"
            width="100"
            height="110"
            preserveAspectRatio="xMidYMid meet"
          />
          {/* 마커들 */}
          {markers.map((marker) => {
            const lesionIndex = lesions.findIndex((l) => l.id === marker.lesion_id)
            const color = getLesionColor(lesionIndex >= 0 ? lesionIndex : 0)
            const label = lesionIndex >= 0 ? String(lesionIndex + 1) : '?'
            const isSelected = selected?.marker.id === marker.id
            return (
              <g
                key={marker.id}
                data-marker-id={marker.id}
                style={{ cursor: 'pointer' }}
              >
                {isSelected && (
                  <circle
                    cx={marker.x}
                    cy={marker.y}
                    r={5.5}
                    fill="none"
                    stroke={color}
                    strokeWidth={0.5}
                    opacity={0.35}
                  />
                )}
                <circle
                  cx={marker.x}
                  cy={marker.y}
                  r={3.2}
                  fill={color + 'bb'}
                  stroke={color}
                  strokeWidth={0.8}
                />
                <text
                  x={marker.x}
                  y={marker.y + 1.1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="2.8"
                  fontWeight="bold"
                  fill="#fff"
                  style={{ pointerEvents: 'none' }}
                >
                  {label}
                </text>
              </g>
            )
          })}
        </svg>

        {/* ── 추가 팝오버 ── */}
        {pending && (
          <div
            data-popover
            className="min-w-[148px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
            style={popoverStyle(pending.x, pending.y)}
          >
            <p className="border-b border-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              병변 선택
            </p>
            {lesions.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-400">아래에서 병변을 먼저 추가하세요</p>
            ) : (
              lesions.map((lesion, i) => {
                const count = markers.filter((m) => m.lesion_id === lesion.id).length
                return (
                  <button
                    key={lesion.id}
                    type="button"
                    onClick={() => addMarker(lesion.id)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50 active:bg-slate-100"
                  >
                    <span
                      className="inline-block h-3 w-3 shrink-0 rounded-full border-2"
                      style={{ borderColor: getLesionColor(i), backgroundColor: getLesionColor(i) + '55' }}
                    />
                    <span className="font-medium text-slate-700">병변 {i + 1}</span>
                    {lesion.location && (
                      <span className="truncate text-slate-400 text-[11px]">{lesion.location}</span>
                    )}
                    <span className="ml-auto shrink-0 text-[10px] text-slate-300">{count}곳</span>
                  </button>
                )
              })
            )}
            <button
              type="button"
              onClick={() => setPending(null)}
              className="flex w-full items-center gap-1.5 border-t border-slate-100 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-50"
            >
              <X size={10} /> 취소
            </button>
          </div>
        )}

        {/* ── 마커 선택 팝오버 ── */}
        {selected && (() => {
          const { marker } = selected
          const lesionIndex = lesions.findIndex((l) => l.id === marker.lesion_id)
          const color = getLesionColor(lesionIndex >= 0 ? lesionIndex : 0)
          return (
            <div
              data-popover
              className="min-w-[130px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
              style={popoverStyle(marker.x, marker.y)}
            >
              <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
                <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs font-semibold text-slate-700">
                  {lesionIndex >= 0 ? `병변 ${lesionIndex + 1}` : '?'}
                </span>
                {lesionIndex >= 0 && lesions[lesionIndex]?.location && (
                  <span className="text-[11px] text-slate-400">{lesions[lesionIndex].location}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeMarker(marker.id)}
                className="flex w-full items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50"
              >
                <X size={11} /> 마커 삭제
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex w-full items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-50"
              >
                닫기
              </button>
            </div>
          )
        })()}
      </div>

      {/* ── 범례 ── */}
      {lesions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {lesions.map((lesion, i) => {
            const count = markers.filter((m) => m.lesion_id === lesion.id).length
            return (
              <div
                key={lesion.id}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px]"
              >
                <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: getLesionColor(i) }} />
                <span className="font-semibold text-slate-600">병변 {i + 1}</span>
                {lesion.location && <span className="text-slate-400">{lesion.location}</span>}
                <span className="text-slate-300">·</span>
                <span className="text-slate-400">{count}곳</span>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center gap-1 text-[10px] text-slate-400">
        <MapPin size={10} />
        이미지 클릭 → 마커 추가 &nbsp;·&nbsp; 마커 클릭 → 삭제
      </div>
    </div>
  )
}
