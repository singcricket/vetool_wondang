'use server'

import { createClient } from '@/lib/supabase/server'

// 모델별 단가 (USD per 1M tokens, 2025년 6월 기준)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6':          { input: 3.0,  output: 15.0 },
  'claude-opus-4-7':            { input: 15.0, output: 75.0 },
  'claude-haiku-4-5-20251001':  { input: 0.8,  output: 4.0  },
  'claude-haiku-4-5':           { input: 0.8,  output: 4.0  },
}

function calcCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = MODEL_PRICING[model] ?? { input: 3.0, output: 15.0 }
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000
}

export async function logAiUsage({
  hosId,
  feature,
  model,
  inputTokens,
  outputTokens,
}: {
  hosId: string
  feature: string
  model: string
  inputTokens: number
  outputTokens: number
}): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('ai_usage_logs').insert({
      hos_id: hosId,
      created_by: user?.id ?? null,
      feature,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: calcCostUsd(model, inputTokens, outputTokens),
    })
  } catch {
    // 로깅 실패가 주 기능에 영향 주지 않도록 silent fail
  }
}
