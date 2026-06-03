'use client'

import AdminSidebarItem from '@/components/hospital/admin/admin-sidebar-item'
import { BrainCircuit, CalendarCheck2, SyringeIcon, UserCheckIcon, UsersIcon } from 'lucide-react'

interface Props {
  isSuper?: boolean
}

export default function AdminSidebar({ isSuper }: Props) {
  const items = [
    ...ADMIN_SIDEBAR_ITEMS,
    ...(isSuper ? SUPER_ONLY_ITEMS : []),
  ]

  return (
    <aside className="h-screen w-48 border-r">
      <ul className="flex flex-col gap-1 p-2">
        {items.map((item) => (
          <AdminSidebarItem
            key={item.name}
            icon={item.icon}
            name={item.name}
            path={item.path}
          />
        ))}
      </ul>
    </aside>
  )
}

const ADMIN_SIDEBAR_ITEMS = [
  {
    name: '스태프관리',
    path: 'staff',
    icon: UsersIcon,
  },
  {
    name: '사용승인',
    path: 'approval',
    icon: UserCheckIcon,
  },
  {
    name: '입원차트 설정',
    path: 'icu-settings',
    icon: SyringeIcon,
  },
  {
    name: '근태관리',
    path: 'attendance',
    icon: CalendarCheck2,
  },
]

const SUPER_ONLY_ITEMS = [
  {
    name: 'AI사용량',
    path: 'ai-usage',
    icon: BrainCircuit,
  },
]
