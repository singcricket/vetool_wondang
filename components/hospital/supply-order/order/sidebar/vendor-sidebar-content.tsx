'use client'

import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/utils'
import { Building2, Plus } from 'lucide-react'
import type { Vendor } from '@/types/hospital/supply-order-type'

interface Props {
  hosId: string
  vendors: Vendor[]
  onSelect?: () => void   // 모바일: 선택 후 Sheet 닫기
}

export default function VendorSidebarContent({ hosId, vendors, onSelect }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  const activeVendors = vendors.filter((v) => v.is_active)
  const activeVendorId = pathname.split('/').pop()

  // categories별 그룹핑 — 업체 하나가 여러 카테고리일 수 있으므로
  // 대표 카테고리(첫 번째)로 그룹핑
  const groups = activeVendors.reduce<Record<string, Vendor[]>>((acc, vendor) => {
    const category = vendor.categories[0] ?? '기타'
    if (!acc[category]) acc[category] = []
    acc[category].push(vendor)
    return acc
  }, {})

  // 카테고리가 없는 업체는 '기타'로
  const sortedGroups = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b, 'ko'))

  const handleClick = (vendorId: string) => {
    router.push(`/hospital/${hosId}/supply-order/order/${vendorId}` as any)
    onSelect?.()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b px-3 py-3">
        <p className="text-xs font-semibold text-slate-700">업체 선택</p>
        <p className="mt-0.5 text-[10px] text-slate-400">{activeVendors.length}개 활성 업체</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {activeVendors.length === 0 ? (
          <div className="flex flex-col items-center gap-1 py-8 text-center">
            <Building2 size={24} className="text-slate-300" />
            <p className="text-xs text-slate-400">등록된 업체가 없습니다.</p>
            <p className="text-[10px] text-slate-300">설정 → 업체에서 추가하세요.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sortedGroups.map(([category, categoryVendors]) => (
              <div key={category}>
                <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {category}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {categoryVendors.map((vendor) => {
                    const isActive = activeVendorId === vendor.id
                    return (
                      <li key={vendor.id}>
                        <button
                          type="button"
                          onClick={() => handleClick(vendor.id)}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
                            isActive
                              ? 'bg-teal-50 text-teal-700'
                              : 'text-slate-600 hover:bg-slate-100',
                          )}
                        >
                          <Building2
                            size={13}
                            className={isActive ? 'text-teal-500' : 'text-slate-400'}
                          />
                          <span className="flex-1 truncate text-xs font-medium">
                            {vendor.name}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
