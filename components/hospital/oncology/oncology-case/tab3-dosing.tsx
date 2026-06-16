'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils/utils'
import { updateScheduleStatus, updateScheduleDate, saveBulkScheduleDates, updateScheduleDoseRate, deleteSchedules } from '@/lib/actions/oncology/schedule-actions'
import type { OncologyCaseProtocolRow, OncologyScheduleRow } from '@/lib/services/oncology/fetch-oncology-case'
import type { DrugItem, AdverseEffectItem } from '@/lib/actions/oncology/ai-oncology-guide'
import { CalendarDays, CheckCircle, ChevronDown, ChevronUp, ClipboardList, FlaskConical, AlertTriangle, Loader2, Pencil, ShieldAlert, Trash2, TriangleAlert, X } from 'lucide-react'
import AdverseEventDialog from './adverse-event-dialog'

// ── Route helpers ─────────────────────────────────────────────────────────────
function isOralRoute(route: string): boolean {
  return /^po$/i.test(route.trim()) || /\boral\b/i.test(route)
}

// ── BSA (Meeh's formula) ──────────────────────────────────────────────────────
function calcBsa(weightKg: number, species: string): number {
  const k = species === 'feline' ? 0.100 : 0.101
  return k * Math.pow(weightKg, 2 / 3)
}

// ── Dose calculator ───────────────────────────────────────────────────────────
function calcDoseMg(
  weightKg: number,
  dosePerKg: number | null,
  dosePerM2: number | null,
  doseCalculated: number | null,
  species: string,
): number | null {
  if (dosePerKg != null) return Math.round(dosePerKg * weightKg * 100) / 100
  if (dosePerM2 != null) return Math.round(dosePerM2 * calcBsa(weightKg, species) * 100) / 100
  return doseCalculated // fixed dose — unchanged
}

// ── VCOG grade badge ──────────────────────────────────────────────────────────
const VCOG_COLORS: Record<number, string> = {
  1: 'bg-green-100 text-green-700',
  2: 'bg-yellow-100 text-yellow-700',
  3: 'bg-orange-100 text-orange-700',
  4: 'bg-red-100 text-red-700',
  5: 'bg-red-200 text-red-900',
}
const VCOG_LABELS: Record<number, string> = {
  1: 'G1 경증', 2: 'G2 중등도', 3: 'G3 중증', 4: 'G4 생명위협', 5: 'G5 사망',
}

type InfoTab = 'adverse' | 'caution'

function ProtocolInfoPanel({
  protocol,
  activeTab,
}: {
  protocol: OncologyCaseProtocolRow['protocol']
  activeTab: InfoTab
}) {
  const adverseEffects = (protocol.adverse_effects as AdverseEffectItem[]) ?? []
  const warnings = (protocol.owner_warning_signs as string[]) ?? []

  if (activeTab === 'adverse') {
    return (
      <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 space-y-2">
        <p className="text-xs font-semibold text-amber-800 flex items-center gap-1">
          <AlertTriangle size={12} /> 부작용 (Adverse Effects)
        </p>
        {adverseEffects.length === 0 ? (
          <p className="text-xs text-slate-400">등록된 부작용 정보가 없습니다.</p>
        ) : (
          <div className="space-y-1.5">
            {adverseEffects.map((ae, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className={cn('shrink-0 rounded px-1.5 py-0.5 font-medium text-[10px]', VCOG_COLORS[ae.vcog_grade] ?? 'bg-slate-100 text-slate-600')}>
                  {VCOG_LABELS[ae.vcog_grade] ?? `G${ae.vcog_grade}`}
                </span>
                <span className="font-medium text-slate-700">{ae.name}</span>
                {ae.frequency && <span className="text-slate-400">({ae.frequency})</span>}
                {ae.description && <span className="text-slate-500">— {ae.description}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="px-4 py-3 bg-red-50 border-b border-red-200 space-y-3">
      <p className="text-xs font-semibold text-red-800 flex items-center gap-1">
        <ShieldAlert size={12} /> 금기 / 주의사항
      </p>
      {protocol.contraindications && (
        <div>
          <p className="text-[10px] font-semibold text-red-700 uppercase mb-1">금기 (Contraindications)</p>
          <p className="text-xs text-slate-700 whitespace-pre-wrap">{protocol.contraindications}</p>
        </div>
      )}
      {protocol.precautions && (
        <div>
          <p className="text-[10px] font-semibold text-orange-700 uppercase mb-1">주의사항 (Precautions)</p>
          <p className="text-xs text-slate-700 whitespace-pre-wrap">{protocol.precautions}</p>
        </div>
      )}
      {warnings.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-slate-600 uppercase mb-1">보호자 주의 징후</p>
          <ul className="space-y-0.5">
            {warnings.map((w, i) => (
              <li key={i} className="text-xs text-slate-700 flex items-start gap-1">
                <span className="text-red-400 shrink-0">•</span> {w}
              </li>
            ))}
          </ul>
        </div>
      )}
      {!protocol.contraindications && !protocol.precautions && warnings.length === 0 && (
        <p className="text-xs text-slate-400">등록된 금기/주의사항 정보가 없습니다.</p>
      )}
    </div>
  )
}

const STATUS_OPTIONS = [
  { value: 'scheduled', label: '미실시', className: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
  { value: 'completed', label: '완료', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
  { value: 'delayed', label: '연기', className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
  { value: 'reduced', label: '감량', className: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
  { value: 'skipped', label: '건너뜀', className: 'bg-red-100 text-red-700 hover:bg-red-200' },
]

function DoseCalcDisplay({
  weightKg,
  dosePerKg,
  dosePerM2,
  doseCalculated,
  strength,
  species,
  oral,
  dosesPerDay,
  dispDays,
}: {
  weightKg: number | null
  dosePerKg: number | null
  dosePerM2: number | null
  doseCalculated: number | null
  strength: number | null       // mg/mL (주사) or mg/정(캡) (경구)
  species: string
  oral: boolean
  dosesPerDay?: number
  dispDays?: number
}) {
  if (weightKg == null || weightKg <= 0) return null

  const calcMg = calcDoseMg(weightKg, dosePerKg, dosePerM2, doseCalculated, species)
  if (calcMg == null) return null

  const baseLabel = dosePerKg != null
    ? `${dosePerKg} mg/kg`
    : dosePerM2 != null
      ? `${dosePerM2} mg/m²`
      : `고정 용량`

  const weightLabel = dosePerM2 != null
    ? `BSA ${calcBsa(weightKg, species).toFixed(3)} m²`
    : `${weightKg} kg`

  if (oral) {
    const perDose = strength && strength > 0
      ? Math.round((calcMg / strength) * 10) / 10
      : null
    const total = perDose != null && dosesPerDay && dispDays
      ? Math.round(perDose * dosesPerDay * dispDays * 10) / 10
      : null

    return (
      <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 space-y-1.5">
        <div className="flex items-center gap-1">
          <FlaskConical size={11} className="text-blue-500" />
          <span className="text-xs font-medium text-blue-700">경구 정제 자동 계산</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-500">{baseLabel}</span>
          <span className="text-slate-400">×</span>
          <span className="font-medium text-slate-700">{weightLabel}</span>
          <span className="text-slate-400">=</span>
          <span className="font-bold text-blue-700">{calcMg} mg</span>
        </div>
        {strength && strength > 0 ? (
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-bold text-blue-700">{calcMg} mg</span>
            <span className="text-slate-400">÷</span>
            <span className="text-slate-500">{strength} mg/정(캡)</span>
            <span className="text-slate-400">=</span>
            <span className="font-bold text-emerald-700">{perDose} 정(캡)/회</span>
            {total != null && dosesPerDay && dispDays && (
              <>
                <span className="text-slate-400">×</span>
                <span className="text-slate-500">{dosesPerDay}회/일 × {dispDays}일</span>
                <span className="text-slate-400">=</span>
                <span className="font-bold text-rose-700">총 {total} 정(캡)</span>
              </>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">정제 용량 미설정 (정수 계산 불가)</span>
        )}
      </div>
    )
  }

  // 주사제
  const calcMl = strength && strength > 0 ? Math.round((calcMg / strength) * 100) / 100 : null
  return (
    <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2">
      <div className="flex items-center gap-1 mb-1.5">
        <FlaskConical size={11} className="text-blue-500" />
        <span className="text-xs font-medium text-blue-700">자동 계산</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-slate-500">{baseLabel}</span>
        <span className="text-slate-400">×</span>
        <span className="font-medium text-slate-700">{weightLabel}</span>
        <span className="text-slate-400">=</span>
        <span className="font-bold text-blue-700">{calcMg} mg</span>
        {calcMl != null && (
          <>
            <span className="text-slate-400">÷</span>
            <span className="text-slate-500">{strength} mg/mL</span>
            <span className="text-slate-400">=</span>
            <span className="font-bold text-emerald-700">{calcMl} mL</span>
          </>
        )}
        {calcMl == null && strength == null && (
          <span className="text-slate-400 italic">농도 미설정 (mL 계산 불가)</span>
        )}
      </div>
    </div>
  )
}

function ScheduleRow({
  schedule,
  concentration,
  species,
  caseId,
  caseProtocols,
  onUpdate,
  isSelected,
  onToggleSelect,
  displayDate,
  onDateChanged,
}: {
  schedule: OncologyScheduleRow
  concentration: number | null
  species: string
  caseId: string
  caseProtocols: OncologyCaseProtocolRow[]
  onUpdate: () => void
  isSelected: boolean
  onToggleSelect: () => void
  displayDate: string
  onDateChanged: (newDate: string) => void
}) {
  const oral = isOralRoute(schedule.drug_route ?? '')

  const [activeStatus, setActiveStatus] = useState(schedule.status)
  const [showForm, setShowForm] = useState(false)
  const [bodyWeight, setBodyWeight] = useState(schedule.body_weight_at_visit?.toString() ?? '')
  const [strengthInput, setStrengthInput] = useState(concentration?.toString() ?? '')
  const [dosesPerDay, setDosesPerDay] = useState(1)
  const [dispDays, setDispDays] = useState(1)
  const [doseActual, setDoseActual] = useState(schedule.dose_actual?.toString() ?? '')
  const [notes, setNotes] = useState(schedule.notes ?? '')
  const [delayReason, setDelayReason] = useState(schedule.delay_reason ?? '')
  const [reductionReason, setReductionReason] = useState(schedule.reduction_reason ?? '')
  const [saving, setSaving] = useState(false)
  const [editingDate, setEditingDate] = useState(false)
  const [dateInput, setDateInput] = useState(displayDate)
  const [dateSaving, setDateSaving] = useState(false)

  // Local dose rate state (editable)
  const [localDosePerKg, setLocalDosePerKg] = useState<number | null>(schedule.dose_per_kg)
  const [localDosePerM2, setLocalDosePerM2] = useState<number | null>(schedule.dose_per_m2)
  const [editingDose, setEditingDose] = useState(false)
  const [doseKgInput, setDoseKgInput] = useState(schedule.dose_per_kg?.toString() ?? '')
  const [doseM2Input, setDoseM2Input] = useState(schedule.dose_per_m2?.toString() ?? '')
  const [doseSaving, setDoseSaving] = useState(false)

  const weightKgNum = bodyWeight ? parseFloat(bodyWeight) : null
  const strengthNum = strengthInput ? parseFloat(strengthInput) : null

  // Auto-fill doseActual when body weight or local dose rate changes
  useEffect(() => {
    if (weightKgNum && weightKgNum > 0) {
      const mg = calcDoseMg(weightKgNum, localDosePerKg, localDosePerM2, schedule.dose_calculated, species)
      if (mg != null) setDoseActual(String(mg))
    }
  }, [bodyWeight, localDosePerKg, localDosePerM2])

  const handleStatusClick = (status: string) => {
    if (status === 'completed' || status === 'reduced') {
      setActiveStatus(status)
      setShowForm(true)
    } else {
      handleSave(status)
    }
  }

  useEffect(() => {
    setDateInput(displayDate)
  }, [displayDate])

  const handleDateSave = async () => {
    if (!dateInput || dateInput === displayDate) { setEditingDate(false); return }
    setDateSaving(true)
    try {
      await updateScheduleDate(schedule.id, dateInput)
      onDateChanged(dateInput)
      setEditingDate(false)
      onUpdate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '날짜 수정 실패')
      setDateInput(displayDate)
    } finally {
      setDateSaving(false)
    }
  }

  const handleDoseSave = async () => {
    const newKg = doseKgInput !== '' ? parseFloat(doseKgInput) : null
    const newM2 = doseM2Input !== '' ? parseFloat(doseM2Input) : null
    if (newKg === localDosePerKg && newM2 === localDosePerM2) { setEditingDose(false); return }
    setDoseSaving(true)
    try {
      await updateScheduleDoseRate(schedule.id, newKg, newM2)
      setLocalDosePerKg(newKg)
      setLocalDosePerM2(newM2)
      setEditingDose(false)
      onUpdate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '용량 수정 실패')
    } finally {
      setDoseSaving(false)
    }
  }

  const handleSave = async (status?: string) => {
    setSaving(true)
    const s = status ?? activeStatus
    try {
      await updateScheduleStatus(schedule.id, s, {
        dose_actual: doseActual ? parseFloat(doseActual) : null,
        body_weight_at_visit: weightKgNum,
        notes: notes || null,
        delay_reason: delayReason || null,
        reduction_reason: reductionReason || null,
      })
      toast.success('업데이트되었습니다.')
      setShowForm(false)
      onUpdate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '업데이트 실패')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden', isSelected && 'ring-2 ring-rose-300')}>
      <div className="px-3 py-2 flex items-center gap-3 flex-wrap">
        {/* Checkbox */}
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          className="shrink-0"
        />

        {/* Date — inline editable */}
        <div className="flex items-center gap-1 shrink-0 group/date">
          {editingDate ? (
            <div className="flex items-center gap-1">
              <Input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleDateSave()
                  if (e.key === 'Escape') { setDateInput(displayDate); setEditingDate(false) }
                }}
                className="h-6 text-xs w-32 px-1.5"
                autoFocus
              />
              <button
                type="button"
                onClick={handleDateSave}
                disabled={dateSaving}
                className="text-emerald-600 hover:text-emerald-700"
              >
                {dateSaving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
              </button>
              <button
                type="button"
                onClick={() => { setDateInput(displayDate); setEditingDate(false) }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <>
              <span className="text-xs text-slate-500">{displayDate}</span>
              <button
                type="button"
                onClick={() => setEditingDate(true)}
                className="opacity-0 group-hover/date:opacity-100 text-slate-300 hover:text-slate-600 transition-opacity ml-0.5"
              >
                <Pencil size={11} />
              </button>
            </>
          )}
        </div>

        <span className="text-sm font-medium text-slate-800 flex-1 min-w-[100px]">{schedule.drug_name}</span>
        <span className="text-xs text-slate-400 uppercase">{schedule.drug_route}</span>
        {/* Dose rate — inline editable */}
        <div className="flex items-center gap-1 shrink-0 group/dose">
          {editingDose ? (
            <div className="flex items-center gap-1 flex-wrap">
              <div className="flex items-center gap-0.5">
                <Input
                  type="number" step="0.01"
                  value={doseKgInput}
                  onChange={(e) => setDoseKgInput(e.target.value)}
                  placeholder="mg/kg"
                  className="h-6 text-xs w-20 px-1.5"
                  autoFocus
                />
                <span className="text-[10px] text-slate-400">mg/kg</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Input
                  type="number" step="0.01"
                  value={doseM2Input}
                  onChange={(e) => setDoseM2Input(e.target.value)}
                  placeholder="mg/m²"
                  className="h-6 text-xs w-20 px-1.5"
                />
                <span className="text-[10px] text-slate-400">mg/m²</span>
              </div>
              <button
                type="button"
                onClick={handleDoseSave}
                disabled={doseSaving}
                className="text-emerald-600 hover:text-emerald-700"
              >
                {doseSaving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDoseKgInput(localDosePerKg?.toString() ?? '')
                  setDoseM2Input(localDosePerM2?.toString() ?? '')
                  setEditingDose(false)
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <>
              <span className="text-xs text-slate-600">
                {localDosePerKg != null
                  ? `${localDosePerKg} mg/kg`
                  : localDosePerM2 != null
                    ? `${localDosePerM2} mg/m²`
                    : schedule.dose_calculated != null
                      ? `${schedule.dose_calculated} mg`
                      : '—'}
              </span>
              <button
                type="button"
                onClick={() => setEditingDose(true)}
                className="opacity-0 group-hover/dose:opacity-100 text-slate-300 hover:text-slate-600 transition-opacity ml-0.5"
              >
                <Pencil size={11} />
              </button>
            </>
          )}
        </div>

        {/* Status buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleStatusClick(opt.value)}
              disabled={saving}
              className={cn(
                'px-2 py-0.5 rounded text-xs transition-colors',
                opt.className,
                schedule.status === opt.value && 'ring-2 ring-offset-1 ring-rose-400',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Adverse event shortcut */}
        <AdverseEventDialog
          caseId={caseId}
          caseProtocols={caseProtocols}
          initialDrugName={schedule.drug_name}
          trigger={
            <button
              type="button"
              title="부작용 기록"
              className="text-slate-300 hover:text-rose-500 transition-colors shrink-0"
            >
              <TriangleAlert size={14} />
            </button>
          }
        />
      </div>

      {/* Detail form for completed/reduced */}
      {showForm && (
        <div className="px-3 pb-3 pt-2 bg-slate-50 border-t space-y-3">
          {/* Body weight + Strength/Concentration */}
          <div className={cn('grid gap-3', oral ? 'grid-cols-3' : 'grid-cols-2')}>
            <div>
              <Label className="text-xs text-slate-600 mb-1">방문 시 체중 (kg)</Label>
              <Input
                type="number" step="0.1"
                value={bodyWeight}
                onChange={(e) => setBodyWeight(e.target.value)}
                className="h-7 text-xs" placeholder="0.0" autoFocus
              />
            </div>
            <div>
              <Label className="text-xs text-slate-600 mb-1">
                {oral ? '정제 용량 (mg/T or mg/C)' : '약물 농도 (mg/mL)'}
              </Label>
              <Input
                type="number" step="0.1"
                value={strengthInput}
                onChange={(e) => setStrengthInput(e.target.value)}
                className="h-7 text-xs"
                placeholder={oral ? '예: 25 (mg/정)' : '예: 1.0'}
              />
            </div>
            {oral && (
              <div>
                <Label className="text-xs text-slate-600 mb-1">일투수 (회/일)</Label>
                <Input
                  type="number" min={1} max={4}
                  value={dosesPerDay}
                  onChange={(e) => setDosesPerDay(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-7 text-xs"
                />
              </div>
            )}
          </div>

          {/* Oral: dispensing days */}
          {oral && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-600 mb-1">투여 일수 (일)</Label>
                <Input
                  type="number" min={1}
                  value={dispDays}
                  onChange={(e) => setDispDays(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-7 text-xs"
                />
              </div>
              <div className="flex items-end">
                <p className="text-[11px] text-slate-400 pb-1.5">
                  계산 = dose × 체중 × {dosesPerDay}회/일 × {dispDays}일 ÷ mg/정
                </p>
              </div>
            </div>
          )}

          {/* Auto-calculated dose display */}
          <DoseCalcDisplay
            weightKg={weightKgNum}
            dosePerKg={localDosePerKg}
            dosePerM2={localDosePerM2}
            doseCalculated={schedule.dose_calculated}
            strength={strengthNum}
            species={species}
            oral={oral}
            dosesPerDay={dosesPerDay}
            dispDays={dispDays}
          />

          {/* Actual dose override */}
          <div>
            <Label className="text-xs text-slate-600 mb-1">
              {`실제 투여량 (${(schedule.dose_unit || 'mg').split('/')[0]})`}
              <span className="ml-1 text-slate-400 font-normal">— 계산값과 다를 경우 수정</span>
            </Label>
            <Input
              type="number" step="0.01"
              value={doseActual}
              onChange={(e) => setDoseActual(e.target.value)}
              className="h-7 text-xs" placeholder="0.0"
            />
          </div>

          {activeStatus === 'delayed' && (
            <div>
              <Label className="text-xs text-slate-600 mb-1">연기 사유</Label>
              <Input
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
          )}
          {activeStatus === 'reduced' && (
            <div>
              <Label className="text-xs text-slate-600 mb-1">감량 사유</Label>
              <Input
                value={reductionReason}
                onChange={(e) => setReductionReason(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
          )}
          <div>
            <Label className="text-xs text-slate-600 mb-1">메모</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-14 text-xs resize-none"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleSave()}
              disabled={saving}
              className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              <CheckCircle size={12} className="mr-1" />
              저장
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowForm(false)}
              className="h-7 text-xs"
            >
              취소
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

interface Tab3DosingProps {
  caseId: string
  caseProtocols: OncologyCaseProtocolRow[]
  species: string
}

export default function Tab3Dosing({ caseId, caseProtocols, species }: Tab3DosingProps) {
  const router = useRouter()
  const [expandedProtocols, setExpandedProtocols] = useState<Set<string>>(
    new Set(caseProtocols.map((cp) => cp.id))
  )
  const [infoTab, setInfoTab] = useState<Record<string, InfoTab | null>>({})

  // ── Selection & bulk date shift ───────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [localDates, setLocalDates] = useState<Record<string, string>>({})
  const [customOffset, setCustomOffset] = useState('')
  const [pendingSaving, setPendingSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const allSchedules = caseProtocols.flatMap((cp) => cp.schedules)
  const allIds = allSchedules.map((s) => s.id)
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id))

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelected(allSelected ? new Set() : new Set(allIds))
  }

  const handleBulkShift = (offsetDays: number) => {
    if (selected.size === 0 || offsetDays === 0) return
    const ids = Array.from(selected)
    setLocalDates((prev) => {
      const next = { ...prev }
      for (const id of ids) {
        const base = next[id] ?? allSchedules.find((s) => s.id === id)?.scheduled_date ?? ''
        if (!base) continue
        const d = new Date(base)
        d.setDate(d.getDate() + offsetDays)
        next[id] = d.toISOString().split('T')[0]
      }
      return next
    })
  }

  const pendingCount = Object.keys(localDates).length

  const handleSavePendingDates = async () => {
    if (pendingCount === 0) return
    setPendingSaving(true)
    const updates = Object.entries(localDates).map(([id, newDate]) => ({ id, newDate }))
    try {
      await saveBulkScheduleDates(updates)
      toast.success(`${updates.length}개 날짜를 저장했습니다.`)
      setLocalDates({})
      setSelected(new Set())
      setCustomOffset('')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '날짜 저장 실패')
    } finally {
      setPendingSaving(false)
    }
  }

  const handleCancelPendingDates = () => {
    setLocalDates({})
    setSelected(new Set())
    setCustomOffset('')
  }

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return
    setDeleting(true)
    try {
      await deleteSchedules(Array.from(selected))
      toast.success(`${selected.size}개 일정이 삭제되었습니다.`)
      setSelected(new Set())
      setLocalDates({})
      setConfirmDelete(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '삭제 실패')
    } finally {
      setDeleting(false)
    }
  }

  const completed = allSchedules.filter((s) => s.status === 'completed').length
  const total = allSchedules.length
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  const CP_STATUS_CONFIG: Record<string, { label: string; badge: string; bar: string }> = {
    active:       { label: '진행 중', badge: 'bg-emerald-100 text-emerald-800', bar: 'bg-emerald-500' },
    completed:    { label: '완료',    badge: 'bg-blue-100 text-blue-800',       bar: 'bg-blue-500'   },
    discontinued: { label: '중단',    badge: 'bg-red-100 text-red-800',         bar: 'bg-red-400'    },
  }

  const perProtocolStats = caseProtocols.map((cp) => {
    const protCompleted = cp.schedules.filter((s) => s.status === 'completed').length
    const protTotal = cp.schedules.length
    return {
      id: cp.id,
      name: cp.protocol.protocol_name,
      status: cp.status,
      completed: protCompleted,
      total: protTotal,
      rate: protTotal > 0 ? Math.round((protCompleted / protTotal) * 100) : 0,
    }
  })

  const toggleProtocol = (id: string) => {
    setExpandedProtocols((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (caseProtocols.length === 0 || total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <ClipboardList size={40} className="mb-3 opacity-40" />
        <p className="text-sm">등록된 스케줄이 없습니다.</p>
        <p className="text-xs mt-1">프로토콜 탭에서 프로토콜을 먼저 추가하세요.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 프로토콜별 완료율 배너 */}
      <div className="bg-slate-50 rounded-lg p-3 border space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">프로토콜별 완료율</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} id="select-all" />
              <label htmlFor="select-all" className="text-xs text-slate-500 cursor-pointer">전체 선택</label>
            </div>
            <span className="text-xs text-slate-400">{completed}/{total}회</span>
          </div>
        </div>
        <div className="space-y-1.5">
          {perProtocolStats.map((stat) => {
            const cfg = CP_STATUS_CONFIG[stat.status] ?? { label: stat.status, badge: 'bg-slate-100 text-slate-600', bar: 'bg-slate-400' }
            return (
              <div key={stat.id} className="flex items-center gap-2">
                <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold', cfg.badge)}>
                  {cfg.label}
                </span>
                <span
                  className="text-[11px] text-slate-600 shrink-0 truncate"
                  style={{ width: '7rem' }}
                  title={stat.name}
                >
                  {stat.name}
                </span>
                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', cfg.bar)}
                    style={{ width: `${stat.rate}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 shrink-0 w-8 text-right">
                  {stat.rate}%
                </span>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {stat.completed}/{stat.total}회
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 미저장 변경사항 배너 */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 flex-wrap bg-amber-50 border border-amber-300 rounded-lg px-4 py-2.5">
          <CalendarDays size={14} className="text-amber-600 shrink-0" />
          <span className="text-xs font-semibold text-amber-800">
            {pendingCount}개 날짜 변경됨 — 아직 저장되지 않았습니다
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancelPendingDates}
              disabled={pendingSaving}
              className="h-7 text-xs border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              <X size={12} className="mr-1" />
              변경 취소
            </Button>
            <Button
              size="sm"
              onClick={handleSavePendingDates}
              disabled={pendingSaving}
              className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
            >
              {pendingSaving
                ? <Loader2 size={12} className="mr-1 animate-spin" />
                : <CheckCircle size={12} className="mr-1" />
              }
              저장
            </Button>
          </div>
        </div>
      )}

      {/* Bulk action toolbar */}
      {selected.size > 0 && (
        <div className="flex flex-col gap-2 bg-rose-50 border border-rose-200 rounded-lg px-4 py-2.5">
          {/* Top row: label + delete + deselect */}
          <div className="flex items-center gap-2 flex-wrap">
            <CalendarDays size={14} className="text-rose-500 shrink-0" />
            <span className="text-xs font-semibold text-rose-700 shrink-0">{selected.size}개 선택됨</span>

            {/* Delete section */}
            <div className="flex items-center gap-1.5 ml-auto">
              {confirmDelete ? (
                <>
                  <span className="text-xs text-red-700 font-semibold">정말 삭제하시겠습니까?</span>
                  <Button
                    size="sm"
                    onClick={handleDeleteSelected}
                    disabled={deleting}
                    className="h-6 text-xs px-2.5 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {deleting
                      ? <Loader2 size={11} className="animate-spin" />
                      : <><Trash2 size={11} className="mr-1" />삭제</>
                    }
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                    className="h-6 text-xs px-2 border-slate-300 text-slate-600 hover:bg-slate-50"
                  >
                    취소
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmDelete(true)}
                  className="h-6 text-xs px-2.5 border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={11} className="mr-1" />
                  선택 삭제
                </Button>
              )}
              <button
                type="button"
                onClick={() => { setSelected(new Set()); setConfirmDelete(false) }}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 ml-1"
              >
                <X size={12} /> 선택 해제
              </button>
            </div>
          </div>

          {/* Date shift row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-rose-600 shrink-0">날짜 조정:</span>
            {[-14, -7, -2, +2, +7, +14].map((d) => (
              <Button
                key={d}
                size="sm"
                variant="outline"
                onClick={() => handleBulkShift(d)}
                className={cn(
                  'h-6 text-xs px-2 border',
                  d < 0
                    ? 'border-blue-300 text-blue-700 hover:bg-blue-50'
                    : 'border-rose-300 text-rose-700 hover:bg-rose-50',
                )}
              >
                {d > 0 ? `+${d}일` : `${d}일`}
              </Button>
            ))}
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={customOffset}
                onChange={(e) => setCustomOffset(e.target.value)}
                placeholder="직접 입력"
                className="h-6 text-xs w-20 px-1.5"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={!customOffset}
                onClick={() => { handleBulkShift(parseInt(customOffset)); setCustomOffset('') }}
                className="h-6 text-xs px-2 border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                적용
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Per-protocol sections */}
      {caseProtocols.map((cp) => {
        const drugs = (cp.protocol.drugs as DrugItem[]) ?? []

        const grouped = cp.schedules.reduce<Record<number, OncologyScheduleRow[]>>((acc, s) => {
          acc[s.cycle_number] = acc[s.cycle_number] ?? []
          acc[s.cycle_number].push(s)
          return acc
        }, {})

        const currentInfoTab = infoTab[cp.id] ?? null

        const toggleInfoTab = (e: React.MouseEvent, tab: InfoTab) => {
          e.stopPropagation()
          setInfoTab((prev) => ({ ...prev, [cp.id]: prev[cp.id] === tab ? null : tab }))
        }

        return (
          <div key={cp.id} className="border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-rose-50">
              <div className="flex items-center gap-2 min-w-0">
                {(() => {
                  const cfg = CP_STATUS_CONFIG[cp.status]
                  return cfg ? (
                    <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold', cfg.badge)}>
                      {cfg.label}
                    </span>
                  ) : null
                })()}
                <button
                  type="button"
                  onClick={() => toggleProtocol(cp.id)}
                  className="font-semibold text-rose-800 text-left truncate hover:underline"
                >
                  {cp.protocol.protocol_name}
                </button>
                <button
                  type="button"
                  onClick={(e) => toggleInfoTab(e, 'adverse')}
                  className={cn(
                    'shrink-0 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors',
                    currentInfoTab === 'adverse'
                      ? 'bg-amber-400 border-amber-400 text-white'
                      : 'bg-white border-amber-300 text-amber-700 hover:bg-amber-50',
                  )}
                >
                  부작용
                </button>
                <button
                  type="button"
                  onClick={(e) => toggleInfoTab(e, 'caution')}
                  className={cn(
                    'shrink-0 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors',
                    currentInfoTab === 'caution'
                      ? 'bg-red-500 border-red-500 text-white'
                      : 'bg-white border-red-300 text-red-600 hover:bg-red-50',
                  )}
                >
                  금기/주의
                </button>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-slate-500">
                  {cp.completed_doses}/{cp.total_doses} 완료
                </span>
                <button type="button" onClick={() => toggleProtocol(cp.id)}>
                  {expandedProtocols.has(cp.id)
                    ? <ChevronUp size={16} className="text-rose-600" />
                    : <ChevronDown size={16} className="text-rose-600" />
                  }
                </button>
              </div>
            </div>

            {/* Info panel */}
            {currentInfoTab && (
              <ProtocolInfoPanel protocol={cp.protocol} activeTab={currentInfoTab} />
            )}

            {expandedProtocols.has(cp.id) && (
              <div className="p-3 space-y-4">
                {Object.entries(grouped).map(([cycle, rows]) => (
                  <div key={cycle}>
                    <div className="text-xs font-semibold text-slate-500 mb-2">사이클 {cycle}</div>
                    <div className="space-y-2">
                      {rows.map((sched) => {
                        const drug = drugs.find((d) => d.drug_name === sched.drug_name)
                        return (
                          <ScheduleRow
                            key={sched.id}
                            schedule={sched}
                            concentration={drug?.concentration ?? null}
                            species={species}
                            caseId={caseId}
                            caseProtocols={caseProtocols}
                            onUpdate={() => router.refresh()}
                            isSelected={selected.has(sched.id)}
                            onToggleSelect={() => toggleSelect(sched.id)}
                            displayDate={localDates[sched.id] ?? sched.scheduled_date}
                            onDateChanged={(newDate) =>
                              setLocalDates((prev) => ({ ...prev, [sched.id]: newDate }))
                            }
                          />
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
