'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { EchoSidebarItem } from '@/types/echocardio/echocardio-type'
import EchoPatientButton from './echo-patient-button'
import EchoRegisterDialog from './echo-register-dialog'
import EchoDateSelector from './echo-date-selector'
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
  const pathname = usePathname()

  const [items, setItems] = useState<EchoSidebarItem[]>(initialItems)
  const [showDialog, setShowDialog] = useState(false)

  const activeEchoId = pathname.split('/').pop()

  async function refreshItems() {
    const updated = await fetchEchoSidebarData(hosId, targetDate)
    setItems(updated)
  }

  return (
    <div className="flex h-full flex-col border-r bg-white">
      {/* 날짜 네비게이션 */}
      <div className="border-b px-2 py-1">
        <EchoDateSelector hosId={hosId} targetDate={targetDate} />
      </div>

      {/* 등록 버튼 */}
      <div className="border-b px-2 py-2">
        <Button size="sm" className="w-full pr-4 text-sm" onClick={() => setShowDialog(true)}>
          <PlusIcon />
          심초차트 등록
        </Button>
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
