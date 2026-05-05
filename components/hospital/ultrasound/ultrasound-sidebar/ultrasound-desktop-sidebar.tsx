'use client'

import { usePathname } from 'next/navigation'
import type { UltrasoundSidebarItem } from '@/lib/services/ultrasound/fetch-ultrasound'
import UltrasoundPatientButton from './ultrasound-patient-button'
import UltrasoundRegisterDialog from './ultrasound-register-dialog'
import UltrasoundDateSelector from './ultrasound-date-selector'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UltrasoundDesktopSidebarProps {
  hosId: string
  targetDate: string
  items: UltrasoundSidebarItem[]
  handleCloseMobileDrawer?: () => void
}

export default function UltrasoundDesktopSidebar({
  hosId,
  targetDate,
  items,
  handleCloseMobileDrawer,
}: UltrasoundDesktopSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  // Realtime 리스트 연동: 다른 PC에서 환자 추가/삭제 시 리스트 갱신
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('ultrasound_sidebar_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ultrasound_charts',
          filter: `hos_id=eq.${hosId}`
        },
        (payload) => {
          const newData = payload.new as any
          const oldData = payload.old as any
          
          if (newData?.chart_date === targetDate || oldData?.chart_date === targetDate) {
            router.refresh()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [hosId, targetDate, router])

  const activeChartId = pathname.split('/').pop()

  return (
    <aside className="fixed z-40 hidden h-desktop w-[200px] shrink-0 flex-col border-r bg-white 2xl:flex">
      {/* 날짜 네비게이션 */}
      <div className="border-b px-2 py-1">
        <UltrasoundDateSelector hosId={hosId} targetDate={targetDate} />
      </div>

      {/* 등록 버튼 */}
      <UltrasoundRegisterDialog
        hosId={hosId}
        targetDate={targetDate}
        onRegistered={() => router.refresh()}
      />

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
              isActive={activeChartId === item.id}
              onClick={handleCloseMobileDrawer}
            />
          ))
        )}
      </div>
    </aside>
  )
}
