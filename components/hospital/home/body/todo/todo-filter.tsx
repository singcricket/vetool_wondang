'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type Dispatch, type SetStateAction } from 'react'
import { ListChecks, ListTodo, ClipboardList } from 'lucide-react'

type Props = {
  activeFilter: 'all' | 'done' | 'not-done'
  setActiveFilter: Dispatch<SetStateAction<'all' | 'done' | 'not-done'>>
}

export default function TodoFilter({ activeFilter, setActiveFilter }: Props) {
  return (
    <Select
      onValueChange={(value: 'all' | 'done' | 'not-done') =>
        setActiveFilter(value)
      }
      defaultValue={activeFilter}
    >
      <SelectTrigger className="w-[40px] md:w-[100px] flex items-center justify-center md:justify-between px-2 md:px-3">
        {/* 모바일 아이콘 전용 뷰 */}
        <div className="md:hidden">
          {activeFilter === 'all' && <ClipboardList className="h-4 w-4" />}
          {activeFilter === 'done' && <ListChecks className="h-4 w-4" />}
          {activeFilter === 'not-done' && <ListTodo className="h-4 w-4" />}
        </div>
        
        {/* PC용 텍스트 뷰 */}
        <div className="hidden md:block">
           <SelectValue placeholder="필터" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">모두</SelectItem>
        <SelectItem value="done">완료</SelectItem>
        <SelectItem value="not-done">미완료</SelectItem>
      </SelectContent>
    </Select>
  )
}
