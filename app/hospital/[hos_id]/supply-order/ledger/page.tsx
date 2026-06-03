import { getLedgerProducts } from '@/lib/actions/supply-order/ledger-actions'
import LedgerClient from '@/components/hospital/supply-order/ledger/ledger-client'

export default async function LedgerPage(
  props: PageProps<'/hospital/[hos_id]/supply-order/ledger'>,
) {
  const { hos_id } = await props.params

  // 기본 조회 기간: 이번 달
  const now = new Date()
  const fromDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const toDate = now.toISOString().split('T')[0]

  const products = await getLedgerProducts(hos_id, fromDate, toDate)

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b bg-white px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">수불대장</h2>
        <p className="mt-0.5 text-xs text-slate-400">인체용 의약품 출납 기록 (동물용 의약품등 취급규칙 별지 제16호의2서식)</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <LedgerClient
          hosId={hos_id}
          initialProducts={products}
          initialFromDate={fromDate}
          initialToDate={toDate}
        />
      </div>
    </div>
  )
}
