'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils/utils'
import { saveQolRecord, updateQolRecord, deleteQolRecord } from '@/lib/actions/oncology/qol-actions'
import type { OncologyQolRecordRow, QolBehaviorChecklist } from '@/lib/services/oncology/fetch-oncology-case'
import { Heart, Loader2, Pencil, PlusCircle, Trash2, Stethoscope, User, Users, TrendingUp, TrendingDown, Minus } from 'lucide-react'

// ─── HHHHHMM 항목 정의 ─────────────────────────────────────────────────────
const HHHHHMM_ITEMS: {
  key: keyof Pick<OncologyQolRecordRow,
    'pain_score' | 'hunger_score' | 'hydration_score' | 'hygiene_score' |
    'happiness_score' | 'mobility_score' | 'good_days_score'>
  label: string
  labelEn: string
  low: string
  high: string
}[] = [
  { key: 'pain_score',      label: '통증 관리',    labelEn: 'Hurt',       low: '심한 통증',     high: '통증 없음' },
  { key: 'hunger_score',    label: '식욕',         labelEn: 'Hunger',     low: '전혀 안먹음',   high: '정상 식욕' },
  { key: 'hydration_score', label: '수분/배변',    labelEn: 'Hydration',  low: '심한 탈수·이상', high: '정상' },
  { key: 'hygiene_score',   label: '위생·청결',    labelEn: 'Hygiene',    low: '불량',          high: '양호' },
  { key: 'happiness_score', label: '정서·행복',    labelEn: 'Happiness',  low: '무기력·우울',   high: '활기·행복' },
  { key: 'mobility_score',  label: '이동성',       labelEn: 'Mobility',   low: '이동 불가',     high: '정상 이동' },
  { key: 'good_days_score', label: '좋은 날 비율', labelEn: 'More Good Days', low: '나쁜 날만',  high: '좋은 날만' },
]

const BEHAVIOR_ITEMS: { key: keyof QolBehaviorChecklist; label: string; inverted?: boolean }[] = [
  { key: 'plays_normally',     label: '좋아하는 활동/놀이에 참여함' },
  { key: 'social_interaction', label: '가족과 정상적으로 상호작용함' },
  { key: 'normal_sleep',       label: '수면 패턴 정상' },
  { key: 'toilet_normal',      label: '배변/배뇨 정상' },
  { key: 'grooming_normal',    label: '그루밍/위생 관리 정상' },
  { key: 'shows_interest',     label: '주변 환경에 관심을 보임' },
  { key: 'pain_vocalization',  label: '통증 행동 관찰됨 (신음, 경직, 보호 행동)', inverted: true },
]

// ─── 점수 색상 헬퍼 ───────────────────────────────────────────────────────
function scoreColor(v: number) {
  if (v >= 7) return 'text-emerald-600'
  if (v >= 4) return 'text-amber-500'
  return 'text-red-500'
}
function scoreBgColor(v: number) {
  if (v >= 7) return 'bg-emerald-100 text-emerald-800'
  if (v >= 4) return 'bg-amber-100 text-amber-800'
  return 'bg-red-100 text-red-800'
}
function totalColor(total: number) {
  if (total >= 50) return { text: 'text-emerald-700', bg: 'bg-emerald-100', label: '양호' }
  if (total >= 35) return { text: 'text-amber-600', bg: 'bg-amber-100', label: '경계' }
  return { text: 'text-red-700', bg: 'bg-red-100', label: '불량' }
}

// ─── ScorePicker (range 슬라이더 1-10) ───────────────────────────────────
function ScorePicker({ label, labelEn, low, high, value, onChange }: {
  label: string; labelEn: string; low: string; high: string
  value: number; onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-700">
          {label} <span className="text-slate-400 font-normal">({labelEn})</span>
        </span>
        <span className={cn('text-base font-bold tabular-nums w-6 text-right', scoreColor(value))}>{value}</span>
      </div>
      <input
        type="range" min={1} max={10} step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded cursor-pointer accent-slate-600"
      />
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  )
}

// ─── 요약 배지 (리스트 뷰용) ─────────────────────────────────────────────
function ScoreMini({ label, score }: { label: string; score: number | null }) {
  if (score == null) return null
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[36px]">
      <span className="text-[9px] text-slate-400 leading-none">{label}</span>
      <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded', scoreBgColor(score))}>{score}</span>
    </div>
  )
}

// ─── 보고자 토글 ─────────────────────────────────────────────────────────
type ReportedBy = 'vet' | 'owner' | 'both'
function ReporterToggle({ value, onChange }: { value: ReportedBy; onChange: (v: ReportedBy) => void }) {
  const btns: { v: ReportedBy; label: string; icon: React.ReactNode }[] = [
    { v: 'vet',   label: '수의사',    icon: <Stethoscope size={11} /> },
    { v: 'owner', label: '보호자',    icon: <User size={11} /> },
    { v: 'both',  label: '문진',      icon: <Users size={11} /> },
  ]
  return (
    <div className="flex gap-1.5">
      {btns.map(({ v, label, icon }) => (
        <button
          key={v} type="button" onClick={() => onChange(v)}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors',
            value === v
              ? 'bg-slate-700 border-slate-700 text-white'
              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50',
          )}
        >
          {icon}{label}
        </button>
      ))}
    </div>
  )
}

// ─── 기본 HHHHHMM 초기값 ─────────────────────────────────────────────────
const DEFAULT_SCORES = { pain: 5, hunger: 5, hydration: 5, hygiene: 5, happiness: 5, mobility: 5, goodDays: 5 }
const DEFAULT_CHECKLIST: QolBehaviorChecklist = {
  plays_normally: true, social_interaction: true, normal_sleep: true,
  toilet_normal: true, grooming_normal: true, shows_interest: true, pain_vocalization: false,
}

// ─── calcTotal ───────────────────────────────────────────────────────────
function calcTotal(r: OncologyQolRecordRow) {
  const scores = [r.pain_score, r.hunger_score, r.hydration_score, r.hygiene_score,
    r.happiness_score, r.mobility_score, r.good_days_score]
  const valid = scores.filter((s) => s != null) as number[]
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0)
}

// ─── Main Component ──────────────────────────────────────────────────────
interface Tab6QolProps {
  caseId: string
  qolRecords: OncologyQolRecordRow[]
}

export default function Tab6Qol({ caseId, qolRecords }: Tab6QolProps) {
  const [localRecords, setLocalRecords] = useState<OncologyQolRecordRow[]>(qolRecords)
  const [showForm, setShowForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState<OncologyQolRecordRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // form state
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0])
  const [bodyWeight, setBodyWeight] = useState('')
  const [reportedBy, setReportedBy] = useState<ReportedBy>('vet')

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

  const resetForm = () => {
    setEditingRecord(null)
    setVisitDate(new Date().toISOString().split('T')[0])
    setBodyWeight('')
    setReportedBy('vet')
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
    setReportedBy((record.reported_by as ReportedBy) ?? 'vet')
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
    reported_by: reportedBy,
    notes: notes || null,
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editingRecord) {
        const row = await updateQolRecord(editingRecord.id, buildPayload())
        toast.success('수정되었습니다.')
        setLocalRecords((prev) => prev.map((r) => (r.id === editingRecord.id ? row : r)))
      } else {
        const row = await saveQolRecord(buildPayload())
        toast.success('QoL 기록이 저장되었습니다.')
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

  const handleDelete = async (id: string) => {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return
    setDeleting(id)
    try {
      await deleteQolRecord(id)
      toast.success('삭제되었습니다.')
      setLocalRecords((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '삭제 실패')
    } finally {
      setDeleting(null)
    }
  }

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Heart size={16} className="text-rose-600" />
          QoL 트래킹 — HHHHHMM ({localRecords.length}건)
        </h3>
        <Button
          onClick={() => setShowForm((v) => !v)}
          variant="outline" size="sm"
          className="border-rose-300 text-rose-700 hover:bg-rose-50"
        >
          <PlusCircle size={14} className="mr-1" />
          방문 기록 추가
        </Button>
      </div>

      {/* ── 입력 폼 ────────────────────────────────────────────────────── */}
      {showForm && (
        <div className={cn(
          'border rounded-lg p-4 space-y-5',
          editingRecord ? 'border-blue-200 bg-blue-50/20' : 'border-rose-200 bg-rose-50/30',
        )}>
          {editingRecord && (
            <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-100 border border-blue-200 rounded-md px-3 py-2">
              <Pencil size={12} />
              <span>수정 중 — {editingRecord.visit_date}</span>
            </div>
          )}

          {/* 기본 정보 */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">기본 정보</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-600 mb-1">방문일</Label>
                <Input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-slate-600 mb-1">체중 (kg)</Label>
                <Input type="number" step="0.1" value={bodyWeight}
                  onChange={(e) => setBodyWeight(e.target.value)}
                  placeholder="0.0" className="h-8 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-600 mb-1.5">입력 주체</Label>
              <ReporterToggle value={reportedBy} onChange={setReportedBy} />
            </div>
          </div>

          {/* HHHHHMM 점수 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">HHHHHMM 평가 (각 1–10점)</p>
              <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', formTotalInfo.bg, formTotalInfo.text)}>
                총점 {formTotal}/70 — {formTotalInfo.label}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">35점 이상: 치료 지속 가능 / 35점 미만: 재평가 필요 (HHHHHMM scale)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {HHHHHMM_ITEMS.map((item) => (
                <ScorePicker
                  key={item.key}
                  label={item.label} labelEn={item.labelEn}
                  low={item.low} high={item.high}
                  value={scoreValues[item.key]}
                  onChange={scoreSetters[item.key]}
                />
              ))}
            </div>
          </div>

          {/* 임상 증상 (이번 주) */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">이번 주 증상 빈도</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-600 mb-1">구토/오심 (일수, 0–7)</Label>
                <Input type="number" min={0} max={7} value={nauseaDays}
                  onChange={(e) => setNauseaDays(Math.min(7, Math.max(0, Number(e.target.value))))}
                  className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-slate-600 mb-1">기력저하 (일수, 0–7)</Label>
                <Input type="number" min={0} max={7} value={lethargyDays}
                  onChange={(e) => setLethargyDays(Math.min(7, Math.max(0, Number(e.target.value))))}
                  className="h-8 text-sm" />
              </div>
            </div>
          </div>

          {/* 행동 체크리스트 */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">행동 체크리스트</p>
            <div className="space-y-2">
              {BEHAVIOR_ITEMS.map(({ key, label, inverted }) => {
                const checked = checklist[key] ?? (inverted ? false : true)
                const isAlert = inverted ? checked : !checked
                return (
                  <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!checked}
                      onChange={(e) => setCheck(key, e.target.checked)}
                      className="w-4 h-4 rounded accent-slate-600"
                    />
                    <span className={cn('text-sm', isAlert ? 'text-red-600 font-medium' : 'text-slate-700')}>
                      {label}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* 메모 */}
          <div>
            <Label className="text-xs text-slate-600 mb-1">메모</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="방문 시 특이사항, 추가 관찰 내용"
              className="h-16 text-sm resize-none" />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}
              className={cn(editingRecord ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700', 'text-white')}
              size="sm">
              {saving && <Loader2 size={13} className="mr-1.5 animate-spin" />}
              {editingRecord ? '수정 저장' : '저장'}
            </Button>
            <Button onClick={() => { resetForm(); setShowForm(false) }} variant="outline" size="sm">
              취소
            </Button>
          </div>
        </div>
      )}

      {/* ── 기록 목록 ─────────────────────────────────────────────────── */}
      {localRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Heart size={40} className="mb-3 opacity-40" />
          <p className="text-sm">QoL 기록이 없습니다.</p>
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
              ? BEHAVIOR_ITEMS.filter(({ key, inverted }) =>
                  inverted ? cl[key] === true : cl[key] === false
                )
              : []

            return (
              <div key={rec.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800">{rec.visit_date}</span>
                    {rec.body_weight != null && (
                      <span className="text-xs text-slate-500">{rec.body_weight} kg</span>
                    )}
                    {/* reported_by */}
                    <span className={cn(
                      'flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
                      rec.reported_by === 'vet' ? 'bg-blue-100 text-blue-700' :
                      rec.reported_by === 'owner' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-600',
                    )}>
                      {rec.reported_by === 'vet' && <><Stethoscope size={10} /> 수의사</>}
                      {rec.reported_by === 'owner' && <><User size={10} /> 보호자</>}
                      {rec.reported_by === 'both' && <><Users size={10} /> 문진</>}
                    </span>
                    {/* total score */}
                    {total != null && tc && (
                      <span className={cn('flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full', tc.bg, tc.text)}>
                        {trend === 'up' && <TrendingUp size={11} />}
                        {trend === 'down' && <TrendingDown size={11} />}
                        {trend === 'same' && <Minus size={11} />}
                        {total}/70 {tc.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button type="button" onClick={() => startEdit(rec)}
                      className="text-slate-400 hover:text-blue-500 transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button type="button" onClick={() => handleDelete(rec.id)}
                      disabled={deleting === rec.id}
                      className="text-slate-400 hover:text-red-500 transition-colors">
                      {deleting === rec.id
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>

                {/* HHHHHMM 점수 미니 뱃지 */}
                <div className="flex items-center gap-3 flex-wrap">
                  {HHHHHMM_ITEMS.map((item) => (
                    <ScoreMini key={item.key} label={item.labelEn} score={rec[item.key]} />
                  ))}
                </div>

                {/* 증상 빈도 */}
                {((rec.nausea_vomiting_days ?? 0) > 0 || (rec.lethargy_days ?? 0) > 0) && (
                  <div className="flex gap-3 text-xs text-slate-500">
                    {(rec.nausea_vomiting_days ?? 0) > 0 && (
                      <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                        구토/오심 {rec.nausea_vomiting_days}일
                      </span>
                    )}
                    {(rec.lethargy_days ?? 0) > 0 && (
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        기력저하 {rec.lethargy_days}일
                      </span>
                    )}
                  </div>
                )}

                {/* 행동 이상 항목 */}
                {alerts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {alerts.map(({ key, label }) => (
                      <span key={key} className="text-[11px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-200">
                        ⚠ {label}
                      </span>
                    ))}
                  </div>
                )}

                {rec.notes && (
                  <p className="text-sm text-slate-600 bg-slate-50 rounded p-2">{rec.notes}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
