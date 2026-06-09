'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { upsertCheckupSection } from '@/lib/actions/checkup/checkup-actions'
import { generatePlanSections } from '@/lib/actions/checkup/plan-analysis'
import type { DxEvaluation } from '@/lib/actions/checkup/plan-analysis'
import type { CheckupSection, CheckupPatient, CheckupStatus } from '@/types/hospital/checkup-type'

// ── 타입 ─────────────────────────────────────────────────────

const EMPTY_DX: DxEvaluation = { status: 'normal', summary: '', detail: '', action: '' }

/** 저장된 데이터가 문자열(구버전)일 수 있으므로 DxEvaluation으로 정규화 */
function normalizeDx(raw: unknown): DxEvaluation {
  if (raw && typeof raw === 'object' && 'status' in raw) return raw as DxEvaluation
  if (typeof raw === 'string' && raw.trim()) {
    return { status: 'normal', summary: raw.slice(0, 60), detail: raw, action: '' }
  }
  return { ...EMPTY_DX }
}

type PlanData = {
  // 1. 기관별 진단 (구조화)
  dx_musculoskeletal: DxEvaluation
  dx_cardio_resp: DxEvaluation
  dx_hepatobiliary: DxEvaluation
  dx_endocrine: DxEvaluation
  dx_urogenital: DxEvaluation
  dx_oral: DxEvaluation
  dx_ophthalmic: DxEvaluation
  dx_neuro: DxEvaluation
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
  dx_musculoskeletal: { ...EMPTY_DX }, dx_cardio_resp: { ...EMPTY_DX },
  dx_hepatobiliary: { ...EMPTY_DX },   dx_endocrine: { ...EMPTY_DX },
  dx_urogenital: { ...EMPTY_DX },      dx_oral: { ...EMPTY_DX },
  dx_ophthalmic: { ...EMPTY_DX },      dx_neuro: { ...EMPTY_DX },
  tx_surgery: '', tx_medication: '', tx_diet_plan: '', tx_further_workup: '',
  tx_monitoring: '', tx_priority_summary: '',
  guide_diet: '', guide_weight: '', guide_exercise: '', guide_environment: '',
  followup_plan: '', next_checkup_date: '',
}

function initForm(saved: Partial<Record<string, unknown>>): PlanData {
  const DX_KEYS = [
    'dx_musculoskeletal', 'dx_cardio_resp', 'dx_hepatobiliary', 'dx_endocrine',
    'dx_urogenital', 'dx_oral', 'dx_ophthalmic', 'dx_neuro',
  ] as const
  const result = { ...EMPTY }
  for (const key of DX_KEYS) {
    result[key] = normalizeDx(saved[key])
  }
  const STRING_KEYS = [
    'tx_surgery', 'tx_medication', 'tx_diet_plan', 'tx_further_workup',
    'tx_monitoring', 'tx_priority_summary', 'guide_diet', 'guide_weight',
    'guide_exercise', 'guide_environment', 'followup_plan', 'next_checkup_date',
  ] as const
  for (const key of STRING_KEYS) {
    if (typeof saved[key] === 'string') result[key] = saved[key] as string
  }
  return result
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
  const [editing, setEditing] = useState(false)

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-medium text-slate-600">
          {label}
          {sub && <span className="ml-1 font-normal text-slate-400">{sub}</span>}
        </p>
        {!editing && value && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[10px] text-slate-400 transition-colors hover:text-teal-600"
          >
            수정
          </button>
        )}
      </div>

      {editing ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setEditing(false)}
          autoFocus
          className="resize-none text-xs leading-relaxed"
          style={{ minHeight: minH }}
          placeholder="직접 입력하거나 AI 분석으로 자동 채우세요."
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="cursor-text rounded-md border border-slate-200 bg-white px-3 py-2.5 transition-colors hover:border-teal-200"
          style={{ minHeight: minH }}
        >
          {value ? (
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{value}</p>
          ) : (
            <p className="text-xs text-slate-300">클릭하여 입력하거나 AI 분석을 사용하세요.</p>
          )}
        </div>
      )}
    </div>
  )
}

const STATUS_LABELS: Record<DxEvaluation['status'], { label: string; cls: string }> = {
  normal:   { label: '정상',   cls: 'bg-emerald-100 text-emerald-700' },
  mild:     { label: '경도',   cls: 'bg-amber-100 text-amber-700'     },
  moderate: { label: '중등도', cls: 'bg-orange-100 text-orange-700'   },
  severe:   { label: '중증',   cls: 'bg-red-100 text-red-700'         },
}

function DxFieldBlock({
  label, value, onChange,
}: {
  label: string
  value: DxEvaluation
  onChange: (v: DxEvaluation) => void
}) {
  const [open, setOpen] = useState(false)
  const st = STATUS_LABELS[value.status] ?? STATUS_LABELS.normal
  const hasContent = value.summary || value.detail

  return (
    <div className="rounded-md border border-slate-200 bg-white">
      {/* 헤더 */}
      <div
        className="flex cursor-pointer items-center justify-between px-3 py-2 hover:bg-slate-50"
        onClick={() => setOpen((p) => !p)}
      >
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-slate-700">{label}</p>
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${st.cls}`}>
            {st.label}
          </span>
        </div>
        {hasContent && !open && (
          <p className="max-w-[180px] truncate text-[11px] text-slate-400">{value.summary}</p>
        )}
        <span className="ml-2 text-[10px] text-slate-400">{open ? '접기' : '펼치기'}</span>
      </div>

      {/* 편집 영역 */}
      {open && (
        <div className="flex flex-col gap-2 border-t border-slate-100 px-3 pb-3 pt-2">
          {/* 상태 선택 */}
          <div>
            <p className="mb-1 text-[10px] font-medium text-slate-500">상태</p>
            <div className="flex gap-1.5">
              {(Object.keys(STATUS_LABELS) as DxEvaluation['status'][]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChange({ ...value, status: s })}
                  className={`rounded px-2 py-0.5 text-[10px] font-semibold transition-opacity ${
                    STATUS_LABELS[s].cls
                  } ${value.status === s ? 'opacity-100 ring-1 ring-current' : 'opacity-50'}`}
                >
                  {STATUS_LABELS[s].label}
                </button>
              ))}
            </div>
          </div>
          {/* 요약 */}
          <div>
            <p className="mb-1 text-[10px] font-medium text-slate-500">1줄 요약</p>
            <input
              type="text"
              value={value.summary}
              onChange={(e) => onChange({ ...value, summary: e.target.value })}
              placeholder="예: 경도 간효소 상승"
              className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-teal-400"
            />
          </div>
          {/* 상세 설명 */}
          <div>
            <p className="mb-1 text-[10px] font-medium text-slate-500">보호자 설명</p>
            <Textarea
              value={value.detail}
              onChange={(e) => onChange({ ...value, detail: e.target.value })}
              placeholder="보호자에게 쉽게 설명하는 2~4줄 소견"
              className="resize-none text-xs leading-relaxed"
              style={{ minHeight: 64 }}
            />
          </div>
          {/* 권장 조치 */}
          <div>
            <p className="mb-1 text-[10px] font-medium text-slate-500">권장 조치</p>
            <Textarea
              value={value.action}
              onChange={(e) => onChange({ ...value, action: e.target.value })}
              placeholder="• 항목 형식으로 1~3줄"
              className="resize-none text-xs leading-relaxed"
              style={{ minHeight: 48 }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────

export default function Tab5Plan({
  checkupId, patient, planSection, status, onStatusChange,
}: Props) {
  const saved = (planSection?.data ?? {}) as Partial<Record<string, unknown>>
  const [form, setForm] = useState<PlanData>(() => initForm(saved))
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
        <SectionHeader title="기관별 진단 및 평가" sub="계통별 요약 평가 소견 — AI 분석 후 펼쳐서 확인·수정하세요" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DxFieldBlock label="근골격계" value={form.dx_musculoskeletal} onChange={(v) => set('dx_musculoskeletal', v)} />
          <DxFieldBlock label="심혈관 / 호흡기" value={form.dx_cardio_resp} onChange={(v) => set('dx_cardio_resp', v)} />
          <DxFieldBlock label="간담도계" value={form.dx_hepatobiliary} onChange={(v) => set('dx_hepatobiliary', v)} />
          <DxFieldBlock label="내분비계" value={form.dx_endocrine} onChange={(v) => set('dx_endocrine', v)} />
          <DxFieldBlock label="비뇨 / 생식기" value={form.dx_urogenital} onChange={(v) => set('dx_urogenital', v)} />
          <DxFieldBlock label="구강" value={form.dx_oral} onChange={(v) => set('dx_oral', v)} />
          <DxFieldBlock label="안과" value={form.dx_ophthalmic} onChange={(v) => set('dx_ophthalmic', v)} />
          <DxFieldBlock label="신경계" value={form.dx_neuro} onChange={(v) => set('dx_neuro', v)} />
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
