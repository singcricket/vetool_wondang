'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils/utils'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { ko } from 'date-fns/locale'
import {
  fetchHospitalMetadata,
  fetchScheduleSetting,
} from '@/lib/services/hospital-home/todo'
import { fetchSchedulesByDateRange } from '@/lib/services/hospital-home/schedule'
import { HospitalMetadata } from '@/components/hospital/home/body/todo/todo'
import { ScheduleSetting, ScheduleCategory } from '@/types/hospital'
import { Schedule } from '@/types/hospital/schedule'
import { DateRange } from 'react-day-picker'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import ScheduleUserFilter from '@/components/hospital/home/body/schedule/schedule-user-filter'

type Props = {
  hosId: string
  loggedInUserId: string
}

export default function AttendanceClient({ hosId, loggedInUserId }: Props) {
  const [metadata, setMetadata] = useState<HospitalMetadata | null>(null)
  const [scheduleSetting, setScheduleSetting] = useState<ScheduleSetting | null>(null)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfWeek(new Date(), { weekStartsOn: 0 }),
    to: endOfWeek(new Date(), { weekStartsOn: 0 }),
  })
  
  const [selectedUserFilter, setSelectedUserFilter] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const isAdmin = useMemo(() => {
    return metadata?.users.find((u) => u.user_id === loggedInUserId)?.is_admin ?? false
  }, [metadata, loggedInUserId])

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [metaData, settingData] = await Promise.all([
          fetchHospitalMetadata(hosId),
          fetchScheduleSetting(hosId),
        ])
        setMetadata(metaData)
        setScheduleSetting(settingData)
      } catch (error) {
        console.error('Failed to load initial data:', error)
      }
    }
    loadInitialData()
  }, [hosId])

  useEffect(() => {
    const loadSchedules = async () => {
      if (!date?.from || !date?.to) return
      setIsLoading(true)
      try {
        // We include end of day for the end date to ensure full coverage
        const endDateIso = new Date(date.to)
        endDateIso.setHours(23, 59, 59, 999)
        const data = await fetchSchedulesByDateRange(hosId, date.from.toISOString(), endDateIso.toISOString())
        setSchedules(data as Schedule[])
      } catch (error) {
        console.error('Failed to load schedules:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSchedules()
  }, [hosId, date])

  // Combine standard and hidden categories for counts
  const allCategories = useMemo(() => {
    if (!scheduleSetting) return []
    return [
      ...(scheduleSetting.schedule_categories || []),
      ...(isAdmin ? (scheduleSetting.hidden_categories || []) : [])
    ]
  }, [scheduleSetting, isAdmin])

  // Calculate aggregation
  const aggregatedData = useMemo(() => {
    if (!metadata) return []

    // 1. Filter users based on selectedUserFilter (same logic as TimeTable)
    const filteredUsers = metadata.users.filter((user) => {
      if (selectedUserFilter.length === 0) return true
      
      // Match by direct user_id
      if (selectedUserFilter.includes(user.user_id)) return true
      // Match by group
      if (user.group && user.group.some(g => selectedUserFilter.includes(g))) return true
      
      return false
    })

    // 2. Count per user
    const userStats = filteredUsers.map((user) => {
      const counts: Record<string, number> = {} // categoryName -> count
      allCategories.forEach(c => counts[c.name] = 0)
      counts['일반'] = 0
      counts['기타'] = 0

      let total = 0

      // Only count accessible schedules
      schedules.forEach(schedule => {
        const targets = schedule.target_users || []
        
        // Privacy filter
        if (!isAdmin && targets.includes('admin')) return

        // Does it apply to this user?
        if (targets.some(t => t === user.user_id || t === user.name)) {
          const cat = schedule.category || '기타'
          counts[cat] = (counts[cat] || 0) + 1
          total++
        }
      })

      return {
        user,
        counts,
        total
      }
    })

    return userStats
  }, [metadata, selectedUserFilter, schedules, allCategories, isAdmin])

  if (!metadata || !scheduleSetting) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Pre-define columns to show
  const categoryColumns = ['일반', ...allCategories.map(c => c.name)]

  return (
    <Card className="rounded-sm shadow-sm border-none bg-transparent">
      <CardHeader className="bg-white border rounded-t-sm p-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-xl">근태 현황</CardTitle>
          
          <div className="flex flex-wrap items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal bg-white h-9",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "yyyy. MM. dd")} -{" "}
                        {format(date.to, "yyyy. MM. dd")}
                      </>
                    ) : (
                      format(date.from, "yyyy. MM. dd")
                    )
                  ) : (
                    <span>날짜 선택</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                  locale={ko}
                />
              </PopoverContent>
            </Popover>

            <ScheduleUserFilter
              metadata={metadata}
              loggedInUserId={loggedInUserId}
              selectedValues={selectedUserFilter}
              onSelectionChange={setSelectedUserFilter}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="bg-white border rounded-sm">
          {isLoading && schedules.length === 0 ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="relative w-full">
              <Table className="table-fixed w-full">
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[80px] sm:w-[100px] font-bold text-slate-700">이름</TableHead>
                    <TableHead className="w-[80px] sm:w-[100px] font-bold text-slate-700">부서/직급</TableHead>
                    {categoryColumns.map(catName => {
                      const color = allCategories.find(c => c.name === catName)?.color || '#3b82f6'
                      const isHidden = isAdmin && scheduleSetting.hidden_categories?.some(c => c.name === catName)
                      return (
                        <TableHead key={catName} className="text-center font-bold text-xs sm:text-sm whitespace-normal break-keep p-1 align-top">
                          <div className="flex flex-col items-center justify-start gap-1 p-1">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                            <span className="leading-tight">{catName}</span>
                            {isHidden && <span className="text-[10px] text-amber-600 border border-amber-300 rounded px-0.5 bg-amber-50">Admin</span>}
                          </div>
                        </TableHead>
                      )
                    })}
                    <TableHead className="w-[60px] sm:w-[80px] text-center font-bold text-slate-700 border-l bg-slate-100 whitespace-normal break-keep p-1 text-xs sm:text-sm">총 스케줄</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aggregatedData.map(stat => (
                    <TableRow key={stat.user.user_id}>
                      <TableCell className="font-medium whitespace-normal break-keep p-1 text-xs sm:text-sm">
                        {stat.user.name}
                      </TableCell>
                      <TableCell className="text-slate-500 text-[10px] sm:text-xs whitespace-normal break-keep p-1 align-top">
                        {stat.user.group?.[0]}
                        {stat.user.position && <><br /><span className="text-slate-400 opacity-80">{stat.user.position}</span></>}
                      </TableCell>
                      {categoryColumns.map(catName => (
                        <TableCell key={catName} className="text-center p-1">
                          {stat.counts[catName] > 0 ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-100 font-semibold text-slate-700 text-xs sm:text-sm">
                              {stat.counts[catName]}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">-</span>
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-center border-l font-bold text-primary bg-slate-50/50 p-1 text-xs sm:text-sm">
                        {stat.total > 0 ? stat.total : 0}
                      </TableCell>
                    </TableRow>
                  ))}
                  {aggregatedData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={categoryColumns.length + 3} className="h-32 text-center text-slate-500">
                        조회된 데이터가 없습니다. 필터를 변경해보세요.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
