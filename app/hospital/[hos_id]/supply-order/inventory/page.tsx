import { createClient } from '@/lib/supabase/server'
import { getInventoryStatus } from '@/lib/actions/supply-order/inventory-actions'
import InventoryClient from '@/components/hospital/supply-order/inventory/inventory-client'

export default async function SupplyInventoryPage(
  props: PageProps<'/hospital/[hos_id]/supply-order/inventory'>,
) {
  const { hos_id } = await props.params
  const supabase = await createClient()

  const [items, { data: vendorRows }, { data: productRows }] = await Promise.all([
    getInventoryStatus(hos_id),
    supabase
      .from('vendors')
      .select('id, name')
      .eq('hos_id', hos_id)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('item_products')
      .select('id, item_master_id, brand_name, specification, manufacturer')
      .eq('hos_id', hos_id)
      .eq('is_active', true)
      .order('brand_name'),
  ])

  const vendors = (vendorRows ?? []) as { id: string; name: string }[]
  const itemProducts = (productRows ?? []) as {
    id: string
    item_master_id: string | null
    brand_name: string
    specification: string | null
    manufacturer: string | null
  }[]

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b bg-white px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">재고현황</h2>
        <p className="mt-0.5 text-xs text-slate-400">납품 확인 완료된 품목의 현재 재고입니다.</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <InventoryClient hosId={hos_id} items={items} vendors={vendors} itemProducts={itemProducts} />
      </div>
    </div>
  )
}
