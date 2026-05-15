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
import { saveAdverseEvent, deleteAdverseEvent } from '@/lib/actions/oncology/adverse-event-actions'
import type { OncologyAdverseEventRow } from '@/lib/services/oncology/fetch-oncology-case'
import { AlertTriangle, CheckCircle, Loader2, PlusCircle, Trash2 } from 'lucide-react'

const VCOG_GRADE_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'G1 경미', color: 'bg-green-100 text-green-800' },
  2: { label: 'G2 중등도', color: 'bg-yellow-100 text-yellow-800' },
  3: { label: 'G3 중증', color: 'bg-orange-100 text-orange-800' },
  4: { label: 'G4 생명위협', color: 'bg-red-100 text-red-800' },
  5: { label: 'G5 사망', color: 'bg-red-900 text-white' },
}

const COMMON_EVENT_TYPES = [
  'Neutropenia', 'Thrombocytopenia', 'Anemia', 'Nausea', 'Vomiting',
  'Diarrhea', 'Anorexia', 'Lethargy', 'Alopecia', 'Hepatotoxicity',
  'Nephrotoxicity', 'Cardiotoxicity', 'Neurotoxicity', 'Hypersensitivity',
  'Infection', 'Hemorrhage', 'Mucositis', 'Other'
]

interface Tab4AdverseProps {
  caseId: string
  adverseEvents: OncologyAdverseEventRow[]
}

export default function Tab4Adverse({ caseId, adverseEvents }: Tab4AdverseProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0])
  const [drugName, setDrugName] = useState('')
  const [eventType, setEventType] = useState('')
  const [vcogGrade, setVcogGrade] = useState('1')
  const [description, setDescription] = useState('')
  const [actionTaken, setActionTaken] = useState('')

  const resetForm = () => {
    setEventDate(new Date().toISOString().split('T')[0])
    setDrugName('')
    setEventType('')
    setVcogGrade('1')
    setDescription('')
    setActionTaken('')
  }

  const handleSave = async () => {
    if (!eventType) return toast.error('부작용 유형을 선택하세요.')
    setSaving(true)
    try {
      await saveAdverseEvent({
        case_id: caseId,
        event_date: eventDate,
        event_type: eventType,
        drug_name: drugName || null,
        vcog_grade: parseInt(vcogGrade),
        description: description || null,
        action_taken: actionTaken || null,
      })
      toast.success('부작용이 기록되었습니다.')
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
      await deleteAdverseEvent(id)
      toast.success('삭제되었습니다.')
      router.refresh()
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
          <AlertTriangle size={16} className="text-rose-600" />
          부작용 기록 ({adverseEvents.length}건)
        </h3>
        <Button
          onClick={() => setShowForm((v) => !v)}
          variant="outline"
          size="sm"
          className="border-rose-300 text-rose-700 hover:bg-rose-50"
        >
          <PlusCircle size={14} className="mr-1" />
          부작용 기록 추가
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="border border-rose-200 rounded-lg p-4 space-y-4 bg-rose-50/40">
          <h4 className="font-medium text-slate-700 text-sm">새 부작용 기록</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs text-slate-600 mb-1">발생일</Label>
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-600 mb-1">원인 약물</Label>
              <Input
                value={drugName}
                onChange={(e) => setDrugName(e.target.value)}
                placeholder="약물명"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-600 mb-1">부작용 유형 *</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-600 mb-1">VCOG 등급 *</Label>
              <Select value={vcogGrade} onValueChange={setVcogGrade}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((g) => (
                    <SelectItem key={g} value={String(g)}>
                      {VCOG_GRADE_LABELS[g].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs text-slate-600 mb-1">증상 설명</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="부작용 증상 상세 설명"
              className="h-20 text-sm resize-none"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-600 mb-1">조치 사항</Label>
            <Textarea
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="취한 조치 내용"
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

      {/* Events list */}
      {adverseEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <CheckCircle size={40} className="mb-3 opacity-40" />
          <p className="text-sm">기록된 부작용이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {adverseEvents.map((ae) => {
            const gradeInfo = VCOG_GRADE_LABELS[ae.vcog_grade] ?? { label: `G${ae.vcog_grade}`, color: 'bg-slate-100 text-slate-700' }
            return (
              <div key={ae.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-slate-500">{ae.event_date}</span>
                      <span className="font-semibold text-slate-800 text-sm">{ae.event_type}</span>
                      {ae.drug_name && (
                        <span className="text-xs text-slate-500">({ae.drug_name})</span>
                      )}
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', gradeInfo.color)}>
                        {gradeInfo.label}
                      </span>
                      {ae.resolved && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                          해결됨 {ae.resolved_date && `(${ae.resolved_date})`}
                        </span>
                      )}
                    </div>
                    {ae.description && (
                      <p className="text-sm text-slate-600">{ae.description}</p>
                    )}
                    {ae.action_taken && (
                      <p className="text-xs text-slate-500 bg-slate-50 rounded p-2">
                        <span className="font-medium">조치:</span> {ae.action_taken}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(ae.id)}
                    disabled={deleting === ae.id}
                    className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
                  >
                    {deleting === ae.id
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
