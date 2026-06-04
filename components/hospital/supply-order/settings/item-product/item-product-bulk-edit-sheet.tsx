'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { toast } from 'sonner'
import { bulkUpdateItemProducts } from '@/lib/actions/supply-order/item-product-actions'
import type { BulkUpdateItemProductInput } from '@/lib/actions/supply-order/item-product-actions'
import { ITEM_CATEGORIES } from '@/types/hospital/supply-order-type'
import type { Vendor } from '@/types/hospital/supply-order-type'

interface Props {
  hosId: string
  selectedIds: string[]
  vendors: Pick<Vendor, 'id' | 'name'>[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ActiveOption = 'keep' | 'true' | 'false'

export default function ItemProductBulkEditSheet({ hosId, selectedIds, vendors, open, onOpenChange }: Props) {
  const [categoryMode, setCategoryMode] = useState<'add' | 'replace'>('add')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [tagMode, setTagMode] = useState<'add' | 'replace'>('add')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [vendorMode, setVendorMode] = useState<'add' | 'replace'>('add')
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([])
  const [isActive, setIsActive] = useState<ActiveOption>('keep')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setCategoryMode('add')
      setSelectedCategories([])
      setTagMode('add')
      setTags([])
      setTagInput('')
      setVendorMode('add')
      setSelectedVendorIds([])
      setIsActive('keep')
    }
  }, [open])

  const toggleCategory = (cat: string) =>
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )

  const addTag = () => {
    const v = tagInput.trim()
    if (!v || tags.includes(v)) return
    setTags((prev) => [...prev, v])
    setTagInput('')
  }

  const removeTag = (t: string) => setTags((prev) => prev.filter((v) => v !== t))

  const hasChanges =
    selectedCategories.length > 0 ||
    tags.length > 0 ||
    selectedVendorIds.length > 0 ||
    isActive !== 'keep'

  const handleSubmit = async () => {
    if (!hasChanges) { toast.error('변경할 항목을 하나 이상 선택하세요.'); return }
    const input: BulkUpdateItemProductInput = {
      categoryMode,
      categories: selectedCategories,
      tagMode,
      tags,
      vendorMode,
      vendorIds: selectedVendorIds,
      is_active: isActive,
    }
    try {
      setSaving(true)
      await bulkUpdateItemProducts(hosId, selectedIds, input)
      toast.success(`${selectedIds.length}개 제품이 수정되었습니다.`)
      onOpenChange(false)
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="shrink-0 border-b pb-3">
          <SheetTitle className="text-base">
            일괄 수정
            <span className="ml-2 text-sm font-normal text-slate-400">
              {selectedIds.length}개 제품 선택됨
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto py-4">

          {/* 안내 */}
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
            비워둔 항목은 변경되지 않습니다.
          </p>

          {/* 카테고리 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">카테고리</Label>
              <div className="flex rounded-full border text-[11px]">
                <button
                  type="button"
                  onClick={() => setCategoryMode('add')}
                  className={cn(
                    'rounded-l-full px-2.5 py-0.5 transition-colors',
                    categoryMode === 'add' ? 'bg-teal-600 text-white' : 'text-slate-500 hover:bg-slate-50',
                  )}
                >
                  추가
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryMode('replace')}
                  className={cn(
                    'rounded-r-full px-2.5 py-0.5 transition-colors',
                    categoryMode === 'replace' ? 'bg-teal-600 text-white' : 'text-slate-500 hover:bg-slate-50',
                  )}
                >
                  교체
                </button>
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              {categoryMode === 'add' ? '선택한 카테고리를 기존 값에 추가합니다.' : '기존 카테고리를 선택한 값으로 교체합니다.'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ITEM_CATEGORIES.map((cat) => {
                const active = selectedCategories.includes(cat)
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-[11px] transition-colors',
                      active
                        ? 'border-teal-400 bg-teal-50 font-medium text-teal-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300',
                    )}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 태그 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">태그</Label>
              <div className="flex rounded-full border text-[11px]">
                <button
                  type="button"
                  onClick={() => setTagMode('add')}
                  className={cn(
                    'rounded-l-full px-2.5 py-0.5 transition-colors',
                    tagMode === 'add' ? 'bg-teal-600 text-white' : 'text-slate-500 hover:bg-slate-50',
                  )}
                >
                  추가
                </button>
                <button
                  type="button"
                  onClick={() => setTagMode('replace')}
                  className={cn(
                    'rounded-r-full px-2.5 py-0.5 transition-colors',
                    tagMode === 'replace' ? 'bg-teal-600 text-white' : 'text-slate-500 hover:bg-slate-50',
                  )}
                >
                  교체
                </button>
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              {tagMode === 'add' ? '입력한 태그를 기존 값에 추가합니다.' : '기존 태그를 입력한 값으로 교체합니다.'}
            </p>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] text-teal-700">
                    {t}
                    <button type="button" onClick={() => removeTag(t)}><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-1.5">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="태그 입력 후 Enter"
                className="text-xs"
              />
              <Button type="button" size="icon" variant="outline" onClick={addTag} className="h-9 w-9 shrink-0">
                <Plus size={14} />
              </Button>
            </div>
          </div>

          {/* 공급 도매상 */}
          {vendors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">공급 도매상</Label>
                <div className="flex rounded-full border text-[11px]">
                  <button
                    type="button"
                    onClick={() => setVendorMode('add')}
                    className={cn(
                      'rounded-l-full px-2.5 py-0.5 transition-colors',
                      vendorMode === 'add' ? 'bg-teal-600 text-white' : 'text-slate-500 hover:bg-slate-50',
                    )}
                  >
                    추가
                  </button>
                  <button
                    type="button"
                    onClick={() => setVendorMode('replace')}
                    className={cn(
                      'rounded-r-full px-2.5 py-0.5 transition-colors',
                      vendorMode === 'replace' ? 'bg-teal-600 text-white' : 'text-slate-500 hover:bg-slate-50',
                    )}
                  >
                    교체
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                {vendorMode === 'add' ? '선택한 도매상을 기존 값에 추가합니다.' : '기존 도매상을 선택한 값으로 교체합니다.'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {vendors.map((v) => {
                  const active = selectedVendorIds.includes(v.id)
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() =>
                        setSelectedVendorIds((prev) =>
                          active ? prev.filter((id) => id !== v.id) : [...prev, v.id]
                        )
                      }
                      className={cn(
                        'rounded-full border px-2.5 py-0.5 text-[11px] transition-colors',
                        active
                          ? 'border-teal-400 bg-teal-50 font-medium text-teal-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300',
                      )}
                    >
                      {v.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* 활성여부 */}
          <div className="space-y-1.5">
            <Label className="text-xs">활성여부</Label>
            <div className="flex gap-2">
              {([
                { value: 'keep', label: '변경 안함' },
                { value: 'true', label: '활성' },
                { value: 'false', label: '비활성' },
              ] as { value: ActiveOption; label: string }[]).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setIsActive(value)}
                  className={cn(
                    'flex-1 rounded-lg border py-1.5 text-xs transition-colors',
                    isActive === value
                      ? 'border-teal-400 bg-teal-50 font-medium text-teal-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t pt-3">
          <Button
            onClick={handleSubmit}
            disabled={saving || !hasChanges}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-40"
          >
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null}
            {saving ? '저장 중...' : `${selectedIds.length}개 제품에 적용`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
