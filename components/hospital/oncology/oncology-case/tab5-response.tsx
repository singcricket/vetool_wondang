'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils/utils'
import { saveResponseEval, deleteResponseEval } from '@/lib/actions/oncology/response-eval-actions'
import type {
  OncologyResponseEvalRow,
  OncologyCaseProtocolRow,
} from '@/lib/services/oncology/fetch-oncology-case'
import { BarChart3, Loader2, PlusCircle, Trash2 } from 'lucide-react'

const RESPONSE_TYPES = [
  { value: 'CR', label: 'CR — 완전관해', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { value: 'PR', label: 'PR — 부분관해', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'SD', label: 'SD — 안정병변', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'PD', label: 'PD — 진행병변', color: 'bg-red-100 text-red-800 border-red-300' },
]

const MODALITIES = [
  'Radiograph', 'Ultrasound', 'CT', 'MRI', 'PET-CT',
  'Physical Exam', 'Lymph Node Size', 'Blood Marker', 'Other'
]

const RESPONSE_COLOR: Record<string, string> = {
  CR: 'bg-emerald-100 text-emerald-800',
  PR: 'bg-blue-100 text-blue-800',
  SD: 'bg-yellow-100 text-yellow-800',
  PD: 'bg-red-100 text-red-800',
}

interface Tab5ResponseProps {
  caseId: string
  responseEvals: OncologyResponseEvalRow[]
  caseProtocols: OncologyCaseProtocolRow[]
}

export default function Tab5Response({ caseId, responseEvals, caseProtocols }: Tab5ResponseProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [evalDate, setEvalDate] = useState(new Date().toISOString().split('T')[0])
  const [modality, setModality] = useState('')
  const [responseType, setResponseType] = useState('')
  const [measureBefore, setMeasureBefore] = useState('')
  const [measureAfter, setMeasureAfter] = useState('')
  const [notes, setNotes] = useState('')
  const [caseProtocolId, setCaseProtocolId] = useState('none')

  const resetForm = () => {
    setEvalDate(new Date().toISOString().split('T')[0])
    setModality('')
    setResponseType('')
    setMeasureBefore('')
    setMeasureAfter('')
    setNotes('')
    setCaseProtocolId('none')
  }

  const handleSave = async () => {
    if (!modality) return toast.error('평가 방법을 선택하세요.')
    if (!responseType) return toast.error('반응 유형을 선택하세요.')
    setSaving(true)
    try {
      await saveResponseEval({
        case_id: caseId,
        case_protocol_id: caseProtocolId === 'none' ? null : caseProtocolId || null,
        eval_date: evalDate,
        modality,
        response_type: responseType,
        measurement_before: measureBefore ? parseFloat(measureBefore) : null,
        measurement_after: measureAfter ? parseFloat(measureAfter) : null,
        notes: notes || null,
      })
      toast.success('평가가 저장되었습니다.')
      resetForm()
      setShowForm(false)
      router.refresh()
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
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '삭제 실패')
    } finally {
      setDeleting(null)
    }
  }

  const percentChange = (before: number | null, after: number | null) => {
    if (!before || !after) return null
    return Math.round(((after - before) / before) * 100)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <BarChart3 size={16} className="text-rose-600" />
          치료 반응 평가 ({responseEvals.length}건)
        </h3>
        <Button
          onClick={() => setShowForm((v) => !v)}
          variant="outline"
          size="sm"
          className="border-rose-300 text-rose-700 hover:bg-rose-50"
        >
          <PlusCircle size={14} className="mr-1" />
          평가 추가
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="border border-rose-200 rounded-lg p-4 space-y-4 bg-rose-50/40">
          <h4 className="font-medium text-slate-700 text-sm">새 치료 반응 평가</h4>

          {/* Response type selector */}
          <div>
            <Label className="text-xs text-slate-600 mb-2 block">반응 유형 *</Label>
            <div className="flex gap-2 flex-wrap">
              {RESPONSE_TYPES.map((rt) => (
                <button
                  key={rt.value}
                  type="button"
                  onClick={() => setResponseType(rt.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm border transition-all',
                    responseType === rt.value
                      ? rt.color + ' ring-2 ring-offset-1 ring-rose-400 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  {rt.value}
                </button>
              ))}
            </div>
            {responseType && (
              <p className="text-xs text-slate-500 mt-1">
                {RESPONSE_TYPES.find((r) => r.value === responseType)?.label}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-slate-600 mb-1">평가일</Label>
              <Input
                type="date"
                value={evalDate}
                onChange={(e) => setEvalDate(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-600 mb-1">평가 방법 *</Label>
              <Select value={modality} onValueChange={setModality}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {MODALITIES.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {caseProtocols.length > 0 && (
              <div>
                <Label className="text-xs text-slate-600 mb-1">연관 프로토콜</Label>
                <Select value={caseProtocolId} onValueChange={setCaseProtocolId}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="선택 (선택사항)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">미지정</SelectItem>
                    {caseProtocols.map((cp) => (
                      <SelectItem key={cp.id} value={cp.id}>
                        {cp.protocol.protocol_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-600 mb-1">측정값 (치료 전, cm/mm)</Label>
              <Input
                type="number"
                step="0.1"
                value={measureBefore}
                onChange={(e) => setMeasureBefore(e.target.value)}
                placeholder="0.0"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-600 mb-1">측정값 (현재, cm/mm)</Label>
              <Input
                type="number"
                step="0.1"
                value={measureAfter}
                onChange={(e) => setMeasureAfter(e.target.value)}
                placeholder="0.0"
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-slate-600 mb-1">메모</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="평가 소견"
              className="h-20 text-sm resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-rose-600 hover:bg-rose-700 text-white"
              size="sm"
            >
              {saving ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
              저장
            </Button>
            <Button
              onClick={() => { resetForm(); setShowForm(false) }}
              variant="outline"
              size="sm"
            >
              취소
            </Button>
          </div>
        </div>
      )}

      {/* Evals list */}
      {responseEvals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <BarChart3 size={40} className="mb-3 opacity-40" />
          <p className="text-sm">기록된 치료 반응 평가가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {responseEvals.map((ev) => {
            const pct = percentChange(ev.measurement_before, ev.measurement_after)
            const colorClass = RESPONSE_COLOR[ev.response_type] ?? 'bg-slate-100 text-slate-700'
            return (
              <div key={ev.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-slate-500">{ev.eval_date}</span>
                      <span
                        className={cn(
                          'text-sm font-bold px-3 py-0.5 rounded-full',
                          colorClass,
                        )}
                      >
                        {ev.response_type}
                      </span>
                      <span className="text-xs text-slate-600">{ev.modality}</span>
                      {ev.measurement_before != null && ev.measurement_after != null && (
                        <span className="text-xs text-slate-500">
                          {ev.measurement_before} → {ev.measurement_after}
                          {pct != null && (
                            <span className={cn('ml-1 font-medium', pct < 0 ? 'text-emerald-600' : 'text-red-600')}>
                              ({pct > 0 ? '+' : ''}{pct}%)
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    {ev.notes && (
                      <p className="text-sm text-slate-600">{ev.notes}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(ev.id)}
                    disabled={deleting === ev.id}
                    className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
                  >
                    {deleting === ev.id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Trash2 size={14} />
                    }
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
