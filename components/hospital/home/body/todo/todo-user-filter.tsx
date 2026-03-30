'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils/utils'
import { Check, Filter, Plus, UsersIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { HospitalMetadata } from './todo'

type Props = {
  metadata: HospitalMetadata
  selectedValues: string[]
  onSelectionChange: (values: string[]) => void
}

export default function TodoUserFilter({
  metadata,
  selectedValues,
  onSelectionChange,
}: Props) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const options = useMemo(() => {
    const groups = metadata.groups.map((g) => ({
      label: g,
      value: g,
      type: 'group',
    }))
    const users = metadata.users.map((u) => ({
      label: u.name,
      value: u.name,
      type: 'user',
    }))
    return [...groups, ...users]
  }, [metadata])

  const toggleValue = (val: string) => {
    const next = selectedValues.includes(val)
      ? selectedValues.filter((v) => v !== val)
      : [...selectedValues, val]
    onSelectionChange(next)
    setSearchValue('')
  }

  const isCustomValue = useMemo(() => {
    if (!searchValue.trim()) return false
    // '전체'는 고정 옵션이므로 커스텀 값으로 취급하지 않음
    if (searchValue.trim() === '전체') return false
    return !options.some((o) => o.label.toLowerCase() === searchValue.toLowerCase().trim())
  }, [searchValue, options])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-dashed"
        >
          {selectedValues.length > 0 && (
            <>
              <div className="hidden space-x-1 lg:flex items-center">
                {selectedValues.length > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.length} 선택됨
                  </Badge>
                ) : (
                  selectedValues.map((val) => (
                    <Badge
                      variant="secondary"
                      key={val}
                      className="rounded-sm px-1 font-normal"
                    >
                      {val}
                    </Badge>
                  ))
                )}
              </div>
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.length}
              </Badge>
              <div className="mx-2 h-4 border-l" />
            </>
          )}
          
          <Filter className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">담당자 필터</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="검색하거나 선택하세요..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>결과는 없지만 "직접 지정"으로 추가할 수 있습니다.</CommandEmpty>
            
            {/* 고정 '전체(미지정)' 옵션 */}
            <CommandGroup heading="기본">
               <CommandItem
                onSelect={() => toggleValue('전체')}
                className="font-medium"
              >
                <div
                  className={cn(
                    'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                    selectedValues.includes('전체')
                      ? 'bg-primary text-primary-foreground'
                      : 'opacity-50 [&_svg]:invisible',
                  )}
                >
                  <Check className="h-4 w-4" />
                </div>
                <UsersIcon className="mr-2 h-3.5 w-3.5 text-slate-400" />
                <span>전체 (미지정 포함)</span>
              </CommandItem>
            </CommandGroup>

            {isCustomValue && (
              <CommandGroup heading="직접 지정">
                <CommandItem
                  onSelect={() => toggleValue(searchValue.trim())}
                  className="text-primary font-medium"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  "{searchValue}" 추가하여 필터링
                </CommandItem>
              </CommandGroup>
            )}

            <CommandGroup heading="그룹">
              {options
                .filter((o) => o.type === 'group')
                .map((opt) => (
                  <CommandItem
                    key={opt.value}
                    onSelect={() => toggleValue(opt.value)}
                  >
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        selectedValues.includes(opt.value)
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible',
                      )}
                    >
                      <Check className={cn('h-4 w-4')} />
                    </div>
                    <span>{opt.label}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
            
            <CommandGroup heading="사용자">
              {options
                .filter((o) => o.type === 'user')
                .map((opt) => (
                  <CommandItem
                    key={opt.value}
                    onSelect={() => toggleValue(opt.value)}
                  >
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        selectedValues.includes(opt.value)
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible',
                      )}
                    >
                      <Check className={cn('h-4 w-4')} />
                    </div>
                    <span>{opt.label}</span>
                  </CommandItem>
                ))}
            </CommandGroup>

            {selectedValues.filter(val => val !== '전체' && !options.some(o => o.value === val)).length > 0 && (
              <CommandGroup heading="기타 필터">
                {selectedValues
                  .filter(val => val !== '전체' && !options.some(o => o.value === val))
                  .map(val => (
                    <CommandItem
                      key={val}
                      onSelect={() => toggleValue(val)}
                    >
                      <div className="mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary bg-primary text-primary-foreground">
                        <Check className="h-4 w-4" />
                      </div>
                      <span>{val}</span>
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}

            {selectedValues.length > 0 && (
              <>
                <div className="h-px bg-border" />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                        onSelectionChange([])
                        setSearchValue('')
                    }}
                    className="justify-center text-center text-red-500 font-medium hover:text-red-600"
                  >
                    필터 초기화
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
