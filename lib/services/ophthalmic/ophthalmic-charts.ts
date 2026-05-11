'use server'

import { createClient } from '@/lib/supabase/server'
import type { OphthalmicChartDetail, OphthalmicChart } from '@/types/hospital/ophthalmic-type'

export async function getOphthalmicChart(chartId: string): Promise<OphthalmicChartDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ophthalmic_charts')
    .select(`
      *,
      patient:patients(*),
      evaluator:users!ophthalmic_charts_evaluator_id_fkey(user_id, name),
      vet:users!ophthalmic_charts_vet_id_fkey(user_id, name)
    `)
    .eq('id', chartId)
    .single()

  if (error) {
    console.error('getOphthalmicChart error detail:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    return null
  }
  
  const parsedData = { ...data }
  if (parsedData.evaluator) {
    parsedData.evaluator = {
      user_id: (parsedData.evaluator as any).user_id,
      name: (parsedData.evaluator as any).name || ''
    }
  }
  if (parsedData.vet) {
    parsedData.vet = {
      user_id: (parsedData.vet as any).user_id,
      name: (parsedData.vet as any).name || ''
    }
  }

  return parsedData as unknown as OphthalmicChartDetail
}

export async function getPatientOphthalmicCharts(patientId: string): Promise<OphthalmicChart[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ophthalmic_charts')
    .select('*')
    .eq('patient_id', patientId)
    .order('chart_date', { ascending: false })

  if (error) {
    console.error('getPatientOphthalmicCharts error:', error)
    return []
  }
  return data as OphthalmicChart[]
}

export async function updateOphthalmicChartResults(
  chartId: string,
  results: Record<string, any>,
  diagnosis: Record<string, any>,
  summary: string | null,
  user_tags: string | null,
  tags: string | null,
  treatment?: any
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ophthalmic_charts')
    .update({
      results,
      diagnosis,
      summary,
      user_tags,
      tags,
      treatment,
      updated_at: new Date().toISOString(),
    })
    .eq('id', chartId)

  if (error) {
    console.error('updateOphthalmicChartResults error:', error)
    throw error
  }
}

export async function createOphthalmicChart(
  hosId: string,
  patientId: string,
  chartDate: string,
  evaluatorId: string | null,
  vetId: string | null = null
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ophthalmic_charts')
    .insert({
      hos_id: hosId,
      patient_id: patientId,
      chart_date: chartDate,
      evaluator_id: evaluatorId,
      vet_id: vetId,
      results: {},
      diagnosis: {},
    })
    .select()
    .single()

  if (error) {
    console.error('createOphthalmicChart error:', error)
    throw error
  }

  return data
}

export async function deleteOphthalmicChart(chartId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ophthalmic_charts')
    .delete()
    .eq('id', chartId)

  if (error) {
    console.error('deleteOphthalmicChart error:', error)
    throw error
  }
}
