import SupplyOrderFooterNav from '@/components/hospital/supply-order/footer/supply-order-footer-nav'

export default async function SupplyOrderLayout(
  props: LayoutProps<'/hospital/[hos_id]/supply-order'>,
) {
  const { hos_id } = await props.params

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col 2xl:h-screen">
      <main className="flex-1 overflow-y-auto pb-14">
        {props.children}
      </main>
      <SupplyOrderFooterNav hosId={hos_id} />
    </div>
  )
}
