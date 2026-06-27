'use client'

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, Home, Activity, ClipboardList, Brain } from 'lucide-react'
import { toast } from 'sonner'
import { upsertCheckupSection } from '@/lib/actions/checkup/checkup-actions'
import { analyzePatientRisk, type BreedRisk, type AgeRisk, type Management } from '@/lib/actions/checkup/inquiry-risk-analysis'
import type { CheckupSection, CheckupPatient } from '@/types/hospital/checkup-type'
import type { ExtractedInquiry } from '@/lib/actions/checkup/pdf-extraction'
import { SectionBlock, SubSection, FieldLabel } from './tab-ui'

// ── 타입 ─────────────────────────────────────────────────────

type LivingType = 'indoor' | 'outdoor' | 'mixed' | ''
type CondLevel = 'good' | 'fair' | 'poor' | ''
type CondAppetite = 'normal' | 'increased' | 'decreased' | ''
type CondWater = 'normal' | 'increased' | 'decreased' | ''

type InquiryData = {
  // 섹션 1: 생활환경
  living_type: LivingType
  toilet_env: string
  diet_main: string
  diet_treats: string
  diet_allergies: string
  living_other: string

  // 섹션 2: 최근 컨디션
  condition_vitality: CondLevel
  condition_appetite: CondAppetite
  condition_water: CondWater
  condition_urination: string
  condition_defecation: string
  condition_notes: string

  // 섹션 3: 주호소 / 병력
  chief_complaint: string
  past_history: string
  current_diseases: string
  vaccination: string
  heartworm: string
  internal_parasite: string
  external_parasite: string
  prev_checkup: string

  // 섹션 4: AI 리스크 분석 (구조화 JSON 저장)
  ai_breed_risk: BreedRisk
  ai_age_risk: AgeRisk
  ai_management: Management
}

// ── 초기값 ────────────────────────────────────────────────────

function initData(
  section: CheckupSection | undefined,
  extracted: ExtractedInquiry | null,
): InquiryData {
  const raw = (section?.data ?? {}) as Partial<InquiryData> & Record<string, unknown>

  // PDF 추출 결과 (기존 flat 필드 -> 새 구조로 매핑)
  const ex = extracted

  return {
    living_type: (raw.living_type as LivingType) ?? '',
    toilet_env: (raw.toilet_env as string) ?? '',
    diet_main: (raw.diet_main as string) ?? ex?.diet ?? '',
    diet_treats: (raw.diet_treats as string) ?? '',
    diet_allergies: (raw.diet_allergies as string) ?? '',
    living_other: (raw.living_other as string) ?? ex?.living_env ?? '',

    condition_vitality: (raw.condition_vitality as CondLevel) ?? '',
    condition_appetite: (raw.condition_appetite as CondAppetite) ?? '',
    condition_water: (raw.condition_water as CondWater) ?? '',
    condition_urination: (raw.condition_urination as string) ?? '',
    condition_defecation: (raw.condition_defecation as string) ?? '',
    condition_notes: (raw.condition_notes as string) ?? '',

    chief_complaint: (raw.chief_complaint as string) ?? ex?.chief_complaint ?? '',
    past_history: (raw.past_history as string) ?? ex?.history ?? '',
    current_diseases: (raw.current_diseases as string) ?? '',
    vaccination: (raw.vaccination as string) ?? '',
    heartworm: (raw.heartworm as string) ?? '',
    internal_parasite: (raw.internal_parasite as string) ?? '',
    external_parasite: (raw.external_parasite as string) ?? '',
    prev_checkup: (raw.prev_checkup as string) ?? '',

    // 구버전(string) 하위 호환: 문자열이면 첫 번째 서브필드에 통합
    ai_breed_risk: typeof raw.ai_breed_risk === 'object' && raw.ai_breed_risk !== null
      ? raw.ai_breed_risk as BreedRisk
      : { predispositions: String(raw.ai_breed_risk ?? ''), anatomy: '', genetic: '' },
    ai_age_risk: typeof raw.ai_age_risk === 'object' && raw.ai_age_risk !== null
      ? raw.ai_age_risk as AgeRisk
      : { stage: String(raw.ai_age_risk ?? ''), watch_items: '', preventive: '' },
    ai_management: typeof raw.ai_management === 'object' && raw.ai_management !== null
      ? raw.ai_management as Management
      : { diet: '', oral: '', checkup: '', environment: '', warning_signs: String(raw.ai_management ?? '') },
  }
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────

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
    <div className="flex gap-1">
      {options.map((opt) => {
        const active = value === opt.value
        const color = opt.color ?? 'teal'
        const activeClass =
          color === 'red'
            ? 'bg-red-100 text-red-700 border-red-300'
            : color === 'amber'
              ? 'bg-amber-100 text-amber-700 border-amber-300'
              : color === 'blue'
                ? 'bg-blue-100 text-blue-700 border-blue-300'
                : 'bg-teal-100 text-teal-700 border-teal-300'
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(active ? ('' as T) : opt.value)}
            className={`rounded-full border px-3 py-0.5 text-xs font-medium transition-all ${
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

// ── 메인 컴포넌트 ─────────────────────────────────────────────

export interface Tab1Ref {
  save: () => Promise<void>
}

interface Props {
  checkupId: string
  patient: CheckupPatient
  section: CheckupSection | undefined
  extractedInquiry: ExtractedInquiry | null
  onDirty?: () => void
}

const Tab1Inquiry = forwardRef<Tab1Ref, Props>(function Tab1Inquiry({ checkupId, patient, section, extractedInquiry, onDirty }, ref) {
  const [form, setForm] = useState<InquiryData>(() => initData(section, extractedInquiry))
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    if (!extractedInquiry) return
    setForm((prev) => initData(section, extractedInquiry))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extractedInquiry])

  const set = <K extends keyof InquiryData>(key: K, value: InquiryData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    onDirty?.()
  }

  const handleSave = async () => {
    try {
      await upsertCheckupSection({ checkupId, sectionType: 'inquiry', data: form })
    } catch {
      toast.error('저장에 실패했습니다.')
    }
  }

  useImperativeHandle(ref, () => ({ save: handleSave }))

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true)
      const result = await analyzePatientRisk({
        species: patient.species,
        breed: patient.breed,
        birth: patient.birth,
        gender: patient.gender,
      })
      setForm((prev) => ({
        ...prev,
        ai_breed_risk: result.breed_risk,
        ai_age_risk: result.age_risk,
        ai_management: result.management,
      }))

      const messages: Record<typeof result.source, string> = {
        cache_full:  '품종·연령 DB 데이터를 적용했습니다.',
        cache_breed: '품종 DB 적용 + 연령 AI 분석 완료.',
        ai_full:     'AI 분석 완료. 내용을 확인 후 저장하세요.',
      }
      toast.success(messages[result.source])
    } catch {
      toast.error('AI 분석에 실패했습니다.')
    } finally {
      setAnalyzing(false)
    }
  }

  const isCat = /^(cat|feline)$/i.test(patient.species)

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-4">

      {/* ── 섹션 1: 생활환경 ──────────────────────── */}
      <SectionBlock icon={Home} title="생활환경" color="teal">
        <SubSection title="생활 공간" color="teal">
          <ToggleGroup<LivingType>
            value={form.living_type}
            onChange={(v) => set('living_type', v)}
            options={[
              { value: 'indoor', label: '실내', color: 'teal' },
              { value: 'outdoor', label: '실외', color: 'amber' },
              { value: 'mixed', label: '복합', color: 'blue' },
            ]}
          />
        </SubSection>

        <SubSection title="화장실 환경" color="teal">
          <Textarea
            value={form.toilet_env}
            onChange={(e) => set('toilet_env', e.target.value)}
            placeholder={isCat ? '예) 두부 모래 / 화장실 2개 / 하루 2회 청소' : '예) 배변 패드 사용 / 야외 배뇨 2회/일 / 사람 화장실 이용'}
            className="min-h-[56px] resize-none text-xs"
          />
        </SubSection>

        <SubSection title="식이" color="teal">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <FieldLabel>주사료</FieldLabel>
              <Textarea value={form.diet_main} onChange={(e) => set('diet_main', e.target.value)} placeholder="예) 로얄캐닌 어덜트 드라이 150g/일" className="min-h-[72px] resize-none text-xs" />
            </div>
            <div>
              <FieldLabel sub="(습식·간식·토핑 등)">부식 / 간식</FieldLabel>
              <Textarea value={form.diet_treats} onChange={(e) => set('diet_treats', e.target.value)} placeholder="예) 습식캔 1/2개/일, 동결건조 간식 소량" className="min-h-[72px] resize-none text-xs" />
            </div>
            <div>
              <FieldLabel sub="(알러지 유발 병력, 제한 음식)">알러지 / 금기 음식</FieldLabel>
              <Textarea value={form.diet_allergies} onChange={(e) => set('diet_allergies', e.target.value)} placeholder="예) 닭고기 급여 후 피부 소양감 병력" className="min-h-[72px] resize-none text-xs" />
            </div>
          </div>
        </SubSection>

        <SubSection title="기타 생활환경" color="teal">
          <Textarea value={form.living_other} onChange={(e) => set('living_other', e.target.value)} placeholder="예) 동거묘 2마리, 산책 30분/일, 최근 이사 후 스트레스" className="min-h-[56px] resize-none text-xs" />
        </SubSection>
      </SectionBlock>

      {/* ── 섹션 2: 최근 컨디션 ───────────────────── */}
      <SectionBlock icon={Activity} title="최근 컨디션" color="blue">
        <SubSection title="활력 · 식욕 · 음수" color="blue">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <FieldLabel>활력</FieldLabel>
              <ToggleGroup<CondLevel> value={form.condition_vitality} onChange={(v) => set('condition_vitality', v)} options={[{ value: 'good', label: '양호', color: 'teal' }, { value: 'fair', label: '보통', color: 'amber' }, { value: 'poor', label: '저하', color: 'red' }]} />
            </div>
            <div>
              <FieldLabel>식욕</FieldLabel>
              <ToggleGroup<CondAppetite> value={form.condition_appetite} onChange={(v) => set('condition_appetite', v)} options={[{ value: 'normal', label: '정상', color: 'teal' }, { value: 'increased', label: '증가', color: 'blue' }, { value: 'decreased', label: '감소', color: 'red' }]} />
            </div>
            <div>
              <FieldLabel>음수량</FieldLabel>
              <ToggleGroup<CondWater> value={form.condition_water} onChange={(v) => set('condition_water', v)} options={[{ value: 'normal', label: '정상', color: 'teal' }, { value: 'increased', label: '증가', color: 'blue' }, { value: 'decreased', label: '감소', color: 'red' }]} />
            </div>
          </div>
        </SubSection>

        <SubSection title="배뇨 · 배변 상태" color="blue">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel sub="(횟수, 색, 이상 소견 등)">배뇨 상태</FieldLabel>
              <Textarea value={form.condition_urination} onChange={(e) => set('condition_urination', e.target.value)} placeholder="예) 하루 3~4회, 색 정상, 배뇨통 없음" className="min-h-[64px] resize-none text-xs" />
            </div>
            <div>
              <FieldLabel sub="(횟수, 성상, 이상 소견 등)">배변 상태</FieldLabel>
              <Textarea value={form.condition_defecation} onChange={(e) => set('condition_defecation', e.target.value)} placeholder="예) 하루 1회, 성상 정상, 최근 무른변 경향" className="min-h-[64px] resize-none text-xs" />
            </div>
          </div>
        </SubSection>

        <SubSection title="기타 증상 / 메모" color="blue">
          <Textarea value={form.condition_notes} onChange={(e) => set('condition_notes', e.target.value)} placeholder="예) 2주 전부터 간헐적 기침, 수면 중 코골이" className="min-h-[56px] resize-none text-xs" />
        </SubSection>
      </SectionBlock>

      {/* ── 섹션 3: 주호소 / 병력 ─────────────────── */}
      <SectionBlock icon={ClipboardList} title="주호소 및 병력" color="amber">
        <SubSection title="현재 주호소" color="amber">
          <Textarea value={form.chief_complaint} onChange={(e) => set('chief_complaint', e.target.value)} placeholder="예) 최근 1개월간 체중 감소, 물을 많이 마심, 잦은 배뇨" className="min-h-[72px] resize-none text-xs" />
        </SubSection>

        <SubSection title="과거 병력" color="amber">
          <Textarea value={form.past_history} onChange={(e) => set('past_history', e.target.value)} placeholder="예) 2022년 슬개골 탈구 수술 / 2023년 알러지 피부염 진단 및 치료" className="min-h-[72px] resize-none text-xs" />
        </SubSection>

        <SubSection title="현재 관리 중인 질환" color="amber">
          <Textarea value={form.current_diseases} onChange={(e) => set('current_diseases', e.target.value)} placeholder="예) 갑상선 기능저하증 — 신지로이드 0.3mg 1회/일 투여 중" className="min-h-[64px] resize-none text-xs" />
        </SubSection>

        <SubSection title="예방의학 이력" color="amber">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <FieldLabel>예방 접종</FieldLabel>
              <Textarea value={form.vaccination} onChange={(e) => set('vaccination', e.target.value)} placeholder="예) 종합백신 2024.03 / 광견병 2024.03" className="min-h-[72px] resize-none text-xs" />
            </div>
            <div>
              <FieldLabel>사상충 예방</FieldLabel>
              <Textarea value={form.heartworm} onChange={(e) => set('heartworm', e.target.value)} placeholder="예) 매월 하트가드 투약 중" className="min-h-[72px] resize-none text-xs" />
            </div>
            <div>
              <FieldLabel>내부 구충</FieldLabel>
              <Textarea value={form.internal_parasite} onChange={(e) => set('internal_parasite', e.target.value)} placeholder="예) 3개월마다 드론탈 투약" className="min-h-[72px] resize-none text-xs" />
            </div>
            <div>
              <FieldLabel>외부 구충</FieldLabel>
              <Textarea value={form.external_parasite} onChange={(e) => set('external_parasite', e.target.value)} placeholder="예) 매월 브라벡토 투약 중" className="min-h-[72px] resize-none text-xs" />
            </div>
          </div>
        </SubSection>

        <SubSection title="과거 건강검진 / 스켈링 이력" color="amber">
          <Textarea value={form.prev_checkup} onChange={(e) => set('prev_checkup', e.target.value)} placeholder="예) 2023년 종합 건강검진 (이상 없음) / 2024.01 스켈링" className="min-h-[56px] resize-none text-xs" />
        </SubSection>
      </SectionBlock>

      {/* ── 섹션 4: 품종/나이/성별 건강 리스크 분석 ── */}
      <SectionBlock
        icon={Brain}
        title="품종 · 나이 · 성별 건강 리스크 분석"
        color="violet"
        action={
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleAnalyze}
            disabled={analyzing}
            className="h-7 gap-1.5 bg-white/20 px-3 text-xs text-white hover:bg-white/30"
          >
            {analyzing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {analyzing ? 'AI 분석 중...' : 'AI 분석'}
          </Button>
        }
      >
        <p className="mb-4 text-[11px] text-slate-400">AI가 생성한 내용을 직접 수정할 수 있습니다.</p>

        <SubSection title="품종별 특이점" color="violet">
          <div className="flex flex-col gap-2">
            <div>
              <FieldLabel>호발 질환</FieldLabel>
              <Textarea value={form.ai_breed_risk.predispositions} onChange={(e) => set('ai_breed_risk', { ...form.ai_breed_risk, predispositions: e.target.value })} placeholder="해당 품종에서 자주 발생하는 질환" className="min-h-[60px] resize-none text-xs" />
            </div>
            <div>
              <FieldLabel>해부학적·신체적 특이점</FieldLabel>
              <Textarea value={form.ai_breed_risk.anatomy} onChange={(e) => set('ai_breed_risk', { ...form.ai_breed_risk, anatomy: e.target.value })} placeholder="체형, 피부, 관절 등 신체 특성" className="min-h-[60px] resize-none text-xs" />
            </div>
            <div>
              <FieldLabel>유전적 소인</FieldLabel>
              <Textarea value={form.ai_breed_risk.genetic} onChange={(e) => set('ai_breed_risk', { ...form.ai_breed_risk, genetic: e.target.value })} placeholder="유전성 질환 또는 유전적 위험 요소" className="min-h-[60px] resize-none text-xs" />
            </div>
          </div>
        </SubSection>

        <SubSection title="연령별 건강 리스크" color="violet">
          <div className="flex flex-col gap-2">
            <div>
              <FieldLabel>현재 생애 단계</FieldLabel>
              <Textarea value={form.ai_age_risk.stage} onChange={(e) => set('ai_age_risk', { ...form.ai_age_risk, stage: e.target.value })} placeholder="이 나이대의 특징 및 건강 변화" className="min-h-[60px] resize-none text-xs" />
            </div>
            <div>
              <FieldLabel>주요 모니터링 항목</FieldLabel>
              <Textarea value={form.ai_age_risk.watch_items} onChange={(e) => set('ai_age_risk', { ...form.ai_age_risk, watch_items: e.target.value })} placeholder="이 나이에 특히 확인해야 할 건강 항목" className="min-h-[60px] resize-none text-xs" />
            </div>
            <div>
              <FieldLabel>예방 포인트</FieldLabel>
              <Textarea value={form.ai_age_risk.preventive} onChange={(e) => set('ai_age_risk', { ...form.ai_age_risk, preventive: e.target.value })} placeholder="권장 예방 검사 및 관리" className="min-h-[56px] resize-none text-xs" />
            </div>
          </div>
        </SubSection>

        <SubSection title="권장 관리 포인트" color="violet">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <FieldLabel>식이 관리</FieldLabel>
              <Textarea value={form.ai_management.diet} onChange={(e) => set('ai_management', { ...form.ai_management, diet: e.target.value })} placeholder="나이·품종 맞춤 식이 권장사항" className="min-h-[72px] resize-none text-xs" />
            </div>
            <div>
              <FieldLabel>구강 관리</FieldLabel>
              <Textarea value={form.ai_management.oral} onChange={(e) => set('ai_management', { ...form.ai_management, oral: e.target.value })} placeholder="양치질, 스켈링 주기 등" className="min-h-[72px] resize-none text-xs" />
            </div>
            <div>
              <FieldLabel>정기검진</FieldLabel>
              <Textarea value={form.ai_management.checkup} onChange={(e) => set('ai_management', { ...form.ai_management, checkup: e.target.value })} placeholder="권장 검진 주기 및 중점 항목" className="min-h-[72px] resize-none text-xs" />
            </div>
            <div>
              <FieldLabel>환경·생활 관리</FieldLabel>
              <Textarea value={form.ai_management.environment} onChange={(e) => set('ai_management', { ...form.ai_management, environment: e.target.value })} placeholder="운동, 환경 정비 등" className="min-h-[72px] resize-none text-xs" />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>즉시 내원이 필요한 이상 증상</FieldLabel>
              <Textarea value={form.ai_management.warning_signs} onChange={(e) => set('ai_management', { ...form.ai_management, warning_signs: e.target.value })} placeholder="보호자가 반드시 인지해야 할 위험 증상" className="min-h-[60px] resize-none text-xs" />
            </div>
          </div>
        </SubSection>
      </SectionBlock>

        </div>
      </div>
    </div>
  )
})

export default Tab1Inquiry

