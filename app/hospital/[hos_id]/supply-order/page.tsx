import { redirect } from 'next/navigation'

export default async function SupplyOrderIndexPage(
  props: PageProps<'/hospital/[hos_id]/supply-order'>,
) {
  const { hos_id } = await props.params
  redirect(`/hospital/${hos_id}/supply-order/order`)
}
