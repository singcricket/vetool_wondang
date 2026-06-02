'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createItemProduct, updateItemProduct } from '@/lib/actions/supply-order/item-product-actions'
import type { ItemMaster, ItemProduct, ItemProductFormInput } from '@/types/hospital/supply-order-type'
import ItemMasterCombobox from './item-master-combobox'

const PACKAGE_TYPES = ['낱개', '박스', '케이스', '팩', '병', '튜브', '롤', '기타']

const EMPTY_FORM: ItemProductFormInput = {
  item_master_id: '',
  brand_name: '',
  manufacturer: '',
  ingredient: '',
  specification: '',
  package_type: '낱개',
  units_per_package: 1,
  reference_price: '',
  memo: '',
  is_active: true,
}

function toForm(p: ItemProduct): ItemProductFormInput {
  return {
    item_master_id: p.item_master_id ?? '',
    brand_name: p.brand_name,
    manufacturer: p.manufacturer ?? '',
    ingredient: p.ingredient ?? '',
    specification: p.specification ?? '',
    package_type: p.package_type,
    units_per_package: p.units_per_package,
    reference_price: p.reference_price != null ? String(p.reference_price) : '',
    memo: p.memo ?? '',
    is_active: p.is_active,
  }
}

interface Props {
  hosId: string
  product?: ItemProduct
  itemMasters: ItemMaster[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ItemProductFormSheet({ hosId, product, itemMasters, open, onOpenChange }: Props) {
  const isEdit = !!product
  const [form, setForm] = useState<ItemProductFormInput>(product ? toForm(product) : EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setForm(product ? toForm(product) : EMPTY_FORM)
  }, [open, product])

  const set = <K extends keyof ItemProductFormInput>(key: K, value: ItemProductFormInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const selectedMaster = itemMasters.find((m) => m.id === form.item_master_id)

  const handleSubmit = async () => {
    if (!form.item_master_id) { toast.error('품목 마스터를 선택하세요.'); return }
    if (!form.brand_name.trim()) { toast.error('제품명을 입력하세요.'); return }
    try {
      setSaving(true)
      if (isEdit && product) {
        await updateItemProduct(hosId, product.id, form)
      } else {
        await createItemProduct(hosId, form)
      }
      toast.success(isEdit ? '제품이 수정되었습니다.' : '제품이 등록되었습니다.')
      onOpenChange(false)
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v)
  }

  const activeItemMasters = itemMasters.filter((m) => m.is_active)

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="shrink-0 border-b pb-3">
          <SheetTitle className="text-base">{isEdit ? '제품 수정' : '제품 등록'}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto py-4">

          {/* 품목 마스터 연결 */}
          <div className="space-y-1.5">
            <Label className="text-xs">품목 마스터 *</Label>
            <ItemMasterCombobox
              itemMasters={activeItemMasters}
              value={form.item_master_id}
              onChange={(id) => set('item_master_id', id)}
            />
            {selectedMaster && (
              <p className="text-[11px] text-slate-400">
                기준단위: {selectedMaster.base_unit}
              </p>
            )}
          </div>

          {/* 제품명 */}
          <div className="space-y-1.5">
            <Label className="text-xs">제품명 (브랜드명) *</Label>
            <Input
              value={form.brand_name}
              onChange={(e) => set('brand_name', e.target.value)}
              placeholder="예) JW 생리식염수 500mL"
            />
          </div>

          {/* 제조사 / 규격 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">제조사</Label>
              <Input
                value={form.manufacturer}
                onChange={(e) => set('manufacturer', e.target.value)}
                placeholder="JW중외제약"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">규격</Label>
              <Input
                value={form.specification}
                onChange={(e) => set('specification', e.target.value)}
                placeholder="500mL, 250mg/5mL"
              />
            </div>
          </div>

          {/* 성분명 */}
          <div className="space-y-1.5">
            <Label className="text-xs">세부 성분명 <span className="font-normal text-slate-400">(복합제 등, 선택)</span></Label>
            <Input
              value={form.ingredient}
              onChange={(e) => set('ingredient', e.target.value)}
              placeholder="NaCl 0.9%"
            />
          </div>

          {/* 포장 단위 */}
          <div className="space-y-1.5">
            <Label className="text-xs">포장 단위</Label>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <Select value={form.package_type} onValueChange={(v) => set('package_type', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PACKAGE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-center text-xs text-slate-400">1개 =</span>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={1}
                  value={form.units_per_package}
                  onChange={(e) => set('units_per_package', Number(e.target.value))}
                  className="text-xs"
                />
                <span className="shrink-0 text-xs text-slate-400">
                  {selectedMaster?.base_unit ?? '개'}
                </span>
              </div>
            </div>
            {form.units_per_package > 1 && (
              <p className="text-[11px] text-teal-600">
                {form.package_type} 1개 입고 시 {form.units_per_package}{selectedMaster?.base_unit ?? '개'} 재고 적립
              </p>
            )}
          </div>

          {/* 기준 단가 */}
          <div className="space-y-1.5">
            <Label className="text-xs">기준 단가 <span className="font-normal text-slate-400">(참고값, 선택)</span></Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={0}
                value={form.reference_price}
                onChange={(e) => set('reference_price', e.target.value)}
                placeholder="0"
                className="text-xs"
              />
              <span className="shrink-0 text-xs text-slate-400">원</span>
            </div>
          </div>

          {/* 메모 */}
          <div className="space-y-1.5">
            <Label className="text-xs">메모</Label>
            <Textarea
              value={form.memo}
              onChange={(e) => set('memo', e.target.value)}
              className="resize-none text-xs"
              rows={2}
            />
          </div>

          {/* 활성 여부 */}
          {isEdit && (
            <div className="flex items-center justify-between rounded border px-3 py-2">
              <span className="text-xs text-slate-600">활성 제품</span>
              <Switch checked={form.is_active} onCheckedChange={(v) => set('is_active', v)} />
            </div>
          )}
        </div>

        <div className="shrink-0 border-t pt-3">
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null}
            {saving ? '저장 중...' : isEdit ? '수정 저장' : '등록'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
