import { notFound } from 'next/navigation'
import { getDeliveryById } from '@/lib/actions/supply-order/delivery-actions'
import { getDeliveryItems } from '@/lib/actions/supply-order/delivery-items-actions'
import { getOrderById } from '@/lib/actions/supply-order/order-actions'
import { getItemProducts } from '@/lib/actions/supply-order/item-product-actions'
import DeliveryDetailClient from '@/components/hospital/supply-order/order/delivery-detail/delivery-detail-client'

interface Props {
  params: Promise<{
    hos_id: string
    vendor_id: string
    order_id: string
    delivery_id: string
  }>
}

export default async function DeliveryDetailPage({ params }: Props) {
  const { hos_id, order_id, delivery_id } = await params

  const [delivery, deliveryItems, order, itemProducts] = await Promise.all([
    getDeliveryById(hos_id, delivery_id),
    getDeliveryItems(hos_id, delivery_id),
    getOrderById(hos_id, order_id),
    getItemProducts(hos_id),
  ])

  if (!delivery || !order) notFound()

  return (
    <DeliveryDetailClient
      hosId={hos_id}
      order={order}
      delivery={delivery}
      deliveryItems={deliveryItems}
      itemProducts={itemProducts}
    />
  )
}
