'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save, CheckCircle2, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createDeliveryItem, updateDeliveryItem } from '@/lib/actions/supply-order/delivery-items-actions'
import {
  createItemProductForDelivery,
  linkItemProductToMaster,
} from '@/lib/actions/supply-order/item-product-actions'
import ItemProductCombobox from './item-product-combobox'
import type {
  DeliveryItem, DeliveryItemFormInput,
  ItemProduct, OrderItem,
} from '@/types/hospital/supply-order-type'

interface Props {
  hosId: string
  deliveryId: string
  itemProducts: ItemProduct[]
  orderItems: OrderItem[]
  editItem?: DeliveryItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ProductFields {
  brand_name: string
  manufacturer: string
  ingredient: string
  specification: string
  package_type: string
  units_per_package: number
  reference_price: string
}

const emptyProductFields = (): ProductFields => ({
  brand_name: '',
  manufacturer: '',
  ingredient: '',
  specification: '',
  package_type: '낱개',
  units_per_package: 1,
  reference_price: '',
})

const emptyDeliveryFields = (): DeliveryItemFormInput => ({
  item_master_id: '',
  item_product_id: '',
  quantity_received: 1,
  unit: '개',
  units_per_package: 1,
  unit_price: '',
  expiry_date: '',
  lot_number: '',
  memo: '',
})

export default function DeliveryItemFormSheet({
  hosId, deliveryId, itemProducts, orderItems, editItem, open, onOpenChange,
}: Props) {
  const router = useRouter()
  const [form, setForm] = useState<DeliveryItemFormInput>(emptyDeliveryFields())
  const [productFields, setProductFields] = useState<ProductFields>(emptyProductFields())
  const [isNewProduct, setIsNewProduct] = useState(false)
  const [saving, setSaving] = useState(false)
  // 기존 제품에 item_master 신규 연결 시 저장
  const [pendingMasterLink, setPendingMasterLink] = useState<{
    productId: string; masterId: string
  } | null>(null)

  useEffect(() => {
    if (!open) return
    setPendingMasterLink(null)
    setIsNewProduct(false)

    if (editItem) {
      const existingProduct = itemProducts.find((p) => p.id === editItem.item_product_id)
      setForm({
        item_master_id: editItem.item_master_id ?? '',
        item_product_id: editItem.item_product_id ?? '',
        quantity_received: editItem.quantity_received,
        unit: editItem.unit,
        units_per_package: editItem.units_per_package,
        unit_price: editItem.unit_price != null ? String(editItem.unit_price) : '',
        expiry_date: editItem.expiry_date ?? '',
        lot_number: editItem.lot_number ?? '',
        memo: editItem.memo ?? '',
      })
      setProductFields({
        brand_name: existingProduct?.brand_name ?? '',
        manufacturer: existingProduct?.manufacturer ?? '',
        ingredient: existingProduct?.ingredient ?? '',
        specification: existingProduct?.specification ?? '',
        package_type: existingProduct?.package_type ?? '낱개',
        units_per_package: existingProduct?.units_per_package ?? 1,
        reference_price: existingProduct?.reference_price != null
          ? String(existingProduct.reference_price) : '',
      })
    } else {
      setForm(emptyDeliveryFields())
      setProductFields(emptyProductFields())
    }
  }, [editItem, open, itemProducts])

  const setF = <K extends keyof DeliveryItemFormInput>(k: K, v: DeliveryItemFormInput[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }))
  const setP = <K extends keyof ProductFields>(k: K, v: ProductFields[K]) =>
    setProductFields((prev) => ({ ...prev, [k]: v }))

  // 기존 제품 선택
  const handleProductSelect = (product: ItemProduct) => {
    setIsNewProduct(false)
    setPendingMasterLink(null)
    setForm((prev) => ({
      ...prev,
      item_product_id: product.id,
      item_master_id: product.item_master_id ?? '',
      unit: product.item_master?.base_unit ?? prev.unit,
      units_per_package: product.units_per_package ?? 1,
    }))
    setProductFields({
      brand_name: product.brand_name,
      manufacturer: product.manufacturer ?? '',
      ingredient: product.ingredient ?? '',
      specification: product.specification ?? '',
      package_type: product.package_type,
      units_per_package: product.units_per_package,
      reference_price: product.reference_price != null ? String(product.reference_price) : '',
    })
  }

  // 신규 제품 등록 모드 진입
  const handleCreateNew = (name: string) => {
    setIsNewProduct(true)
    setPendingMasterLink(null)
    setForm((prev) => ({ ...prev, item_product_id: '', item_master_id: '' }))
    setProductFields({ ...emptyProductFields(), brand_name: name })
  }

  // 주문 목록에서 item_master 연결
  const handleMasterLink = (oi: OrderItem) => {
    if (!oi.item_master_id) return
    setF('item_master_id', oi.item_master_id)
    if (!isNewProduct && form.item_product_id) {
      setPendingMasterLink({ productId: form.item_product_id, masterId: oi.item_master_id })
    }
    // unit 자동 세팅
    if (oi.item_master?.base_unit) setF('unit', oi.item_master.base_unit)
  }

  const clearMasterLink = () => {
    setF('item_master_id', '')
    setPendingMasterLink(null)
  }

  // units_per_package 동기화 (신규 제품 모드에서 productFields가 source of truth)
  const handleUnitsPerPackageChange = (v: number) => {
    setP('units_per_package', v)
    setF('units_per_package', v)
  }

  const handleSubmit = async () => {
    if (!isNewProduct && !form.item_product_id) {
      toast.error('제품을 선택하거나 신규 등록하세요.')
      return
    }
    if (isNewProduct && !productFields.brand_name.trim()) {
      toast.error('제품명을 입력하세요.')
      return
    }
    if (form.quantity_received <= 0) {
      toast.error('수령 수량을 입력하세요.')
      return
    }

    try {
      setSaving(true)

      let finalForm = { ...form }

      if (isNewProduct) {
        // 신규 item_product 생성 후 ID 획득
        const newProductId = await createItemProductForDelivery(hosId, {
          ...productFields,
          item_master_id: form.item_master_id || null,
        })
        finalForm = { ...finalForm, item_product_id: newProductId }
      } else if (pendingMasterLink) {
        // 기존 제품에 item_master 영구 연결
        await linkItemProductToMaster(hosId, pendingMasterLink.productId, pendingMasterLink.masterId)
      }

      if (editItem) {
        await updateDeliveryItem(hosId, editItem.id, finalForm)
        toast.success('수정되었습니다.')
      } else {
        await createDeliveryItem(hosId, deliveryId, finalForm)
        toast.success('품목이 추가되었습니다.')
      }

      onOpenChange(false)
      router.refresh()
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setForm(emptyDeliveryFields())
      setProductFields(emptyProductFields())
      setIsNewProduct(false)
      setPendingMasterLink(null)
    }
    onOpenChange(v)
  }

  const baseQty = form.quantity_received * form.units_per_package

  // 마스터 표시 정보
  const selectedProduct = itemProducts.find((p) => p.id === form.item_product_id) ?? null
  const masterInfoFromProduct = selectedProduct?.item_master ?? null
  const masterInfoFromOrder = form.item_master_id
    ? orderItems.find((oi) => oi.item_master_id === form.item_master_id)?.item_master
    : null
  const masterInfo = masterInfoFromProduct ?? masterInfoFromOrder ?? null
  const hasMaster = !!form.item_master_id
  const needsMasterLink = (isNewProduct || !!form.item_product_id) && !hasMaster

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="shrink-0 border-b pb-3">
          <SheetTitle className="text-base">
            {editItem ? '품목 수정' : '품목 추가'}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4">

          {/* ── 제품 선택 / 신규 등록 ── */}
          <div className="space-y-1.5">
            <Label className="text-xs">제품 *</Label>
            <ItemProductCombobox
              itemProducts={itemProducts.filter((p) => p.is_active)}
              value={form.item_product_id}
              onChange={handleProductSelect}
              onCreateNew={handleCreateNew}
              newProductName={isNewProduct ? productFields.brand_name : undefined}
              placeholder="제품 검색 · 선택 또는 신규 등록"
            />
          </div>

          {/* ── 신규 제품 등록 폼 ── */}
          {isNewProduct && (
            <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
              <p className="text-[11px] font-semibold text-amber-700">신규 제품 정보 입력</p>

              <div className="space-y-1.5">
                <Label className="text-xs">제품명 *</Label>
                <Input
                  value={productFields.brand_name}
                  onChange={(e) => setP('brand_name', e.target.value)}
                  className="h-8 text-xs"
                  placeholder="제품명"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">제조사</Label>
                  <Input
                    value={productFields.manufacturer}
                    onChange={(e) => setP('manufacturer', e.target.value)}
                    className="h-8 text-xs"
                    placeholder="제조사"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">규격</Label>
                  <Input
                    value={productFields.specification}
                    onChange={(e) => setP('specification', e.target.value)}
                    className="h-8 text-xs"
                    placeholder="500mg, 100ml 등"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">포장 형태</Label>
                  <Input
                    value={productFields.package_type}
                    onChange={(e) => setP('package_type', e.target.value)}
                    className="h-8 text-xs"
                    placeholder="낱개, 박스 등"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">포장당 기준단위 수</Label>
                  <Input
                    type="number"
                    min={1}
                    value={productFields.units_per_package}
                    onChange={(e) => handleUnitsPerPackageChange(Number(e.target.value))}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">성분명</Label>
                  <Input
                    value={productFields.ingredient}
                    onChange={(e) => setP('ingredient', e.target.value)}
                    className="h-8 text-xs"
                    placeholder="성분명"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">참고단가 (원)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={productFields.reference_price}
                    onChange={(e) => setP('reference_price', e.target.value)}
                    className="h-8 text-xs"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── 기존 제품 요약 (읽기 전용) ── */}
          {!isNewProduct && selectedProduct && (
            <div className="flex flex-wrap gap-1.5 rounded-md bg-slate-50 px-2.5 py-2">
              {selectedProduct.manufacturer && (
                <span className="text-[10px] text-slate-500">제조: {selectedProduct.manufacturer}</span>
              )}
              {selectedProduct.specification && (
                <span className="text-[10px] text-slate-500">규격: {selectedProduct.specification}</span>
              )}
              <span className="text-[10px] text-slate-500">
                {selectedProduct.package_type} · {selectedProduct.units_per_package}단위/포장
              </span>
            </div>
          )}

          {/* ── 품목 마스터 연결 상태 ── */}
          {(isNewProduct || !!form.item_product_id) && (
            <div>
              {hasMaster && masterInfo ? (
                <div className="flex items-center justify-between rounded-md bg-emerald-50 px-2.5 py-2 text-xs text-emerald-700">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="shrink-0" />
                    <span className="font-medium">{masterInfo.generic_name}</span>
                    {masterInfo.category && (
                      <span className="text-emerald-500">· {masterInfo.category}</span>
                    )}
                    {pendingMasterLink && (
                      <span className="rounded bg-emerald-100 px-1 text-[10px] text-emerald-600">
                        저장 시 제품에도 반영
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={clearMasterLink}
                    className="ml-2 shrink-0 text-emerald-400 hover:text-emerald-700"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : needsMasterLink ? (
                <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-2.5">
                  <p className="flex items-center gap-1 text-[11px] font-medium text-amber-700">
                    <AlertTriangle size={12} className="shrink-0" />
                    품목 마스터 미연결 — 주문 목록에서 연결하세요
                  </p>
                  {orderItems.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {orderItems.map((oi) => (
                        <button
                          key={oi.id}
                          type="button"
                          onClick={() => handleMasterLink(oi)}
                          className={cn(
                            'rounded-full border bg-white px-2.5 py-0.5 text-[11px] text-slate-600',
                            'hover:border-teal-400 hover:text-teal-700 transition-colors',
                          )}
                        >
                          {oi.item_master?.generic_name ?? '(알 수 없음)'}
                          {oi.item_master?.category && (
                            <span className="ml-1 text-slate-400">{oi.item_master.category}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-amber-600">주문 품목이 없습니다.</p>
                  )}
                  <p className="text-[10px] text-amber-600">연결하지 않고 저장할 수도 있습니다.</p>
                </div>
              ) : null}
            </div>
          )}

          {/* ── 납품 수량 / 단위 ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">수령 수량 *</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.quantity_received}
                onChange={(e) => setF('quantity_received', Number(e.target.value))}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">단위</Label>
              <Input
                value={form.unit}
                onChange={(e) => setF('unit', e.target.value)}
                className="h-8 text-xs"
                placeholder="개"
              />
            </div>
          </div>

          {/* 기준단위 환산 수량 (신규 제품 모드에서는 위에서 이미 units_per_package 입력) */}
          {!isNewProduct && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">포장당 기준단위 수</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.units_per_package}
                  onChange={(e) => setF('units_per_package', Number(e.target.value))}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">기준단위 환산 수량</Label>
                <div className="flex h-8 items-center rounded-md border bg-slate-50 px-3 text-xs text-slate-500">
                  {baseQty.toLocaleString()}
                </div>
              </div>
            </div>
          )}
          {isNewProduct && (
            <div className="flex h-8 items-center rounded-md border bg-slate-50 px-3 text-xs text-slate-500">
              기준단위 환산: {baseQty.toLocaleString()}
            </div>
          )}

          {/* ── 납품 단가 ── */}
          <div className="space-y-1.5">
            <Label className="text-xs">납품 단가 (원)</Label>
            <Input
              type="number"
              min={0}
              value={form.unit_price}
              onChange={(e) => setF('unit_price', e.target.value)}
              className="h-8 text-xs"
              placeholder="0"
            />
            {form.unit_price && form.quantity_received > 0 && (
              <p className="text-right text-[11px] text-teal-600">
                소계 {(Number(form.unit_price) * form.quantity_received).toLocaleString()}원
              </p>
            )}
          </div>

          {/* ── 유통기한 / 로트번호 ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">유통기한</Label>
              <Input
                type="date"
                value={form.expiry_date}
                onChange={(e) => setF('expiry_date', e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">로트번호</Label>
              <Input
                value={form.lot_number}
                onChange={(e) => setF('lot_number', e.target.value)}
                className="h-8 text-xs"
                placeholder="LOT-XXXXX"
              />
            </div>
          </div>

          {/* ── 메모 ── */}
          <div className="space-y-1.5">
            <Label className="text-xs">메모</Label>
            <Input
              value={form.memo}
              onChange={(e) => setF('memo', e.target.value)}
              className="h-8 text-xs"
              placeholder="특이사항"
            />
          </div>
        </div>

        <div className="shrink-0 border-t pt-3">
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            {saving
              ? <Loader2 size={14} className="mr-1 animate-spin" />
              : <Save size={14} className="mr-1" />}
            {saving ? '저장 중...' : editItem ? '수정 저장' : '품목 추가'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
