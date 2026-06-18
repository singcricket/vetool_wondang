'use client'

import { useState, useRef, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { DermChartDetail, DermLesionGroup, DermLesionVisit, DermImage, ImprovementType } from '@/types/hospital/derm-type'
import type { Marker } from '@/types/hospital/derm-type'
import { GROUP_COLORS } from '@/types/hospital/derm-type'
import { getAnatomicalText } from '@/lib/utils/derm-anatomy'
import DermChartLayout from '@/components/hospital/derm/derm-chart-layout'
import DermBodyMap from '@/components/hospital/derm/derm-body-map'
import DermLesionGroupCard from '@/components/hospital/derm/derm-lesion-group-card'
import DermReportDialog from '@/components/hospital/derm/derm-report-dialog'
import {
  saveDermChart,
  deleteDermChartAction,
  createLesionGroupAction,
  updateLesionGroupAction,
  deleteLesionGroupAction,
  upsertLesionVisitAction,
} from '@/lib/actions/derm/derm-chart-actions'
import { deleteDermImage } from '@/lib/actions/derm/derm-image-actions'

interface VisitState {
  rawInput: string
  formalFindings: string
  lesionTypes: string[]
  aiAnalysis: DermLesionVisit['ai_analysis']
  severity: number | null
  improvement: ImprovementType | null
  aiComparisonNotes: string | null
}

interface Props {
  hosId: string
  chartId: string
  chartDate: string
  chartDetail: DermChartDetail
  vetList: { user_id: string; name: string }[]
  initialLesionGroups: DermLesionGroup[]
  initialLesionVisits: DermLesionVisit[]
  initialImages: DermImage[]
}

function buildInitialVisitState(visit?: DermLesionVisit): VisitState {
  return {
    rawInput: visit?.raw_input ?? '',
    formalFindings: visit?.formal_findings ?? '',
    lesionTypes: visit?.lesion_types ?? [],
    aiAnalysis: visit?.ai_analysis ?? null,
    severity: visit?.severity ?? null,
    improvement: visit?.improvement ?? null,
    aiComparisonNotes: visit?.ai_comparison_notes ?? null,
  }
}

function buildInitialVisitsData(
  groups: DermLesionGroup[],
  visits: DermLesionVisit[],
): Record<string, VisitState> {
  const result: Record<string, VisitState> = {}
  for (const group of groups) {
    const visit = visits.find((v) => v.lesion_group_id === group.id)
    result[group.id] = buildInitialVisitState(visit)
  }
  return result
}

export default function DermChartClient({
  hosId,
  chartId,
  chartDate,
  chartDetail,
  initialLesionGroups,
  initialLesionVisits,
  initialImages,
}: Props) {
  const router = useRouter()

  const [chiefComplaint, setChiefComplaint] = useState(chartDetail.chief_complaint ?? '')
  const [notes, setNotes] = useState(chartDetail.notes ?? '')

  const [lesionGroups, setLesionGroups] = useState<DermLesionGroup[]>(initialLesionGroups)
  const [visitsData, setVisitsData] = useState<Record<string, VisitState>>(
    buildInitialVisitsData(initialLesionGroups, initialLesionVisits),
  )
  const [images, setImages] = useState<DermImage[]>(initialImages)

  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const allInitialMarkers = initialLesionGroups.flatMap((g) => g.marker_data ?? [])
  const nextMarkerNumber = useRef<number>(
    allInitialMarkers.length > 0 ? Math.max(...allInitialMarkers.map((m) => m.number)) + 1 : 1,
  )

  const getNextMarkerNumber = useCallback(() => nextMarkerNumber.current++, [])

  // ── Visit state ───────────────────────────────────────────────

  const handleVisitChange = useCallback((groupId: string, update: Partial<VisitState>) => {
    setVisitsData((prev) => ({ ...prev, [groupId]: { ...prev[groupId], ...update } }))
  }, [])

  // ── Images ────────────────────────────────────────────────────

  const handleImageAdded = useCallback((img: DermImage) => {
    setImages((prev) => [...prev, img])
  }, [])

  const handleImageDeleted = useCallback((imgId: string) => {
    setImages((prev) => prev.filter((i) => i.id !== imgId))
  }, [])

  // ── Markers (via body map) ────────────────────────────────────

  const handleAddMarkerToGroup = useCallback((groupId: string, svgX: number, svgY: number) => {
    const num = getNextMarkerNumber()
    const newMarker: Marker = { type: 'point', x: svgX / 100, y: svgY / 110, number: num }
    setLesionGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, marker_data: [...(g.marker_data ?? []), newMarker] }
          : g,
      ),
    )
  }, [getNextMarkerNumber])

  const handleRemoveMarkerFromGroup = useCallback((groupId: string, markerNumber: number) => {
    setLesionGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, marker_data: (g.marker_data ?? []).filter((m) => m.number !== markerNumber) }
          : g,
      ),
    )
  }, [])

  // ── Lesion groups ─────────────────────────────────────────────

  const createGroup = useCallback(async () => {
    if (!chartDetail.patient_id) return null
    const usedColors = new Set(lesionGroups.map((g) => g.group_color))
    const color = GROUP_COLORS.find((c) => !usedColors.has(c)) ?? GROUP_COLORS[lesionGroups.length % GROUP_COLORS.length]
    const label = String.fromCharCode(65 + lesionGroups.length)
    const newGroup = await createLesionGroupAction({
      hosId,
      patientId: chartDetail.patient_id,
      initialChartId: chartId,
      groupLabel: label,
      groupColor: color,
    })
    setLesionGroups((prev) => [...prev, newGroup])
    setVisitsData((prev) => ({ ...prev, [newGroup.id]: buildInitialVisitState() }))
    return newGroup
  }, [hosId, chartId, chartDetail.patient_id, lesionGroups])

  const handleCreateGroupAtPosition = useCallback(async (svgX: number, svgY: number) => {
    setIsCreatingGroup(true)
    try {
      const newGroup = await createGroup()
      if (!newGroup) return
      handleAddMarkerToGroup(newGroup.id, svgX, svgY)
      toast.success(`${newGroup.group_label}그룹 생성됨`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsCreatingGroup(false)
    }
  }, [createGroup, handleAddMarkerToGroup])

  const handleAddGroup = async () => {
    try {
      const newGroup = await createGroup()
      if (newGroup) toast.success(`${newGroup.group_label}그룹 생성됨`)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const groupImages = images.filter((i) => i.lesion_group_id === groupId)
      await Promise.all(groupImages.map((i) => deleteDermImage(i.id, i.image_url, hosId)))
      await deleteLesionGroupAction(groupId, hosId)
      setLesionGroups((prev) => prev.filter((g) => g.id !== groupId))
      setVisitsData((prev) => { const n = { ...prev }; delete n[groupId]; return n })
      setImages((prev) => prev.filter((i) => i.lesion_group_id !== groupId))
      toast.success('그룹 삭제됨')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // ── Save ──────────────────────────────────────────────────────

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveDermChart(chartId, hosId, {
        chief_complaint: chiefComplaint || null,
        notes: notes || null,
      })

      await Promise.all([
        ...lesionGroups.map((g) =>
          updateLesionGroupAction(g.id, hosId, { marker_data: g.marker_data ?? null }),
        ),
        ...lesionGroups.map((g) => {
          const v = visitsData[g.id]
          if (!v) return Promise.resolve()
          return upsertLesionVisitAction({
            hosId,
            chartId,
            lesionGroupId: g.id,
            rawInput: v.rawInput || null,
            formalFindings: v.formalFindings || null,
            lesionTypes: v.lesionTypes.length > 0 ? v.lesionTypes : null,
            aiAnalysis: v.aiAnalysis,
            severity: v.severity,
            improvement: v.improvement,
            aiComparisonNotes: v.aiComparisonNotes,
          })
        }),
      ])

      toast.success('저장 완료')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // ── Delete chart ──────────────────────────────────────────────

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteDermChartAction(chartId, hosId)
      router.push(`/hospital/${hosId}/derm/${chartDate}` as any)
    } catch (err: any) {
      toast.error(err.message)
      setIsDeleting(false)
    }
  }

  const activeGroups = lesionGroups.filter((g) => g.status === 'active')
  const species = chartDetail.patient?.species ?? 'canine'

  return (
    <DermChartLayout
      chartDetail={chartDetail}
      onSave={handleSave}
      isSaving={isSaving}
      onDelete={handleDelete}
      isDeleting={isDeleting}
    >
      <div className="flex h-full overflow-hidden">
        {/* Left: body map + group list */}
        <div className="w-80 shrink-0 border-r bg-white overflow-y-auto flex flex-col">
          {/* Body map */}
          <div className="p-4 border-b">
            <DermBodyMap
              species={species}
              lesionGroups={lesionGroups}
              onAddMarkerToGroup={handleAddMarkerToGroup}
              onRemoveMarkerFromGroup={handleRemoveMarkerFromGroup}
              onCreateGroupAtPosition={handleCreateGroupAtPosition}
              isCreatingGroup={isCreatingGroup}
            />
          </div>

          {/* Chief complaint */}
          <div className="px-4 pt-3 pb-2">
            <label className="text-xs font-semibold text-slate-600">주증상</label>
            <input
              type="text"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="예: 가려움, 탈모"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* Group list */}
          <div className="px-4 py-2 flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">병변 그룹 ({activeGroups.length})</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddGroup}
                className="h-6 gap-1 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                <Plus className="h-3 w-3" />
                그룹 추가
              </Button>
            </div>

            <div className="space-y-1.5">
              {activeGroups.map((group) => {
                const visit = visitsData[group.id]
                const locationText = getAnatomicalText(group.marker_data ?? [])
                return (
                  <div
                    key={group.id}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 border"
                    style={{ borderColor: group.group_color ?? '#e2e8f0' }}
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                      style={{ background: group.group_color ?? '#6b7280' }}
                    >
                      {group.group_label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{group.group_label}그룹</p>
                      {locationText && (
                        <p className="text-[10px] text-slate-400 truncate">{locationText}</p>
                      )}
                    </div>
                    {visit?.severity && (
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{
                          background:
                            visit.severity === 1 ? '#22c55e'
                            : visit.severity === 2 ? '#eab308'
                            : visit.severity === 3 ? '#f97316'
                            : '#e11d48',
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Report button */}
          {activeGroups.length > 0 && (
            <div className="p-4 border-t">
              <DermReportDialog
                chartDetail={chartDetail}
                lesionGroups={lesionGroups}
                visitsData={visitsData}
                images={images}
                chiefComplaint={chiefComplaint}
                notes={notes}
              />
            </div>
          )}
        </div>

        {/* Right: group cards */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
          {activeGroups.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center max-w-xs">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
                  <Plus className="h-7 w-7 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-slate-700 mb-1">병변 위치를 클릭해주세요</p>
                <p className="text-xs text-slate-500 mb-4">
                  왼쪽 신체 모식도에서 병변 부위를 클릭하면 그룹이 자동으로 생성됩니다.
                </p>
                <Button
                  onClick={handleAddGroup}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="h-4 w-4" />
                  그룹 직접 추가
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-2xl mx-auto">
              {activeGroups.map((group) => {
                const visit = visitsData[group.id]
                if (!visit) return null
                const locationText = getAnatomicalText(group.marker_data ?? [])
                return (
                  <DermLesionGroupCard
                    key={group.id}
                    group={group}
                    visit={visit}
                    images={images}
                    isFollowup={chartDetail.visit_type === 'followup'}
                    hosId={hosId}
                    chartId={chartId}
                    patient={chartDetail.patient}
                    anatomicalLocation={locationText}
                    onVisitChange={handleVisitChange}
                    onImageAdded={handleImageAdded}
                    onImageDeleted={handleImageDeleted}
                    onDelete={handleDeleteGroup}
                  />
                )
              })}

              {/* Notes */}
              <div className="rounded-2xl border bg-white shadow-sm p-4">
                <label className="text-xs font-semibold text-slate-600">추가 소견 / 메모</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="전체적인 소견, 치료 계획, 참고사항 등"
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-slate-300"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </DermChartLayout>
  )
}
