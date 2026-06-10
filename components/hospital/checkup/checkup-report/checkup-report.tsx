'use client'

import { Printer } from 'lucide-react'
import type { CheckupReportData } from '@/lib/services/checkup/fetch-checkup-report'
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
import type { InquiryData } from './report-types'

interface Props {
  data: CheckupReportData
  isShared?: boolean
}

export default function CheckupReport({ data, isShared }: Props) {
  const { record, sections, images } = data
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

  const organSections = resolveOrganSections(labItems, plan, images, ORGAN_MODULE_CONFIGS, physical, xrayData, speciesForStage, imagingSections)

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

      <div className="mx-auto max-w-4xl px-6 py-8 print:px-4 print:pb-16 print:pt-10">

        {/* ── 환자 헤더 ─────────────────────────────────────── */}
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

        {/* ── 종합 평가 요약 ────────────────────────────────── */}
        <ExecutiveSummary organSections={organSections} labItems={labItems} plan={plan} />

        {/* ── 0. 문진 ───────────────────────────────────────── */}
        <InquirySection data={inquiry as InquiryData} />

        {/* ── 1. 신체검사 ───────────────────────────────────── */}
        {hasPhysical && (
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
        )}

        {/* ── 1-b. 신경계 검사 ──────────────────────────────── */}
        <NeuroSection data={neuroData} />

        {/* ── 2. 장기별 종합 평가 ───────────────────────────── */}
        <OrganSectionsBlock
          organSections={organSections}
          subCharts={subCharts}
          dentalBasicFindings={dentalBasicFindings}
          ophthalmicBasicFindings={ophthalmicBasicFindings}
          checkupId={record.id}
          isShared={isShared}
        />

        {/* ── 3. 종합 권고사항 ──────────────────────────────── */}
        {hasPlan && (
          <section className="mb-10 print:break-before-page">
            <SectionTitle>종합 평가 및 권고사항</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {ps('tx_priority_summary') && (
                <div className="break-inside-avoid rounded-xl border-2 border-teal-200 bg-teal-50 p-5">
                  <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-teal-600">치료·관리 우선순위</p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-teal-800">{ps('tx_priority_summary')}</p>
                </div>
              )}
              {ps('tx_medication') && (
                <div className="break-inside-avoid rounded-xl border border-slate-200 p-5">
                  <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">약물·치료 계획</p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{ps('tx_medication')}</p>
                </div>
              )}
              {ps('tx_further_workup') && (
                <div className="break-inside-avoid rounded-xl border border-slate-200 p-5">
                  <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">추가 검사 계획</p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{ps('tx_further_workup')}</p>
                </div>
              )}
              {ps('guide_diet') && (
                <div className="break-inside-avoid rounded-xl border border-slate-200 p-5">
                  <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">식이·생활 관리</p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{ps('guide_diet')}</p>
                  {ps('guide_weight') && (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{ps('guide_weight')}</p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── 4. 추적관찰 계획 ──────────────────────────────── */}
        {hasFollowup && (
          <section className="mb-10">
            <SectionTitle>추적 관찰 계획</SectionTitle>
            <div className="break-inside-avoid rounded-xl border border-slate-200 p-5">
              {ps('followup_plan') && (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{ps('followup_plan')}</p>
              )}
              {ps('next_checkup_date') && (
                <p className="mt-3 text-sm font-medium text-teal-700">
                  다음 건강검진 예정일:{' '}
                  {new Date(ps('next_checkup_date')).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>
          </section>
        )}

        {/* ── 부록 A: 임상병리 ──────────────────────────────── */}
        {hasLab && <AppendixLab labItems={labItems} />}

        {/* ── 부록 B/C/D: 영상검사 ─────────────────────────── */}
        <AppendixImaging getSection={getSection} images={images} checkupId={record.id} isShared={isShared} />

        {/* 화면 전용 푸터 */}
        <footer className="border-t pt-6 text-center text-xs text-slate-400 print:hidden">
          <p>{record.hospital_name} · {checkupDateLabel}</p>
          <p className="mt-1">본 리포트는 의료 참고용이며 정확한 진단은 담당 수의사와 상담하세요.</p>
        </footer>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

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
