'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { toggleVendorActive } from '@/lib/actions/supply-order/vendor-actions'
import { toast } from 'sonner'
import VendorFormSheet from './vendor-form-sheet'
import type { Vendor } from '@/types/hospital/supply-order-type'

interface Props {
  hosId: string
  vendors: Vendor[]
}

export default function VendorSection({ hosId, vendors }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Vendor | undefined>(undefined)
  const [toggling, setToggling] = useState<string | null>(null)

  const activeVendors = vendors.filter((v) => v.is_active)
  const inactiveVendors = vendors.filter((v) => !v.is_active)

  const openAdd = () => {
    setEditing(undefined)
    setSheetOpen(true)
  }

  const openEdit = (vendor: Vendor) => {
    setEditing(vendor)
    setSheetOpen(true)
  }

  const handleToggle = async (vendor: Vendor) => {
    try {
      setToggling(vendor.id)
      await toggleVendorActive(hosId, vendor.id, !vendor.is_active)
      toast.success(vendor.is_active ? '비활성화 되었습니다.' : '활성화 되었습니다.')
    } catch {
      toast.error('상태 변경에 실패했습니다.')
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">
          업체 <span className="ml-1 text-xs font-normal text-slate-400">{activeVendors.length}개 활성</span>
        </p>
        <Button size="sm" onClick={openAdd} className="gap-1 bg-teal-600 hover:bg-teal-700">
          <Plus size={14} />
          업체 추가
        </Button>
      </div>

      {vendors.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-slate-400">
          <Building2 size={32} strokeWidth={1.2} />
          <p className="text-sm">등록된 업체가 없습니다.</p>
          <Button size="sm" variant="outline" onClick={openAdd}>
            첫 업체 등록
          </Button>
        </div>
      )}

      {activeVendors.length > 0 && (
        <ul className="flex flex-col gap-2">
          {activeVendors.map((v) => (
            <VendorRow
              key={v.id}
              vendor={v}
              onEdit={() => openEdit(v)}
              onToggle={() => handleToggle(v)}
              toggling={toggling === v.id}
            />
          ))}
        </ul>
      )}

      {inactiveVendors.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-600">
            비활성 업체 {inactiveVendors.length}개 보기
          </summary>
          <ul className="mt-2 flex flex-col gap-2 opacity-60">
            {inactiveVendors.map((v) => (
              <VendorRow
                key={v.id}
                vendor={v}
                onEdit={() => openEdit(v)}
                onToggle={() => handleToggle(v)}
                toggling={toggling === v.id}
              />
            ))}
          </ul>
        </details>
      )}

      <VendorFormSheet
        hosId={hosId}
        vendor={editing}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}

function VendorRow({
  vendor,
  onEdit,
  onToggle,
  toggling,
}: {
  vendor: Vendor
  onEdit: () => void
  onToggle: () => void
  toggling: boolean
}) {
  return (
    <li className="flex items-center gap-3 rounded-lg border bg-white px-3 py-2.5">
      <div className="flex flex-1 flex-col gap-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-slate-800">{vendor.name}</span>
          {!vendor.is_active && (
            <Badge variant="outline" className="text-[10px] text-slate-400">비활성</Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {vendor.categories.map((cat) => (
            <span key={cat} className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] text-teal-700">
              {cat}
            </span>
          ))}
          {vendor.representative && (
            <span className="text-[11px] text-slate-400">대표: {vendor.representative}</span>
          )}
          {vendor.representative_phone && (
            <span className="text-[11px] text-slate-400">{vendor.representative_phone}</span>
          )}
        </div>
        {vendor.contacts.length > 0 && (
          <p className="text-[11px] text-slate-400">
            담당자 {vendor.contacts.length}명 등록
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
          <Pencil size={13} />
        </Button>
        <button
          type="button"
          disabled={toggling}
          onClick={onToggle}
          className={cn(
            'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
            vendor.is_active
              ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
              : 'text-teal-600 hover:bg-teal-50',
          )}
        >
          {toggling ? '...' : vendor.is_active ? '비활성화' : '활성화'}
        </button>
      </div>
    </li>
  )
}
