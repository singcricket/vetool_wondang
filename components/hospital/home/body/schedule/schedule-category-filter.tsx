'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
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
import { Check, Filter, Tag } from 'lucide-react'
import { useState } from 'react'
import { ScheduleCategory } from '@/types/hospital'

type Props = {
  categories: ScheduleCategory[]
  selectedValues: string[]
  onSelectionChange: (values: string[]) => void
}

export default function ScheduleCategoryFilter({
  categories,
  selectedValues,
  onSelectionChange,
}: Props) {
  const [open, setOpen] = useState(false)

  const toggleValue = (val: string) => {
    const next = selectedValues.includes(val)
      ? selectedValues.filter((v) => v !== val)
      : [...selectedValues, val]
    onSelectionChange(next)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          {selectedValues.length > 0 && (
            <>
              <div className="hidden space-x-1 lg:flex items-center">
                {selectedValues.length > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.length}개 카테고리
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

          <Tag className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">카테고리 필터</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder="카테고리 검색..." />
          <CommandList>
            <CommandGroup heading="카테고리">
              <CommandItem onSelect={() => toggleValue('일반')}>
                <div
                  className={cn(
                    'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                    selectedValues.includes('일반')
                      ? 'bg-primary text-primary-foreground'
                      : 'opacity-50 [&_svg]:invisible',
                  )}
                >
                  <Check className="h-4 w-4" />
                </div>
                <span>일반</span>
              </CommandItem>
              {categories.map((cat) => (
                <CommandItem
                  key={cat.id}
                  onSelect={() => toggleValue(cat.name)}
                >
                  <div
                    className={cn(
                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                      selectedValues.includes(cat.name)
                        ? 'bg-primary text-primary-foreground'
                        : 'opacity-50 [&_svg]:invisible',
                    )}
                  >
                    <Check className="h-4 w-4" />
                  </div>
                  <div
                    className="mr-2 w-2 h-2 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span>{cat.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            {selectedValues.length > 0 && (
              <>
                <div className="h-px bg-border" />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onSelectionChange([])}
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
