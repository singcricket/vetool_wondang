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

type Props = { chartDetail: DentalChartDetail; hosId: string }

const PROCEDURE_ITEMS = [
  { key: 'procedure_scaling', label: '스케일링 (Scaling)' },
  { key: 'procedure_polishing', label: '폴리싱 (Polishing)' },
  { key: 'procedure_irrigation', label: '세척 (Irrigation)' },
  { key: 'procedure_fluoride', label: '불소 도포 (Fluoride)' },
] as const

export default function DentalProcedureTab({ chartDetail, hosId }: Props) {
  const { refresh } = useRouter()
  const [isPending, startTransition] = useTransition()

  const [anesthesia, setAnesthesia] = useState(chartDetail.anesthesia ?? false)
  const [anesthesiaNote, setAnesthesiaNote] = useState(chartDetail.anesthesia_note ?? '')
  const [procedures, setProcedures] = useState({
    procedure_scaling: chartDetail.procedure_scaling ?? false,
    procedure_polishing: chartDetail.procedure_polishing ?? false,
    procedure_irrigation: chartDetail.procedure_irrigation ?? false,
    procedure_fluoride: chartDetail.procedure_fluoride ?? false,
  })
  const [procedureOther, setProcedureOther] = useState(chartDetail.procedure_other ?? '')

  function toggleProcedure(key: keyof typeof procedures) {
    setProcedures((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function handleSave() {
    startTransition(async () => {
      await updateDentalChart(chartDetail.id, hosId, {
        anesthesia,
        anesthesia_note: anesthesiaNote || null,
        ...procedures,
        procedure_other: procedureOther || null,
      })
      refresh()
    })
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-6 pb-20">
          {/* 전신 마취 */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">전신 마취</p>
            <div className="flex items-center gap-2">
              <Switch id="anesthesia" checked={anesthesia} onCheckedChange={setAnesthesia} />
              <Label htmlFor="anesthesia" className="cursor-pointer text-xs">전신 마취 시행</Label>
            </div>
            {anesthesia && (
              <div className="space-y-1">
                <Label className="text-xs">마취 관련 메모</Label>
                <Textarea
                  value={anesthesiaNote}
                  onChange={(e) => setAnesthesiaNote(e.target.value)}
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
                onChange={(e) => setProcedureOther(e.target.value)}
                rows={2}
                className="text-sm"
                placeholder="기타 시행한 처치를 자유롭게 기재"
              />
            </div>
          </section>
        </div>
      </ScrollArea>

      <div className="shrink-0 flex justify-end border-t bg-background px-4 py-3">
        <Button onClick={handleSave} disabled={isPending} size="sm">
          {isPending ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  )
}
