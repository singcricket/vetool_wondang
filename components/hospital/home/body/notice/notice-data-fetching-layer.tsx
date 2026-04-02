import { getNotices } from '@/lib/services/hospital-home/notice'
import { fetchHospitalMetadata } from '@/lib/services/hospital-home/todo'
import DragAndDropNoticeList from './drag-and-drop-notice-list'

export default async function NoticeDataFetchingLayer({
  hosId,
}: {
  hosId: string
}) {
  const [noticesData, metadata] = await Promise.all([
    getNotices(hosId),
    fetchHospitalMetadata(hosId),
  ])

  return (
    <DragAndDropNoticeList
      hosId={hosId}
      noticesData={noticesData}
      metadata={metadata}
    />
  )
}
