'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils/utils'
import type { OphthalmicSidebarItem } from '@/lib/services/ophthalmic/fetch-ophthalmic'
import { User, Stethoscope } from 'lucide-react'

interface Props {
  item: OphthalmicSidebarItem
  hosId: string
  targetDate: string
  isActive: boolean
  onClick?: () => void
}

export default function OphthalmicPatientButton({
  item,
  hosId,
  targetDate,
  isActive,
  onClick,
}: Props) {
  return (
    <Link
      href={`/hospital/${hosId}/ophthalmic/${targetDate}/${item.id}`}
      onClick={onClick}
      className={cn(
        'group flex flex-col rounded-md border p-2 transition-all hover:border-blue-300 hover:bg-blue-50/50',
        isActive 
          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
          : 'border-slate-200 bg-white'
      )}
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className={cn(
          'truncate text-xs font-bold',
          isActive ? 'text-blue-700' : 'text-slate-700'
        )}>
          {item.patient_name}
        </span>
        <span className="shrink-0 text-[9px] text-slate-400">
          {item.hos_patient_id}
        </span>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="rounded bg-slate-100 px-1 py-0.5 text-[9px] font-medium text-slate-600">
            {item.breed}
          </span>
        </div>
        
        <div className="flex items-center gap-1 text-[9px] text-slate-400">
          {item.vet_name ? (
            <div className="flex items-center gap-0.5">
              <Stethoscope size={10} />
              <span className="truncate max-w-[40px]">{item.vet_name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-0.5">
              <User size={10} />
              <span className="truncate max-w-[40px]">{item.evaluator_name || '-'}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
