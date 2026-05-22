'use client'

import { useRouter } from 'next/navigation'
import type { CheckupSidebarItem } from '@/types/hospital/checkup-type'
import CheckupDateSelector from '../checkup-date-selector'
import CheckupRegisterDialog from '../checkup-register-dialog'
import CheckupPatientButton from '../checkup-patient-button'
import { usePathname } from 'next/navigation'

interface Props {
  hosId: string
  targetDate: string
  items: CheckupSidebarItem[]
  handleCloseMobileDrawer: () => void
}

export function MobileCheckupSidebar({ hosId, targetDate, items, handleCloseMobileDrawer }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const activeCheckupId = pathname.split('/')[6]

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-2 py-1">
        <CheckupDateSelector hosId={hosId} targetDate={targetDate} />
      </div>

      <CheckupRegisterDialog
        hosId={hosId}
        targetDate={targetDate}
        onRegistered={() => {
          router.refresh()
          handleCloseMobileDrawer()
        }}
      />

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {items.length === 0 ? (
          <p className="py-4 text-center text-[10px] text-muted-foreground">등록된 검진 없음</p>
        ) : (
          items.map((item) => (
            <CheckupPatientButton
              key={item.id}
              item={item}
              hosId={hosId}
              targetDate={targetDate}
              isActive={activeCheckupId === item.id}
              onClick={handleCloseMobileDrawer}
            />
          ))
        )}
      </div>
    </div>
  )
}
