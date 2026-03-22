import type { PatientWithWeight } from '@/lib/services/patient/patient'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ScaleIcon, PawPrintIcon } from 'lucide-react'

export default function SelectedPatient({
  patientData,
}: {
  patientData: PatientWithWeight
}) {
  return (
    <Card className="flex items-center justify-between border-primary/10 bg-primary/5 px-4 py-3 shadow-none transition-colors hover:bg-primary/10">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <PawPrintIcon className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">
              {patientData.patient.name}
            </span>
            <Badge variant="outline" className="h-5 py-0 text-[10px] lowercase">
              {patientData.patient.species}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {patientData.patient.breed}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1.5 font-semibold text-primary">
          <ScaleIcon className="h-4 w-4" />
          <span className="text-lg tabular-nums">
            {patientData.vital?.body_weight ?? '-'}
          </span>
          <span className="text-sm font-medium">kg</span>
        </div>
        <span className="text-[10px] text-muted-foreground">마지막 측정체중</span>
      </div>
    </Card>
  )
}
