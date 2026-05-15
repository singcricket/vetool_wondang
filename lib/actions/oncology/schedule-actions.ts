'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ScheduleUpdateData {
  status: string
  dose_actual?: number | null
  body_weight_at_visit?: number | null
  notes?: string | null
  delay_reason?: string | null
  reduction_reason?: string | null
}

export async function updateScheduleStatus(
  scheduleId: string,
  status: string,
  data: Omit<ScheduleUpdateData, 'status'> = {},
) {
  const supabase = await createClient()

  const updatePayload: Record<string, unknown> = { status }

  if (data.dose_actual !== undefined) updatePayload.dose_actual = data.dose_actual
  if (data.body_weight_at_visit !== undefined) updatePayload.body_weight_at_visit = data.body_weight_at_visit
  if (data.notes !== undefined) updatePayload.notes = data.notes
  if (data.delay_reason !== undefined) updatePayload.delay_reason = data.delay_reason
  if (data.reduction_reason !== undefined) updatePayload.reduction_reason = data.reduction_reason

  if (status === 'completed') {
    updatePayload.administered_at = new Date().toISOString()
  }

  const { error } = await supabase.from('onco_schedules').update(updatePayload).eq('id', scheduleId)

  if (error) throw new Error(`스케줄 업데이트 실패: ${error.message}`)

  // Update case_protocol counters
  const { data: sched } = await supabase
    .from('onco_schedules')
    .select('case_protocol_id')
    .eq('id', scheduleId)
    .single()

  if (sched) {
    const { data: allSchedules } = await supabase
      .from('onco_schedules')
      .select('status')
      .eq('case_protocol_id', sched.case_protocol_id)

    const completed = (allSchedules ?? []).filter((s) => s.status === 'completed').length
    const delayed = (allSchedules ?? []).filter((s) => s.status === 'delayed').length
    const reduced = (allSchedules ?? []).filter((s) => s.status === 'reduced').length

    await supabase
      .from('onco_case_protocols')
      .update({ completed_doses: completed, delayed_doses: delayed, reduced_doses: reduced })
      .eq('id', sched.case_protocol_id)
  }

  revalidatePath('/', 'layout')
}
