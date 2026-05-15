'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils/utils'
import { saveResponseEval, updateResponseEval, deleteResponseEval } from '@/lib/actions/oncology/response-eval-actions'
import type {
  OncologyResponseEvalRow, OncologyCaseProtocolRow, ResponseTargetLesion,
} from '@/lib/services/oncology/fetch-oncology-case'
import {
  BarChart3, Loader2, Pencil, PlusCircle, Trash2, Info, Plus, X,
  TrendingDown, TrendingUp, Minus, ChevronDown, ChevronUp,
} from 'lucide-react'

// ─── 상수 ────────────────────────────────────────────────────────────────────

const CRITERIA_SYSTEMS = [
  { value: 'RECIST1.1', label: 'RECIST 1.1', desc: '고형 종양 표준 — 최장 직경 합계 기준' },
  { value: 'WHO',       label: 'WHO',         desc: '고형 종양 — 두 직경 곱의 합계 기준' },
  { value: 'VCOG',      label: 'VCOG',        desc: '수의 림프종·혈액종양 — WHO 변형' },
  { value: 'clinical',  label: '임상 평가',   desc: '영상 없이 신체검사·증상 기반 평가' },
]

const MODALITY_OPTIONS = [
  'Radiograph', 'Ultrasound', 'CT', 'MRI', 'PET-CT',
  'Physical Exam', 'Lymph Node Size', 'Blood Marker', 'Cytology', 'Other',
]

const RESPONSE_TYPES: { value: string; label: string; labelKo: string; color: string }[] = [
  { value: 'CR', label: 'CR', labelKo: '완전관해',  color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { value: 'PR', label: 'PR', labelKo: '부분관해',  color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'SD', label: 'SD', labelKo: '안정병변',  color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'PD', label: 'PD', labelKo: '진행병변',  color: 'bg-red-100 text-red-800 border-red-300' },
  { value: 'NE', label: 'NE', labelKo: '평가불가',  color: 'bg-slate-100 text-slate-600 border-slate-300' },
  { value: 'NA', label: 'NA', labelKo: '해당없음',  color: 'bg-slate-100 text-slate-500 border-slate-200' },
]

const NON_TARGET_OPTIONS = [
  { value: 'NA',              label: '해당없음 (비표적 없음)' },
  { value: 'CR',              label: 'CR — 비표적 병변 완전 소실' },
  { value: 'Non-CR/Non-PD',   label: 'Non-CR/Non-PD — 잔존하나 PD 미충족' },
  { value: 'PD',              label: 'PD — 비표적 병변 명백한 진행' },
  { value: 'NE',              label: 'NE — 평가 불가' },
]

const CLINICAL_IMPRESSIONS = [
  { value: 'improved', label: '호전', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { value: 'stable',   label: '안정', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { value: 'declined', label: '악화', color: 'text-red-700 bg-red-50 border-red-200' },
  { value: 'unknown',  label: '불명확', color: 'text-slate-600 bg-slate-50 border-slate-200' },
]

const RESPONSE_COLOR: Record<string, string> = {
  CR: 'bg-emerald-100 text-emerald-800',
  PR: 'bg-blue-100 text-blue-800',
  SD: 'bg-yellow-100 text-yellow-800',
  PD: 'bg-red-100 text-red-800',
  NE: 'bg-slate-100 text-slate-600',
  NA: 'bg-slate-50 text-slate-400',
}

// ─── 평가 기준 정보 (Info 다이얼로그용) ─────────────────────────────────────

const CRITERIA_INFO = {
  RECIST1_1: {
    title: 'RECIST 1.1 — 고형 종양 (Solid Tumor)',
    summary: '표적 병변 최장 직경 합계(SLD) 기준. 현재 가장 널리 사용되는 표준.',
    table: [
      { resp: 'CR',  def: '완전관해', criteria: '모든 표적 병변 소실 (림프절 < 10mm의 단축)' },
      { resp: 'PR',  def: '부분관해', criteria: 'SLD 기준 합계 ≥ 30% 감소 (새 병변 없음)' },
      { resp: 'SD',  def: '안정병변', criteria: 'PR/PD 기준 미충족 (−30% ~ +20% 범위)' },
      { resp: 'PD',  def: '진행병변', criteria: 'SLD ≥ 20% 증가 + 최소 5mm 절대 증가, 또는 새 병변 발생' },
    ],
  },
  WHO: {
    title: 'WHO 기준 — 이차원 측정 (Bidimensional)',
    summary: '두 직경(최장 × 수직) 곱의 합계(SPD) 기준. 구형 종양 또는 림프절 측정에 유용.',
    table: [
      { resp: 'CR', def: '완전관해', criteria: '모든 병변 완전 소실' },
      { resp: 'PR', def: '부분관해', criteria: 'SPD ≥ 50% 감소' },
      { resp: 'SD', def: '안정병변', criteria: '−50% ~ +25% 범위' },
      { resp: 'PD', def: '진행병변', criteria: 'SPD ≥ 25% 증가 또는 새 병변' },
    ],
  },
  VCOG: {
    title: 'VCOG 기준 — 수의 림프종·혈액종양',
    summary: 'Veterinary Cooperative Oncology Group. WHO 변형. 림프절 이차원 측정 기반.',
    table: [
      { resp: 'CR', def: '완전관해', criteria: '모든 병변 해소, 림프절 정상 크기 회복' },
      { resp: 'PR', def: '부분관해', criteria: '이차원 측정 합계 ≥ 50% 감소' },
      { resp: 'SD', def: '안정병변', criteria: '< 50% 감소 또는 < 25% 증가' },
      { resp: 'PD', def: '진행병변', criteria: '이차원 측정 ≥ 25% 증가 또는 새 병변' },
    ],
  },
}

const OVERALL_DETERMINATION_TABLE = [
  { target: 'CR', nonTarget: 'CR',            newLesion: '없음', overall: 'CR' },
  { target: 'CR', nonTarget: 'Non-CR/Non-PD', newLesion: '없음', overall: 'PR' },
  { target: 'PR', nonTarget: 'CR/Non-CR/Non-PD', newLesion: '없음', overall: 'PR' },
  { target: 'SD', nonTarget: '모두',          newLesion: '없음', overall: 'SD' },
  { target: '모두', nonTarget: 'PD',          newLesion: '관계없음', overall: 'PD' },
  { target: '모두', nonTarget: '모두',         newLesion: '있음', overall: 'PD' },
  { target: 'PD', nonTarget: '모두',           newLesion: '관계없음', overall: 'PD' },
]

// ─── 자동 반응 제안 ──────────────────────────────────────────────────────────

function suggestOverallResponse(
  pctChange: number | null,
  sumCurrent: number | null,
  nonTargetStatus: string,
  newLesions: boolean,
  criteria: string,
  hasTargetLesions: boolean,
): string {
  if (newLesions) return 'PD'
  if (nonTargetStatus === 'PD') return 'PD'
  if (!hasTargetLesions && criteria !== 'clinical') return 'NE'

  if (criteria === 'RECIST1.1') {
    if (sumCurrent === 0 && nonTargetStatus === 'CR') return 'CR'
    if (sumCurrent === 0) return 'PR'
    if (pctChange !== null && pctChange <= -30) return 'PR'
    if (pctChange !== null && pctChange >= 20) return 'PD'
    if (pctChange !== null) return 'SD'
  }
  if (criteria === 'WHO' || criteria === 'VCOG') {
    if (sumCurrent === 0) return 'CR'
    if (pctChange !== null && pctChange <= -50) return 'PR'
    if (pctChange !== null && pctChange >= 25) return 'PD'
    if (pctChange !== null) return 'SD'
  }
  return 'NE'
}

// ─── 서브 컴포넌트들 ─────────────────────────────────────────────────────────

function CriteriaInfoDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="text-slate-400 hover:text-blue-600 transition-colors">
          <Info size={14} />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info size={16} className="text-blue-600" />
            치료 반응 평가 기준 안내
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 text-sm">
          {/* RECIST 1.1 */}
          {[
            { key: 'RECIST1_1', data: CRITERIA_INFO.RECIST1_1 },
            { key: 'WHO', data: CRITERIA_INFO.WHO },
            { key: 'VCOG', data: CRITERIA_INFO.VCOG },
          ].map(({ key, data }) => (
            <div key={key} className="border rounded-lg p-3 space-y-2">
              <p className="font-semibold text-slate-800">{data.title}</p>
              <p className="text-xs text-slate-500">{data.summary}</p>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left p-1.5 border border-slate-200 w-10">반응</th>
                    <th className="text-left p-1.5 border border-slate-200 w-20">용어</th>
                    <th className="text-left p-1.5 border border-slate-200">기준</th>
                  </tr>
                </thead>
                <tbody>
                  {data.table.map((row) => (
                    <tr key={row.resp}>
                      <td className="p-1.5 border border-slate-200">
                        <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded', RESPONSE_COLOR[row.resp])}>
                          {row.resp}
                        </span>
                      </td>
                      <td className="p-1.5 border border-slate-200 text-slate-700">{row.def}</td>
                      <td className="p-1.5 border border-slate-200 text-slate-600">{row.criteria}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* Overall determination */}
          <div className="border rounded-lg p-3 space-y-2">
            <p className="font-semibold text-slate-800">전체 반응 판정 (RECIST 1.1 기준)</p>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left p-1.5 border border-slate-200">표적 병변</th>
                  <th className="text-left p-1.5 border border-slate-200">비표적 병변</th>
                  <th className="text-left p-1.5 border border-slate-200">새 병변</th>
                  <th className="text-left p-1.5 border border-slate-200">전체 반응</th>
                </tr>
              </thead>
              <tbody>
                {OVERALL_DETERMINATION_TABLE.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? '' : 'bg-slate-50/50'}>
                    <td className="p-1.5 border border-slate-200">{row.target}</td>
                    <td className="p-1.5 border border-slate-200">{row.nonTarget}</td>
                    <td className="p-1.5 border border-slate-200">{row.newLesion}</td>
                    <td className="p-1.5 border border-slate-200">
                      <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded', RESPONSE_COLOR[row.overall])}>
                        {row.overall}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Clinical impression note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1">
            <p className="font-semibold">임상 평가(Clinical Impression) 주의사항</p>
            <p>영상 기준(RECIST/WHO)과 임상 인상이 다를 수 있습니다. 예: 영상에서 SD이지만 QoL 현저 개선 시 임상적으로 호전 기록 가능.</p>
            <p>항암 치료의 반응 평가는 영상 기준을 우선하되, 임상 소견을 보조 데이터로 함께 기록하세요.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ResponseTypeBadge({ value }: { value: string }) {
  const rt = RESPONSE_TYPES.find((r) => r.value === value)
  if (!rt) return <span className="text-xs text-slate-400">{value}</span>
  return (
    <span className={cn('text-sm font-bold px-3 py-0.5 rounded-full border', rt.color)}>
      {rt.label} — {rt.labelKo}
    </span>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface Tab5ResponseProps {
  caseId: string
  responseEvals: OncologyResponseEvalRow[]
  caseProtocols: OncologyCaseProtocolRow[]
}

export default function Tab5Response({ caseId, responseEvals, caseProtocols }: Tab5ResponseProps) {
  const [localEvals, setLocalEvals] = useState<OncologyResponseEvalRow[]>(responseEvals)
  const [showForm, setShowForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState<OncologyResponseEvalRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // form state
  const [evalDate, setEvalDate] = useState(new Date().toISOString().split('T')[0])
  const [caseProtocolId, setCaseProtocolId] = useState('none')
  const [criteriaSystem, setCriteriaSystem] = useState<'RECIST1.1' | 'WHO' | 'VCOG' | 'clinical'>('RECIST1.1')
  const [selectedModalities, setSelectedModalities] = useState<string[]>([])
  const [targetLesions, setTargetLesions] = useState<ResponseTargetLesion[]>([])
  const [nonTargetStatus, setNonTargetStatus] = useState('NA')
  const [newLesions, setNewLesions] = useState(false)
  const [newLesionsDesc, setNewLesionsDesc] = useState('')
  const [overallResponse, setOverallResponse] = useState('')
  const [autoSuggested, setAutoSuggested] = useState('')
  const [clinicalImpression, setClinicalImpression] = useState('')
  const [markerName, setMarkerName] = useState('')
  const [markerBaseline, setMarkerBaseline] = useState('')
  const [markerCurrent, setMarkerCurrent] = useState('')
  const [markerUnit, setMarkerUnit] = useState('')
  const [showMarker, setShowMarker] = useState(false)
  const [notes, setNotes] = useState('')

  // ── 자동 계산 ──────────────────────────────────────────────────────────────
  const sumBaseline = targetLesions.reduce((s, l) => s + (l.baseline_mm ?? 0), 0)
  const sumCurrent = targetLesions.reduce((s, l) => s + (l.current_mm ?? 0), 0)
  const hasBaseline = targetLesions.some((l) => l.baseline_mm != null)
  const hasCurrent = targetLesions.some((l) => l.current_mm != null)
  const pctChange = hasBaseline && hasCurrent && sumBaseline > 0
    ? Math.round(((sumCurrent - sumBaseline) / sumBaseline) * 100)
    : null

  useEffect(() => {
    if (criteriaSystem === 'clinical') { setAutoSuggested(''); return }
    const suggested = suggestOverallResponse(
      pctChange, sumCurrent, nonTargetStatus, newLesions, criteriaSystem, targetLesions.length > 0,
    )
    setAutoSuggested(suggested)
    setOverallResponse(suggested)
  }, [pctChange, sumCurrent, nonTargetStatus, newLesions, criteriaSystem, targetLesions.length])

  const toggleModality = (m: string) =>
    setSelectedModalities((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m])

  const addLesion = () => {
    const id = `T${targetLesions.length + 1}`
    setTargetLesions((prev) => [...prev, { id, location: '', baseline_mm: null, current_mm: null }])
  }

  const updateLesion = (idx: number, field: keyof ResponseTargetLesion, val: string | number | null) =>
    setTargetLesions((prev) => prev.map((l, i) => i === idx ? { ...l, [field]: val } : l))

  const removeLesion = (idx: number) =>
    setTargetLesions((prev) => prev.filter((_, i) => i !== idx))

  const resetForm = () => {
    setEditingRecord(null)
    setEvalDate(new Date().toISOString().split('T')[0])
    setCaseProtocolId('none'); setCriteriaSystem('RECIST1.1')
    setSelectedModalities([]); setTargetLesions([])
    setNonTargetStatus('NA'); setNewLesions(false); setNewLesionsDesc('')
    setOverallResponse(''); setAutoSuggested(''); setClinicalImpression('')
    setMarkerName(''); setMarkerBaseline(''); setMarkerCurrent(''); setMarkerUnit('')
    setShowMarker(false); setNotes('')
  }

  const startEdit = (record: OncologyResponseEvalRow) => {
    setEditingRecord(record)
    setEvalDate(record.eval_date)
    setCaseProtocolId(record.case_protocol_id ?? 'none')
    setCriteriaSystem(record.criteria_system as typeof criteriaSystem)
    setSelectedModalities(record.modalities ?? [])
    setTargetLesions(record.target_lesions ?? [])
    setNonTargetStatus(record.non_target_status ?? 'NA')
    setNewLesions(record.new_lesions ?? false)
    setNewLesionsDesc(record.new_lesions_desc ?? '')
    setOverallResponse(record.overall_response)
    setAutoSuggested('')
    setClinicalImpression(record.clinical_impression ?? '')
    setMarkerName(record.marker_name ?? '')
    setMarkerBaseline(record.marker_baseline?.toString() ?? '')
    setMarkerCurrent(record.marker_current?.toString() ?? '')
    setMarkerUnit(record.marker_unit ?? '')
    setShowMarker(!!record.marker_name)
    setNotes(record.notes ?? '')
    setShowForm(true)
    setExpandedId(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const buildPayload = () => ({
    case_id: caseId,
    case_protocol_id: caseProtocolId === 'none' ? null : caseProtocolId,
    eval_date: evalDate,
    criteria_system: criteriaSystem,
    modalities: selectedModalities,
    target_lesions: targetLesions,
    sum_baseline_mm: hasBaseline ? sumBaseline : null,
    sum_current_mm: hasCurrent ? sumCurrent : null,
    percent_change: pctChange,
    non_target_status: nonTargetStatus,
    new_lesions: newLesions,
    new_lesions_desc: newLesionsDesc || null,
    overall_response: overallResponse,
    clinical_impression: clinicalImpression || null,
    marker_name: markerName || null,
    marker_baseline: markerBaseline ? parseFloat(markerBaseline) : null,
    marker_current: markerCurrent ? parseFloat(markerCurrent) : null,
    marker_unit: markerUnit || null,
    notes: notes || null,
  })

  const handleSave = async () => {
    if (!overallResponse) return toast.error('전체 반응 판정을 선택하세요.')
    if (criteriaSystem !== 'clinical' && selectedModalities.length === 0)
      return toast.error('평가 방법을 선택하세요.')
    setSaving(true)
    try {
      if (editingRecord) {
        const row = await updateResponseEval(editingRecord.id, buildPayload())
        toast.success('수정되었습니다.')
        setLocalEvals((prev) => prev.map((e) => (e.id === editingRecord.id ? row : e)))
      } else {
        const row = await saveResponseEval(buildPayload())
        toast.success('평가가 저장되었습니다.')
        setLocalEvals((prev) => [row, ...prev])
      }
      resetForm(); setShowForm(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 평가를 삭제하시겠습니까?')) return
    setDeleting(id)
    try {
      await deleteResponseEval(id)
      toast.success('삭제되었습니다.')
      setLocalEvals((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '삭제 실패')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <BarChart3 size={16} className="text-rose-600" />
          치료 반응 평가 ({localEvals.length}건)
          <CriteriaInfoDialog />
        </h3>
        <Button
          onClick={() => setShowForm((v) => !v)}
          variant="outline" size="sm"
          className="border-rose-300 text-rose-700 hover:bg-rose-50"
        >
          <PlusCircle size={14} className="mr-1" />
          평가 추가
        </Button>
      </div>

      {/* ── 입력 폼 ────────────────────────────────────────────────────── */}
      {showForm && (
        <div className={cn(
          'border rounded-lg p-4 space-y-5',
          editingRecord ? 'border-blue-200 bg-blue-50/20' : 'border-rose-200 bg-rose-50/20',
        )}>
          {editingRecord && (
            <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-100 border border-blue-200 rounded-md px-3 py-2">
              <Pencil size={12} />
              <span>수정 중 — {editingRecord.eval_date} / {editingRecord.overall_response}</span>
            </div>
          )}

          {/* 기본 정보 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-slate-600 mb-1">평가일</Label>
              <Input type="date" value={evalDate} onChange={(e) => setEvalDate(e.target.value)} className="h-8 text-sm" />
            </div>
            {caseProtocols.length > 0 && (
              <div>
                <Label className="text-xs text-slate-600 mb-1">연관 프로토콜</Label>
                <Select value={caseProtocolId} onValueChange={setCaseProtocolId}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">미지정</SelectItem>
                    {caseProtocols.map((cp) => (
                      <SelectItem key={cp.id} value={cp.id}>{cp.protocol.protocol_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* 평가 기준 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">평가 기준</p>
              <CriteriaInfoDialog />
            </div>
            <div className="flex gap-2 flex-wrap">
              {CRITERIA_SYSTEMS.map((cs) => (
                <button
                  key={cs.value} type="button"
                  onClick={() => setCriteriaSystem(cs.value as typeof criteriaSystem)}
                  title={cs.desc}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm border transition-all',
                    criteriaSystem === cs.value
                      ? 'bg-slate-800 border-slate-800 text-white font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {cs.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              {CRITERIA_SYSTEMS.find((c) => c.value === criteriaSystem)?.desc}
            </p>
          </div>

          {/* 평가 방법 (모달리티) */}
          {criteriaSystem !== 'clinical' && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">평가 방법 *</p>
              <div className="flex flex-wrap gap-2">
                {MODALITY_OPTIONS.map((m) => (
                  <button
                    key={m} type="button"
                    onClick={() => toggleModality(m)}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-xs border transition-all',
                      selectedModalities.includes(m)
                        ? 'bg-rose-600 border-rose-600 text-white'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 표적 병변 측정 */}
          {criteriaSystem !== 'clinical' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  표적 병변 (Target Lesions)
                </p>
                <button
                  type="button" onClick={addLesion}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  <Plus size={12} /> 병변 추가
                </button>
              </div>
              {targetLesions.length === 0 ? (
                <p className="text-xs text-slate-400">표적 병변이 없으면 비표적/임상 평가만으로 진행합니다.</p>
              ) : (
                <div className="space-y-2">
                  {/* column headers */}
                  <div className="grid grid-cols-[1fr_100px_100px_28px] gap-2 px-2">
                    <span className="text-[10px] text-slate-400">병변 위치</span>
                    <span className="text-[10px] text-slate-400">기준값 (mm)</span>
                    <span className="text-[10px] text-slate-400">현재값 (mm)</span>
                    <span />
                  </div>
                  {targetLesions.map((l, idx) => {
                    const change = l.baseline_mm && l.current_mm
                      ? Math.round(((l.current_mm - l.baseline_mm) / l.baseline_mm) * 100)
                      : null
                    return (
                      <div key={l.id} className="grid grid-cols-[1fr_100px_100px_28px] gap-2 items-center">
                        <Input
                          value={l.location}
                          onChange={(e) => updateLesion(idx, 'location', e.target.value)}
                          placeholder={`T${idx + 1} 위치 (예: 비장 종괴)`}
                          className="h-7 text-xs"
                        />
                        <Input
                          type="number" step="0.1"
                          value={l.baseline_mm ?? ''}
                          onChange={(e) => updateLesion(idx, 'baseline_mm', e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="0.0"
                          className="h-7 text-xs"
                        />
                        <div className="relative">
                          <Input
                            type="number" step="0.1"
                            value={l.current_mm ?? ''}
                            onChange={(e) => updateLesion(idx, 'current_mm', e.target.value ? parseFloat(e.target.value) : null)}
                            placeholder="0.0"
                            className="h-7 text-xs pr-12"
                          />
                          {change !== null && (
                            <span className={cn(
                              'absolute right-1.5 top-1 text-[10px] font-semibold tabular-nums',
                              change < 0 ? 'text-emerald-600' : change > 0 ? 'text-red-600' : 'text-slate-400',
                            )}>
                              {change > 0 ? '+' : ''}{change}%
                            </span>
                          )}
                        </div>
                        <button type="button" onClick={() => removeLesion(idx)}
                          className="text-slate-400 hover:text-red-500">
                          <X size={14} />
                        </button>
                      </div>
                    )
                  })}
                  {/* 합계 */}
                  {targetLesions.length > 0 && (
                    <div className="grid grid-cols-[1fr_100px_100px_28px] gap-2 items-center pt-1 border-t border-slate-200">
                      <span className="text-xs text-slate-500 text-right px-2">합계 (SLD)</span>
                      <span className="text-xs font-semibold text-slate-700 px-2">
                        {hasBaseline ? `${sumBaseline.toFixed(1)} mm` : '—'}
                      </span>
                      <div className="flex items-center gap-1 px-2">
                        <span className="text-xs font-semibold text-slate-700">
                          {hasCurrent ? `${sumCurrent.toFixed(1)} mm` : '—'}
                        </span>
                        {pctChange !== null && (
                          <span className={cn('text-xs font-bold', pctChange < 0 ? 'text-emerald-600' : pctChange > 0 ? 'text-red-600' : 'text-slate-400')}>
                            ({pctChange > 0 ? '+' : ''}{pctChange}%)
                          </span>
                        )}
                      </div>
                      <span />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 비표적 병변 + 새 병변 */}
          {criteriaSystem !== 'clinical' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-slate-600 mb-1">비표적 병변 상태</Label>
                <Select value={nonTargetStatus} onValueChange={setNonTargetStatus}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NON_TARGET_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-600">새 병변 발생</Label>
                <div className="flex gap-2">
                  {[{ v: false, label: '없음' }, { v: true, label: '있음 ⚠' }].map(({ v, label }) => (
                    <button key={String(v)} type="button" onClick={() => setNewLesions(v)}
                      className={cn(
                        'px-3 py-1.5 rounded-md border text-xs font-medium transition-colors',
                        newLesions === v
                          ? v ? 'bg-red-600 border-red-600 text-white' : 'bg-slate-700 border-slate-700 text-white'
                          : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50',
                      )}>
                      {label}
                    </button>
                  ))}
                </div>
                {newLesions && (
                  <Input value={newLesionsDesc} onChange={(e) => setNewLesionsDesc(e.target.value)}
                    placeholder="새 병변 위치/설명" className="h-7 text-xs" />
                )}
              </div>
            </div>
          )}

          {/* 전체 반응 판정 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">전체 반응 판정 *</p>
              {autoSuggested && (
                <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  자동 제안: {autoSuggested}
                </span>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {RESPONSE_TYPES.map((rt) => (
                <button key={rt.value} type="button"
                  onClick={() => setOverallResponse(rt.value)}
                  title={rt.labelKo}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm border font-medium transition-all',
                    overallResponse === rt.value
                      ? rt.color + ' ring-2 ring-offset-1 ring-slate-400'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50',
                  )}>
                  {rt.label}
                </button>
              ))}
            </div>
            {overallResponse && (
              <p className="text-xs text-slate-500">
                {RESPONSE_TYPES.find((r) => r.value === overallResponse)?.labelKo}
                {autoSuggested && overallResponse !== autoSuggested && (
                  <span className="ml-2 text-amber-600">※ 자동 제안({autoSuggested})과 다름 — 수동 변경됨</span>
                )}
              </p>
            )}
          </div>

          {/* 임상 인상 */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">임상 인상 (선택)</p>
            <div className="flex gap-2 flex-wrap">
              {CLINICAL_IMPRESSIONS.map((ci) => (
                <button key={ci.value} type="button"
                  onClick={() => setClinicalImpression(clinicalImpression === ci.value ? '' : ci.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-md border text-xs font-medium transition-all',
                    clinicalImpression === ci.value ? ci.color : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50',
                  )}>
                  {ci.label}
                </button>
              ))}
            </div>
          </div>

          {/* 종양 마커 (접이식) */}
          <div>
            <button type="button"
              onClick={() => setShowMarker((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700">
              {showMarker ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              종양 마커 / 혈액 수치 (선택)
            </button>
            {showMarker && (
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                <Input value={markerName} onChange={(e) => setMarkerName(e.target.value)}
                  placeholder="마커명 (예: LN index)" className="h-7 text-xs" />
                <Input type="number" step="any" value={markerBaseline}
                  onChange={(e) => setMarkerBaseline(e.target.value)}
                  placeholder="기준값" className="h-7 text-xs" />
                <Input type="number" step="any" value={markerCurrent}
                  onChange={(e) => setMarkerCurrent(e.target.value)}
                  placeholder="현재값" className="h-7 text-xs" />
                <Input value={markerUnit} onChange={(e) => setMarkerUnit(e.target.value)}
                  placeholder="단위 (예: cm²)" className="h-7 text-xs" />
              </div>
            )}
          </div>

          {/* 메모 */}
          <div>
            <Label className="text-xs text-slate-600 mb-1">평가 소견</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="평가 소견, 특이사항" className="h-16 text-sm resize-none" />
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
      {localEvals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <BarChart3 size={40} className="mb-3 opacity-40" />
          <p className="text-sm">기록된 치료 반응 평가가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {localEvals.map((ev, idx) => {
            const rt = RESPONSE_TYPES.find((r) => r.value === ev.overall_response)
            const pct = ev.percent_change
            const isExpanded = expandedId === ev.id

            // trend vs previous record
            const prevEv = localEvals[idx + 1]
            const responseOrder: Record<string, number> = { CR: 4, PR: 3, SD: 2, PD: 1, NE: 0, NA: 0 }
            const trend = prevEv
              ? (responseOrder[ev.overall_response] ?? 0) > (responseOrder[prevEv.overall_response] ?? 0) ? 'up'
                : (responseOrder[ev.overall_response] ?? 0) < (responseOrder[prevEv.overall_response] ?? 0) ? 'down' : 'same'
              : null

            return (
              <div key={ev.id} className="border rounded-lg overflow-hidden">
                {/* summary row */}
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                >
                  <div className="flex-1 flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800">{ev.eval_date}</span>
                    <span className="text-xs text-slate-400">{ev.criteria_system}</span>
                    {rt && (
                      <span className={cn('flex items-center gap-1 text-sm font-bold px-2.5 py-0.5 rounded-full border', rt.color)}>
                        {trend === 'up' && <TrendingDown size={11} />}
                        {trend === 'down' && <TrendingUp size={11} />}
                        {trend === 'same' && <Minus size={11} />}
                        {rt.label} — {rt.labelKo}
                      </span>
                    )}
                    {ev.clinical_impression && (
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full border',
                        CLINICAL_IMPRESSIONS.find((c) => c.value === ev.clinical_impression)?.color ?? '',
                      )}>
                        {CLINICAL_IMPRESSIONS.find((c) => c.value === ev.clinical_impression)?.label}
                      </span>
                    )}
                    {pct !== null && (
                      <span className={cn('text-xs font-semibold tabular-nums',
                        pct < -30 ? 'text-emerald-600' : pct > 20 ? 'text-red-600' : 'text-amber-600')}>
                        {pct > 0 ? '+' : ''}{pct}%
                      </span>
                    )}
                    {ev.new_lesions && (
                      <span className="text-[11px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">새 병변</span>
                    )}
                    {ev.modalities.length > 0 && (
                      <span className="text-[11px] text-slate-400">{ev.modalities.join(', ')}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button type="button"
                      onClick={(e) => { e.stopPropagation(); startEdit(ev) }}
                      className="text-slate-400 hover:text-blue-500 transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(ev.id) }}
                      disabled={deleting === ev.id}
                      className="text-slate-400 hover:text-red-500 transition-colors">
                      {deleting === ev.id
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Trash2 size={14} />}
                    </button>
                    {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                  </div>
                </div>

                {/* expanded detail */}
                {isExpanded && (
                  <div className="border-t p-3 space-y-3 bg-slate-50/50 text-sm">
                    {/* target lesions */}
                    {ev.target_lesions.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1.5">표적 병변</p>
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100">
                              <th className="text-left p-1.5 border border-slate-200">병변</th>
                              <th className="text-right p-1.5 border border-slate-200">기준 (mm)</th>
                              <th className="text-right p-1.5 border border-slate-200">현재 (mm)</th>
                              <th className="text-right p-1.5 border border-slate-200">변화</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ev.target_lesions.map((l) => {
                              const lPct = l.baseline_mm && l.current_mm
                                ? Math.round(((l.current_mm - l.baseline_mm) / l.baseline_mm) * 100) : null
                              return (
                                <tr key={l.id}>
                                  <td className="p-1.5 border border-slate-200">{l.location || l.id}</td>
                                  <td className="p-1.5 border border-slate-200 text-right">{l.baseline_mm ?? '—'}</td>
                                  <td className="p-1.5 border border-slate-200 text-right">{l.current_mm ?? '—'}</td>
                                  <td className={cn('p-1.5 border border-slate-200 text-right font-medium',
                                    lPct == null ? '' : lPct < 0 ? 'text-emerald-600' : lPct > 0 ? 'text-red-600' : 'text-slate-400')}>
                                    {lPct != null ? `${lPct > 0 ? '+' : ''}${lPct}%` : '—'}
                                  </td>
                                </tr>
                              )
                            })}
                            <tr className="bg-slate-100 font-semibold">
                              <td className="p-1.5 border border-slate-200">합계 (SLD)</td>
                              <td className="p-1.5 border border-slate-200 text-right">{ev.sum_baseline_mm ?? '—'}</td>
                              <td className="p-1.5 border border-slate-200 text-right">{ev.sum_current_mm ?? '—'}</td>
                              <td className={cn('p-1.5 border border-slate-200 text-right',
                                pct == null ? '' : pct < 0 ? 'text-emerald-600' : pct > 0 ? 'text-red-600' : 'text-slate-400')}>
                                {pct != null ? `${pct > 0 ? '+' : ''}${pct}%` : '—'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* non-target + new lesions */}
                    <div className="flex gap-4 text-xs text-slate-600">
                      <span>비표적: <strong>{ev.non_target_status}</strong></span>
                      <span>새 병변: <strong className={ev.new_lesions ? 'text-red-600' : ''}>{ev.new_lesions ? `있음${ev.new_lesions_desc ? ` (${ev.new_lesions_desc})` : ''}` : '없음'}</strong></span>
                    </div>

                    {/* marker */}
                    {ev.marker_name && (
                      <div className="text-xs text-slate-600">
                        <strong>{ev.marker_name}:</strong>{' '}
                        기준 {ev.marker_baseline ?? '—'} → 현재 {ev.marker_current ?? '—'} {ev.marker_unit ?? ''}
                      </div>
                    )}

                    {ev.notes && (
                      <p className="text-sm text-slate-600 bg-white rounded p-2 border">{ev.notes}</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
