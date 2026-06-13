import type { Database } from '@/lib/supabase/database.types'

export type UltrasoundChart = Database['public']['Tables']['ultrasound_charts']['Row']
export type UltrasoundChartUpdate = Database['public']['Tables']['ultrasound_charts']['Update']
export type UltrasoundChartOrgan = Database['public']['Tables']['ultrasound_chart_organs']['Row']

export type UltrasoundChartDetail = UltrasoundChart & {
  patient: Database['public']['Tables']['patients']['Row'] | null
  evaluator: { user_id: string; name: string } | null
  vet: { user_id: string; name: string } | null
}
