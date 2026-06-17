import type { Database } from '@/lib/supabase/database.types'
import type { CytologySampleType, CytologyMode } from '@/constants/hospital/cytology/cytology-types'

// Per-sample payload stored inside the findings JSONB column
export interface SamplePayload {
  findings: Record<string, string | string[]>
  summary: string | null       // clinical impression for this sample
  mode: CytologyMode
  diagnosis: Record<string, unknown> | null
}

// Matches actual cytology_charts table columns
// findings is now Record<CytologySampleType, SamplePayload> (multi-sample)
// sample_type is comma-separated list of active sample types e.g. "otic,fecal"
export interface CytologyChart {
  id: string
  hos_id: string
  patient_id: string
  chart_date: string
  sample_type: string           // comma-separated, e.g. "otic" or "otic,fecal"
  mode: CytologyMode            // deprecated — mode is now per-sample in findings
  findings: Record<string, SamplePayload> | null   // keyed by CytologySampleType
  ai_findings: Record<string, string | string[]> | null  // deprecated
  ai_raw: Record<string, unknown> | null
  diagnosis: Record<string, unknown> | null        // deprecated — diagnosis is per-sample
  summary: string | null        // deprecated — summary is per-sample
  sample_info: Record<string, unknown> | null      // { imageUrls, stain, ... }
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

// Helper: parse sample_type string into array
export function parseSampleTypes(sampleType: string | null): CytologySampleType[] {
  if (!sampleType) return ['otic']
  return sampleType.split(',').map((s) => s.trim()).filter(Boolean) as CytologySampleType[]
}
