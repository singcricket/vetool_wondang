'use client'

import { useState, useEffect } from 'react'
import { HashIcon } from 'lucide-react'
import Autocomplete from '@/components/common/auto-complete/auto-complete'

interface Props {
  userTags: string[]
  onChange: (tags: string[]) => void
}

export default function NotesTagInput({ userTags, onChange }: Props) {
  const [inputValue, setInputValue] = useState(userTags.join(', '))

  // Sync with external changes if any
  useEffect(() => {
    setInputValue(userTags.join(', '))
  }, [userTags])

  const handleUpdate = (value: string) => {
    setInputValue(value)
    
    const tagsArray = value
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)
    
    onChange(tagsArray)
  }

  return (
    <div className="flex-1 min-w-[300px] relative group h-10 flex items-center">
      <Autocomplete
        // label="Tags"
        defaultValue={inputValue}
        handleUpdate={handleUpdate}
        placeholder="심장병, hf, 약처방 등 (콤마로 구분)"
        className="w-full"
      />
      <div className="absolute -bottom-5 left-1 text-[9px] text-slate-400 font-medium opacity-0 group-focus-within:opacity-100 transition-opacity whitespace-nowrap">
        * 콤마(,)를 입력하면 여러 개의 태그가 자동으로 분리되어 저장됩니다.
      </div>
    </div>
  )
}
