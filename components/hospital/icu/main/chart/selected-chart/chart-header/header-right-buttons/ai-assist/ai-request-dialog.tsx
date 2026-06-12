'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { requestAiRecommendation, type AiSessionResult, type VitalRecord } from '@/lib/actions/icu/ai-session-actions'
import type { Database } from '@/lib/supabase/database.types'

type DxCertainty = Database['public']['Enums']['icu_dx_certainty']

const CERTAINTY_OPTIONS: { value: DxCertainty; label: string; desc: string }[] = [
  { value: 'confirmed', label: '확진', desc: '검사/조직 등으로 확인됨' },
  { value: 'probable', label: '가진단', desc: '임상 소견으로 높은 가능성' },
  { value: 'suspected', label: '추측', desc: '일부 소견만 부합' },
  { value: 'rule_out', label: '배제진단', desc: '가능성 낮음, 감별 목적' },
]

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  hosId: string
  icuIoId: string
  icuChartId: string
  patientName: string
  species: string
  breed: string
  weight: string
  ageInDays: number
  icuIoCc: string
  icuIoDx: string
  inDate: string
  targetDate: string
  currentOrders: Array<{ type: string; name: string; comment: string | null }>
  currentVitals: VitalRecord[]
  onResult: (result: AiSessionResult) => void
}

export default function AiRequestDialog({
  open,
  onOpenChange,
  hosId,
  icuIoId,
  icuChartId,
  patientName,
  species,
  breed,
  weight,
  ageInDays,
  icuIoCc,
  icuIoDx,
  inDate,
  targetDate,
  currentOrders,
  currentVitals,
  onResult,
}: Props) {
  const [dxName, setDxName] = useState(icuIoDx || '')
  const [dxCertainty, setDxCertainty] = useState<DxCertainty>('probable')
  const [additionalContext, setAdditionalContext] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRequest = async () => {
    if (!dxName.trim()) {
      toast.error('진단명을 입력해주세요.')
      return
    }
    setLoading(true)
    try {
      const result = await requestAiRecommendation({
        icuIoId,
        icuChartId,
        hosId,
        dxName: dxName.trim(),
        dxCertainty,
        patientName,
        species,
        breed,
        weight,
        ageInDays,
        icuIoCc,
        icuIoDx,
        inDate,
        targetDate,
        currentOrders,
        currentVitals,
        additionalContext: additionalContext.trim() || undefined,
      })
      toast.success('AI 추천 완료')
      onResult(result)
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message ?? 'AI 요청 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>AI 오더 추천 요청</DialogTitle>
          <DialogDescription className="text-xs">
            진단명과 확실도를 입력하면 AI가 치료 오더를 추천합니다.
            수의사 승인 전까지 실제 차트에 반영되지 않습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-1">
          <div>
            <Label className="text-xs">
              진단명 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={dxName}
              onChange={(e) => setDxName(e.target.value)}
              placeholder="예: 급성 신부전, 당뇨병성 케톤산증"
              className="mt-1 h-8 text-sm"
              autoComplete="off"
            />
          </div>

          <div>
            <Label className="text-xs">
              진단 확실도 <span className="text-destructive">*</span>
            </Label>
            <Select value={dxCertainty} onValueChange={(v) => setDxCertainty(v as DxCertainty)}>
              <SelectTrigger className="mt-1 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CERTAINTY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-sm">
                    <span className="font-medium">{o.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{o.desc}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">
              추가 임상 정보
              <span className="ml-1 font-normal text-muted-foreground">(선택 — 현재 상태 보완 또는 이전 추천 피드백)</span>
            </Label>
            <Textarea
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder={`예) 오늘 오전부터 호흡이 빨라지고 있고, 초음파상 복수가 더 늘었음.\n이전 추천의 수액 속도가 너무 빠른 것 같아 속도를 낮춰서 다시 추천해줘.`}
              className="mt-1 min-h-[80px] resize-none text-xs"
              rows={3}
            />
          </div>

          <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">AI에 전달되는 정보</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              <li>{patientName} ({species}/{breed}, {weight}kg)</li>
              <li>입원 이력 + 이전 차트 오더 (최근 7일)</li>
              <li>바이탈/처치 기록 (checklist 오더 결과)</li>
              <li>등록된 검사결과 전체</li>
              <li>현재 차트 오더 {currentOrders.length}건</li>
              {additionalContext.trim() && <li className="text-foreground font-medium">추가 임상 정보 포함됨</li>}
            </ul>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
              취소
            </Button>
            <Button size="sm" onClick={handleRequest} disabled={loading || !dxName.trim()}>
              {loading ? (
                <>
                  <Loader2 size={13} className="mr-1.5 animate-spin" />
                  분석 중...
                </>
              ) : (
                'AI 추천 받기'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
