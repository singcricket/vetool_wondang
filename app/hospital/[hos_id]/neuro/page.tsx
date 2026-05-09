import { redirect } from 'next/navigation'
import { format } from 'date-fns'

export default async function NeuroPage(props: {
  params: Promise<{ hos_id: string }>
}) {
  const params = await props.params

  redirect(
    `/hospital/${params.hos_id}/neuro/${format(new Date(), 'yyyy-MM-dd')}`,
  )
}
