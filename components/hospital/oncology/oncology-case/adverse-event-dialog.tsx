'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils/utils'
import { saveAdverseEvent, updateAdverseEvent } from '@/lib/actions/oncology/adverse-event-actions'
import type { OncologyAdverseEventRow, OncologyCaseProtocolRow } from '@/lib/services/oncology/fetch-oncology-case'
import type { DrugItem } from '@/lib/actions/oncology/ai-oncology-guide'
import { Loader2, AlertTriangle, Stethoscope, User } from 'lucide-react'

const VCOG_GRADE_LABELS: Record<number, string> = {
  1: 'G1 — 경증', 2: 'G2 — 중등도', 3: 'G3 — 중증',
  4: 'G4 — 생명위협', 5: 'G5 — 사망',
}

const COMMON_EVENT_TYPES = [
  'Neutropenia', 'Thrombocytopenia', 'Anemia', 'Nausea', 'Vomiting',
  'Diarrhea', 'Anorexia', 'Lethargy', 'Alopecia', 'Hepatotoxicity',
  'Nephrotoxicity', 'Cardiotoxicity', 'Neurotoxicity', 'Hypersensitivity',
  'Infection', 'Hemorrhage', 'Mucositis', 'Other',
]

interface Props {
  caseId: string
  caseProtocols: OncologyCaseProtocolRow[]
  initialDrugName?: string
  initialData?: OncologyAdverseEventRow
  trigger: React.ReactNode
  onSaved?: (event: OncologyAdverseEventRow) => void
  onUpdated?: (event: OncologyAdverseEventRow) => void
}

export default function AdverseEventDialog({
  caseId, caseProtocols, initialDrugName, initialData, trigger, onSaved, onUpdated,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const isEditMode = !!initialData

  const [eventDate, setEventDate] = useState('')
  const [drugSelect, setDrugSelect] = useState('')
  const [drugCustom, setDrugCustom] = useState('')
  const [eventType, setEventType] = useState('')
  const [vcogGrade, setVcogGrade] = useState('2')
  const [description, setDescription] = useState('')
  const [actionTaken, setActionTaken] = useState('')
  const [reportedBy, setReportedBy] = useState<'vet' | 'owner'>('vet')
  const [resolved, setResolved] = useState(false)
  const [resolvedDate, setResolvedDate] = useState('')

  const allDrugNames = [
    ...new Set(
      caseProtocols.flatMap((cp) =>
        (cp.protocol.drugs as DrugItem[]).map((d) => d.drug_name)
      )
    ),
  ]

  const effectiveDrugName = drugSelect === '__other__' ? drugCustom : drugSelect

  // dialog가 열릴 때 폼 초기화
  useEffect(() => {
    if (!open) return
    if (initialData) {
      setEventDate(initialData.event_date)
      const knownDrug = allDrugNames.includes(initialData.drug_name ?? '')
      if (initialData.drug_name) {
        setDrugSelect(knownDrug ? initialData.drug_name : '__other__')
        setDrugCustom(knownDrug ? '' : (initialData.drug_name ?? ''))
      } else {
        setDrugSelect('')
        setDrugCustom('')
      }
      setEventType(initialData.event_type)
      setVcogGrade(String(initialData.vcog_grade))
      setDescription(initialData.description ?? '')
      setActionTaken(initialData.action_taken ?? '')
      setReportedBy((initialData.reported_by as 'vet' | 'owner') ?? 'vet')
      setResolved(initialData.resolved ?? false)
      setResolvedDate(initialData.resolved_date ?? '')
    } else {
      setEventDate(new Date().toISOString().split('T')[0])
      setDrugSelect(initialDrugName ?? '')
      setDrugCustom('')
      setEventType('')
      setVcogGrade('2')
      setDescription('')
      setActionTaken('')
      setReportedBy('vet')
      setResolved(false)
      setResolvedDate('')
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!eventType) return toast.error('부작용 유형을 선택하세요.')
    setSaving(true)
    try {
      if (isEditMode && initialData) {
        const row = await updateAdverseEvent(initialData.id, {
          event_date: eventDate,
          event_type: eventType,
          drug_name: effectiveDrugName || null,
          vcog_grade: parseInt(vcogGrade),
          description: description || null,
          action_taken: actionTaken || null,
          reported_by: reportedBy,
          resolved,
          resolved_date: resolved ? (resolvedDate || null) : null,
        })
        toast.success('수정되었습니다.')
        setOpen(false)
        if (onUpdated) onUpdated(row as OncologyAdverseEventRow)
        else router.refresh()
      } else {
        const row = await saveAdverseEvent({
          case_id: caseId,
          event_date: eventDate,
          event_type: eventType,
          drug_name: effectiveDrugName || null,
          vcog_grade: parseInt(vcogGrade),
          description: description || null,
          action_taken: actionTaken || null,
          reported_by: reportedBy,
        })
        toast.success('부작용이 기록되었습니다.')
        setOpen(false)
        if (onSaved) onSaved(row as OncologyAdverseEventRow)
        else router.refresh()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-500" />
            {isEditMode ? '부작용 기록 수정' : '부작용 기록 추가'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Reporter toggle */}
          <div>
            <Label className="text-xs text-slate-600 mb-1.5">입력 주체</Label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setReportedBy('vet')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors',
                  reportedBy === 'vet'
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50',
                )}>
                <Stethoscope size={12} /> 수의사
              </button>
              <button type="button" onClick={() => setReportedBy('owner')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors',
                  reportedBy === 'owner'
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50',
                )}>
                <User size={12} /> 보호자
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Date */}
            <div>
              <Label className="text-xs text-slate-600 mb-1">발생일</Label>
              <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="h-8 text-sm" />
            </div>
            {/* VCOG grade */}
            <div>
              <Label className="text-xs text-slate-600 mb-1">VCOG 등급 *</Label>
              <Select value={vcogGrade} onValueChange={setVcogGrade}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((g) => (
                    <SelectItem key={g} value={String(g)}>{VCOG_GRADE_LABELS[g]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Drug name */}
          <div>
            <Label className="text-xs text-slate-600 mb-1">원인 약물</Label>
            <Select value={drugSelect} onValueChange={setDrugSelect}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="약물 선택 (선택사항)" />
              </SelectTrigger>
              <SelectContent>
                {allDrugNames.map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
                <SelectItem value="__other__">기타 (직접 입력)</SelectItem>
              </SelectContent>
            </Select>
            {drugSelect === '__other__' && (
              <Input value={drugCustom} onChange={(e) => setDrugCustom(e.target.value)}
                placeholder="약물명 직접 입력" className="h-8 text-sm mt-1.5" autoFocus />
            )}
          </div>

          {/* Event type */}
          <div>
            <Label className="text-xs text-slate-600 mb-1">부작용 유형 *</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="유형 선택" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_EVENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label className="text-xs text-slate-600 mb-1">증상 설명</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="부작용 증상 상세 설명" className="h-16 text-sm resize-none" />
          </div>

          {/* Action taken */}
          <div>
            <Label className="text-xs text-slate-600 mb-1">조치 사항</Label>
            <Textarea value={actionTaken} onChange={(e) => setActionTaken(e.target.value)}
              placeholder="취한 조치 내용" className="h-16 text-sm resize-none" />
          </div>

          {/* Resolved */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={resolved} onChange={(e) => setResolved(e.target.checked)}
                className="w-4 h-4 rounded accent-slate-600" />
              <span className="text-sm text-slate-700">해결됨</span>
            </label>
            {resolved && (
              <div>
                <Label className="text-xs text-slate-600 mb-1">해결일 (선택)</Label>
                <Input type="date" value={resolvedDate} onChange={(e) => setResolvedDate(e.target.value)} className="h-8 text-sm" />
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave} disabled={saving}
              className="bg-rose-600 hover:bg-rose-700 text-white" size="sm">
              {saving && <Loader2 size={13} className="mr-1.5 animate-spin" />}
              {isEditMode ? '수정 저장' : '저장'}
            </Button>
            <Button onClick={() => setOpen(false)} variant="outline" size="sm">
              취소
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
