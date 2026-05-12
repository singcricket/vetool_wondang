'use client'

import { usePathname, useRouter } from 'next/navigation'
import type { OphthalmicSidebarItem } from '@/lib/services/ophthalmic/fetch-ophthalmic'
import OphthalmicPatientButton from '../ophthalmic-patient-button'
import OphthalmicRegisterDialog from '../ophthalmic-register-dialog'
import OphthalmicDateSelector from '../ophthalmic-date-selector'

interface MobileOphthalmicSidebarProps {
  hosId: string
  targetDate: string
  items: OphthalmicSidebarItem[]
  handleCloseMobileDrawer?: () => void
}

export function MobileOphthalmicSidebar({
  hosId,
  targetDate,
  items,
  handleCloseMobileDrawer,
}: MobileOphthalmicSidebarProps) {
  const pathname = usePathname()
  const { refresh } = useRouter()

  const activeOphthalmicId = pathname.split('/').pop()

  return (
    <div className="flex h-full flex-col">
      {/* 날짜 네비게이션 */}
      <div className="border-b px-2 py-1">
        <OphthalmicDateSelector hosId={hosId} targetDate={targetDate} />
      </div>

      {/* 등록 버튼 */}
      <div className="p-2">
        <OphthalmicRegisterDialog
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
            <OphthalmicPatientButton
              key={item.id}
              item={item}
              hosId={hosId}
              targetDate={targetDate}
              isActive={activeOphthalmicId === item.id}
              onClick={handleCloseMobileDrawer}
            />
          ))
        )}
      </div>
    </div>
  )
}
