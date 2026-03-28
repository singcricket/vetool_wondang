'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { addDays, format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  hosId: string
  targetDate: string
}

export default function EchoDateSelector({ hosId, targetDate }: Props) {
  const { push } = useRouter()
  const [open, setOpen] = useState(false)

  const updateDate = (newDate: Date) => {
    push(`/hospital/${hosId}/echocardio/${format(newDate, 'yyyy-MM-dd')}`)
  }

  const handleUpdateDate = (days: number) => {
    updateDate(addDays(targetDate, days))
  }

  const handleSelectDate = (date?: Date) => {
    if (date) {
      updateDate(date)
      setOpen(false)
    }
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <Button
        onClick={() => handleUpdateDate(-1)}
        size="icon"
        variant="outline"
        className="h-6 w-6 rounded-full"
        aria-label="이전 날짜로 이동"
      >
        <ArrowLeftIcon />
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            className="h-8 px-2 py-0 font-mono text-base font-semibold"
            variant="ghost"
          >
            {format(targetDate, 'yy.MM.dd')}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            className="text-sm"
            styles={{
              button: { fontSize: 12 },
            }}
            captionLayout="dropdown-buttons"
            showOutsideDays
            fixedWeeks
            locale={ko}
            mode="single"
            initialFocus
            selected={new Date(targetDate)}
            onSelect={handleSelectDate}
          />
        </PopoverContent>
      </Popover>

      <Button
        onClick={() => handleUpdateDate(1)}
        size="icon"
        variant="outline"
        className="h-6 w-6 rounded-full"
        aria-label="다음 날짜로 이동"
      >
        <ArrowRightIcon />
      </Button>
    </div>
  )
}
