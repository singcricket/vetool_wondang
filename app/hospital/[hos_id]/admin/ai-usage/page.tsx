import { redirect } from 'next/navigation'
import { getVetoolUserData } from '@/lib/services/auth/authorization'
import { getAiUsageStats } from '@/lib/actions/admin/ai-usage-actions'
import AiUsageClient from '@/components/hospital/admin/ai-usage/ai-usage-client'

export default async function AiUsagePage() {
  const vetoolUser = await getVetoolUserData()
  if (!vetoolUser.is_super) redirect('/')

  const today = new Date()
  const toDate = today.toISOString().slice(0, 10)
  const fromDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)

  const stats = await getAiUsageStats(fromDate, toDate)

  return (
    <div className="max-w-5xl">
      <div className="mb-4 px-4 pt-4">
        <h1 className="text-lg font-semibold text-slate-800">AI 사용량</h1>
        <p className="text-xs text-slate-400">전체 병원의 Claude AI 호출 기록 및 비용 집계</p>
      </div>
      <AiUsageClient
        initialStats={stats}
        initialFromDate={fromDate}
        initialToDate={toDate}
      />
    </div>
  )
}
