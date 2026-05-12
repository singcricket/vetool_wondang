'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CytologySidebarItem } from '@/lib/services/cytology/fetch-cytology'
import CytologyPatientButton from './cytology-patient-button'
import CytologyRegisterDialog from './cytology-register-dialog'
import CytologyDateSelector from './cytology-date-selector'

interface Props {
  hosId: string
  targetDate: string
  items: CytologySidebarItem[]
  handleCloseMobileDrawer?: () => void
}

export default function CytologyDesktopSidebar({ hosId, targetDate, items, handleCloseMobileDrawer }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('cytology_sidebar_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cytology_charts', filter: `hos_id=eq.${hosId}` },
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
        <CytologyDateSelector hosId={hosId} targetDate={targetDate} />
      </div>

      <CytologyRegisterDialog
        hosId={hosId}
        targetDate={targetDate}
        onRegistered={() => router.refresh()}
      />

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
    </aside>
  )
}
