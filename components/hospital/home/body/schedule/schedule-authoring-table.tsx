'use client'

import { useState, useMemo } from 'react'
import { 
  format, 
  startOfWeek, 
  addDays, 
  subDays, 
  isSameDay, 
  parseISO 
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  User as UserIcon,
  Trash2,
  Copy,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { HospitalMetadata } from '../todo/todo'
import { ScheduleSetting, ScheduleCategory } from '@/types/hospital'
import { Schedule } from '@/types/hospital/schedule'
import { upsertSchedule, deleteSchedule } from '@/lib/services/hospital-home/schedule'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/utils'

type Props = {
  hosId: string
  loggedInUserId: string
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  metadata: HospitalMetadata
  scheduleSetting: ScheduleSetting | null
  refetch: () => Promise<void>
  schedulesByDate: Record<string, Schedule[]>
}

export default function ScheduleAuthoringTable({
  hosId,
  loggedInUserId,
  selectedDate,
  setSelectedDate,
  metadata,
  scheduleSetting,
  refetch,
  schedulesByDate,
}: Props) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null) // staffId-date
  const [selectedCellKeys, setSelectedCellKeys] = useState<Set<string>>(new Set()) // staffId|dateStr
  const [copyOffsetDays, setCopyOffsetDays] = useState<string>('7')
  const [isCopying, setIsCopying] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }) // Monday
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const handlePrevWeek = () => setSelectedDate(subDays(selectedDate, 7))
  const handleNextWeek = () => setSelectedDate(addDays(selectedDate, 7))
  const handleToday = () => setSelectedDate(new Date())

  // 선택된 항목들의 상태 분석
  const selectionInfo = useMemo(() => {
    if (selectedCellKeys.size === 0) return { hasOccupied: false, hasEmpty: false, selectedSchedules: [] }

    let hasOccupied = false
    let hasEmpty = false
    const selectedSchedules: Schedule[] = []

    selectedCellKeys.forEach(key => {
      const [staffId, dateStr] = key.split('|')
      const user = metadata.users.find(u => u.user_id === staffId)
      const daySchedules = schedulesByDate[dateStr] || []
      
      const staffSchedule = daySchedules.find(s => 
        user && s.target_users.some(t => t === user.user_id || t === user.name)
      )
      
      if (staffSchedule) {
        hasOccupied = true
        selectedSchedules.push(staffSchedule)
      } else {
        hasEmpty = true
      }
    })

    return { hasOccupied, hasEmpty, selectedSchedules }
  }, [selectedCellKeys, schedulesByDate, metadata.users])

  const handleAssignCategory = async (
    staffId: string, 
    date: Date, 
    category: ScheduleCategory | null,
    existingSchedule?: Schedule
  ) => {
    const user = metadata.users.find(u => u.user_id === staffId)
    const staffName = user?.name || staffId
    const dateStr = format(date, 'yyyy-MM-dd')
    const key = `${staffId}-${dateStr}`
    const cellKey = `${staffId}|${dateStr}`
    setIsUpdating(key)
    
    try {
      if (!category) {
        if (existingSchedule) {
          await deleteSchedule(existingSchedule.id, hosId)
          // 선택 목록에서도 제거 (좌표 기반이므로 키 유지 여부는 정책에 따라 다름)
          // 여기서는 삭제하면 선택에서도 빠지게 처리
          const newSelected = new Set(selectedCellKeys)
          newSelected.delete(cellKey)
          setSelectedCellKeys(newSelected)
          toast.success('일정을 삭제했습니다')
        }
      } else {
        const startTime = new Date(date)
        startTime.setHours(9, 0, 0, 0)
        
        const endTime = new Date(date)
        endTime.setHours(18, 0, 0, 0)

        await upsertSchedule({
          id: existingSchedule?.id,
          hos_id: hosId,
          title: category.name,
          category: category.name,
          color: category.color,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          is_all_day: true,
          target_users: [staffId],
          content: null,
          location: null,
          created_by: loggedInUserId
        })
        toast.success(`${staffName}의 일정을 ${category.name}(으)로 설정했습니다`)
      }
      await refetch()
    } catch (error) {
      console.error(error)
      toast.error('변경 중 오류가 발생했습니다')
    } finally {
      setIsUpdating(null)
    }
  }

  const toggleCellSelection = (staffId: string, dateStr: string) => {
    const key = `${staffId}|${dateStr}`
    const next = new Set(selectedCellKeys)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
    }
    setSelectedCellKeys(next)
  }

  const handleStaffSelection = (staffId: string, checked: boolean) => {
    const next = new Set(selectedCellKeys)
    weekDates.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd')
      const key = `${staffId}|${dateStr}`
      if (checked) next.add(key)
      else next.delete(key)
    })
    setSelectedCellKeys(next)
  }

  const handleBatchCopy = async () => {
    if (selectionInfo.selectedSchedules.length === 0) return
    
    const offsets = copyOffsetDays
      .split(',')
      .map(v => parseInt(v.trim()))
      .filter(v => !isNaN(v))
    
    if (offsets.length === 0) {
      toast.error('올바른 복사일(숫자)을 입력해주세요')
      return
    }

    setIsCopying(true)

    try {
      const copyPromises = offsets.flatMap(offset => 
        selectionInfo.selectedSchedules.map(s => {
          const originalStart = new Date(s.start_time)
          const originalEnd = new Date(s.end_time)
          const newStart = addDays(originalStart, offset)
          const newEnd = addDays(originalEnd, offset)

          return upsertSchedule({
            hos_id: hosId,
            title: s.title,
            category: s.category,
            color: s.color,
            start_time: newStart.toISOString(),
            end_time: newEnd.toISOString(),
            is_all_day: s.is_all_day,
            target_users: s.target_users,
            content: s.content,
            location: s.location,
            created_by: loggedInUserId
          })
        })
      )

      await Promise.all(copyPromises)
      toast.success(`${selectionInfo.selectedSchedules.length}개의 일정을 ${offsets.join(', ')}일 후로 복사했습니다`)
      setSelectedCellKeys(new Set())
      await refetch()
    } catch (error) {
      console.error(error)
      toast.error('복사 중 오류가 발생했습니다')
    } finally {
      setIsCopying(false)
    }
  }

  const handleBatchDelete = async () => {
    if (selectionInfo.selectedSchedules.length === 0) return
    if (!confirm(`${selectionInfo.selectedSchedules.length}개의 일정을 일괄 삭제하시겠습니까?`)) return

    setIsDeleting(true)
    try {
      const deletePromises = selectionInfo.selectedSchedules.map(s => 
        deleteSchedule(s.id, hosId)
      )
      await Promise.all(deletePromises)
      toast.success('선택한 일정들을 모두 삭제했습니다')
      setSelectedCellKeys(new Set())
      await refetch()
    } catch (error) {
      console.error(error)
      toast.error('삭제 중 오류가 발생했습니다')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBatchAssign = async (category: ScheduleCategory) => {
    if (selectedCellKeys.size === 0) return
    setIsAssigning(true)

    try {
      const assignPromises = Array.from(selectedCellKeys).map(key => {
        const [staffId, dateStr] = key.split('|')
        const date = parseISO(dateStr)
        const startTime = new Date(date)
        startTime.setHours(9, 0, 0, 0)
        const endTime = new Date(date)
        endTime.setHours(18, 0, 0, 0)

        return upsertSchedule({
          hos_id: hosId,
          title: category.name,
          category: category.name,
          color: category.color,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          is_all_day: true,
          target_users: [staffId],
          content: null,
          location: null,
          created_by: loggedInUserId
        })
      })

      await Promise.all(assignPromises)
      toast.success(`${selectedCellKeys.size}개의 일정을 ${category.name}(으)로 배정했습니다`)
      setSelectedCellKeys(new Set())
      await refetch()
    } catch (error) {
      console.error(error)
      toast.error('배정 중 오류가 발생했습니다')
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-sm border shadow-sm relative overflow-hidden">
      {/* Selection Action Bar (Floating) */}
      {selectedCellKeys.size > 0 && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-800 text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-6 border border-slate-700">
            <div className="flex items-center gap-2 border-r border-slate-700 pr-4">
              <CheckCircle2 size={16} className={cn(selectionInfo.hasOccupied && selectionInfo.hasEmpty ? "text-amber-400" : "text-emerald-400")} />
              <span className="text-sm font-bold whitespace-nowrap">{selectedCellKeys.size}개 셀 선택됨</span>
            </div>
            
            {selectionInfo.hasOccupied && selectionInfo.hasEmpty ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400">
                  일정이 있는 칸과 없는 칸이 동시에 선택되었습니다. 다시 선택해주세요.
                </span>
              </div>
            ) : selectionInfo.hasEmpty ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-300">일괄 배정:</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 bg-slate-900 border-slate-700 text-white text-xs gap-2">
                      카테고리 선택
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-1 z-[60]" align="center">
                    <div className="grid grid-cols-1 gap-0.5">
                      {scheduleSetting?.schedule_categories?.map((cat) => (
                        <Button
                          key={cat.id}
                          variant="ghost"
                          size="sm"
                          className="justify-start h-8 text-xs font-medium"
                          onClick={() => handleBatchAssign(cat)}
                          disabled={isAssigning}
                        >
                          <div className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-300">복사일:</span>
                  <div className="flex items-center gap-1 bg-slate-900 rounded-md px-2 border border-slate-700 focus-within:border-blue-400">
                    <Input 
                      value={copyOffsetDays}
                      onChange={(e) => setCopyOffsetDays(e.target.value)}
                      placeholder="7, 14, 21"
                      className="w-20 h-7 bg-transparent border-0 text-white text-xs p-0 text-center focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap">일 후</span>
                  </div>
                  <Button 
                    size="sm" 
                    className="h-8 bg-blue-600 hover:bg-blue-500 text-white font-bold gap-1.5 px-3"
                    onClick={handleBatchCopy}
                    disabled={isCopying || isDeleting}
                  >
                    {isCopying ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Copy size={13} />}
                    복사 실행
                  </Button>
                </div>
                <div className="h-4 w-px bg-slate-700 mx-1" />
                <Button 
                  size="sm" 
                  variant="destructive"
                  className="h-8 font-bold gap-1.5 px-3"
                  onClick={handleBatchDelete}
                  disabled={isCopying || isDeleting}
                >
                  {isDeleting ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Trash2 size={13} />}
                  일괄 삭제
                </Button>
              </div>
            )}

            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700"
              onClick={() => setSelectedCellKeys(new Set())}
            >
              <XCircle size={18} />
            </Button>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <div className="flex items-center justify-between p-4 border-b bg-slate-50/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={handleToday}>
              오늘
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-sm font-bold text-slate-700">
            {format(weekStart, 'yyyy년 MM월 dd일')} - {format(weekDates[6], 'MM월 dd일')}
          </span>
        </div>
        <div className="text-[10px] text-slate-500 font-medium italic">
          * 셀을 클릭하여 일정을 할당하고, 체크박스로 멀티 선택 및 복사가 가능합니다.
        </div>
      </div>

      {/* Grid Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse table-fixed min-w-[800px]">
          <thead className="sticky top-0 z-20 bg-slate-50 shadow-sm">
            <tr>
              <th className="w-44 border-b border-r p-3 text-xs font-bold text-slate-600 bg-slate-100/80 sticky left-0 z-30">
                직원명
              </th>
              {weekDates.map((date) => {
                const isToday = isSameDay(date, new Date())
                return (
                  <th 
                    key={date.toISOString()} 
                    className={cn(
                      "border-b p-3 text-xs font-bold text-slate-600",
                      isToday && "bg-blue-50/50 text-blue-600"
                    )}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="uppercase text-[10px] opacity-70">
                        {format(date, 'EEE', { locale: ko })}
                      </span>
                      <span className="text-sm">{format(date, 'd')}</span>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {metadata.users.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-sm text-slate-400">
                  등록된 직원이 없습니다.
                </td>
              </tr>
            ) : (
              metadata.users.map((user) => {
                // 이 직원의 이번 주 모든 셀 선택 여부 확인
                const staffWeeklyCellKeys = weekDates.map(d => `${user.user_id}|${format(d, 'yyyy-MM-dd')}`)
                const isAllSelected = staffWeeklyCellKeys.every(key => selectedCellKeys.has(key))

                return (
                  <tr key={user.user_id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="border-b border-r p-3 text-xs font-bold text-slate-700 bg-white sticky left-0 z-10 group-hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={isAllSelected}
                          onCheckedChange={(checked) => handleStaffSelection(user.user_id, !!checked)}
                          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                            <UserIcon size={12} />
                          </div>
                          <span className="truncate">{user.name}</span>
                        </div>
                      </div>
                    </td>
                    {weekDates.map((date) => {
                      const dateStr = format(date, 'yyyy-MM-dd')
                      const cellKey = `${user.user_id}|${dateStr}`
                      const daySchedules = schedulesByDate[dateStr] || []
                      const staffSchedule = daySchedules.find(s => 
                        s.target_users.some(t => t === user.user_id || t === user.name)
                      )
                      const isUpdatingCell = isUpdating === `${user.user_id}-${dateStr}`
                      const isSelected = selectedCellKeys.has(cellKey)
                      
                      return (
                        <td key={dateStr} className="border-b p-1 h-16 relative">
                          <div className="absolute top-1 right-1 z-10">
                            <Checkbox 
                              checked={isSelected}
                              onCheckedChange={() => toggleCellSelection(user.user_id, dateStr)}
                              className={cn(
                                "w-3.5 h-3.5 border-slate-300 transition-opacity",
                                !isSelected && !staffSchedule && "opacity-0 group-hover:opacity-100",
                                isSelected && "bg-blue-600 border-blue-600 opacity-100"
                              )}
                            />
                          </div>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                disabled={isUpdatingCell}
                                className={cn(
                                  "w-full h-full rounded-md border-2 border-transparent hover:border-blue-200 hover:bg-white flex items-center justify-center transition-all p-1",
                                  staffSchedule ? "bg-white shadow-sm" : "bg-transparent",
                                  isSelected && "border-blue-400 ring-1 ring-blue-100 bg-blue-50/10",
                                  isUpdatingCell && "opacity-50 animate-pulse border-blue-400"
                                )}
                              >
                                {staffSchedule ? (
                                  <Badge 
                                    style={{ 
                                      backgroundColor: `${staffSchedule.color}20`,
                                      color: staffSchedule.color || '#3b82f6',
                                      borderColor: `${staffSchedule.color}40`
                                    }}
                                    variant="outline"
                                    className="text-[10px] font-bold px-1.5 py-0 border truncate max-w-full"
                                  >
                                    {staffSchedule.category || '기본'}
                                  </Badge>
                                ) : (
                                  <div className="text-slate-200 opacity-0 group-hover:opacity-100">
                                    <span className="text-[10px] font-bold">+ 할당</span>
                                  </div>
                                )}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-1 z-50 pointer-events-auto" align="center">
                              <div className="flex flex-col gap-0.5">
                                <p className="px-2 py-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 mb-1 rounded">
                                  {user.name} - {format(date, 'MM/dd')} 일정
                                </p>
                                <div className="grid grid-cols-1 gap-0.5">
                                  {scheduleSetting?.schedule_categories?.map((cat) => (
                                    <Button
                                      key={cat.id}
                                      variant="ghost"
                                      size="sm"
                                      className="justify-start h-8 text-xs font-medium"
                                      onClick={() => handleAssignCategory(user.user_id, date, cat, staffSchedule)}
                                    >
                                      <div 
                                        className="w-2 h-2 rounded-full mr-2 shrink-0" 
                                        style={{ backgroundColor: cat.color }}
                                      />
                                      {cat.name}
                                    </Button>
                                  ))}
                                  <div className="h-px bg-slate-100 my-1" />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive font-medium"
                                    onClick={() => handleAssignCategory(user.user_id, date, null, staffSchedule)}
                                  >
                                    <Trash2 className="w-3 h-3 mr-2" />
                                    일정 없음
                                  </Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
