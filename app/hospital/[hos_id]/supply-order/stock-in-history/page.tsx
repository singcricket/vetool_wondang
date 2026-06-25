import { getStockInLogsByDateRange } from '@/lib/actions/supply-order/inventory-actions'
import { getVendors } from '@/lib/actions/supply-order/vendor-actions'
import StockInHistoryClient from '@/components/hospital/supply-order/stock-in-history/stock-in-history-client'

export default async function StockInHistoryPage(
  props: PageProps<'/hospital/[hos_id]/supply-order/stock-in-history'>,
) {
  const { hos_id } = await props.params

  const today = new Date().toLocaleDateString('sv-SE')
  const [logs, vendors] = await Promise.all([
    getStockInLogsByDateRange(hos_id, today, today),
    getVendors(hos_id),
  ])

  return (
    <StockInHistoryClient
      hosId={hos_id}
      initialLogs={logs}
      initialStart={today}
      initialEnd={today}
      vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
    />
  )
}
