'use client'

import { useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { upsertCheckupSection } from '@/lib/actions/checkup/checkup-actions'
import {
  fetchPatientUltrasoundCharts,
  fetchUltrasoundOrganData,
  createLinkedSubChart,
  type UltrasoundChartListItem,
  type UltrasoundOrganData,
} from '@/lib/actions/checkup/linked-chart-actions'
import type { CheckupSection, CheckupPatient } from '@/types/hospital/checkup-type'
import type { ExtractedImaging } from '@/lib/actions/checkup/pdf-extraction'
import {
  xrayCategories,
  type XrayCategoryId,
} from '@/constants/hospital/checkup/xray-ref'
import {
  buildChartSummary,
  organSections,
} from '@/constants/hospital/ultrasound'
import type { Organ } from '@/constants/hospital/ultrasound/types'
import LinkedChartPanel, { type ChartListItem } from './linked-chart-panel'

// ── 저장 데이터 타입 ─────────────────────────────────────────

type XrayData = {
  checked: Record<string, boolean>
  notes: Record<XrayCategoryId, string>
}

type UltrasoundData = {
  chart_id: string | null
  organ_notes: Record<string, string>   // organ_name → 소견 텍스트
}

type CtMriData = {
  notes: string
}

// ── Props ───────────────────────────────────────────────────

interface Props {
  checkupId: string
  hosId: string
  patientId: string
  patient: CheckupPatient
  checkupDate: string
  xraySection: CheckupSection | undefined
  ultrasoundSection: CheckupSection | undefined
  ctMriSection: CheckupSection | undefined
  extractedImaging: ExtractedImaging | null
  subCharts: Record<string, string | null>
  onSubChartChange: (chartType: string, chartId: string | null) => void
}

// ── 심각도 배지 ──────────────────────────────────────────────

const SEVERITY_BG: Record<string, string> = {
  mild:     'bg-slate-100 text-slate-600',
  moderate: 'bg-amber-50  text-amber-700',
  severe:   'bg-red-50    text-red-700',
}

// ── 초기값 헬퍼 ──────────────────────────────────────────────

function initXrayData(section: CheckupSection | undefined): XrayData {
  const raw = (section?.data ?? {}) as Partial<XrayData>
  const emptyNotes = Object.fromEntries(
    xrayCategories.map((c) => [c.id, '']),
  ) as Record<XrayCategoryId, string>
  return {
    checked: (raw.checked ?? {}) as Record<string, boolean>,
    notes: { ...emptyNotes, ...(raw.notes ?? {}) },
  }
}

function initUltrasoundData(section: CheckupSection | undefined): UltrasoundData {
  const raw = (section?.data ?? {}) as Partial<UltrasoundData>
  return {
    chart_id: raw.chart_id ?? null,
    organ_notes: (raw.organ_notes ?? {}) as Record<string, string>,
  }
}

function initCtMriData(section: CheckupSection | undefined): CtMriData {
  const raw = (section?.data ?? {}) as Partial<CtMriData>
  return { notes: raw.notes ?? '' }
}

// ── 장기 소견 텍스트 생성 ────────────────────────────────────

function buildOrganNotes(organsData: UltrasoundOrganData[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (const organ of organsData) {
    const lines: string[] = []
    if ((organ.status === 'abnormal' || organ.status === 'absent') && organ.findings_data) {
      const summaries = buildChartSummary(
        organ.findings_data as Record<string, string | number>,
        'ko',
        organ.organ_name as Organ,
      )
      lines.push(...summaries)
    } else if (organ.status === 'normal') {
      lines.push('특이적인 이상 소견이 관찰되지 않음')
    }
    if (organ.organ_memo?.trim()) {
      lines.push(`(메모) ${organ.organ_memo.trim()}`)
    }
    if (lines.length > 0) {
      result[organ.organ_name] = lines.join('\n')
    }
  }
  return result
}

// ── 컴포넌트 ──────────────────────────────────────────────────

export default function Tab4Imaging({
  checkupId,
  hosId,
  patientId,
  patient,
  checkupDate,
  xraySection,
  ultrasoundSection,
  ctMriSection,
  extractedImaging,
  subCharts,
  onSubChartChange,
}: Props) {
  const [xray, setXray] = useState<XrayData>(() => initXrayData(xraySection))
  const [ultrasound, setUltrasound] = useState<UltrasoundData>(() =>
    initUltrasoundData(ultrasoundSection),
  )
  const [ctMri, setCtMri] = useState<CtMriData>(() => initCtMriData(ctMriSection))

  const [usList, setUsList] = useState<UltrasoundChartListItem[]>([])
  const [loadingOrgan, setLoadingOrgan] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPatientUltrasoundCharts(patientId).then(setUsList)
  }, [patientId])

  // PDF 추출 결과 → 방사선 소견 반영
  useEffect(() => {
    if (!extractedImaging) return
    const MAP: Record<XrayCategoryId, keyof ExtractedImaging> = {
      thorax:    'thorax_notes',
      abdomen:   'abdomen_notes',
      extremity: 'extremity_notes',
      skull:     'skull_notes',
      spine:     'spine_notes',
    }
    setXray((prev) => {
      const notes = { ...prev.notes }
      for (const cat of xrayCategories) {
        const text = extractedImaging[MAP[cat.id]] ?? ''
        if (text) notes[cat.id] = text
      }
      return { ...prev, notes }
    })
  }, [extractedImaging])

  // 장기 소견 로드
  const loadOrganNotes = async (chartId: string) => {
    try {
      setLoadingOrgan(true)
      const organsData = await fetchUltrasoundOrganData(chartId)
      const notes = buildOrganNotes(organsData)
      setUltrasound((prev) => ({ ...prev, organ_notes: notes }))
    } catch {
      toast.error('장기 소견을 불러오지 못했습니다.')
    } finally {
      setLoadingOrgan(false)
    }
  }

  const handleUltrasoundLinkChange = async (chartId: string | null) => {
    onSubChartChange('ultrasound', chartId)
    setUltrasound((prev) => ({ ...prev, chart_id: chartId }))
    if (chartId) await loadOrganNotes(chartId)
  }

  const handleCreateUltrasoundChart = async () => {
    const chartId = await createLinkedSubChart({
      checkupId,
      chartType: 'ultrasound',
      hosId,
      patientId,
      patient,
      chartDate: checkupDate,
    })
    onSubChartChange('ultrasound', chartId)
    setUltrasound((prev) => ({ ...prev, chart_id: chartId }))
    const updated = await fetchPatientUltrasoundCharts(patientId)
    setUsList(updated)
    window.open(`/hospital/${hosId}/ultrasound/${checkupDate}/${chartId}`, '_blank')
  }

  const toggleFinding = (findingId: string, checked: boolean) => {
    setXray((prev) => ({
      ...prev,
      checked: { ...prev.checked, [findingId]: checked },
    }))
  }

  const setXrayNote = (categoryId: XrayCategoryId, value: string) => {
    setXray((prev) => ({
      ...prev,
      notes: { ...prev.notes, [categoryId]: value },
    }))
  }

  const setOrganNote = (organName: string, value: string) => {
    setUltrasound((prev) => ({
      ...prev,
      organ_notes: { ...prev.organ_notes, [organName]: value },
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await Promise.all([
        upsertCheckupSection({ checkupId, sectionType: 'xray', data: xray }),
        upsertCheckupSection({ checkupId, sectionType: 'ultrasound_basic', data: ultrasound }),
        upsertCheckupSection({ checkupId, sectionType: 'ct_mri', data: ctMri }),
      ])
      toast.success('저장되었습니다.')
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const usChartItems: ChartListItem[] = usList.map((c) => ({
    id: c.id,
    chartDate: c.chartDate,
    previewText: c.impressionSummary,
  }))

  const linkedUsId = subCharts['ultrasound'] ?? null

  return (
    <div className="flex flex-col gap-6 p-4">

      {/* ── 방사선 ─────────────────────────────────────── */}
      <section>
        <h3 className="mb-3 border-b pb-1 text-sm font-semibold text-slate-700">
          방사선 (X-ray)
        </h3>

        <div className="flex flex-col gap-5">
          {xrayCategories.map((cat) => {
            const checkedCount = cat.findings.filter((f) => xray.checked[f.id]).length
            return (
              <div key={cat.id}>
                <p className="mb-1.5 rounded bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
                  {cat.label}
                  {checkedCount > 0 && (
                    <span className="ml-2 rounded-full bg-teal-100 px-1.5 text-teal-700">
                      {checkedCount}
                    </span>
                  )}
                </p>

                <div className="mb-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
                  {cat.findings.map((finding) => (
                    <label
                      key={finding.id}
                      className={`flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-0.5 text-xs ${
                        xray.checked[finding.id]
                          ? SEVERITY_BG[finding.severity]
                          : 'text-slate-600'
                      }`}
                    >
                      <Checkbox
                        checked={!!xray.checked[finding.id]}
                        onCheckedChange={(v) => toggleFinding(finding.id, !!v)}
                        className="h-3.5 w-3.5 shrink-0"
                      />
                      {finding.label}
                    </label>
                  ))}
                </div>

                <Textarea
                  value={xray.notes[cat.id] ?? ''}
                  onChange={(e) => setXrayNote(cat.id, e.target.value)}
                  placeholder={`${cat.label} 소견 직접 입력 또는 AI 추출 결과`}
                  className="min-h-[60px] resize-none text-xs"
                />
              </div>
            )
          })}
        </div>
      </section>

      {/* ── 복부초음파 ──────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between border-b pb-1">
          <h3 className="text-sm font-semibold text-slate-700">복부 초음파</h3>
          <div className="flex items-center gap-2">
            {linkedUsId && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs text-teal-600 hover:bg-teal-50"
                onClick={() => loadOrganNotes(linkedUsId)}
                disabled={loadingOrgan}
              >
                <RefreshCw size={11} className={`mr-1 ${loadingOrgan ? 'animate-spin' : ''}`} />
                결과 불러오기
              </Button>
            )}
            <LinkedChartPanel
              label="초음파 차트"
              chartType="ultrasound"
              checkupId={checkupId}
              charts={usChartItems}
              linkedChartId={linkedUsId}
              buildChartUrl={(id, date) => `/hospital/${hosId}/ultrasound/${date}/${id}`}
              onLinkChange={handleUltrasoundLinkChange}
              onCreateNew={handleCreateUltrasoundChart}
            />
          </div>
        </div>

        {/* 장기별 textarea */}
        <div className="flex flex-col gap-3">
          {organSections.map((section) => {
            const note = ultrasound.organ_notes[section.organ] ?? ''
            return (
              <div key={section.organ}>
                <p className="mb-1 text-xs font-medium text-slate-600">{section.organNameKo}</p>
                <Textarea
                  value={note}
                  onChange={(e) => setOrganNote(section.organ, e.target.value)}
                  placeholder={`${section.organNameKo} 소견`}
                  className="min-h-[56px] resize-none text-xs"
                />
              </div>
            )
          })}
        </div>
      </section>

      {/* ── CT / MRI / 내시경 ──────────────────────────── */}
      <section>
        <h3 className="mb-3 border-b pb-1 text-sm font-semibold text-slate-700">
          CT / MRI / 내시경
        </h3>
        <Textarea
          value={ctMri.notes}
          onChange={(e) => setCtMri({ notes: e.target.value })}
          placeholder="CT, MRI, 내시경 소견 자유 입력"
          className="min-h-[100px] resize-none text-sm"
        />
      </section>

      {/* ── 저장 ──────────────────────────────────────── */}
      <div className="flex justify-end border-t pt-4">
        <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
          {saving ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  )
}
