'use client'

import { usePathname, useRouter } from 'next/navigation'
import type { OncologySidebarItem } from '@/types/hospital/oncology-type'
import OncologyPatientButton from './oncology-patient-button'
import OncologyRegisterDialog from './oncology-register-dialog'
import OncologyDateSelector from './oncology-date-selector'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface OncologyDesktopSidebarProps {
  hosId: string
  targetDate: string
  items: OncologySidebarItem[]
  handleCloseMobileDrawer?: () => void
}

export default function OncologyDesktopSidebar({
  hosId,
  targetDate,
  items,
  handleCloseMobileDrawer,
}: OncologyDesktopSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('oncology_sidebar_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'onco_cases',
          filter: `hos_id=eq.${hosId}`,
        },
        (payload) => {
          const newData = payload.new as any
          const oldData = payload.old as any
          if (newData?.case_date === targetDate || oldData?.case_date === targetDate) {
            router.refresh()
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [hosId, targetDate, router])

  const activeCaseId = pathname.split('/')[6]

  return (
    <aside className="fixed z-40 hidden h-desktop w-[200px] shrink-0 flex-col border-r bg-white 2xl:flex">
      <div className="border-b px-2 py-1">
        <OncologyDateSelector hosId={hosId} targetDate={targetDate} />
      </div>

      <OncologyRegisterDialog
        hosId={hosId}
        targetDate={targetDate}
        onRegistered={() => router.refresh()}
      />

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
    </aside>
  )
}
