'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MsTemplateChart } from '@/lib/services/monitoring/fetch-ms-data'
import { insertMsTemplateChart, updateMsTemplateChart } from '@/lib/services/monitoring/ms-register'
import { MsMemo, VITAL_REFERENCE_DATA, VitalResults } from '@/types/monitoring/monitoring-type'
import { TimerResetIcon } from 'lucide-react'
import { Dispatch, SetStateAction, useState } from 'react'
import { toast } from 'sonner'
import MsTemplateVitalSelect from './ms-template-vital-select'
import MsTemplateMemo from './ms-template-memo'
import MsTemplateTimeSlots from './ms-template-time-slots'

const ALL_CL_NAMES = VITAL_REFERENCE_DATA.map((d) => d.vitalName)

type Props = {
  isEdit: boolean
  hosId: string
  mstemplate: MsTemplateChart | null
  onOpenChange : (open: boolean) => Promise<void>
}

export default function MsTemplateEdit({ hosId, isEdit, mstemplate, onOpenChange }: Props) {
  /* ─── 기본 정보 ─── */
  const [title, setTitle] = useState(mstemplate?.session_template_title ?? '')
  const [comment, setComment] = useState(mstemplate?.session_comment ?? '')
  const [intervalValue, setIntervalValue] = useState<number>(
    mstemplate?.interval_setting ?? 0,
  )

  /* ─── 측정 항목 ─── */
  const [selectedVitals, setSelectedVitals] = useState<string[]>(
    mstemplate?.planned_vitals ?? ALL_CL_NAMES.slice(0, 4),
  )

  /* ─── 메모 ─── */
  const [memos, setMemos] = useState<MsMemo[]>(
    (mstemplate?.memo_tx as MsMemo[] | undefined) ?? [],
  )

  /* ─── 바이탈 시간 슬롯 ─── */
  const [vitalResults, setVitalResults] = useState<VitalResults>(
    mstemplate?.vital_results ?? [],
  )

  const [isSaving, setIsSaving] = useState(false)

  /* ─── 저장 ─── */
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('템플릿 이름을 입력해주세요')
      return
    }
    setIsSaving(true)
    try {
      const payload = {
        session_template_title: title,
        session_comment: comment,
        interval_setting: intervalValue,
        planned_vitals: selectedVitals,
        vital_results: vitalResults,
        memo_tx: memos,
      }
      if (isEdit && mstemplate) {
        await updateMsTemplateChart(mstemplate.session_template_id, payload)
      } else {
        await insertMsTemplateChart(hosId, payload)
      }
      toast.success(`템플릿이 ${isEdit ? '수정' : '저장'}되었습니다`)
      onOpenChange(false)
    } catch {
      toast.error('저장에 실패하였습니다')
    }
    setIsSaving(false)
  }

  return (
    <div className="flex flex-col gap-6 p-1">
      {/* ── 기본 정보 ── */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">기본 정보</h3>
        <div className="flex flex-wrap gap-3">
          <div className="flex w-full flex-col gap-1 md:flex-1">
            <Label htmlFor="tpl-title">
              템플릿 이름 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tpl-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="템플릿 이름을 입력해주세요"
            />
          </div>
          <div className="flex w-full flex-col gap-1 md:flex-1">
            <Label htmlFor="tpl-comment">설명</Label>
            <Input
              id="tpl-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="템플릿 설명을 입력해주세요"
            />
          </div>
        </div>
      </section>

      {/* ── 측정 설정 ── */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">측정 설정</h3>
        <div className="flex flex-wrap items-center gap-3">
          {/* 측정 간격 */}
          <div className="flex h-10 w-44 items-center gap-2 rounded-md border px-3 text-sm">
            <TimerResetIcon size={16} className="shrink-0 text-muted-foreground" />
            <span className="shrink-0 text-xs text-muted-foreground">측정간격 :</span>
            <Input
              type="number"
              value={isNaN(intervalValue) ? '' : intervalValue}
              onChange={(e) =>
                setIntervalValue(
                  e.target.value === '' ? NaN : parseInt(e.target.value),
                )
              }
              className="h-6 w-12 border-none bg-transparent p-0 text-right text-sm font-semibold shadow-none focus-visible:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-xs font-medium text-muted-foreground">분</span>
          </div>

          {/* 측정 항목 선택 */}
          <MsTemplateVitalSelect
            selectedVitals={selectedVitals}
            setSelectedVitals={setSelectedVitals}
          />
        </div>
      </section>

      {/* ── 처치 및 추가정보 ── */}
      <MsTemplateMemo 
        memos={memos} 
        setMemos={setMemos} 
        templateId={mstemplate?.session_template_id ?? `new-template-${hosId}-${Date.now()}`}
      />

      {/* ── 측정 시간 슬롯 ── */}
      <MsTemplateTimeSlots
        plannedVitals={selectedVitals}
        vitalResults={vitalResults}
        setVitalResults={setVitalResults}
      />

      {/* ── 저장 버튼 ── */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? '저장 중...' : isEdit ? '수정 저장' : '템플릿 생성'}
        </Button>
        
             <Button className='ml-2' variant="outline" onClick={()=>onOpenChange(false)}>닫기</Button>
        
      </div>
    </div>
  )
}