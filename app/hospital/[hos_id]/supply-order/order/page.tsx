import { Building2 } from 'lucide-react'

export default function SupplyOrderPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
      <Building2 size={36} strokeWidth={1.2} />
      <p className="text-sm">왼쪽에서 업체를 선택하세요</p>
      <p className="text-xs text-slate-300">업체별 주문서 작성 및 입고 관리</p>
    </div>
  )
}
