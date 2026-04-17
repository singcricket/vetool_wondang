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
  selectedUserFilter: string[]
  isAdmin: boolean
  refetch: () => Promise<void>
  schedulesByDate: Record<string, Schedule[]>
}

type PendingChange = {
  staffId: string;
  date: Date;
  category: ScheduleCategory | null;
  existingId?: string;
}

export default function ScheduleAuthoringTable({
  hosId,
  loggedInUserId,
  selectedDate,
  setSelectedDate,
  metadata,
  scheduleSetting,
  selectedUserFilter,
  isAdmin,
  refetch,
  schedulesByDate,
}: Props) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null) // staffId-date
  const [selectedCellKeys, setSelectedCellKeys] = useState<Set<string>>(new Set()) // staffId|dateStr
  const [activeEditCell, setActiveEditCell] = useState<{
    staffId: string;
    dateStr: string;
    selectedCategoryId: string | null;
    existingScheduleId?: string;
  } | null>(null)

  const [pendingChanges, setPendingChanges] = useState<Record<string, PendingChange>>({})
  const [isSavingAll, setIsSavingAll] = useState(false)
  
  const [copyOffsetDays, setCopyOffsetDays] = useState<string>('7')
  const [isCopying, setIsCopying] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)

  // 중복 데이터를 찾기 위한 헬퍼 (날짜, 대상자, 제목 기준)
  const findMatchingScheduleId = (dateStr: string, staffId: string, title: string) => {
    const daySchedules = schedulesByDate[dateStr] || []
    const match = daySchedules.find(s => 
      s.title === title && 
      s.target_users.includes(staffId)
    )
    return match?.id
  }

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 }) // Sunday
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const handlePrevWeek = () => setSelectedDate(subDays(selectedDate, 7))
  const handleNextWeek = () => setSelectedDate(addDays(selectedDate, 7))
  const handleToday = () => setSelectedDate(new Date())

  // 필터링된 유저 목록 (개인 선택 + 그룹 매칭)
  const filteredUsers = useMemo(() => {
    // 필터가 없거나 '모두보기' 성격이면 전체 노출
    if (selectedUserFilter.length === 0) return metadata.users

    return metadata.users.filter(user => {
      // 1. 개별 유저 ID가 필터에 포함된 경우
      if (selectedUserFilter.includes(user.user_id)) return true
      
      // 2. 유저의 그룹 중 하나라도 필터에 포함된 경우
      if (user.group?.some(g => selectedUserFilter.includes(g))) return true
      
      // '내가 작성한 글'이나 '미지정' 필터만 있을 경우는 유저 행 노출과는 무관하므로 제외
      return false
    })
  }, [metadata.users, selectedUserFilter])

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

  const handleAssignCategory = (
    staffId: string, 
    date: Date, 
    category: ScheduleCategory | null,
    explicitExistingId?: string
  ) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const cellKey = `${staffId}|${dateStr}`
    
    setPendingChanges(prev => ({
      ...prev,
      [cellKey]: {
        staffId,
        date,
        category,
        existingId: explicitExistingId
      }
    }))
    setActiveEditCell(null)
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

  const handleBatchCopy = () => {
    if (selectionInfo.selectedSchedules.length === 0) return
    
    const offsets = copyOffsetDays
      .split(',')
      .map(v => parseInt(v.trim()))
      .filter(v => !isNaN(v))
    
    if (offsets.length === 0) {
      toast.error('올바른 복사일(숫자)을 입력해주세요')
      return
    }

    const newPending = { ...pendingChanges }

    offsets.forEach(offset => {
      selectionInfo.selectedSchedules.forEach(s => {
        const originalStart = new Date(s.start_time)
        const newDate = addDays(originalStart, offset)
        const newDateStr = format(newDate, 'yyyy-MM-dd')
        const staffId = s.target_users[0]
        const cellKey = `${staffId}|${newDateStr}`
        
        // 대상 카테고리 정보 찾기
        const categoryMatch = scheduleSetting?.schedule_categories?.find(c => c.name === s.category) || null

        // 이미 해당 셀에 예정된 변경이 있으면 덮어씌움
        newPending[cellKey] = {
          staffId,
          date: newDate,
          category: categoryMatch,
          // note: existingId는 saveAll 시점에 findMatchingScheduleId로 찾음
        }
      })
    })

    setPendingChanges(newPending)
    toast.success(`${selectionInfo.selectedSchedules.length}개의 복사할 일정이 변경 대기열에 추가되었습니다.`)
    setSelectedCellKeys(new Set())
  }

  const handleBatchDelete = () => {
    if (selectedCellKeys.size === 0) return

    const newPending = { ...pendingChanges }
    Array.from(selectedCellKeys).forEach(key => {
      const [staffId, dateStr] = key.split('|')
      const date = parseISO(dateStr)
      newPending[key] = {
        staffId,
        date,
        category: null,
      }
    })

    setPendingChanges(newPending)
    toast.success(`${selectedCellKeys.size}개의 삭제할 일정이 변경 대기열에 추가되었습니다.`)
    setSelectedCellKeys(new Set())
  }

  const handleBatchAssign = (category: ScheduleCategory) => {
    if (selectedCellKeys.size === 0) return

    const newPending = { ...pendingChanges }
    Array.from(selectedCellKeys).forEach(key => {
      const [staffId, dateStr] = key.split('|')
      const date = parseISO(dateStr)
      newPending[key] = {
        staffId,
        date,
        category,
      }
    })

    setPendingChanges(newPending)
    toast.success(`${selectedCellKeys.size}개의 일정이 ${category.name}(으)로 변경 대기열에 추가되었습니다.`)
    setSelectedCellKeys(new Set())
  }

  const handleGlobalSave = async () => {
    const changeCount = Object.keys(pendingChanges).length
    if (changeCount === 0) return

    setIsSavingAll(true)
    const toastId = toast.loading(`${changeCount}개의 변경사항을 저장 중...`)

    try {
      const promises = Object.values(pendingChanges).map(async (change) => {
        const dateStr = format(change.date, 'yyyy-MM-dd')
        
        if (!change.category) {
          // 삭제 처리
          // 1. explicit ID가 있으면 사용, 없으면 검색
          const targetId = change.existingId || findMatchingScheduleId(dateStr, change.staffId, '') 
          // Note: Empty title match is tricky, actually we should just find ANY schedule in that cell for deletion
          const cellSchedule = schedulesByDate[dateStr]?.find(s => 
            s.target_users.includes(change.staffId)
          )
          
          if (cellSchedule || change.existingId) {
            await deleteSchedule(change.existingId || cellSchedule!.id, hosId)
          }
        } else {
          // 저장/수정 처리
          const targetId = change.existingId || findMatchingScheduleId(dateStr, change.staffId, change.category.name)
          
          const startTime = new Date(change.date)
          const endTime = new Date(change.date)
          
          const hasCategoryTimes = change.category?.start_time && change.category?.end_time
          
          if (hasCategoryTimes) {
            const [sH, sM] = change.category!.start_time!.split(':').map(Number)
            const [eH, eM] = change.category!.end_time!.split(':').map(Number)
            startTime.setHours(sH, sM, 0, 0)
            endTime.setHours(eH, eM, 0, 0)
          } else {
            startTime.setHours(9, 0, 0, 0)
            endTime.setHours(18, 0, 0, 0)
          }

          await upsertSchedule({
            id: targetId,
            hos_id: hosId,
            title: change.category.name,
            category: change.category.name,
            color: change.category.color,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            is_all_day: !hasCategoryTimes,
            target_users: [change.staffId],
            content: null,
            location: null,
            created_by: loggedInUserId
          })
        }
      })

      // 대량 처리 시 병렬성 조절이 필요할 수 있으나, 일단 Promise.all로 진행
      await Promise.all(promises)
      
      toast.success('모든 변경사항이 성공적으로 저장되었습니다.', { id: toastId })
      setPendingChanges({})
      await refetch()
    } catch (error) {
      console.error(error)
      toast.error('저장 중 일부 오류가 발생했습니다.', { id: toastId })
    } finally {
      setIsSavingAll(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-sm border shadow-sm relative overflow-hidden">
      {/* Pending Changes Action Bar (Floating) */}
      {Object.keys(pendingChanges).length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-blue-600 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-6 border border-white/20">
            <div className="flex items-center gap-2 pr-4 border-r border-white/20">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-blue-600 text-[10px] font-bold">
                {Object.keys(pendingChanges).length}
              </div>
              <span className="text-sm font-bold whitespace-nowrap">변경 사항 저장 대기중</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                className="h-8 bg-white text-blue-600 hover:bg-slate-100 font-bold px-4"
                onClick={handleGlobalSave}
                disabled={isSavingAll}
              >
                {isSavingAll ? (
                  <div className="w-3 h-3 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mr-2" />
                ) : (
                  <CheckCircle2 size={14} className="mr-2" />
                )}
                서버에 저장하기
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-white hover:bg-white/10 font-medium"
                onClick={() => setPendingChanges({})}
                disabled={isSavingAll}
              >
                모두 취소
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Selection Action Bar (Floating) */}
      {selectedCellKeys.size > 0 && !activeEditCell && Object.keys(pendingChanges).length === 0 && (
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
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-sm text-slate-400">
                  필터 조건에 맞는 직원이 없습니다.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                // 이 직원의 이번 주 모든 셀 선택 여부 확인
                const staffWeeklyCellKeys = weekDates.map(d => `${user.user_id}|${format(d, 'yyyy-MM-dd')}`)
                const isAllSelected = staffWeeklyCellKeys.every(key => selectedCellKeys.has(key))

                return (
                  <tr key={user.user_id} className="group hover:bg-slate-50/50 transition-colors">
                    <td 
                      className="border-b border-r p-3 text-xs font-bold text-slate-700 bg-white sticky left-0 z-10 group-hover:bg-slate-50 transition-colors cursor-pointer select-none"
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey) {
                          handleStaffSelection(user.user_id, !isAllSelected)
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
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
                      const rawStaffSchedule = daySchedules.find(s => 
                        s.target_users.some(t => t === user.user_id || t === user.name)
                      )
                      
                      // 관리 전용 필터링: 관리자가 아닐 경우 'admin' 포함된 스케줄은 숨김
                      const isStaffAdminOnly = rawStaffSchedule?.target_users?.includes('admin')
                      const staffSchedule = (!isAdmin && isStaffAdminOnly) ? undefined : rawStaffSchedule
                      
                      // Pending Change 확인
                      const pendingChange = pendingChanges[cellKey]
                      const hasPending = !!pendingChange
                      const displayCategory = hasPending ? pendingChange.category?.name : staffSchedule?.category
                      const displayColor = hasPending ? pendingChange.category?.color : staffSchedule?.color

                      const isUpdatingCell = isUpdating === `${user.user_id}-${dateStr}`
                      const isSelected = selectedCellKeys.has(cellKey)
                      
                      return (
                        <td key={dateStr} className="border-b p-1 h-16 relative">
                          <div className={cn(
                            "absolute inset-1 rounded-md transition-all pointer-events-none z-0",
                            hasPending && "border-2 border-dashed border-blue-400 bg-blue-50/5"
                          )} />
                          <Popover 
                             onOpenChange={(open) => {
                               if (open) {
                                 setActiveEditCell({
                                   staffId: user.user_id,
                                   dateStr: dateStr,
                                   selectedCategoryId: hasPending ? (pendingChange.category?.name || null) : (staffSchedule?.category || null),
                                   existingScheduleId: staffSchedule?.id
                                 })
                               } else {
                                 setActiveEditCell(null)
                               }
                             }}
                           >
                             <PopoverTrigger asChild>
                               <button
                                 disabled={isUpdatingCell || isSavingAll || (!!activeEditCell && activeEditCell.dateStr !== dateStr)}
                                 className={cn(
                                   "w-full h-full rounded-md border-2 border-transparent hover:border-blue-200 hover:bg-white flex flex-col items-center justify-center transition-all p-1 relative z-[1] select-none",
                                   (staffSchedule || hasPending) ? "bg-white shadow-sm" : "bg-transparent",
                                   isSelected && "border-blue-400 ring-1 ring-blue-100 bg-blue-50/10",
                                   isUpdatingCell && "opacity-50 animate-pulse border-blue-400"
                                 )}
                                 onClick={(e) => {
                                   if (e.metaKey || e.ctrlKey) {
                                     e.preventDefault()
                                     e.stopPropagation()
                                     toggleCellSelection(user.user_id, dateStr)
                                   }
                                 }}
                               >
                                 {(staffSchedule || hasPending) ? (
                                   <>
                                     {hasPending && (
                                       <div className="absolute -top-1 -left-1 bg-blue-600 text-white text-[8px] font-bold px-1 rounded-sm shadow-sm z-20">
                                         DRAFT
                                       </div>
                                     )}
                                     {displayCategory ? (
                                       <Badge 
                                         style={{ 
                                           backgroundColor: `${displayColor}20`,
                                           color: displayColor || '#3b82f6',
                                           borderColor: hasPending ? '#3b82f6' : `${displayColor}40`
                                         }}
                                         variant="outline"
                                         className={cn(
                                           "text-[10px] font-bold px-1.5 py-0 border truncate max-w-full",
                                           hasPending && "border-blue-500 border-dashed"
                                         )}
                                       >
                                         {displayCategory}
                                       </Badge>
                                     ) : (
                                       <div className="text-[10px] text-slate-400 italic">삭제 예정</div>
                                     )}
                                   </>
                                 ) : (
                                   <div className="text-slate-200 opacity-0 group-hover:opacity-100">
                                     <span className="text-[10px] font-bold">+ 할당</span>
                                   </div>
                                 )}
                               </button>
                             </PopoverTrigger>
                             <PopoverContent className="w-52 p-1.5 z-50 pointer-events-auto shadow-xl border-slate-200" align="center">
                               <div className="flex flex-col gap-1">
                                 <div className="px-2 py-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 mb-1 rounded flex items-center justify-between">
                                   <span>{user.name} ({format(date, 'MM/dd')})</span>
                                   {(isUpdatingCell || isSavingAll) && <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />}
                                 </div>
                                 <div className="grid grid-cols-1 gap-0.5 max-h-[200px] overflow-y-auto pr-1">
                                   {scheduleSetting?.schedule_categories?.map((cat) => (
                                     <Button
                                       key={cat.id}
                                       variant={activeEditCell?.selectedCategoryId === cat.name ? "secondary" : "ghost"}
                                       size="sm"
                                       className={cn(
                                         "justify-start h-8 text-xs font-medium",
                                         activeEditCell?.selectedCategoryId === cat.name && "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                       )}
                                       onClick={() => handleAssignCategory(user.user_id, date, cat, staffSchedule?.id)}
                                       disabled={isUpdatingCell || isSavingAll}
                                     >
                                       <div 
                                         className="w-2 h-2 rounded-full mr-2 shrink-0" 
                                         style={{ backgroundColor: cat.color }}
                                       />
                                       {cat.name}
                                       {activeEditCell?.selectedCategoryId === cat.name && <CheckCircle2 className="ml-auto w-3 h-3 text-blue-600" />}
                                     </Button>
                                   ))}
                                   <div className="h-px bg-slate-100 my-1" />
                                   <Button
                                     variant={activeEditCell?.selectedCategoryId === null ? "secondary" : "ghost"}
                                     size="sm"
                                     className={cn(
                                        "justify-start h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive font-medium",
                                        activeEditCell?.selectedCategoryId === null && "bg-red-50"
                                     )}
                                     onClick={() => handleAssignCategory(user.user_id, date, null, staffSchedule?.id)}
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
