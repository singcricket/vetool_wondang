'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { upsertCheckupSection } from '@/lib/actions/checkup/checkup-actions'
import { generatePlanSections } from '@/lib/actions/checkup/plan-analysis'
import type { CheckupSection, CheckupPatient, CheckupStatus } from '@/types/hospital/checkup-type'

// ── 타입 ─────────────────────────────────────────────────────

type PlanData = {
  // 1. 기관별 진단
  dx_musculoskeletal: string
  dx_cardio_resp: string
  dx_hepatobiliary: string
  dx_endocrine: string
  dx_urogenital: string
  dx_oral: string
  dx_ophthalmic: string
  dx_neuro: string
  // 2. 치료 및 관리계획
  tx_surgery: string
  tx_medication: string
  tx_diet_plan: string
  tx_further_workup: string
  tx_monitoring: string
  tx_priority_summary: string
  // 3. 생활 관리 가이드
  guide_diet: string
  guide_weight: string
  guide_exercise: string
  guide_environment: string
  // 4. 추적 관찰 계획
  followup_plan: string
  // 5. 다음 건강검진일
  next_checkup_date: string
}

const EMPTY: PlanData = {
  dx_musculoskeletal: '', dx_cardio_resp: '', dx_hepatobiliary: '',
  dx_endocrine: '', dx_urogenital: '', dx_oral: '', dx_ophthalmic: '', dx_neuro: '',
  tx_surgery: '', tx_medication: '', tx_diet_plan: '', tx_further_workup: '',
  tx_monitoring: '', tx_priority_summary: '',
  guide_diet: '', guide_weight: '', guide_exercise: '', guide_environment: '',
  followup_plan: '', next_checkup_date: '',
}

// ── Props ─────────────────────────────────────────────────────

interface Props {
  checkupId: string
  patient: CheckupPatient
  planSection: CheckupSection | undefined
  status: CheckupStatus
  onStatusChange: (status: 'reviewing' | 'approved') => void
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3 border-b pb-1">
      <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
      {sub && <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p>}
    </div>
  )
}

function FieldBlock({
  label, sub, value, onChange, minH = 80,
}: {
  label: string
  sub?: string
  value: string
  onChange: (v: string) => void
  minH?: number
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-slate-600">
        {label}
        {sub && <span className="ml-1 font-normal text-slate-400">{sub}</span>}
      </p>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="resize-none text-xs"
        style={{ minHeight: minH }}
        placeholder="AI 분석 버튼을 눌러 자동으로 채우거나 직접 입력하세요."
      />
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────

export default function Tab5Plan({
  checkupId, patient, planSection, status, onStatusChange,
}: Props) {
  const saved = (planSection?.data ?? {}) as Partial<PlanData>
  const [form, setForm] = useState<PlanData>({ ...EMPTY, ...saved })
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const set = <K extends keyof PlanData>(key: K, value: PlanData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true)
      const result = await generatePlanSections({ checkupId, patient })
      setForm((prev) => ({ ...prev, ...result }))
      toast.success('AI 분석 완료. 내용을 확인 후 저장하세요.')
    } catch {
      toast.error('AI 분석에 실패했습니다.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await upsertCheckupSection({ checkupId, sectionType: 'plan', data: form })
      toast.success('저장되었습니다.')
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4">

      {/* AI 분석 버튼 영역 */}
      <div className="flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-teal-800">AI 종합 분석</p>
          <p className="mt-0.5 text-[11px] text-teal-600">
            탭 1~4 데이터를 종합하여 아래 모든 항목을 자동으로 채웁니다. 생성 후 직접 수정 가능합니다.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleAnalyze}
          disabled={analyzing}
          className="ml-4 shrink-0 gap-1.5 bg-teal-600 hover:bg-teal-700"
        >
          {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {analyzing ? 'AI 분석 중...' : 'AI 종합 분석'}
        </Button>
      </div>

      {/* ── 1. 기관별 진단 및 평가 ──────────────────── */}
      <section>
        <SectionHeader title="기관별 진단 및 평가" sub="계통별 요약 평가 소견" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldBlock label="근골격계" value={form.dx_musculoskeletal} onChange={(v) => set('dx_musculoskeletal', v)} />
          <FieldBlock label="심혈관 / 호흡기" value={form.dx_cardio_resp} onChange={(v) => set('dx_cardio_resp', v)} />
          <FieldBlock label="간담도계" value={form.dx_hepatobiliary} onChange={(v) => set('dx_hepatobiliary', v)} />
          <FieldBlock label="내분비계" value={form.dx_endocrine} onChange={(v) => set('dx_endocrine', v)} />
          <FieldBlock label="비뇨 / 생식기" value={form.dx_urogenital} onChange={(v) => set('dx_urogenital', v)} />
          <FieldBlock label="구강" value={form.dx_oral} onChange={(v) => set('dx_oral', v)} />
          <FieldBlock label="안과" value={form.dx_ophthalmic} onChange={(v) => set('dx_ophthalmic', v)} />
          <FieldBlock label="신경계" value={form.dx_neuro} onChange={(v) => set('dx_neuro', v)} />
        </div>
      </section>

      {/* ── 2. 치료 및 관리계획 ────────────────────── */}
      <section>
        <SectionHeader title="치료 및 관리계획" sub="즉각 치료 / 관리 / 모니터링 / 추가검사 항목 정리" />
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldBlock
              label="외과 수술 / 시술 계획"
              value={form.tx_surgery}
              onChange={(v) => set('tx_surgery', v)}
            />
            <FieldBlock
              label="내과 약물 / 주사 치료"
              value={form.tx_medication}
              onChange={(v) => set('tx_medication', v)}
            />
            <FieldBlock
              label="식이관리 계획"
              value={form.tx_diet_plan}
              onChange={(v) => set('tx_diet_plan', v)}
            />
            <FieldBlock
              label="추가 정밀검사"
              sub="(추가로 진행해야 할 검사)"
              value={form.tx_further_workup}
              onChange={(v) => set('tx_further_workup', v)}
            />
            <FieldBlock
              label="주기적 모니터링 항목"
              value={form.tx_monitoring}
              onChange={(v) => set('tx_monitoring', v)}
            />
          </div>
          <FieldBlock
            label="치료·관리 우선순위 요약"
            sub="(1순위: 즉각치료 → 2순위: 적극관리 → 3순위: 모니터링)"
            value={form.tx_priority_summary}
            onChange={(v) => set('tx_priority_summary', v)}
            minH={100}
          />
        </div>
      </section>

      {/* ── 3. 생활 관리 가이드 ────────────────────── */}
      <section>
        <SectionHeader title="생활 관리 가이드" sub="체중·BCS·질환 맞춤형 생활 권고사항" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldBlock
            label="식이관리"
            sub="(체중·BCS·현재 질환 맞춤형)"
            value={form.guide_diet}
            onChange={(v) => set('guide_diet', v)}
          />
          <FieldBlock
            label="체중관리"
            sub="(목표체중, 칼로리 제안)"
            value={form.guide_weight}
            onChange={(v) => set('guide_weight', v)}
          />
          <FieldBlock
            label="운동 및 활동 관리"
            sub="(권장 운동량, 종류)"
            value={form.guide_exercise}
            onChange={(v) => set('guide_exercise', v)}
          />
          <FieldBlock
            label="환경 및 기본관리"
            sub="(실내환경, 구강관리, 청결 등)"
            value={form.guide_environment}
            onChange={(v) => set('guide_environment', v)}
          />
        </div>
      </section>

      {/* ── 4. 추적 관찰 계획 ──────────────────────── */}
      <section>
        <SectionHeader title="추적 관찰 계획" sub="N개월 후: 검사 항목 형식으로 작성" />
        <FieldBlock
          label="추적 관찰 일정"
          value={form.followup_plan}
          onChange={(v) => set('followup_plan', v)}
          minH={100}
        />
      </section>

      {/* ── 5. 다음 건강검진일 ──────────────────────── */}
      <section>
        <SectionHeader title="다음 건강검진 예정일" />
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={form.next_checkup_date}
            onChange={(e) => set('next_checkup_date', e.target.value)}
            className="w-44 text-sm"
          />
          {form.next_checkup_date && (
            <span className="text-xs text-slate-500">
              {new Date(form.next_checkup_date).toLocaleDateString('ko-KR', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>
          )}
        </div>
      </section>

      {/* ── 저장 / 상태 ─────────────────────────────── */}
      <div className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {status === 'draft' && <span>작성 중</span>}
          {status === 'reviewing' && (
            <span className="font-medium text-amber-600">검토 중</span>
          )}
          {status === 'approved' && (
            <span className="flex items-center gap-1 font-medium text-emerald-600">
              <CheckCircle2 size={14} /> 승인 완료
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
            {saving ? '저장 중...' : '저장'}
          </Button>
          {status === 'draft' && (
            <Button size="sm" variant="outline" onClick={() => onStatusChange('reviewing')}>
              검토 요청
            </Button>
          )}
          {status === 'reviewing' && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => onStatusChange('approved')}
            >
              <CheckCircle2 className="mr-1 h-4 w-4" />
              최종 승인
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
