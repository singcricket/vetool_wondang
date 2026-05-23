'use client'

import {
  BookmarkIcon,
  FileTextIcon,
  SearchIcon,
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

interface Props {
  hosId: string
  targetDate: string
}

const FOOTER_MENUS = [
  {
    label: '차트',
    value: 'chart',
    icon: <FileTextIcon />,
    hideInMobile: false,
  },
  {
    label: '검색',
    value: 'search',
    icon: <SearchIcon />,
    hideInMobile: false,
  },
] as const

type FooterValue = (typeof FOOTER_MENUS)[number]['value']

export default function UltrasoundFooter({ hosId, targetDate }: Props) {
  const { push } = useRouter()
  const path = usePathname()

  // /hospital/:hosId/ultrasound/:targetDate 이후 세그먼트
  const segments = path.split('/')
  const sub = segments[5]

  const activeTab: FooterValue =
    sub === 'search'
      ? 'search'
      : 'chart'

  function handleNav(value: FooterValue) {
    if (value === 'chart') {
      push(`/hospital/${hosId}/ultrasound/${targetDate}`)
    } else {
      push(`/hospital/${hosId}/ultrasound/${targetDate}/${value}`)
    }
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 flex h-[calc(2.5rem+env(safe-area-inset-bottom))] justify-between border-t bg-white 2xl:left-10">
      <ul className="flex h-10 items-center gap-2">
        {FOOTER_MENUS.map(({ label, value, icon, hideInMobile }) => (
          <li key={value} className={hideInMobile ? 'hidden md:block' : 'block'}>
            <button
              onClick={() => handleNav(value)}
              className={`flex h-10 w-20 flex-col items-center justify-center gap-1 transition-colors hover:bg-slate-50 ${
                activeTab === value
                  ? 'bg-slate-100 text-slate-900 font-bold'
                  : 'text-slate-500'
              }`}
            >
              <div className="[&>svg]:h-4 [&>svg]:w-4">{icon}</div>
              <span className="text-[10px]">{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </footer>
  )
}
