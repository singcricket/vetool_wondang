'use client'

import { registerOphthalmicChart } from '@/lib/services/ophthalmic/register-ophthalmic'
import type { Patient } from '@/types'
import type { ColumnDef } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useOphthalmicContext } from '@/providers/ophthalmic-context-provider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState } from 'react'

interface ColumnProps {
  hosId: string
  targetDate: string
  setIsRegisterDialogOpen: (open: boolean) => void
  onRegistered: () => void
}

export const ophthalmicSearchedPatientColumns = ({
  hosId,
  targetDate,
  setIsRegisterDialogOpen,
  onRegistered,
}: ColumnProps): ColumnDef<Patient>[] => {
  return [
    {
      accessorKey: 'hos_patient_id',
      header: 'ID',
    },
    {
      accessorKey: 'name',
      header: '환자명',
    },
    {
      accessorKey: 'species',
      header: '종',
    },
    {
      accessorKey: 'breed',
      header: '품종',
    },
    {
      accessorKey: 'gender',
      header: '성별',
    },
    {
      accessorKey: 'owner_name',
      header: '보호자',
    },
    {
      id: 'actions',
      header: '담당 수의사 선택 및 등록',
      cell: ({ row }) => {
        return <ActionCell patientId={row.original.patient_id} hosId={hosId} targetDate={targetDate} setIsRegisterDialogOpen={setIsRegisterDialogOpen} onRegistered={onRegistered} />
      },
    },
  ]
}

function ActionCell({ 
  patientId, 
  hosId, 
  targetDate, 
  setIsRegisterDialogOpen, 
  onRegistered 
}: { 
  patientId: string
  hosId: string
  targetDate: string
  setIsRegisterDialogOpen: (open: boolean) => void
  onRegistered: () => void
}) {
  const router = useRouter()
  const { vetsList } = useOphthalmicContext()
  const [selectedVet, setSelectedVet] = useState<string>('none')
  const [isRegistering, setIsRegistering] = useState(false)

  const handleRegister = async (vetId: string) => {
    try {
      setIsRegistering(true)
      const chartId = await registerOphthalmicChart({
        hosId,
        patientId,
        targetDate,
        vetId: vetId === 'none' ? null : vetId,
      })
      
      toast.success('안과 차트가 등록되었습니다.')
      setIsRegisterDialogOpen(false)
      onRegistered()
      router.push(`/hospital/${hosId}/ophthalmic/${targetDate}/${chartId}`)
    } catch (error) {
      toast.error('등록에 실패했습니다.')
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedVet} onValueChange={setSelectedVet}>
        <SelectTrigger className="h-8 w-[140px]">
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
        onClick={() => handleRegister(selectedVet)}
        disabled={isRegistering}
        className="rounded bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
      >
        등록
      </button>
    </div>
  )
}
