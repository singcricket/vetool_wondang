import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarDaysIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'

type Props = {
  dateRange: DateRange | undefined
  handleDateRangeChange: (range: DateRange | undefined) => void
}

export default function IoPatientsCalendar({
  dateRange,
  handleDateRangeChange,
}: Props) {
  return (
    <div className="flex flex-col space-y-2">
      <Label className="pl-4">날짜 선택</Label>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="justify-start text-left font-normal"
          >
            <CalendarDaysIcon className="h-3 w-3" />
            <span className="ml-2 text-sm">
              {`${format(dateRange?.from || new Date(), 'yyyy-MM-dd')} - ${format(dateRange?.to || new Date(), 'yyyy-MM-dd')}`}
            </span>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0">
          <Calendar
            className="text-sm"
            styles={{
              button: { fontSize: 12 },
            }}
            captionLayout="dropdown-buttons"
            showOutsideDays
            fixedWeeks
            locale={ko}
            mode="range"
            selected={dateRange}
            onSelect={handleDateRangeChange}
            initialFocus
            defaultMonth={new Date()}
            disabled={(date) =>
              date > new Date() || date < new Date('2024-01-01')
            }
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
