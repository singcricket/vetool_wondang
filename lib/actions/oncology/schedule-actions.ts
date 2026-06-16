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

export async function updateScheduleDoseRate(
  scheduleId: string,
  dosePerKg: number | null,
  dosePerM2: number | null,
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('onco_schedules')
    .update({ dose_per_kg: dosePerKg, dose_per_m2: dosePerM2 })
    .eq('id', scheduleId)

  if (error) throw new Error(`용량 수정 실패: ${error.message}`)

  revalidatePath('/', 'layout')
}

export async function updateScheduleDate(scheduleId: string, newDate: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('onco_schedules')
    .update({ scheduled_date: newDate })
    .eq('id', scheduleId)

  if (error) throw new Error(`날짜 수정 실패: ${error.message}`)

  revalidatePath('/', 'layout')
}

export async function saveBulkScheduleDates(updates: { id: string; newDate: string }[]) {
  const supabase = await createClient()

  await Promise.all(
    updates.map(async ({ id, newDate }) => {
      const { error } = await supabase
        .from('onco_schedules')
        .update({ scheduled_date: newDate })
        .eq('id', id)
      if (error) throw new Error(`날짜 저장 실패 (${id}): ${error.message}`)
    }),
  )

  revalidatePath('/', 'layout')
}

export async function deleteSchedules(ids: string[]) {
  if (ids.length === 0) return

  const supabase = await createClient()

  // Get case_protocol_ids before deletion (for counter update)
  const { data: schedules } = await supabase
    .from('onco_schedules')
    .select('id, case_protocol_id')
    .in('id', ids)

  const { error } = await supabase.from('onco_schedules').delete().in('id', ids)
  if (error) throw new Error(`스케줄 삭제 실패: ${error.message}`)

  // Update case_protocol counters for affected protocols
  const affectedProtocolIds = [...new Set((schedules ?? []).map((s) => s.case_protocol_id))]
  await Promise.all(
    affectedProtocolIds.map(async (protocolId) => {
      const { data: remaining } = await supabase
        .from('onco_schedules')
        .select('status')
        .eq('case_protocol_id', protocolId)

      const completed = (remaining ?? []).filter((s) => s.status === 'completed').length
      const delayed = (remaining ?? []).filter((s) => s.status === 'delayed').length
      const reduced = (remaining ?? []).filter((s) => s.status === 'reduced').length
      const total = (remaining ?? []).length

      await supabase
        .from('onco_case_protocols')
        .update({ total_doses: total, completed_doses: completed, delayed_doses: delayed, reduced_doses: reduced })
        .eq('id', protocolId)
    }),
  )

  revalidatePath('/', 'layout')
}

export async function bulkShiftScheduleDates(ids: string[], offsetDays: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('onco_schedules')
    .select('id, scheduled_date')
    .in('id', ids)

  if (error || !data) throw new Error(`스케줄 조회 실패: ${error?.message}`)

  await Promise.all(
    data.map(async (s) => {
      const d = new Date(s.scheduled_date)
      d.setDate(d.getDate() + offsetDays)
      const newDate = d.toISOString().split('T')[0]
      const { error: upErr } = await supabase
        .from('onco_schedules')
        .update({ scheduled_date: newDate })
        .eq('id', s.id)
      if (upErr) throw new Error(`날짜 수정 실패: ${upErr.message}`)
    }),
  )

  revalidatePath('/', 'layout')
}
