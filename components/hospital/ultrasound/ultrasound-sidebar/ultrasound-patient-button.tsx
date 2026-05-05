'use client'

import { useRouter } from 'next/navigation'
import type { UltrasoundSidebarItem } from '@/lib/services/ultrasound/fetch-ultrasound'
import { cn } from '@/lib/utils/utils'
import { UserCircle } from 'lucide-react'

interface UltrasoundPatientButtonProps {
  item: UltrasoundSidebarItem
  hosId: string
  targetDate: string
  isActive: boolean
  onClick?: () => void
}

export default function UltrasoundPatientButton({
  item,
  hosId,
  targetDate,
  isActive,
  onClick,
}: UltrasoundPatientButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/hospital/${hosId}/ultrasound/${targetDate}/${item.id}`)
    onClick?.()
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex flex-col gap-1 rounded-md p-2 text-left transition-colors',
        isActive
          ? 'bg-blue-50 border border-blue-200'
          : 'hover:bg-slate-100 border border-transparent',
      )}
    >
      <div className="flex items-center gap-2">
        <UserCircle className={cn("w-4 h-4", isActive ? "text-blue-600" : "text-slate-400")} />
        <span className={cn("text-xs font-bold", isActive ? "text-blue-700" : "text-slate-700")}>
          {item.patient_name}
        </span>
        {item.breed && (
          <span className="text-[10px] text-slate-400 truncate">
            {item.breed}
          </span>
        )}
      </div>
      {item.vet_name && (
        <div className="flex items-center gap-1 pl-6">
          <span className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
            담당의: {item.vet_name}
          </span>
        </div>
      )}
    </button>
  )
}
