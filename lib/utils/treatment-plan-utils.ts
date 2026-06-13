import type { MsMemo } from '@/types/monitoring/monitoring-type'
import type { TreatmentStep } from '@/lib/actions/monitoring/treatment-plan-action'
import type { MemoColor } from '@/types/icu/chart'

export function stepsToMemos(steps: TreatmentStep[]): MsMemo[] {
  return steps.map((step) => {
    const now = new Date().toISOString()
    return {
      id: `${now}-${Math.random().toString(36).substring(2, 9)}`,
      memo: step.memo,
      check: step.description + (step.caution ? `\n⚠️ ${step.caution}` : ''),
      create_timestamp: now,
      color: step.color as MemoColor,
      is_done: false,
      is_realtime_memo: false,
      done_timestamp: null,
      chosen: false,
      has_imgs: false,
      img_url: [],
      schedule: step.schedule ?? undefined,
    }
  })
}
