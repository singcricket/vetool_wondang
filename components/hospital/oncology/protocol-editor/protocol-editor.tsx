'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Autocomplete from '@/components/common/auto-complete/auto-complete'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils/utils'
import type { ProtocolFormData } from '@/lib/actions/oncology/protocol-template-actions'
import type { DrugItem, AdverseEffectItem, RefSource } from '@/lib/actions/oncology/ai-oncology-guide'
import { Plus, Trash2, ChevronDown, ChevronUp, Loader2, GripVertical } from 'lucide-react'

// ── Constants ────────────────────────────────────────────────────────────────

const PROTOCOL_TYPES = [
  { value: 'chemo', label: 'Chemotherapy' },
  { value: 'radiation', label: 'Radiation' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'multimodal', label: 'Multimodal' },
]

const PHASES = [
  { value: 'induction', label: 'Induction' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'rescue', label: 'Rescue' },
  { value: 'adjuvant', label: 'Adjuvant' },
]

const ROUTES = [
  { value: 'iv', label: 'IV' },
  { value: 'oral', label: 'Oral' },
  { value: 'sc', label: 'SC' },
  { value: 'im', label: 'IM' },
]

const DOSE_UNITS = [
  { value: 'mg/m2', label: 'mg/m²' },
  { value: 'mg/kg', label: 'mg/kg' },
  { value: 'fixed_mg', label: 'mg (fixed)' },
]

const FREQUENCIES = [
  { value: 'q24h', label: 'q24h (매일)' },
  { value: 'q48h', label: 'q48h (격일)' },
  { value: 'q7d', label: 'q7d (주1회)' },
  { value: 'q14d', label: 'q14d (2주1회)' },
  { value: 'q21d', label: 'q21d (3주1회)' },
  { value: 'q28d', label: 'q28d (4주1회)' },
  { value: 'q35d', label: 'q35d (5주1회)' },
]

// ── Types ────────────────────────────────────────────────────────────────────

type DrugFormItem = DrugItem & { _key: string }

type AeFormItem = AdverseEffectItem & { _key: string }

type RefFormItem = RefSource & { _key: string }

type FormState = Omit<ProtocolFormData, 'drugs' | 'adverse_effects' | 'ref_sources' | 'owner_warning_signs'> & {
  drugs: DrugFormItem[]
  adverse_effects: AeFormItem[]
  ref_sources: RefFormItem[]
  owner_warning_signs: string[]
  user_tags: string
}

// ── Defaults ─────────────────────────────────────────────────────────────────

function newKey() {
  return Math.random().toString(36).slice(2)
}

const DEFAULT_DRUG: DrugFormItem = {
  _key: '',
  drug_name: '',
  route: 'iv',
  dose_value: 0,
  dose_unit: 'mg/m2',
  concentration: null,
  frequency: 'q35d',
  cycle_day: 1,
  duration_days: 1,
  is_oral: false,
}

const DEFAULT_AE: AeFormItem = {
  _key: '',
  name: '',
  vcog_grade: 1,
  frequency: 'common',
  description: '',
}

const DEFAULT_REF: RefFormItem = {
  _key: '',
  title: '',
  journal: '',
  year: new Date().getFullYear(),
}

function toFormState(data?: Partial<ProtocolFormData>): FormState {
  return {
    protocol_name: data?.protocol_name ?? '',
    protocol_type: data?.protocol_type ?? 'chemo',
    phase: data?.phase ?? 'induction',
    total_cycles: data?.total_cycles ?? null,
    total_weeks: data?.total_weeks ?? null,
    description: data?.description ?? null,
    mst_days: data?.mst_days ?? null,
    response_rate: data?.response_rate ?? null,
    precautions: data?.precautions ?? null,
    contraindications: data?.contraindications ?? null,
    owner_instructions: data?.owner_instructions ?? null,
    owner_warning_signs: data?.owner_warning_signs ?? [],
    user_tags: data?.user_tags ?? '',
    drugs: (data?.drugs ?? []).map((d) => ({ ...d, _key: newKey() })),
    adverse_effects: (data?.adverse_effects ?? []).map((ae) => ({ ...ae, _key: newKey() })),
    ref_sources: (data?.ref_sources ?? []).map((r) => ({ ...r, _key: newKey() })),
  }
}

function toProtocolFormData(state: FormState): ProtocolFormData {
  return {
    ...state,
    drugs: state.drugs.map(({ _key, ...d }) => d),
    adverse_effects: state.adverse_effects.map(({ _key, ...ae }) => ae),
    ref_sources: state.ref_sources.map(({ _key, ...r }) => r),
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  expanded,
  onToggle,
  required,
}: {
  title: string
  expanded: boolean
  onToggle: () => void
  required?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between py-2 border-b border-slate-200 mb-3"
    >
      <span className="text-sm font-semibold text-slate-700">
        {title}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </span>
      {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
    </button>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Label className="text-xs text-slate-500 mb-1 block">{children}</Label>
}

function DrugCard({
  drug,
  index,
  onChange,
  onRemove,
}: {
  drug: DrugFormItem
  index: number
  onChange: (field: keyof DrugFormItem, value: unknown) => void
  onRemove: () => void
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50">
        <GripVertical size={14} className="text-slate-300 shrink-0" />
        <span className="text-xs font-medium text-slate-500 shrink-0">#{index + 1}</span>
        <Input
          value={drug.drug_name}
          onChange={(e) => onChange('drug_name', e.target.value)}
          placeholder="약물명 (예: Vincristine)"
          className="h-7 text-sm border-0 bg-transparent p-0 font-medium focus-visible:ring-0 flex-1"
        />
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn(
            'text-xs px-1.5 py-0.5 rounded font-medium',
            drug.route === 'iv' ? 'bg-blue-100 text-blue-700' :
            drug.route === 'oral' ? 'bg-green-100 text-green-700' :
            'bg-slate-100 text-slate-600'
          )}>
            {drug.route.toUpperCase()}
          </span>
          <button type="button" onClick={() => setExpanded((v) => !v)} className="text-slate-400 hover:text-slate-600">
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <button type="button" onClick={onRemove} className="text-slate-300 hover:text-red-500">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-3 space-y-3">
          {/* Row 1: route, dose_value, dose_unit, concentration */}
          <div className="grid grid-cols-4 gap-2">
            <div>
              <FieldLabel>경로</FieldLabel>
              <Select value={drug.route} onValueChange={(v) => { onChange('route', v); onChange('is_oral', v === 'oral') }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROUTES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel>용량</FieldLabel>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={drug.dose_value || ''}
                onChange={(e) => onChange('dose_value', parseFloat(e.target.value) || 0)}
                className="h-8 text-xs"
                placeholder="0.00"
              />
            </div>
            <div>
              <FieldLabel>단위</FieldLabel>
              <Select value={drug.dose_unit} onValueChange={(v) => onChange('dose_unit', v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOSE_UNITS.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel>농도 (mg/mL)</FieldLabel>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={drug.concentration ?? ''}
                onChange={(e) => onChange('concentration', e.target.value ? parseFloat(e.target.value) : null)}
                className="h-8 text-xs"
                placeholder="예: 1.0"
              />
            </div>
          </div>

          {/* Row 2: frequency, cycle_day, duration_days */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <FieldLabel>투여 주기</FieldLabel>
              <Select value={drug.frequency} onValueChange={(v) => onChange('frequency', v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel>사이클 시작일</FieldLabel>
              <Input
                type="number"
                min="1"
                value={drug.cycle_day}
                onChange={(e) => onChange('cycle_day', parseInt(e.target.value) || 1)}
                className="h-8 text-xs"
                placeholder="1"
              />
            </div>
            <div>
              <FieldLabel>연속 투여일수</FieldLabel>
              <Input
                type="number"
                min="1"
                value={drug.duration_days}
                onChange={(e) => onChange('duration_days', parseInt(e.target.value) || 1)}
                className="h-8 text-xs"
                placeholder="1"
              />
            </div>
          </div>

          {/* cycle_day hint */}
          <p className="text-xs text-slate-400">
            사이클 시작일: 1=1주차, 8=2주차, 15=3주차, 22=4주차
            {drug.duration_days > 1 && drug.is_oral && (
              <span className="ml-2 text-green-600">경구 {drug.duration_days}일 처방 → 사이클당 1회 처방 항목으로 생성됩니다</span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export interface ProtocolEditorProps {
  initialData?: Partial<ProtocolFormData>
  onSubmit: (data: ProtocolFormData) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

export default function ProtocolEditor({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = '프로토콜 저장',
}: ProtocolEditorProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(initialData))
  const [submitting, setSubmitting] = useState(false)

  // Section expand states
  const [showClinical, setShowClinical] = useState(true)
  const [showOwner, setShowOwner] = useState(true)
  const [showAe, setShowAe] = useState(false)
  const [showRef, setShowRef] = useState(false)

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  // Drug helpers
  const addDrug = () =>
    setField('drugs', [...form.drugs, { ...DEFAULT_DRUG, _key: newKey() }])

  const updateDrug = (idx: number, field: keyof DrugFormItem, value: unknown) =>
    setField('drugs', form.drugs.map((d, i) => i === idx ? { ...d, [field]: value } : d))

  const removeDrug = (idx: number) =>
    setField('drugs', form.drugs.filter((_, i) => i !== idx))

  // Warning signs helpers
  const addWarnSign = () => setField('owner_warning_signs', [...form.owner_warning_signs, ''])
  const updateWarnSign = (idx: number, value: string) =>
    setField('owner_warning_signs', form.owner_warning_signs.map((w, i) => i === idx ? value : w))
  const removeWarnSign = (idx: number) =>
    setField('owner_warning_signs', form.owner_warning_signs.filter((_, i) => i !== idx))

  // Adverse effects helpers
  const addAe = () =>
    setField('adverse_effects', [...form.adverse_effects, { ...DEFAULT_AE, _key: newKey() }])
  const updateAe = (idx: number, field: keyof AeFormItem, value: unknown) =>
    setField('adverse_effects', form.adverse_effects.map((ae, i) => i === idx ? { ...ae, [field]: value } : ae))
  const removeAe = (idx: number) =>
    setField('adverse_effects', form.adverse_effects.filter((_, i) => i !== idx))

  // Ref sources helpers
  const addRef = () =>
    setField('ref_sources', [...form.ref_sources, { ...DEFAULT_REF, _key: newKey() }])
  const updateRef = (idx: number, field: keyof RefFormItem, value: unknown) =>
    setField('ref_sources', form.ref_sources.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  const removeRef = (idx: number) =>
    setField('ref_sources', form.ref_sources.filter((_, i) => i !== idx))

  const handleSubmit = async () => {
    if (!form.protocol_name.trim()) return alert('프로토콜 이름을 입력하세요.')
    if (form.drugs.length === 0) return alert('약물을 1개 이상 추가하세요.')
    if (form.drugs.some((d) => !d.drug_name.trim())) return alert('모든 약물의 이름을 입력하세요.')
    setSubmitting(true)
    try {
      await onSubmit(toProtocolFormData(form))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* ── 섹션 1: 기본 정보 ─────────────────────────────────── */}
      <div>
        <p className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-2 mb-3">기본 정보</p>
        <div className="space-y-3">
          <div>
            <FieldLabel>프로토콜 이름 *</FieldLabel>
            <Input
              value={form.protocol_name}
              onChange={(e) => setField('protocol_name', e.target.value)}
              placeholder="예: Canine CHOP UW-25"
              className="h-9 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>종류</FieldLabel>
              <Select value={form.protocol_type} onValueChange={(v) => setField('protocol_type', v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROTOCOL_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel>단계</FieldLabel>
              <Select value={form.phase} onValueChange={(v) => setField('phase', v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PHASES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <FieldLabel>총 사이클 수</FieldLabel>
              <Input
                type="number" min="1"
                value={form.total_cycles ?? ''}
                onChange={(e) => setField('total_cycles', e.target.value ? parseInt(e.target.value) : null)}
                className="h-9 text-sm" placeholder="예: 6"
              />
            </div>
            <div>
              <FieldLabel>총 주수</FieldLabel>
              <Input
                type="number" min="1"
                value={form.total_weeks ?? ''}
                onChange={(e) => setField('total_weeks', e.target.value ? parseInt(e.target.value) : null)}
                className="h-9 text-sm" placeholder="예: 25"
              />
            </div>
            <div>
              <FieldLabel>MST (일)</FieldLabel>
              <Input
                type="number" min="1"
                value={form.mst_days ?? ''}
                onChange={(e) => setField('mst_days', e.target.value ? parseInt(e.target.value) : null)}
                className="h-9 text-sm" placeholder="예: 365"
              />
            </div>
            <div>
              <FieldLabel>반응률 (%)</FieldLabel>
              <Input
                type="number" min="0" max="100" step="1"
                value={form.response_rate != null ? Math.round(form.response_rate * 100) : ''}
                onChange={(e) => setField('response_rate', e.target.value ? parseFloat(e.target.value) / 100 : null)}
                className="h-9 text-sm" placeholder="예: 65"
              />
            </div>
          </div>
          <div>
            <FieldLabel>프로토콜 설명</FieldLabel>
            <Textarea
              value={form.description ?? ''}
              onChange={(e) => setField('description', e.target.value || null)}
              placeholder="프로토콜 개요, 적응증 등"
              className="text-sm resize-none" rows={2}
            />
          </div>
          <div>
            <FieldLabel>태그 (검색용)</FieldLabel>
            <Autocomplete
              defaultValue={form.user_tags}
              handleUpdate={(v) => setField('user_tags', v)}
              onInputChange={(v) => setField('user_tags', v)}
              placeholder="예: 림프종(lymphoma), CHOP, 개"
            />
            <p className="text-xs text-slate-400 mt-1">쉼표로 구분. keywords 테이블을 통해 관련 태그가 자동 확장됩니다.</p>
          </div>
        </div>
      </div>

      {/* ── 섹션 2: 약물 목록 ─────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
          <p className="text-sm font-semibold text-slate-700">
            약물 목록 <span className="text-rose-500">*</span>
            <span className="ml-2 text-xs font-normal text-slate-400">({form.drugs.length}개)</span>
          </p>
          <Button type="button" variant="outline" size="sm" onClick={addDrug} className="h-7 text-xs gap-1">
            <Plus size={12} /> 약물 추가
          </Button>
        </div>
        {form.drugs.length === 0 ? (
          <button
            type="button"
            onClick={addDrug}
            className="w-full border-2 border-dashed border-slate-200 rounded-lg py-6 text-sm text-slate-400 hover:border-rose-300 hover:text-rose-400 transition-colors"
          >
            + 약물을 추가하세요
          </button>
        ) : (
          <div className="space-y-2">
            {form.drugs.map((drug, idx) => (
              <DrugCard
                key={drug._key}
                drug={drug}
                index={idx}
                onChange={(field, value) => updateDrug(idx, field, value)}
                onRemove={() => removeDrug(idx)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── 섹션 3: 임상 정보 ─────────────────────────────────── */}
      <div>
        <SectionHeader title="임상 정보" expanded={showClinical} onToggle={() => setShowClinical((v) => !v)} />
        {showClinical && (
          <div className="space-y-3">
            <div>
              <FieldLabel>주의사항 (Precautions)</FieldLabel>
              <Textarea
                value={form.precautions ?? ''}
                onChange={(e) => setField('precautions', e.target.value || null)}
                placeholder="투약 전 확인사항, 모니터링 항목 등"
                className="text-sm resize-none" rows={2}
              />
            </div>
            <div>
              <FieldLabel>금기사항 (Contraindications)</FieldLabel>
              <Textarea
                value={form.contraindications ?? ''}
                onChange={(e) => setField('contraindications', e.target.value || null)}
                placeholder="투약 금기 상황"
                className="text-sm resize-none" rows={2}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── 섹션 4: 보호자 안내 ───────────────────────────────── */}
      <div>
        <SectionHeader title="보호자 안내" expanded={showOwner} onToggle={() => setShowOwner((v) => !v)} />
        {showOwner && (
          <div className="space-y-3">
            <div>
              <FieldLabel>보호자 안내 내용</FieldLabel>
              <Textarea
                value={form.owner_instructions ?? ''}
                onChange={(e) => setField('owner_instructions', e.target.value || null)}
                placeholder="보호자에게 전달할 투약 안내사항 (한국어)"
                className="text-sm resize-none" rows={3}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <FieldLabel>즉시 내원 증상</FieldLabel>
                <Button type="button" variant="ghost" size="sm" onClick={addWarnSign} className="h-6 text-xs gap-1 text-rose-600">
                  <Plus size={11} /> 추가
                </Button>
              </div>
              <div className="space-y-1.5">
                {form.owner_warning_signs.map((sign, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={sign}
                      onChange={(e) => updateWarnSign(idx, e.target.value)}
                      placeholder="예: 38.5°C 이상 발열"
                      className="h-8 text-sm flex-1"
                    />
                    <button type="button" onClick={() => removeWarnSign(idx)} className="text-slate-300 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {form.owner_warning_signs.length === 0 && (
                  <p className="text-xs text-slate-400">즉시 내원이 필요한 증상을 추가하세요</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 섹션 5: 부작용 (접이식) ───────────────────────────── */}
      <div>
        <SectionHeader title={`부작용 (${form.adverse_effects.length}개)`} expanded={showAe} onToggle={() => setShowAe((v) => !v)} />
        {showAe && (
          <div className="space-y-2">
            {form.adverse_effects.map((ae, idx) => (
              <div key={ae._key} className="grid grid-cols-[1fr_60px_80px_1fr_32px] gap-2 items-start">
                <Input
                  value={ae.name}
                  onChange={(e) => updateAe(idx, 'name', e.target.value)}
                  placeholder="부작용명 (예: 구토(vomiting))"
                  className="h-8 text-xs"
                />
                <Select
                  value={String(ae.vcog_grade)}
                  onValueChange={(v) => updateAe(idx, 'vcog_grade', parseInt(v))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="등급" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">G1 — 경증</SelectItem>
                    <SelectItem value="2">G2 — 중등도</SelectItem>
                    <SelectItem value="3">G3 — 중증</SelectItem>
                    <SelectItem value="4">G4 — 생명위협</SelectItem>
                    <SelectItem value="5">G5 — 사망</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={ae.frequency}
                  onChange={(e) => updateAe(idx, 'frequency', e.target.value)}
                  placeholder="빈도"
                  className="h-8 text-xs"
                />
                <Input
                  value={ae.description}
                  onChange={(e) => updateAe(idx, 'description', e.target.value)}
                  placeholder="설명"
                  className="h-8 text-xs"
                />
                <button type="button" onClick={() => removeAe(idx)} className="text-slate-300 hover:text-red-500 mt-1.5">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={addAe} className="text-xs gap-1 text-slate-500 h-7">
              <Plus size={11} /> 부작용 추가
            </Button>
          </div>
        )}
      </div>

      {/* ── 섹션 6: 참고문헌 (접이식) ─────────────────────────── */}
      <div>
        <SectionHeader title={`참고문헌 (${form.ref_sources.length}개)`} expanded={showRef} onToggle={() => setShowRef((v) => !v)} />
        {showRef && (
          <div className="space-y-2">
            {form.ref_sources.map((ref, idx) => (
              <div key={ref._key} className="grid grid-cols-[2fr_1fr_60px_32px] gap-2 items-start">
                <Input
                  value={ref.title}
                  onChange={(e) => updateRef(idx, 'title', e.target.value)}
                  placeholder="논문 제목"
                  className="h-8 text-xs"
                />
                <Input
                  value={ref.journal}
                  onChange={(e) => updateRef(idx, 'journal', e.target.value)}
                  placeholder="저널명"
                  className="h-8 text-xs"
                />
                <Input
                  type="number"
                  value={ref.year}
                  onChange={(e) => updateRef(idx, 'year', parseInt(e.target.value) || new Date().getFullYear())}
                  className="h-8 text-xs"
                  placeholder="연도"
                />
                <button type="button" onClick={() => removeRef(idx)} className="text-slate-300 hover:text-red-500 mt-1.5">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={addRef} className="text-xs gap-1 text-slate-500 h-7">
              <Plus size={11} /> 참고문헌 추가
            </Button>
          </div>
        )}
      </div>

      {/* ── 액션 버튼 ─────────────────────────────────────────── */}
      <div className="flex gap-2 pt-2 border-t border-slate-200">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-rose-600 hover:bg-rose-700 text-white"
        >
          {submitting && <Loader2 size={14} className="mr-2 animate-spin" />}
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
      </div>
    </div>
  )
}
