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
import { HospitalMetadata } from '../todo/todo'

type Props = {
  metadata: HospitalMetadata
  selectedValues: string[]
  onSelectionChange: (values: string[]) => void
  loggedInUserId?: string
}

export default function ScheduleUserFilter({
  metadata,
  selectedValues,
  onSelectionChange,
  loggedInUserId,
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
      value: u.user_id,
      type: 'user',
    }))
    return [...groups, ...users]
  }, [metadata])

  const getValueLabel = (val: string) => {
    if (val === '미지정') return '미지정'
    if (val === '__created_by_me__') return '내가 작성한 글'
    if (val === loggedInUserId) return '나'
    const found = options.find((o) => o.value === val)
    return found ? found.label : val
  }

  const toggleValue = (val: string) => {
    const next = selectedValues.includes(val)
      ? selectedValues.filter((v) => v !== val)
      : [...selectedValues, val]
    onSelectionChange(next)
    setSearchValue('')
  }

  const isCustomValue = useMemo(() => {
    if (!searchValue.trim()) return false
    const reserved = ['미지정', '모두보기', '전체', '나', '내가 작성한 글']
    if (reserved.includes(searchValue.trim())) return false
    return !options.some(
      (o) => o.label.toLowerCase() === searchValue.toLowerCase().trim(),
    )
  }, [searchValue, options])

  const currentUser = useMemo(() => 
    metadata.users.find(u => u.user_id === loggedInUserId)
  , [metadata.users, loggedInUserId])

  const myGroups = currentUser?.group || []

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
                    {selectedValues.length} 선택됨
                  </Badge>
                ) : (
                  selectedValues.map((val) => (
                    <Badge
                      variant="secondary"
                      key={val}
                      className="rounded-sm px-1 font-normal"
                    >
                      {getValueLabel(val)}
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
          <span className="hidden sm:inline">
            {selectedValues.length > 0 ? '필터 활성' : '모두보기'}
          </span>
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
            <CommandEmpty>
              결과는 없지만 "직접 지정"으로 추가할 수 있습니다.
            </CommandEmpty>

            <CommandGroup heading="기본">
              {/* 모두보기 (Reset) */}
              <CommandItem
                 onSelect={() => {
                   onSelectionChange([])
                   setOpen(false)
                 }}
                 className="font-medium text-primary"
               >
                 <UsersIcon className="mr-2 h-3.5 w-3.5" />
                 <span>모두보기 (전체)</span>
               </CommandItem>

              {/* 미지정 */}
              <CommandItem onSelect={() => toggleValue('미지정')}>
                <div
                  className={cn(
                    'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                    selectedValues.includes('미지정')
                      ? 'bg-primary text-primary-foreground'
                      : 'opacity-50 [&_svg]:invisible',
                  )}
                >
                  <Check className="h-4 w-4" />
                </div>
                <span>미지정</span>
              </CommandItem>

              {/* 내가 작성한 글 */}
              <CommandItem
                 onSelect={() => toggleValue('__created_by_me__')}
              >
                <div
                  className={cn(
                    'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                    selectedValues.includes('__created_by_me__')
                      ? 'bg-primary text-primary-foreground'
                      : 'opacity-50 [&_svg]:invisible',
                  )}
                >
                  <Check className="h-4 w-4" />
                </div>
                <span>내가 작성한 글</span>
              </CommandItem>
            </CommandGroup>

            {loggedInUserId && (
              <CommandGroup heading="나">
                <CommandItem onSelect={() => toggleValue(loggedInUserId)}>
                  <div
                    className={cn(
                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                      selectedValues.includes(loggedInUserId)
                        ? 'bg-primary text-primary-foreground'
                        : 'opacity-50 [&_svg]:invisible',
                    )}
                  >
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="font-bold">나 ({currentUser?.name || '나'})</span>
                </CommandItem>
              </CommandGroup>
            )}

            {myGroups.length > 0 && (
              <CommandGroup heading="내 그룹">
                {myGroups.map(group => (
                  <CommandItem key={group} onSelect={() => toggleValue(group)}>
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        selectedValues.includes(group)
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible',
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </div>
                    <span>{group}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

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

            <CommandGroup heading="기타 그룹">
              {options
                .filter((o) => o.type === 'group' && !myGroups.includes(o.value))
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
                .filter((o) => o.type === 'user' && o.value !== loggedInUserId)
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

            {selectedValues.filter(val => 
                val !== '미지정' && 
                val !== '__created_by_me__' && 
                val !== loggedInUserId && 
                !options.some(o => o.value === val)
            ).length > 0 && (
              <CommandGroup heading="기타 필터">
                {selectedValues
                  .filter(val => 
                    val !== '미지정' && 
                    val !== '__created_by_me__' && 
                    val !== loggedInUserId && 
                    !options.some(o => o.value === val)
                  )
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
