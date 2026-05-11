'use client'

import * as React from 'react'
import { Search } from 'lucide-react'
import { neuroReference } from '@/constants/hospital/physical-exam/neuro/neuro_ref'
import type { NeuroTestItem } from '@/constants/hospital/physical-exam/neuro/neuro_ref'
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
// import { cn } from '@/lib/utils'

interface Props {
  onSelect: (test: NeuroTestItem) => void
}

export default function NeuroTestSearch({ onSelect }: Props) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState('')

  // Flatten all tests from all domains
  const allTests = React.useMemo(() => {
    return neuroReference.domainSections.flatMap(section => 
      section.tests.map(test => ({
        ...test,
        domainNameKo: section.domainNameKo
      }))
    )
  }, [])

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] sm:w-[250px] justify-between h-9 text-xs sm:text-sm border-slate-200"
          >
            <div className="flex items-center gap-2 text-slate-500 overflow-hidden">
              <Search className="h-4 w-4 shrink-0" />
              <span className="truncate">검사 항목 검색...</span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] sm:w-[400px] p-0" align="end">
          <Command>
            <CommandInput placeholder="항목명(한글/영어) 검색..." />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
              <CommandGroup heading="검사 항목">
                {allTests.map((test) => (
                  <CommandItem
                    key={test.testID}
                    value={`${test.testNameKo} ${test.testName}`}
                    onSelect={() => {
                      onSelect(test)
                      setOpen(false)
                    }}
                    className="flex flex-col items-start gap-0.5 py-2 cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-slate-900">{test.testNameKo}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                        {test.domainNameKo}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 italic">{test.testName}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
