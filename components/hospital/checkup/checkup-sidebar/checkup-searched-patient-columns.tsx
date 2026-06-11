'use client'

import { createCheckupRecord } from '@/lib/actions/checkup/checkup-actions'
import { createLinkedSubChart } from '@/lib/actions/checkup/linked-chart-actions'
import { useCheckupContext } from '@/providers/checkup-context-provider'
import type { Patient } from '@/types'
import type { ColumnDef } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface ColumnProps {
  hosId: string
  targetDate: string
  setIsRegisterDialogOpen: (open: boolean) => void
  onRegistered: () => void
}

export const checkupSearchedPatientColumns = ({
  hosId,
  targetDate,
  setIsRegisterDialogOpen,
  onRegistered,
}: ColumnProps): ColumnDef<Patient>[] => [
  { accessorKey: 'hos_patient_id', header: 'ID' },
  { accessorKey: 'name', header: '환자명' },
  { accessorKey: 'species', header: '종' },
  { accessorKey: 'breed', header: '품종' },
  { accessorKey: 'owner_name', header: '보호자' },
  {
    id: 'actions',
    header: '등록',
    cell: ({ row }) => (
      <ActionCell
        patient={row.original}
        hosId={hosId}
        targetDate={targetDate}
        setIsRegisterDialogOpen={setIsRegisterDialogOpen}
        onRegistered={onRegistered}
      />
    ),
  },
]

function ActionCell({
  patient,
  hosId,
  targetDate,
  setIsRegisterDialogOpen,
  onRegistered,
}: {
  patient: Patient
  hosId: string
  targetDate: string
  setIsRegisterDialogOpen: (open: boolean) => void
  onRegistered: () => void
}) {
  const router = useRouter()
  const { vetsList } = useCheckupContext()
  const [selectedVet, setSelectedVet] = useState<string>('none')
  const [withNeuro, setWithNeuro] = useState(false)
  const [withUltrasound, setWithUltrasound] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)

  const handleRegister = async () => {
    try {
      setIsRegistering(true)
      const checkupId = await createCheckupRecord({
        hosId,
        patientId: patient.patient_id,
        targetDate,
        vetId: selectedVet === 'none' ? null : selectedVet,
      })

      const checkupPatient = {
        name: patient.name,
        species: patient.species ?? '',
        breed: patient.breed ?? '',
        hos_patient_id: patient.hos_patient_id ?? '',
        birth: patient.birth ?? null,
        gender: patient.gender ?? null,
        owner_name: patient.owner_name ?? null,
      }

      await Promise.all([
        withNeuro
          ? createLinkedSubChart({ checkupId, chartType: 'neuro', hosId, patientId: patient.patient_id, patient: checkupPatient, chartDate: targetDate })
          : Promise.resolve(),
        withUltrasound
          ? createLinkedSubChart({ checkupId, chartType: 'ultrasound', hosId, patientId: patient.patient_id, patient: checkupPatient, chartDate: targetDate })
          : Promise.resolve(),
      ])

      toast.success('검진이 등록되었습니다.')
      setIsRegisterDialogOpen(false)
      onRegistered()
      router.push(`/hospital/${hosId}/checkup/${targetDate}/${checkupId}`)
    } catch {
      toast.error('등록에 실패했습니다.')
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Select value={selectedVet} onValueChange={setSelectedVet}>
          <SelectTrigger className="h-8 w-[130px]">
            <SelectValue placeholder="담당의 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">미지정</SelectItem>
            {vetsList.map((vet) => (
              <SelectItem key={vet.user_id} value={vet.user_id}>
                {vet.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          onClick={handleRegister}
          disabled={isRegistering}
          className="rounded bg-teal-600 px-3 py-1.5 text-xs text-white hover:bg-teal-700 disabled:opacity-50"
        >
          등록
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Checkbox
            id={`neuro-${patient.patient_id}`}
            checked={withNeuro}
            onCheckedChange={(v) => setWithNeuro(!!v)}
          />
          <Label htmlFor={`neuro-${patient.patient_id}`} className="cursor-pointer text-xs text-slate-500">
            신경계
          </Label>
        </div>
        <div className="flex items-center gap-1.5">
          <Checkbox
            id={`us-${patient.patient_id}`}
            checked={withUltrasound}
            onCheckedChange={(v) => setWithUltrasound(!!v)}
          />
          <Label htmlFor={`us-${patient.patient_id}`} className="cursor-pointer text-xs text-slate-500">
            복부초음파
          </Label>
        </div>
      </div>
    </div>
  )
}
