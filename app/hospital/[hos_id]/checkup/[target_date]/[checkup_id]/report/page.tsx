import { fetchCheckupReportAdmin } from '@/lib/services/checkup/fetch-checkup-report'
import CheckupReport from '@/components/hospital/checkup/checkup-report/checkup-report'
import { notFound } from 'next/navigation'

export default async function CheckupReportPage(props: {
  params: Promise<{ checkup_id: string }>
}) {
  const { checkup_id } = await props.params

  try {
    const data = await fetchCheckupReportAdmin(checkup_id)
    return <CheckupReport data={data} />
  } catch {
    notFound()
  }
}
