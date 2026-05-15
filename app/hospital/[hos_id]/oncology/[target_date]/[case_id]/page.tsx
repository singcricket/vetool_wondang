import { fetchOncologyCaseDetail } from '@/lib/services/oncology/fetch-oncology-case'
import OncologyCaseClient from '@/components/hospital/oncology/oncology-case/oncology-case-client'
import { notFound } from 'next/navigation'

export default async function OncologyCasePage(props: {
  params: Promise<{ hos_id: string; target_date: string; case_id: string }>
}) {
  const { hos_id, case_id } = await props.params

  let detail
  try {
    detail = await fetchOncologyCaseDetail(case_id)
  } catch {
    notFound()
  }

  return <OncologyCaseClient detail={detail} hosId={hos_id} />
}
