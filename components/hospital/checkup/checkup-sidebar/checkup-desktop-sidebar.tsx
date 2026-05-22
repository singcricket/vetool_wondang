'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { CheckupSidebarItem } from '@/types/hospital/checkup-type'
import CheckupDateSelector from './checkup-date-selector'
import CheckupRegisterDialog from './checkup-register-dialog'
import CheckupPatientButton from './checkup-patient-button'

interface Props {
  hosId: string
  targetDate: string
  items: CheckupSidebarItem[]
  handleCloseMobileDrawer?: () => void
}

export default function CheckupDesktopSidebar({ hosId, targetDate, items, handleCloseMobileDrawer }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('checkup_sidebar_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checkup_records',
          filter: `hos_id=eq.${hosId}`,
        },
        (payload) => {
          const newData = payload.new as any
          const oldData = payload.old as any
          if (newData?.checkup_date === targetDate || oldData?.checkup_date === targetDate) {
            router.refresh()
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [hosId, targetDate, router])

  const activeCheckupId = pathname.split('/')[6]

  return (
    <aside className="fixed z-40 hidden h-desktop w-[200px] shrink-0 flex-col border-r bg-white 2xl:flex">
      <div className="border-b px-2 py-1">
        <CheckupDateSelector hosId={hosId} targetDate={targetDate} />
      </div>

      <CheckupRegisterDialog
        hosId={hosId}
        targetDate={targetDate}
        onRegistered={() => router.refresh()}
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
    </aside>
  )
}
