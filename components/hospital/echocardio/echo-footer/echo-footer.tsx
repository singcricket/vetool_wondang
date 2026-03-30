'use client'

import { Button } from '@/components/ui/button'
import { useEchoRealtime } from '@/hooks/use-echo-realtime'
import { cn } from '@/lib/utils/utils'
import { BarChart2Icon, BookmarkIcon, FileTextIcon, SearchIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import EchoRealtimeStatus from './echo-realtime-status'

type Props = {
  hosId: string
  targetDate: string
}

const FOOTER_MENUS = [
  {
    label: '차트 작성',
    value: 'chart',
    icon: <FileTextIcon />,
    hideInMobile: false,
  },
  {
    label: '차트 검색',
    value: 'search',
    icon: <SearchIcon />,
    hideInMobile: false,
  },
  {
    label: '통계',
    value: 'stats',
    icon: <BarChart2Icon />,
    hideInMobile: true,
  },
  {
    label: '템플릿',
    value: 'template',
    icon: <BookmarkIcon />,
    hideInMobile: false,
  },
] as const

type FooterValue = (typeof FOOTER_MENUS)[number]['value']

export default function EchoFooter({ hosId, targetDate }: Props) {
  const { push, refresh } = useRouter()
  const path = usePathname()

  const isRealtimeReady = useEchoRealtime(hosId)

  // /hospital/:hosId/echocardio/:targetDate 이후 세그먼트
  const segments = path.split('/')
  const sub = segments[5]

  const activeTab: FooterValue =
    sub === 'search'
      ? 'search'
      : sub === 'stats'
        ? 'stats'
        : sub === 'template'
          ? 'template'
          : 'chart'

  useEffect(() => {
    if (isRealtimeReady) {
      if (document.activeElement?.tagName !== 'INPUT') {
        refresh()
      }
    }
  }, [isRealtimeReady, refresh])

  function handleNav(value: FooterValue) {
    if (value === 'chart') {
      push(`/hospital/${hosId}/echocardio/${targetDate}`)
    } else {
      push(`/hospital/${hosId}/echocardio/${targetDate}/${value}`)
    }
  }



  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 flex h-[calc(2.5rem+env(safe-area-inset-bottom))] justify-between border-t bg-white 2xl:left-10">
      <ul className="flex h-10 items-center gap-2">
        <li className="mx-2">
          <EchoRealtimeStatus />
        </li>

        {FOOTER_MENUS.map(({ label, value, icon, hideInMobile }) => (
          <li key={value} className={hideInMobile ? 'hidden md:block' : 'block'}>
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                'flex items-center gap-1',
                activeTab === value && 'bg-muted',
              )}
              onClick={() => handleNav(value)}
            >
              {icon}
              {label}
            </Button>
          </li>
        ))}
      </ul>
    </footer>
  )
}
