import { redirect } from 'next/navigation'
import { format } from 'date-fns'

export default async function UltrasoundPage(props: {
  params: Promise<{ hos_id: string }>
}) {
  const params = await props.params

  redirect(
    `/hospital/${params.hos_id}/ultrasound/${format(new Date(), 'yyyy-MM-dd')}`,
  )
}
