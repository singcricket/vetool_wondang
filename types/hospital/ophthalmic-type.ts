import type { Database } from '@/lib/supabase/database.types'

export type OphthalmicChart = Database['public']['Tables']['ophthalmic_charts']['Row']

export type OphthalmicChartDetail = OphthalmicChart & {
  patient: Database['public']['Tables']['patients']['Row'] | null
  evaluator: { user_id: string; name: string } | null
  vet?: { user_id: string; name: string } | null
}

export interface OphthalmicSignResult {
  activeSigns: string[]
  diagnoses: any[]
  criticalFindings: string[]
  visionStatus: {
    od: 'visual' | 'impaired' | 'blind'
    os: 'visual' | 'impaired' | 'blind'
  }
}
