import type { Database } from '@/lib/supabase/database.types'

// Supabase type generation이 완료되기 전 임시 타입 정의
// 완료 후에는 Database['public']['Tables']['neuro_charts']['Row'] 로 교체 가능
export interface NeuroChart {
  id: string
  hos_id: string
  patient_id: string
  chart_date: string
  results: Record<string, string | string[]>
  localisations: Record<string, any>
  summary: string | null
  evaluator_id: string | null
  created_at: string
  updated_at: string
}

export type NeuroChartDetail = NeuroChart & {
  patient: Database['public']['Tables']['patients']['Row'] | null
  evaluator: { user_id: string; name: string } | null
}
