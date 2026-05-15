'use client'

import { usePathname, useRouter } from 'next/navigation'
import type { OncologySidebarItem } from '@/types/hospital/oncology-type'
import OncologyPatientButton from '../oncology-patient-button'
import OncologyRegisterDialog from '../oncology-register-dialog'
import OncologyDateSelector from '../oncology-date-selector'

interface MobileOncologySidebarProps {
  hosId: string
  targetDate: string
  items: OncologySidebarItem[]
  handleCloseMobileDrawer?: () => void
}

export function MobileOncologySidebar({
  hosId,
  targetDate,
  items,
  handleCloseMobileDrawer,
}: MobileOncologySidebarProps) {
  const pathname = usePathname()
  const { refresh } = useRouter()

  const activeCaseId = pathname.split('/')[6]

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-2 py-1">
        <OncologyDateSelector hosId={hosId} targetDate={targetDate} />
      </div>

      <div className="p-2">
        <OncologyRegisterDialog
          hosId={hosId}
          targetDate={targetDate}
          onRegistered={refresh}
        />
      </div>

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {items.length === 0 ? (
          <p className="py-4 text-center text-[10px] text-muted-foreground">
            등록된 케이스 없음
          </p>
        ) : (
          items.map((item) => (
            <OncologyPatientButton
              key={item.id}
              item={item}
              hosId={hosId}
              targetDate={targetDate}
              isActive={activeCaseId === item.id}
              onClick={handleCloseMobileDrawer}
            />
          ))
        )}
      </div>
    </div>
  )
}
