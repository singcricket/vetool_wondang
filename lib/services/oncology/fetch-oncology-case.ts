'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { OncologyCaseDetail } from '@/types/hospital/oncology-type'

export type OncologyScheduleRow = {
  id: string
  case_protocol_id: string
  drug_name: string
  drug_route: string
  cycle_number: number
  day_number: number
  scheduled_date: string
  dose_calculated: number | null
  dose_actual: number | null
  dose_unit: string
  dose_per_kg: number | null
  dose_per_m2: number | null
  body_weight_at_visit: number | null
  status: string
  notes: string | null
  delay_reason: string | null
  reduction_reason: string | null
  administered_at: string | null
  administered_by: string | null
  created_at: string
  updated_at: string
}

export type OncologyProtocolRow = {
  id: string
  protocol_name: string
  protocol_type: string
  phase: string
  description: string | null
  mst_days: number | null
  response_rate: number | null
  total_cycles: number | null
  total_weeks: number | null
  drugs: unknown
  adverse_effects: unknown
  precautions: string | null
  contraindications: string | null
  owner_instructions: string | null
  owner_warning_signs: unknown
  ref_sources: unknown
  is_ai_generated: boolean
  is_verified: boolean
  origin_diagnosis: string | null
  hos_id: string | null
  user_tags: string | null
  tags: string | null
  created_at: string
  updated_at: string
}

export type OncologyCaseProtocolRow = {
  id: string
  case_id: string
  protocol_id: string
  initial_body_weight: number
  start_date: string
  end_date: string | null
  status: string
  total_doses: number
  completed_doses: number
  delayed_doses: number
  reduced_doses: number
  discontinue_reason: string | null
  notes: string | null
  created_at: string
  updated_at: string
  protocol: OncologyProtocolRow
  schedules: OncologyScheduleRow[]
}

export type OncologyDiagnosisInputRow = {
  id: string
  case_id: string
  input_type: string
  clinical_signs: string | null
  clinical_course: string | null
  raw_text: string | null
  additional_notes: string | null
  ai_extracted_text: string | null
  file_url: string | null
  file_name: string | null
  file_type: string | null
  created_at: string
}

export type OncologyAdverseEventRow = {
  id: string
  case_id: string
  case_protocol_id: string | null
  event_date: string
  event_type: string
  drug_name: string | null
  vcog_grade: number
  description: string | null
  action_taken: string | null
  reported_by: string
  resolved: boolean
  resolved_date: string | null
  created_at: string
  created_by: string | null
}

export type ResponseTargetLesion = {
  id: string
  location: string
  baseline_mm: number | null
  current_mm: number | null
}

export type OncologyResponseEvalRow = {
  id: string
  case_id: string
  case_protocol_id: string | null
  eval_date: string
  criteria_system: string
  modalities: string[]
  target_lesions: ResponseTargetLesion[]
  sum_baseline_mm: number | null
  sum_current_mm: number | null
  percent_change: number | null
  non_target_status: string
  new_lesions: boolean
  new_lesions_desc: string | null
  overall_response: string
  clinical_impression: string | null
  marker_name: string | null
  marker_baseline: number | null
  marker_current: number | null
  marker_unit: string | null
  notes: string | null
  created_at: string
  created_by: string | null
}

export type QolBehaviorChecklist = {
  plays_normally?: boolean
  social_interaction?: boolean
  normal_sleep?: boolean
  toilet_normal?: boolean
  grooming_normal?: boolean
  shows_interest?: boolean
  pain_vocalization?: boolean
}

export type OncologyQolRecordRow = {
  id: string
  case_id: string
  visit_date: string
  body_weight: number | null
  pain_score: number | null
  hunger_score: number | null
  hydration_score: number | null
  hygiene_score: number | null
  happiness_score: number | null
  mobility_score: number | null
  good_days_score: number | null
  nausea_vomiting_days: number | null
  lethargy_days: number | null
  behavior_checklist: QolBehaviorChecklist | null
  reported_by: string
  notes: string | null
  created_at: string
  created_by: string | null
}

export type OncologyCaseFullDetail = {
  case: OncologyCaseDetail
  diagnosisInputs: OncologyDiagnosisInputRow[]
  caseProtocols: OncologyCaseProtocolRow[]
  adverseEvents: OncologyAdverseEventRow[]
  responseEvals: OncologyResponseEvalRow[]
  qolRecords: OncologyQolRecordRow[]
}

export async function fetchOncologyCaseDetail(caseId: string): Promise<OncologyCaseFullDetail> {
  const supabase = await createClient()

  const { data: caseData, error: caseError } = await supabase
    .from('onco_cases')
    .select(`
      id,
      hos_id,
      patient_id,
      case_date,
      diagnosis_name,
      diagnosis_category,
      diagnosis_method,
      stage,
      body_weight,
      age_at_diagnosis_days,
      sex,
      status,
      notes,
      vet_id,
      created_by,
      created_at,
      updated_at,
      patients!inner(name, species, breed, hos_patient_id, birth, gender, owner_name, hos_owner_id, microchip_no, memo)
    `)
    .eq('id', caseId)
    .single()

  if (caseError) throw new Error(`fetchOncologyCaseDetail case: ${caseError.message}`)

  const p = (caseData as any).patients
  const caseDetail: OncologyCaseDetail = {
    id: caseData.id,
    hos_id: caseData.hos_id,
    patient_id: caseData.patient_id,
    case_date: caseData.case_date,
    diagnosis_name: caseData.diagnosis_name,
    diagnosis_category: caseData.diagnosis_category,
    diagnosis_method: caseData.diagnosis_method,
    stage: caseData.stage,
    body_weight: caseData.body_weight,
    age_at_diagnosis_days: caseData.age_at_diagnosis_days,
    sex: caseData.sex,
    status: caseData.status,
    notes: caseData.notes,
    vet_id: caseData.vet_id,
    created_by: caseData.created_by,
    created_at: caseData.created_at,
    updated_at: caseData.updated_at,
    patient: {
      name: p?.name ?? '',
      species: p?.species ?? '',
      breed: p?.breed ?? '',
      hos_patient_id: p?.hos_patient_id ?? '',
      birth: p?.birth ?? null,
      gender: p?.gender ?? null,
      owner_name: p?.owner_name ?? null,
      hos_owner_id: p?.hos_owner_id ?? null,
      microchip_no: p?.microchip_no ?? null,
      memo: p?.memo ?? null,
    },
  }

  const [diagnosisRes, protocolsRes, adverseRes, responseRes, qolRes] = await Promise.all([
    supabase
      .from('onco_diagnosis_inputs')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true }),

    supabase
      .from('onco_case_protocols')
      .select(`
        *,
        protocol:onco_protocols(*),
        schedules:onco_schedules(*)
      `)
      .eq('case_id', caseId)
      .order('created_at', { ascending: true }),

    supabase
      .from('onco_adverse_events')
      .select('*')
      .eq('case_id', caseId)
      .order('event_date', { ascending: false }),

    supabase
      .from('onco_response_evals')
      .select('*')
      .eq('case_id', caseId)
      .order('eval_date', { ascending: false }),

    supabase
      .from('onco_qol_records')
      .select('*')
      .eq('case_id', caseId)
      .order('visit_date', { ascending: false }),
  ])

  if (diagnosisRes.error) throw new Error(`fetchOncologyCaseDetail diagnosis: ${diagnosisRes.error.message}`)
  if (protocolsRes.error) throw new Error(`fetchOncologyCaseDetail protocols: ${protocolsRes.error.message}`)
  if (adverseRes.error) throw new Error(`fetchOncologyCaseDetail adverse: ${adverseRes.error.message}`)
  if (responseRes.error) throw new Error(`fetchOncologyCaseDetail response: ${responseRes.error.message}`)
  if (qolRes.error) throw new Error(`fetchOncologyCaseDetail qol: ${qolRes.error.message}`)

  const caseProtocols: OncologyCaseProtocolRow[] = (protocolsRes.data ?? []).map((cp: any) => ({
    id: cp.id,
    case_id: cp.case_id,
    protocol_id: cp.protocol_id,
    initial_body_weight: cp.initial_body_weight,
    start_date: cp.start_date,
    end_date: cp.end_date,
    status: cp.status,
    total_doses: cp.total_doses,
    completed_doses: cp.completed_doses,
    delayed_doses: cp.delayed_doses,
    reduced_doses: cp.reduced_doses,
    discontinue_reason: cp.discontinue_reason,
    notes: cp.notes,
    created_at: cp.created_at,
    updated_at: cp.updated_at,
    protocol: cp.protocol,
    schedules: (cp.schedules ?? []).sort((a: any, b: any) =>
      a.scheduled_date.localeCompare(b.scheduled_date) || a.cycle_number - b.cycle_number
    ),
  }))

  return {
    case: caseDetail,
    diagnosisInputs: diagnosisRes.data ?? [],
    caseProtocols,
    adverseEvents: adverseRes.data ?? [],
    responseEvals: (responseRes.data ?? []) as OncologyResponseEvalRow[],
    qolRecords: (qolRes.data ?? []) as OncologyQolRecordRow[],
  }
}

// Admin client version — bypasses RLS for shared/public views
export async function fetchOncologyCaseDetailAdmin(caseId: string): Promise<OncologyCaseFullDetail> {
  const supabase = createAdminClient()

  const { data: caseData, error: caseError } = await (supabase as any)
    .from('onco_cases')
    .select(`
      id, hos_id, patient_id, case_date, diagnosis_name, diagnosis_category,
      diagnosis_method, stage, body_weight, age_at_diagnosis_days, sex, status,
      notes, vet_id, created_by, created_at, updated_at,
      patients!inner(name, species, breed, hos_patient_id, birth, gender, owner_name, hos_owner_id, microchip_no, memo)
    `)
    .eq('id', caseId)
    .single()

  if (caseError || !caseData) throw new Error(`fetchOncologyCaseDetailAdmin case: ${caseError?.message}`)

  const p = (caseData as any).patients
  const caseDetail: OncologyCaseDetail = {
    id: caseData.id, hos_id: caseData.hos_id, patient_id: caseData.patient_id,
    case_date: caseData.case_date, diagnosis_name: caseData.diagnosis_name,
    diagnosis_category: caseData.diagnosis_category, diagnosis_method: caseData.diagnosis_method,
    stage: caseData.stage, body_weight: caseData.body_weight,
    age_at_diagnosis_days: caseData.age_at_diagnosis_days, sex: caseData.sex,
    status: caseData.status, notes: caseData.notes, vet_id: caseData.vet_id,
    created_by: caseData.created_by, created_at: caseData.created_at, updated_at: caseData.updated_at,
    patient: {
      name: p?.name ?? '', species: p?.species ?? '', breed: p?.breed ?? '',
      hos_patient_id: p?.hos_patient_id ?? '', birth: p?.birth ?? null,
      gender: p?.gender ?? null, owner_name: p?.owner_name ?? null,
      hos_owner_id: p?.hos_owner_id ?? null, microchip_no: p?.microchip_no ?? null, memo: p?.memo ?? null,
    },
  }

  const [diagnosisRes, protocolsRes, adverseRes, qolRes] = await Promise.all([
    (supabase as any).from('onco_diagnosis_inputs').select('*').eq('case_id', caseId).order('created_at', { ascending: true }),
    (supabase as any).from('onco_case_protocols').select('*, protocol:onco_protocols(*), schedules:onco_schedules(*)').eq('case_id', caseId).order('created_at', { ascending: true }),
    (supabase as any).from('onco_adverse_events').select('*').eq('case_id', caseId).order('event_date', { ascending: false }),
    (supabase as any).from('onco_qol_records').select('*').eq('case_id', caseId).order('visit_date', { ascending: false }),
  ])

  const caseProtocols: OncologyCaseProtocolRow[] = (protocolsRes.data ?? []).map((cp: any) => ({
    id: cp.id, case_id: cp.case_id, protocol_id: cp.protocol_id,
    initial_body_weight: cp.initial_body_weight, start_date: cp.start_date, end_date: cp.end_date,
    status: cp.status, total_doses: cp.total_doses, completed_doses: cp.completed_doses,
    delayed_doses: cp.delayed_doses, reduced_doses: cp.reduced_doses,
    discontinue_reason: cp.discontinue_reason, notes: cp.notes,
    created_at: cp.created_at, updated_at: cp.updated_at, protocol: cp.protocol,
    schedules: (cp.schedules ?? []).sort((a: any, b: any) =>
      a.scheduled_date.localeCompare(b.scheduled_date) || a.cycle_number - b.cycle_number
    ),
  }))

  return {
    case: caseDetail,
    diagnosisInputs: diagnosisRes.data ?? [],
    caseProtocols,
    adverseEvents: adverseRes.data ?? [],
    responseEvals: [],
    qolRecords: (qolRes.data ?? []) as OncologyQolRecordRow[],
  }
}
