'use server'

import { createClient } from '@/lib/supabase/server'
import type {
  DermChartDetail,
  DermLesionGroup,
  DermLesionVisit,
  DermImage,
  Marker,
  ImprovementType,
  DermAiAnalysis,
} from '@/types/hospital/derm-type'

// ── Chart ─────────────────────────────────────────────────────

export async function getDermChart(chartId: string): Promise<DermChartDetail | null> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('derm_charts')
    .select(`
      *,
      patient:patients(*),
      evaluator:users!derm_charts_evaluator_id_fkey(user_id, name)
    `)
    .eq('id', chartId)
    .single()

  if (error) {
    console.error('getDermChart error:', error.message)
    return null
  }

  return data as DermChartDetail
}

export async function updateDermChart(
  chartId: string,
  updates: {
    chief_complaint?: string | null
    overview_image_url?: string | null
    overall_severity?: number | null
    ai_summary?: string | null
    notes?: string | null
    evaluator_id?: string | null
    vet_id?: string | null
    user_tags?: string | null
  },
) {
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from('derm_charts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', chartId)

  if (error) throw new Error(`차트 저장 실패: ${error.message}`)
}

export async function deleteDermChart(chartId: string) {
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from('derm_charts')
    .delete()
    .eq('id', chartId)

  if (error) throw new Error(`차트 삭제 실패: ${error.message}`)
}

// ── Lesion Groups ─────────────────────────────────────────────

export async function getLesionGroups(patientId: string): Promise<DermLesionGroup[]> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('derm_lesion_groups')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getLesionGroups error:', error.message)
    return []
  }

  return data as DermLesionGroup[]
}

export async function createLesionGroup(params: {
  hosId: string
  patientId: string
  initialChartId: string
  groupLabel: string
  groupColor: string
}): Promise<DermLesionGroup> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('derm_lesion_groups')
    .insert({
      hos_id: params.hosId,
      patient_id: params.patientId,
      initial_chart_id: params.initialChartId,
      group_label: params.groupLabel,
      group_color: params.groupColor,
      status: 'active',
    })
    .select()
    .single()

  if (error) throw new Error(`그룹 생성 실패: ${error.message}`)
  return data as DermLesionGroup
}

export async function updateLesionGroup(
  groupId: string,
  updates: {
    group_label?: string
    group_color?: string
    suspected_type?: string | null
    marker_data?: Marker[] | null
    status?: 'active' | 'resolved'
  },
) {
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from('derm_lesion_groups')
    .update(updates)
    .eq('id', groupId)

  if (error) throw new Error(`그룹 수정 실패: ${error.message}`)
}

export async function deleteLesionGroup(groupId: string) {
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from('derm_lesion_groups')
    .delete()
    .eq('id', groupId)

  if (error) throw new Error(`그룹 삭제 실패: ${error.message}`)
}

// ── Lesion Visits ─────────────────────────────────────────────

export async function getLesionVisits(chartId: string): Promise<DermLesionVisit[]> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('derm_lesion_visits')
    .select('*')
    .eq('chart_id', chartId)

  if (error) {
    console.error('getLesionVisits error:', error.message)
    return []
  }

  return data as DermLesionVisit[]
}

export async function upsertLesionVisit(params: {
  id?: string
  hosId: string
  chartId: string
  lesionGroupId: string
  rawInput?: string | null
  formalFindings?: string | null
  lesionTypes?: string[] | null
  aiAnalysis?: DermAiAnalysis | null
  severity?: number | null
  improvement?: ImprovementType | null
  aiComparisonNotes?: string | null
}): Promise<DermLesionVisit> {
  const supabase = await createClient()

  const payload: Record<string, unknown> = {
    hos_id: params.hosId,
    chart_id: params.chartId,
    lesion_group_id: params.lesionGroupId,
    raw_input: params.rawInput ?? null,
    formal_findings: params.formalFindings ?? null,
    lesion_types: params.lesionTypes ?? null,
    ai_analysis: params.aiAnalysis ?? null,
    severity: params.severity ?? null,
    improvement: params.improvement ?? null,
    ai_comparison_notes: params.aiComparisonNotes ?? null,
  }

  if (params.id) {
    const { data, error } = await (supabase as any)
      .from('derm_lesion_visits')
      .update(payload)
      .eq('id', params.id)
      .select()
      .single()
    if (error) throw new Error(`소견 저장 실패: ${error.message}`)
    return data as DermLesionVisit
  }

  const { data, error } = await (supabase as any)
    .from('derm_lesion_visits')
    .upsert(payload, { onConflict: 'chart_id,lesion_group_id' })
    .select()
    .single()

  if (error) throw new Error(`소견 저장 실패: ${error.message}`)
  return data as DermLesionVisit
}

// ── Images ────────────────────────────────────────────────────

export async function getDermImages(chartId: string): Promise<DermImage[]> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('derm_images')
    .select('*')
    .eq('chart_id', chartId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('getDermImages error:', error.message)
    return []
  }

  return data as DermImage[]
}
