'use client'

import { usePathname } from 'next/navigation'
import type { OphthalmicSidebarItem } from '@/lib/services/ophthalmic/fetch-ophthalmic'
import OphthalmicPatientButton from './ophthalmic-patient-button'
import OphthalmicRegisterDialog from './ophthalmic-register-dialog'
import OphthalmicDateSelector from './ophthalmic-date-selector'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { UserX } from 'lucide-react'

interface OphthalmicDesktopSidebarProps {
  hosId: string
  targetDate: string
  items: OphthalmicSidebarItem[]
  handleCloseMobileDrawer?: () => void
}

export default function OphthalmicDesktopSidebar({
  hosId,
  targetDate,
  items,
  handleCloseMobileDrawer,
}: OphthalmicDesktopSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('ophthalmic_sidebar_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ophthalmic_charts',
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
        <OphthalmicDateSelector hosId={hosId} targetDate={targetDate} />
      </div>

      {/* 등록 버튼 */}
      <OphthalmicRegisterDialog
        hosId={hosId}
        targetDate={targetDate}
        onRegistered={() => router.refresh()}
      />

      {/* 미등록 차트 생성 버튼
      <div className="border-b px-2 pb-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs text-muted-foreground gap-1"
          onClick={() => router.push(`/hospital/${hosId}/ophthalmic/${targetDate}/guest` as any)}
        >
          <UserX size={12} />
          미등록 차트 생성
        </Button>
      </div> */}

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
              isActive={activeChartId === item.id}
              onClick={handleCloseMobileDrawer}
            />
          ))
        )}
      </div>
    </aside>
  )
}
