'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { updateDentalChart } from '@/lib/actions/dental/update-dental-chart'
import type { DentalChartDetail } from '@/types/dental/dental-type'

type Props = {
  anesthesia: boolean
  onAnesthesiaChange: (v: boolean) => void
  anesthesiaNote: string
  onAnesthesiaNoteChange: (v: string) => void
  procedures: {
    procedure_scaling: boolean
    procedure_polishing: boolean
    procedure_irrigation: boolean
    procedure_fluoride: boolean
  }
  onProceduresChange: (v: Props['procedures']) => void
  procedureOther: string
  onProcedureOtherChange: (v: string) => void
}

const PROCEDURE_ITEMS = [
  { key: 'procedure_scaling', label: '스케일링 (Scaling)' },
  { key: 'procedure_polishing', label: '폴리싱 (Polishing)' },
  { key: 'procedure_irrigation', label: '세척 (Irrigation)' },
  { key: 'procedure_fluoride', label: '불소 도포 (Fluoride)' },
] as const

export default function DentalProcedureTab({
  anesthesia, onAnesthesiaChange,
  anesthesiaNote, onAnesthesiaNoteChange,
  procedures, onProceduresChange,
  procedureOther, onProcedureOtherChange
}: Props) {
  function toggleProcedure(key: keyof typeof procedures) {
    onProceduresChange({ ...procedures, [key]: !procedures[key] })
  }

  return (
    <div className="flex flex-col">
      <div className="px-4 py-4">
        <div className="space-y-6">
          {/* 전신 마취 */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">전신 마취</p>
            <div className="flex items-center gap-2">
              <Switch id="anesthesia" checked={anesthesia} onCheckedChange={onAnesthesiaChange} />
              <Label htmlFor="anesthesia" className="cursor-pointer text-xs">전신 마취 시행</Label>
            </div>
            {anesthesia && (
              <div className="space-y-1">
                <Label className="text-xs">마취 관련 메모</Label>
                <Textarea
                  value={anesthesiaNote}
                  onChange={(e) => onAnesthesiaNoteChange(e.target.value)}
                  rows={2}
                  className="text-sm"
                  placeholder="마취 프로토콜, 약물 등"
                />
              </div>
            )}
          </section>

          {/* 처치 내역 */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">처치 내역</p>
            <div className="space-y-2">
              {PROCEDURE_ITEMS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={key}
                    checked={procedures[key]}
                    onCheckedChange={() => toggleProcedure(key)}
                  />
                  <Label htmlFor={key} className="cursor-pointer text-sm">{label}</Label>
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">기타 처치</Label>
              <Textarea
                value={procedureOther}
                onChange={(e) => onProcedureOtherChange(e.target.value)}
                rows={2}
                className="text-sm"
                placeholder="기타 시행한 처치를 자유롭게 기재"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
