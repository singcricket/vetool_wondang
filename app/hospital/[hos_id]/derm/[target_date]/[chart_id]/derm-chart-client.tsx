'use client'

import { useState, useRef, useCallback } from 'react'
import { Plus, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { DermChartDetail, DermLesionGroup, DermLesionVisit, DermImage, ImprovementType, Marker } from '@/types/hospital/derm-type'
import { GROUP_COLORS } from '@/types/hospital/derm-type'
import DermChartLayout from '@/components/hospital/derm/derm-chart-layout'
import DermOverviewCanvas from '@/components/hospital/derm/derm-overview-canvas'
import DermLesionGroupCard from '@/components/hospital/derm/derm-lesion-group-card'
import DermReportDialog from '@/components/hospital/derm/derm-report-dialog'
import { saveDermChart, deleteDermChartAction, createLesionGroupAction, updateLesionGroupAction, deleteLesionGroupAction, upsertLesionVisitAction } from '@/lib/actions/derm/derm-chart-actions'
import { insertDermImage, deleteDermImage } from '@/lib/actions/derm/derm-image-actions'
import { uploadDermImage } from '@/lib/services/derm/upload-derm-image'

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

function buildInitialVisitsData(groups: DermLesionGroup[], visits: DermLesionVisit[]): Record<string, VisitState> {
  const result: Record<string, VisitState> = {}
  for (const group of groups) {
    const visit = visits.find((v) => v.lesion_group_id === group.id)
    result[group.id] = buildInitialVisitState(visit)
  }
  return result
}

export default function DermChartClient({
  hosId, chartId, chartDate, chartDetail, initialLesionGroups, initialLesionVisits, initialImages,
}: Props) {
  const router = useRouter()

  const [chiefComplaint, setChiefComplaint] = useState(chartDetail.chief_complaint ?? '')
  const [notes, setNotes] = useState(chartDetail.notes ?? '')
  const [overviewImageUrl, setOverviewImageUrl] = useState(chartDetail.overview_image_url ?? '')

  const [lesionGroups, setLesionGroups] = useState<DermLesionGroup[]>(initialLesionGroups)
  const [visitsData, setVisitsData] = useState<Record<string, VisitState>>(
    buildInitialVisitsData(initialLesionGroups, initialLesionVisits),
  )
  const [images, setImages] = useState<DermImage[]>(initialImages)

  // marker management: markerNumber → groupId for quick reverse lookup
  const [markers, setMarkers] = useState<Marker[]>(() =>
    initialLesionGroups.flatMap((g) => g.marker_data ?? []),
  )
  const [markerColors, setMarkerColors] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {}
    for (const g of initialLesionGroups) {
      for (const m of g.marker_data ?? []) {
        map[m.number] = g.group_color ?? '#6b7280'
      }
    }
    return map
  })
  const [markerGroupMap, setMarkerGroupMap] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {}
    for (const g of initialLesionGroups) {
      for (const m of g.marker_data ?? []) {
        map[m.number] = g.id
      }
    }
    return map
  })

  const [activeMarkingGroupId, setActiveMarkingGroupId] = useState<string | null>(null)
  const allInitialMarkers = initialLesionGroups.flatMap((g) => g.marker_data ?? [])
  const nextMarkerNumber = useRef<number>(
    allInitialMarkers.length > 0 ? Math.max(...allInitialMarkers.map((m) => m.number)) + 1 : 1,
  )

  const [isOverviewUploading, setIsOverviewUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const overviewInputRef = useRef<HTMLInputElement>(null)

  // ── Visit state updater ──────────────────────────────────────

  const handleVisitChange = useCallback((groupId: string, update: Partial<VisitState>) => {
    setVisitsData((prev) => ({
      ...prev,
      [groupId]: { ...prev[groupId], ...update },
    }))
  }, [])

  // ── Images ───────────────────────────────────────────────────

  const handleImageAdded = useCallback((img: DermImage) => {
    setImages((prev) => [...prev, img])
  }, [])

  const handleImageDeleted = useCallback((imgId: string) => {
    setImages((prev) => prev.filter((i) => i.id !== imgId))
  }, [])

  // ── Overview image upload ─────────────────────────────────────

  const handleOverviewFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsOverviewUploading(true)
    try {
      const { url, error } = await uploadDermImage(file, chartId, 'overview')
      if (error || !url) throw new Error(error || '업로드 실패')
      setOverviewImageUrl(url)

      // persist old overview image removal if exists
      const oldOverview = images.find((i) => i.image_type === 'overview')
      if (oldOverview) {
        await deleteDermImage(oldOverview.id, oldOverview.image_url, hosId)
        setImages((prev) => prev.filter((i) => i.id !== oldOverview.id))
      }

      const inserted = await insertDermImage({
        hosId, chartId, lesionGroupId: null,
        imageType: 'overview', imageUrl: url, sortOrder: 0,
      })
      setImages((prev) => [...prev, inserted])
      toast.success('전체 사진 업로드 완료')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsOverviewUploading(false)
      if (overviewInputRef.current) overviewInputRef.current.value = ''
    }
  }

  // ── Markers ───────────────────────────────────────────────────

  const handleAddMarker = useCallback((x: number, y: number) => {
    if (!activeMarkingGroupId) return
    const group = lesionGroups.find((g) => g.id === activeMarkingGroupId)
    if (!group) return
    const num = nextMarkerNumber.current
    nextMarkerNumber.current = num + 1
    const newMarker: Marker = { type: 'point', x, y, number: num }

    setMarkers((prev) => [...prev, newMarker])
    setMarkerColors((prev) => ({ ...prev, [num]: group.group_color ?? '#6b7280' }))
    setMarkerGroupMap((prev) => ({ ...prev, [num]: activeMarkingGroupId }))
    setLesionGroups((prev) =>
      prev.map((g) =>
        g.id === activeMarkingGroupId
          ? { ...g, marker_data: [...(g.marker_data ?? []), newMarker] }
          : g,
      ),
    )
  }, [activeMarkingGroupId, lesionGroups])

  const handleRemoveMarker = useCallback((number: number) => {
    const groupId = markerGroupMap[number]
    setMarkers((prev) => prev.filter((m) => m.number !== number))
    setMarkerColors((prev) => { const n = { ...prev }; delete n[number]; return n })
    setMarkerGroupMap((prev) => { const n = { ...prev }; delete n[number]; return n })
    if (groupId) {
      setLesionGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, marker_data: (g.marker_data ?? []).filter((m) => m.number !== number) }
            : g,
        ),
      )
    }
  }, [markerGroupMap])

  // ── Lesion groups ─────────────────────────────────────────────

  const handleAddGroup = async () => {
    if (!chartDetail.patient_id) return
    const usedColors = new Set(lesionGroups.map((g) => g.group_color))
    const color = GROUP_COLORS.find((c) => !usedColors.has(c)) ?? GROUP_COLORS[lesionGroups.length % GROUP_COLORS.length]
    const label = String.fromCharCode(65 + lesionGroups.length) // A, B, C...
    try {
      const newGroup = await createLesionGroupAction({
        hosId, patientId: chartDetail.patient_id, initialChartId: chartId,
        groupLabel: label, groupColor: color,
      })
      setLesionGroups((prev) => [...prev, newGroup])
      setVisitsData((prev) => ({ ...prev, [newGroup.id]: buildInitialVisitState() }))
      toast.success(`${label}그룹 생성됨`)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await deleteLesionGroupAction(groupId, hosId)
      const removedNums = Object.entries(markerGroupMap)
        .filter(([, gid]) => gid === groupId)
        .map(([num]) => Number(num))

      setLesionGroups((prev) => prev.filter((g) => g.id !== groupId))
      setVisitsData((prev) => { const n = { ...prev }; delete n[groupId]; return n })
      setMarkers((prev) => prev.filter((m) => !removedNums.includes(m.number)))
      setMarkerColors((prev) => {
        const n = { ...prev }
        removedNums.forEach((num) => delete n[num])
        return n
      })
      setMarkerGroupMap((prev) => {
        const n = { ...prev }
        removedNums.forEach((num) => delete n[num])
        return n
      })
      if (activeMarkingGroupId === groupId) setActiveMarkingGroupId(null)
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
        overview_image_url: overviewImageUrl || null,
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
            hosId, chartId, lesionGroupId: g.id,
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

  // ── Delete ────────────────────────────────────────────────────

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

  const activeGroup = activeMarkingGroupId
    ? lesionGroups.find((g) => g.id === activeMarkingGroupId)
    : null

  const activeGroups = lesionGroups.filter((g) => g.status === 'active')

  return (
    <DermChartLayout
      chartDetail={chartDetail}
      onSave={handleSave}
      isSaving={isSaving}
      onDelete={handleDelete}
      isDeleting={isDeleting}
    >
      <div className="flex h-full overflow-hidden">
        {/* Left: overview + group list */}
        <div className="w-72 shrink-0 border-r bg-white overflow-y-auto flex flex-col">
          {/* Overview image */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">전체 사진</span>
              <button
                type="button"
                onClick={() => overviewInputRef.current?.click()}
                disabled={isOverviewUploading}
                className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-medium"
              >
                {isOverviewUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                {overviewImageUrl ? '교체' : '업로드'}
              </button>
              <input
                ref={overviewInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleOverviewFileChange}
              />
            </div>

            {overviewImageUrl ? (
              <DermOverviewCanvas
                imageUrl={overviewImageUrl}
                markers={markers}
                markerColors={markerColors}
                activeGroupColor={activeGroup?.group_color ?? undefined}
                onAddMarker={handleAddMarker}
                onRemoveMarker={handleRemoveMarker}
              />
            ) : (
              <div
                onClick={() => overviewInputRef.current?.click()}
                className="flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 cursor-pointer hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                style={{ aspectRatio: '4/3' }}
              >
                <div className="text-center">
                  <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-400">전체 사진 업로드</p>
                </div>
              </div>
            )}
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

          {/* Groups list */}
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
                const markerCount = (group.marker_data ?? []).length
                return (
                  <div
                    key={group.id}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 border cursor-pointer hover:bg-slate-50 transition-colors"
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
                      {markerCount > 0 && (
                        <p className="text-[10px] text-slate-400">마커 {markerCount}개</p>
                      )}
                    </div>
                    {visit?.severity && (
                      <span className="h-2 w-2 rounded-full shrink-0" style={{
                        background: visit.severity === 1 ? '#22c55e' : visit.severity === 2 ? '#eab308' : visit.severity === 3 ? '#f97316' : '#e11d48',
                      }} />
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

        {/* Right: lesion group cards */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
          {activeGroups.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center max-w-xs">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
                  <Plus className="h-7 w-7 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-slate-700 mb-1">병변 그룹을 추가해주세요</p>
                <p className="text-xs text-slate-500 mb-4">각 병변 부위를 그룹으로 관리하고 AI 분석을 받아보세요.</p>
                <Button
                  onClick={handleAddGroup}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="h-4 w-4" />
                  첫 번째 그룹 추가
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-2xl mx-auto">
              {activeGroups.map((group) => {
                const visit = visitsData[group.id]
                if (!visit) return null
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
                    isMarkingActive={activeMarkingGroupId === group.id}
                    onToggleMarking={() =>
                      setActiveMarkingGroupId((prev) => (prev === group.id ? null : group.id))
                    }
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
