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
    // 우측에 리스트가 상시 노출되므로 다이얼로그는 이제 생략함
  }

  const getDayTodos = (date: Date): ClientTodo[] => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return todosByDate[dateStr] || []
  }

  return (
    <div className="flex flex-col gap-4 relative min-h-[500px]">
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
        className="rounded-md w-full h-full"
        classNames={{
          months: 'w-full',
          month: 'w-full space-y-4',
          table: 'w-full border-collapse space-y-1 table-fixed',
          head_row: 'flex w-full',
          head_cell: 'text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] py-2',
          row: 'flex w-full mt-2',
          cell: 'relative p-0 text-left text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md flex-1 h-40 border border-muted/50 min-w-0 overflow-hidden shadow-sm',
          day: cn(
            "h-full w-full p-2 font-normal aria-selected:opacity-100 items-start justify-start flex flex-col gap-1 hover:bg-slate-50 transition-colors min-w-0"
          ),
          day_today: 'bg-accent/50 text-accent-foreground font-bold outline outline-1 outline-primary/30',
          day_selected: 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary focus:bg-primary/20 focus:text-primary !opacity-100 ring-2 ring-primary ring-inset z-20',
          day_outside: 'text-muted-foreground opacity-30',
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
              <div className="flex flex-col items-start w-full h-full p-1 overflow-hidden min-w-0">
                <div className="mb-1.5 flex w-full items-center justify-between px-1 min-w-0 border-b border-muted/30 pb-1">
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      isSameDay(date, new Date()) && 'text-primary font-bold',
                    )}
                  >
                    {format(date, 'd')}
                  </span>
                  {hasTodos && (
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-[10px] text-muted-foreground bg-muted/30 px-1 rounded-sm">
                        {total}
                      </span>
                      {allDone && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                    </div>
                  )}
                </div>
                
                <div className="w-full flex-grow overflow-y-auto overflow-x-hidden scrollbar-hide py-1">
                  <div className="flex w-full flex-col gap-0.5 pb-2 min-w-0 px-0.5">
                    {dayTodos.map((todo) => (
                      <div
                        key={todo.id}
                        className={cn(
                          'w-0 min-w-full block truncate whitespace-nowrap overflow-hidden text-[10px] font-medium leading-[1.4] px-1.5 py-1 rounded-sm border-l-2 text-left',
                          todo.is_done
                            ? 'bg-slate-50 text-slate-400 border-slate-200 line-through'
                            : 'bg-blue-50/80 text-blue-700 border-blue-400',
                        )}
                        title={todo.todo_title}
                      >
                        {todo.todo_title.replace(/[\r\n]+/g, ' ')}
                      </div>
                    ))}
                  </div>
                </div>

                {hasTodos && !allDone && (
                  <div className="absolute bottom-1 right-1 pointer-events-none">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
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
