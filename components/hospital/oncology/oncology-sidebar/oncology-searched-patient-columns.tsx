'use client'

import { registerOncologyCase } from '@/lib/services/oncology/register-oncology'
import { useOncologyContext } from '@/providers/oncology-context-provider'
import type { Patient } from '@/types'
import type { ColumnDef } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

interface ColumnProps {
  hosId: string
  targetDate: string
  setIsRegisterDialogOpen: (open: boolean) => void
  onRegistered: () => void
}

export const oncologySearchedPatientColumns = ({
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
      accessorKey: 'owner_name',
      header: '보호자',
    },
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
}

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
  const { vetsList } = useOncologyContext()
  const [diagnosisName, setDiagnosisName] = useState('')
  const [selectedVet, setSelectedVet] = useState<string>('none')
  const [isRegistering, setIsRegistering] = useState(false)

  const handleRegister = async () => {
    try {
      setIsRegistering(true)
      const caseId = await registerOncologyCase({
        hosId,
        patientId,
        targetDate,
        diagnosisName: diagnosisName.trim() || '미입력',
        vetId: selectedVet === 'none' ? null : selectedVet,
      })
      toast.success('항암 케이스가 등록되었습니다.')
      setIsRegisterDialogOpen(false)
      onRegistered()
      router.push(`/hospital/${hosId}/oncology/${targetDate}/${caseId}`)
    } catch {
      toast.error('등록에 실패했습니다.')
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="진단명 (선택)"
        value={diagnosisName}
        onChange={(e) => setDiagnosisName(e.target.value)}
        className="h-8 w-[180px] text-xs"
        onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
      />
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
        className="rounded bg-rose-600 px-3 py-1.5 text-xs text-white hover:bg-rose-700 disabled:opacity-50"
      >
        등록
      </button>
    </div>
  )
}
