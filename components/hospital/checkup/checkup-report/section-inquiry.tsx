import type React from 'react'
import {
  AlertCircle, FileText, Pill, Heart, Utensils, Droplets,
  Home, TreePine, ArrowUpDown, Candy, AlertTriangle,
  Trash2, MapPin, Syringe, Bug, Microscope, CalendarCheck,
  Activity, Dna, ShieldCheck, Eye, Leaf, Stethoscope,
  Zap, Search, Salad, Smile, TrendingUp, TrendingDown,
  BookOpen, CheckCircle2,
} from 'lucide-react'
import { SectionTitle } from './report-ui'
import type { InquiryData } from './report-types'

// ── 컨디션 설정 ──────────────────────────────────────────────────
const CONDITION_CONFIG: Record<string, {
  label: string
  Icon: React.ElementType
  card: string
  icon: string
  text: string
}> = {
  good:      { label: '양호', Icon: Smile,       card: 'border-emerald-200 bg-emerald-50', icon: 'text-emerald-500', text: 'text-emerald-700' },
  fair:      { label: '보통', Icon: Activity,    card: 'border-amber-200 bg-amber-50',     icon: 'text-amber-500',   text: 'text-amber-700'   },
  poor:      { label: '저하', Icon: AlertCircle, card: 'border-red-200 bg-red-50',         icon: 'text-red-500',     text: 'text-red-700'     },
  normal:    { label: '정상', Icon: Smile,       card: 'border-emerald-200 bg-emerald-50', icon: 'text-emerald-500', text: 'text-emerald-700' },
  increased: { label: '증가', Icon: TrendingUp,  card: 'border-blue-200 bg-blue-50',       icon: 'text-blue-500',    text: 'text-blue-700'    },
  decreased: { label: '감소', Icon: TrendingDown,card: 'border-red-200 bg-red-50',         icon: 'text-red-500',     text: 'text-red-700'     },
}

const LIVING_TYPE_CONFIG: Record<string, {
  label: string
  Icon: React.ElementType
  style: string
}> = {
  indoor:  { label: '실내', Icon: Home,        style: 'border-sky-200 bg-sky-50 text-sky-700'     },
  outdoor: { label: '실외', Icon: TreePine,    style: 'border-green-200 bg-green-50 text-green-700' },
  mixed:   { label: '실내+실외', Icon: ArrowUpDown, style: 'border-teal-200 bg-teal-50 text-teal-700'  },
}

// ── 컨디션 뱃지 카드 ─────────────────────────────────────────────
function ConditionBadge({ label, value }: { label: string; value: string }) {
  const cfg = CONDITION_CONFIG[value]
  if (!cfg) return null
  const { Icon } = cfg
  return (
    <div className={`flex flex-col items-center gap-2 rounded-md border px-3 py-4 ${cfg.card}`}>
      <Icon size={22} className={cfg.icon} strokeWidth={1.5} />
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-sm font-bold ${cfg.text}`}>{cfg.label}</p>
    </div>
  )
}

// ── 필드 행 ───────────────────────────────────────────────────────
function InquiryField({
  Icon, label, value,
}: {
  Icon: React.ElementType
  label: string
  value?: string
}) {
  if (!value?.trim()) return null
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 shrink-0 rounded-md bg-slate-100 p-1.5">
        <Icon size={14} className="text-slate-500" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="mb-0.5 text-xs font-semibold text-slate-400">{label}</p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{value}</p>
      </div>
    </div>
  )
}

// ── 섹션 카드 래퍼 ────────────────────────────────────────────────
function SectionCard({
  Icon, title, gradient, iconBg, children,
}: {
  Icon: React.ElementType
  title: string
  gradient: string
  iconBg: string
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-slate-200 shadow-sm">
      <div className={`flex items-center gap-3 px-5 py-4 ${gradient}`}>
        <div className={`flex h-9 w-9 items-center justify-center rounded-md ${iconBg}`}>
          <Icon size={18} className="text-white" strokeWidth={1.75} />
        </div>
        <p className="text-base font-bold text-white">{title}</p>
      </div>
      <div className="p-3 sm:p-5">{children}</div>
    </div>
  )
}

// ── AI 리스크 서브제목 ─────────────────────────────────────────────
function AiSubHeading({
  Icon, label, color,
}: {
  Icon: React.ElementType
  label: string
  color: string
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className={`flex h-7 w-7 items-center justify-center rounded-[10px] ${color}`}>
        <Icon size={14} className="text-white" strokeWidth={2} />
      </div>
      <p className="text-sm font-bold text-slate-700">{label}</p>
    </div>
  )
}

// ── AI 리스크 카드 ────────────────────────────────────────────────
function AiCard({
  Icon, label, value, border, bg, iconColor, labelColor,
}: {
  Icon: React.ElementType
  label: string
  value: string
  border: string
  bg: string
  iconColor: string
  labelColor: string
}) {
  return (
    <div className={`rounded-md border p-4 ${border} ${bg}`}>
      <div className="mb-2.5 flex items-center gap-2">
        <Icon size={14} className={iconColor} strokeWidth={2} />
        <p className={`text-xs font-bold ${labelColor}`}>{label}</p>
      </div>
      <p className="text-sm leading-relaxed text-slate-700">{value}</p>
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────
export function InquirySection({ data }: { data: InquiryData }) {
  const hasChief = !!(data.chief_complaint || data.past_history || data.current_diseases)
  const hasCondition = !!(
    data.condition_vitality || data.condition_appetite || data.condition_water ||
    data.condition_urination || data.condition_defecation || data.condition_notes
  )
  const hasLiving = !!(
    data.living_type || data.diet_main || data.diet_treats ||
    data.diet_allergies || data.toilet_env || data.living_other
  )
  const hasPrevention = !!(
    data.vaccination || data.heartworm || data.internal_parasite ||
    data.external_parasite || data.prev_checkup
  )
  const hasAiRisk = !!(data.ai_breed_risk || data.ai_age_risk || data.ai_management)

  if (!hasChief && !hasCondition && !hasLiving && !hasPrevention && !hasAiRisk) return null

  return (
    <section className="mb-10">
      <SectionTitle>문진</SectionTitle>

      <div className="flex flex-col gap-1 sm:gap-5">

        {/* ── 주호소 및 병력 ── */}
        {hasChief && (
          <SectionCard
            Icon={FileText}
            title="주호소 및 병력"
            gradient="bg-gradient-to-r from-rose-500 to-pink-500"
            iconBg="bg-white/20"
          >
            <div className="flex flex-col gap-2 sm:gap-4">
              {data.chief_complaint && (
                <div className="rounded-md border-2 border-rose-200 bg-rose-50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <AlertCircle size={15} className="text-rose-500" strokeWidth={2} />
                    <p className="text-xs font-bold text-rose-600">현재 증상 / 주요 호소</p>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{data.chief_complaint}</p>
                </div>
              )}
              {(data.past_history || data.current_diseases) && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <InquiryField Icon={BookOpen}   label="과거 병력"           value={data.past_history}     />
                  <InquiryField Icon={Pill}        label="현재 관리 중인 질환" value={data.current_diseases} />
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* ── 최근 컨디션 ── */}
        {hasCondition && (
          <SectionCard
            Icon={Heart}
            title="최근 컨디션"
            gradient="bg-gradient-to-r from-amber-500 to-orange-500"
            iconBg="bg-white/20"
          >
            {(data.condition_vitality || data.condition_appetite || data.condition_water) && (
              <div className="mb-2 grid grid-cols-3 gap-2 sm:mb-5 sm:gap-3">
                {data.condition_vitality && <ConditionBadge label="활력"   value={data.condition_vitality} />}
                {data.condition_appetite && <ConditionBadge label="식욕"   value={data.condition_appetite} />}
                {data.condition_water    && <ConditionBadge label="음수량" value={data.condition_water}    />}
              </div>
            )}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <InquiryField Icon={Droplets}  label="배뇨 상태"        value={data.condition_urination}  />
              <InquiryField Icon={Leaf}      label="배변 상태"        value={data.condition_defecation} />
              {data.condition_notes && (
                <div className="sm:col-span-2">
                  <InquiryField Icon={FileText} label="기타 증상 / 메모" value={data.condition_notes} />
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* ── 생활환경 + 예방의학 ── */}
        {(hasLiving || hasPrevention) && (
          <div className="grid grid-cols-1 gap-1 sm:gap-5 sm:grid-cols-2">
            {hasLiving && (
              <SectionCard
                Icon={Home}
                title="생활환경"
                gradient="bg-gradient-to-r from-teal-500 to-cyan-500"
                iconBg="bg-white/20"
              >
                <div className="flex flex-col gap-2 sm:gap-4">
                  {data.living_type && (() => {
                    const cfg = LIVING_TYPE_CONFIG[data.living_type]
                    if (!cfg) return <InquiryField Icon={MapPin} label="생활 공간" value={data.living_type} />
                    const { Icon: LIcon } = cfg
                    return (
                      <div>
                        <p className="mb-2 text-xs font-semibold text-slate-400">생활 공간</p>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${cfg.style}`}>
                          <LIcon size={13} strokeWidth={2} />
                          {cfg.label}
                        </span>
                      </div>
                    )
                  })()}
                  <InquiryField Icon={Utensils}      label="주사료"              value={data.diet_main}      />
                  <InquiryField Icon={Candy}         label="부식 / 간식"         value={data.diet_treats}    />
                  <InquiryField Icon={AlertTriangle} label="알러지 / 금기 음식"  value={data.diet_allergies} />
                  <InquiryField Icon={Trash2}        label="화장실 환경"         value={data.toilet_env}     />
                  <InquiryField Icon={MapPin}        label="기타 생활환경"       value={data.living_other}   />
                </div>
              </SectionCard>
            )}
            {hasPrevention && (
              <SectionCard
                Icon={ShieldCheck}
                title="예방의학 이력"
                gradient="bg-gradient-to-r from-indigo-500 to-violet-500"
                iconBg="bg-white/20"
              >
                <div className="flex flex-col gap-2 sm:gap-4">
                  <InquiryField Icon={Syringe}      label="예방 접종"                  value={data.vaccination}        />
                  <InquiryField Icon={Bug}           label="사상충 예방"                value={data.heartworm}          />
                  <InquiryField Icon={Microscope}    label="내부 구충"                  value={data.internal_parasite}  />
                  <InquiryField Icon={Search}        label="외부 구충"                  value={data.external_parasite}  />
                  <InquiryField Icon={CalendarCheck} label="과거 건강검진 / 스켈링 이력" value={data.prev_checkup}       />
                </div>
              </SectionCard>
            )}
          </div>
        )}

        {/* ── AI 리스크 분석 ── */}
        {hasAiRisk && (
          <div className="overflow-hidden rounded-[10px] border border-violet-200 shadow-sm">

            {/* 헤더 */}
            <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/20">
                  <Dna size={20} className="text-white" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-lg font-bold text-white">품종 · 나이별 건강 리스크 분석</p>
                  <p className="mt-0.5 text-xs text-violet-200">품종 · 나이 · 성별 맞춤 건강 위험 평가</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 bg-gradient-to-b from-violet-50/50 to-white p-3 sm:gap-5 sm:p-5">

              {/* 품종별 특이점 */}
              {data.ai_breed_risk && (
                <div>
                  <AiSubHeading Icon={Activity} label="품종별 특이점" color="bg-purple-500" />
                  {typeof data.ai_breed_risk === 'object' ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {data.ai_breed_risk.predispositions && (
                        <AiCard
                          Icon={AlertCircle} label="호발 질환"
                          value={data.ai_breed_risk.predispositions}
                          border="border-rose-200" bg="bg-rose-50"
                          iconColor="text-rose-500" labelColor="text-rose-600"
                        />
                      )}
                      {data.ai_breed_risk.anatomy && (
                        <AiCard
                          Icon={Zap} label="신체적 특이점"
                          value={data.ai_breed_risk.anatomy}
                          border="border-sky-200" bg="bg-sky-50"
                          iconColor="text-sky-500" labelColor="text-sky-600"
                        />
                      )}
                      {data.ai_breed_risk.genetic && (
                        <AiCard
                          Icon={Dna} label="유전적 소인"
                          value={data.ai_breed_risk.genetic}
                          border="border-violet-200" bg="bg-violet-50"
                          iconColor="text-violet-500" labelColor="text-violet-600"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="rounded-md border border-purple-100 bg-purple-50 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{data.ai_breed_risk}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 연령별 건강 리스크 */}
              {data.ai_age_risk && (
                <div>
                  <AiSubHeading Icon={CalendarCheck} label="연령별 건강 리스크" color="bg-amber-500" />
                  {typeof data.ai_age_risk === 'object' ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {data.ai_age_risk.stage && (
                        <AiCard
                          Icon={Leaf} label="현재 생애 단계"
                          value={data.ai_age_risk.stage}
                          border="border-amber-200" bg="bg-amber-50"
                          iconColor="text-amber-500" labelColor="text-amber-600"
                        />
                      )}
                      {data.ai_age_risk.watch_items && (
                        <AiCard
                          Icon={Eye} label="주요 모니터링 항목"
                          value={data.ai_age_risk.watch_items}
                          border="border-orange-200" bg="bg-orange-50"
                          iconColor="text-orange-500" labelColor="text-orange-600"
                        />
                      )}
                      {data.ai_age_risk.preventive && (
                        <AiCard
                          Icon={ShieldCheck} label="예방 포인트"
                          value={data.ai_age_risk.preventive}
                          border="border-lime-200" bg="bg-lime-50"
                          iconColor="text-lime-600" labelColor="text-lime-700"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="rounded-md border border-amber-100 bg-amber-50 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{data.ai_age_risk}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 권장 관리 포인트 */}
              {data.ai_management && (
                <div>
                  <AiSubHeading Icon={CheckCircle2} label="권장 관리 포인트" color="bg-emerald-500" />
                  {typeof data.ai_management === 'object' ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {data.ai_management.diet && (
                        <AiCard
                          Icon={Salad} label="식이 관리"
                          value={data.ai_management.diet}
                          border="border-teal-200" bg="bg-teal-50"
                          iconColor="text-teal-500" labelColor="text-teal-600"
                        />
                      )}
                      {data.ai_management.oral && (
                        <AiCard
                          Icon={Stethoscope} label="구강 관리"
                          value={data.ai_management.oral}
                          border="border-cyan-200" bg="bg-cyan-50"
                          iconColor="text-cyan-500" labelColor="text-cyan-600"
                        />
                      )}
                      {data.ai_management.checkup && (
                        <AiCard
                          Icon={CalendarCheck} label="정기검진"
                          value={data.ai_management.checkup}
                          border="border-indigo-200" bg="bg-indigo-50"
                          iconColor="text-indigo-500" labelColor="text-indigo-600"
                        />
                      )}
                      {data.ai_management.environment && (
                        <AiCard
                          Icon={Home} label="환경·생활 관리"
                          value={data.ai_management.environment}
                          border="border-green-200" bg="bg-green-50"
                          iconColor="text-green-500" labelColor="text-green-600"
                        />
                      )}
                      {data.ai_management.warning_signs && (
                        <div className="col-span-2 rounded-md border-2 border-red-200 bg-red-50 p-4 sm:col-span-3">
                          <div className="mb-2 flex items-center gap-2">
                            <AlertCircle size={15} className="text-red-500" strokeWidth={2} />
                            <p className="text-sm font-bold text-red-600">즉시 내원이 필요한 이상 증상</p>
                          </div>
                          <p className="text-sm leading-relaxed text-slate-700">{data.ai_management.warning_signs}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-md border border-emerald-100 bg-emerald-50 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{data.ai_management}</p>
                    </div>
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
