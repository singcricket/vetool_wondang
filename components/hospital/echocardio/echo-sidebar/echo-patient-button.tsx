'use client'

import { useRouter } from 'next/navigation'
import type { EchoSidebarItem } from '@/types/echocardio/echocardio-type'

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
  const router = useRouter()

  return (
    <button
      onClick={() =>
        router.push(
          `/hospital/${hosId}/echocardio/${targetDate}/${item.id}`,
        )
      }
      className={`h-auto w-full rounded-md border px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted ${
        isActive ? 'border-black bg-muted shadow-sm' : 'border-transparent'
      }`}
    >
      <div className="flex w-full flex-col gap-0.5">
        {/* 환자명 + 종 */}
        <div className="flex items-center justify-between gap-1">
          <span className="truncate font-bold">{item.patient_name}</span>
          <span className="shrink-0 text-muted-foreground">{item.species}</span>
        </div>

        {/* 품종 + 차트번호 */}
        <div className="flex items-center justify-between gap-1 text-muted-foreground">
          <span className="truncate">{item.breed}</span>
          <span className="shrink-0">{item.hos_patient_id}</span>
        </div>

        {/* 담당의 / 검사자 */}
        {(item.vet_name || item.examiner_name) && (
          <div className="mt-0.5 flex gap-1 text-muted-foreground">
            {item.vet_name && (
              <span className="truncate">담:{item.vet_name}</span>
            )}
            {item.examiner_name && (
              <span className="truncate">검:{item.examiner_name}</span>
            )}
          </div>
        )}
      </div>
    </button>
  )
}
