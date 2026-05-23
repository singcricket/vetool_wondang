'use client'

import { usePathname, useRouter } from 'next/navigation'
import type { UltrasoundSidebarItem } from '@/lib/services/ultrasound/fetch-ultrasound'
import UltrasoundPatientButton from '../ultrasound-patient-button'
import UltrasoundRegisterDialog from '../ultrasound-register-dialog'
import UltrasoundDateSelector from '../ultrasound-date-selector'

interface MobileUltrasoundSidebarProps {
  hosId: string
  targetDate: string
  items: UltrasoundSidebarItem[]
  handleCloseMobileDrawer?: () => void
}

export function MobileUltrasoundSidebar({
  hosId,
  targetDate,
  items,
  handleCloseMobileDrawer,
}: MobileUltrasoundSidebarProps) {
  const pathname = usePathname()
  const { refresh } = useRouter()

  const activeUltrasoundId = pathname.split('/').pop()

  return (
    <div className="flex h-full flex-col">
      {/* 날짜 네비게이션 */}
      <div className="border-b px-2 py-1">
        <UltrasoundDateSelector hosId={hosId} targetDate={targetDate} />
      </div>

      {/* 등록 버튼 */}
      <div className="p-2">
        <UltrasoundRegisterDialog
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
            <UltrasoundPatientButton
              key={item.id}
              item={item}
              hosId={hosId}
              targetDate={targetDate}
              isActive={activeUltrasoundId === item.id}
              onClick={handleCloseMobileDrawer}
            />
          ))
        )}
      </div>
    </div>
  )
}
