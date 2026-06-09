'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { upsertCheckupSection } from '@/lib/actions/checkup/checkup-actions'
import {
  fetchPatientNeuroCharts,
  fetchPatientOphthalmicCharts,
  fetchPatientDentalCharts,
  createLinkedSubChart,
  type NeuroChartListItem,
  type OphthalmicChartListItem,
  type DentalChartListItem,
} from '@/lib/actions/checkup/linked-chart-actions'
import type { CheckupSection, CheckupPatient } from '@/types/hospital/checkup-type'
import type { ExtractedPhysical } from '@/lib/actions/checkup/pdf-extraction'
import PhysicalExamSection, { type PhysicalValues, sectionStatusKey } from './physical-exam-section'
import { physicalRefAll, PHYSICAL_SECTION_ORDER } from '@/constants/hospital/checkup/physical-ref'
import { DENTAL_CHART_TESTS } from '@/constants/hospital/dental/dentalChartTests'
import { ophthalmicDomainSections } from '@/constants/hospital/ophthalmic/ophthalmic-exam-domains'
import type { OphTestItem } from '@/constants/hospital/ophthalmic/ophthalmic-types'
import { generateNeuroReportText } from '@/lib/utils/neuro-report'
import LinkedChartPanel, { type ChartListItem } from './linked-chart-panel'

// ── 치과 기본 소견 항목 ─────────────────────────────────────────
const DENTAL_BASIC_IDS = [
  'skull_type',
  'occlusion',
  'crowding',
  'gingivitis_overall',
  'calculus_overall',
  'periodontitis_stage',
  'oral_mucosa',
] as const

// ── 안과 도메인 (육안 + 기능 + IOP만) ──────────────────────────
const OPHTHALMIC_BASIC_DOMAINS = ['gross_inspection', 'functional_tests', 'iop'] as const
const ophBasicSections = ophthalmicDomainSections.filter((s) =>
  (OPHTHALMIC_BASIC_DOMAINS as readonly string[]).includes(s.domain),
)

// ── Props ────────────────────────────────────────────────────

interface Props {
  checkupId: string
  patientId: string
  hosId: string
  patient: CheckupPatient
  checkupDate: string
  physicalSection: CheckupSection | undefined
  dentalSection: CheckupSection | undefined
  ophthalmicSection: CheckupSection | undefined
  neuroSection: CheckupSection | undefined
  extractedPhysical: ExtractedPhysical | null
  subCharts: Record<string, string | null>
  onSubChartChange: (chartType: string, chartId: string | null) => void
}

const EXTRACTED_PHYSICAL_MAP: Record<keyof ExtractedPhysical, string> = {
  body_weight: 'body_weight',
  bcs: 'bcs',
  temperature: 'temperature',
  pulse: 'heart_rate',
  respiration: 'respiratory_rate',
}

// ── 안과 테스트 렌더 헬퍼 ───────────────────────────────────────

function OphTestRow({
  test,
  value,
  onChange,
}: {
  test: OphTestItem
  value: string
  onChange: (v: string) => void
}) {
  if (test.testType === 'select') {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-6 w-full border-slate-200 text-xs">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          {test.options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-xs">
              {o.labelKo ?? o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }
  if (test.testType === 'multiselect') {
    const selected = value ? value.split(',').map((v) => v.trim()) : []
    return (
      <div className="flex flex-col gap-0.5">
        {test.options.map((o) => (
          <label key={o.value} className="flex items-center gap-1 text-xs">
            <Checkbox
              checked={selected.includes(o.value)}
              onCheckedChange={(checked) => {
                const next = checked
                  ? [...selected, o.value]
                  : selected.filter((s) => s !== o.value)
                onChange(next.join(','))
              }}
              className="h-3 w-3"
            />
            <span>{o.labelKo ?? o.label}</span>
          </label>
        ))}
      </div>
    )
  }
  if (test.testType === 'boolean') {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-6 w-full border-slate-200 text-xs">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="false" className="text-xs">{test.negativeLabelKo}</SelectItem>
          <SelectItem value="true" className="text-xs">{test.positiveLabelKo}</SelectItem>
        </SelectContent>
      </Select>
    )
  }
  if (test.testType === 'range') {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 w-full border-slate-200 px-1.5 text-xs"
        placeholder={test.unit}
      />
    )
  }
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-6 w-full border-slate-200 px-1.5 text-xs"
      placeholder="—"
    />
  )
}

// ── OD/OS 쌍 렌더 ───────────────────────────────────────────────

function renderOphPairs(
  tests: OphTestItem[],
  values: Record<string, string>,
  onChange: (id: string, v: string) => void,
): React.ReactNode {
  const odTests = tests.filter((t) => t.eye === 'OD')
  return odTests.map((od) => {
    const baseName = od.testNameKo.replace(' (우안)', '').replace(' (OD)', '')
    const osId = od.testID.replace('_od', '_os')
    const osTest = tests.find((t) => t.testID === osId)
    return (
      <tr key={od.testID} className="border-b border-slate-50">
        <td className="py-1 pr-3 text-slate-700">{baseName}</td>
        <td className="py-1 pr-3">
          <OphTestRow test={od} value={values[od.testID] ?? ''} onChange={(v) => onChange(od.testID, v)} />
        </td>
        <td className="py-1">
          {osTest ? (
            <OphTestRow test={osTest} value={values[osTest.testID] ?? ''} onChange={(v) => onChange(osTest.testID, v)} />
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </td>
      </tr>
    )
  })
}

// ── 컴포넌트 ──────────────────────────────────────────────────

export default function Tab2Physical({
  checkupId,
  patientId,
  hosId,
  patient,
  checkupDate,
  physicalSection,
  dentalSection,
  ophthalmicSection,
  neuroSection,
  extractedPhysical,
  subCharts,
  onSubChartChange,
}: Props) {
  // ── 신체검사 ─────────────────────────────────────────────────
  const savedPhysical = (physicalSection?.data ?? {}) as Record<string, string>
  const [physical, setPhysical] = useState<PhysicalValues>(() => {
    const init: PhysicalValues = {}
    physicalRefAll.forEach((ref) => { init[ref.id] = savedPhysical[ref.id] ?? '' })
    // 섹션 정상/이상 상태 키 복원
    PHYSICAL_SECTION_ORDER.forEach((section) => {
      const key = sectionStatusKey(section)
      if (savedPhysical[key]) init[key] = savedPhysical[key]
    })
    return init
  })

  // ── 치과 기본 ────────────────────────────────────────────────
  const savedDental = (dentalSection?.data ?? {}) as Record<string, string>
  const [dental, setDental] = useState<Record<string, string>>(savedDental)

  // ── 안과 기본 ────────────────────────────────────────────────
  const savedOphthalmic = (ophthalmicSection?.data ?? {}) as Record<string, string>
  const [ophthalmic, setOphthalmic] = useState<Record<string, string>>(savedOphthalmic)

  // ── 신경계 ───────────────────────────────────────────────────
  const savedNeuro = (neuroSection?.data ?? {}) as { notes?: string }
  const [neuroNotes, setNeuroNotes] = useState(savedNeuro.notes ?? '')

  // ── 차트 목록 ────────────────────────────────────────────────
  const [neuroCharts, setNeuroCharts] = useState<NeuroChartListItem[]>([])
  const [ophCharts, setOphCharts] = useState<OphthalmicChartListItem[]>([])
  const [dentalCharts, setDentalCharts] = useState<DentalChartListItem[]>([])

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPatientNeuroCharts(patientId).then(setNeuroCharts)
    fetchPatientOphthalmicCharts(patientId).then(setOphCharts)
    fetchPatientDentalCharts(patientId).then(setDentalCharts)
  }, [patientId])

  // PDF 추출 결과 반영
  useEffect(() => {
    if (!extractedPhysical) return
    setPhysical((prev) => {
      const next = { ...prev }
      for (const [key, refId] of Object.entries(EXTRACTED_PHYSICAL_MAP)) {
        const extracted = extractedPhysical[key as keyof ExtractedPhysical]
        if (extracted && !next[refId]) next[refId] = extracted
      }
      return next
    })
  }, [extractedPhysical])

  // ── 신경계 차트 → 텍스트 변환 ────────────────────────────────
  const getNeuroText = (chartId: string): string | null => {
    const chart = neuroCharts.find((c) => c.id === chartId)
    if (!chart) return null
    if (chart.results || chart.localisations) {
      return generateNeuroReportText(
        (chart.results as Record<string, string | string[]>) ?? {},
        (chart.localisations as Record<string, unknown>) ?? {},
        {
          name: patient.name,
          species: patient.species,
          breed: patient.breed,
          gender: patient.gender ?? undefined,
          birth: patient.birth ?? undefined,
        },
        chart.chartDate,
      )
    }
    return chart.summary ?? null
  }

  // ── 새 차트 생성 헬퍼 ────────────────────────────────────────
  const handleCreateNeuroChart = async () => {
    const chartId = await createLinkedSubChart({
      checkupId,
      chartType: 'neuro',
      hosId,
      patientId,
      patient,
      chartDate: checkupDate,
    })
    onSubChartChange('neuro', chartId)
    const updated = await fetchPatientNeuroCharts(patientId)
    setNeuroCharts(updated)
    window.open(`/hospital/${hosId}/neuro/${checkupDate}/${chartId}`, '_blank')
  }

  const handleCreateDentalChart = async () => {
    const chartId = await createLinkedSubChart({
      checkupId,
      chartType: 'dental',
      hosId,
      patientId,
      patient,
      chartDate: checkupDate,
    })
    onSubChartChange('dental', chartId)
    const updated = await fetchPatientDentalCharts(patientId)
    setDentalCharts(updated)
    window.open(`/hospital/${hosId}/dental/${checkupDate}/${chartId}`, '_blank')
  }

  const handleCreateOphthalmicChart = async () => {
    const chartId = await createLinkedSubChart({
      checkupId,
      chartType: 'ophthalmic',
      hosId,
      patientId,
      patient,
      chartDate: checkupDate,
    })
    onSubChartChange('ophthalmic', chartId)
    const updated = await fetchPatientOphthalmicCharts(patientId)
    setOphCharts(updated)
    window.open(`/hospital/${hosId}/ophthalmic/${checkupDate}/${chartId}`, '_blank')
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await Promise.all([
        upsertCheckupSection({ checkupId, sectionType: 'physical', data: physical }),
        upsertCheckupSection({ checkupId, sectionType: 'dental_basic', data: dental }),
        upsertCheckupSection({ checkupId, sectionType: 'ophthalmic_basic', data: ophthalmic }),
        upsertCheckupSection({ checkupId, sectionType: 'neuro_basic', data: { notes: neuroNotes } }),
      ])
      toast.success('저장되었습니다.')
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // ── ChartListItem 변환 ────────────────────────────────────────
  const neuroChartItems: ChartListItem[] = neuroCharts.map((c) => ({
    id: c.id, chartDate: c.chartDate, previewText: c.summary,
  }))
  const ophChartItems: ChartListItem[] = ophCharts.map((c) => ({
    id: c.id, chartDate: c.chartDate, previewText: c.summary,
  }))
  const dentalChartItems: ChartListItem[] = dentalCharts.map((c) => ({
    id: c.id, chartDate: c.chartDate, previewText: c.generalNote,
  }))

  return (
    <div className="flex flex-col gap-6 p-4">

      {/* ── 신체검사 ─────────────────────────────────────── */}
      <PhysicalExamSection
        values={physical}
        onChange={(id, value) => setPhysical((prev) => ({ ...prev, [id]: value }))}
      />

      {/* ── 치과 기본 소견 ──────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between border-b pb-1">
          <h3 className="text-sm font-semibold text-slate-700">치과 기본 소견</h3>
          <LinkedChartPanel
            label="치과 차트"
            chartType="dental"
            checkupId={checkupId}
            charts={dentalChartItems}
            linkedChartId={subCharts['dental'] ?? null}
            buildChartUrl={(id, date) =>
              `/hospital/${hosId}/dental/${date}/${id}`
            }
            onLinkChange={(id) => onSubChartChange('dental', id)}
            onCreateNew={handleCreateDentalChart}
          />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
          {DENTAL_BASIC_IDS.map((id) => {
            const test = DENTAL_CHART_TESTS[id]
            if (!test) return null
            const val = dental[id] ?? ''
            return (
              <div key={id} className="flex flex-col gap-1">
                <Label className="text-xs">{test.testNameKo}</Label>
                {test.testType === 'select' && test.options ? (
                  <Select value={val} onValueChange={(v) => setDental((p) => ({ ...p, [id]: v }))}>
                    <SelectTrigger className="h-7 border-slate-200 text-xs">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {test.options.map((o) => (
                        <SelectItem key={o.value} value={o.value} className="text-xs">
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={val}
                    onChange={(e) => setDental((p) => ({ ...p, [id]: e.target.value }))}
                    className="h-7 border-slate-200 text-xs"
                  />
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── 안과 기본 소견 ──────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between border-b pb-1">
          <h3 className="text-sm font-semibold text-slate-700">안과 기본 소견</h3>
          <LinkedChartPanel
            label="안과 차트"
            chartType="ophthalmic"
            checkupId={checkupId}
            charts={ophChartItems}
            linkedChartId={subCharts['ophthalmic'] ?? null}
            buildChartUrl={(id, date) =>
              `/hospital/${hosId}/ophthalmic/${date}/${id}`
            }
            onLinkChange={(id) => onSubChartChange('ophthalmic', id)}
            onCreateNew={handleCreateOphthalmicChart}
          />
        </div>
        <div className="flex flex-col gap-4">
          {ophBasicSections.map((domainSection) => (
            <div key={domainSection.domain}>
              <p className="mb-1.5 rounded bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
                {domainSection.domainNameKo}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-slate-500">
                      <th className="w-44 pb-1 pr-3 font-medium">항목</th>
                      <th className="w-36 pb-1 pr-3 font-medium">우안 (OD)</th>
                      <th className="w-36 pb-1 font-medium">좌안 (OS)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderOphPairs(domainSection.tests, ophthalmic, (id, v) =>
                      setOphthalmic((p) => ({ ...p, [id]: v }))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 신경계 검사 ──────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between border-b pb-1">
          <h3 className="text-sm font-semibold text-slate-700">신경계 검사</h3>
          <LinkedChartPanel
            label="신경계 차트"
            chartType="neuro"
            checkupId={checkupId}
            charts={neuroChartItems}
            linkedChartId={subCharts['neuro'] ?? null}
            buildChartUrl={(id, date) =>
              `/hospital/${hosId}/neuro/${date}/${id}`
            }
            onLinkChange={(id) => onSubChartChange('neuro', id)}
            onCreateNew={handleCreateNeuroChart}
            onDataLoaded={(text) => setNeuroNotes(text)}
            getChartText={getNeuroText}
          />
        </div>
        <Textarea
          value={neuroNotes}
          onChange={(e) => setNeuroNotes(e.target.value)}
          placeholder="신경계 검사 소견 (차트 연동 시 자동 입력)"
          className="min-h-[120px] resize-none text-sm"
        />
      </section>

      {/* ── 저장 ────────────────────────────────────────── */}
      <div className="flex justify-end border-t pt-4">
        <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
          {saving ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  )
}
