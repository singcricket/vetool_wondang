'use client'

import React, { useState, useRef, useEffect } from 'react'
import { searchAbbreviations, type AvdcAbbrev } from '@/constants/hospital/dental/avdcAbbreviations'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'

type Props = {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export default function AvdcAutocompleteInput({ value, onChange, placeholder = '기타 항목 입력 (약어 또는 영문 검색)...' }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // 입력이 변경될 때
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    onChange(val)
    
    // 쉼표 단위로 가장 마지막 입력 문자열 추출
    const lastWord = val.split(',').pop()?.trim() || ''
    setSearch(lastWord)
    
    if (lastWord.length > 1) { // 2글자 이상부터 열림
      setOpen(true)
    } else {
      setOpen(false)
    }
  }

  const results = searchAbbreviations(search).slice(0, 50) // 최대 50개까지 추천 (스크롤 지원)

  const handleSelect = (abbr: string) => {
    // 쉼표 기반이므로 마지막 요소를 제거하고 선택된 abbr을 삽입
    const chunks = value.split(',')
    chunks.pop() // 검색어 부분 제거
    
    const newValue = [...chunks.map(c => c.trim()).filter(Boolean), abbr].join(', ')
    
    onChange(newValue + ', ') // 선택 시 뒤에 추가 입력을 위해 쉼표와 공백 추가
    setOpen(false)
    setSearch('')
    inputRef.current?.focus()
  }

  // 외부 클릭 시 검색어 상태 초기화
  useEffect(() => {
    if (!open) {
      setSearch('')
    }
  }, [open])

  return (
    <Popover open={open && results.length > 0} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <Input 
            ref={inputRef}
            value={value} 
            onChange={handleChange} 
            placeholder={placeholder} 
            className="text-xs h-8 pr-8"
          />
        </div>
      </PopoverTrigger>
      {/* Popover 포커싱으로 인해 Input이 blur되지 않게 onOpenAutoFocus 방지 */}
      <PopoverContent 
        className="w-[300px] p-0 shadow-lg border rounded-md overflow-hidden" 
        align="start" 
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <style>{`
          .avdc-scroll::-webkit-scrollbar {
            display: block !important;
            width: 5px !important;
          }
          .avdc-scroll::-webkit-scrollbar-track {
            background: transparent !important;
          }
          .avdc-scroll::-webkit-scrollbar-thumb {
            background-color: #cbd5e1 !important;
            border-radius: 20px !important;
          }
          .avdc-scroll {
            scrollbar-width: thin !important;
            scrollbar-color: #cbd5e1 transparent !important;
            -ms-overflow-style: auto !important;
          }
        `}</style>
        
        <div 
          className="w-full avdc-scroll" 
          style={{ 
            maxHeight: '300px', 
            overflowY: 'auto', 
            pointerEvents: 'auto', 
            scrollBehavior: 'auto' 
          }}
          onWheel={(e) => e.stopPropagation()}
        >
          <Command className="h-auto overflow-visible" shouldFilter={false}>
            <CommandList className="h-auto max-h-none overflow-visible">
              <CommandGroup heading="AVDC 약어 추천 목록">
                {results.map((r: AvdcAbbrev, index: number) => (
                  <CommandItem 
                    key={`${r.abbr}-${index}`} 
                    value={`${r.abbr}-${index}`} 
                    onSelect={() => handleSelect(r.abbr)} 
                    className="cursor-pointer"
                  >
                    <span className="text-xs font-medium">
                      {r.definition} ({r.abbr}{r.definition_kr ? ` : ${r.definition_kr}` : ''})
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </PopoverContent>
    </Popover>
  )
}
