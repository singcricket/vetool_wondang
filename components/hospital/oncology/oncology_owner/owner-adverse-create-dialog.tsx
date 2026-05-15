'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { saveAdverseEvent, saveAdverseEventPublic } from '@/lib/actions/oncology/adverse-event-actions'
import type { OncologyAdverseEventRow } from '@/lib/services/oncology/fetch-oncology-case'
import { Loader2, PlusCircle } from 'lucide-react'

// 보호자 용어 → DB에 저장될 값 (수의사 용어와 매핑)
export const OWNER_ADVERSE_TYPES = [
  { label: '구토 / 메스꺼움', value: '구토/메스꺼움' },
  { label: '설사', value: '설사' },
  { label: '식욕 감소', value: '식욕감소' },
  { label: '기력 저하 / 무기력', value: '기력저하' },
  { label: '털 빠짐', value: '털빠짐' },
  { label: '체중 감소', value: '체중감소' },
  { label: '발열', value: '발열' },
  { label: '호흡 이상', value: '호흡이상' },
  { label: '출혈', value: '출혈' },
  { label: '기타', value: '기타' },
]

interface Props {
  caseId: string
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved: (row: OncologyAdverseEventRow) => void
  usePublicAction?: boolean
}

export default function OwnerAdverseCreateDialog({ caseId, open, onOpenChange, onSaved, usePublicAction = false }: Props) {
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0])
  const [eventType, setEventType] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setEventDate(new Date().toISOString().split('T')[0])
    setEventType('')
    setDescription('')
  }

  const handleSave = async () => {
    if (!eventType) {
      toast.error('증상 유형을 선택해주세요.')
      return
    }
    setSaving(true)
    try {
      const action = usePublicAction ? saveAdverseEventPublic : saveAdverseEvent
      const row = await action({
        case_id: caseId,
        event_date: eventDate,
        event_type: eventType,
        vcog_grade: 1,
        description: description || null,
        reported_by: 'owner',
      })
      toast.success('기록이 저장되었습니다.')
      onSaved(row as OncologyAdverseEventRow)
      reset()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset() }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>증상 기록 추가</DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <div className="space-y-4 pt-1">
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
            <Label className="text-xs text-slate-600 mb-1">증상 유형</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="증상을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {OWNER_ADVERSE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-slate-600 mb-1">증상 설명</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="관찰된 증상을 자세히 설명해주세요"
              className="text-sm resize-none h-24"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { onOpenChange(false); reset() }}>
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {saving
                ? <Loader2 size={13} className="mr-1.5 animate-spin" />
                : <PlusCircle size={13} className="mr-1.5" />
              }
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
