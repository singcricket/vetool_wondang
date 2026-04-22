'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { updateDentalChart } from '@/lib/actions/dental/update-dental-chart'
import type { DentalChartDetail } from '@/types/dental/dental-type'

type Props = {
  treatmentPlan: string
  onTreatmentPlanChange: (v: string) => void
  recheckInterval: DentalChartDetail['recheck_interval']
  onRecheckIntervalChange: (v: DentalChartDetail['recheck_interval']) => void
  homecareInstruction: string
  onHomecareInstructionChange: (v: string) => void
}

const RECHECK_OPTS: { value: DentalChartDetail['recheck_interval']; label: string }[] = [
  { value: '1month', label: '1개월' },
  { value: '3months', label: '3개월' },
  { value: '6months', label: '6개월' },
  { value: '12months', label: '12개월' },
  { value: 'as_needed', label: '필요 시' },
]

export default function DentalTreatmentTab({
  treatmentPlan, onTreatmentPlanChange,
  recheckInterval, onRecheckIntervalChange,
  homecareInstruction, onHomecareInstructionChange
}: Props) {
  return (
    <div className="flex flex-col">
      <div className="px-4 py-4">
        <div className="space-y-6">
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">치료 계획</p>
            <div className="space-y-1">
              <Label className="text-xs">전체 치료 계획 요약</Label>
              <Textarea
                value={treatmentPlan}
                onChange={(e) => onTreatmentPlanChange(e.target.value)}
                rows={5}
                className="text-sm"
                placeholder="향후 치료 계획을 기재하세요"
              />
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">재검 주기</p>
            <div className="max-w-[200px] space-y-1">
              <Label className="text-xs">다음 검진 권장 주기</Label>
              <Select
                value={recheckInterval ?? ''}
                onValueChange={(v) => onRecheckIntervalChange(v as DentalChartDetail['recheck_interval'])}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {RECHECK_OPTS.map((o) => (
                    <SelectItem key={o.value ?? ''} value={o.value ?? ''} className="text-xs">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">가정 관리 지침</p>
            <Textarea
              value={homecareInstruction}
              onChange={(e) => onHomecareInstructionChange(e.target.value)}
              rows={4}
              className="text-sm"
              placeholder="보호자에게 안내할 가정 구강 관리 방법"
            />
          </section>
        </div>
      </div>
    </div>
  )
}
