'use server'

import { createClient } from '@/lib/supabase/server'
import { getVetoolUserData } from '@/lib/services/auth/authorization'

export type AiUsageSummary = {
  hos_id: string
  hos_name: string
  total_calls: number
  total_input_tokens: number
  total_output_tokens: number
  total_cost_usd: number
  by_feature: { feature: string; calls: number; cost_usd: number }[]
  by_model: { model: string; calls: number; cost_usd: number }[]
}

export type AiUsageLog = {
  id: string
  created_at: string
  hos_id: string
  hos_name: string
  feature: string
  model: string
  input_tokens: number
  output_tokens: number
  cost_usd: number
  user_name: string | null
}

export type AiUsageStats = {
  summaries: AiUsageSummary[]
  logs: AiUsageLog[]
  total_cost_usd: number
  total_calls: number
}

export async function getAiUsageStats(
  fromDate: string,
  toDate: string,
): Promise<AiUsageStats> {
  const vetoolUser = await getVetoolUserData()
  if (!vetoolUser.is_super) throw new Error('권한이 없습니다.')

  const supabase = await createClient()

  const { data: logs, error } = await supabase
    .from('ai_usage_logs')
    .select(`
      id,
      created_at,
      hos_id,
      feature,
      model,
      input_tokens,
      output_tokens,
      cost_usd,
      hospitals:hos_id ( name ),
      users:created_by ( name )
    `)
    .gte('created_at', `${fromDate}T00:00:00`)
    .lte('created_at', `${toDate}T23:59:59`)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const rows = (logs ?? []) as any[]

  // hospital별 집계
  const hosMap = new Map<string, AiUsageSummary>()
  for (const row of rows) {
    if (!hosMap.has(row.hos_id)) {
      hosMap.set(row.hos_id, {
        hos_id: row.hos_id,
        hos_name: row.hospitals?.name ?? row.hos_id,
        total_calls: 0,
        total_input_tokens: 0,
        total_output_tokens: 0,
        total_cost_usd: 0,
        by_feature: [],
        by_model: [],
      })
    }
    const s = hosMap.get(row.hos_id)!
    s.total_calls += 1
    s.total_input_tokens += row.input_tokens
    s.total_output_tokens += row.output_tokens
    s.total_cost_usd += row.cost_usd

    const feat = s.by_feature.find((f) => f.feature === row.feature)
    if (feat) { feat.calls += 1; feat.cost_usd += row.cost_usd }
    else s.by_feature.push({ feature: row.feature, calls: 1, cost_usd: row.cost_usd })

    const mod = s.by_model.find((m) => m.model === row.model)
    if (mod) { mod.calls += 1; mod.cost_usd += row.cost_usd }
    else s.by_model.push({ model: row.model, calls: 1, cost_usd: row.cost_usd })
  }

  const summaries = Array.from(hosMap.values()).sort(
    (a, b) => b.total_cost_usd - a.total_cost_usd,
  )

  const formattedLogs: AiUsageLog[] = rows.map((row) => ({
    id: row.id,
    created_at: row.created_at,
    hos_id: row.hos_id,
    hos_name: row.hospitals?.name ?? row.hos_id,
    feature: row.feature,
    model: row.model,
    input_tokens: row.input_tokens,
    output_tokens: row.output_tokens,
    cost_usd: row.cost_usd,
    user_name: row.users?.name ?? null,
  }))

  return {
    summaries,
    logs: formattedLogs,
    total_cost_usd: summaries.reduce((s, h) => s + h.total_cost_usd, 0),
    total_calls: summaries.reduce((s, h) => s + h.total_calls, 0),
  }
}
