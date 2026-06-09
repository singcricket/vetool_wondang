'use client'

import { Printer } from 'lucide-react'
import type { CheckupReportData } from '@/lib/services/checkup/fetch-checkup-report'
import type { LabResultItem, LabSeverity } from '@/constants/hospital/checkup/lab-types'
import {
  PHYSICAL_SECTION_ORDER,
  PHYSICAL_SECTION_LABEL,
  getPhysicalRefBySection,
} from '@/constants/hospital/checkup/physical-ref'
import { sectionStatusKey } from '@/components/hospital/checkup/checkup-case/physical-exam-section'
import {
  resolveOrganSections,
  LAB_TABLE_GROUPS,
  IMAGING_SECTION_CONFIGS,
  ORGAN_MODULE_CONFIGS,
  type ResolvedOrganSection,
  type DxEvaluation,
} from '@/lib/config/checkup-report-modules'
import type { BreedRisk, AgeRisk, Management } from '@/lib/actions/checkup/inquiry-risk-analysis'
import {
  getLifeStageFromBirth,
  getDogSizeClass,
  calcCalories,
  type LifeStage,
} from '@/constants/hospital/checkup/life-stage-ref'

// ── 유틸 ─────────────────────────────────────────────────────

function calcAge(birth: string | null): string {
  if (!birth) return ''
  const b = new Date(birth)
  const today = new Date()
  const totalMonths =
    (today.getFullYear() - b.getFullYear()) * 12 +
    (today.getMonth() - b.getMonth()) +
    (today.getDate() < b.getDate() ? -1 : 0)
  if (totalMonths < 12) return `${totalMonths}개월령`
  const y = Math.floor(totalMonths / 12)
  const m = totalMonths % 12
  return m > 0 ? `${y}세 ${m}개월` : `${y}세`
}

function speciesLabel(species: string): string {
  if (/^(dog|canine)/i.test(species)) return '개'
  if (/^(cat|feline)/i.test(species)) return '고양이'
  return species
}

// 초음파 장기 영문 키 → 한국어 이름
const ORGAN_NAME_KO: Record<string, string> = {
  liver:          '간',
  gallbladder:    '담낭 및 담도계',
  spleen:         '비장',
  pancreas:       '췌장',
  left_kidney:    '좌측 신장',
  right_kidney:   '우측 신장',
  urinary_bladder:'방광',
  left_adrenal:   '좌측 부신',
  right_adrenal:  '우측 부신',
  stomach:        '위',
  duodenum:       '십이지장',
  small_intestine:'소장',
  colon:          '결장',
  gi_tract:       '위장관 전반',
  lymph_node:     '복강 림프절',
  free_fluid:     '복강 내 유리액',
}

// severity별 스타일 (border, badge, bg)
const SEVERITY_BORDER: Record<LabSeverity, string> = {
  critical: 'border-red-500',
  high:     'border-red-400',
  moderate: 'border-orange-400',
  mild:     'border-amber-400',
}
const SEVERITY_BADGE: Record<LabSeverity, string> = {
  critical: 'bg-red-600 text-white',
  high:     'bg-red-100 text-red-700',
  moderate: 'bg-orange-100 text-orange-700',
  mild:     'bg-amber-100 text-amber-700',
}

// ── 신체검사 헬퍼 ─────────────────────────────────────────────

const PHYSICAL_NORMAL_PATTERNS_REPORT = [
  '정상', 'BAR', 'QAR', '없음', '정상 범위', '검사 미실시', '해당 없음', '<5%',
  '변화 없음',
]
function isPhysicalNormalValue(val: string): boolean {
  return PHYSICAL_NORMAL_PATTERNS_REPORT.some((p) => val.includes(p))
}

function parseRange(rangeStr: string): [number, number] | null {
  const m = rangeStr.match(/([\d.]+)[–\-]([\d.]+)/)
  return m ? [parseFloat(m[1]), parseFloat(m[2])] : null
}

function VitalNumCard({
  label, value, unit, refRange,
}: {
  label: string
  value: string | number | null | undefined
  unit?: string
  refRange?: string
}) {
  if (value === null || value === undefined || value === '') return null
  const num = parseFloat(String(value))
  let warn = false
  if (refRange && !isNaN(num)) {
    const range = parseRange(refRange)
    if (range) warn = num < range[0] || num > range[1]
  }
  return (
    <div className={`rounded-xl border px-3 py-3 text-center ${
      warn ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'
    }`}>
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className={`mt-1 font-mono text-lg font-bold leading-none ${warn ? 'text-amber-700' : 'text-slate-800'}`}>
        {value}
        {unit && <span className="ml-0.5 font-sans text-xs font-normal text-slate-400">{unit}</span>}
      </p>
      {refRange && <p className="mt-1 text-[10px] text-slate-400">참고 {refRange}</p>}
      {warn && <p className="mt-0.5 text-[10px] font-semibold text-amber-600">범위 이탈</p>}
    </div>
  )
}

function BcsGauge({ value }: { value: string | number }) {
  const bcs = parseInt(String(value), 10)
  if (!bcs || bcs < 1 || bcs > 9) return null
  const isDanger = bcs <= 2 || bcs >= 7
  const isWarning = bcs === 3 || bcs === 6
  const statusLabel =
    bcs <= 2 ? '극도 저체중'
    : bcs === 3 ? '저체중'
    : bcs <= 5 ? '이상적 체형'
    : bcs === 6 ? '과체중'
    : bcs <= 8 ? '비만'
    : '극도 비만'
  return (
    <div className={`rounded-xl border p-3 ${
      isDanger ? 'border-red-200 bg-red-50'
      : isWarning ? 'border-amber-200 bg-amber-50'
      : 'border-emerald-200 bg-emerald-50'
    }`}>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">BCS (체형 점수)</p>
      <div className="flex items-center gap-1">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
          <div
            key={n}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
              n === bcs
                ? isDanger ? 'bg-red-500 text-white ring-2 ring-red-300'
                  : isWarning ? 'bg-amber-400 text-white ring-2 ring-amber-200'
                  : 'bg-emerald-500 text-white ring-2 ring-emerald-200'
                : n < bcs
                ? 'bg-slate-200 text-slate-500'
                : 'border border-slate-200 bg-white text-slate-300'
            }`}
          >
            {n}
          </div>
        ))}
      </div>
      <p className={`mt-2 text-xs font-semibold ${
        isDanger ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'
      }`}>
        {bcs} / 9 · {statusLabel}
      </p>
    </div>
  )
}

function McsGauge({ value }: { value: string }) {
  const score = parseInt(value, 10)
  if (!score || score < 1 || score > 4) return null
  const isDanger = score <= 2
  const isWarning = score === 3
  const labels = ['심한 근감소', '중등도 근감소', '경미한 근감소', '정상']
  const statusLabel = labels[score - 1]
  return (
    <div className={`rounded-xl border p-3 ${
      isDanger ? 'border-red-200 bg-red-50'
      : isWarning ? 'border-amber-200 bg-amber-50'
      : 'border-emerald-200 bg-emerald-50'
    }`}>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">MCS (근육 상태)</p>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`flex h-7 flex-1 items-center justify-center rounded text-[11px] font-bold ${
              n === score
                ? isDanger ? 'bg-red-500 text-white ring-2 ring-red-300'
                  : isWarning ? 'bg-amber-400 text-white ring-2 ring-amber-200'
                  : 'bg-emerald-500 text-white ring-2 ring-emerald-200'
                : n < score
                ? 'bg-slate-200 text-slate-500'
                : 'border border-slate-200 bg-white text-slate-300'
            }`}
          >
            {n}
          </div>
        ))}
      </div>
      <p className={`mt-2 text-xs font-semibold ${
        isDanger ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'
      }`}>
        {score} / 4 · {statusLabel}
      </p>
    </div>
  )
}

// ── 칼로리 카드 ──────────────────────────────────────────────
function CalorieCard({
  currentWeight, bcs, isNeutered, ageStage, species,
}: {
  currentWeight: number
  bcs: number
  isNeutered: boolean
  ageStage: LifeStage
  species: 'cat' | 'dog'
}) {
  const result = calcCalories(currentWeight, bcs, isNeutered, ageStage, species)
  const needsLoss = bcs >= 7
  const needsGain = bcs <= 3
  const isIdeal = bcs >= 4 && bcs <= 5

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        체중 관리 목표 (BCS 기반 칼로리 계산)
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-slate-50 p-3 text-center">
          <p className="text-[10px] text-slate-400">현재 체중</p>
          <p className="mt-1 font-mono text-lg font-bold text-slate-800">
            {currentWeight}
            <span className="ml-0.5 font-sans text-xs font-normal text-slate-400">kg</span>
          </p>
        </div>
        <div className={`rounded-lg p-3 text-center ${
          isIdeal ? 'bg-emerald-50' : needsLoss ? 'bg-amber-50' : 'bg-blue-50'
        }`}>
          <p className="text-[10px] text-slate-400">이상 체중 (추정)</p>
          <p className={`mt-1 font-mono text-lg font-bold ${
            isIdeal ? 'text-emerald-700' : needsLoss ? 'text-amber-700' : 'text-blue-700'
          }`}>
            {result.idealWeight}
            <span className="ml-0.5 font-sans text-xs font-normal text-slate-400">kg</span>
          </p>
          {!isIdeal && (
            <p className={`mt-0.5 text-[10px] font-semibold ${needsLoss ? 'text-amber-600' : 'text-blue-600'}`}>
              {needsLoss ? '감량 필요' : '증체 필요'}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-slate-50 p-3 text-center">
          <p className="text-[10px] text-slate-400">RER (휴식 에너지)</p>
          <p className="mt-1 font-mono text-lg font-bold text-slate-700">
            {result.rer}
            <span className="ml-0.5 font-sans text-xs font-normal text-slate-400">kcal/일</span>
          </p>
        </div>
        <div className="rounded-lg bg-teal-50 p-3 text-center">
          <p className="text-[10px] text-slate-400">DER (일일 권장량)</p>
          <p className="mt-1 font-mono text-lg font-bold text-teal-700">
            {result.der}
            <span className="ml-0.5 font-sans text-xs font-normal text-slate-400">kcal/일</span>
          </p>
          <p className="mt-0.5 text-[10px] text-teal-600">계수 ×{result.lifeFactor}</p>
        </div>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
        RER = 70 × 이상체중<sup>0.75</sup> · DER = RER × 생활계수
        {isNeutered ? ' (중성화)' : ' (미중성화)'}
        {needsLoss ? ' · 체중 감량 모드 적용' : needsGain ? ' · 체중 증체 모드 적용' : ''}
      </p>
    </div>
  )
}

// ── 문진 타입 ─────────────────────────────────────────────────

type InquiryData = {
  living_type: string
  toilet_env: string
  diet_main: string
  diet_treats: string
  diet_allergies: string
  living_other: string
  condition_vitality: string
  condition_appetite: string
  condition_water: string
  condition_urination: string
  condition_defecation: string
  condition_notes: string
  chief_complaint: string
  past_history: string
  current_diseases: string
  vaccination: string
  heartworm: string
  internal_parasite: string
  external_parasite: string
  prev_checkup: string
  ai_breed_risk: BreedRisk | string
  ai_age_risk: AgeRisk | string
  ai_management: Management | string
}

// ── 섹션 헤더 ─────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-5 flex items-center gap-2 border-b-2 border-teal-500 pb-2 text-base font-bold text-slate-800">
      {children}
    </h2>
  )
}

// ── 부록 섹션 래퍼 ────────────────────────────────────────────
// 인쇄 시 새 페이지에서 시작하며 "부록 X" 레이블을 표시

function AppendixSection({
  tag, title, children,
}: {
  tag: string; title: string; children: React.ReactNode
}) {
  return (
    <section className="mb-10 print:break-before-page">
      <div className="mb-5 flex items-center gap-3 border-b-2 border-slate-400 pb-2">
        <span className="rounded bg-slate-700 px-2.5 py-0.5 text-[11px] font-bold text-white">
          {tag}
        </span>
        <h2 className="text-base font-bold text-slate-800">{title}</h2>
      </div>
      {children}
    </section>
  )
}

// ── 개별 검사 값 카드 ─────────────────────────────────────────
// 장기별 평가 섹션에서 각 lab 항목을 카드 형태로 표시

function LabValueCard({ item }: { item: LabResultItem }) {
  const borderClass = item.is_abnormal
    ? item.severity
      ? SEVERITY_BORDER[item.severity]
      : 'border-red-400'
    : 'border-slate-200'

  const badgeClass = item.is_abnormal
    ? item.severity
      ? SEVERITY_BADGE[item.severity]
      : 'bg-red-100 text-red-700'
    : 'bg-emerald-100 text-emerald-700'

  const badgeText = item.result_text ?? (item.is_abnormal ? '이상' : '정상')

  return (
    <div className={`rounded-lg border-2 ${borderClass} bg-white p-3`}>
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-700">{item.nameEn}</p>
          <p className="truncate text-[10px] text-slate-400">{item.nameKo}</p>
        </div>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${badgeClass}`}>
          {badgeText}
        </span>
      </div>
      <p className="mt-2 font-mono text-xl font-bold leading-none text-slate-900">
        {item.value}
        <span className="ml-1 font-sans text-xs font-normal text-slate-400">{item.unit}</span>
      </p>
      {item.ref_range && (
        <p className="mt-1 text-[10px] text-slate-400">참고범위 {item.ref_range}</p>
      )}
      {/* 보호자용 검사 설명 (정상 항목에 표시) */}
      {!item.is_abnormal && item.descriptionKo && (
        <p className="mt-2 border-t border-dashed border-slate-100 pt-2 text-[10px] leading-relaxed text-slate-400">
          {item.descriptionKo}
        </p>
      )}
      {/* 이상 시 코멘트 */}
      {item.is_abnormal && item.comment && (
        <p className="mt-2 border-t border-dashed border-slate-100 pt-2 text-[10px] leading-relaxed text-slate-500">
          {item.comment}
        </p>
      )}
    </div>
  )
}

// ── 문진 섹션 ─────────────────────────────────────────────────

const LIVING_TYPE_LABEL: Record<string, string> = {
  indoor: '실내',
  outdoor: '실외',
  mixed: '복합',
}
const CONDITION_LABEL: Record<string, { label: string; style: string }> = {
  // vitality
  good:      { label: '양호', style: 'bg-emerald-100 text-emerald-700' },
  fair:      { label: '보통', style: 'bg-amber-100 text-amber-700' },
  poor:      { label: '저하', style: 'bg-red-100 text-red-700' },
  // appetite / water
  normal:    { label: '정상', style: 'bg-emerald-100 text-emerald-700' },
  increased: { label: '증가', style: 'bg-blue-100 text-blue-700' },
  decreased: { label: '감소', style: 'bg-red-100 text-red-700' },
}

function InquiryBadge({ value }: { value: string }) {
  const cfg = CONDITION_LABEL[value]
  if (!cfg) return null
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${cfg.style}`}>
      {cfg.label}
    </span>
  )
}

function InquiryField({ label, value }: { label: string; value?: string }) {
  if (!value?.trim()) return null
  return (
    <div>
      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{value}</p>
    </div>
  )
}

function InquirySection({ data }: { data: InquiryData }) {
  const hasChief = !!(data.chief_complaint || data.past_history || data.current_diseases)
  const hasCondition = !!(
    data.condition_vitality || data.condition_appetite || data.condition_water ||
    data.condition_urination || data.condition_defecation || data.condition_notes
  )
  const hasLiving = !!(
    data.living_type || data.diet_main || data.diet_treats ||
    data.diet_allergies || data.toilet_env || data.living_other
  )
  const hasPrevention = !!(data.vaccination || data.heartworm || data.internal_parasite || data.external_parasite || data.prev_checkup)
  const hasAiRisk = !!(data.ai_breed_risk || data.ai_age_risk || data.ai_management)

  if (!hasChief && !hasCondition && !hasLiving && !hasPrevention && !hasAiRisk) return null

  return (
    <section className="mb-10">
      <SectionTitle>문진</SectionTitle>

      <div className="flex flex-col gap-5">

        {/* 주호소 / 병력 — 가장 중요, 최상단 */}
        {hasChief && (
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">주호소 및 병력</p>
            <div className="flex flex-col gap-3">
              {data.chief_complaint && (
                <div className="rounded-lg bg-amber-50 p-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-600">현재 증상 / 주요 호소</p>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{data.chief_complaint}</p>
                </div>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InquiryField label="과거 병력" value={data.past_history} />
                <InquiryField label="현재 관리 중인 질환" value={data.current_diseases} />
              </div>
            </div>
          </div>
        )}

        {/* 최근 컨디션 */}
        {hasCondition && (
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">최근 컨디션</p>

            {/* 활력/식욕/음수 배지 */}
            {(data.condition_vitality || data.condition_appetite || data.condition_water) && (
              <div className="mb-3 flex flex-wrap gap-4">
                {data.condition_vitality && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">활력</span>
                    <InquiryBadge value={data.condition_vitality} />
                  </div>
                )}
                {data.condition_appetite && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">식욕</span>
                    <InquiryBadge value={data.condition_appetite} />
                  </div>
                )}
                {data.condition_water && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">음수량</span>
                    <InquiryBadge value={data.condition_water} />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InquiryField label="배뇨 상태" value={data.condition_urination} />
              <InquiryField label="배변 상태" value={data.condition_defecation} />
              {data.condition_notes && (
                <div className="sm:col-span-2">
                  <InquiryField label="기타 증상 / 메모" value={data.condition_notes} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 생활환경 + 예방의학 2컬럼 */}
        {(hasLiving || hasPrevention) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            {/* 생활환경 */}
            {hasLiving && (
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">생활환경</p>
                <div className="flex flex-col gap-3">
                  {data.living_type && (
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">생활 공간</p>
                      <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-medium text-teal-700">
                        {LIVING_TYPE_LABEL[data.living_type] ?? data.living_type}
                      </span>
                    </div>
                  )}
                  <InquiryField label="주사료" value={data.diet_main} />
                  <InquiryField label="부식 / 간식" value={data.diet_treats} />
                  <InquiryField label="알러지 / 금기 음식" value={data.diet_allergies} />
                  <InquiryField label="화장실 환경" value={data.toilet_env} />
                  <InquiryField label="기타 생활환경" value={data.living_other} />
                </div>
              </div>
            )}

            {/* 예방의학 이력 */}
            {hasPrevention && (
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">예방의학 이력</p>
                <div className="flex flex-col gap-3">
                  <InquiryField label="예방 접종" value={data.vaccination} />
                  <InquiryField label="사상충 예방" value={data.heartworm} />
                  <InquiryField label="내부 구충" value={data.internal_parasite} />
                  <InquiryField label="외부 구충" value={data.external_parasite} />
                  <InquiryField label="과거 건강검진 / 스켈링 이력" value={data.prev_checkup} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI 품종·나이 리스크 분석 */}
        {hasAiRisk && (
          <div className="overflow-hidden rounded-xl border border-teal-200">
            <div className="bg-teal-600 px-4 py-3">
              <p className="text-sm font-bold text-white">품종 · 나이별 건강 리스크 분석</p>
            </div>
            <div className="p-4">
              {/* 품종별 특이점 */}
              {data.ai_breed_risk && (
                <div className="mb-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-teal-600">품종별 특이점</p>
                  {typeof data.ai_breed_risk === 'object' ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {data.ai_breed_risk.predispositions && (
                        <div className="rounded-lg bg-slate-50 p-3">
                          <p className="mb-1 text-[10px] font-semibold text-slate-500">호발 질환</p>
                          <p className="text-xs leading-relaxed text-slate-700">{data.ai_breed_risk.predispositions}</p>
                        </div>
                      )}
                      {data.ai_breed_risk.anatomy && (
                        <div className="rounded-lg bg-slate-50 p-3">
                          <p className="mb-1 text-[10px] font-semibold text-slate-500">신체적 특이점</p>
                          <p className="text-xs leading-relaxed text-slate-700">{data.ai_breed_risk.anatomy}</p>
                        </div>
                      )}
                      {data.ai_breed_risk.genetic && (
                        <div className="rounded-lg bg-slate-50 p-3">
                          <p className="mb-1 text-[10px] font-semibold text-slate-500">유전적 소인</p>
                          <p className="text-xs leading-relaxed text-slate-700">{data.ai_breed_risk.genetic}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{data.ai_breed_risk}</p>
                  )}
                </div>
              )}

              {/* 연령별 건강 리스크 */}
              {data.ai_age_risk && (
                <div className="mb-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-teal-600">연령별 건강 리스크</p>
                  {typeof data.ai_age_risk === 'object' ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {data.ai_age_risk.stage && (
                        <div className="rounded-lg bg-slate-50 p-3">
                          <p className="mb-1 text-[10px] font-semibold text-slate-500">현재 생애 단계</p>
                          <p className="text-xs leading-relaxed text-slate-700">{data.ai_age_risk.stage}</p>
                        </div>
                      )}
                      {data.ai_age_risk.watch_items && (
                        <div className="rounded-lg bg-slate-50 p-3">
                          <p className="mb-1 text-[10px] font-semibold text-slate-500">주요 모니터링 항목</p>
                          <p className="text-xs leading-relaxed text-slate-700">{data.ai_age_risk.watch_items}</p>
                        </div>
                      )}
                      {data.ai_age_risk.preventive && (
                        <div className="rounded-lg bg-slate-50 p-3">
                          <p className="mb-1 text-[10px] font-semibold text-slate-500">예방 포인트</p>
                          <p className="text-xs leading-relaxed text-slate-700">{data.ai_age_risk.preventive}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{data.ai_age_risk}</p>
                  )}
                </div>
              )}

              {/* 권장 관리 포인트 */}
              {data.ai_management && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-teal-600">권장 관리 포인트</p>
                  {typeof data.ai_management === 'object' ? (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {data.ai_management.diet && (
                        <div className="rounded-lg bg-teal-50 p-3">
                          <p className="mb-1 text-[10px] font-semibold text-teal-600">식이 관리</p>
                          <p className="text-xs leading-relaxed text-slate-700">{data.ai_management.diet}</p>
                        </div>
                      )}
                      {data.ai_management.oral && (
                        <div className="rounded-lg bg-teal-50 p-3">
                          <p className="mb-1 text-[10px] font-semibold text-teal-600">구강 관리</p>
                          <p className="text-xs leading-relaxed text-slate-700">{data.ai_management.oral}</p>
                        </div>
                      )}
                      {data.ai_management.checkup && (
                        <div className="rounded-lg bg-teal-50 p-3">
                          <p className="mb-1 text-[10px] font-semibold text-teal-600">정기검진</p>
                          <p className="text-xs leading-relaxed text-slate-700">{data.ai_management.checkup}</p>
                        </div>
                      )}
                      {data.ai_management.environment && (
                        <div className="rounded-lg bg-teal-50 p-3">
                          <p className="mb-1 text-[10px] font-semibold text-teal-600">환경·생활 관리</p>
                          <p className="text-xs leading-relaxed text-slate-700">{data.ai_management.environment}</p>
                        </div>
                      )}
                      {data.ai_management.warning_signs && (
                        <div className="col-span-2 rounded-lg border border-amber-200 bg-amber-50 p-3 sm:col-span-3">
                          <p className="mb-1 text-[10px] font-semibold text-amber-600">즉시 내원이 필요한 이상 증상</p>
                          <p className="text-xs leading-relaxed text-slate-700">{data.ai_management.warning_signs}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{data.ai_management}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </section>
  )
}

// ── Executive Summary ─────────────────────────────────────────

type OverallStatus = 'severe' | 'moderate' | 'mild' | 'normal'

const OVERALL_STYLE: Record<OverallStatus, {
  headerBg: string; badge: string; dot: string; alertBorder: string; alertBg: string; alertText: string
}> = {
  severe:   { headerBg: 'bg-red-500',     badge: 'text-red-700',    dot: 'bg-red-500',     alertBorder: 'border-red-300',    alertBg: 'bg-red-50',    alertText: 'text-red-800'    },
  moderate: { headerBg: 'bg-orange-500',  badge: 'text-orange-700', dot: 'bg-orange-500',  alertBorder: 'border-orange-300', alertBg: 'bg-orange-50', alertText: 'text-orange-800' },
  mild:     { headerBg: 'bg-amber-400',   badge: 'text-amber-700',  dot: 'bg-amber-400',   alertBorder: 'border-amber-300',  alertBg: 'bg-amber-50',  alertText: 'text-amber-800'  },
  normal:   { headerBg: 'bg-emerald-500', badge: 'text-emerald-700',dot: 'bg-emerald-500', alertBorder: 'border-emerald-200',alertBg: 'bg-emerald-50',alertText: 'text-emerald-800'},
}
const OVERALL_LABEL: Record<OverallStatus, string> = {
  severe: '즉각 처치 필요', moderate: '추가 검사 권장', mild: '경미한 이상 소견', normal: '전반적 양호',
}
const STATUS_DOT: Record<string, string> = {
  severe: 'bg-red-500', moderate: 'bg-orange-500', mild: 'bg-amber-400', normal: 'bg-emerald-500',
}

function ExecutiveSummary({
  organSections, labItems, plan,
}: {
  organSections: ResolvedOrganSection[]
  labItems: LabResultItem[]
  plan: Record<string, unknown>
}) {
  const abnormalLabs = labItems.filter((i) => i.is_abnormal && i.value)
  const criticalLabs = abnormalLabs.filter((i) => i.severity === 'critical' || i.severity === 'high')

  if (organSections.length === 0 && abnormalLabs.length === 0) return null

  const severeOrgans  = organSections.filter((s) => isDxEvaluation(s.aiEval) && s.aiEval.status === 'severe')
  const moderateOrgans = organSections.filter((s) => isDxEvaluation(s.aiEval) && s.aiEval.status === 'moderate')
  const mildOrgans    = organSections.filter((s) => isDxEvaluation(s.aiEval) && s.aiEval.status === 'mild')

  const overall: OverallStatus =
    severeOrgans.length > 0 || criticalLabs.length > 0 ? 'severe'
    : moderateOrgans.length > 0 || abnormalLabs.some((i) => i.severity === 'moderate') ? 'moderate'
    : mildOrgans.length > 0 || abnormalLabs.length > 0 ? 'mild'
    : 'normal'

  const sty = OVERALL_STYLE[overall]
  const urgentAction = typeof plan.tx_priority_summary === 'string' ? plan.tx_priority_summary : ''

  return (
    <div className="mb-8 break-inside-avoid overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      {/* 헤더 */}
      <div className={`px-5 py-4 ${sty.headerBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-white">종합 평가 요약</h2>
          <span className={`rounded-full bg-white/95 px-3 py-1 text-[12px] font-bold ${sty.badge}`}>
            {overall === 'severe' ? '🔴' : overall === 'moderate' ? '🟠' : overall === 'mild' ? '🟡' : '🟢'} {OVERALL_LABEL[overall]}
          </span>
        </div>
      </div>

      <div className="p-5">
        {/* 즉시 처치 강조 박스 */}
        {(severeOrgans.length > 0 || criticalLabs.length > 0) && (
          <div className="mb-5 rounded-lg border border-red-300 bg-red-50 p-4">
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-red-700">⚠ 즉시 처치 필요</p>
            <div className="flex flex-col gap-1.5">
              {severeOrgans.map((s) => {
                const eval_ = s.aiEval as DxEvaluation
                return (
                  <p key={s.key} className="text-xs font-medium text-red-800">
                    <span className="font-bold">{s.label}</span>
                    {eval_.summary ? ` — ${eval_.summary}` : ''}
                  </p>
                )
              })}
              {criticalLabs.length > 0 && (
                <p className="text-xs font-medium text-red-800">
                  <span className="font-bold">긴급 이상 수치</span>
                  {' '}— {criticalLabs.map((i) => `${i.nameEn} ${i.value}${i.unit ?? ''}`).join(' · ')}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* 계통별 한줄 요약 */}
          <div>
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">계통별 평가</p>
            <div className="flex flex-col gap-2">
              {organSections.map((s) => {
                const eval_ = s.aiEval
                const isDx = isDxEvaluation(eval_)
                const status: string = isDx
                  ? eval_.status
                  : s.labItems.some((i) => i.severity === 'critical' || i.severity === 'high') ? 'severe'
                  : s.xrayFindings.some((f) => f.severity === 'severe') ? 'severe'
                  : s.labItems.some((i) => i.is_abnormal) ? 'mild'
                  : s.xrayFindings.some((f) => f.severity === 'moderate') ? 'moderate'
                  : s.physicalFindings.some((f) => f.isAbnormal) ? 'mild'
                  : s.xrayFindings.length > 0 ? 'mild'
                  : 'normal'
                const summary = isDx && eval_.summary
                  ? eval_.summary
                  : s.labItems.filter((i) => i.is_abnormal).length > 0
                  ? `이상 수치 ${s.labItems.filter((i) => i.is_abnormal).length}건`
                  : s.xrayFindings.length > 0
                  ? `방사선 이상 소견 ${s.xrayFindings.length}건`
                  : s.physicalFindings.some((f) => f.isAbnormal)
                  ? `신체검사 이상 소견`
                  : '이상 소견 없음'
                return (
                  <div key={s.key} className="flex items-start gap-2">
                    <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status] ?? 'bg-slate-300'}`} />
                    <p className="text-xs leading-relaxed text-slate-700">
                      <span className="font-semibold text-slate-800">{s.label}</span>
                      {' '}— {summary}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 주요 이상 수치 + 우선 조치 */}
          <div className="flex flex-col gap-4">
            {abnormalLabs.length > 0 && (
              <div>
                <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">주요 이상 수치</p>
                <div className="flex flex-wrap gap-1.5">
                  {abnormalLabs.slice(0, 10).map((item) => (
                    <span
                      key={item.id}
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                        item.severity === 'critical' || item.severity === 'high'
                          ? 'border-red-300 bg-red-50 text-red-700'
                          : item.severity === 'moderate'
                          ? 'border-orange-300 bg-orange-50 text-orange-700'
                          : 'border-amber-300 bg-amber-50 text-amber-700'
                      }`}
                    >
                      <span className="font-bold">{item.nameEn}</span>
                      <span>{item.value}{item.unit}</span>
                    </span>
                  ))}
                  {abnormalLabs.length > 10 && (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-500">
                      외 {abnormalLabs.length - 10}건
                    </span>
                  )}
                </div>
              </div>
            )}

            {urgentAction && (
              <div className={`rounded-lg border p-3 ${sty.alertBorder} ${sty.alertBg}`}>
                <p className={`mb-1.5 text-[11px] font-bold uppercase tracking-wide ${sty.alertText}`}>
                  권장 조치 요약
                </p>
                <p className={`whitespace-pre-wrap text-xs leading-relaxed ${sty.alertText}`}>
                  {urgentAction}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 임상병리 전체 표 ──────────────────────────────────────────
// "임상병리 검사 결과" 섹션에서 카테고리별 테이블로 모든 수치 나열

function LabTable({ items, title }: { items: LabResultItem[]; title: string }) {
  const filled = items.filter((i) => i.value !== null && i.value !== '')
  if (!filled.length) return null

  const SEVERITY_ROW: Record<LabSeverity, string> = {
    critical: 'bg-red-100',
    high:     'bg-red-50',
    moderate: 'bg-orange-50',
    mild:     'bg-amber-50/60',
  }

  return (
    <div className="mb-5 break-inside-avoid">
      <h3 className="mb-2 text-sm font-semibold text-slate-600">{title}</h3>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-slate-500">
              <th className="px-3 py-2 font-medium">항목</th>
              <th className="px-3 py-2 font-medium">결과값</th>
              <th className="px-3 py-2 font-medium">참고범위</th>
              <th className="px-3 py-2 font-medium">평가</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filled.map((item) => (
              <tr key={item.id} className={item.is_abnormal ? item.severity ? SEVERITY_ROW[item.severity] : 'bg-red-50/60' : ''}>
                <td className="px-3 py-2">
                  <span className="font-medium text-slate-800">{item.nameEn}</span>
                  <span className="ml-1.5 text-slate-400">{item.nameKo}</span>
                </td>
                <td className="px-3 py-2 font-mono font-semibold text-slate-700">
                  {item.value}
                  <span className="ml-1 font-sans font-normal text-slate-400">{item.unit}</span>
                </td>
                <td className="px-3 py-2 text-slate-400">{item.ref_range ?? '—'}</td>
                <td className="px-3 py-2">
                  {item.result_text ? (
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      item.severity
                        ? SEVERITY_BADGE[item.severity]
                        : item.is_abnormal
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {item.result_text}
                    </span>
                  ) : item.is_abnormal ? (
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">이상</span>
                  ) : item.value ? (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">정상</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filled.some((i) => i.is_abnormal && i.comment) && (
        <div className="mt-2 space-y-1 px-1">
          {filled.filter((i) => i.is_abnormal && i.comment).map((item) => (
            <p key={item.id} className="text-[11px] text-slate-500">
              <span className="font-medium text-slate-700">{item.nameEn}</span>: {item.comment}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 장기별 평가 섹션 ──────────────────────────────────────────

const DX_STATUS_STYLE: Record<DxEvaluation['status'], { badge: string; action: string }> = {
  normal:   { badge: 'bg-emerald-100 text-emerald-700', action: 'bg-emerald-50 border-emerald-200' },
  mild:     { badge: 'bg-amber-100 text-amber-700',     action: 'bg-amber-50 border-amber-200'     },
  moderate: { badge: 'bg-orange-100 text-orange-700',   action: 'bg-orange-50 border-orange-200'   },
  severe:   { badge: 'bg-red-100 text-red-700',         action: 'bg-red-50 border-red-200'         },
}
const DX_STATUS_LABEL: Record<DxEvaluation['status'], string> = {
  normal: '정상', mild: '경도 이상', moderate: '중등도 이상', severe: '중증 이상',
}

function isDxEvaluation(v: unknown): v is DxEvaluation {
  return !!v && typeof v === 'object' && 'status' in v
}

function OrganSection({ section }: { section: ResolvedOrganSection }) {
  const abnormalItems = section.labItems.filter((i) => i.is_abnormal)
  const hasImages = section.images.length > 0
  const eval_ = section.aiEval
  const isDx = isDxEvaluation(eval_)
  const hasAi = isDx ? !!eval_.summary : !!(eval_ as string)

  // 헤더 색상: DxEvaluation status 기준 → 없으면 이상 건수 기준
  const headerBg = isDx
    ? eval_.status === 'normal'   ? 'bg-teal-500'
    : eval_.status === 'mild'     ? 'bg-amber-500'
    : eval_.status === 'moderate' ? 'bg-orange-500'
    : 'bg-red-500'
    : abnormalItems.length > 0 ? 'bg-teal-600' : 'bg-teal-500'

  return (
    <div className="break-inside-avoid overflow-hidden rounded-xl border border-slate-200 shadow-sm">
      {/* 헤더 */}
      <div className={`px-4 py-3 ${headerBg}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white">{section.label}</h3>
          <div className="flex items-center gap-2">
            {isDx && (
              <span className={`rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold ${DX_STATUS_STYLE[eval_.status].badge}`}>
                {DX_STATUS_LABEL[eval_.status]}
              </span>
            )}
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-medium text-white">
              {abnormalItems.length > 0 ? `이상 ${abnormalItems.length}건` : '이상 없음'}
            </span>
          </div>
        </div>
        {!hasAi && (
          <p className="mt-0.5 text-[10px] text-white/70">* AI 종합 평가 미포함</p>
        )}
        {isDx && eval_.summary && (
          <p className="mt-1 text-[12px] font-medium text-white/90">{eval_.summary}</p>
        )}
      </div>

      <div className="p-4">
        {/* 신체검사 소견 */}
        {section.physicalFindings.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">신체검사 소견</p>
            <div className="flex flex-wrap gap-1.5">
              {section.physicalFindings.map((f) => (
                <div
                  key={f.id}
                  className={`flex items-baseline gap-1 rounded-lg border px-2.5 py-1.5 ${
                    f.isAbnormal
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-emerald-200 bg-emerald-50'
                  }`}
                >
                  <span className={`text-[11px] font-semibold ${f.isAbnormal ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {f.nameKo}
                  </span>
                  <span className="text-[11px] text-slate-600">{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 방사선 소견 */}
        {section.xrayFindings.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">방사선 소견</p>
            <div className="flex flex-wrap gap-1.5">
              {section.xrayFindings.map((f) => {
                const color =
                  f.severity === 'severe'   ? 'border-red-200 bg-red-50 text-red-700'
                  : f.severity === 'moderate' ? 'border-orange-200 bg-orange-50 text-orange-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
                return (
                  <div key={f.id} className={`rounded-lg border px-2.5 py-1.5 ${color}`}>
                    <span className="text-[11px] font-semibold">{f.label}</span>
                    {f.valueLabel && (
                      <span className="ml-1 font-mono text-[11px]">{f.valueLabel}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* lab 값 카드 그리드 */}
        {section.labItems.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {section.labItems.map((item) => (
              <LabValueCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* AI 소견 */}
        {hasAi && (
          <div className={hasImages ? 'grid grid-cols-1 gap-4 sm:grid-cols-3' : ''}>
            <div className={hasImages ? 'sm:col-span-2 flex flex-col gap-3' : 'flex flex-col gap-3'}>
              {isDx ? (
                <>
                  {eval_.detail && (
                    <div>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-teal-700">종합 소견</p>
                      <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{eval_.detail}</p>
                    </div>
                  )}
                  {eval_.action && (
                    <div className={`rounded-lg border p-3 ${DX_STATUS_STYLE[eval_.status].action}`}>
                      <p className="mb-1 text-[11px] font-semibold text-slate-600">권장 조치</p>
                      <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{eval_.action}</p>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-teal-700">종합 소견</p>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{eval_ as string}</p>
                </div>
              )}
            </div>
            {hasImages && (
              <div className="flex flex-col gap-2">
                {section.images.map((img) => (
                  <img
                    key={img.img_url}
                    src={img.img_url}
                    alt={section.label}
                    className="w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 소견 없을 때 이미지만 */}
        {!hasAi && hasImages && (
          <div className="flex flex-col gap-2">
            {section.images.map((img) => (
              <img key={img.img_url} src={img.img_url} alt={section.label} className="w-full rounded-lg object-cover" />
            ))}
          </div>
        )}

        {!hasAi && !hasImages && section.labItems.length > 0 && (
          <p className="text-[11px] text-slate-400">종합 소견이 작성되지 않았습니다.</p>
        )}
      </div>
    </div>
  )
}

// ── 영상검사 블록 ─────────────────────────────────────────────

function ImagingBlock({
  label, purpose, data, images,
}: {
  label: string
  purpose?: string
  data: Record<string, unknown>
  images: { img_url: string; tags: string[] }[]
}) {
  const notes = data.notes as Record<string, string> | string | undefined
  // organ_notes_owner(보호자용) 우선, 없으면 organ_notes(임상용) fallback
  const organNotes =
    (data.organ_notes_owner as Record<string, string> | undefined) ??
    (data.organ_notes as Record<string, string> | undefined)
  const checked = data.checked as Record<string, boolean> | undefined
  const checkedList = checked ? Object.entries(checked).filter(([, v]) => v).map(([k]) => k) : []

  const hasContent =
    (typeof notes === 'string' && notes) ||
    (typeof notes === 'object' && notes && Object.values(notes).some(Boolean)) ||
    (organNotes && Object.values(organNotes).some((v) => v?.trim())) ||
    checkedList.length > 0 ||
    images.length > 0

  if (!hasContent) return null

  const textContent = (
    <div className="text-xs text-slate-700">
      {checkedList.length > 0 && (
        <p className="mb-1.5"><span className="font-medium">이상소견:</span> {checkedList.join(', ')}</p>
      )}
      {typeof notes === 'string' && notes && (
        <p className="whitespace-pre-wrap leading-relaxed">{notes}</p>
      )}
      {typeof notes === 'object' && notes && (
        Object.entries(notes).filter(([, v]) => v).map(([k, v]) => (
          <p key={k} className="mb-1"><span className="font-medium">{k}:</span> {v}</p>
        ))
      )}
      {organNotes && (
        Object.entries(organNotes).filter(([, v]) => v?.trim()).map(([organ, note]) => (
          <div key={organ} className="mb-2.5">
            <p className="mb-0.5 text-[11px] font-semibold text-slate-500">
              {ORGAN_NAME_KO[organ] ?? organ}
            </p>
            <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{note}</p>
          </div>
        ))
      )}
    </div>
  )

  return (
    <div className="mb-4 break-inside-avoid overflow-hidden rounded-xl border border-slate-200">
      <div className="border-b bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
        {purpose && (
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">{purpose}</p>
        )}
      </div>
      <div className="p-4">
        {images.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">{textContent}</div>
            <div className="flex flex-col gap-2">
              {images.map((img) => (
                <img key={img.img_url} src={img.img_url} alt={label} className="w-full rounded-lg object-cover" />
              ))}
            </div>
          </div>
        ) : (
          textContent
        )}
      </div>
    </div>
  )
}

// ── 메인 리포트 ───────────────────────────────────────────────

interface Props {
  data: CheckupReportData
}

export default function CheckupReport({ data }: Props) {
  const { record, sections, images } = data
  const { patient } = record

  const getSection = (type: string) =>
    (sections.find((s) => s.section_type === type)?.data ?? {}) as Record<string, unknown>

  const physical = getSection('physical')
  const plan = getSection('plan') as Record<string, unknown>
  const inquiry = getSection('inquiry') as Partial<InquiryData>
  const labItems = (getSection('lab').items ?? []) as LabResultItem[]
  const xrayData = getSection('xray')

  const speciesForStage = /^(cat|feline)/i.test(patient.species ?? '') ? 'cat' as const : 'dog' as const

  const organSections = resolveOrganSections(labItems, plan, images, ORGAN_MODULE_CONFIGS, physical, xrayData, speciesForStage)

  /** plan 데이터에서 문자열 값을 안전하게 꺼냄 (DxEvaluation 객체 제외) */
  const ps = (key: string): string => {
    const v = plan[key]
    return typeof v === 'string' ? v : ''
  }

  const coverImage = images.find((img) => img.tags?.includes('cover') || img.is_cover)
  const checkupDateLabel = record.checkup_date
    ? new Date(record.checkup_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : ''
  const abnormalCount = labItems.filter((i) => i.is_abnormal && i.value).length
  const bodyWeightKg = parseFloat(String(physical.body_weight ?? '0')) || 0
  const lifeStage = getLifeStageFromBirth(patient.birth ?? null, speciesForStage, getDogSizeClass(bodyWeightKg))
  const isNeutered = /중성화|neutered|spayed/i.test(patient.gender ?? '')
  const bcsNum = parseInt(String(physical.bcs ?? ''), 10) || 0
  const calorieData = bodyWeightKg > 0 && bcsNum >= 1 && bcsNum <= 9 && lifeStage
    ? { currentWeight: bodyWeightKg, bcs: bcsNum, ageStage: lifeStage.stage.stage as LifeStage }
    : null

  const hasPhysical = Object.keys(physical).length > 0
  const hasLab = labItems.some((i) => i.value)
  const hasOrgan = organSections.length > 0
  const hasPlan = !!(ps('tx_priority_summary') || ps('tx_medication') || ps('tx_further_workup') || ps('guide_diet'))
  const hasFollowup = !!(ps('followup_plan') || ps('next_checkup_date'))

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

        {/* ── 헤더 ──────────────────────────────────────────── */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          {/* 상단 teal 띠 */}
          <div className="bg-teal-600 px-6 py-4">
            <div className="flex items-center gap-4">
              {coverImage && (
                <img
                  src={coverImage.img_url}
                  alt={patient.name}
                  className="h-20 w-20 shrink-0 rounded-xl border-2 border-white/40 object-cover shadow"
                />
              )}
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded bg-white/20 px-2 py-0.5 text-[11px] font-semibold text-white">건강검진 리포트</span>
                  {abnormalCount > 0 && (
                    <span className="rounded bg-red-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                      이상 {abnormalCount}건
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-white">{patient.name}</h1>
                <p className="mt-0.5 text-sm text-teal-100">
                  {speciesLabel(patient.species)}
                  {patient.breed && ` · ${patient.breed}`}
                  {patient.gender && ` · ${patient.gender}`}
                  {lifeStage ? ` · ${lifeStage.ageLabel}` : patient.birth ? ` · ${calcAge(patient.birth)}` : ''}
                </p>
                {lifeStage && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${lifeStage.stage.colorClass}`}>
                      {lifeStage.stage.stageKo}
                    </span>
                    <span className="text-xs text-teal-100">
                      사람 나이 약 <strong className="text-white">{lifeStage.humanAge}세</strong> 상당
                    </span>
                    <span className="text-[11px] text-teal-200">
                      권장 검진 주기: {lifeStage.stage.checkupInterval}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* 하단 메타 */}
          <div className="flex flex-wrap gap-6 bg-slate-50 px-6 py-3 text-xs text-slate-500">
            <span>검진일 <strong className="text-slate-700">{checkupDateLabel}</strong></span>
            {record.vet_name && <span>담당의 <strong className="text-slate-700">{record.vet_name}</strong></span>}
            {record.hospital_name && <span>병원 <strong className="text-slate-700">{record.hospital_name}</strong></span>}
            {patient.owner_name && <span>보호자 <strong className="text-slate-700">{patient.owner_name}</strong></span>}
          </div>
        </div>

        {/* ── Executive Summary ─────────────────────────── */}
        <ExecutiveSummary organSections={organSections} labItems={labItems} plan={plan} />

        {/* ── 0. 문진 ──────────────────────────────────────── */}
        <InquirySection data={inquiry as InquiryData} />

        {/* ── 1. 신체검사 ──────────────────────────────────── */}
        {hasPhysical && (
          <section className="mb-10 break-before-auto">
            <SectionTitle>신체검사</SectionTitle>

            {/* 활력징후 수치 카드 */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <VitalNumCard
                label="체중"
                value={physical.body_weight as string | number | undefined}
                unit="kg"
              />
              <VitalNumCard
                label="체온"
                value={physical.temperature as string | number | undefined}
                unit="°C"
                refRange={speciesForStage === 'cat' ? '38.1–39.2' : '37.5–39.2'}
              />
              <VitalNumCard
                label="심박수"
                value={(physical.heart_rate ?? physical.pulse) as string | number | undefined}
                unit="bpm"
                refRange={speciesForStage === 'cat' ? '140–220' : '60–180'}
              />
              <VitalNumCard
                label="호흡수"
                value={(physical.respiratory_rate ?? physical.respiration) as string | number | undefined}
                unit="회/분"
                refRange={speciesForStage === 'cat' ? '20–40' : '15–30'}
              />
              <VitalNumCard
                label="수축기 혈압"
                value={physical.systolic_bp as string | number | undefined}
                unit="mmHg"
                refRange="110–160"
              />
            </div>

            {/* BCS / MCS 게이지 */}
            {!!(physical.bcs || physical.mcs) && (
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {!!physical.bcs && <BcsGauge value={physical.bcs as string | number} />}
                {!!physical.mcs && <McsGauge value={String(physical.mcs)} />}
              </div>
            )}

            {/* 칼로리 카드 */}
            {calorieData && (
              <div className="mb-4">
                <CalorieCard
                  currentWeight={calorieData.currentWeight}
                  bcs={calorieData.bcs}
                  isNeutered={isNeutered}
                  ageStage={calorieData.ageStage}
                  species={speciesForStage}
                />
              </div>
            )}

            {/* 체중 변화 */}
            {!!physical.weight_change && !isPhysicalNormalValue(String(physical.weight_change)) && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <span className="text-xs font-semibold text-slate-600">체중 변화</span>
                <span className="text-xs text-amber-800">{String(physical.weight_change)}</span>
              </div>
            )}

            {/* 계통별 소견 */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PHYSICAL_SECTION_ORDER.filter(
                (sec) => sec !== 'vitals' && sec !== 'body_condition'
              ).map((sec) => {
                const statusKey = sectionStatusKey(sec)
                const status = physical[statusKey] as string | undefined
                const sectionFields = getPhysicalRefBySection(sec)
                const abnormalFindings = sectionFields.reduce<{ name: string; val: string }[]>(
                  (acc, field) => {
                    const raw = physical[field.id]
                    if (!raw) return acc
                    const val = String(raw).trim()
                    if (val && !isPhysicalNormalValue(val)) acc.push({ name: field.nameKo, val })
                    return acc
                  },
                  [],
                )
                const isAbnormal = status === 'abnormal' || abnormalFindings.length > 0
                if (!status && abnormalFindings.length === 0) return null
                return (
                  <div
                    key={sec}
                    className={`rounded-xl border p-3 ${
                      isAbnormal ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'
                    }`}
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">
                        {PHYSICAL_SECTION_LABEL[sec]}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        isAbnormal ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {isAbnormal ? '이상' : '정상'}
                      </span>
                    </div>
                    {abnormalFindings.length > 0 && (
                      <div className="flex flex-col gap-0.5">
                        {abnormalFindings.map((f) => (
                          <p key={f.name} className="text-[11px] leading-relaxed text-slate-700">
                            <span className="font-medium text-amber-700">{f.name}</span>
                            {' '}— {f.val}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── 2. 장기별 종합 평가 ─────────────────────────── */}
        {hasOrgan && (
          <section className="mb-10 print:break-before-page">
            <SectionTitle>장기별 종합 평가</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {organSections.map((section) => (
                <OrganSection key={section.key} section={section} />
              ))}
            </div>
          </section>
        )}

        {/* ── 3. 종합 권고사항 ─────────────────────────────── */}
        {hasPlan && (
          <section className="mb-10 print:break-before-page">
            <SectionTitle>종합 평가 및 권고사항</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {ps('tx_priority_summary') && (
                <div className="break-inside-avoid rounded-xl border-2 border-teal-200 bg-teal-50 p-5">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-teal-600">치료·관리 우선순위</p>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-teal-800">{ps('tx_priority_summary')}</p>
                </div>
              )}
              {ps('tx_medication') && (
                <div className="break-inside-avoid rounded-xl border border-slate-200 p-5">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">약물·치료 계획</p>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{ps('tx_medication')}</p>
                </div>
              )}
              {ps('tx_further_workup') && (
                <div className="break-inside-avoid rounded-xl border border-slate-200 p-5">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">추가 검사 계획</p>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{ps('tx_further_workup')}</p>
                </div>
              )}
              {ps('guide_diet') && (
                <div className="break-inside-avoid rounded-xl border border-slate-200 p-5">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">식이·생활 관리</p>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{ps('guide_diet')}</p>
                  {ps('guide_weight') && (
                    <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-600">{ps('guide_weight')}</p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── 4. 추적관찰 계획 ─────────────────────────────── */}
        {hasFollowup && (
          <section className="mb-10">
            <SectionTitle>추적 관찰 계획</SectionTitle>
            <div className="break-inside-avoid rounded-xl border border-slate-200 p-5">
              {ps('followup_plan') && (
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{ps('followup_plan')}</p>
              )}
              {ps('next_checkup_date') && (
                <p className="mt-3 text-xs font-medium text-teal-700">
                  다음 건강검진 예정일:{' '}
                  {new Date(ps('next_checkup_date')).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>
          </section>
        )}

        {/* ── 부록 A: 임상병리 검사 전체 결과 ──────────────── */}
        {hasLab && (
          <AppendixSection tag="부록 A" title="임상병리 검사 전체 결과">
            {LAB_TABLE_GROUPS.map((g) => (
              <LabTable
                key={g.section}
                title={g.title}
                items={labItems.filter((item) => item.section?.includes(g.section))}
              />
            ))}
            <LabTable
              title="기타 (미분류)"
              items={labItems.filter((item) => item.id?.startsWith('unmatched_'))}
            />
          </AppendixSection>
        )}

        {/* ── 부록 B: 방사선 검사 ───────────────────────────── */}
        {(() => {
          const xrayCfg = IMAGING_SECTION_CONFIGS.find((c) => c.key === 'xray')
          if (!xrayCfg) return null
          const d = getSection(xrayCfg.key)
          const imgs = images.filter((img) => img.tags?.some((t) => xrayCfg.imageTagPrefixes.some((p) => t.startsWith(p))))
          if (Object.keys(d).length === 0 && imgs.length === 0) return null
          return (
            <AppendixSection tag="부록 B" title="방사선 (X-ray) 검사">
              <ImagingBlock label={xrayCfg.label} purpose={xrayCfg.purpose} data={d} images={imgs} />
            </AppendixSection>
          )
        })()}

        {/* ── 부록 C: 초음파 검사 ───────────────────────────── */}
        {(() => {
          const usCfgs = IMAGING_SECTION_CONFIGS.filter((c) => c.key === 'ultrasound_basic' || c.key === 'echo_basic')
          const hasUs = usCfgs.some((c) => {
            const d = getSection(c.key)
            return Object.keys(d).length > 0 || images.some((img) => img.tags?.some((t) => c.imageTagPrefixes.some((p) => t.startsWith(p))))
          })
          if (!hasUs) return null
          return (
            <AppendixSection tag="부록 C" title="초음파 검사">
              {usCfgs.map((c) => (
                <ImagingBlock
                  key={c.key}
                  label={c.label}
                  purpose={c.purpose}
                  data={getSection(c.key)}
                  images={images.filter((img) => img.tags?.some((t) => c.imageTagPrefixes.some((p) => t.startsWith(p))))}
                />
              ))}
            </AppendixSection>
          )
        })()}

        {/* ── 부록 D: 정밀 검사 (CT/MRI/내시경) ───────────── */}
        {(() => {
          const ctCfg = IMAGING_SECTION_CONFIGS.find((c) => c.key === 'ct_mri')
          if (!ctCfg) return null
          const d = getSection(ctCfg.key)
          const imgs = images.filter((img) => img.tags?.some((t) => ctCfg.imageTagPrefixes.some((p) => t.startsWith(p))))
          if (Object.keys(d).length === 0 && imgs.length === 0) return null
          return (
            <AppendixSection tag="부록 D" title="정밀 검사 (CT / MRI / 내시경)">
              <ImagingBlock label={ctCfg.label} purpose={ctCfg.purpose} data={d} images={imgs} />
            </AppendixSection>
          )
        })()}

        {/* 메인 푸터 (화면 전용) */}
        <footer className="border-t pt-6 text-center text-[11px] text-slate-400 print:hidden">
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

          /* 반복 헤더·푸터 공간 확보 */
          .print-running-header { height: 28px; }

          /* 페이지 분할 */
          .print\\:break-before-page { break-before: page; }
          .break-inside-avoid        { break-inside: avoid; }

          /* 카드·테이블 분할 방지 */
          table { break-inside: auto; }
          tr    { break-inside: avoid; }

          /* 폰트 렌더링 */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

          /* 그림자 제거 (잉크 절약) */
          .shadow-sm { box-shadow: none !important; }
        }
      `}</style>
    </div>
  )
}
