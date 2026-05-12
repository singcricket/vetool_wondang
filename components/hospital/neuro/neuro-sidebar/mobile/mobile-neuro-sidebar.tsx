'use client'

import { usePathname, useRouter } from 'next/navigation'
import type { NeuroSidebarItem } from '@/lib/services/neuro/fetch-neuro'
import NeuroPatientButton from '../neuro-patient-button'
import NeuroRegisterDialog from '../neuro-register-dialog'
import NeuroDateSelector from '../neuro-date-selector'

interface MobileNeuroSidebarProps {
  hosId: string
  targetDate: string
  items: NeuroSidebarItem[]
  handleCloseMobileDrawer?: () => void
}

export function MobileNeuroSidebar({
  hosId,
  targetDate,
  items,
  handleCloseMobileDrawer,
}: MobileNeuroSidebarProps) {
  const pathname = usePathname()
  const { refresh } = useRouter()

  const activeNeuroId = pathname.split('/').pop()

  return (
    <div className="flex h-full flex-col">
      {/* 날짜 네비게이션 */}
      <div className="border-b px-2 py-1">
        <NeuroDateSelector hosId={hosId} targetDate={targetDate} />
      </div>

      {/* 등록 버튼 */}
      <div className="p-2">
        <NeuroRegisterDialog
          hosId={hosId}
          targetDate={targetDate}
          onRegistered={refresh}
          className="w-full"
        />
      </div>

      {/* 환자 목록 */}
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {items.length === 0 ? (
          <p className="py-4 text-center text-[10px] text-muted-foreground">
            등록된 차트 없음
          </p>
        ) : (
          items.map((item) => (
            <NeuroPatientButton
              key={item.id}
              item={item}
              hosId={hosId}
              targetDate={targetDate}
              isActive={activeNeuroId === item.id}
              onClick={handleCloseMobileDrawer}
            />
          ))
        )}
      </div>
    </div>
  )
}
