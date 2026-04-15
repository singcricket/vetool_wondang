import { redirect } from 'next/navigation'
import { format } from 'date-fns'

export default async function DentalPage(props: {
  params: Promise<{ hos_id: string }>
}) {
  const params = await props.params

  // 치과 차트는 프리미엄 검사 제외
  redirect(
    `/hospital/${params.hos_id}/dental/${format(new Date(), 'yyyy-MM-dd')}`,
  )
}
