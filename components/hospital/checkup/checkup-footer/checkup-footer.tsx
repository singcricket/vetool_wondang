'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/utils'
import { ClipboardList, FileBarChart2, Search, Share2 } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import CheckupShareDialog from './checkup-share-dialog'

type Props = {
  hosId: string
  targetDate: string
}

const FOOTER_MENUS = [
  { label: '차트 입력', value: 'chart', icon: <ClipboardList size={15} /> },
  { label: '검색', value: 'search', icon: <Search size={15} /> },
  { label: '리포트', value: 'report', icon: <FileBarChart2 size={15} /> },
] as const

type FooterValue = (typeof FOOTER_MENUS)[number]['value']

export default function CheckupFooter({ hosId, targetDate }: Props) {
  const { push } = useRouter()
  const path = usePathname()
  const [shareOpen, setShareOpen] = useState(false)

  // /hospital/:hosId/checkup/:targetDate/:checkupId?/:report?
  const segments = path.split('/')
  // segments: ['', 'hospital', hosId, 'checkup', targetDate, checkupIdOrSearch?, 'report'?]
  const seg5 = segments[5]
  const isSearch = !seg5 || seg5 === 'search'
  const checkupId = !isSearch ? seg5 : null
  const isReport = segments[6] === 'report'

  const activeTab: FooterValue = isReport ? 'report' : isSearch ? 'search' : 'chart'

  function handleNav(value: FooterValue) {
    if (value === 'search') {
      push(`/hospital/${hosId}/checkup/${targetDate}/search`)
    } else if (value === 'chart') {
      push(checkupId
        ? `/hospital/${hosId}/checkup/${targetDate}/${checkupId}`
        : `/hospital/${hosId}/checkup/${targetDate}`)
    } else if (value === 'report') {
      push(checkupId
        ? `/hospital/${hosId}/checkup/${targetDate}/${checkupId}/report`
        : `/hospital/${hosId}/checkup/${targetDate}`)
    }
  }

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 z-40 flex h-[calc(2.5rem+env(safe-area-inset-bottom))] items-center justify-between border-t bg-white px-2 print:hidden 2xl:left-10">
        <ul className="flex h-10 items-center gap-2">
          {FOOTER_MENUS.map(({ label, value, icon }) => (
            <li key={value}>
              <Button
                size="sm"
                variant="ghost"
                className={cn(
                  'flex items-center gap-1 mx-2',
                  activeTab === value && 'bg-muted font-semibold',
                )}
                onClick={() => handleNav(value)}
              >
                {icon}
                {label}
              </Button>
            </li>
          ))}
        </ul>

        {/* 보호자 공유 — checkupId가 있을 때만 */}
        {checkupId && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShareOpen(true)}
            className="mr-2 flex items-center gap-1 text-teal-600 hover:bg-teal-50 hover:text-teal-700"
          >
            <Share2 size={14} />
            공유
          </Button>
        )}
      </footer>

      {checkupId && (
        <CheckupShareDialog
          isOpen={shareOpen}
          onOpenChange={setShareOpen}
          checkupId={checkupId}
          hosId={hosId}
        />
      )}
    </>
  )
}
