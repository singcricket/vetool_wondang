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
import { Check, ChevronsUpDown, Link2Off, Plus } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import type { ItemMaster } from '@/types/hospital/supply-order-type'

interface Props {
  itemMasters: ItemMaster[]
  value: string
  onChange: (id: string) => void
  /** 직접 입력 허용 시 true. onCreateNew와 함께 사용 */
  allowCreate?: boolean
  /** 신규 품목명이 입력됐을 때 호출 (이름 반환) */
  onCreateNew?: (name: string) => void
  /** allowCreate 모드에서 custom 이름 표시용 */
  customName?: string
  placeholder?: string
}

export default function ItemMasterCombobox({
  itemMasters, value, onChange, allowCreate, onCreateNew, customName, placeholder = '품목 선택',
}: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selected = itemMasters.find((m) => m.id === value)

  // 검색어가 기존 목록에 완전히 일치하는지 확인
  const hasExactMatch = itemMasters.some(
    (m) => m.generic_name.toLowerCase() === search.toLowerCase().trim()
  )
  const showCreateOption = allowCreate && search.trim().length > 0 && !hasExactMatch

  // 필터링된 목록 (CommandList 내부 Command 필터가 처리하지만, 그룹 노출 여부 판단용)
  const filteredMasters = search.trim()
    ? itemMasters.filter((m) => {
        const q = search.toLowerCase()
        return (
          m.generic_name.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          m.ingredient.some((v) => v.toLowerCase().includes(q)) ||
          m.aliases.some((a) => a.toLowerCase().includes(q))
        )
      })
    : itemMasters

  const categories = Array.from(new Set(filteredMasters.map((m) => m.category)))

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch('') }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selected ? (
            <span className="flex items-center gap-1.5 truncate">
              <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                {selected.category}
              </span>
              <span className="truncate text-sm">{selected.generic_name}</span>
            </span>
          ) : customName ? (
            <span className="flex items-center gap-1.5 truncate">
              <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-600">
                신규
              </span>
              <span className="truncate text-sm">{customName}</span>
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
            placeholder="품목명, 성분명, 카테고리 검색..."
            className="text-sm"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {/* 연결 해제 */}
            {value && (
              <CommandGroup>
                <CommandItem
                  value="__unlink__"
                  onSelect={() => { onChange(''); setOpen(false); setSearch('') }}
                  className="text-xs text-slate-400"
                >
                  <Link2Off size={12} className="mr-1.5" />
                  연결 해제
                </CommandItem>
              </CommandGroup>
            )}

            {/* 신규 직접 입력 옵션 */}
            {showCreateOption && (
              <CommandGroup>
                <CommandItem
                  value="__create__"
                  onSelect={() => {
                    onCreateNew?.(search.trim())
                    setOpen(false)
                    setSearch('')
                  }}
                  className="text-sm text-teal-600"
                >
                  <Plus size={13} className="mr-1.5 shrink-0" />
                  <span>
                    <span className="font-medium">"{search.trim()}"</span>
                    <span className="ml-1 text-xs text-teal-500">신규 품목으로 추가</span>
                  </span>
                </CommandItem>
              </CommandGroup>
            )}

            {/* 기존 목록이 없을 때 */}
            {filteredMasters.length === 0 && !showCreateOption && (
              <p className="py-4 text-center text-xs text-slate-400">검색 결과가 없습니다.</p>
            )}

            {/* 카테고리별 그룹 */}
            {categories.map((category) => (
              <CommandGroup key={category} heading={category}>
                {filteredMasters
                  .filter((m) => m.category === category)
                  .map((m) => (
                    <CommandItem
                      key={m.id}
                      value={m.id}
                      onSelect={() => { onChange(m.id); setOpen(false); setSearch('') }}
                      className="text-sm"
                    >
                      <Check
                        size={13}
                        className={cn('mr-1.5 shrink-0', value === m.id ? 'opacity-100' : 'opacity-0')}
                      />
                      <div className="flex flex-col">
                        <span>{m.generic_name}</span>
                        {m.ingredient.length > 0 && (
                          <span className="text-[10px] text-indigo-400">{m.ingredient.join(', ')}</span>
                        )}
                      </div>
                      <span className="ml-auto shrink-0 text-[10px] text-slate-400">/{m.base_unit}</span>
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
