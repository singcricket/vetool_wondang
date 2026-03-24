'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * ICU 차트 화면에서 현재 환자의 최근 icu_io 기록으로부터
 * icu_io_dx(진단명), icu_io_cc(주증상)를 파싱하여 키워드 배열로 반환합니다.
 */
export async function getIcuIoKeywords(patientId: string): Promise<string[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('icu_io')
    .select('icu_io_dx, icu_io_cc')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) return []

  const raw = [data.icu_io_dx ?? '', data.icu_io_cc ?? ''].join(',')
  const keywords = raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)

  return [...new Set(keywords)] // 중복 제거
}

/**
 * 모니터링 세션 화면에서 session_id로 monitoring_sessions 테이블의
 * user_tags(콤마 구분 문자열)를 파싱하여 키워드 배열로 반환합니다.
 */
export async function getMsUserTagKeywords(sessionId: string): Promise<string[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('monitoring_sessions')
    .select('user_tags')
    .eq('session_id', sessionId)
    .single()

  if (!data?.user_tags) return []

  return data.user_tags
    .split(',')
    .map((k: string) => k.trim())
    .filter(Boolean)
}
