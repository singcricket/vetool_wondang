'use client'

import { useState, useTransition } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Home, Activity, ClipboardList, Loader2, PawPrint } from 'lucide-react'
import { toast } from 'sonner'
import { saveGuardianInquiry, type GuardianPatientInfo, type GuardianInquiryData } from '@/lib/actions/checkup/inquiry-share-actions'

// ── ToggleGroup ───────────────────────────────────────────────

function ToggleGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string; color?: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.value
        const color = opt.color ?? 'teal'
        const activeClass =
          color === 'red' ? 'bg-red-100 text-red-700 border-red-300' :
          color === 'amber' ? 'bg-amber-100 text-amber-700 border-amber-300' :
          color === 'blue' ? 'bg-blue-100 text-blue-700 border-blue-300' :
          'bg-teal-100 text-teal-700 border-teal-300'
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(active ? ('' as T) : opt.value)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
              active ? activeClass : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ── FieldLabel ────────────────────────────────────────────────

function FieldLabel({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <p className="mb-1.5 text-sm font-semibold text-slate-700">
      {children}
      {sub && <span className="ml-1 font-normal text-slate-400 text-xs">{sub}</span>}
    </p>
  )
}

// ── SectionCard ───────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  color = 'teal',
  children,
}: {
  icon: React.ElementType
  title: string
  subtitle?: string
  color?: 'teal' | 'blue' | 'amber'
  children: React.ReactNode
}) {
  const gradients = {
    teal: 'from-teal-500 to-emerald-400',
    blue: 'from-blue-500 to-cyan-400',
    amber: 'from-amber-500 to-orange-400',
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div className={`flex items-center gap-2 bg-gradient-to-r ${gradients[color]} px-5 py-3.5`}>
        <Icon size={17} className="shrink-0 text-white/80" strokeWidth={2} />
        <div>
          <h3 className="text-sm font-bold text-white">{title}</h3>
          {subtitle && <p className="text-[11px] text-white/70">{subtitle}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-5 bg-white p-5">{children}</div>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────

interface Props {
  shareId: string
  checkupId: string
  patient: GuardianPatientInfo
  initialInquiry: Partial<GuardianInquiryData>
}

type FormData = GuardianInquiryData

const EMPTY: FormData = {
  living_type: '', toilet_env: '', diet_main: '', diet_treats: '', diet_allergies: '', living_other: '',
  condition_vitality: '', condition_appetite: '', condition_water: '',
  condition_urination: '', condition_defecation: '', condition_notes: '',
  chief_complaint: '', past_history: '', current_diseases: '',
  vaccination: '', heartworm: '', internal_parasite: '', external_parasite: '', prev_checkup: '',
}

export default function GuardianInquiryForm({ shareId, checkupId, patient, initialInquiry }: Props) {
  const [form, setForm] = useState<FormData>({ ...EMPTY, ...initialInquiry })
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const isCat = /^(cat|feline)$/i.test(patient.species)

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        await saveGuardianInquiry(shareId, checkupId, form)
        setSubmitted(true)
      } catch (e: any) {
        toast.error(e.message || '저장에 실패했습니다.')
      }
    })
  }

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-2xl border bg-white p-10 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
          <CheckCircle2 size={32} className="text-teal-600" />
        </div>
        <div>
          <p className="text-lg font-bold text-slate-800">문진 작성 완료!</p>
          <p className="mt-1 text-sm text-slate-500">
            {patient.patientName}의 문진이 성공적으로 전달되었습니다.
          </p>
          <p className="mt-1 text-xs text-slate-400">{patient.hosName}</p>
        </div>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-2 text-xs text-slate-400 underline hover:text-teal-600"
        >
          다시 수정하기
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 환자 정보 헤더 */}
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
          <PawPrint size={24} className="text-teal-500" />
        </div>
        <div>
          <p className="text-lg font-bold text-slate-800">{patient.patientName}</p>
          <p className="text-sm text-slate-500">{patient.species}{patient.breed ? ` · ${patient.breed}` : ''}</p>
          <p className="text-xs text-slate-400">{patient.hosName} · {patient.checkupDate} 건강검진 문진표</p>
        </div>
      </div>

      <p className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-700">
        아래 내용을 작성해주시면 담당 수의사가 더 꼼꼼하게 진료 준비를 할 수 있습니다.
        작성 후 <strong>제출하기</strong> 버튼을 눌러주세요.
      </p>

      {/* ── 섹션 1: 생활환경 ───────────────────────── */}
      <SectionCard icon={Home} title="생활환경" color="teal">
        <div>
          <FieldLabel>생활 공간</FieldLabel>
          <ToggleGroup<string>
            value={form.living_type}
            onChange={(v) => set('living_type', v)}
            options={[
              { value: 'indoor', label: '실내', color: 'teal' },
              { value: 'outdoor', label: '실외', color: 'amber' },
              { value: 'mixed', label: '복합', color: 'blue' },
            ]}
          />
        </div>

        <div>
          <FieldLabel>화장실 환경</FieldLabel>
          <Textarea
            value={form.toilet_env}
            onChange={(e) => set('toilet_env', e.target.value)}
            placeholder={isCat
              ? '예) 두부 모래 / 화장실 2개 / 하루 2회 청소'
              : '예) 배변 패드 사용 / 야외 배뇨 2회/일'}
            className="min-h-[72px] resize-none text-sm"
          />
        </div>

        <div>
          <FieldLabel>주사료</FieldLabel>
          <Textarea
            value={form.diet_main}
            onChange={(e) => set('diet_main', e.target.value)}
            placeholder="예) 로얄캐닌 어덜트 드라이 150g/일"
            className="min-h-[72px] resize-none text-sm"
          />
        </div>

        <div>
          <FieldLabel sub="(습식·간식·토핑 등)">부식 / 간식</FieldLabel>
          <Textarea
            value={form.diet_treats}
            onChange={(e) => set('diet_treats', e.target.value)}
            placeholder="예) 습식캔 1/2개/일, 동결건조 간식 소량"
            className="min-h-[72px] resize-none text-sm"
          />
        </div>

        <div>
          <FieldLabel sub="(알러지 유발 병력, 제한 음식)">알러지 / 금기 음식</FieldLabel>
          <Textarea
            value={form.diet_allergies}
            onChange={(e) => set('diet_allergies', e.target.value)}
            placeholder="예) 닭고기 급여 후 피부 소양감 병력"
            className="min-h-[72px] resize-none text-sm"
          />
        </div>

        <div>
          <FieldLabel>기타 생활환경</FieldLabel>
          <Textarea
            value={form.living_other}
            onChange={(e) => set('living_other', e.target.value)}
            placeholder="예) 동거묘 2마리, 산책 30분/일, 최근 이사 후 스트레스"
            className="min-h-[72px] resize-none text-sm"
          />
        </div>
      </SectionCard>

      {/* ── 섹션 2: 최근 컨디션 ──────────────────── */}
      <SectionCard icon={Activity} title="최근 컨디션" subtitle="최근 1~2주 기준으로 작성해주세요" color="blue">
        <div>
          <FieldLabel>활력</FieldLabel>
          <ToggleGroup<string>
            value={form.condition_vitality}
            onChange={(v) => set('condition_vitality', v)}
            options={[
              { value: 'good', label: '양호', color: 'teal' },
              { value: 'fair', label: '보통', color: 'amber' },
              { value: 'poor', label: '저하', color: 'red' },
            ]}
          />
        </div>

        <div>
          <FieldLabel>식욕</FieldLabel>
          <ToggleGroup<string>
            value={form.condition_appetite}
            onChange={(v) => set('condition_appetite', v)}
            options={[
              { value: 'normal', label: '정상', color: 'teal' },
              { value: 'increased', label: '증가', color: 'blue' },
              { value: 'decreased', label: '감소', color: 'red' },
            ]}
          />
        </div>

        <div>
          <FieldLabel>음수량</FieldLabel>
          <ToggleGroup<string>
            value={form.condition_water}
            onChange={(v) => set('condition_water', v)}
            options={[
              { value: 'normal', label: '정상', color: 'teal' },
              { value: 'increased', label: '증가', color: 'blue' },
              { value: 'decreased', label: '감소', color: 'red' },
            ]}
          />
        </div>

        <div>
          <FieldLabel sub="(횟수, 색, 이상 소견 등)">배뇨 상태</FieldLabel>
          <Textarea
            value={form.condition_urination}
            onChange={(e) => set('condition_urination', e.target.value)}
            placeholder="예) 하루 3~4회, 색 정상, 배뇨통 없음"
            className="min-h-[72px] resize-none text-sm"
          />
        </div>

        <div>
          <FieldLabel sub="(횟수, 성상, 이상 소견 등)">배변 상태</FieldLabel>
          <Textarea
            value={form.condition_defecation}
            onChange={(e) => set('condition_defecation', e.target.value)}
            placeholder="예) 하루 1회, 성상 정상, 최근 무른변 경향"
            className="min-h-[72px] resize-none text-sm"
          />
        </div>

        <div>
          <FieldLabel>기타 증상 / 메모</FieldLabel>
          <Textarea
            value={form.condition_notes}
            onChange={(e) => set('condition_notes', e.target.value)}
            placeholder="예) 2주 전부터 간헐적 기침, 수면 중 코골이"
            className="min-h-[72px] resize-none text-sm"
          />
        </div>
      </SectionCard>

      {/* ── 섹션 3: 주호소 / 병력 ────────────────── */}
      <SectionCard icon={ClipboardList} title="주호소 및 병력" color="amber">
        <div>
          <FieldLabel>현재 주호소</FieldLabel>
          <Textarea
            value={form.chief_complaint}
            onChange={(e) => set('chief_complaint', e.target.value)}
            placeholder="예) 최근 1개월간 체중 감소, 물을 많이 마심, 잦은 배뇨"
            className="min-h-[88px] resize-none text-sm"
          />
        </div>

        <div>
          <FieldLabel>과거 병력</FieldLabel>
          <Textarea
            value={form.past_history}
            onChange={(e) => set('past_history', e.target.value)}
            placeholder="예) 2022년 슬개골 탈구 수술 / 2023년 알러지 피부염 진단 및 치료"
            className="min-h-[88px] resize-none text-sm"
          />
        </div>

        <div>
          <FieldLabel>현재 관리 중인 질환</FieldLabel>
          <Textarea
            value={form.current_diseases}
            onChange={(e) => set('current_diseases', e.target.value)}
            placeholder="예) 갑상선 기능저하증 — 신지로이드 0.3mg 1회/일 투여 중"
            className="min-h-[72px] resize-none text-sm"
          />
        </div>

        <div>
          <FieldLabel>예방 접종</FieldLabel>
          <Textarea
            value={form.vaccination}
            onChange={(e) => set('vaccination', e.target.value)}
            placeholder="예) 종합백신 2024.03 / 광견병 2024.03"
            className="min-h-[72px] resize-none text-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <FieldLabel>사상충 예방</FieldLabel>
            <Textarea
              value={form.heartworm}
              onChange={(e) => set('heartworm', e.target.value)}
              placeholder="예) 매월 하트가드 투약 중"
              className="min-h-[72px] resize-none text-sm"
            />
          </div>
          <div>
            <FieldLabel>내부 구충</FieldLabel>
            <Textarea
              value={form.internal_parasite}
              onChange={(e) => set('internal_parasite', e.target.value)}
              placeholder="예) 3개월마다 드론탈"
              className="min-h-[72px] resize-none text-sm"
            />
          </div>
          <div>
            <FieldLabel>외부 구충</FieldLabel>
            <Textarea
              value={form.external_parasite}
              onChange={(e) => set('external_parasite', e.target.value)}
              placeholder="예) 매월 브라벡토"
              className="min-h-[72px] resize-none text-sm"
            />
          </div>
        </div>

        <div>
          <FieldLabel>과거 건강검진 / 스켈링 이력</FieldLabel>
          <Textarea
            value={form.prev_checkup}
            onChange={(e) => set('prev_checkup', e.target.value)}
            placeholder="예) 2023년 종합 건강검진 (이상 없음) / 2024.01 스켈링"
            className="min-h-[72px] resize-none text-sm"
          />
        </div>
      </SectionCard>

      {/* 제출 버튼 */}
      <Button
        onClick={handleSubmit}
        disabled={isPending}
        className="h-12 w-full rounded-xl bg-teal-600 text-base font-bold hover:bg-teal-700"
      >
        {isPending
          ? <><Loader2 size={18} className="mr-2 animate-spin" /> 저장 중...</>
          : '문진 제출하기'}
      </Button>

      <p className="pb-6 text-center text-xs text-slate-400">
        작성하신 내용은 담당 수의사에게만 전달됩니다.
      </p>
    </div>
  )
}
