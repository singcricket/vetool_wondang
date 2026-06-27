'use client'

import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import { Activity, Stethoscope, Eye, Brain, Smile, Camera, Bone } from 'lucide-react'
import { SectionBlock } from './tab-ui'
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
import type { CheckupSection, CheckupPatient, NeuroSectionStructured } from '@/types/hospital/checkup-type'
import { isNeuroStructured } from '@/types/hospital/checkup-type'
import type { ExtractedPhysical } from '@/lib/actions/checkup/pdf-extraction'
import PhysicalExamSection, { type PhysicalValues, sectionStatusKey } from './physical-exam-section'
import { physicalRefAll, PHYSICAL_SECTION_ORDER } from '@/constants/hospital/checkup/physical-ref'
import SkinEarSection, { type SkinEarValues } from './skin-ear-section'
import MusculoskeletalSection from './musculoskeletal-section'
import { DENTAL_CHART_TESTS } from '@/constants/hospital/dental/dentalChartTests'
import { ophthalmicDomainSections } from '@/constants/hospital/ophthalmic/ophthalmic-exam-domains'
import type { OphTestItem } from '@/constants/hospital/ophthalmic/ophthalmic-types'
import LinkedChartPanel, { type ChartListItem } from './linked-chart-panel'
import CheckupImageUploadDialog from './checkup-image-uploader/checkup-image-upload-dialog'
import CheckupImageStrip from './checkup-image-strip'
import { useCheckupImages } from '@/hooks/use-checkup-images'

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

export interface Tab2Ref {
  save: () => Promise<void>
}

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
  dermaSection: CheckupSection | undefined
  extractedPhysical: ExtractedPhysical | null
  subCharts: Record<string, string | null>
  onSubChartChange: (chartType: string, chartId: string | null) => void
  onSkinLesionsChange?: (json: string) => void
  onDirty?: () => void
}

const EXTRACTED_PHYSICAL_MAP: Record<keyof ExtractedPhysical, string> = {
  body_weight: 'body_weight',
  bcs: 'bcs',
  temperature: 'temperature',
  pulse: 'heart_rate',
  respiration: 'respiratory_rate',
  systolic_bp: 'systolic_bp',
  diastolic_bp: 'diastolic_bp',
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

const Tab2Physical = forwardRef<Tab2Ref, Props>(function Tab2Physical({
  checkupId,
  patientId,
  hosId,
  patient,
  checkupDate,
  physicalSection,
  dentalSection,
  ophthalmicSection,
  neuroSection,
  dermaSection,
  extractedPhysical,
  subCharts,
  onSubChartChange,
  onSkinLesionsChange,
  onDirty,
}, ref) {
  // ── 이미지 ───────────────────────────────────────────────────
  const { images: allCheckupImages, getByTags, reload: reloadImages } = useCheckupImages(checkupId)

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

  // ── 피부·귀 (SkinEar) — physical 섹션에 병합 저장되므로 physicalSection에서 읽음 ──
  const savedDermaRaw = (physicalSection?.data ?? {}) as Record<string, string>
  const [skinEar, setSkinEar] = useState<SkinEarValues>({
    skin_lesions_json:    savedDermaRaw.skin_lesions_json    ?? '[]',
    skin_lesions_summary: savedDermaRaw.skin_lesions_summary ?? '',
    skin_map_json:        savedDermaRaw.skin_map_json        ?? '[]',
    coat_condition:       savedDermaRaw.coat_condition       ?? '',
    parasite:             savedDermaRaw.parasite             ?? '',
    ear_od_findings:      savedDermaRaw.ear_od_findings      ?? '[]',
    ear_od_discharge:     savedDermaRaw.ear_od_discharge     ?? '',
    ear_os_findings:      savedDermaRaw.ear_os_findings      ?? '[]',
    ear_os_discharge:     savedDermaRaw.ear_os_discharge     ?? '',
    ear_notes:            savedDermaRaw.ear_notes            ?? '',
    ear_exam_summary:     savedDermaRaw.ear_exam_summary     ?? '',
  })

  // ── 신경계 ───────────────────────────────────────────────────
  const savedNeuroRaw = (neuroSection?.data ?? {}) as Record<string, unknown>
  // structured 판별: format === 'structured' 이면 JSON, 아니면 레거시/수동 텍스트
  const [neuroStructured, setNeuroStructured] = useState<NeuroSectionStructured | null>(
    isNeuroStructured(savedNeuroRaw) ? savedNeuroRaw : null,
  )
  const [neuroNotes, setNeuroNotes] = useState(
    isNeuroStructured(savedNeuroRaw) ? '' : ((savedNeuroRaw.notes as string) ?? ''),
  )

  // ── 차트 목록 ────────────────────────────────────────────────
  const [neuroCharts, setNeuroCharts] = useState<NeuroChartListItem[]>([])
  const [ophCharts, setOphCharts] = useState<OphthalmicChartListItem[]>([])
  const [dentalCharts, setDentalCharts] = useState<DentalChartListItem[]>([])

  const [, setSaving] = useState(false)

  // dirty 트래킹 — 최초 마운트 이후 폼 변경 시 onDirty 호출
  const mountedRef = useRef(false)
  useEffect(() => {
    if (!mountedRef.current) return
    onDirty?.()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [physical, dental, ophthalmic, skinEar, neuroNotes, neuroStructured])
  useEffect(() => { mountedRef.current = true }, [])

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

  // ── 신경계 차트 → 구조화 데이터 반환 ────────────────────────
  const getNeuroData = (chartId: string): NeuroSectionStructured | null => {
    const chart = neuroCharts.find((c) => c.id === chartId)
    if (!chart) return null
    return {
      format: 'structured',
      chartId,
      results: (chart.results as Record<string, string | string[]>) ?? {},
      localisations: (chart.localisations as NeuroSectionStructured['localisations']) ?? {},
      summary: chart.summary ?? null,
    }
  }

  const handleNeuroDataLoaded = (data: unknown) => {
    if (data === null) {
      // 연동 해제 시 structured 초기화 (수동 입력으로 전환)
      setNeuroStructured(null)
      return
    }
    if (isNeuroStructured(data)) setNeuroStructured(data)
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
        upsertCheckupSection({ checkupId, sectionType: 'physical', data: { ...physical, ...skinEar } as unknown as Record<string, unknown> }),
        upsertCheckupSection({ checkupId, sectionType: 'dental_basic', data: dental }),
        upsertCheckupSection({ checkupId, sectionType: 'ophthalmic_basic', data: ophthalmic }),
        upsertCheckupSection({ checkupId, sectionType: 'neuro_basic', data: neuroStructured ?? { format: 'text', notes: neuroNotes } }),
      ])
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  useImperativeHandle(ref, () => ({ save: handleSave }))

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
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-4">

      {/* ── 신체검사 ─────────────────────────────────────── */}
      <SectionBlock icon={Activity} title="신체검사" color="teal">
        <PhysicalExamSection
          values={physical}
          onChange={(id, value) => setPhysical((prev) => ({ ...prev, [id]: value }))}
          checkupId={checkupId}
          hosId={hosId}
          physicalImages={getByTags(['physical_general'])}
          onImageEdited={reloadImages}
          onImageUploaded={reloadImages}
        />
      </SectionBlock>

      {/* ── 근골격계·관절 ─────────────────────────────────── */}
      <SectionBlock icon={Bone} title="근골격계 · 관절검사" color="violet">
        <MusculoskeletalSection
          values={physical}
          onChange={(id, value) => setPhysical((prev) => ({ ...prev, [id]: value }))}
        />
      </SectionBlock>

      {/* ── 피부·귀 ──────────────────────────────────────── */}
      <SectionBlock icon={Smile} title="피부·귀 검사" color="amber">
        <SkinEarSection
          values={skinEar}
          onChange={(key, value) => {
            if (key === 'skin_lesions_json') onSkinLesionsChange?.(value)
            setSkinEar((prev) => ({ ...prev, [key]: value }))
          }}
          checkupId={checkupId}
          hosId={hosId}
          species={patient.species}
          allImages={allCheckupImages.filter((img) =>
            img.tags.some((t) =>
              t === 'organ_ear' || t === 'ear_od' || t === 'ear_os' || t === 'organ_skin' || t.startsWith('skin_lesion_'),
            ),
          )}
          onImageEdited={reloadImages}
          onImageUploaded={reloadImages}
        />
      </SectionBlock>

      {/* ── 치과 기본 소견 ──────────────────────────────── */}
      <SectionBlock
        icon={Stethoscope}
        title="치과 기본 소견"
        color="rose"
        action={
          <LinkedChartPanel
            label="치과 차트"
            chartType="dental"
            checkupId={checkupId}
            charts={dentalChartItems}
            linkedChartId={subCharts['dental'] ?? null}
            buildChartUrl={(id, date) => `/hospital/${hosId}/dental/${date}/${id}`}
            onLinkChange={(id) => onSubChartChange('dental', id)}
            onCreateNew={handleCreateDentalChart}
            variant="onDark"
          />
        }
      >
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <CheckupImageUploadDialog
            checkupId={checkupId}
            hosId={hosId}
            defaultTags={['dental']}
            onClose={reloadImages}
            trigger={
              <button
                type="button"
                className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-500 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-300 transition-colors"
              >
                <Camera size={11} />
                치과
              </button>
            }
          />
          <CheckupImageUploadDialog
            checkupId={checkupId}
            hosId={hosId}
            defaultTags={['dental_radio']}
            onClose={reloadImages}
            trigger={
              <button
                type="button"
                className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-500 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-300 transition-colors"
              >
                <Camera size={11} />
                치과 방사선
              </button>
            }
          />
          <CheckupImageStrip
            checkupId={checkupId}
            images={getByTags(['dental', 'dental_radio'])}
            onEdited={reloadImages}
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
      </SectionBlock>

      {/* ── 안과 기본 소견 ──────────────────────────────── */}
      <SectionBlock
        icon={Eye}
        title="안과 기본 소견"
        color="indigo"
        action={
          <LinkedChartPanel
            label="안과 차트"
            chartType="ophthalmic"
            checkupId={checkupId}
            charts={ophChartItems}
            linkedChartId={subCharts['ophthalmic'] ?? null}
            buildChartUrl={(id, date) => `/hospital/${hosId}/ophthalmic/${date}/${id}`}
            onLinkChange={(id) => onSubChartChange('ophthalmic', id)}
            onCreateNew={handleCreateOphthalmicChart}
            variant="onDark"
          />
        }
      >
        <div className="flex flex-col gap-4">
          {/* 안과 이미지 썸네일 */}
          {(getByTags(['ophthalmic_od']).length > 0 || getByTags(['ophthalmic_os']).length > 0) && (
            <div className="flex gap-4 rounded-md border border-slate-100 bg-slate-50 p-2">
              {getByTags(['ophthalmic_od']).length > 0 && (
                <div>
                  <p className="mb-1 text-[10px] font-medium text-slate-500">우안 (OD)</p>
                  <CheckupImageStrip checkupId={checkupId} images={getByTags(['ophthalmic_od'])} onEdited={reloadImages} maxVisible={3} />
                </div>
              )}
              {getByTags(['ophthalmic_os']).length > 0 && (
                <div>
                  <p className="mb-1 text-[10px] font-medium text-slate-500">좌안 (OS)</p>
                  <CheckupImageStrip checkupId={checkupId} images={getByTags(['ophthalmic_os'])} onEdited={reloadImages} maxVisible={3} />
                </div>
              )}
            </div>
          )}
          {ophBasicSections.map((domainSection) => (
            <div key={domainSection.domain}>
              <div className="mb-1.5 flex items-center gap-1.5">
                <div className="h-3 w-0.5 rounded-full bg-indigo-400" />
                <p className="text-xs font-bold text-slate-600">{domainSection.domainNameKo}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-slate-500">
                      <th className="w-44 pb-1 pr-3 font-medium">항목</th>
                      <th className="w-36 pb-1 pr-3 font-medium">
                        <div className="flex items-center gap-1.5">
                          우안 (OD)
                          <CheckupImageUploadDialog
                            checkupId={checkupId}
                            hosId={hosId}
                            defaultTags={['ophthalmic_od']}
                            onClose={reloadImages}
                            trigger={
                              <button
                                type="button"
                                className="rounded-full p-0.5 text-slate-400 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                                title="우안 사진 업로드"
                              >
                                <Camera size={11} />
                              </button>
                            }
                          />
                        </div>
                      </th>
                      <th className="w-36 pb-1 font-medium">
                        <div className="flex items-center gap-1.5">
                          좌안 (OS)
                          <CheckupImageUploadDialog
                            checkupId={checkupId}
                            hosId={hosId}
                            defaultTags={['ophthalmic_os']}
                            onClose={reloadImages}
                            trigger={
                              <button
                                type="button"
                                className="rounded-full p-0.5 text-slate-400 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                                title="좌안 사진 업로드"
                              >
                                <Camera size={11} />
                              </button>
                            }
                          />
                        </div>
                      </th>
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
      </SectionBlock>

      {/* ── 신경계 검사 ──────────────────────────────────── */}
      <SectionBlock
        icon={Brain}
        title="신경계 검사"
        color="slate"
        action={
          <LinkedChartPanel
            label="신경계 차트"
            chartType="neuro"
            checkupId={checkupId}
            charts={neuroChartItems}
            linkedChartId={subCharts['neuro'] ?? null}
            buildChartUrl={(id, date) => `/hospital/${hosId}/neuro/${date}/${id}`}
            onLinkChange={(id) => onSubChartChange('neuro', id)}
            onCreateNew={handleCreateNeuroChart}
            onStructuredDataLoaded={handleNeuroDataLoaded}
            getChartData={getNeuroData}
            variant="onDark"
          />
        }
      >

        {neuroStructured ? (
          /* 구조화 데이터 연동 상태 — 저장된 JSON 표시 */
          <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-xs text-teal-800">
            <p className="font-semibold">신경계 차트 연동됨</p>
            {neuroStructured.summary && (
              <p className="mt-1 text-teal-700">{neuroStructured.summary}</p>
            )}
            <p className="mt-1.5 text-[11px] text-teal-600">
              검사 항목 {Object.keys(neuroStructured.results).length}개 ·
              리포트에서 구조화된 표 형식으로 표시됩니다.
            </p>
            <button
              type="button"
              className="mt-2 text-[11px] text-teal-600 underline hover:text-teal-800"
              onClick={() => setNeuroStructured(null)}
            >
              연동 해제하고 직접 입력으로 전환
            </button>
          </div>
        ) : (
          /* 수동 텍스트 입력 */
          <Textarea
            value={neuroNotes}
            onChange={(e) => setNeuroNotes(e.target.value)}
            placeholder="신경계 검사 소견을 직접 입력하거나 차트를 연동하세요"
            className="min-h-[120px] resize-none text-sm"
          />
        )}
      </SectionBlock>

        </div>
      </div>
    </div>
  )
})

export default Tab2Physical
