import SpeciesToIcon from '@/components/common/species-to-icon'
import { Button } from '@/components/ui/button'
import type { Species } from '@/constants/hospital/register/signalments'
import { useSafeRefresh } from '@/hooks/use-safe-refresh'
import type { IcuSidebarPatient } from '@/lib/services/icu/icu-layout'
import { cn, convertPascalCased } from '@/lib/utils/utils'
import type { Vet } from '@/types'
import {
  ActivityIcon,
  SirenIcon,
  StethoscopeIcon,
  UserIcon,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import UrgencyStarts from './urgency-stars'

type Props = {
  icuIoData: IcuSidebarPatient
  vetList: Vet[]
  hosId: string
  targetDate: string
}

export default function PatientButton({
  icuIoData,
  vetList,
  hosId,
  targetDate,
}: Props) {
  const { vets, patient, urgency, cpcr } = icuIoData

  const safeRefresh = useSafeRefresh()

  const { push } = useRouter()
  const { patient_id } = useParams()

  const vetName = vetList.find((vet) => vet.user_id === vets?.main_vet)?.name

  const selectedPatient = patient.patient_id === patient_id

  const handlePatientButtonClick = () => {
    push(`/hospital/${hosId}/icu/${targetDate}/chart/${patient.patient_id}`)
    safeRefresh()
  }

  const isPatientNew = icuIoData.in_date === targetDate

  return (
    <Button
      variant="outline"
      className={cn(
        selectedPatient && 'border border-black bg-muted shadow-md',
        'relative flex h-auto w-full flex-col gap-0 px-1.5 py-1',
        icuIoData.out_date && 'text-muted-foreground',
      )}
      onClick={handlePatientButtonClick}
    >
      {isPatientNew && (
        <span className="pointer-events-none absolute -top-1.5 left-0 -rotate-12 select-none text-xs font-semibold tracking-tight text-primary">
          new
        </span>
      )}

      <div className="flex w-full items-start justify-between gap-2">
        <div className="flex items-center gap-1 text-sm">
          <span className="font-bold">{patient.name}</span>
          <span className="text-xs font-light">{patient.hos_patient_id}</span>
        </div>

        <UrgencyStarts urgency={urgency} />
      </div>

      <div className="mt-1 flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <UserIcon style={{ width: 16, height: 16 }} />
          <div className="max-w-[60px] truncate">
            {patient.owner_name || '미등록'}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <StethoscopeIcon style={{ width: 15, height: 15 }} />
          <div className="max-w-[60px] truncate">{vetName ?? '미지정'}</div>
        </div>
      </div>

      <div className="mt-1 flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <SpeciesToIcon species={patient.species as Species} size={16} />
          <div className="max-w-[70px] truncate">
            {convertPascalCased(patient.breed)}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <ActivityIcon style={{ width: 15, height: 15 }} />
          <div>{cpcr.split(',')[0]}</div>
        </div>
      </div>
    </Button>
  )
}
