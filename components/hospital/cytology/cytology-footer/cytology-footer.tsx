'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/utils'
import { FileTextIcon, SearchIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

type Props = {
  hosId: string
  targetDate: string
}

const FOOTER_MENUS = [
  {
    label: '차트',
    value: 'chart',
    icon: <FileTextIcon />,
  },
  {
    label: '차트 검색',
    value: 'search',
    icon: <SearchIcon />,
  },
] as const

type FooterValue = (typeof FOOTER_MENUS)[number]['value']

export default function CytologyFooter({ hosId, targetDate }: Props) {
  const { push } = useRouter()
  const path = usePathname()

  const segments = path.split('/')
  const sub = segments[5] as FooterValue | undefined

  const activeTab: FooterValue = sub === 'search' ? 'search' : 'chart'

  function handleNav(value: FooterValue) {
    if (value === 'chart') {
      push(`/hospital/${hosId}/cytology/${targetDate}`)
    } else {
      push(`/hospital/${hosId}/cytology/${targetDate}/${value}`)
    }
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 flex h-[calc(2.5rem+env(safe-area-inset-bottom))] justify-between border-t bg-white 2xl:left-10">
      <ul className="flex h-10 items-center gap-2">
        {FOOTER_MENUS.map(({ label, value, icon }) => (
          <li key={value} className="block">
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
