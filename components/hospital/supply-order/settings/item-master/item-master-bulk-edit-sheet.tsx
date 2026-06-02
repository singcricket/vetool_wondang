'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { toast } from 'sonner'
import { bulkUpdateItemMasters } from '@/lib/actions/supply-order/item-master-actions'
import type { BulkUpdateItemMasterInput } from '@/lib/actions/supply-order/item-master-actions'
import { ITEM_CATEGORIES, type Vendor } from '@/types/hospital/supply-order-type'

const BASE_UNIT_SUGGESTIONS = ['개', '팩', '바이알', '정', '앰플', 'mL', '박스', '통', '매']

interface Props {
  hosId: string
  selectedIds: string[]
  vendors: Pick<Vendor, 'id' | 'name'>[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ActiveOption = 'keep' | 'true' | 'false'

export default function ItemMasterBulkEditSheet({ hosId, selectedIds, vendors, open, onOpenChange }: Props) {
  const [categoryMode, setCategoryMode] = useState<'add' | 'replace'>('add')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [locMode, setLocMode] = useState<'add' | 'replace'>('add')
  const [locs, setLocs] = useState<string[]>([])
  const [locInput, setLocInput] = useState('')
  const [baseUnit, setBaseUnit] = useState('')
  const [isActive, setIsActive] = useState<ActiveOption>('keep')
  const [defaultVendor, setDefaultVendor] = useState<string>('keep')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setCategoryMode('add')
      setSelectedCategories([])
      setLocMode('add')
      setLocs([])
      setLocInput('')
      setBaseUnit('')
      setIsActive('keep')
      setDefaultVendor('keep')
    }
  }, [open])

  const toggleCategory = (cat: string) =>
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )

  const addLoc = () => {
    const v = locInput.trim()
    if (!v || locs.includes(v)) return
    setLocs((prev) => [...prev, v])
    setLocInput('')
  }

  const removeLoc = (l: string) => setLocs((prev) => prev.filter((v) => v !== l))

  const hasChanges =
    selectedCategories.length > 0 ||
    locs.length > 0 ||
    baseUnit.trim() !== '' ||
    isActive !== 'keep' ||
    defaultVendor !== 'keep'

  const handleSubmit = async () => {
    if (!hasChanges) { toast.error('변경할 항목을 하나 이상 선택하세요.'); return }
    const input: BulkUpdateItemMasterInput = {
      categoryMode,
      categories: selectedCategories,
      locMode,
      locs,
      base_unit: baseUnit,
      is_active: isActive,
      default_vendor: defaultVendor,
    }
    try {
      setSaving(true)
      await bulkUpdateItemMasters(hosId, selectedIds, input)
      toast.success(`${selectedIds.length}개 품목이 수정되었습니다.`)
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
              {selectedIds.length}개 품목 선택됨
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
                  onClick={() => setLocMode('add')}
                  className={cn(
                    'rounded-l-full px-2.5 py-0.5 transition-colors',
                    locMode === 'add' ? 'bg-teal-600 text-white' : 'text-slate-500 hover:bg-slate-50',
                  )}
                >
                  추가
                </button>
                <button
                  type="button"
                  onClick={() => setLocMode('replace')}
                  className={cn(
                    'rounded-r-full px-2.5 py-0.5 transition-colors',
                    locMode === 'replace' ? 'bg-teal-600 text-white' : 'text-slate-500 hover:bg-slate-50',
                  )}
                >
                  교체
                </button>
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              {locMode === 'add' ? '입력한 태그를 기존 값에 추가합니다.' : '기존 태그를 입력한 값으로 교체합니다.'}
            </p>
            {locs.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {locs.map((l) => (
                  <span key={l} className="flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] text-teal-700">
                    {l}
                    <button type="button" onClick={() => removeLoc(l)}><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-1.5">
              <Input
                value={locInput}
                onChange={(e) => setLocInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLoc())}
                placeholder="약제실, 냉장보관, 버박... 입력 후 Enter"
                className="text-xs"
              />
              <Button type="button" size="icon" variant="outline" onClick={addLoc} className="h-9 w-9 shrink-0">
                <Plus size={14} />
              </Button>
            </div>
          </div>

          {/* 기준단위 */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              기준단위
              <span className="ml-1 font-normal text-slate-400">(교체)</span>
            </Label>
            <Input
              value={baseUnit}
              onChange={(e) => setBaseUnit(e.target.value)}
              placeholder="비워두면 변경 안함"
              className="text-xs"
            />
            <div className="flex flex-wrap gap-1">
              {BASE_UNIT_SUGGESTIONS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setBaseUnit(u)}
                  className={cn(
                    'rounded border px-2 py-0.5 text-[10px] transition-colors',
                    baseUnit === u
                      ? 'border-teal-400 bg-teal-50 text-teal-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300',
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* 기본 주문업체 */}
          <div className="space-y-1.5">
            <Label className="text-xs">기본 주문업체</Label>
            <select
              value={defaultVendor}
              onChange={(e) => setDefaultVendor(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm outline-none focus:ring-1 focus:ring-teal-400"
            >
              <option value="keep">변경 안함</option>
              <option value="clear">지정 해제</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

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
            {saving ? '저장 중...' : `${selectedIds.length}개 품목에 적용`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
