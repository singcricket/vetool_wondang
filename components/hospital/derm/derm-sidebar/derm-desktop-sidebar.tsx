'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DermSidebarItem } from '@/lib/services/derm/fetch-derm'
import DermPatientButton from './derm-patient-button'
import DermRegisterDialog from './derm-register-dialog'
import DermDateSelector from './derm-date-selector'

interface Props {
  hosId: string
  targetDate: string
  items: DermSidebarItem[]
}

export default function DermDesktopSidebar({ hosId, targetDate, items }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('derm_sidebar_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'derm_charts', filter: `hos_id=eq.${hosId}` },
        (payload) => {
          const newData = payload.new as any
          const oldData = payload.old as any
          if (newData?.chart_date === targetDate || oldData?.chart_date === targetDate) {
            router.refresh()
          }
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [hosId, targetDate, router])

  const activeChartId = pathname.split('/').pop()

  return (
    <aside className="fixed z-40 hidden h-desktop w-[200px] shrink-0 flex-col border-r bg-white 2xl:flex">
      <div className="border-b px-2 py-1">
        <DermDateSelector hosId={hosId} targetDate={targetDate} />
      </div>

      <DermRegisterDialog
        hosId={hosId}
        targetDate={targetDate}
        onRegistered={() => router.refresh()}
      />

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {items.length === 0 ? (
          <p className="py-4 text-center text-[10px] text-muted-foreground">등록된 차트 없음</p>
        ) : (
          items.map((item) => (
            <DermPatientButton
              key={item.id}
              item={item}
              hosId={hosId}
              targetDate={targetDate}
              isActive={activeChartId === item.id}
            />
          ))
        )}
      </div>
    </aside>
  )
}
