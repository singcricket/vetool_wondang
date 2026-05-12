import type { Database } from '@/lib/supabase/database.types'
import type { CytologySampleType, CytologyMode } from '@/constants/hospital/cytology/cytology-types'

// Matches actual cytology_charts table columns
export interface CytologyChart {
  id: string
  hos_id: string
  patient_id: string
  chart_date: string
  sample_type: CytologySampleType
  mode: CytologyMode
  findings: Record<string, string | string[]> | null
  ai_findings: Record<string, string | string[]> | null
  ai_raw: Record<string, unknown> | null  // raw AI response JSON
  // diagnosis stores { activeSigns, topDiagnoses } as JSON
  diagnosis: Record<string, unknown> | null
  summary: string | null            // human-readable diagnosis summary text
  sample_info: Record<string, unknown> | null  // { imageUrls, stain, ... }
  tags: string | null
  user_tags: string | null
  evaluator_id: string | null
  vet_id: string | null
  created_at: string | null
  updated_at: string | null
}

export type CytologyChartDetail = CytologyChart & {
  patient: Database['public']['Tables']['patients']['Row'] | null
  evaluator: { user_id: string; name: string } | null
}
