'use client'

import { useState, useCallback } from 'react'
import { Printer, AlertTriangle, Pill, FlaskConical, Salad, CalendarCheck, ChevronRight } from 'lucide-react'
import type { CheckupReportData, CheckupReportSection, CheckupReportImage } from '@/lib/services/checkup/fetch-checkup-report'
import { useCheckupReportRealtime } from '@/hooks/use-checkup-report-realtime'
import type { LabResultItem } from '@/constants/hospital/checkup/lab-types'
import {
  resolveOrganSections,
  ORGAN_MODULE_CONFIGS,
} from '@/lib/config/checkup-report-modules'
import { DENTAL_CHART_TESTS } from '@/constants/hospital/dental/dentalChartTests'
import { ophthalmicDomainSections } from '@/constants/hospital/ophthalmic/ophthalmic-exam-domains'
import type { BasicFinding } from './section-organ'

const DENTAL_BASIC_IDS = ['skull_type', 'occlusion', 'crowding', 'gingivitis_overall', 'calculus_overall', 'periodontitis_stage', 'oral_mucosa'] as const

const OPHTHALMIC_BASIC_DOMAINS = ['gross_inspection', 'functional_tests', 'iop'] as const
const ophBasicSections = ophthalmicDomainSections.filter((s) =>
  (OPHTHALMIC_BASIC_DOMAINS as readonly string[]).includes(s.domain),
)
import {
  getLifeStageFromBirth,
  getDogSizeClass,
} from '@/constants/hospital/checkup/life-stage-ref'
import { isNeuroStructured, type NeuroSectionStructured } from '@/types/hospital/checkup-type'

import { ReportHeader } from './section-header'
import { ExecutiveSummary } from './section-executive-summary'
import { InquirySection } from './section-inquiry'
import { PhysicalSection } from './section-physical'
import { NeuroSection } from './section-neuro'
import { OrganSectionsBlock } from './section-organ'
import { AppendixLab } from './appendix-lab'
import { AppendixImaging } from './appendix-imaging'
import { SectionTitle } from './report-ui'
import { ReportFloatingNav } from './report-floating-nav'
import type { InquiryData } from './report-types'

interface Props {
  data: CheckupReportData
  isShared?: boolean
}

export default function CheckupReport({ data, isShared }: Props) {
  const { record } = data

  const [sections, setSections] = useState<CheckupReportSection[]>(data.sections)
  const [images, setImages] = useState<CheckupReportImage[]>(data.images)

  const handleUpdate = useCallback(
    (newSections: CheckupReportSection[], newImages: CheckupReportImage[]) => {
      setSections(newSections)
      setImages(newImages)
    },
    [],
  )

  // 공유 뷰(isShared)에서도 리얼타임 적용 — 보호자가 문진 제출 시 즉시 반영
  useCheckupReportRealtime({ checkupId: record.id, onUpdate: handleUpdate })

  const { patient } = record

  const getSection = (type: string) =>
    (sections.find((s) => s.section_type === type)?.data ?? {}) as Record<string, unknown>

  const physical  = getSection('physical')
  const plan      = getSection('plan') as Record<string, unknown>
  const inquiry   = getSection('inquiry') as Partial<InquiryData>
  const labItems  = (getSection('lab').items ?? []) as LabResultItem[]
  const xrayData  = getSection('xray')
  const neuroRaw  = getSection('neuro_basic')

  const neuroData: NeuroSectionStructured | string | null = isNeuroStructured(neuroRaw)
    ? neuroRaw
    : typeof (neuroRaw as any).notes === 'string' && (neuroRaw as any).notes.trim()
      ? (neuroRaw as any).notes as string
      : null

  const speciesForStage = /^(cat|feline)/i.test(patient.species ?? '') ? 'cat' as const : 'dog' as const

  const imagingSections: Record<string, Record<string, unknown>> = {
    ultrasound_basic: getSection('ultrasound_basic'),
    echo_basic:       getSection('echo_basic'),
    xray:             getSection('xray'),
    ct_mri:           getSection('ct_mri'),
  }

  // physical 섹션에 derma 데이터가 병합 저장되어 있음 (coat_condition, skin_lesions_json 등)
  const organSections = resolveOrganSections(
    labItems, plan, images, ORGAN_MODULE_CONFIGS,
    physical, xrayData, speciesForStage, imagingSections,
    { derma: physical },
  )

  const subCharts = record.subCharts ?? {}

  const dentalBasicRaw = getSection('dental_basic') as Record<string, string>
  const dentalBasicFindings: BasicFinding[] = DENTAL_BASIC_IDS.flatMap((id) => {
    const value = dentalBasicRaw[id]
    if (!value) return []
    const test = DENTAL_CHART_TESTS[id]
    if (!test) return []
    const option = test.options?.find((o) => o.value === value)
    const label = option?.label ?? value
    const isAbnormal = !!(test.urgency?.[value] && test.urgency[value] !== 'none')
    return [{ id, nameKo: test.testNameKo, value: label, isAbnormal }]
  })

  const ophthalmicBasicRaw = getSection('ophthalmic_basic') as Record<string, string>
  const ophthalmicBasicFindings: BasicFinding[] = ophBasicSections.flatMap((domainSection) =>
    domainSection.tests.flatMap((test) => {
      const value = ophthalmicBasicRaw[test.testID]
      if (!value) return []
      const eye = (test as any).eye as 'OD' | 'OS' | undefined
      if (test.testType === 'select') {
        const opt = (test as any).options?.find((o: any) => o.value === value)
        if (!opt) return []
        return [{ id: test.testID, nameKo: test.testNameKo, value: opt.labelKo ?? opt.label ?? value, isAbnormal: opt.isAbnormal ?? false, eye }]
      }
      return [{ id: test.testID, nameKo: test.testNameKo, value, isAbnormal: false, eye }]
    }),
  )

  const ps = (key: string): string => {
    const v = plan[key]
    return typeof v === 'string' ? v : ''
  }

  const bodyWeightKg = parseFloat(String(physical.body_weight ?? '0')) || 0
  const bcsNum       = parseInt(String(physical.bcs ?? ''), 10) || 0
  const isNeutered   = /중성화|neutered|spayed/i.test(patient.gender ?? '')
  const lifeStage    = getLifeStageFromBirth(patient.birth ?? null, speciesForStage, getDogSizeClass(bodyWeightKg))

  const coverImage       = images.find((img) => img.tags?.includes('cover') || img.is_cover)
  const checkupDateLabel = record.checkup_date
    ? new Date(record.checkup_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : ''
  const abnormalCount = labItems.filter((i) => i.is_abnormal && i.value).length

  const hasPhysical  = Object.keys(physical).length > 0
  const hasLab       = labItems.some((i) => i.value)
  const hasPlan      = !!(ps('tx_priority_summary') || ps('tx_medication') || ps('tx_further_workup') || ps('guide_diet'))
  const hasFollowup  = !!(ps('followup_plan') || ps('next_checkup_date'))

  return (
    <div className="bg-white text-slate-900 print:text-[10px]">
      {/* 플로팅 목차 */}
      <ReportFloatingNav
        organSections={organSections}
        hasPhysical={hasPhysical}
        hasNeuro={!!neuroData}
        hasLab={hasLab}
        hasPlan={hasPlan}
        hasFollowup={hasFollowup}
        hasAppendixImaging={true}
      />

      {/* 인쇄 버튼 */}
      <div className="no-print sticky top-0 z-10 flex justify-end gap-2 border-b bg-white px-6 py-2 shadow-sm">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700"
        >
          <Printer size={13} />
          인쇄 / PDF 저장
        </button>
      </div>

      {/* 인쇄 전용 반복 헤더 */}
      <div className="print-running-header hidden print:fixed print:inset-x-0 print:top-0 print:z-50 print:block print:border-b print:border-slate-200 print:bg-white print:px-6 print:py-1.5">
        <div className="flex items-center justify-between text-[8pt] text-slate-500">
          <span className="font-semibold text-slate-700">{record.hospital_name}</span>
          <span className="font-bold text-slate-800">{patient.name} · 건강검진 리포트</span>
          <span>{checkupDateLabel}</span>
        </div>
      </div>

      {/* 인쇄 전용 반복 푸터 */}
      <div className="hidden print:fixed print:inset-x-0 print:bottom-0 print:z-50 print:block print:border-t print:border-slate-200 print:bg-white print:px-6 print:py-1.5 print:text-center print:text-[8pt] print:text-slate-400">
        본 리포트는 의료 참고용이며 정확한 진단은 담당 수의사와 상담하세요.
      </div>

      <div className="mx-auto max-w-4xl px-0 py-4 sm:px-6 sm:py-8 print:px-0 print:pb-16 print:pt-10">

        {/* ── 환자 헤더 ─────────────────────────────────────── */}
        <div id="section-header">
          <ReportHeader
            patientName={patient.name}
            species={patient.species}
            breed={patient.breed}
            gender={patient.gender}
            birth={patient.birth}
            ownerName={patient.owner_name}
            checkupDateLabel={checkupDateLabel}
            vetName={record.vet_name}
            hospitalName={record.hospital_name}
            abnormalCount={abnormalCount}
            coverImage={coverImage}
            lifeStage={lifeStage}
          />
        </div>

        {/* ── 종합 평가 요약 ────────────────────────────────── */}
        <div id="section-summary">
          <ExecutiveSummary organSections={organSections} labItems={labItems} plan={plan} />
        </div>

        {/* ── 0. 문진 ───────────────────────────────────────── */}
        <div id="section-inquiry">
          <InquirySection data={inquiry as InquiryData} />
        </div>

        {/* ── 1. 신체검사 ───────────────────────────────────── */}
        {hasPhysical && (
          <div id="section-physical">
            <PhysicalSection
              physical={physical}
              species={speciesForStage}
              bodyWeightKg={bodyWeightKg}
              bcsNum={bcsNum}
              lifeStage={lifeStage}
              isNeutered={isNeutered}
              images={images}
              checkupId={record.id}
              isShared={isShared}
            />
          </div>
        )}

        {/* ── 1-b. 신경계 검사 ──────────────────────────────── */}
        <div id="section-neuro">
          <NeuroSection data={neuroData} />
        </div>

        {/* ── 2. 장기별 종합 평가 ───────────────────────────── */}
        <div id="section-organs">
          <OrganSectionsBlock
            organSections={organSections}
            subCharts={subCharts}
            dentalBasicFindings={dentalBasicFindings}
            ophthalmicBasicFindings={ophthalmicBasicFindings}
            checkupId={record.id}
            isShared={isShared}
          />
        </div>

        {/* ── 3. 종합 권고사항 ──────────────────────────────── */}
        {hasPlan && (
          <section id="section-plan" className="mb-10 print:break-before-page">
            <SectionTitle>종합 평가 및 권고사항</SectionTitle>
            <div className="flex flex-col gap-1 sm:gap-4">

              {ps('tx_priority_summary') && (
                <div className="break-inside-avoid overflow-hidden rounded-[10px] border border-teal-200 shadow-sm">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-400 px-5 py-3">
                    <AlertTriangle size={15} className="text-white/90" strokeWidth={2} />
                    <p className="text-sm font-bold text-white">치료·관리 우선순위</p>
                  </div>
                  <div className="bg-teal-50 p-3 sm:p-5">
                    <ul className="space-y-2">
                      {ps('tx_priority_summary').split('\n').filter((l) => l.trim()).map((line, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-teal-900">
                          <ChevronRight size={14} className="mt-0.5 shrink-0 text-teal-500" strokeWidth={2.5} />
                          <span>{line.trim()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {ps('tx_medication') && (
                <div className="break-inside-avoid overflow-hidden rounded-[10px] border border-blue-200 shadow-sm">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-400 px-5 py-3">
                    <Pill size={15} className="text-white/90" strokeWidth={2} />
                    <p className="text-sm font-bold text-white">약물·치료 계획</p>
                  </div>
                  <div className="bg-blue-50 p-3 sm:p-5">
                    <ul className="space-y-2">
                      {ps('tx_medication').split('\n').filter((l) => l.trim()).map((line, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-blue-900">
                          <ChevronRight size={14} className="mt-0.5 shrink-0 text-blue-400" strokeWidth={2.5} />
                          <span>{line.trim()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {ps('tx_further_workup') && (
                <div className="break-inside-avoid overflow-hidden rounded-[10px] border border-violet-200 shadow-sm">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-400 px-5 py-3">
                    <FlaskConical size={15} className="text-white/90" strokeWidth={2} />
                    <p className="text-sm font-bold text-white">추가 검사 계획</p>
                  </div>
                  <div className="bg-violet-50 p-3 sm:p-5">
                    <ul className="space-y-2">
                      {ps('tx_further_workup').split('\n').filter((l) => l.trim()).map((line, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-violet-900">
                          <ChevronRight size={14} className="mt-0.5 shrink-0 text-violet-400" strokeWidth={2.5} />
                          <span>{line.trim()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {ps('guide_diet') && (
                <div className="break-inside-avoid overflow-hidden rounded-[10px] border border-green-200 shadow-sm">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-lime-400 px-5 py-3">
                    <Salad size={15} className="text-white/90" strokeWidth={2} />
                    <p className="text-sm font-bold text-white">식이·생활 관리</p>
                  </div>
                  <div className="bg-green-50 p-3 sm:p-5">
                    <ul className="space-y-2">
                      {[ps('guide_diet'), ps('guide_weight')].filter(Boolean).join('\n').split('\n').filter((l) => l.trim()).map((line, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-green-900">
                          <ChevronRight size={14} className="mt-0.5 shrink-0 text-green-500" strokeWidth={2.5} />
                          <span>{line.trim()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

            </div>
          </section>
        )}

        {/* ── 4. 추적관찰 계획 ──────────────────────────────── */}
        {hasFollowup && (
          <section id="section-followup" className="mb-10">
            <SectionTitle>추적 관찰 계획</SectionTitle>
            <div className="break-inside-avoid overflow-hidden rounded-[10px] border border-sky-200 shadow-sm">
              <div className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-400 px-5 py-3">
                <CalendarCheck size={15} className="text-white/90" strokeWidth={2} />
                <p className="text-sm font-bold text-white">추적 관찰 계획</p>
              </div>
              <div className="bg-sky-50 p-3 sm:p-5">
                {ps('followup_plan') && (
                  <ul className="mb-4 space-y-2">
                    {ps('followup_plan').split('\n').filter((l) => l.trim()).map((line, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-sky-900">
                        <ChevronRight size={14} className="mt-0.5 shrink-0 text-sky-400" strokeWidth={2.5} />
                        <span>{line.trim()}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {ps('next_checkup_date') && (
                  <div className="inline-flex items-center gap-2 rounded-[10px] bg-white px-4 py-2.5 shadow-sm ring-1 ring-sky-200">
                    <CalendarCheck size={15} className="text-sky-500" strokeWidth={2} />
                    <span className="text-xs text-sky-600">다음 건강검진 예정일</span>
                    <span className="text-sm font-bold text-sky-800">
                      {new Date(ps('next_checkup_date')).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── 부록 A: 임상병리 ──────────────────────────────── */}
        {hasLab && (
          <div id="section-appendix-lab">
            <AppendixLab labItems={labItems} />
          </div>
        )}

        {/* ── 부록 B/C/D: 영상검사 ─────────────────────────── */}
        <div id="section-appendix-imaging">
          <AppendixImaging getSection={getSection} images={images} checkupId={record.id} isShared={isShared} />
        </div>

        {/* 화면 전용 푸터 */}
        <footer className="border-t pt-6 text-center text-xs text-slate-400 print:hidden">
          <p>{record.hospital_name} · {checkupDateLabel}</p>
          <p className="mt-1">본 리포트는 의료 참고용이며 정확한 진단은 담당 수의사와 상담하세요.</p>
        </footer>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }

          html, body {
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* 레이아웃 컨테이너 높이·overflow 제거 */
          body > * { height: auto !important; overflow: visible !important; }

          @page {
            size: A4 portrait;
            margin: 2.5cm 1.5cm 2.5cm 1.5cm;
          }

          .print-running-header { height: 28px; }
          .print\\:break-before-page { break-before: page; }
          .break-inside-avoid        { break-inside: avoid; }

          table { break-inside: auto; }
          tr    { break-inside: avoid; }

          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .shadow-sm { box-shadow: none !important; }
        }
      `}</style>
    </div>
  )
}
