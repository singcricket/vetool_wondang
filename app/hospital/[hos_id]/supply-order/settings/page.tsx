import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getVendors } from '@/lib/actions/supply-order/vendor-actions'
import { getItemMasters } from '@/lib/actions/supply-order/item-master-actions'
import { getItemProducts } from '@/lib/actions/supply-order/item-product-actions'
import VendorSection from '@/components/hospital/supply-order/settings/vendor/vendor-section'
import ItemMasterSection from '@/components/hospital/supply-order/settings/item-master/item-master-section'
import ItemProductSection from '@/components/hospital/supply-order/settings/item-product/item-product-section'

export default async function SupplySettingsPage(
  props: PageProps<'/hospital/[hos_id]/supply-order/settings'>,
) {
  const { hos_id } = await props.params

  const [vendors, itemMasters, itemProducts] = await Promise.all([
    getVendors(hos_id),
    getItemMasters(hos_id),
    getItemProducts(hos_id),
  ])

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b bg-white px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">설정</h2>
        <p className="mt-0.5 text-xs text-slate-400">업체, 품목 마스터, 제품 정보를 관리합니다.</p>
      </div>

      <Tabs defaultValue="vendor" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="shrink-0 rounded-none border-b bg-white px-4 justify-start h-10">
          <TabsTrigger value="vendor" className="text-xs">
            업체
            {vendors.length > 0 && (
              <span className="ml-1 text-[10px] text-slate-400">
                {vendors.filter((v) => v.is_active).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="item-master" className="text-xs">
            품목 마스터
            {itemMasters.length > 0 && (
              <span className="ml-1 text-[10px] text-slate-400">
                {itemMasters.filter((i) => i.is_active).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="item-product" className="text-xs">
            제품
            {itemProducts.length > 0 && (
              <span className="ml-1 text-[10px] text-slate-400">
                {itemProducts.filter((p) => p.is_active).length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="vendor" className="m-0">
            <VendorSection hosId={hos_id} vendors={vendors} />
          </TabsContent>
          <TabsContent value="item-master" className="m-0">
            <ItemMasterSection
              hosId={hos_id}
              items={itemMasters}
              vendors={vendors.filter((v) => v.is_active).map((v) => ({ id: v.id, name: v.name }))}
            />
          </TabsContent>
          <TabsContent value="item-product" className="m-0">
            <ItemProductSection
              hosId={hos_id}
              products={itemProducts}
              itemMasters={itemMasters}
              vendors={vendors.filter((v) => v.is_active).map((v) => ({ id: v.id, name: v.name }))}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
