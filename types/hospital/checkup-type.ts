export type CheckupStatus = 'draft' | 'reviewing' | 'approved'

export type CheckupSidebarItem = {
  id: string
  patient_id: string
  checkup_date: string
  patient_name: string
  species: string
  breed: string
  hos_patient_id: string
  status: CheckupStatus
  vet_name: string | null
}

export type CheckupPatient = {
  name: string
  species: string
  breed: string
  hos_patient_id: string
  birth: string | null
  gender: string | null
  owner_name: string | null
}

export type CheckupSection = {
  id: string
  checkup_id: string
  section_type:
    | 'inquiry'
    | 'physical'
    | 'dental_basic'
    | 'ophthalmic_basic'
    | 'neuro_basic'
    | 'lab'
    | 'xray'
    | 'ultrasound_basic'
    | 'ct_mri'
    | 'echo_basic'
    | 'imaging'    // legacy
    | 'assessment'
    | 'plan'
  data: Record<string, unknown>
  updated_at: string
}

export type CheckupAiResult = {
  id: string
  checkup_id: string
  summary: string | null
  abnormal_findings: AbnormalFinding[]
  weight_advice: string | null
  monitoring_items: MonitoringItem[]
  approved_at: string | null
  approved_by: string | null
}

export type AbnormalFinding = {
  item: string
  value: string
  unit: string
  ref_range: string
  interpretation: string
}

export type MonitoringItem = {
  item: string
  interval: string
  priority: 'high' | 'medium' | 'low'
}

// ── 신경계 섹션 데이터 판별 유니언 ─────────────────────────────
export type NeuroSectionStructured = {
  format: 'structured'
  chartId: string
  results: Record<string, string | string[]>
  localisations: {
    localisationCandidates?: Array<{
      location: string
      locationNameKo?: string
      confidenceScore: number
    }>
    detectedSyndromes?: Array<{
      nameKo: string
      interpretationKo: string
    }>
    cerebralLateralisation?: {
      hemisphere: 'left' | 'right' | 'bilateral' | 'undetermined'
      confidenceScore: number
      summaryKo?: string
    } | null
  }
  summary: string | null
}

export type NeuroSectionText = {
  format: 'text'
  notes: string
}

// format 없음 = 레거시 text (`notes` 키만 있는 구형 저장 형식)
export type NeuroSectionData = NeuroSectionStructured | NeuroSectionText

export function isNeuroStructured(d: unknown): d is NeuroSectionStructured {
  return typeof d === 'object' && d !== null && (d as any).format === 'structured'
}

export type CheckupDetail = {
  record: {
    id: string
    hos_id: string
    patient_id: string
    checkup_date: string
    status: CheckupStatus
    vet_id: string | null
    notes: string | null
    sub_charts: Record<string, string | null>
    patient: CheckupPatient
    vet_name: string | null
  }
  sections: CheckupSection[]
  aiResult: CheckupAiResult | null
}
