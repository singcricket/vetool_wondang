'use server'

import { createClient } from '@/lib/supabase/server'
import type { CheckupPatient } from '@/types/hospital/checkup-type'

export type SubChartType = 'ultrasound' | 'echo' | 'ophthalmic' | 'dental' | 'neuro'

const TABLE_NAME: Record<SubChartType, string> = {
  ultrasound: 'ultrasound_charts',
  echo: 'echo_charts',
  ophthalmic: 'ophthalmic_charts',
  dental: 'dental_charts',
  neuro: 'neuro_charts',
}

// 각 테이블의 "소견 요약" 필드명
const SUMMARY_FIELD: Record<SubChartType, string> = {
  ultrasound: 'impression_summary',
  echo: 'memo',
  ophthalmic: 'summary',
  dental: 'general_note',
  neuro: 'summary',
}

// 각 테이블의 "날짜" 필드명
const DATE_FIELD: Record<SubChartType, string> = {
  ultrasound: 'chart_date',
  echo: 'exam_date',
  ophthalmic: 'chart_date',
  dental: 'chart_date',
  neuro: 'chart_date',
}

function buildTags(patient: CheckupPatient): string {
  const ageDays = patient.birth
    ? Math.floor((Date.now() - new Date(patient.birth).getTime()) / (1000 * 60 * 60 * 24))
    : 0
  return `#${patient.hos_patient_id}##${patient.name}#${patient.species}#${patient.breed ?? ''}#${patient.gender ?? ''}#${ageDays}`
}

export type LinkedChartInfo = {
  id: string
  chartDate: string
  summary: string | null
}

/** 연동된 서브차트의 기본 정보(날짜, 요약 소견) 조회 */
export async function fetchLinkedChartInfo(
  chartId: string,
  chartType: SubChartType,
): Promise<LinkedChartInfo | null> {
  const supabase = await createClient()
  const table = TABLE_NAME[chartType]
  const summaryField = SUMMARY_FIELD[chartType]
  const dateField = DATE_FIELD[chartType]

  const { data, error } = await (supabase as any)
    .from(table)
    .select(`id, ${dateField}, ${summaryField}`)
    .eq('id', chartId)
    .maybeSingle()

  if (error || !data) return null
  return {
    id: data.id,
    chartDate: data[dateField] as string,
    summary: (data[summaryField] as string | null) ?? null,
  }
}

/** 새 서브차트 생성 후 검진에 연동 */
export async function createLinkedSubChart(params: {
  checkupId: string
  chartType: SubChartType
  hosId: string
  patientId: string
  patient: CheckupPatient
  chartDate: string
}): Promise<string> {
  const supabase = await createClient()
  const table = TABLE_NAME[params.chartType]
  const dateField = DATE_FIELD[params.chartType]
  const tags = buildTags(params.patient)

  const { data, error } = await (supabase as any)
    .from(table)
    .insert({
      hos_id: params.hosId,
      patient_id: params.patientId,
      [dateField]: params.chartDate,
      tags,
    })
    .select('id')
    .single()

  if (error) throw new Error(`차트 생성 실패: ${error.message}`)

  await linkSubChartToCheckup(params.checkupId, params.chartType, data.id as string)

  return data.id as string
}

/** 서브차트 요약 소견 업데이트 */
export async function updateLinkedChartSummary(params: {
  chartId: string
  chartType: SubChartType
  summary: string
}): Promise<void> {
  const supabase = await createClient()
  const table = TABLE_NAME[params.chartType]
  const summaryField = SUMMARY_FIELD[params.chartType]

  const { error } = await (supabase as any)
    .from(table)
    .update({ [summaryField]: params.summary })
    .eq('id', params.chartId)

  if (error) throw new Error(`소견 저장 실패: ${error.message}`)
}

/** checkup_records.sub_charts JSON에서 특정 차트 링크 제거 (차트 삭제 시 stale 정리) */
export async function clearLinkedSubChart(
  checkupId: string,
  chartType: SubChartType,
): Promise<void> {
  const supabase = await createClient()

  const { data: current } = await supabase
    .from('checkup_records')
    .select('sub_charts')
    .eq('id', checkupId)
    .single()

  const subCharts = ((current?.sub_charts as Record<string, string | null>) ?? {})
  subCharts[chartType] = null

  const { error } = await supabase
    .from('checkup_records')
    .update({ sub_charts: subCharts as any })
    .eq('id', checkupId)

  if (error) throw new Error(`연동 해제 실패: ${error.message}`)
}

/** checkup_records.sub_charts JSON에 특정 차트 ID 저장 */
export async function linkSubChartToCheckup(
  checkupId: string,
  chartType: SubChartType,
  chartId: string,
): Promise<void> {
  const supabase = await createClient()

  const { data: current } = await supabase
    .from('checkup_records')
    .select('sub_charts')
    .eq('id', checkupId)
    .single()

  const subCharts = ((current?.sub_charts as Record<string, string | null>) ?? {})
  subCharts[chartType] = chartId

  const { error } = await supabase
    .from('checkup_records')
    .update({ sub_charts: subCharts as any })
    .eq('id', checkupId)

  if (error) throw new Error(`연동 저장 실패: ${error.message}`)
}
