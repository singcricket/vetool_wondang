import SpeciesToIcon from '@/components/common/species-to-icon'
import { calculateAge } from '@/lib/utils/utils'
import type { Patient } from '@/types'
import type { Species } from '@/constants/hospital/register/signalments'
import type { ColumnDef } from '@tanstack/react-table'
import type { Dispatch, SetStateAction } from 'react'
import DermSelectPatientDialog from './derm-select-patient-dialog'

type Props = {
  hosId: string
  targetDate: string
  setOpen: Dispatch<SetStateAction<boolean>>
  onRegistered: () => void
}

export const dermSearchedPatientColumns = ({
  hosId,
  targetDate,
  setOpen,
  onRegistered,
}: Props): ColumnDef<Patient>[] => [
  {
    accessorKey: 'species',
    header: () => '종',
    cell: ({ row }) => <SpeciesToIcon species={row.original.species as Species} />,
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
    header: () => '나이',
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        {calculateAge(row.original.birth)}
        <span className="text-xs text-muted-foreground">({row.original.birth})</span>
      </div>
    ),
  },
  {
    accessorKey: 'owner_name',
    header: () => '보호자',
    cell: ({ row }) => <>{row.original.owner_name}</>,
  },
  {
    accessorKey: 'action',
    header: () => '선택',
    cell: ({ row }) => (
      <DermSelectPatientDialog
        patient={row.original}
        hosId={hosId}
        targetDate={targetDate}
        setOpen={setOpen}
        onRegistered={onRegistered}
      />
    ),
  },
]
