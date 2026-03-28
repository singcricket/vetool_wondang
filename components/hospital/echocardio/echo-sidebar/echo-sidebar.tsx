'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { BarChart2Icon, FileTextIcon, SearchIcon } from 'lucide-react'
import type { EchoSidebarItem } from '@/types/echocardio/echocardio-type'
import EchoPatientButton from './echo-patient-button'
import EchoRegisterDialog from './echo-register-dialog'
import EchoDateSelector from './echo-date-selector'
import { fetchEchoSidebarData } from '@/lib/services/echocardio/fetch-echo'
import { cn } from '@/lib/utils/utils'

type FooterTab = 'chart' | 'search' | 'stats'

const FOOTER_TABS: { key: FooterTab; label: string; icon: React.ReactNode }[] =
  [
    { key: 'chart', label: '차트 작성', icon: <FileTextIcon className="h-3.5 w-3.5" /> },
    { key: 'search', label: '차트 검색', icon: <SearchIcon className="h-3.5 w-3.5" /> },
    { key: 'stats', label: '통계', icon: <BarChart2Icon className="h-3.5 w-3.5" /> },
  ]

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
  const [footerTab, setFooterTab] = useState<FooterTab>('chart')

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
        <EchoRegisterDialog
          hosId={hosId}
          targetDate={targetDate}
          onRegistered={refreshItems}
        />
      </div>

      {/* 환자 목록 */}
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {footerTab === 'chart' && (
          <>
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
          </>
        )}

        {footerTab === 'search' && (
          <p className="py-4 text-center text-[10px] text-muted-foreground">
            차트 검색 — 준비 중
          </p>
        )}

        {footerTab === 'stats' && (
          <p className="py-4 text-center text-[10px] text-muted-foreground">
            통계 — 준비 중
          </p>
        )}
      </div>

      {/* 푸터 탭 */}
      <div className="flex border-t">
        {FOOTER_TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setFooterTab(key)}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors',
              footerTab === key
                ? 'border-t-2 border-black font-semibold text-black'
                : 'text-muted-foreground hover:bg-muted',
            )}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
