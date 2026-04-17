'use client'

import { format } from 'date-fns'
import { MapPin, Tag, User, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Schedule } from '@/types/hospital/schedule'
import UpsertScheduleDialog from './upsert-schedule-dialog'
import { HospitalMetadata } from '../todo/todo'
import { deleteSchedule } from '@/lib/services/hospital-home/schedule'
import { toast } from 'sonner'
import { useState } from 'react'

type Props = {
  schedule: Schedule
  hosId: string
  refetch: () => Promise<void>
  metadata?: HospitalMetadata
}

export default function SingleSchedule({
  schedule,
  hosId,
  refetch,
  metadata,
}: Props) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('정말로 이 일정을 삭제하시겠습니까?')) return
    setIsDeleting(true)
    try {
      await deleteSchedule(schedule.id, hosId)
      toast.success('일정이 삭제되었습니다')
      await refetch()
    } catch (error) {
      console.error(error)
      toast.error('삭제에 실패했습니다')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="group relative border-l-4 p-3 rounded-r-md bg-white hover:bg-slate-50 border border-slate-100 transition-all shadow-sm">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 space-y-2 min-w-0">
          {/* 1. 대상자 (가장 윗줄) */}
          {((schedule.target_users && schedule.target_users.length > 0) ||
            schedule.category) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {schedule.target_users &&
                schedule.target_users.map((user) => (
                  <Badge
                    key={user}
                    className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-white rounded-sm"
                  >
                    <User className="h-2.5 w-2.5 mr-1" />
                    {metadata?.users.find((u) => u.user_id === user)?.name ||
                      user}
                  </Badge>
                ))}
              {schedule.category && (
                <Badge
                  variant="outline"
                  className="px-1.5 py-0.5 text-[10px] border-slate-200 text-slate-600 font-semibold bg-slate-50 rounded-sm"
                >
                  <Tag className="h-2.5 w-2.5 mr-1" />
                  {schedule.category}
                </Badge>
              )}
            </div>
          )}

          {/* 2. 타이틀 (중간줄) */}
          <h4 className="font-extrabold text-[15px] text-slate-900 break-all leading-snug">
            {schedule.title}
          </h4>

          {/* 3. 시간 및 장소 (하단) */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-500">
            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
              {schedule.is_all_day ? (
                <span>종일</span>
              ) : (
                <span>
                  {format(new Date(schedule.start_time), 'HH:mm')} -{' '}
                  {format(new Date(schedule.end_time), 'HH:mm')}
                </span>
              )}
            </div>
            {schedule.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {schedule.location}
              </div>
            )}
          </div>

          {schedule.content && (
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 whitespace-pre-wrap pl-1 border-l-2 border-slate-100">
              {schedule.content}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <UpsertScheduleDialog
            schedule={schedule}
            hosId={hosId}
            refetch={refetch}
            isEdit
            metadata={metadata}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      
      {/* 컬러 바 */}
      <div 
        className="absolute left-[-4px] top-0 bottom-0 w-1 rounded-l-md" 
        style={{ backgroundColor: schedule.color || '#3b82f6' }}
      />
    </div>
  )
}
