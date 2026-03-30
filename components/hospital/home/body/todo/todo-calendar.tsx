'use client'

import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils/utils'
import { format, isSameDay, startOfMonth } from 'date-fns'
import { ClientTodo } from '@/types/hospital/todo'
import TodoSkeleton from './todo-skeleton'
import { HospitalMetadata } from './todo'

type Props = {
  hosId: string
  activeFilter: 'all' | 'done' | 'not-done'
  todosByDate: Record<string, ClientTodo[]>
  refetch: () => Promise<void>
  isFetching: boolean
  currentMonth: Date
  setCurrentMonth: (date: Date) => void
  metadata: HospitalMetadata
  selectedDate: Date
  setSelectedDate: (date: Date) => void
}

export default function TodoCalendar({ 
  hosId, 
  activeFilter, 
  todosByDate, 
  refetch, 
  isFetching,
  currentMonth,
  setCurrentMonth,
  metadata,
  selectedDate,
  setSelectedDate
}: Props) {

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
  }

  const getDayTodos = (date: Date): ClientTodo[] => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return todosByDate[dateStr] || []
  }

  return (
    <div className="flex flex-col gap-2 relative min-h-[400px]">
       {isFetching && (
        <div className="absolute inset-x-0 bottom-0 top-12 z-50 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-md pointer-events-none">
           <TodoSkeleton />
        </div>
      )}
      <Calendar
        key={currentMonth.toISOString()}
        mode="single"
        selected={selectedDate}
        onMonthChange={(date) => {
          const firstOfNewMonth = startOfMonth(date)
          setCurrentMonth(firstOfNewMonth)
          setSelectedDate(firstOfNewMonth)
        }}
        month={currentMonth}
        onDayClick={handleDayClick}
        className="rounded-md w-full h-full p-2"
        classNames={{
          months: 'w-full',
          month: 'w-full space-y-2',
          table: 'w-full border-collapse table-fixed',
          head_row: 'flex w-full',
          head_cell: 'text-muted-foreground rounded-md flex-1 font-normal text-[0.75rem] py-1',
          row: 'flex w-full mt-1',
          // FHD 화면 최적화를 위해 높이를 h-40에서 h-28로 축소 (약 112px)
          cell: 'relative p-0 text-left text-xs focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md flex-1 h-28 border border-muted/30 min-w-0 overflow-hidden shadow-sm',
          day: cn(
            "h-full w-full p-1.5 font-normal aria-selected:opacity-100 items-start justify-start flex flex-col gap-0.5 hover:bg-slate-50 transition-colors min-w-0"
          ),
          day_today: 'bg-accent/30 text-accent-foreground font-bold outline outline-1 outline-primary/20',
          day_selected: 'bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary !opacity-100 ring-1 ring-primary ring-inset z-20',
          day_outside: 'text-muted-foreground opacity-20',
        }}
        components={{
          DayContent: ({ date }) => {
            const dayTodos = getDayTodos(date)
            const total = dayTodos.length
            const done = dayTodos.filter((t) => t.is_done).length
            const undone = total - done
            const allDone = total > 0 && done === total
            const hasTodos = total > 0

            return (
              <div className="flex flex-col items-start w-full h-full overflow-hidden min-w-0">
                <div className="mb-0.5 flex w-full items-center justify-between px-1 min-w-0 border-b border-muted/20 pb-0.5">
                  <span
                    className={cn(
                      'text-[10px] sm:text-xs font-semibold',
                      isSameDay(date, new Date()) && 'text-primary font-bold',
                    )}
                  >
                    {format(date, 'd')}
                  </span>
                  {hasTodos && (
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-[9px] text-muted-foreground bg-muted/20 px-1 rounded-sm">
                        {total}
                      </span>
                      {allDone && <div className="h-1 w-1 rounded-full bg-emerald-500" />}
                    </div>
                  )}
                </div>
                
                <div className="w-full flex-grow overflow-y-auto overflow-x-hidden scrollbar-hide py-0.5">
                  <div className="flex w-full flex-col gap-0.5 pb-2 min-w-0 px-0.5">
                    {dayTodos.map((todo) => (
                      <div
                        key={todo.id}
                        className={cn(
                          'w-0 min-w-full block truncate whitespace-nowrap overflow-hidden text-[9px] font-medium leading-tight px-1 py-0.5 rounded-sm border-l-2 text-left',
                          todo.is_done
                            ? 'bg-slate-50/50 text-slate-300 border-slate-100 line-through'
                            : 'bg-blue-50/50 text-blue-600 border-blue-300',
                        )}
                        title={todo.todo_title}
                      >
                        {todo.todo_title.replace(/[\r\n]+/g, ' ')}
                      </div>
                    ))}
                  </div>
                </div>

                {hasTodos && !allDone && (
                  <div className="absolute bottom-0.5 right-0.5 pointer-events-none">
                    <div className="h-1 w-1 rounded-full bg-blue-400" />
                  </div>
                )}
              </div>
            )
          },
        }}
      />
    </div>
  )
}
