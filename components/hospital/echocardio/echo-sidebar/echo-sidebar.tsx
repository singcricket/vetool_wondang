'use client'

import { useState, useTransition } from 'react'
import { usePathname } from 'next/navigation'
import { format, addDays, subDays, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { EchoSidebarItem } from '@/types/echocardio/echocardio-type'
import EchoPatientButton from './echo-patient-button'
import EchoRegisterDialog from './echo-register-dialog'
import { fetchEchoSidebarData } from '@/lib/services/echocardio/fetch-echo'

interface EchoSidebarProps {
  hosId: string
  targetDate: string
  initialItems: EchoSidebarItem[]
}

export default function EchoSidebar({
  hosId,
  targetDate,
  initialItems,
}: EchoSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [items, setItems] = useState<EchoSidebarItem[]>(initialItems)
  const [showDialog, setShowDialog] = useState(false)

  const currentDate = parseISO(targetDate)
  const activeEchoId = pathname.split('/').pop()

  function navigateDate(direction: 'prev' | 'next') {
    const newDate = direction === 'prev'
      ? subDays(currentDate, 1)
      : addDays(currentDate, 1)
    router.push(
      `/hospital/${hosId}/echocardio/${format(newDate, 'yyyy-MM-dd')}`,
    )
  }

  async function refreshItems() {
    const updated = await fetchEchoSidebarData(hosId, targetDate)
    setItems(updated)
  }

  return (
    <div className="flex h-full flex-col border-r bg-white">
      {/* 날짜 네비게이션 */}
      <div className="flex items-center justify-between border-b px-2 py-2">
        <button
          onClick={() => navigateDate('prev')}
          className="rounded p-0.5 hover:bg-muted"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-xs font-bold">
            {format(currentDate, 'MM.dd')}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {format(currentDate, 'EEE', { locale: ko })}
          </span>
        </div>

        <button
          onClick={() => navigateDate('next')}
          className="rounded p-0.5 hover:bg-muted"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 심초차트 타이틀 + 등록 버튼 */}
      <div className="flex items-center justify-between border-b px-2 py-1.5">
        <span className="text-xs font-bold text-muted-foreground">
          심초차트
        </span>
        <button
          onClick={() => setShowDialog(true)}
          className="flex items-center gap-0.5 rounded p-0.5 hover:bg-muted"
          title="새 차트 등록"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 환자 목록 */}
      <div className="flex flex-col gap-1 overflow-y-auto p-2">
        {items.length === 0 ? (
          <p className="py-4 text-center text-[10px] text-muted-foreground">
            등록된 차트 없음
          </p>
        ) : (
          items.map((item) => (
            <EchoPatientButton
              key={item.id}
              item={item}
              hosId={hosId}
              targetDate={targetDate}
              isActive={activeEchoId === item.id}
            />
          ))
        )}
      </div>

      {/* 등록 다이얼로그 */}
      {showDialog && (
        <EchoRegisterDialog
          hosId={hosId}
          targetDate={targetDate}
          onClose={() => setShowDialog(false)}
          onRegistered={() => {
            setShowDialog(false)
            refreshItems()
          }}
        />
      )}
    </div>
  )
}
