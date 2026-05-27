'use client'

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import type { ItemProduct } from '@/types/hospital/supply-order-type'

interface Props {
  itemProducts: ItemProduct[]
  value: string   // item_product.id or '' for new
  onChange: (product: ItemProduct) => void
  onCreateNew?: (name: string) => void
  newProductName?: string   // 신규 등록 모드일 때 표시할 이름
  placeholder?: string
}

export default function ItemProductCombobox({
  itemProducts, value, onChange, onCreateNew, newProductName, placeholder = '제품 검색 · 선택',
}: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selected = itemProducts.find((p) => p.id === value)

  const filtered = search.trim()
    ? itemProducts.filter((p) => {
        const q = search.toLowerCase()
        return (
          p.brand_name.toLowerCase().includes(q) ||
          (p.manufacturer ?? '').toLowerCase().includes(q) ||
          (p.specification ?? '').toLowerCase().includes(q) ||
          (p.item_master?.generic_name ?? '').toLowerCase().includes(q) ||
          (p.item_master?.category ?? []).some((c) => c.toLowerCase().includes(q)) ||
          (p.ingredient ?? '').toLowerCase().includes(q)
        )
      })
    : itemProducts

  // 품목 마스터(generic_name)별 그룹
  const groups = filtered.reduce<Record<string, ItemProduct[]>>((acc, p) => {
    const key = p.item_master?.generic_name ?? '미연결'
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch('') }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {newProductName ? (
            <span className="flex items-center gap-1.5 truncate">
              <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">신규</span>
              <span className="truncate text-sm">{newProductName}</span>
            </span>
          ) : selected ? (
            <span className="flex items-center gap-1.5 truncate">
              <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                {selected.item_master?.category?.join(', ') ?? '미연결'}
              </span>
              <span className="truncate text-sm">{selected.brand_name}</span>
              {selected.specification && (
                <span className="shrink-0 text-[10px] text-slate-400">{selected.specification}</span>
              )}
            </span>
          ) : (
            <span className="text-sm text-slate-400">{placeholder}</span>
          )}
          <ChevronsUpDown size={14} className="ml-2 shrink-0 text-slate-400" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="제품명, 제조사, 규격, 품목명 검색..."
            className="text-sm"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {onCreateNew && search.trim() && (
              <CommandGroup>
                <CommandItem
                  value={`__new__${search}`}
                  onSelect={() => { onCreateNew(search.trim()); setOpen(false); setSearch('') }}
                  className="text-sm font-medium text-teal-700"
                >
                  <span className="mr-2 rounded bg-teal-100 px-1.5 py-0.5 text-[10px]">신규 등록</span>
                  &ldquo;{search.trim()}&rdquo; 제품으로 추가
                </CommandItem>
              </CommandGroup>
            )}

            {filtered.length === 0 && !search.trim() && (
              <p className="py-4 text-center text-xs text-slate-400">검색 결과가 없습니다.</p>
            )}

            {Object.entries(groups).map(([masterName, products]) => (
              <CommandGroup key={masterName} heading={masterName}>
                {products.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={p.id}
                    onSelect={() => { onChange(p); setOpen(false); setSearch('') }}
                    className="text-sm"
                  >
                    <Check
                      size={13}
                      className={cn('mr-1.5 shrink-0', value === p.id ? 'opacity-100' : 'opacity-0')}
                    />
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{p.brand_name}</span>
                        {p.specification && (
                          <span className="text-[10px] text-slate-400">{p.specification}</span>
                        )}
                      </div>
                      {p.manufacturer && (
                        <span className="text-[10px] text-slate-400">{p.manufacturer}</span>
                      )}
                    </div>
                    <span className="ml-auto shrink-0 text-[10px] text-slate-400">
                      /{p.item_master?.base_unit ?? '개'}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
