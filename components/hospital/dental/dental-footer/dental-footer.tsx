'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/utils'
import { BookmarkIcon, FileTextIcon, SearchIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

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
    label: '템플릿',
    value: 'template',
    icon: <BookmarkIcon />,
    hideInMobile: false,
  },
] as const

type FooterValue = (typeof FOOTER_MENUS)[number]['value']

export default function DentalFooter({ hosId, targetDate }: Props) {
  const { push } = useRouter()
  const path = usePathname()

  // /hospital/:hosId/dental/:targetDate 이후 세그먼트
  const segments = path.split('/')
  const sub = segments[5]

  const activeTab: FooterValue =
    sub === 'search'
      ? 'search'
      : sub === 'template'
        ? 'template'
        : 'chart'

  function handleNav(value: FooterValue) {
    if (value === 'chart') {
      push(`/hospital/${hosId}/dental/${targetDate}`)
    } else {
      push(`/hospital/${hosId}/dental/${targetDate}/${value}`)
    }
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 flex h-[calc(2.5rem+env(safe-area-inset-bottom))] justify-between border-t bg-white 2xl:left-10">
      <ul className="flex h-10 items-center gap-2">
        {FOOTER_MENUS.map(({ label, value, icon, hideInMobile }) => (
          <li key={value} className={hideInMobile ? 'hidden md:block' : 'block'}>
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                'flex items-center gap-1 mx-2',
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
