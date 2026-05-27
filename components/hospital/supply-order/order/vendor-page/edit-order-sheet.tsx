'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { updateOrder } from '@/lib/actions/supply-order/order-actions'
import { createItemMasterQuick } from '@/lib/actions/supply-order/item-master-actions'
import ItemMasterCombobox from '../../settings/item-product/item-master-combobox'
import type { Order, ItemMaster, OrderFormInput, OrderStatus } from '@/types/hospital/supply-order-type'
import { ORDER_STATUS_LABEL } from '@/types/hospital/supply-order-type'

type EditItemInput = {
  item_master_id: string
  custom_name: string
  quantity: number
  unit: string
  units_per_order_unit: number
  unit_price: string
  memo: string
}

const emptyItem = (): EditItemInput => ({
  item_master_id: '',
  custom_name: '',
  quantity: 1,
  unit: '개',
  units_per_order_unit: 1,
  unit_price: '',
  memo: '',
})

// 수정 가능한 상태 (납품완료 이후는 수정 불가)
const EDITABLE_STATUSES: OrderStatus[] = ['draft', 'ordered', 'confirmed', 'delivering', 'partial']

interface Props {
  hosId: string
  order: Order | null
  itemMasters: ItemMaster[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function EditOrderSheet({ hosId, order, itemMasters, open, onOpenChange }: Props) {
  const router = useRouter()

  const [orderDate, setOrderDate] = useState('')
  const [vendorContact, setVendorContact] = useState('')
  const [memo, setMemo] = useState('')
  const [items, setItems] = useState<EditItemInput[]>([emptyItem()])
  const [saving, setSaving] = useState(false)

  // 주문 데이터로 폼 초기화
  useEffect(() => {
    if (order && open) {
      setOrderDate(order.order_date)
      setVendorContact(order.vendor_contact ?? '')
      setMemo(order.memo ?? '')
      setItems(
        order.order_items && order.order_items.length > 0
          ? order.order_items.map((oi) => ({
              item_master_id: oi.item_master_id,
              custom_name: '',
              quantity: oi.quantity,
              unit: oi.unit,
              units_per_order_unit: oi.units_per_order_unit,
              unit_price: '',
              memo: oi.memo ?? '',
            }))
          : [emptyItem()],
      )
    }
  }, [order, open])

  const updateItem = <K extends keyof EditItemInput>(idx: number, key: K, value: EditItemInput[K]) =>
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [key]: value } : item)))

  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx))

  const addItem = () => setItems((prev) => [...prev, emptyItem()])

  const handleMasterSelect = (idx: number, masterId: string) => {
    const master = itemMasters.find((m) => m.id === masterId)
    setItems((prev) => prev.map((item, i) =>
      i !== idx ? item : { ...item, item_master_id: masterId, custom_name: '', unit: master?.base_unit ?? item.unit }
    ))
  }

  const handleCreateNew = (idx: number, name: string) => {
    setItems((prev) => prev.map((item, i) =>
      i !== idx ? item : { ...item, item_master_id: '', custom_name: name }
    ))
  }

  const handleSubmit = async () => {
    if (!order) return

    const filledItems = items.filter((i) => (i.item_master_id || i.custom_name.trim()) && i.quantity > 0)
    if (filledItems.length === 0) {
      toast.error('품목을 1개 이상 추가하세요.')
      return
    }

    const newItems = filledItems.filter((i) => !i.item_master_id && i.custom_name.trim())
    let resolvedItems = [...filledItems]

    if (newItems.length > 0) {
      const names = newItems.map((i) => `"${i.custom_name}"`).join(', ')
      const addToMaster = confirm(
        `${names} 품목이 마스터에 없습니다.\n\n품목 마스터에 추가하시겠습니까?\n\n` +
        `(확인: 마스터에 추가 후 저장\n취소: 해당 품목 제외하고 저장)`
      )

      if (addToMaster) {
        try {
          setSaving(true)
          const created = await Promise.all(
            newItems.map((i) => createItemMasterQuick(hosId, i.custom_name, i.unit))
          )
          let createdIdx = 0
          resolvedItems = filledItems.map((i) =>
            !i.item_master_id && i.custom_name.trim()
              ? { ...i, item_master_id: created[createdIdx++], custom_name: '' }
              : i
          )
          toast.success(`${newItems.length}개 품목이 마스터에 추가되었습니다.`)
        } catch {
          toast.error('품목 마스터 추가에 실패했습니다.')
          setSaving(false)
          return
        }
      } else {
        resolvedItems = filledItems.filter((i) => i.item_master_id)
        if (resolvedItems.length === 0) {
          toast.error('저장할 품목이 없습니다.')
          setSaving(false)
          return
        }
      }
    }

    const input: OrderFormInput = {
      order_date: orderDate,
      vendor_contact: vendorContact,
      memo,
      items: resolvedItems,
    }

    try {
      setSaving(true)
      await updateOrder(hosId, order.id, input)
      toast.success('주문서가 수정되었습니다.')
      onOpenChange(false)
      router.refresh()
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (!order) return null

  const isEditable = EDITABLE_STATUSES.includes(order.status)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="shrink-0 border-b pb-3">
          <SheetTitle className="text-base">
            주문서 수정
            <span className="ml-2 text-xs font-normal text-slate-400">
              {ORDER_STATUS_LABEL[order.status]}
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto py-4">

          {/* 수정 불가 안내 */}
          {!isEditable && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
              납품완료 이후 주문서는 수정할 수 없습니다.
            </div>
          )}

          {/* 주문 기본 정보 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">주문일 *</Label>
              <Input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                disabled={!isEditable}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">업체 담당자</Label>
              <Input
                value={vendorContact}
                onChange={(e) => setVendorContact(e.target.value)}
                placeholder="담당자명"
                disabled={!isEditable}
              />
            </div>
          </div>

          {/* 메모 */}
          <div className="space-y-1.5">
            <Label className="text-xs">메모</Label>
            <Textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="resize-none text-xs"
              rows={2}
              placeholder="주문 관련 메모"
              disabled={!isEditable}
            />
          </div>

          {/* 주문 품목 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">주문 품목 *</Label>
              {isEditable && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addItem}
                  className="h-6 gap-1 px-2 text-xs"
                >
                  <Plus size={11} />
                  품목 추가
                </Button>
              )}
            </div>

            {items.map((item, idx) => {
              const master = itemMasters.find((m) => m.id === item.item_master_id)
              return (
                <div key={idx} className="rounded-lg border bg-slate-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-slate-500">품목 {idx + 1}</span>
                    {isEditable && items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>

                  <div className="mb-2">
                    <ItemMasterCombobox
                      itemMasters={itemMasters.filter((m) => m.is_active)}
                      value={item.item_master_id}
                      onChange={(id) => handleMasterSelect(idx, id)}
                      allowCreate={isEditable}
                      onCreateNew={(name) => handleCreateNew(idx, name)}
                      customName={item.custom_name}
                      placeholder="품목 검색 · 선택 또는 직접 입력"
                    />
                  </div>

                  {item.custom_name && (
                    <p className="mb-2 rounded bg-amber-50 px-2 py-1 text-[10px] text-amber-600">
                      저장 시 품목 마스터 추가 여부를 확인합니다
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500">수량 *</p>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                        className="h-8 text-xs"
                        disabled={!isEditable}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500">단위</p>
                      <Input
                        value={item.unit}
                        onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                        className="h-8 text-xs"
                        placeholder={master?.base_unit ?? '개'}
                        disabled={!isEditable}
                      />
                    </div>
                  </div>

                  <div className="mt-2">
                    <Input
                      value={item.memo}
                      onChange={(e) => updateItem(idx, 'memo', e.target.value)}
                      className="h-7 text-xs"
                      placeholder="품목 메모 (선택)"
                      disabled={!isEditable}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="shrink-0 border-t pt-3">
          {isEditable ? (
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Save size={14} className="mr-1" />}
              {saving ? '저장 중...' : '수정 저장'}
            </Button>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              닫기
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
