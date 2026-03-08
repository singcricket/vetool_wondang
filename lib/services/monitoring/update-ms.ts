'use server'

import { createClient } from '@/lib/supabase/server'
import { getDaysSince } from '@/lib/utils/utils'
import { MsMemoTx, MsVetSub, VitalResults } from '@/types/monitoring/monitoring-type'


export const startMsTime = async (sessionId: string) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('monitoring_sessions')
    .update({ start_time: new Date().toISOString() })
    .match({ session_id: sessionId })

  if (error) {
    console.error('Update failed:', error.message)
    return
  }
}

export const stopMsTime = async (sessionId: string) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('monitoring_sessions')
    .update({ end_time: new Date().toISOString() })
    .match({ session_id: sessionId })

  if (error) {
    console.error('Update failed:', error.message)
    return
  }
}

export const resetMsTime = async (sessionId: string) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('monitoring_sessions')
    .update({ end_time: null, start_time: null })
    .match({ session_id: sessionId })

  if (error) {
    console.error('Update failed:', error.message)
    return
  }
}

export const updateMsTime = async (
  sessionId: string,
  startTimeInput: string | null,
  endTimeInput: string | null,
) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('monitoring_sessions')
    .update({
      start_time: startTimeInput,
      end_time: endTimeInput,
    })
    .match({ session_id: sessionId })

  if (error) {
    console.error('Update failed:', error.message)
    return
  }
}

export const updateMsPatient = async (
  sessionId: string,
  patientId: string,
  birth : string
) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('monitoring_sessions')
    .update({
      patient_id: patientId,
      age_in_days:getDaysSince(birth)
    })
    .match({ session_id: sessionId })

  if (error) {
    console.error('Update failed:', error.message)
    return false
  }

  return true
}

export const deleteMs = async (sessionId: string) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('monitoring_sessions')
    .delete()
    .match({ session_id: sessionId })

  if (error) {
    console.error('Delete failed:', error.message)
    return false
  }

  return true
}

export const updateMsTitle = async (
  sessionId: string,
  title: string,
) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('monitoring_sessions')
    .update({
      session_title: title,
    })
    .match({ session_id: sessionId })

  if (error) {
    console.error('Update failed:', error.message)
    return false
  }

  return true
}

export const updateMsVet = async (
  sessionId: string,
  vetInput: MsVetSub & { main_vet: string, primary_vet: string },
) => {
  const main =
    vetInput.main_vet === 'null' || vetInput.main_vet === ''
      ? null
      : vetInput.main_vet
  const primary =
    vetInput.primary_vet === 'null' || vetInput.primary_vet === ''
      ? null
      : vetInput.primary_vet
  const sub = {
    secondary: vetInput.secondary === 'null' || vetInput.secondary === ''
      ? ''
      : vetInput.secondary,
    anesthesia: vetInput.anesthesia === 'null' || vetInput.anesthesia === ''
      ? ''
      : vetInput.anesthesia,
    other: vetInput.other === 'null' || vetInput.other === ''
      ? ''
      : vetInput.other,
  }
  const supabase = await createClient()

  const { error } = await supabase
    .from('monitoring_sessions')
    .update({
      vet_sub: sub,
      vet_main: main,
      vet_primary: primary,
    })
    .match({ session_id: sessionId })

  if (error) {
    console.error('Update failed:', error.message)
    return false
  }

  return true
}

export const updateMsGroup = async (
  sessionId: string,
  groupList: string[],
) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('monitoring_sessions')
    .update({
      session_group: groupList,
    })
    .match({ session_id: sessionId })

  if (error) {
    console.error('Update failed:', error.message)
    return false
  }

  return true
}

export const updateMsTag = async (
  sessionId: string,
  msTag:string,
  preTagsArray: string[],
  patientName: string,
  patientGender: string,
  patientSpecies: string,
  patientBreed: string,
  ageInDays: string,
) => {
  const supabase = await createClient()

  // 1. keywords 테이블에서 매칭되는 행들 가져오기
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
  
  keywordRows?.forEach(row => {
    if (row.tags) {
      // #으로 시작하므로 split('#') 하면 첫 요소가 빈문자열일 수 있음
      row.tags.split('#').filter(t => t.trim().length > 0).forEach(tag => {
        combinedTagsSet.add(tag)
      })
    }
  })

  // 3. 환자 정보 전달인자 추가
  if(msTag.length>0){
    msTag.split(",").forEach(tag => {
      combinedTagsSet.add(tag.trim())
    })
  }
  if (patientName) combinedTagsSet.add(patientName)
  if (patientSpecies) combinedTagsSet.add(patientSpecies)
  if (patientBreed) combinedTagsSet.add(patientBreed)
  if (patientGender) combinedTagsSet.add(patientGender)
  if (ageInDays) combinedTagsSet.add(ageInDays)

  // 4. 최종 tags 문자열 생성 (#tag1#tag2...)
  const finalTagsString = Array.from(combinedTagsSet)
    .map(tag => `#${tag}`)
    .join('')
  console.log("finalTagsString",finalTagsString)
  // 5. DB 업데이트 (user_tags는 콤마 구분자, tags는 # 구분자)
  console.log("tag",msTag)
  const { error } = await supabase
    .from('monitoring_sessions')
    .update({
      user_tags: msTag,
      tags: finalTagsString
    })
    .match({ session_id: sessionId })

  if (error) {
    console.error('Update failed:', error.message)
    return false
  }

  return true
}

export const updateMsMemo = async (
  sessionId: string,
  memo: MsMemoTx,
) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('monitoring_sessions')
    .update({
      memo_tx: memo,
    })
    .match({ session_id: sessionId })

  if (error) {
    console.error('Update failed:', error.message)
    return false
  }

  return true
}

export const updateMsPannedVitals = async (
  sessionId:string,
  vitals : string[]
) => {
  const supabase = await createClient()
   const { error } = await supabase
    .from('monitoring_sessions')
    .update({
      planned_vitals: vitals,
    })
    .match({ session_id: sessionId })

  if (error) {
    console.error('Update failed:', error.message)
    return false
  }

  return true
}

export const updateMsInterval = async (
  sessionId: string,
  interval: number,
) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('monitoring_sessions')
    .update({
      interval_setting: interval,
    })
    .match({ session_id: sessionId })

  if (error) {
    console.error('Update failed:', error.message)
    return false
  }

  return true
}

export const updateMsVitalResults = async (
  sessionId: string,
  vitalResults: VitalResults,
) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('monitoring_sessions')
    .update({
      vital_results: vitalResults,
    })
    .match({ session_id: sessionId })

  if (error) {
    console.error('Update failed:', error.message)
    return false
  }

  return true
}