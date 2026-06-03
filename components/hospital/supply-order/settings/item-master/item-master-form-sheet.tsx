'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Plus, X, Loader2, Search, Link2, Link2Off } from 'lucide-react'
import { toast } from 'sonner'
import { createItemMaster, updateItemMaster } from '@/lib/actions/supply-order/item-master-actions'
import { linkItemProductToMaster, unlinkItemProductFromMaster } from '@/lib/actions/supply-order/item-product-actions'
import {
  ITEM_CATEGORIES,
  type ItemMaster,
  type ItemMasterFormInput,
  type ItemProduct,
  type Vendor,
} from '@/types/hospital/supply-order-type'

const EMPTY_FORM: ItemMasterFormInput = {
  category: [],
  generic_name: '',
  ingredient: [],
  description: '',
  base_unit: '개',
  aliases: [],
  loc: [],
  default_vendor: '',
  alert_min_stock: 0,
  reorder_qty: 0,
  is_active: true,
}

const BASE_UNIT_SUGGESTIONS = ['개', '팩', '바이알', '정', '앰플', 'mL', '박스', '통', '매']

function toForm(item: ItemMaster): ItemMasterFormInput {
  return {
    category: item.category,
    generic_name: item.generic_name,
    ingredient: item.ingredient ?? [],
    description: item.description ?? '',
    base_unit: item.base_unit,
    aliases: item.aliases,
    loc: item.loc ?? [],
    default_vendor: item.default_vendor ?? '',
    alert_min_stock: item.alert_min_stock,
    reorder_qty: item.reorder_qty,
    is_active: item.is_active,
  }
}

// 태그 입력 공통 컴포넌트
function TagInput({
  label,
  sub,
  tags,
  onAdd,
  onRemove,
  placeholder,
  tagClassName,
}: {
  label: string
  sub?: string
  tags: string[]
  onAdd: (v: string) => void
  onRemove: (v: string) => void
  placeholder?: string
  tagClassName?: string
}) {
  const [input, setInput] = useState('')

  const commit = () => {
    const v = input.trim()
    if (!v || tags.includes(v)) return
    onAdd(v)
    setInput('')
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label}
        {sub && <span className="ml-1 font-normal text-slate-400">{sub}</span>}
      </Label>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${tagClassName ?? 'bg-slate-100 text-slate-600'}`}
            >
              {tag}
              <button type="button" onClick={() => onRemove(tag)}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-1.5">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), commit())}
          placeholder={placeholder}
          className="text-xs"
        />
        <Button type="button" size="icon" variant="outline" onClick={commit} className="h-9 w-9 shrink-0">
          <Plus size={14} />
        </Button>
      </div>
    </div>
  )
}

function ProductLinkCombobox({
  candidates,
  onSelect,
}: {
  candidates: ItemProduct[]
  onSelect: (p: ItemProduct) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return candidates.slice(0, 20)
    return candidates
      .filter(
        (p) =>
          p.brand_name.toLowerCase().includes(q) ||
          (p.manufacturer ?? '').toLowerCase().includes(q) ||
          (p.specification ?? '').toLowerCase().includes(q) ||
          (p.ingredient ?? '').toLowerCase().includes(q),
      )
      .slice(0, 20)
  }, [candidates, query])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-1.5 rounded-md border border-dashed border-slate-200 bg-white px-2 py-1.5">
        <Search size={12} className="shrink-0 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="제품 검색해서 추가..."
          className="flex-1 bg-transparent text-[11px] text-slate-600 placeholder:text-slate-300 focus:outline-none"
        />
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-8 z-50 max-h-44 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-center text-[11px] text-slate-400">검색 결과 없음</p>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onSelect(p); setQuery(''); setOpen(false) }}
                className="flex w-full flex-col px-3 py-2 text-left hover:bg-teal-50"
              >
                <span className="text-[11px] font-medium text-slate-800">{p.brand_name}</span>
                {(p.specification || p.manufacturer) && (
                  <span className="text-[10px] text-slate-400">
                    {[p.manufacturer, p.specification].filter(Boolean).join(' · ')}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

interface Props {
  hosId: string
  item?: ItemMaster
  vendors: Pick<Vendor, 'id' | 'name'>[]
  itemProducts: ItemProduct[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ItemMasterFormSheet({ hosId, item, vendors, itemProducts, open, onOpenChange }: Props) {
  const isEdit = !!item
  const [form, setForm] = useState<ItemMasterFormInput>(item ? toForm(item) : EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [linkedProducts, setLinkedProducts] = useState<ItemProduct[]>([])
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null)
  const [linkingId, setLinkingId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(item ? toForm(item) : EMPTY_FORM)
      setLinkedProducts(item ? itemProducts.filter((p) => p.item_master_id === item.id) : [])
    }
  }, [open, item, itemProducts])

  // 연결 가능한 제품: item_master_id가 null인 것 (이미 연결된 것 제외)
  const linkableCandidates = useMemo(() => {
    const linkedIds = new Set(linkedProducts.map((p) => p.id))
    return itemProducts.filter((p) => p.item_master_id === null && !linkedIds.has(p.id))
  }, [itemProducts, linkedProducts])

  const handleLink = async (product: ItemProduct) => {
    if (!item) return
    try {
      setLinkingId(product.id)
      await linkItemProductToMaster(hosId, product.id, item.id)
      setLinkedProducts((prev) => [...prev, { ...product, item_master_id: item.id }])
      toast.success(`${product.brand_name} 연결됨`)
    } catch {
      toast.error('연결에 실패했습니다.')
    } finally {
      setLinkingId(null)
    }
  }

  const handleUnlink = async (productId: string) => {
    try {
      setUnlinkingId(productId)
      await unlinkItemProductFromMaster(hosId, productId)
      setLinkedProducts((prev) => prev.filter((p) => p.id !== productId))
      toast.success('연결이 해제되었습니다.')
    } catch {
      toast.error('해제에 실패했습니다.')
    } finally {
      setUnlinkingId(null)
    }
  }

  const set = <K extends keyof ItemMasterFormInput>(key: K, value: ItemMasterFormInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    if (!form.category.length) { toast.error('카테고리를 하나 이상 선택하세요.'); return }
    if (!form.generic_name.trim()) { toast.error('품목명을 입력하세요.'); return }
    if (!form.base_unit.trim()) { toast.error('기준 단위를 입력하세요.'); return }
    try {
      setSaving(true)
      if (isEdit && item) {
        await updateItemMaster(hosId, item.id, form)
      } else {
        await createItemMaster(hosId, form)
      }
      toast.success(isEdit ? '품목이 수정되었습니다.' : '품목이 등록되었습니다.')
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

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="shrink-0 border-b pb-3">
          <SheetTitle className="text-base">{isEdit ? '품목 수정' : '품목 등록'}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto py-4">

          {/* 카테고리 (복수 선택) */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              카테고리 *
              <span className="ml-1 font-normal text-slate-400">(복수 선택 가능)</span>
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {ITEM_CATEGORIES.map((cat) => {
                const checked = form.category.includes(cat)
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() =>
                      set('category', checked
                        ? form.category.filter((c) => c !== cat)
                        : [...form.category, cat],
                      )
                    }
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
                      checked
                        ? 'border-teal-400 bg-teal-50 font-medium text-teal-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 품목명 */}
          <div className="space-y-1.5">
            <Label className="text-xs">품목명 (기준명) *</Label>
            <Input
              value={form.generic_name}
              onChange={(e) => set('generic_name', e.target.value)}
              placeholder="예) N/S 500mL, 아목시실린 250mg 캡슐"
            />
          </div>

          {/* 성분명 (복수 태그) */}
          <TagInput
            label="성분명"
            sub="(약물에 유용, 선택 · 복수 입력 가능)"
            tags={form.ingredient}
            onAdd={(v) => set('ingredient', [...form.ingredient, v])}
            onRemove={(v) => set('ingredient', form.ingredient.filter((i) => i !== v))}
            placeholder="Amoxicillin, Vitamin A... 입력 후 Enter"
            tagClassName="bg-indigo-50 text-indigo-700"
          />

          {/* 기준 단위 */}
          <div className="space-y-1.5">
            <Label className="text-xs">기준 단위 *</Label>
            <div className="flex flex-col gap-1.5">
              <Input
                value={form.base_unit}
                onChange={(e) => set('base_unit', e.target.value)}
                placeholder="팩, 개, 바이알, 정..."
              />
              <div className="flex flex-wrap gap-1">
                {BASE_UNIT_SUGGESTIONS.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => set('base_unit', u)}
                    className={`rounded border px-2 py-0.5 text-[10px] transition-colors ${
                      form.base_unit === u
                        ? 'border-teal-400 bg-teal-50 text-teal-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 별칭 */}
          <TagInput
            label="별칭"
            sub="(AI 매핑·검색에 사용)"
            tags={form.aliases}
            onAdd={(v) => set('aliases', [...form.aliases, v])}
            onRemove={(v) => set('aliases', form.aliases.filter((a) => a !== v))}
            placeholder="NS500, 생리식염수 500... 입력 후 Enter"
          />

          {/* 태그 */}
          <TagInput
            label="태그"
            sub="(복수 설정 가능)"
            tags={form.loc}
            onAdd={(v) => set('loc', [...form.loc, v])}
            onRemove={(v) => set('loc', form.loc.filter((l) => l !== v))}
            placeholder="약제실, 냉장보관, 버박... 입력 후 Enter"
            tagClassName="bg-teal-50 text-teal-700"
          />

          {/* 기본 주문업체 */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              기본 주문업체
              <span className="ml-1 font-normal text-slate-400">(선택)</span>
            </Label>
            <select
              value={form.default_vendor}
              onChange={(e) => set('default_vendor', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm outline-none focus:ring-1 focus:ring-teal-400"
            >
              <option value="">선택 안함</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          {/* 설명 */}
          <div className="space-y-1.5">
            <Label className="text-xs">설명/용도</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className="resize-none text-xs"
              rows={2}
              placeholder="용도, 주의사항 등"
            />
          </div>

          {/* 재고 임계값 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">최소 재고 경고 수량</Label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={0}
                  value={form.alert_min_stock}
                  onChange={(e) => set('alert_min_stock', Number(e.target.value))}
                  className="text-xs"
                />
                <span className="shrink-0 text-xs text-slate-400">{form.base_unit}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">발주 권장 수량</Label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={0}
                  value={form.reorder_qty}
                  onChange={(e) => set('reorder_qty', Number(e.target.value))}
                  className="text-xs"
                />
                <span className="shrink-0 text-xs text-slate-400">{form.base_unit}</span>
              </div>
            </div>
          </div>

          {/* 활성 여부 */}
          {isEdit && (
            <div className="flex items-center justify-between rounded border px-3 py-2">
              <span className="text-xs text-slate-600">활성 품목</span>
              <Switch checked={form.is_active} onCheckedChange={(v) => set('is_active', v)} />
            </div>
          )}

          {/* 연결된 제품 — 편집 모드에서만 */}
          {isEdit && (
            <div className="space-y-2 rounded-lg border border-dashed p-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs">
                  <Link2 size={12} className="text-teal-500" />
                  연결된 제품
                </Label>
                <span className="text-[10px] text-slate-400">{linkedProducts.length}개</span>
              </div>

              {linkedProducts.length === 0 ? (
                <p className="text-[11px] text-slate-400">연결된 제품이 없습니다.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {linkedProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-md bg-slate-50 px-2.5 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium text-slate-700">{p.brand_name}</p>
                        {(p.specification || p.manufacturer) && (
                          <p className="text-[10px] text-slate-400">
                            {[p.manufacturer, p.specification].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnlink(p.id)}
                        disabled={unlinkingId === p.id}
                        className="ml-2 flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-rose-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                      >
                        {unlinkingId === p.id
                          ? <Loader2 size={10} className="animate-spin" />
                          : <><Link2Off size={10} />해제</>
                        }
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 제품 검색해서 추가 */}
              <div className="relative">
                <ProductLinkCombobox
                  candidates={linkableCandidates}
                  onSelect={handleLink}
                />
                {linkingId && (
                  <Loader2 size={12} className="absolute right-2 top-2 animate-spin text-teal-500" />
                )}
              </div>
              {linkableCandidates.length === 0 && (
                <p className="text-[10px] text-slate-300">연결 가능한 미연결 제품이 없습니다.</p>
              )}
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
