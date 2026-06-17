'use server'

import { createClient } from '@/lib/supabase/server'
import type { CytologyChartDetail, CytologyChart, SamplePayload } from '@/types/hospital/cytology-type'

export async function getCytologyChart(chartId: string): Promise<CytologyChartDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cytology_charts')
    .select(`
      *,
      patient:patients(*),
      evaluator:users!cytology_charts_evaluator_id_fkey(user_id, name)
    `)
    .eq('id', chartId)
    .single()

  if (error) {
    console.error('getCytologyChart error:', error.message)
    return null
  }

  if (data.evaluator) {
    (data as any).evaluator = {
      user_id: (data.evaluator as any).user_id,
      name: (data.evaluator as any).name || '',
    }
  }

  return data as unknown as CytologyChartDetail
}

export async function getPatientCytologyCharts(patientId: string): Promise<CytologyChart[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cytology_charts')
    .select('*')
    .eq('patient_id', patientId)
    .order('chart_date', { ascending: false })

  if (error) {
    console.error('getPatientCytologyCharts error:', error.message)
    return []
  }
  return data as unknown as CytologyChart[]
}

export async function updateCytologyChart(
  chartId: string,
  updates: {
    sample_type?: string                                    // comma-separated sample types
    findings?: Record<string, SamplePayload> | null        // multi-sample payload
    ai_findings?: null
    sample_info?: Record<string, unknown> | null
    evaluator_id?: string | null
    vet_id?: string | null
    user_tags?: string | null
  },
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('cytology_charts')
    .update({ ...updates, updated_at: new Date().toISOString() } as any)
    .eq('id', chartId)

  if (error) throw new Error(`차트 저장에 실패했습니다: ${error.message}`)
}

export async function deleteCytologyChart(chartId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('cytology_charts')
    .delete()
    .eq('id', chartId)

  if (error) throw new Error(`차트 삭제에 실패했습니다: ${error.message}`)
}
