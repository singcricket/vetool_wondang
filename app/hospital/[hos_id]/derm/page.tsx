import { redirect } from 'next/navigation'
import { format } from 'date-fns'

export default async function DermPage(props: {
  params: Promise<{ hos_id: string }>
}) {
  const params = await props.params
  redirect(
    `/hospital/${params.hos_id}/derm/${format(new Date(), 'yyyy-MM-dd')}` as any,
  )
}
