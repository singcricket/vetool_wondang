'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Marker, ImprovementType, DermAiAnalysis } from '@/types/hospital/derm-type'

// ── Chart ─────────────────────────────────────────────────────

export async function saveDermChart(
  chartId: string,
  hosId: string,
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
  revalidatePath(`/hospital/${hosId}/derm`, 'layout')
}

export async function deleteDermChartAction(chartId: string, hosId: string) {
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from('derm_charts')
    .delete()
    .eq('id', chartId)

  if (error) throw new Error(`차트 삭제 실패: ${error.message}`)
  revalidatePath(`/hospital/${hosId}/derm`, 'layout')
}

// ── Lesion Groups ─────────────────────────────────────────────

export async function createLesionGroupAction(params: {
  hosId: string
  patientId: string
  initialChartId: string
  groupLabel: string
  groupColor: string
}) {
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
  revalidatePath(`/hospital/${params.hosId}/derm`, 'layout')
  return data
}

export async function updateLesionGroupAction(
  groupId: string,
  hosId: string,
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
  revalidatePath(`/hospital/${hosId}/derm`, 'layout')
}

export async function deleteLesionGroupAction(groupId: string, hosId: string) {
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from('derm_lesion_groups')
    .delete()
    .eq('id', groupId)

  if (error) throw new Error(`그룹 삭제 실패: ${error.message}`)
  revalidatePath(`/hospital/${hosId}/derm`, 'layout')
}

// ── Lesion Visits ─────────────────────────────────────────────

export async function upsertLesionVisitAction(params: {
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
}) {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('derm_lesion_visits')
    .upsert(
      {
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
      },
      { onConflict: 'chart_id,lesion_group_id' },
    )
    .select()
    .single()

  if (error) throw new Error(`소견 저장 실패: ${error.message}`)
  revalidatePath(`/hospital/${params.hosId}/derm`, 'layout')
  return data
}
