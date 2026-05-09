'use server'

import { createClient } from '@/lib/supabase/server'
import type { NeuroChartDetail, NeuroChart } from '@/types/hospital/neuro-type'

export async function getNeuroChart(chartId: string): Promise<NeuroChartDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('neuro_charts')
    .select(`
      *,
      patient:patients(*),
      evaluator:users!neuro_charts_evaluator_id_fkey(user_id, name)
    `)
    .eq('id', chartId)
    .single()

  if (error) {
    console.error('getNeuroChart error:', error)
    return null
  }
  
  // Flatten evaluator mapping
  const parsedData = { ...data }
  if (parsedData.evaluator) {
    parsedData.evaluator = {
      user_id: (parsedData.evaluator as any).user_id,
      name: (parsedData.evaluator as any).name || ''
    }
  }

  return parsedData as unknown as NeuroChartDetail
}

export async function getPatientNeuroCharts(patientId: string): Promise<NeuroChart[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('neuro_charts')
    .select('*')
    .eq('patient_id', patientId)
    .order('chart_date', { ascending: false })

  if (error) {
    console.error('getPatientNeuroCharts error:', error)
    return []
  }
  return data as NeuroChart[]
}

export async function updateNeuroChartResults(
  chartId: string,
  results: Record<string, string | string[]>,
  localisations: Record<string, any>,
  summary: string | null
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('neuro_charts')
    .update({
      results,
      localisations,
      summary,
      updated_at: new Date().toISOString(),
    })
    .eq('id', chartId)

  if (error) {
    console.error('updateNeuroChartResults error:', error)
    throw error
  }
}

export async function createNeuroChart(
  hosId: string,
  patientId: string,
  chartDate: string,
  evaluatorId: string | null
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('neuro_charts')
    .insert({
      hos_id: hosId,
      patient_id: patientId,
      chart_date: chartDate,
      evaluator_id: evaluatorId,
      results: {},
      localisations: {},
    })
    .select()
    .single()

  if (error) {
    console.error('createNeuroChart error:', error)
    throw error
  }

  return data
}

export async function deleteNeuroChart(chartId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('neuro_charts')
    .delete()
    .eq('id', chartId)

  if (error) {
    console.error('deleteNeuroChart error:', error)
    throw error
  }
}
