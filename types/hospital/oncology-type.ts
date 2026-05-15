// ──────────────────────────────────────────────
// Sidebar / List
// ──────────────────────────────────────────────
export type OncologySidebarItem = {
  id: string
  patient_id: string
  case_date: string
  patient_name: string
  species: string
  breed: string
  hos_patient_id: string
  diagnosis_name: string
  status: string
  vet_name: string | null
}

// ──────────────────────────────────────────────
// Case detail
// ──────────────────────────────────────────────
export type OncologyPatient = {
  name: string
  species: string
  breed: string
  hos_patient_id: string
  birth: string | null
  gender: string | null
  owner_name: string | null
  hos_owner_id: string | null
  microchip_no: string | null
  memo: string | null
}

export type OncologyCaseDetail = {
  id: string
  hos_id: string
  patient_id: string
  case_date: string
  diagnosis_name: string
  diagnosis_category: string[]
  diagnosis_method: string[]
  stage: string | null
  body_weight: number | null
  age_at_diagnosis_days: number | null
  sex: string | null
  status: string
  notes: string | null
  vet_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string

  patient: OncologyPatient
}

export type OncologyCaseStatus = 'active' | 'completed' | 'discontinued' | 'deceased'
