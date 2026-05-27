import VendorSidebar from '@/components/hospital/supply-order/order/sidebar/vendor-sidebar'

export default async function OrderLayout(
  props: LayoutProps<'/hospital/[hos_id]/supply-order/order'>,
) {
  const { hos_id } = await props.params

  return (
    <div className="flex h-full">
      <VendorSidebar hosId={hos_id} />

      {/* 데스크탑: 사이드바 너비만큼 margin, 모바일: 없음 */}
      <main className="flex-1 overflow-y-auto 2xl:ml-[200px]">
        {props.children}
      </main>
    </div>
  )
}
