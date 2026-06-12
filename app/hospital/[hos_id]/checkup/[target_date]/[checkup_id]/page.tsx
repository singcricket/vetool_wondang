export const maxDuration = 300

import { fetchCheckupDetail } from '@/lib/services/checkup/fetch-checkup'
import CheckupCaseClient from '@/components/hospital/checkup/checkup-case/checkup-case-client'
import { notFound } from 'next/navigation'

export default async function CheckupDetailPage(props: {
  params: Promise<{ hos_id: string; target_date: string; checkup_id: string }>
}) {
  const { hos_id, checkup_id } = await props.params

  let detail
  try {
    detail = await fetchCheckupDetail(checkup_id)
  } catch {
    notFound()
  }

  return <CheckupCaseClient detail={detail} hosId={hos_id} />
}
