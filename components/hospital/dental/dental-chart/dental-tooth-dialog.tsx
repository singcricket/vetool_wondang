'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toothNames } from '@/constants/hospital/dental/dental_chart_canine_combined'
import type { DentalChartDetail, DentalTooth } from '@/types/dental/dental-type'
import DentalToothForm from './dental-tooth-detail/dental-tooth-form'

type Props = {
  open: boolean
  onClose: () => void
  toothId: string
  chartDetail: DentalChartDetail
  hosId: string
  existing: DentalTooth | undefined
}

export default function DentalToothDialog({
  open, onClose, toothId, chartDetail, hosId, existing
}: Props) {
  const toothName = toothNames[toothId] ?? toothId

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent 
        className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-0 p-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg font-bold">{toothId}</span>
            <span className="text-sm font-normal text-muted-foreground">— {toothName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <DentalToothForm
            toothId={toothId}
            chartDetail={chartDetail}
            hosId={hosId}
            existing={existing}
            onSaved={onClose}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
