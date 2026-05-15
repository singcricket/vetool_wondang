'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils/utils'
import { saveQolRecord, updateQolRecord, saveQolRecordPublic, updateQolRecordPublic } from '@/lib/actions/oncology/qol-actions'
import type { OncologyQolRecordRow, QolBehaviorChecklist } from '@/lib/services/oncology/fetch-oncology-case'
import { Heart, Loader2, Pencil, PlusCircle, TrendingDown, TrendingUp, Minus } from 'lucide-react'

// ─── HHHHHMM 항목 ────────────────────────────────────────────────────────────
const HHHHHMM_ITEMS: {
  key: keyof Pick<OncologyQolRecordRow,
    'pain_score' | 'hunger_score' | 'hydration_score' | 'hygiene_score' |
    'happiness_score' | 'mobility_score' | 'good_days_score'>
  label: string
  labelEn: string
  emoji: string
  low: string
  high: string
}[] = [
  { key: 'pain_score',      label: '통증 관리',    labelEn: 'Hurt',       emoji: '😣', low: '심한 통증',    high: '통증 없음' },
  { key: 'hunger_score',    label: '식욕',         labelEn: 'Hunger',     emoji: '🍽️', low: '전혀 안먹음',  high: '정상 식욕' },
  { key: 'hydration_score', label: '수분·배변',    labelEn: 'Hydration',  emoji: '💧', low: '탈수·이상',    high: '정상' },
  { key: 'hygiene_score',   label: '위생·청결',    labelEn: 'Hygiene',    emoji: '🧼', low: '불량',         high: '양호' },
  { key: 'happiness_score', label: '정서·행복',    labelEn: 'Happiness',  emoji: '😊', low: '무기력·우울',  high: '활기·행복' },
  { key: 'mobility_score',  label: '이동성',       labelEn: 'Mobility',   emoji: '🏃', low: '이동 불가',    high: '정상 이동' },
  { key: 'good_days_score', label: '좋은 날 비율', labelEn: 'More Good Days', emoji: '☀️', low: '나쁜 날만',  high: '좋은 날만' },
]

const BEHAVIOR_ITEMS: { key: keyof QolBehaviorChecklist; label: string; inverted?: boolean }[] = [
  { key: 'plays_normally',     label: '좋아하는 활동이나 놀이에 참여해요' },
  { key: 'social_interaction', label: '가족과 잘 어울려요' },
  { key: 'normal_sleep',       label: '수면이 정상이에요' },
  { key: 'toilet_normal',      label: '대소변을 잘 봐요' },
  { key: 'grooming_normal',    label: '털 관리를 스스로 해요' },
  { key: 'shows_interest',     label: '주변 환경에 관심을 보여요' },
  { key: 'pain_vocalization',  label: '아파서 신음하거나 불편한 행동이 보여요', inverted: true },
]

function scoreBg(v: number) {
  if (v >= 7) return 'bg-emerald-400'
  if (v >= 4) return 'bg-amber-400'
  return 'bg-red-400'
}
function totalColor(total: number) {
  if (total >= 50) return { text: 'text-emerald-700', bg: 'bg-emerald-100', label: '양호' }
  if (total >= 35) return { text: 'text-amber-600', bg: 'bg-amber-100', label: '경계' }
  return { text: 'text-red-700', bg: 'bg-red-100', label: '불량' }
}
function calcTotal(r: OncologyQolRecordRow): number | null {
  const vals = [r.pain_score, r.hunger_score, r.hydration_score, r.hygiene_score,
    r.happiness_score, r.mobility_score, r.good_days_score].filter((v) => v != null) as number[]
  return vals.length === 0 ? null : vals.reduce((a, b) => a + b, 0)
}

// ─── Score bar display in list view ─────────────────────────────────────────
function ScoreBar({ item, record }: { item: typeof HHHHHMM_ITEMS[0]; record: OncologyQolRecordRow }) {
  const v = record[item.key] ?? 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-base w-6 text-center shrink-0">{item.emoji}</span>
      <div className="flex-1">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', scoreBg(v))} style={{ width: `${v * 10}%` }} />
        </div>
      </div>
      <span className="text-xs font-semibold text-slate-600 w-5 text-right shrink-0">{v}</span>
    </div>
  )
}

// ─── ScorePicker for form ─────────────────────────────────────────────────────
function ScorePicker({ label, labelEn, emoji, low, high, value, onChange }: {
  label: string; labelEn: string; emoji: string; low: string; high: string
  value: number; onChange: (v: number) => void
}) {
  const color = value >= 7 ? 'text-emerald-600' : value >= 4 ? 'text-amber-500' : 'text-red-500'
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
          <span>{emoji}</span>{label}
        </span>
        <span className={cn('text-base font-bold tabular-nums w-6 text-right', color)}>{value}</span>
      </div>
      <input
        type="range" min={1} max={10} step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded cursor-pointer accent-rose-500"
      />
      <div className="flex justify-between text-[11px] text-slate-400">
        <span>{low}</span><span>{high}</span>
      </div>
    </div>
  )
}

const DEFAULT_SCORES = { pain: 5, hunger: 5, hydration: 5, hygiene: 5, happiness: 5, mobility: 5, goodDays: 5 }
const DEFAULT_CHECKLIST: QolBehaviorChecklist = {
  plays_normally: true, social_interaction: true, normal_sleep: true,
  toilet_normal: true, grooming_normal: true, shows_interest: true, pain_vocalization: false,
}

// ─── Main ────────────────────────────────────────────────────────────────────
interface OwnerTab4QolProps {
  caseId: string
  qolRecords: OncologyQolRecordRow[]
  readOnly?: boolean
  usePublicAction?: boolean
}

export default function OwnerTab4Qol({ caseId, qolRecords, readOnly = false, usePublicAction = false }: OwnerTab4QolProps) {
  const [localRecords, setLocalRecords] = useState<OncologyQolRecordRow[]>(qolRecords)
  const [showForm, setShowForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState<OncologyQolRecordRow | null>(null)
  const [saving, setSaving] = useState(false)

  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0])
  const [bodyWeight, setBodyWeight] = useState('')
  const [painScore, setPainScore] = useState(DEFAULT_SCORES.pain)
  const [hungerScore, setHungerScore] = useState(DEFAULT_SCORES.hunger)
  const [hydrationScore, setHydrationScore] = useState(DEFAULT_SCORES.hydration)
  const [hygieneScore, setHygieneScore] = useState(DEFAULT_SCORES.hygiene)
  const [happinessScore, setHappinessScore] = useState(DEFAULT_SCORES.happiness)
  const [mobilityScore, setMobilityScore] = useState(DEFAULT_SCORES.mobility)
  const [goodDaysScore, setGoodDaysScore] = useState(DEFAULT_SCORES.goodDays)
  const [nauseaDays, setNauseaDays] = useState(0)
  const [lethargyDays, setLethargyDays] = useState(0)
  const [checklist, setChecklist] = useState<QolBehaviorChecklist>({ ...DEFAULT_CHECKLIST })
  const [notes, setNotes] = useState('')

  const formTotal = painScore + hungerScore + hydrationScore + hygieneScore + happinessScore + mobilityScore + goodDaysScore
  const formTotalInfo = totalColor(formTotal)

  const setCheck = (key: keyof QolBehaviorChecklist, val: boolean) =>
    setChecklist((prev) => ({ ...prev, [key]: val }))

  const scoreSetters: Record<string, (v: number) => void> = {
    pain_score: setPainScore, hunger_score: setHungerScore, hydration_score: setHydrationScore,
    hygiene_score: setHygieneScore, happiness_score: setHappinessScore, mobility_score: setMobilityScore,
    good_days_score: setGoodDaysScore,
  }
  const scoreValues: Record<string, number> = {
    pain_score: painScore, hunger_score: hungerScore, hydration_score: hydrationScore,
    hygiene_score: hygieneScore, happiness_score: happinessScore, mobility_score: mobilityScore,
    good_days_score: goodDaysScore,
  }

  const resetForm = () => {
    setEditingRecord(null)
    setVisitDate(new Date().toISOString().split('T')[0])
    setBodyWeight('')
    setPainScore(DEFAULT_SCORES.pain); setHungerScore(DEFAULT_SCORES.hunger)
    setHydrationScore(DEFAULT_SCORES.hydration); setHygieneScore(DEFAULT_SCORES.hygiene)
    setHappinessScore(DEFAULT_SCORES.happiness); setMobilityScore(DEFAULT_SCORES.mobility)
    setGoodDaysScore(DEFAULT_SCORES.goodDays)
    setNauseaDays(0); setLethargyDays(0)
    setChecklist({ ...DEFAULT_CHECKLIST })
    setNotes('')
  }

  const startEdit = (record: OncologyQolRecordRow) => {
    setEditingRecord(record)
    setVisitDate(record.visit_date)
    setBodyWeight(record.body_weight?.toString() ?? '')
    setPainScore(record.pain_score ?? DEFAULT_SCORES.pain)
    setHungerScore(record.hunger_score ?? DEFAULT_SCORES.hunger)
    setHydrationScore(record.hydration_score ?? DEFAULT_SCORES.hydration)
    setHygieneScore(record.hygiene_score ?? DEFAULT_SCORES.hygiene)
    setHappinessScore(record.happiness_score ?? DEFAULT_SCORES.happiness)
    setMobilityScore(record.mobility_score ?? DEFAULT_SCORES.mobility)
    setGoodDaysScore(record.good_days_score ?? DEFAULT_SCORES.goodDays)
    setNauseaDays(record.nausea_vomiting_days ?? 0)
    setLethargyDays(record.lethargy_days ?? 0)
    setChecklist(record.behavior_checklist ?? { ...DEFAULT_CHECKLIST })
    setNotes(record.notes ?? '')
    setShowForm(true)
  }

  const buildPayload = () => ({
    case_id: caseId,
    visit_date: visitDate,
    body_weight: bodyWeight ? parseFloat(bodyWeight) : null,
    pain_score: painScore,
    hunger_score: hungerScore,
    hydration_score: hydrationScore,
    hygiene_score: hygieneScore,
    happiness_score: happinessScore,
    mobility_score: mobilityScore,
    good_days_score: goodDaysScore,
    nausea_vomiting_days: nauseaDays,
    lethargy_days: lethargyDays,
    behavior_checklist: checklist,
    reported_by: 'owner' as const,
    notes: notes || null,
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editingRecord) {
        const row = await (usePublicAction ? updateQolRecordPublic : updateQolRecord)(editingRecord.id, buildPayload())
        toast.success('수정되었습니다.')
        setLocalRecords((prev) => prev.map((r) => (r.id === editingRecord.id ? row : r)))
      } else {
        const row = await (usePublicAction ? saveQolRecordPublic : saveQolRecord)(buildPayload())
        toast.success('컨디션 기록이 저장되었습니다.')
        setLocalRecords((prev) => [row, ...prev])
      }
      resetForm()
      setShowForm(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart size={16} className="text-rose-500" />
          <h3 className="text-sm font-semibold text-slate-800">컨디션 기록 ({localRecords.length}건)</h3>
        </div>
        {!readOnly && (
          <Button
            variant="outline" size="sm"
            onClick={() => setShowForm((v) => !v)}
            className="border-rose-300 text-rose-700 hover:bg-rose-50"
          >
            <PlusCircle size={13} className="mr-1.5" />
            기록 추가
          </Button>
        )}
      </div>

      {/* Intro */}
      {!showForm && (
        <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-sm text-indigo-800 leading-relaxed">
          반려동물의 컨디션을 7가지 항목으로 평가합니다 (각 1–10점, 총 70점 만점).
          <span className="font-semibold"> 35점 이상</span>이면 치료를 잘 견디고 있는 상태입니다.
          정기적으로 기록하면 담당 수의사가 치료 경과를 더 잘 파악할 수 있습니다.
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className={cn(
          'rounded-xl border p-5 space-y-5',
          editingRecord ? 'border-blue-200 bg-blue-50/20' : 'border-rose-200 bg-rose-50/20',
        )}>
          {editingRecord && (
            <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-100 border border-blue-200 rounded-lg px-3 py-2">
              <Pencil size={12} />
              수정 중 — {editingRecord.visit_date}
            </div>
          )}

          {/* 날짜·체중 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-600 mb-1">날짜</Label>
              <Input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-slate-600 mb-1">체중 (kg, 선택)</Label>
              <Input type="number" step="0.1" value={bodyWeight}
                onChange={(e) => setBodyWeight(e.target.value)}
                placeholder="0.0" className="h-9 text-sm" />
            </div>
          </div>

          {/* 총점 미리보기 */}
          <div className={cn('flex items-center justify-between rounded-lg px-3 py-2', formTotalInfo.bg)}>
            <span className={cn('text-sm font-semibold', formTotalInfo.text)}>현재 총점</span>
            <span className={cn('text-lg font-bold', formTotalInfo.text)}>
              {formTotal}/70 — {formTotalInfo.label}
            </span>
          </div>

          {/* HHHHHMM 슬라이더 */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">컨디션 평가 (1점 = 나쁨, 10점 = 좋음)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              {HHHHHMM_ITEMS.map((item) => (
                <ScorePicker
                  key={item.key}
                  label={item.label} labelEn={item.labelEn} emoji={item.emoji}
                  low={item.low} high={item.high}
                  value={scoreValues[item.key]}
                  onChange={scoreSetters[item.key]}
                />
              ))}
            </div>
          </div>

          {/* 증상 빈도 */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">이번 주 증상 (일수)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-600 mb-1">구토 / 메스꺼움 (0–7일)</Label>
                <Input type="number" min={0} max={7} value={nauseaDays}
                  onChange={(e) => setNauseaDays(Math.min(7, Math.max(0, Number(e.target.value))))}
                  className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-slate-600 mb-1">기력 저하 (0–7일)</Label>
                <Input type="number" min={0} max={7} value={lethargyDays}
                  onChange={(e) => setLethargyDays(Math.min(7, Math.max(0, Number(e.target.value))))}
                  className="h-9 text-sm" />
              </div>
            </div>
          </div>

          {/* 행동 체크리스트 */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">행동 체크리스트</p>
            <div className="space-y-3">
              {BEHAVIOR_ITEMS.map(({ key, label, inverted }) => {
                const checked = checklist[key] ?? (inverted ? false : true)
                const isAlert = inverted ? checked : !checked
                return (
                  <label key={key} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!checked}
                      onChange={(e) => setCheck(key, e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded accent-rose-500 shrink-0"
                    />
                    <span className={cn('text-sm leading-snug', isAlert ? 'text-red-600 font-medium' : 'text-slate-700')}>
                      {label}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* 메모 */}
          <div>
            <Label className="text-xs text-slate-600 mb-1">메모 (선택)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="특이사항이나 추가로 전달하고 싶은 내용을 적어주세요"
              className="h-16 text-sm resize-none" />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className={cn(editingRecord ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700', 'text-white')}
            >
              {saving && <Loader2 size={13} className="mr-1.5 animate-spin" />}
              {editingRecord ? '수정 저장' : '저장'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { resetForm(); setShowForm(false) }}>
              취소
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {localRecords.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Heart size={40} className="mb-3 opacity-40" />
          <p className="text-sm">아직 기록이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {localRecords.map((rec, idx) => {
            const total = calcTotal(rec)
            const tc = total != null ? totalColor(total) : null
            const prevTotal = idx < localRecords.length - 1 ? calcTotal(localRecords[idx + 1]) : null
            const trend = total != null && prevTotal != null
              ? total > prevTotal ? 'up' : total < prevTotal ? 'down' : 'same'
              : null

            const cl = rec.behavior_checklist
            const alerts = cl
              ? BEHAVIOR_ITEMS.filter(({ key, inverted }) => inverted ? cl[key] === true : cl[key] === false)
              : []

            return (
              <div key={rec.id} className="rounded-xl border bg-white p-4 space-y-3">
                {/* Header row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800">{rec.visit_date}</span>
                    {rec.body_weight != null && (
                      <span className="text-xs text-slate-500">{rec.body_weight} kg</span>
                    )}
                    {total != null && tc && (
                      <span className={cn('flex items-center gap-1 text-sm font-bold px-2.5 py-0.5 rounded-full', tc.bg, tc.text)}>
                        {trend === 'up' && <TrendingUp size={13} />}
                        {trend === 'down' && <TrendingDown size={13} />}
                        {trend === 'same' && <Minus size={13} />}
                        {total}/70 {tc.label}
                      </span>
                    )}
                  </div>
                  {!readOnly && rec.reported_by !== 'vet' && (
                    <button
                      type="button"
                      onClick={() => startEdit(rec)}
                      className="text-slate-400 hover:text-blue-500 transition-colors shrink-0"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </div>

                {/* Score bars */}
                {total != null && (
                  <div className="space-y-1.5">
                    {HHHHHMM_ITEMS.map((item) => (
                      <ScoreBar key={item.key} item={item} record={rec} />
                    ))}
                  </div>
                )}

                {/* Symptom frequency */}
                {((rec.nausea_vomiting_days ?? 0) > 0 || (rec.lethargy_days ?? 0) > 0) && (
                  <div className="flex gap-2 flex-wrap text-xs">
                    {(rec.nausea_vomiting_days ?? 0) > 0 && (
                      <span className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full">
                        구토/메스꺼움 {rec.nausea_vomiting_days}일
                      </span>
                    )}
                    {(rec.lethargy_days ?? 0) > 0 && (
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                        기력 저하 {rec.lethargy_days}일
                      </span>
                    )}
                  </div>
                )}

                {/* Behavior alerts */}
                {alerts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {alerts.map(({ key, label }) => (
                      <span key={key} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100">
                        ⚠ {label}
                      </span>
                    ))}
                  </div>
                )}

                {rec.notes && (
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">{rec.notes}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
