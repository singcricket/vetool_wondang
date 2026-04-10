'use client'

import RealtimeStatus from '@/components/hospital/icu/footer/realtime-status'
import { Button } from '@/components/ui/button'
import useIcuRealtime from '@/hooks/use-icu-realtime'
import { useSafeRefresh } from '@/hooks/use-safe-refresh'
import { cn } from '@/lib/utils/utils'
import { DashboardIcon } from '@radix-ui/react-icons'
import {
  BarChartHorizontal,
  Bookmark,
  ClipboardList,
  ListChecks,
  Search,
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

type IcuFooterProps = {
  hosId: string
  targetDate: string
  isVet: boolean
}

export default function IcuFooter({
  hosId,
  targetDate,
  isVet,
}: IcuFooterProps) {
  const safeRefresh = useSafeRefresh()

  const { push } = useRouter()
  const path = usePathname()

  useIcuRealtime(hosId)

  const currentIcuPath = path.split('/').at(5)

  const handleMoveToPath = (route: string) => {
    push(`/hospital/${hosId}/icu/${targetDate}/${route}` as any)
    safeRefresh()
  }

  const filteredMenus = FOOTER_MAIN_VIEW_MENUS.filter(
    (menu) => !menu.vetOnly || isVet,
  )

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 flex h-[calc(2.5rem+env(safe-area-inset-bottom))] justify-between border-t bg-white px-1 2xl:left-10">
      <ul className="flex h-10 items-center gap-1">
        {filteredMenus.map(({ label, route, icon, hideInMobile }) => (
          <li
            key={route}
            className={hideInMobile ? 'hidden md:block' : 'block'}
          >
            <Button
              disabled={route === 'analysis'}
              size="sm"
              variant="ghost"
              className={cn(
                currentIcuPath === route && 'bg-muted',
                'flex items-center gap-1',
              )}
              onClick={() => handleMoveToPath(route)}
            >
              {icon}
              {label}
            </Button>
          </li>
        ))}
      </ul>

      <RealtimeStatus />
    </footer>
  )
}

const FOOTER_MAIN_VIEW_MENUS = [
  {
    label: '종합현황',
    route: 'summary',
    icon: <DashboardIcon />,
    hideInMobile: false,
    vetOnly: true,
  },
  {
    label: '처치표',
    route: 'tx-table',
    icon: <ListChecks />,
    hideInMobile: false,
    vetOnly: false,
  },
  {
    label: '입원차트',
    route: 'chart',
    icon: <ClipboardList />,
    hideInMobile: false,
    vetOnly: true,
  },
  {
    label: '검색',
    route: 'search',
    icon: <Search />,
    hideInMobile: true,
    vetOnly: true,
  },
  {
    label: '템플릿',
    route: 'template',
    icon: <Bookmark />,
    hideInMobile: true,
    vetOnly: true,
  },
  {
    label: '통계',
    route: 'analysis',
    icon: <BarChartHorizontal />,
    hideInMobile: true,
    vetOnly: true,
  },
] as const
