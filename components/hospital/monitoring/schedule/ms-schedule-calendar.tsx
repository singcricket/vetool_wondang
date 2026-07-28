'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMonitoringContextData } from '@/providers/monitoring-hos-data-context-provider'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  parseISO,
  isToday,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarDays, CalendarRange } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/utils'
import type { CalendarSession } from '@/lib/services/monitoring/fetch-ms-calendar'

type Props = {
  hosId: string
  targetDate: string
  sessions: CalendarSession[]
}

type ViewMode = 'month' | 'week'
type SessionStatus = '예정' | '진행중' | '종료'

const WEEK_DAYS = ['월', '화', '수', '목', '금', '토', '일']
const MONTH_CHIP_LIMIT = 2

// ── 상태 판별 ──────────────────────────────────────────────────
function getStatus(start: string | null, end: string | null): SessionStatus {
  if (end !== null) return '종료'
  if (start !== null) return '진행중'
  return '예정'
}

// ── 상태별 스타일 ───────────────────────────────────────────────
const STATUS_STYLE: Record<
  SessionStatus,
  { chip: string; name: string; sub: string; badge: string; groupBadge: string; border: string }
> = {
  예정: {
    chip:       'bg-blue-50 hover:bg-blue-100',
    border:     'border-blue-100',
    name:       'text-blue-900',
    sub:        'text-blue-600',
    badge:      'bg-blue-100 text-blue-700',
    groupBadge: 'bg-blue-200 text-blue-800',
  },
  진행중: {
    chip:       'bg-green-50 hover:bg-green-100',
    border:     'border-green-100',
    name:       'text-green-900',
    sub:        'text-green-600',
    badge:      'bg-green-100 text-green-700',
    groupBadge: 'bg-green-200 text-green-800',
  },
  종료: {
    chip:       'bg-gray-50 hover:bg-gray-100',
    border:     'border-gray-200',
    name:       'text-gray-500',
    sub:        'text-gray-400',
    badge:      'bg-gray-100 text-gray-500',
    groupBadge: 'bg-gray-200 text-gray-500',
  },
}

// ── 유틸 ───────────────────────────────────────────────────────
// "2026-04-28 23:50:23.018+00" 처럼 공백 구분자, 짧은 오프셋도 처리
function parseTs(t: string): Date {
  return new Date(t.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'))
}

function fmtTime(t: string | null): string | null {
  if (!t) return null
  try {
    return format(parseTs(t), 'HH:mm')
  } catch {
    return null
  }
}

function calcDuration(start: string, end: string): string {
  try {
    const diffMs = parseTs(end).getTime() - parseTs(start).getTime()
    const total = Math.round(diffMs / 60000)
    if (total <= 0) return ''
    const h = Math.floor(total / 60)
    const m = total % 60
    if (h === 0) return `${m}분`
    if (m === 0) return `${h}시간`
    return `${h}시간 ${m}분`
  } catch {
    return ''
  }
}

function truncate(text: string | null, max: number) {
  if (!text) return ''
  return text.length > max ? text.slice(0, max) + '…' : text
}

// ── 월간 칩 ────────────────────────────────────────────────────
function MonthChip({ session, hosId }: { session: CalendarSession; hosId: string }) {
  const router = useRouter()
  const status = getStatus(session.start_time, session.end_time)
  const s = STATUS_STYLE[status]
  const patientName = session.patient?.name ?? '환자'
  const title = truncate(session.session_title, 8)

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        if (session.due_date)
          router.push(
            `/hospital/${hosId}/monitoring/${session.due_date}/monitoring-session/${session.session_id}/session`,
          )
      }}
      className={cn(
        'flex w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-xs',
        s.chip,
      )}
    >
      <span className={cn('shrink-0 font-medium', s.name)}>{patientName}</span>
      {title && (
        <>
          <span className={s.sub}>·</span>
          <span className={cn('truncate', s.sub)}>{title}</span>
        </>
      )}
    </button>
  )
}

// ── 주간 카드 ──────────────────────────────────────────────────
function WeekCard({ session, hosId }: { session: CalendarSession; hosId: string }) {
  const router = useRouter()
  const status = getStatus(session.start_time, session.end_time)
  const s = STATUS_STYLE[status]
  const patientName = session.patient?.name ?? '환자'
  const title = truncate(session.session_title, 16)
  const startFmt = fmtTime(session.start_time)
  const endFmt = fmtTime(session.end_time)
  const duration =
    session.start_time && session.end_time
      ? calcDuration(session.start_time, session.end_time)
      : null

  return (
    <button
      onClick={() => {
        if (session.due_date)
          router.push(
            `/hospital/${hosId}/monitoring/${session.due_date}/monitoring-session/${session.session_id}/session`,
          )
      }}
      className={cn(
        'flex w-full flex-col gap-1 rounded-md border px-2 py-1.5 text-left',
        s.chip,
        s.border,
      )}
    >
      {/* 상태 뱃지 + 환자명 */}
      <div className="flex items-center gap-1.5">
        <span className={cn('rounded px-1.5 py-px text-[10px] font-semibold', s.badge)}>
          {status}
        </span>
        <span className={cn('text-xs font-semibold', s.name)}>{patientName}</span>
      </div>

      {/* 세션 제목 */}
      {title && <span className={cn('truncate text-[11px]', s.sub)}>{title}</span>}

      {/* 시간 정보 */}
      {(startFmt || endFmt || duration) && (
        <div className={cn('flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]', s.sub)}>
          {startFmt && <span>시작 {startFmt}</span>}
          {endFmt && <span>종료 {endFmt}</span>}
          {duration && <span className="font-medium">({duration})</span>}
        </div>
      )}

      {/* 그룹 뱃지 */}
      {session.session_group.length > 0 && (
        <div className="flex flex-wrap gap-0.5">
          {session.session_group.slice(0, 2).map((g) => (
            <span key={g} className={cn('rounded px-1 py-px text-[10px] font-medium', s.groupBadge)}>
              {g}
            </span>
          ))}
          {session.session_group.length > 2 && (
            <span className={cn('text-[10px]', s.sub)}>+{session.session_group.length - 2}</span>
          )}
        </div>
      )}
    </button>
  )
}

// ── 월간 뷰 ────────────────────────────────────────────────────
function MonthView({
  currentDate,
  sessions,
  hosId,
  onDayClick,
}: {
  currentDate: Date
  sessions: CalendarSession[]
  hosId: string
  onDayClick: (date: Date) => void
}) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 1 }),
      end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
    })
  }, [currentDate])

  const sessionsByDate = useMemo(() => {
    const map: Record<string, CalendarSession[]> = {}
    sessions.forEach((s) => {
      if (!s.due_date) return
      const key = s.due_date.slice(0, 10)
      ;(map[key] ??= []).push(s)
    })
    return map
  }, [sessions])

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-7 border-b">
        {WEEK_DAYS.map((d, i) => (
          <div
            key={d}
            className={cn(
              'py-2 text-center text-xs font-medium text-muted-foreground',
              i === 5 && 'text-blue-500',
              i === 6 && 'text-red-500',
            )}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const key = format(day, 'yyyy-MM-dd')
          const daySessions = sessionsByDate[key] ?? []
          const isCurrentMonth = isSameMonth(day, currentDate)
          const dow = idx % 7 // 0=월 … 5=토 6=일

          return (
            <div
              key={key}
              onClick={() => onDayClick(day)}
              className={cn(
                'min-h-[100px] cursor-pointer border-b border-r p-1.5 hover:bg-muted/50',
                !isCurrentMonth && 'bg-muted/30',
              )}
            >
              <span
                className={cn(
                  'mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                  isToday(day) && 'bg-blue-600 text-white',
                  !isCurrentMonth && !isToday(day) && 'text-muted-foreground',
                  dow === 5 && !isToday(day) && 'text-blue-500',
                  dow === 6 && !isToday(day) && 'text-red-500',
                )}
              >
                {format(day, 'd')}
              </span>

              <div className="flex flex-col gap-0.5">
                {daySessions.slice(0, MONTH_CHIP_LIMIT).map((s) => (
                  <MonthChip key={s.session_id} session={s} hosId={hosId} />
                ))}
                {daySessions.length > MONTH_CHIP_LIMIT && (
                  <span className="pl-1 text-[10px] text-muted-foreground">
                    +{daySessions.length - MONTH_CHIP_LIMIT}개 더
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── 주간 뷰 ────────────────────────────────────────────────────
function WeekView({
  currentDate,
  sessions,
  hosId,
  onDayClick,
}: {
  currentDate: Date
  sessions: CalendarSession[]
  hosId: string
  onDayClick: (date: Date) => void
}) {
  const weekDays = useMemo(() => {
    return eachDayOfInterval({
      start: startOfWeek(currentDate, { weekStartsOn: 1 }),
      end: endOfWeek(currentDate, { weekStartsOn: 1 }),
    })
  }, [currentDate])

  const sessionsByDate = useMemo(() => {
    const map: Record<string, CalendarSession[]> = {}
    sessions.forEach((s) => {
      if (!s.due_date) return
      const key = s.due_date.slice(0, 10)
      ;(map[key] ??= []).push(s)
    })
    return map
  }, [sessions])

  return (
    <div className="grid grid-cols-7 divide-x">
      {weekDays.map((day, i) => {
        const key = format(day, 'yyyy-MM-dd')
        const daySessions = sessionsByDate[key] ?? []

        return (
          <div key={key} className="flex flex-col">
            <button
              onClick={() => onDayClick(day)}
              className={cn(
                'flex flex-col items-center border-b py-2 hover:bg-muted/50',
                isToday(day) && 'bg-blue-50',
              )}
            >
              <span
                className={cn(
                  'text-xs font-medium text-muted-foreground',
                  i === 5 && 'text-blue-500',
                  i === 6 && 'text-red-500',
                )}
              >
                {WEEK_DAYS[i]}
              </span>
              <span
                className={cn(
                  'mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold',
                  isToday(day) && 'bg-blue-600 text-white',
                  !isToday(day) && i === 5 && 'text-blue-500',
                  !isToday(day) && i === 6 && 'text-red-500',
                  !isToday(day) && i < 5 && 'text-foreground',
                )}
              >
                {format(day, 'd')}
              </span>
            </button>

            <div className="flex flex-col gap-1.5 overflow-y-auto p-1.5">
              {daySessions.length === 0 ? (
                <span className="py-2 text-center text-[11px] text-muted-foreground/40">-</span>
              ) : (
                daySessions.map((s) => (
                  <WeekCard key={s.session_id} session={s} hosId={hosId} />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── 메인 컴포넌트 ───────────────────────────────────────────────
export default function MsScheduleCalendar({ hosId, targetDate, sessions }: Props) {
  const router = useRouter()
  const { msContextData: { groupListData } } = useMonitoringContextData()

  const [view, setView] = useState<ViewMode>('month')

  useEffect(() => {
    const saved = localStorage.getItem('ms-calendar-view') as ViewMode | null
    if (saved === 'month' || saved === 'week') setView(saved)
  }, [])

  const [currentDate, setCurrentDate] = useState<Date>(() => {
    try { return parseISO(targetDate) } catch { return new Date() }
  })

  const [selectedGroups, setSelectedGroups] = useState<string[]>([])

  const toggleGroup = useCallback((group: string) => {
    setSelectedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group],
    )
  }, [])

  const filteredSessions = useMemo(() => {
    if (selectedGroups.length === 0) return sessions
    return sessions.filter((s) => s.session_group.some((g) => selectedGroups.includes(g)))
  }, [sessions, selectedGroups])

  const handleViewChange = useCallback((v: ViewMode) => {
    setView(v)
    localStorage.setItem('ms-calendar-view', v)
  }, [])

  const handlePrev = useCallback(() => {
    setCurrentDate((d) => (view === 'month' ? subMonths(d, 1) : subWeeks(d, 1)))
  }, [view])

  const handleNext = useCallback(() => {
    setCurrentDate((d) => (view === 'month' ? addMonths(d, 1) : addWeeks(d, 1)))
  }, [view])

  const handleDayClick = useCallback(
    (date: Date) => {
      router.push(`/hospital/${hosId}/monitoring/${format(date, 'yyyy-MM-dd')}/monitoring-session`)
    },
    [hosId, router],
  )

  const headerLabel =
    view === 'month'
      ? format(currentDate, 'yyyy년 M월', { locale: ko })
      : (() => {
          const ws = startOfWeek(currentDate, { weekStartsOn: 1 })
          const we = endOfWeek(currentDate, { weekStartsOn: 1 })
          return `${format(ws, 'M월 d일', { locale: ko })} – ${format(we, 'M월 d일', { locale: ko })}`
        })()

  return (
    <div className="flex h-[calc(100vh-2.5rem-env(safe-area-inset-bottom))] flex-col">
      {/* 날짜 네비게이션 + 뷰 토글 */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[160px] text-center text-sm font-semibold">{headerLabel}</span>
          <Button variant="ghost" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 rounded-md border p-0.5">
          <Button
            variant={view === 'month' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs"
            onClick={() => handleViewChange('month')}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            월간
          </Button>
          <Button
            variant={view === 'week' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs"
            onClick={() => handleViewChange('week')}
          >
            <CalendarRange className="h-3.5 w-3.5" />
            주간
          </Button>
        </div>
      </div>

      {/* 상태 범례 + 그룹 필터 */}
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2">
        {/* 상태 범례 */}
        <div className="flex items-center gap-2 text-[11px]">
          {(['예정', '진행중', '종료'] as SessionStatus[]).map((st) => (
            <span key={st} className={cn('rounded px-1.5 py-px font-medium', STATUS_STYLE[st].badge)}>
              {st}
            </span>
          ))}
        </div>

        {/* 구분선 */}
        {groupListData.length > 0 && <div className="h-4 w-px bg-border" />}

        {/* 그룹 필터 */}
        {groupListData.length > 0 && (
          <>
            <button
              onClick={() => setSelectedGroups([])}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                selectedGroups.length === 0
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              전체
            </button>
            {groupListData.map((group) => (
              <button
                key={group}
                onClick={() => toggleGroup(group)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  selectedGroups.includes(group)
                    ? 'bg-blue-600 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
              >
                {group}
              </button>
            ))}
          </>
        )}
      </div>

      {/* 달력 본문 */}
      <div className="flex-1 overflow-auto">
        {view === 'month' ? (
          <MonthView
            currentDate={currentDate}
            sessions={filteredSessions}
            hosId={hosId}
            onDayClick={handleDayClick}
          />
        ) : (
          <WeekView
            currentDate={currentDate}
            sessions={filteredSessions}
            hosId={hosId}
            onDayClick={handleDayClick}
          />
        )}
      </div>
    </div>
  )
}
