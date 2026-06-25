'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/utils'
import { ClipboardList, History, Package, Settings, BookOpen, PackageCheck } from 'lucide-react'

const NAV_ITEMS = [
  { label: '주문', path: 'order', icon: ClipboardList },
  { label: '주문내역', path: 'history', icon: History },
  { label: '입고내역', path: 'stock-in-history', icon: PackageCheck },
  { label: '재고현황', path: 'inventory', icon: Package },
  { label: '수불대장', path: 'ledger', icon: BookOpen },
  { label: '설정', path: 'settings', icon: Settings },
] as const

interface Props {
  hosId: string
}

export default function SupplyOrderFooterNav({ hosId }: Props) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white 2xl:left-10">
      <ul className="flex h-14 items-stretch">
        {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
          const href = `/hospital/${hosId}/supply-order/${path}`
          const isActive = pathname.startsWith(href)

          return (
            <li key={path} className="flex flex-1">
              <Link
                href={href as any}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] transition-colors',
                  isActive
                    ? 'text-teal-600'
                    : 'text-slate-400 hover:text-slate-600',
                )}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span className={cn('font-medium', isActive && 'font-semibold')}>
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
