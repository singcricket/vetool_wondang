'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Loader2, Plus } from 'lucide-react'
import type { DermLesionGroup, Marker } from '@/types/hospital/derm-type'
import { getAnatomicalZone } from '@/lib/utils/derm-anatomy'

// viewBox: "0 0 100 110"
// Markers stored as normalized (x÷100, y÷110)

interface PendingState { svgX: number; svgY: number }
interface SelectedState { groupId: string; markerNumber: number; svgX: number; svgY: number }

interface Props {
  species: string
  lesionGroups: DermLesionGroup[]
  onAddMarkerToGroup: (groupId: string, svgX: number, svgY: number) => void
  onRemoveMarkerFromGroup: (groupId: string, markerNumber: number) => void
  onCreateGroupAtPosition: (svgX: number, svgY: number) => Promise<void>
  isCreatingGroup?: boolean
}

function popoverStyle(svgX: number, svgY: number): React.CSSProperties {
  const flipX = svgX > 58
  const flipY = svgY > 75
  return {
    position: 'absolute',
    left: `${Math.max(2, Math.min(svgX, 90))}%`,
    top: `${Math.max(2, Math.min((svgY / 110) * 100, 78))}%`,
    transform: [
      flipX ? 'translateX(-105%)' : 'translateX(5%)',
      flipY ? 'translateY(-105%)' : 'translateY(5%)',
    ].join(' '),
    zIndex: 30,
  }
}

export default function DermBodyMap({
  species,
  lesionGroups,
  onAddMarkerToGroup,
  onRemoveMarkerFromGroup,
  onCreateGroupAtPosition,
  isCreatingGroup = false,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [pending, setPending] = useState<PendingState | null>(null)
  const [selected, setSelected] = useState<SelectedState | null>(null)

  const imageSrc = /^(cat|feline)/i.test(species)
    ? '/checkup/skin/cat-skin.png'
    : '/checkup/skin/dog-skin.png'

  // Close popovers on outside click
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

  const getSvgPoint = (e: React.MouseEvent<SVGSVGElement>): { x: number; y: number } | null => {
    const svgEl = svgRef.current
    if (!svgEl) return null
    const pt = svgEl.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgPt = pt.matrixTransform(svgEl.getScreenCTM()!.inverse())
    return { x: svgPt.x, y: svgPt.y }
  }

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    // Check if clicked on a marker
    const markerEl = (e.target as Element).closest('[data-marker]')
    if (markerEl) {
      const groupId = markerEl.getAttribute('data-group-id')!
      const markerNum = Number(markerEl.getAttribute('data-marker-num'))
      const svgPt = getSvgPoint(e)
      if (!svgPt) return
      const group = lesionGroups.find((g) => g.id === groupId)
      const marker = (group?.marker_data ?? []).find((m) => m.number === markerNum)
      if (!marker || marker.type !== 'point') return
      setSelected({ groupId, markerNumber: markerNum, svgX: marker.x * 100, svgY: marker.y * 110 })
      setPending(null)
      return
    }

    const svgPt = getSvgPoint(e)
    if (!svgPt) return
    setPending({ svgX: svgPt.x, svgY: svgPt.y })
    setSelected(null)
  }

  const handleAddToGroup = (groupId: string) => {
    if (!pending) return
    onAddMarkerToGroup(groupId, pending.svgX, pending.svgY)
    setPending(null)
  }

  const handleCreateGroup = async () => {
    if (!pending) return
    const { svgX, svgY } = pending
    setPending(null)
    await onCreateGroupAtPosition(svgX, svgY)
  }

  const handleRemoveMarker = () => {
    if (!selected) return
    onRemoveMarkerFromGroup(selected.groupId, selected.markerNumber)
    setSelected(null)
  }

  // All markers flat with group info for rendering
  const allMarkers: { marker: Marker; group: DermLesionGroup }[] = lesionGroups.flatMap((g) =>
    (g.marker_data ?? []).map((m) => ({ marker: m, group: g })),
  )

  const pendingZone = pending ? getAnatomicalZone(pending.svgX, pending.svgY) : null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-0.5 rounded-full bg-emerald-500" />
        <p className="text-xs font-bold text-slate-700">병변 위치도</p>
        {allMarkers.length > 0 && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
            {allMarkers.length}개 마커
          </span>
        )}
      </div>

      <div
        className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white"
        style={{ maxWidth: 480 }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 100 110"
          className="w-full cursor-crosshair select-none"
          style={{ display: 'block' }}
          onClick={handleSvgClick}
        >
          <image href={imageSrc} x="0" y="0" width="100" height="110" preserveAspectRatio="xMidYMid meet" />

          {allMarkers.map(({ marker, group }) => {
            if (marker.type !== 'point') return null
            const cx = marker.x * 100
            const cy = marker.y * 110
            const color = group.group_color ?? '#6b7280'
            const label = group.group_label
            const isSelected = selected?.groupId === group.id && selected.markerNumber === marker.number
            return (
              <g key={`${group.id}-${marker.number}`} data-marker data-group-id={group.id} data-marker-num={marker.number} style={{ cursor: 'pointer' }}>
                {isSelected && (
                  <circle cx={cx} cy={cy} r={5.5} fill="none" stroke={color} strokeWidth={0.5} opacity={0.4} />
                )}
                <circle cx={cx} cy={cy} r={3.2} fill={color + 'bb'} stroke={color} strokeWidth={0.8} />
                <text
                  x={cx} y={cy + 1.1}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="2.6" fontWeight="bold" fill="#fff"
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
            className="min-w-[160px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
            style={popoverStyle(pending.svgX, pending.svgY)}
          >
            <p className="border-b border-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {pendingZone ? pendingZone.label : '위치 선택'}
            </p>

            {lesionGroups.filter((g) => g.status === 'active').map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => handleAddToGroup(g.id)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full border-2"
                  style={{ borderColor: g.group_color ?? '#6b7280', background: (g.group_color ?? '#6b7280') + '55' }}
                />
                <span className="font-medium text-slate-700">{g.group_label}그룹</span>
                <span className="ml-auto text-[10px] text-slate-300">
                  {(g.marker_data ?? []).length}
                </span>
              </button>
            ))}

            <button
              type="button"
              onClick={handleCreateGroup}
              disabled={isCreatingGroup}
              className="flex w-full items-center gap-1.5 border-t border-slate-100 px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
            >
              {isCreatingGroup
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <Plus className="h-3 w-3" />}
              새 그룹 추가
            </button>

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
          const group = lesionGroups.find((g) => g.id === selected.groupId)
          const color = group?.group_color ?? '#6b7280'
          const zone = getAnatomicalZone(selected.svgX, selected.svgY)
          return (
            <div
              data-popover
              className="min-w-[140px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
              style={popoverStyle(selected.svgX, selected.svgY)}
            >
              <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: color }} />
                <span className="text-xs font-semibold text-slate-700">{group?.group_label}그룹</span>
                {zone && <span className="text-[10px] text-slate-400 truncate">{zone.label}</span>}
              </div>
              <button
                type="button"
                onClick={handleRemoveMarker}
                className="flex w-full items-center gap-1.5 px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-50"
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

      {/* 범례 */}
      {lesionGroups.filter((g) => g.status === 'active').length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {lesionGroups.filter((g) => g.status === 'active').map((g) => {
            const count = (g.marker_data ?? []).length
            return (
              <div
                key={g.id}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px]"
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: g.group_color ?? '#6b7280' }} />
                <span className="font-semibold text-slate-600">{g.group_label}그룹</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-400">{count}곳</span>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-[10px] text-slate-400">좌: 복면(배 쪽) · 우: 배면(등 쪽) · 클릭 → 마커 추가 · 마커 클릭 → 삭제</p>
    </div>
  )
}
