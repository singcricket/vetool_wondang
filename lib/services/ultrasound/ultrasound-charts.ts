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

export async function updateUltrasoundVets(
  chartId: string,
  vetId: string | null,
  evaluatorId: string | null,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('ultrasound_charts')
    .update({ vet_id: vetId, evaluator_id: evaluatorId })
    .eq('id', chartId)
  if (error) throw new Error(`updateUltrasoundVets: ${error.message}`)
}

export async function updateUltrasoundTag(
  chartId: string,
  userTags: string,
  preTagsArray: string[],
  hosPatientId: string,
  hosOwnerId: string,
  patientName: string,
  patientGender: string,
  patientSpecies: string,
  patientBreed: string,
  ageInDays: string,
): Promise<boolean> {
  const supabase = await createClient()

  // 1. keywords 테이블에서 매칭되는 행들 가져오기 (필요 시)
  const { data: keywordRows, error: keywordError } = await supabase
    .from('keywords')
    .select('tags')
    .in('keyword', preTagsArray)

  if (keywordError) {
    console.error('Keyword fetch failed:', keywordError.message)
    return false
  }

  // 2. 검색된 tags 합치기 (#으로 시작하는 구조)
  let combinedTagsSet = new Set<string>()

  keywordRows?.forEach((row) => {
    if (row.tags) {
      row.tags
        .split('#')
        .filter((t) => t.trim().length > 0)
        .forEach((tag) => {
          combinedTagsSet.add(tag)
        })
    }
  })

  // 3. 현재 입력된 사용자 태그 추가
  if (userTags.length > 0) {
    userTags.split(',').forEach((tag) => {
      combinedTagsSet.add(tag.trim())
    })
  }

  // 4. 최종 tags 문자열 생성 (#tag1#tag2...)
  const _finalTagsString = Array.from(combinedTagsSet)
    .map((tag) => `#${tag}`)
    .join('')

  const finalTagsString =
    _finalTagsString +
    '#' +
    hosPatientId +
    '#' +
    (hosOwnerId ?? '') +
    '#' +
    patientName +
    '#' +
    patientSpecies +
    '#' +
    patientBreed +
    '#' +
    patientGender +
    '#' +
    ageInDays

  // 5. DB 업데이트
  const { error } = await supabase
    .from('ultrasound_charts')
    .update({
      tags: finalTagsString,
    })
    .eq('id', chartId)

  if (error) {
    console.error('Update failed:', error.message)
    return false
  }

  return true
}
