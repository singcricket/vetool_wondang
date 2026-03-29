'use client'

import { usePathname } from 'next/navigation'
import type { EchoSidebarItem } from '@/types/echocardio/echocardio-type'
import EchoPatientButton from './echo-patient-button'
import EchoRegisterDialog from './echo-register-dialog'
import EchoDateSelector from './echo-date-selector'
import { useRouter } from 'next/navigation'

interface EchoDesktopSidebarProps {
  hosId: string
  targetDate: string
  items: EchoSidebarItem[]
  handleCloseMobileDrawer?: () => void
}

export default function EchoDesktopSidebar({
  hosId,
  targetDate,
  items,
  handleCloseMobileDrawer,
}: EchoDesktopSidebarProps) {
  const pathname = usePathname()
  const { refresh } = useRouter()

  const activeEchoId = pathname.split('/').pop()

  return (
    <aside className="fixed z-40 hidden h-desktop w-[200px] shrink-0 flex-col border-r bg-white 2xl:flex">
      {/* 날짜 네비게이션 */}
      <div className="border-b px-2 py-1">
        <EchoDateSelector hosId={hosId} targetDate={targetDate} />
      </div>

      {/* 등록 버튼 */}
      <EchoRegisterDialog
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
            <EchoPatientButton
              key={item.id}
              item={item}
              hosId={hosId}
              targetDate={targetDate}
              isActive={activeEchoId === item.id}
              onClick={handleCloseMobileDrawer}
            />
          ))
        )}
      </div>
    </aside>
  )
}
