'use client'

import SpeciesToIcon from '@/components/common/species-to-icon'
import { Button } from '@/components/ui/button'
import type { Species } from '@/constants/hospital/register/signalments'
import { cn, convertPascalCased } from '@/lib/utils/utils'
import type { EchoSidebarItem } from '@/types/echocardio/echocardio-type'
import { StethoscopeIcon, UserIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface EchoPatientButtonProps {
  item: EchoSidebarItem
  hosId: string
  targetDate: string
  isActive: boolean
}

export default function EchoPatientButton({
  item,
  hosId,
  targetDate,
  isActive,
}: EchoPatientButtonProps) {
  const { push } = useRouter()

  return (
    <Button
      variant="outline"
      className={cn(
        isActive && 'border border-black bg-muted shadow-md',
        'relative flex h-auto w-full flex-col gap-0 px-1.5 py-1',
      )}
      onClick={() =>
        push(`/hospital/${hosId}/echocardio/${targetDate}/${item.id}`)
      }
    >
      {/* 환자명 + 차트번호 */}
      <div className="flex w-full items-start justify-between gap-2">
        <div className="flex items-center gap-1 text-sm">
          <span className="font-bold">{item.patient_name}</span>
          <span className="text-xs font-light">{item.hos_patient_id}</span>
        </div>
      </div>

      {/* 담당의 + 검사자 */}
      <div className="mt-1 flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <UserIcon style={{ width: 15, height: 15 }} />
          <div className="max-w-[60px] truncate text-xs">
            {item.vet_name ?? '미지정'}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <StethoscopeIcon style={{ width: 15, height: 15 }} />
          <div className="max-w-[60px] truncate text-xs">
            {item.examiner_name ?? '미지정'}
          </div>
        </div>
      </div>

      {/* 종 + 품종 */}
      <div className="mt-1 flex w-full items-center gap-1">
        <SpeciesToIcon species={item.species as Species} size={15} />
        <div className="max-w-[120px] truncate text-xs">
          {convertPascalCased(item.breed)}
        </div>
      </div>
    </Button>
  )
}
