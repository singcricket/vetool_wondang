'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

type UltrasoundChartUpdate = Database['public']['Tables']['ultrasound_charts']['Update']
type UltrasoundChartOrganInsert = Database['public']['Tables']['ultrasound_chart_organs']['Insert']

export async function getUltrasoundChart(chartId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ultrasound_charts')
    .select(`
      *,
      patient:patients(*),
      evaluator:users!ultrasound_charts_evaluator_id_fkey(user_id, name),
      vet:users!ultrasound_charts_vet_id_fkey(user_id, name)
    `)
    .eq('id', chartId)
    .single()

  if (error) {
    console.error('getUltrasoundChart error:', error)
    return null
  }
  return data
}

export async function getUltrasoundChartOrgans(chartId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ultrasound_chart_organs')
    .select('*')
    .eq('chart_id', chartId)

  if (error) {
    console.error('getUltrasoundChartOrgans error:', error)
    return []
  }
  return data
}

export async function updateUltrasoundChart(chartId: string, updates: UltrasoundChartUpdate) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('ultrasound_charts')
    .update(updates)
    .eq('id', chartId)
    .select()
    .single()
    
  if (error) {
    console.error('updateUltrasoundChart error:', error)
    throw new Error('차트 업데이트에 실패했습니다.')
  }
  return data
}

export async function upsertUltrasoundOrgan(organData: UltrasoundChartOrganInsert) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('ultrasound_chart_organs')
    .upsert(organData, { onConflict: 'chart_id,organ_name' })
    .select()
    .single()
    
  if (error) {
    console.error('upsertUltrasoundOrgan error:', error)
    throw new Error('장기 데이터 저장에 실패했습니다.')
  }
  return data
}

export async function deleteUltrasoundChart(chartId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('ultrasound_charts')
    .delete()
    .eq('id', chartId)
    
  if (error) {
    console.error('deleteUltrasoundChart error:', error)
    throw new Error('차트 삭제에 실패했습니다.')
  }
}
