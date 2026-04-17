'use client'
import { useMemo } from 'react'

import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils/utils'
import { format, isSameDay, startOfMonth } from 'date-fns'
import { Schedule } from '@/types/hospital/schedule'
import TodoSkeleton from '../todo/todo-skeleton'
import { HospitalMetadata } from '../todo/todo'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip'

type Props = {
  hosId: string
  schedulesByDate: Record<string, Schedule[]>
  refetch: () => Promise<void>
  isFetching: boolean
  currentMonth: Date
  setCurrentMonth: (date: Date) => void
  metadata: HospitalMetadata
  selectedDate: Date
  setSelectedDate: (date: Date) => void
}

export default function ScheduleCalendar({
  hosId,
  schedulesByDate,
  refetch,
  isFetching,
  currentMonth,
  setCurrentMonth,
  metadata,
  selectedDate,
  setSelectedDate,
}: Props) {
  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
  }

  const getDaySchedules = (date: Date): Schedule[] => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return schedulesByDate[dateStr] || []
  }

  return (
    <TooltipProvider>
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
            head_cell:
              'text-muted-foreground rounded-md flex-1 font-normal text-[0.75rem] py-1',
            row: 'flex w-full mt-1',
            cell: 'relative p-0 text-left text-xs focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md flex-1 h-32 border border-muted/30 min-w-0 overflow-hidden shadow-sm',
            day: cn(
              'h-full w-full p-1.5 font-normal aria-selected:opacity-100 items-start justify-start flex flex-col gap-0.5 hover:bg-slate-50 transition-colors min-w-0',
            ),
            day_today:
              'bg-accent/30 text-accent-foreground font-bold outline outline-1 outline-primary/20',
            day_selected:
              'bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary !opacity-100 ring-1 ring-primary ring-inset z-20',
            day_outside: 'text-muted-foreground opacity-20',
          }}
          components={{
            DayContent: ({ date }) => {
              const daySchedules = getDaySchedules(date)
              const hasSchedules = daySchedules.length > 0

              // 카테고리별 통계 계산
              const categoryStats = useMemo(() => {
                if (!hasSchedules) return []
                const statsMap: Record<string, { count: number, color: string }> = {}
                
                daySchedules.forEach((s) => {
                  const cat = s.category || '기타'
                  if (!statsMap[cat]) {
                    statsMap[cat] = { count: 0, color: s.color || '#3b82f6' }
                  }
                  statsMap[cat].count++
                })
                
                return Object.entries(statsMap).map(([name, data]) => ({
                  name,
                  ...data
                }))
              }, [daySchedules])

              const content = (
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
                    {hasSchedules && (
                      <span className="font-mono text-[9px] text-muted-foreground bg-muted/20 px-1 rounded-sm">
                        {daySchedules.length}
                      </span>
                    )}
                  </div>

                  <div className="w-full flex-grow overflow-y-auto overflow-x-hidden scrollbar-hide py-0.5">
                    <div className="flex w-full flex-col gap-0.5 pb-2 min-w-0 px-0.5">
                      {daySchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className={cn(
                            'w-0 min-w-full block truncate whitespace-nowrap overflow-hidden text-[9px] font-medium leading-tight px-1 py-0.5 rounded-sm border-l-2 text-left',
                          )}
                          style={{
                            backgroundColor: `${schedule.color}25`,
                            color: schedule.color || '#1e293b',
                            borderLeftColor: schedule.color || '#3b82f6',
                          }}
                          title={schedule.title}
                        >
                          {schedule.target_users && schedule.target_users.length > 0 && (
                            <span className="mr-1 text-[9px] font-bold shrink-0">
                              {schedule.target_users
                                .map((t) => metadata.users.find((u) => u.user_id === t)?.name || t)
                                .join(',')}
                            </span>
                          )}
                          <span className="truncate font-medium">
                            [{schedule.title}]
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )

              if (!hasSchedules) return content

              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    {content}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-white/95 backdrop-blur-sm border shadow-lg p-3 min-w-[160px]">
                    <div className="flex flex-col gap-2">
                      <p className="text-[11px] font-bold text-slate-500 border-b pb-1 dark:text-slate-400">
                        {format(date, 'M월 d일')} 요약
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {categoryStats.map((stat) => (
                          <div key={stat.name} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stat.color }} />
                              <span className="text-[10px] font-medium text-slate-700">{stat.name}</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">{stat.count}건</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )
            },
          }}
        />
      </div>
    </TooltipProvider>
  )
}
