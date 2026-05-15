'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils/utils'
import { saveQolRecord, deleteQolRecord } from '@/lib/actions/oncology/qol-actions'
import type { OncologyQolRecordRow } from '@/lib/services/oncology/fetch-oncology-case'
import { Heart, Loader2, PlusCircle, Trash2 } from 'lucide-react'

function ScorePicker({
  label,
  value,
  onChange,
  colorFn,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  colorFn: (score: number, active: boolean) => string
}) {
  return (
    <div>
      <Label className="text-xs text-slate-600 mb-1 block">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={cn(
              'w-9 h-9 rounded-lg text-sm font-semibold transition-all border',
              colorFn(s, value === s),
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

function vitalityColor(score: number, active: boolean) {
  const base = active ? 'ring-2 ring-rose-400 ring-offset-1' : ''
  if (score >= 4) return cn('bg-emerald-100 text-emerald-800 border-emerald-300', base)
  if (score === 3) return cn('bg-yellow-100 text-yellow-800 border-yellow-300', base)
  return cn('bg-red-100 text-red-800 border-red-300', base)
}

function appetiteColor(score: number, active: boolean) {
  return vitalityColor(score, active)
}

function ownerColor(score: number, active: boolean) {
  return vitalityColor(score, active)
}

function QolScoreBadge({ label, score }: { label: string; score: number | null }) {
  if (score == null) return null
  const color =
    score >= 4 ? 'bg-emerald-100 text-emerald-800' :
    score >= 3 ? 'bg-yellow-100 text-yellow-800' :
    'bg-red-100 text-red-800'

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={cn('w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold', color)}>
        {score}
      </span>
    </div>
  )
}

interface Tab6QolProps {
  caseId: string
  qolRecords: OncologyQolRecordRow[]
}

export default function Tab6Qol({ caseId, qolRecords }: Tab6QolProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0])
  const [bodyWeight, setBodyWeight] = useState('')
  const [vitalityScore, setVitalityScore] = useState(3)
  const [appetiteScore, setAppetiteScore] = useState(3)
  const [ownerScore, setOwnerScore] = useState(3)
  const [notes, setNotes] = useState('')

  const resetForm = () => {
    setVisitDate(new Date().toISOString().split('T')[0])
    setBodyWeight('')
    setVitalityScore(3)
    setAppetiteScore(3)
    setOwnerScore(3)
    setNotes('')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveQolRecord({
        case_id: caseId,
        visit_date: visitDate,
        body_weight: bodyWeight ? parseFloat(bodyWeight) : null,
        vitality_score: vitalityScore,
        appetite_score: appetiteScore,
        owner_score: ownerScore,
        notes: notes || null,
      })
      toast.success('QoL 기록이 저장되었습니다.')
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
    if (!confirm('이 기록을 삭제하시겠습니까?')) return
    setDeleting(id)
    try {
      await deleteQolRecord(id)
      toast.success('삭제되었습니다.')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '삭제 실패')
    } finally {
      setDeleting(null)
    }
  }

  const avgScore = (r: OncologyQolRecordRow) => {
    const scores = [r.vitality_score, r.appetite_score, r.owner_score].filter((s) => s != null) as number[]
    if (scores.length === 0) return null
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Heart size={16} className="text-rose-600" />
          QoL 트래킹 ({qolRecords.length}건)
        </h3>
        <Button
          onClick={() => setShowForm((v) => !v)}
          variant="outline"
          size="sm"
          className="border-rose-300 text-rose-700 hover:bg-rose-50"
        >
          <PlusCircle size={14} className="mr-1" />
          방문 기록 추가
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="border border-rose-200 rounded-lg p-4 space-y-4 bg-rose-50/40">
          <h4 className="font-medium text-slate-700 text-sm">새 방문 기록</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-600 mb-1">방문일</Label>
              <Input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-600 mb-1">체중 (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={bodyWeight}
                onChange={(e) => setBodyWeight(e.target.value)}
                placeholder="0.0"
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ScorePicker
              label="활력 점수 (Vitality)"
              value={vitalityScore}
              onChange={setVitalityScore}
              colorFn={vitalityColor}
            />
            <ScorePicker
              label="식욕 점수 (Appetite)"
              value={appetiteScore}
              onChange={setAppetiteScore}
              colorFn={appetiteColor}
            />
            <ScorePicker
              label="보호자 평가 (Owner)"
              value={ownerScore}
              onChange={setOwnerScore}
              colorFn={ownerColor}
            />
          </div>

          <div>
            <Label className="text-xs text-slate-600 mb-1">메모</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="방문 시 특이사항"
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

      {/* Records list */}
      {qolRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Heart size={40} className="mb-3 opacity-40" />
          <p className="text-sm">QoL 기록이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {qolRecords.map((rec) => {
            const avg = avgScore(rec)
            const avgNum = avg ? parseFloat(avg) : null
            const avgColor =
              avgNum && avgNum >= 4 ? 'text-emerald-700' :
              avgNum && avgNum >= 3 ? 'text-yellow-700' :
              'text-red-700'

            return (
              <div key={rec.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800">{rec.visit_date}</span>
                      {rec.body_weight != null && (
                        <span className="text-xs text-slate-500">{rec.body_weight} kg</span>
                      )}
                      {avg && (
                        <span className={cn('text-sm font-bold', avgColor)}>
                          평균 {avg} / 5
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-6">
                      <QolScoreBadge label="활력" score={rec.vitality_score} />
                      <QolScoreBadge label="식욕" score={rec.appetite_score} />
                      <QolScoreBadge label="보호자" score={rec.owner_score} />
                    </div>
                    {rec.notes && (
                      <p className="text-sm text-slate-600 bg-slate-50 rounded p-2">{rec.notes}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(rec.id)}
                    disabled={deleting === rec.id}
                    className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
                  >
                    {deleting === rec.id
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
