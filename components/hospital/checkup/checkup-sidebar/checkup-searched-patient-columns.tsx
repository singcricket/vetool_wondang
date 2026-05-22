'use client'

import { createCheckupRecord } from '@/lib/actions/checkup/checkup-actions'
import { useCheckupContext } from '@/providers/checkup-context-provider'
import type { Patient } from '@/types'
import type { ColumnDef } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
        patientId={row.original.patient_id}
        hosId={hosId}
        targetDate={targetDate}
        setIsRegisterDialogOpen={setIsRegisterDialogOpen}
        onRegistered={onRegistered}
      />
    ),
  },
]

function ActionCell({
  patientId,
  hosId,
  targetDate,
  setIsRegisterDialogOpen,
  onRegistered,
}: {
  patientId: string
  hosId: string
  targetDate: string
  setIsRegisterDialogOpen: (open: boolean) => void
  onRegistered: () => void
}) {
  const router = useRouter()
  const { vetsList } = useCheckupContext()
  const [selectedVet, setSelectedVet] = useState<string>('none')
  const [isRegistering, setIsRegistering] = useState(false)

  const handleRegister = async () => {
    try {
      setIsRegistering(true)
      const checkupId = await createCheckupRecord({
        hosId,
        patientId,
        targetDate,
        vetId: selectedVet === 'none' ? null : selectedVet,
      })
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
  )
}
