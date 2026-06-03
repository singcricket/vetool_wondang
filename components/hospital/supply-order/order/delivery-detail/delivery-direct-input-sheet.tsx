'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Save, Sparkles, PackageOpen } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  createDeliveryItem,
  getLastDeliveryItemsByMaster,
  type LastDeliveryItem,
} from '@/lib/actions/supply-order/delivery-items-actions'
import ItemProductCombobox from './item-product-combobox'
import type { ItemProduct, OrderItem } from '@/types/hospital/supply-order-type'

interface Props {
  hosId: string
  deliveryId: string
  vendorId: string
  orderItems: OrderItem[]
  itemProducts: ItemProduct[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

type DirectRow = {
  orderItemId: string
  masterId: string
  masterName: string
  masterCategory: string[]
  orderQty: number
  orderUnit: string
  baseUnit: string
  linkedProducts: ItemProduct[]
  checked: boolean
  selectedProductId: string
  quantity: string
  unitsPerPackage: number
  unitPrice: string
  expiryDate: string
  lotNumber: string
  memo: string
  autoFilled: boolean
}

function buildRows(
  orderItems: OrderItem[],
  allProducts: ItemProduct[],
  lastItems: LastDeliveryItem[],
): DirectRow[] {
  const lastMap = new Map(lastItems.map((l) => [l.item_master_id, l]))

  return orderItems
    .filter((oi) => oi.item_master_id)
    .map((oi) => {
      const masterId = oi.item_master_id!
      const linked = allProducts.filter((p) => p.item_master_id === masterId && p.is_active)
      const last = lastMap.get(masterId)

      let selectedProductId = ''
      let quantity = ''
      let unitPrice = ''
      let unitsPerPackage = 1
      let autoFilled = false

      if (last) {
        const lastPid = last.item_product_id ?? ''
        // 마지막 납품 제품이 현재 연결된 목록에 있으면 우선 사용, 없으면 목록 첫 번째
        selectedProductId = linked.find((p) => p.id === lastPid)?.id ?? linked[0]?.id ?? lastPid
        quantity = String(last.quantity_received)
        unitPrice = last.unit_price != null ? String(last.unit_price) : ''
        unitsPerPackage = last.units_per_package
        autoFilled = true
      } else if (linked.length > 0) {
        selectedProductId = linked[0].id
        unitsPerPackage = linked[0].units_per_package
      }

      return {
        orderItemId: oi.id,
        masterId,
        masterName: oi.item_master?.generic_name ?? '(알 수 없음)',
        masterCategory: oi.item_master?.category ?? [],
        orderQty: oi.quantity,
        orderUnit: oi.unit,
        baseUnit: oi.item_master?.base_unit ?? '개',
        linkedProducts: linked,
        checked: true,
        selectedProductId,
        quantity,
        unitsPerPackage,
        unitPrice,
        expiryDate: '',
        lotNumber: '',
        memo: '',
        autoFilled,
      }
    })
}

export default function DeliveryDirectInputSheet({
  hosId, deliveryId, vendorId, orderItems, itemProducts, open, onOpenChange,
}: Props) {
  const router = useRouter()
  const [rows, setRows] = useState<DirectRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    const masterIds = orderItems
      .filter((oi) => oi.item_master_id)
      .map((oi) => oi.item_master_id!)
    if (masterIds.length === 0) { setRows([]); return }

    setLoading(true)
    getLastDeliveryItemsByMaster(hosId, vendorId, masterIds)
      .then((lastItems) => setRows(buildRows(orderItems, itemProducts, lastItems)))
      .catch(() => setRows(buildRows(orderItems, itemProducts, [])))
      .finally(() => setLoading(false))
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const update = (i: number, patch: Partial<DirectRow>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  const handleLinkedChange = (i: number, productId: string) => {
    const p = rows[i].linkedProducts.find((p) => p.id === productId)
    update(i, {
      selectedProductId: productId,
      unitsPerPackage: p?.units_per_package ?? 1,
      autoFilled: false,
    })
  }

  const handleComboboxSelect = (i: number, product: ItemProduct) => {
    update(i, {
      selectedProductId: product.id,
      unitsPerPackage: product.units_per_package,
      autoFilled: false,
    })
  }

  const checkedRows = rows.filter((r) => r.checked)
  const allChecked = rows.length > 0 && rows.every((r) => r.checked)

  const handleSubmit = async () => {
    if (checkedRows.length === 0) { toast.error('등록할 품목을 하나 이상 선택하세요.'); return }
    const invalid = checkedRows.find((r) => !r.quantity || Number(r.quantity) <= 0)
    if (invalid) { toast.error(`"${invalid.masterName}"의 수령 수량을 입력하세요.`); return }

    try {
      setSaving(true)
      for (const row of checkedRows) {
        await createDeliveryItem(hosId, deliveryId, {
          item_master_id: row.masterId,
          item_product_id: row.selectedProductId,
          quantity_received: Number(row.quantity),
          unit: row.baseUnit,
          units_per_package: row.unitsPerPackage,
          unit_price: row.unitPrice,
          expiry_date: row.expiryDate,
          lot_number: row.lotNumber,
          memo: row.memo,
        })
      }
      toast.success(`${checkedRows.length}개 품목이 등록되었습니다.`)
      onOpenChange(false)
      router.refresh()
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="shrink-0 border-b pb-3">
          <SheetTitle className="text-base">직접 입력</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 size={20} className="animate-spin text-slate-400" />
            </div>
          ) : rows.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-slate-400">
              <PackageOpen size={28} strokeWidth={1.2} />
              <p className="text-sm">주문 품목이 없습니다.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y">

              {/* 전체 선택 헤더 */}
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => { if (el) el.indeterminate = checkedRows.length > 0 && !allChecked }}
                  onChange={() => setRows((prev) => prev.map((r) => ({ ...r, checked: !allChecked })))}
                  className="h-3.5 w-3.5 cursor-pointer accent-teal-600"
                />
                <span className="text-xs text-slate-500">
                  전체 선택
                  <span className="ml-1 font-medium text-teal-600">
                    {checkedRows.length}/{rows.length}
                  </span>
                </span>
              </div>

              {rows.map((row, i) => (
                <div
                  key={row.orderItemId}
                  className={cn(
                    'flex flex-col gap-3 px-4 py-3.5 transition-opacity',
                    !row.checked && 'opacity-40',
                  )}
                >
                  {/* 행 헤더 */}
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={row.checked}
                      onChange={() => update(i, { checked: !row.checked })}
                      className="mt-0.5 h-3.5 w-3.5 cursor-pointer accent-teal-600"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-semibold text-slate-800">{row.masterName}</span>
                        {row.autoFilled && (
                          <span className="flex items-center gap-0.5 rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-medium text-indigo-600">
                            <Sparkles size={8} />
                            자동완성
                          </span>
                        )}
                      </div>
                      {row.masterCategory.length > 0 && (
                        <p className="text-[10px] text-slate-400">{row.masterCategory.join(', ')}</p>
                      )}
                      <p className="text-[10px] text-slate-400">
                        주문 {row.orderQty} {row.orderUnit}
                      </p>
                    </div>
                  </div>

                  {/* 제품 선택 */}
                  {row.linkedProducts.length > 0 ? (
                    // 연결된 제품이 있으면 select
                    <select
                      value={row.selectedProductId}
                      onChange={(e) => handleLinkedChange(i, e.target.value)}
                      disabled={!row.checked}
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm outline-none focus:ring-1 focus:ring-teal-400 disabled:opacity-50"
                    >
                      <option value="">제품 미지정</option>
                      {row.linkedProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.brand_name}
                          {p.specification ? ` (${p.specification})` : ''}
                          {p.manufacturer ? ` — ${p.manufacturer}` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    // 연결된 제품 없음 — 전체 검색
                    <div className={cn(!row.checked && 'pointer-events-none')}>
                      <ItemProductCombobox
                        itemProducts={itemProducts.filter((p) => p.is_active)}
                        value={row.selectedProductId}
                        onChange={(p) => handleComboboxSelect(i, p)}
                        onCreateNew={() => {}}
                        placeholder="제품 검색 (선택사항)"
                      />
                    </div>
                  )}

                  {/* 수량 + 단가 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500">수령 수량 *</p>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={row.quantity}
                          onChange={(e) => update(i, { quantity: e.target.value, autoFilled: false })}
                          disabled={!row.checked}
                          className="h-7 text-xs"
                          placeholder="0"
                        />
                        <span className="shrink-0 text-[11px] text-slate-400">{row.baseUnit}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500">납품 단가 (원)</p>
                      <Input
                        type="number"
                        min={0}
                        value={row.unitPrice}
                        onChange={(e) => update(i, { unitPrice: e.target.value, autoFilled: false })}
                        disabled={!row.checked}
                        className="h-7 text-xs"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* 소계 */}
                  {row.quantity && row.unitPrice && Number(row.quantity) > 0 && Number(row.unitPrice) > 0 && (
                    <p className="text-right text-[11px] font-medium text-teal-600">
                      소계 {(Number(row.quantity) * Number(row.unitPrice)).toLocaleString()}원
                    </p>
                  )}

                  {/* 유통기한 + 로트 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500">유통기한</p>
                      <Input
                        type="date"
                        value={row.expiryDate}
                        onChange={(e) => update(i, { expiryDate: e.target.value })}
                        disabled={!row.checked}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500">로트번호</p>
                      <Input
                        value={row.lotNumber}
                        onChange={(e) => update(i, { lotNumber: e.target.value })}
                        disabled={!row.checked}
                        className="h-7 text-xs"
                        placeholder="LOT-XXXXX"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t px-4 pb-1 pt-3">
          <Button
            onClick={handleSubmit}
            disabled={saving || loading || checkedRows.length === 0}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-40"
          >
            {saving
              ? <Loader2 size={14} className="mr-1 animate-spin" />
              : <Save size={14} className="mr-1" />}
            {saving ? '저장 중...' : `${checkedRows.length}개 품목 납품 등록`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
