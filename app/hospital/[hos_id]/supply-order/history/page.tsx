import { getOrdersByDateRange } from '@/lib/actions/supply-order/order-actions'
import HistoryClient from '@/components/hospital/supply-order/history/history-client'

export default async function SupplyHistoryPage(
  props: PageProps<'/hospital/[hos_id]/supply-order/history'>,
) {
  const { hos_id } = await props.params

  const today = new Date().toLocaleDateString('sv-SE')
  const orders = await getOrdersByDateRange(hos_id, today, today)

  return (
    <HistoryClient
      hosId={hos_id}
      initialOrders={orders}
      initialStart={today}
      initialEnd={today}
    />
  )
}
