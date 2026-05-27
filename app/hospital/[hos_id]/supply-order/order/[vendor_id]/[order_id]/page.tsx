import { notFound } from 'next/navigation'
import { getOrderById } from '@/lib/actions/supply-order/order-actions'
import { getDeliveriesByOrder } from '@/lib/actions/supply-order/delivery-actions'
import OrderDetailClient from '@/components/hospital/supply-order/order/order-detail/order-detail-client'

interface Props {
  params: Promise<{ hos_id: string; vendor_id: string; order_id: string }>
}

export default async function OrderDetailPage({ params }: Props) {
  const { hos_id, order_id } = await params

  const [order, deliveries] = await Promise.all([
    getOrderById(hos_id, order_id),
    getDeliveriesByOrder(hos_id, order_id),
  ])

  if (!order) notFound()

  return <OrderDetailClient hosId={hos_id} order={order} deliveries={deliveries} />
}
