import { getOrdersByVendor } from '@/lib/actions/supply-order/order-actions'
import { getVendors } from '@/lib/actions/supply-order/vendor-actions'
import { getItemMasters } from '@/lib/actions/supply-order/item-master-actions'
import { notFound } from 'next/navigation'
import VendorOrderClient from '@/components/hospital/supply-order/order/vendor-page/vendor-order-client'

export default async function VendorOrderPage(
  props: PageProps<'/hospital/[hos_id]/supply-order/order/[vendor_id]'>,
) {
  const { hos_id, vendor_id } = await props.params

  const [vendors, orders, itemMasters] = await Promise.all([
    getVendors(hos_id),
    getOrdersByVendor(hos_id, vendor_id),
    getItemMasters(hos_id),
  ])

  const vendor = vendors.find((v) => v.id === vendor_id)
  if (!vendor) notFound()

  return (
    <VendorOrderClient
      hosId={hos_id}
      vendor={vendor}
      orders={orders}
      itemMasters={itemMasters}
    />
  )
}
