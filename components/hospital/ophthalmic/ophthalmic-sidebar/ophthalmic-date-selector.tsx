'use client'

import { format, addDays, subDays } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useRouter } from 'next/navigation'
import { ko } from 'date-fns/locale'

interface Props {
  hosId: string
  targetDate: string
}

export default function OphthalmicDateSelector({ hosId, targetDate }: Props) {
  const router = useRouter()
  const date = new Date(targetDate)

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      router.push(`/hospital/${hosId}/ophthalmic/${format(newDate, 'yyyy-MM-dd')}`)
    }
  }

  const handlePrevDay = () => {
    const prevDay = subDays(date, 1)
    router.push(`/hospital/${hosId}/ophthalmic/${format(prevDay, 'yyyy-MM-dd')}`)
  }

  const handleNextDay = () => {
    const nextDay = addDays(date, 1)
    router.push(`/hospital/${hosId}/ophthalmic/${format(nextDay, 'yyyy-MM-dd')}`)
  }

  return (
    <div className="flex items-center justify-between gap-1">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevDay}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 flex-1 px-1 text-xs font-semibold hover:bg-slate-100"
          >
            <CalendarIcon className="mr-1 h-3 w-3 text-slate-500" />
            {format(date, 'yyyy.MM.dd(eee)', { locale: ko })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateChange}
            initialFocus
            locale={ko}
          />
        </PopoverContent>
      </Popover>

      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextDay}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
