import SpeciesToIcon from '@/components/common/species-to-icon'
import { calculateAge } from '@/lib/utils/utils'
import type { Patient } from '@/types'
import type { Species } from '@/constants/hospital/register/signalments'
import type { ColumnDef } from '@tanstack/react-table'
import type { Dispatch, SetStateAction } from 'react'
import DentalSelectPatientDialog from './dental-select-patient-dialog'

type Props = {
  hosId: string
  targetDate: string
  setIsRegisterDialogOpen: Dispatch<SetStateAction<boolean>>
  onRegistered: () => void
}

export const dentalSearchedPatientColumns = ({
  hosId,
  targetDate,
  setIsRegisterDialogOpen,
  onRegistered,
}: Props): ColumnDef<Patient>[] => [
  {
    accessorKey: 'species',
    header: () => '종',
    cell: ({ row }) => (
      <SpeciesToIcon species={row.original.species as Species} />
    ),
  },
  {
    accessorKey: 'hos_patient_id',
    header: () => '환자번호',
    cell: ({ row }) => <>{row.original.hos_patient_id}</>,
  },
  {
    accessorKey: 'name',
    header: () => '환자명',
    cell: ({ row }) => <>{row.original.name}</>,
  },
  {
    accessorKey: 'breed',
    header: () => '품종',
    cell: ({ row }) => <>{row.original.breed}</>,
  },
  {
    accessorKey: 'gender',
    header: () => '성별',
    cell: ({ row }) => <>{row.original.gender.toUpperCase()}</>,
  },
  {
    accessorKey: 'birth',
    header: () => '나이 (생일)',
    cell: ({ row }) => {
      const birth = row.original.birth
      return (
        <div className="flex items-center justify-center gap-1">
          {calculateAge(birth)}
          <span className="text-xs text-muted-foreground">({birth})</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'owner_name',
    header: () => '보호자',
    cell: ({ row }) => <>{row.original.owner_name}</>,
  },
  {
    accessorKey: 'created_at',
    header: () => '등록일',
    cell: ({ row }) => <>{row.original.created_at.slice(0, 10)}</>,
  },
  {
    accessorKey: 'register_dental_action',
    header: () => '환자선택',
    cell: ({ row }) => (
      <DentalSelectPatientDialog
        patient={row.original}
        hosId={hosId}
        targetDate={targetDate}
        setIsRegisterDialogOpen={setIsRegisterDialogOpen}
        onRegistered={onRegistered}
      />
    ),
  },
]
