'use client'

import { usePathname, useRouter } from 'next/navigation'
import type { CytologySidebarItem } from '@/lib/services/cytology/fetch-cytology'
import CytologyPatientButton from '../cytology-patient-button'
import CytologyRegisterDialog from '../cytology-register-dialog'
import CytologyDateSelector from '../cytology-date-selector'

interface Props {
  hosId: string
  targetDate: string
  items: CytologySidebarItem[]
  handleCloseMobileDrawer?: () => void
}

export function MobileCytologySidebar({ hosId, targetDate, items, handleCloseMobileDrawer }: Props) {
  const pathname = usePathname()
  const { refresh } = useRouter()
  const activeChartId = pathname.split('/').pop()

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-2 py-1">
        <CytologyDateSelector hosId={hosId} targetDate={targetDate} />
      </div>

      <div className="p-2">
        <CytologyRegisterDialog hosId={hosId} targetDate={targetDate} onRegistered={refresh} className="w-full" />
      </div>

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {items.length === 0 ? (
          <p className="py-4 text-center text-[10px] text-muted-foreground">등록된 차트 없음</p>
        ) : (
          items.map((item) => (
            <CytologyPatientButton
              key={item.id}
              item={item}
              hosId={hosId}
              targetDate={targetDate}
              isActive={activeChartId === item.id}
              onClick={handleCloseMobileDrawer}
            />
          ))
        )}
      </div>
    </div>
  )
}
