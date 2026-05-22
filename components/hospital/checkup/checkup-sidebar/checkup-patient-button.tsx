'use client'

import SpeciesToIcon from '@/components/common/species-to-icon'
import { Button } from '@/components/ui/button'
import type { Species } from '@/constants/hospital/register/signalments'
import { cn, convertPascalCased } from '@/lib/utils/utils'
import type { CheckupSidebarItem, CheckupStatus } from '@/types/hospital/checkup-type'
import { UserIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

const STATUS_STYLE: Record<CheckupStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  reviewing: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
}

const STATUS_LABEL: Record<CheckupStatus, string> = {
  draft: '작성중',
  reviewing: '검토중',
  approved: '완료',
}

interface Props {
  item: CheckupSidebarItem
  hosId: string
  targetDate: string
  isActive: boolean
  onClick?: () => void
}

export default function CheckupPatientButton({ item, hosId, targetDate, isActive, onClick }: Props) {
  const { push } = useRouter()

  return (
    <Button
      variant="outline"
      className={cn(
        isActive && 'border border-black bg-muted shadow-md',
        'relative flex h-auto w-full flex-col gap-0 px-1.5 py-1',
      )}
      onClick={() => {
        push(`/hospital/${hosId}/checkup/${targetDate}/${item.id}`)
        onClick?.()
      }}
    >
      <div className="flex w-full items-start justify-between gap-1">
        <div className="flex items-center gap-1 text-sm">
          <span className="font-bold">{item.patient_name}</span>
          <span className="text-xs font-light">{item.hos_patient_id}</span>
        </div>
        <span
          className={cn(
            'rounded px-1 py-0.5 text-[9px] font-semibold shrink-0',
            STATUS_STYLE[item.status],
          )}
        >
          {STATUS_LABEL[item.status]}
        </span>
      </div>

      <div className="mt-1 flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <UserIcon style={{ width: 13, height: 13 }} />
          <div className="max-w-[60px] truncate text-xs">{item.vet_name ?? '미지정'}</div>
        </div>
        <div className="flex items-center gap-1">
          <SpeciesToIcon species={item.species as Species} size={13} />
          <div className="max-w-[70px] truncate text-xs">{convertPascalCased(item.breed)}</div>
        </div>
      </div>
    </Button>
  )
}
