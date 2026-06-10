import type React from 'react'
import {
  Scale, Thermometer, HeartPulse, Wind, Activity,
  Droplets, Heart, Dumbbell, Layers, Brain,
  CircleDot, TrendingUp, TrendingDown, Flame, Target, CheckCircle2,
} from 'lucide-react'
import {
  PHYSICAL_SECTION_ORDER,
  PHYSICAL_SECTION_LABEL,
  getPhysicalRefBySection,
  type PhysicalSection,
} from '@/constants/hospital/checkup/physical-ref'
import { sectionStatusKey } from '@/components/hospital/checkup/checkup-case/physical-exam-section'
import {
  calcCalories,
  type LifeStage,
  type getLifeStageFromBirth,
} from '@/constants/hospital/checkup/life-stage-ref'
import { SectionTitle } from './report-ui'
import CheckupImgCard from './checkup-img-card'
import { isPhysicalNormalValue, parseRange } from './report-utils'

type LifeStageResult = ReturnType<typeof getLifeStageFromBirth>

// ── 계통별 테마 ─────────────────────────────────────────────────
const SECTION_THEME: Partial<Record<PhysicalSection, { gradient: string; Icon: React.ElementType }>> = {
  hydration:       { gradient: 'from-cyan-500 to-sky-500',       Icon: Droplets  },
  lymph_nodes:     { gradient: 'from-indigo-500 to-violet-500',  Icon: CircleDot },
  cardiovascular:  { gradient: 'from-rose-500 to-pink-500',      Icon: Heart     },
  respiratory:     { gradient: 'from-sky-500 to-blue-600',       Icon: Wind      },
  abdomen:         { gradient: 'from-amber-500 to-orange-500',   Icon: Activity  },
  musculoskeletal: { gradient: 'from-emerald-500 to-teal-600',   Icon: Dumbbell  },
  skin:            { gradient: 'from-purple-500 to-fuchsia-500', Icon: Layers    },
  mentation:       { gradient: 'from-slate-500 to-indigo-600',   Icon: Brain     },
}

// ── 활력징후 수치 카드 ──────────────────────────────────────────
export function VitalNumCard({
  label, value, unit, refRange, Icon, accentColor = 'teal',
}: {
  label: string
  value: string | number | null | undefined
  unit?: string
  refRange?: string
  Icon?: React.ElementType
  accentColor?: string
}) {
  if (value === null || value === undefined || value === '') return null
  const num = parseFloat(String(value))
  let warn = false
  if (refRange && !isNaN(num)) {
    const range = parseRange(refRange)
    if (range) warn = num < range[0] || num > range[1]
  }

  const accentMap: Record<string, string> = {
    teal: 'from-teal-400 to-cyan-500',
    rose: 'from-rose-400 to-pink-500',
    sky:  'from-sky-400 to-blue-500',
    amber:'from-amber-400 to-orange-500',
    indigo:'from-indigo-400 to-violet-500',
  }
  const gradient = warn ? 'from-amber-400 to-orange-400' : (accentMap[accentColor] ?? accentMap.teal)

  return (
    <div className={`overflow-hidden rounded-2xl border shadow-sm ${warn ? 'border-amber-200' : 'border-slate-100'}`}>
      <div className={`bg-gradient-to-r ${gradient} px-3 py-2 flex items-center gap-2`}>
        {Icon && <Icon size={14} className="text-white/80" strokeWidth={2} />}
        <p className="text-xs font-semibold text-white/90">{label}</p>
      </div>
      <div className={`px-3 py-2.5 text-center ${warn ? 'bg-amber-50' : 'bg-white'}`}>
        <p className={`font-mono text-2xl font-bold leading-none ${warn ? 'text-amber-700' : 'text-slate-800'}`}>
          {value}
          {unit && <span className="ml-0.5 font-sans text-sm font-normal text-slate-400">{unit}</span>}
        </p>
        {refRange && <p className="mt-1 text-xs text-slate-400">기준 {refRange}</p>}
        {warn && <p className="mt-0.5 text-xs font-semibold text-amber-600">범위 이탈</p>}
      </div>
    </div>
  )
}

// ── BCS 게이지 ─────────────────────────────────────────────────
export function BcsGauge({ value }: { value: string | number }) {
  const bcs = parseInt(String(value), 10)
  if (!bcs || bcs < 1 || bcs > 9) return null
  const isDanger  = bcs <= 2 || bcs >= 8
  const isWarning = bcs === 3 || bcs === 6 || bcs === 7
  const statusLabel =
    bcs <= 2 ? '극도 저체중'
    : bcs === 3 ? '저체중'
    : bcs <= 5 ? '이상적 체형'
    : bcs === 6 ? '과체중'
    : bcs <= 8 ? '비만'
    : '극도 비만'
  const headerGradient = isDanger  ? 'from-red-500 to-rose-500'
                        : isWarning ? 'from-amber-500 to-orange-400'
                        :             'from-emerald-500 to-teal-500'
  return (
    <div className={`overflow-hidden rounded-2xl border shadow-sm ${isDanger ? 'border-red-200' : isWarning ? 'border-amber-200' : 'border-emerald-200'}`}>
      <div className={`flex items-center gap-2 bg-gradient-to-r ${headerGradient} px-4 py-3`}>
        <Scale size={16} className="text-white/80" strokeWidth={1.75} />
        <p className="text-sm font-bold text-white">BCS (체형 점수)</p>
        <span className="ml-auto rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">
          {bcs} / 9 · {statusLabel}
        </span>
      </div>
      <div className="bg-white p-4">
        <div className="flex items-center gap-1">
          {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all ${
                n === bcs
                  ? isDanger  ? 'bg-red-500 text-white ring-2 ring-red-300 scale-110'
                  : isWarning ? 'bg-amber-400 text-white ring-2 ring-amber-200 scale-110'
                  :             'bg-emerald-500 text-white ring-2 ring-emerald-200 scale-110'
                : n < bcs
                ? 'bg-slate-200 text-slate-500'
                : 'border border-slate-200 bg-white text-slate-300'
              }`}
            >
              {n}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── MCS 게이지 ─────────────────────────────────────────────────
export function McsGauge({ value }: { value: string }) {
  const score = parseInt(value, 10)
  if (!score || score < 1 || score > 4) return null
  const isDanger  = score <= 2
  const isWarning = score === 3
  const labels = ['심한 근감소', '중등도 근감소', '경미한 근감소', '정상']
  const statusLabel = labels[score - 1]
  const headerGradient = isDanger  ? 'from-red-500 to-rose-500'
                        : isWarning ? 'from-amber-500 to-orange-400'
                        :             'from-emerald-500 to-teal-500'
  return (
    <div className={`overflow-hidden rounded-2xl border shadow-sm ${isDanger ? 'border-red-200' : isWarning ? 'border-amber-200' : 'border-emerald-200'}`}>
      <div className={`flex items-center gap-2 bg-gradient-to-r ${headerGradient} px-4 py-3`}>
        <Dumbbell size={16} className="text-white/80" strokeWidth={1.75} />
        <p className="text-sm font-bold text-white">MCS (근육 상태)</p>
        <span className="ml-auto rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">
          {score} / 4 · {statusLabel}
        </span>
      </div>
      <div className="bg-white p-4">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={`flex h-8 flex-1 items-center justify-center rounded-lg text-sm font-bold transition-all ${
                n === score
                  ? isDanger  ? 'bg-red-500 text-white ring-2 ring-red-300 scale-105'
                  : isWarning ? 'bg-amber-400 text-white ring-2 ring-amber-200 scale-105'
                  :             'bg-emerald-500 text-white ring-2 ring-emerald-200 scale-105'
                : n < score
                ? 'bg-slate-200 text-slate-500'
                : 'border border-slate-200 bg-white text-slate-300'
              }`}
            >
              {n}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── 칼로리 카드 ────────────────────────────────────────────────
export function CalorieCard({
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
  const isIdeal   = bcs >= 4 && bcs <= 5

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 px-5 py-3.5">
        <Flame size={16} className="text-white/80" strokeWidth={1.75} />
        <p className="text-sm font-bold text-white">체중 관리 목표 (BCS 기반 칼로리 계산)</p>
      </div>
      <div className="bg-white p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
            <p className="text-xs text-slate-400">현재 체중</p>
            <p className="mt-1 font-mono text-xl font-bold text-slate-800">
              {currentWeight}
              <span className="ml-0.5 font-sans text-sm font-normal text-slate-400">kg</span>
            </p>
          </div>
          <div className={`rounded-xl border p-3 text-center ${isIdeal ? 'border-emerald-100 bg-emerald-50' : needsLoss ? 'border-amber-100 bg-amber-50' : 'border-blue-100 bg-blue-50'}`}>
            <p className="text-xs text-slate-400">이상 체중 (추정)</p>
            <p className={`mt-1 font-mono text-xl font-bold ${isIdeal ? 'text-emerald-700' : needsLoss ? 'text-amber-700' : 'text-blue-700'}`}>
              {result.idealWeight}
              <span className="ml-0.5 font-sans text-sm font-normal text-slate-400">kg</span>
            </p>
            {!isIdeal && (
              <p className={`mt-0.5 flex items-center justify-center gap-0.5 text-xs font-semibold ${needsLoss ? 'text-amber-600' : 'text-blue-600'}`}>
                {needsLoss ? <TrendingDown size={11} strokeWidth={2} /> : <TrendingUp size={11} strokeWidth={2} />}
                {needsLoss ? '감량 필요' : '증체 필요'}
              </p>
            )}
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
            <p className="text-xs text-slate-400">RER (휴식 에너지)</p>
            <p className="mt-1 font-mono text-xl font-bold text-slate-700">
              {result.rer}
              <span className="ml-0.5 font-sans text-sm font-normal text-slate-400">kcal</span>
            </p>
          </div>
          <div className="rounded-xl border border-teal-100 bg-teal-50 p-3 text-center">
            <p className="text-xs text-slate-400">DER (일일 권장)</p>
            <p className="mt-1 font-mono text-xl font-bold text-teal-700">
              {result.der}
              <span className="ml-0.5 font-sans text-sm font-normal text-slate-400">kcal</span>
            </p>
            <p className="mt-0.5 text-xs font-semibold text-teal-500">×{result.lifeFactor}</p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-400">
          RER = 70 × 이상체중<sup>0.75</sup> · DER = RER × 생활계수
          {isNeutered ? ' (중성화)' : ' (미중성화)'}
          {needsLoss ? ' · 감량 모드' : needsGain ? ' · 증체 모드' : ''}
        </p>
      </div>
    </div>
  )
}

// ── 체중·체형 관리 블록 ────────────────────────────────────────
function WeightManagementBlock({
  physical, bodyWeightKg, bcsNum, lifeStage, isNeutered, species,
}: {
  physical: Record<string, unknown>
  bodyWeightKg: number
  bcsNum: number
  lifeStage: LifeStageResult
  isNeutered: boolean
  species: 'cat' | 'dog'
}) {
  const hasWeight = bodyWeightKg > 0 || (!!physical.body_weight && String(physical.body_weight).trim() !== '')
  const hasBcs    = (bcsNum >= 1 && bcsNum <= 9) || (!!physical.bcs && String(physical.bcs).trim() !== '')
  const hasMcs    = !!physical.mcs && String(physical.mcs).trim() !== ''
  const hasWeightChange = !!physical.weight_change && !isPhysicalNormalValue(String(physical.weight_change))

  // 체중 관련 데이터가 하나도 없으면 블록 숨김
  if (!hasWeight && !hasBcs && !hasMcs && !hasWeightChange) return null

  // 칼로리 계산은 실제 숫자값이 있을 때만
  const calorieData = bodyWeightKg > 0 && bcsNum >= 1 && bcsNum <= 9 && lifeStage
    ? { currentWeight: bodyWeightKg, bcs: bcsNum, ageStage: lifeStage.stage.stage as LifeStage }
    : null

  const bcsStatus =
    bcsNum === 0 ? null
    : bcsNum <= 2 ? { label: '극도 저체중', color: 'text-red-600' }
    : bcsNum === 3 ? { label: '저체중',      color: 'text-amber-600' }
    : bcsNum <= 5 ? { label: '이상 체형',    color: 'text-emerald-600' }
    : bcsNum === 6 ? { label: '과체중',      color: 'text-amber-600' }
    : bcsNum <= 8 ? { label: '비만',         color: 'text-amber-600' }
    : { label: '극도 비만', color: 'text-red-600' }

  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 px-5 py-3.5">
        <Scale size={16} className="text-white/80" strokeWidth={1.75} />
        <p className="text-sm font-bold text-white">체중 · 체형 관리</p>
        {hasBcs && bcsStatus && (
          <span className="ml-auto rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold text-white">
            BCS {bcsNum}/9 · {bcsStatus.label}
          </span>
        )}
      </div>

      <div className="bg-white p-5">
        {/* 체중 + 체중변화 */}
        <div className="mb-4 flex flex-wrap items-center gap-4">
          {hasWeight && (
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-4xl font-bold text-slate-800">{bodyWeightKg}</span>
              <span className="text-base text-slate-400">kg</span>
            </div>
          )}
          {hasWeightChange && (
            <div className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5">
              <TrendingDown size={14} className="shrink-0 text-amber-500" strokeWidth={2} />
              <span className="text-xs font-semibold text-amber-700">체중 변화</span>
              <span className="text-xs text-amber-800">{String(physical.weight_change)}</span>
            </div>
          )}
        </div>

        {/* BCS / MCS 게이지 */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {hasBcs && <BcsGauge value={bcsNum} />}
          {hasMcs && <McsGauge value={String(physical.mcs)} />}
        </div>

        {/* 칼로리 계산 */}
        {calorieData && (
          <div className="mt-4">
            <CalorieCard
              currentWeight={calorieData.currentWeight}
              bcs={calorieData.bcs}
              isNeutered={isNeutered}
              ageStage={calorieData.ageStage}
              species={species}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ── 신체검사 섹션 ──────────────────────────────────────────────
interface PhysicalSectionProps {
  physical: Record<string, unknown>
  species: 'cat' | 'dog'
  bodyWeightKg: number
  bcsNum: number
  lifeStage: LifeStageResult
  isNeutered: boolean
  images?: { id: string; img_url: string; tags: string[]; img_memo?: string | null; mark?: Record<string, unknown> | null; is_cover?: boolean }[]
  checkupId?: string
  isShared?: boolean
}

export function PhysicalSection({
  physical, species, bodyWeightKg, bcsNum, lifeStage, isNeutered, images = [], checkupId, isShared,
}: PhysicalSectionProps) {
  const generalImages = images.filter((img) => img.tags?.includes('physical_general'))
  const skinImages    = images.filter((img) => img.tags?.includes('physical_skin'))

  return (
    <section className="mb-10 break-before-auto">
      <SectionTitle>신체검사</SectionTitle>

      {/* 전신 사진 */}
      {generalImages.length > 0 && (
        <div className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {generalImages.map((img) => (
            <CheckupImgCard key={img.img_url} img={img} checkupId={checkupId ?? ''} isShared={isShared} />
          ))}
        </div>
      )}

      {/* ① 체중·체형 관리 블록 */}
      <WeightManagementBlock
        physical={physical}
        bodyWeightKg={bodyWeightKg}
        bcsNum={bcsNum}
        lifeStage={lifeStage}
        isNeutered={isNeutered}
        species={species}
      />

      {/* ② 활력징후 카드 (체중 제외) */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <VitalNumCard
          label="체온" Icon={Thermometer} accentColor="amber"
          value={physical.temperature as string | number | undefined}
          unit="°C"
          refRange={species === 'cat' ? '38.1–39.2' : '37.5–39.2'}
        />
        <VitalNumCard
          label="심박수" Icon={HeartPulse} accentColor="rose"
          value={(physical.heart_rate ?? physical.pulse) as string | number | undefined}
          unit="bpm"
          refRange={species === 'cat' ? '140–220' : '60–180'}
        />
        <VitalNumCard
          label="호흡수" Icon={Wind} accentColor="sky"
          value={(physical.respiratory_rate ?? physical.respiration) as string | number | undefined}
          unit="회/분"
          refRange={species === 'cat' ? '20–40' : '15–30'}
        />
        <VitalNumCard
          label="수축기 혈압" Icon={Activity} accentColor="indigo"
          value={physical.systolic_bp as string | number | undefined}
          unit="mmHg"
          refRange="110–160"
        />
      </div>

      {/* ③ 계통별 소견 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PHYSICAL_SECTION_ORDER.filter((sec) => sec !== 'vitals' && sec !== 'body_condition').map((sec) => {
          const statusKey = sectionStatusKey(sec)
          const status = physical[statusKey] as string | undefined
          const sectionFields = getPhysicalRefBySection(sec)
          const theme = SECTION_THEME[sec]

          const allFindings = sectionFields.reduce<{ name: string; val: string; isAbnormal: boolean }[]>(
            (acc, field) => {
              const raw = physical[field.id]
              if (!raw) return acc
              const val = String(raw).trim()
              if (!val) return acc
              acc.push({ name: field.nameKo, val, isAbnormal: !isPhysicalNormalValue(val) })
              return acc
            },
            [],
          )
          const abnormalCount = allFindings.filter((f) => f.isAbnormal).length
          const isAbnormal = status === 'abnormal' || abnormalCount > 0
          const hasSkinImages = sec === 'skin' && skinImages.length > 0
          if (!status && allFindings.length === 0 && !hasSkinImages) return null

          const SectionIcon = theme?.Icon ?? Target
          const gradient = theme?.gradient ?? 'from-slate-400 to-slate-500'

          return (
            <div
              key={sec}
              className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm"
            >
              {/* 계통 헤더 */}
              <div className={`flex items-center gap-2.5 bg-gradient-to-r ${gradient} px-4 py-3`}>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
                  <SectionIcon size={14} className="text-white" strokeWidth={1.75} />
                </div>
                <p className="flex-1 text-sm font-bold text-white">{PHYSICAL_SECTION_LABEL[sec]}</p>
                <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  {isAbnormal ? `이상 ${abnormalCount}건` : '정상'}
                </span>
              </div>

              {/* 항목 목록 */}
              {allFindings.length === 0 ? (
                <div className="flex items-center gap-2 bg-emerald-50 px-4 py-3">
                  <CheckCircle2 size={14} className="shrink-0 text-emerald-500" strokeWidth={2} />
                  <p className="text-xs text-emerald-700">이상 소견 없음 — 전 항목 정상 범위입니다.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 bg-white">
                  {allFindings.map((f) => (
                    <div
                      key={f.name}
                      className={`flex items-baseline justify-between gap-3 px-4 py-2.5 ${f.isAbnormal ? 'bg-amber-50' : ''}`}
                    >
                      <span className={`shrink-0 text-xs font-semibold ${f.isAbnormal ? 'text-amber-700' : 'text-slate-500'}`}>
                        {f.name}
                      </span>
                      <span className={`text-right text-xs leading-relaxed ${f.isAbnormal ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                        {f.val}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* 피부 사진 */}
              {hasSkinImages && (
                <div className="grid grid-cols-3 gap-1.5 border-t border-slate-100 bg-white p-3 sm:grid-cols-4">
                  {skinImages.map((img) => (
                    <CheckupImgCard key={img.img_url} img={img} checkupId={checkupId ?? ''} isShared={isShared} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
