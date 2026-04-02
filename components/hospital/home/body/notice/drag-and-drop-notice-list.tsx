'use client'

import NoResult from '@/components/common/no-result'
import { reorderNotices } from '@/lib/services/hospital-home/notice'
import type { NoticeWithUser } from '@/types/hospital/notice'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ReactSortable, Sortable } from 'react-sortablejs'
import { HospitalMetadata } from '../todo/todo'
import SingleNotice from './single-notice'

export default function DragAndDropNoticeList({
  noticesData,
  hosId,
  metadata,
  onRefresh,
}: {
  noticesData: NoticeWithUser[]
  hosId: string
  metadata: HospitalMetadata
  onRefresh?: () => void
}) {
  const [sortableNotice, setSortableNotice] = useState(noticesData)
  const { refresh } = useRouter()

  useEffect(() => {
    setSortableNotice(noticesData)
  }, [noticesData])

  const handleReorder = (event: Sortable.SortableEvent) => {
    const noticeIds = noticesData.map((notice) => notice.id)
    const item = noticeIds.splice(event.oldIndex as number, 1)[0]
    noticeIds.splice(event.newIndex as number, 0, item)
    reorderNotices(noticeIds)
    if (onRefresh) {
      onRefresh()
    } else {
      refresh()
    }
  }

  return (
    <div className="relative">
      {noticesData.length === 0 ? (
        <NoResult title="공지사항이 없습니다" className="h-[calc(35vh)]" />
      ) : (
        <ReactSortable
          list={sortableNotice}
          setList={setSortableNotice}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          animation={250}
          handle=".handle"
          onEnd={handleReorder}
        >
          {sortableNotice.map((notice) => (
            <SingleNotice
              hosId={hosId}
              notice={notice}
              metadata={metadata}
              key={notice.id}
              onRefresh={onRefresh}
            />
          ))}
        </ReactSortable>
      )}
    </div>
  )
}
