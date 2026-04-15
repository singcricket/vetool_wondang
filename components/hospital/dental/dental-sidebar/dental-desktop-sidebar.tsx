'use client'

import { usePathname } from 'next/navigation'
import type { DentalSidebarItem } from '@/types/dental/dental-type'
import DentalPatientButton from './dental-patient-button'
import DentalRegisterDialog from './dental-register-dialog'
import DentalDateSelector from './dental-date-selector'
import { useRouter } from 'next/navigation'

interface DentalDesktopSidebarProps {
  hosId: string
  targetDate: string
  items: DentalSidebarItem[]
  handleCloseMobileDrawer?: () => void
}

export default function DentalDesktopSidebar({
  hosId,
  targetDate,
  items,
  handleCloseMobileDrawer,
}: DentalDesktopSidebarProps) {
  const pathname = usePathname()
  const { refresh } = useRouter()

  const activeDentalId = pathname.split('/').pop()

  return (
    <aside className="fixed z-40 hidden h-desktop w-[200px] shrink-0 flex-col border-r bg-white 2xl:flex">
      {/* 날짜 네비게이션 */}
      <div className="border-b px-2 py-1">
        <DentalDateSelector hosId={hosId} targetDate={targetDate} />
      </div>

      {/* 등록 버튼 */}
      <DentalRegisterDialog
        hosId={hosId}
        targetDate={targetDate}
        onRegistered={refresh}
      />

      {/* 환자 목록 */}
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {items.length === 0 ? (
          <p className="py-4 text-center text-[10px] text-muted-foreground">
            등록된 차트 없음
          </p>
        ) : (
          items.map((item) => (
            <DentalPatientButton
              key={item.id}
              item={item}
              hosId={hosId}
              targetDate={targetDate}
              isActive={activeDentalId === item.id}
              onClick={handleCloseMobileDrawer}
            />
          ))
        )}
      </div>
    </aside>
  )
}
