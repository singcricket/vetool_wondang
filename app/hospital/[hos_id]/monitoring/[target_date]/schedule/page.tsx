import MsScheduleCalendar from '@/components/hospital/monitoring/schedule/ms-schedule-calendar'
import { fetchCalendarSessions } from '@/lib/services/monitoring/fetch-ms-calendar'

export default async function SchedulePage(props: {
  params: Promise<{ hos_id: string; target_date: string }>
}) {
  const { hos_id, target_date } = await props.params
  const sessions = await fetchCalendarSessions(hos_id)

  return (
    <MsScheduleCalendar hosId={hos_id} targetDate={target_date} sessions={sessions} />
  )
}
