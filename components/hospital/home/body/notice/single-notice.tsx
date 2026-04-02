'use client'

import UserAvatar from '@/components/hospital/common/user-avatar'
import { Badge } from '@/components/ui/badge'
import { parseTextWithUrls } from '@/lib/utils/utils'
import { HospitalMetadata } from '../todo/todo'
import {
  type NoticeColorType,
  type NoticeWithUser,
} from '@/types/hospital/notice'
import { GripVertical } from 'lucide-react'
import UpsertNoticeDialog from './upsert-notice-dialog'
import { format } from 'date-fns'
import { cn } from '@/lib/utils/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { updateNotice } from '@/lib/services/hospital-home/notice'
import { useRouter } from 'next/navigation'

type SingleNoticeProps = {
  hosId: string
  notice: NoticeWithUser
  metadata: HospitalMetadata
  onRefresh?: () => void
}

export default function SingleNotice({
  hosId,
  notice,
  metadata,
  onRefresh,
}: SingleNoticeProps) {
  const { refresh } = useRouter()
  const textParts = parseTextWithUrls(notice.notice_text)

  const targetDateObj = notice.target_date as {
    start: string
    end: string | null
  } | null
  const startDate = targetDateObj?.start ? new Date(targetDateObj.start) : null
  const endDate = targetDateObj?.end ? new Date(targetDateObj.end) : null
  const isDone = (targetDateObj as any)?.is_done ?? false

  const handleToggleDone = async () => {
    const newIsDone = !isDone
    const newEndDate = newIsDone && !endDate ? new Date() : endDate

    await updateNotice(
      notice.id,
      notice.notice_text,
      notice.notice_color as NoticeColorType,
      startDate!,
      newEndDate,
      notice.target_user,
      newIsDone,
    )
    if (onRefresh) {
      onRefresh()
    } else {
      refresh()
    }
  }

  return (
    <div
      className={cn(
        'group relative flex flex-col p-5 w-[310px] h-[310px] transition-all duration-300 transform',
        'shadow-[2px_2px_5px_rgba(0,0,0,0.1)] hover:shadow-[5px_5px_15px_rgba(0,0,0,0.15)] hover:-translate-y-1',
        isDone ? 'opacity-60 grayscale-[0.3]' : 'rotate-[0.3deg] hover:rotate-0',
      )}
      style={{
        backgroundColor: notice.notice_color || '#ffffff',
        borderBottomRightRadius: '30px 10px',
      }}
    >
      {/* 전면 상단 드래그 핸들 (넓은 영역) */}
      <div className="handle absolute top-0 left-0 right-0 h-4 cursor-grab active:cursor-grabbing bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-1.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-black/10" />
          ))}
        </div>
      </div>

      {/* 1. 상단에 시작, 종료일 및 대상자 노출 */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <Checkbox
          checked={isDone}
          onCheckedChange={handleToggleDone}
          className="mr-1 h-4 w-4 border-black/20 data-[state=checked]:bg-slate-700 data-[state=checked]:border-slate-700"
        />
        {startDate && (
          <Badge
            variant="outline"
            className="h-5 rounded-sm border-black/10 bg-black/5 px-1.5 text-[10px] font-medium text-slate-700"
          >
            시작: {format(startDate, 'yy.MM.dd')}
          </Badge>
        )}
        <Badge
          variant="outline"
          className="h-5 rounded-sm border-black/10 bg-black/5 px-1.5 text-[10px] font-medium text-slate-700"
        >
          종료: {endDate ? format(endDate, 'yy.MM.dd') : '완료시까지'}
        </Badge>
        {notice.target_user && (
          <Badge
            variant="secondary"
            className="h-5 rounded-sm bg-black/10 px-1.5 text-[10px] font-bold text-slate-800"
          >
            @{notice.target_user}
          </Badge>
        )}
      </div>

      {/* 2. Body에 내용 노출 (줄바꿈 적용 및 스크롤) */}
      <div className="flex-1 overflow-y-auto pr-2 break-words whitespace-pre-wrap text-[13.5px] font-medium leading-relaxed tracking-tight text-slate-800 scrollbar-thin scrollbar-thumb-black/5 scrollbar-track-transparent">
        {textParts.map((part: any, index: number) =>
          part.type === 'url' ? (
            <a
              key={index}
              href={part.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {part.content}
            </a>
          ) : (
            part.content
          ),
        )}
      </div>

      {/* 하단: 작성자 정보 및 관리 도구 */}
      <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-2">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 shrink-0 overflow-hidden rounded-full ring-1 ring-black/5">
            <UserAvatar
              src={notice.user_id.avatar_url}
              alt={notice.user_id.name}
            />
          </div>
          <span className="text-[10px] font-bold text-slate-500">
            {notice.user_id.name}
          </span>
          {isDone && (
            <span className="text-[10px] font-medium text-slate-400">
              (완료)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <UpsertNoticeDialog
            hosId={hosId}
            isEdit
            oldNoticeId={notice.id}
            oldNoticeText={notice.notice_text}
            oldNoticeColor={notice.notice_color as NoticeColorType}
            oldStartDate={startDate}
            oldEndDate={endDate}
            oldIsDone={isDone}
            oldTargetUser={notice.target_user}
            metadata={metadata}
            onSubmitSuccess={onRefresh}
          />
        </div>
      </div>

      {/* Post-it folded corner effect */}
      <div className="absolute bottom-0 right-0 h-4 w-4 rounded-tl-sm bg-black/5 shadow-inner" />
    </div>
  )
}
