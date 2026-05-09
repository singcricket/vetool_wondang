'use client'

import * as React from 'react'
import { format, addDays, subDays } from 'date-fns'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { cn } from '@/lib/utils/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface NeuroDateSelectorProps {
  hosId: string
  targetDate: string
}

export default function NeuroDateSelector({
  hosId,
  targetDate,
}: NeuroDateSelectorProps) {
  const router = useRouter()
  const date = new Date(targetDate)

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      router.push(`/hospital/${hosId}/neuro/${format(newDate, 'yyyy-MM-dd')}`)
    }
  }

  const handlePrevDay = () => handleDateSelect(subDays(date, 1))
  const handleNextDay = () => handleDateSelect(addDays(date, 1))

  return (
    <div className="flex w-full items-center justify-between">
      <Button
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={handlePrevDay}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              'h-8 flex-1 justify-center px-2 text-xs font-medium',
              !date && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            {date ? format(date, 'MM-dd (E)') : <span>날짜 선택</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={handleNextDay}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
