// ──────────────────────────────────────────────
// Sidebar / List
// ──────────────────────────────────────────────
export type DentalSidebarItem = {
  id: string
  patient_id: string
  chart_date: string
  patient_name: string
  species: string
  breed: string
  hos_patient_id: string
  vet_name: string | null
}

// ──────────────────────────────────────────────
// Patient (joined)
// ──────────────────────────────────────────────
export type DentalPatient = {
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

// ──────────────────────────────────────────────
// Chart-level (dental_charts)
// ──────────────────────────────────────────────
export type DentalChartDetail = {
  id: string
  hos_id: string
  patient_id: string
  chart_date: string
  species: 'canine' | 'feline' | 'other' | null

  vet_id: { id: string; role: string }[]

  // 마취
  anesthesia: boolean
  anesthesia_note: string | null

  // 두개 / 교합
  skull_type: 'dolichocephalic' | 'mesocephalic' | 'brachycephalic' | null
  occlusion: 'normal' | 'class1' | 'class2' | 'class3' | 'class4' | null
  crowding: 'none' | 'mild' | 'moderate' | 'severe' | null

  // 전체 치주
  gingivitis_overall: 'none' | 'mild' | 'moderate' | 'severe' | null
  calculus_overall: 'none' | 'mild' | 'moderate' | 'severe' | null
  periodontitis_stage: 'healthy' | 'stage1' | 'stage2' | 'stage3' | 'stage4' | null

  // 구강 점막
  oral_mucosa: string | null
  tongue_eval: string | null
  palate_eval: string | null
  tonsil_eval: string | null
  pharynx_eval: string | null
  salivary_eval: string | null
  lymph_node_eval: string | null

  // 방사선
  xray_taken: boolean
  xray_findings: string | null

  // 처치
  procedure_scaling: boolean
  procedure_polishing: boolean
  procedure_irrigation: boolean
  procedure_fluoride: boolean
  procedure_other: string | null

  // 치료 계획
  treatment_plan: string | null
  recheck_interval: '1month' | '3months' | '6months' | '12months' | 'as_needed' | null
  homecare_instruction: string | null

  // 메모 / 태그
  general_note: string | null
  user_tags: string | null
  tags: string | null

  created_at: string
  updated_at: string

  // joined
  patient: DentalPatient
}

// ──────────────────────────────────────────────
// Tooth-level (dental_chart_teeth)
// ──────────────────────────────────────────────
export type DentalTooth = {
  id?: string
  hos_id: string
  chart_id: string
  tooth_id: number        // Triadan 번호 (101~411)
  tooth_name: string | null
  is_deciduous: boolean

  status: 'present' | 'missing' | 'extracted' | 'unerupted' | 'persistent'

  // 치주 평가
  gingivitis: 'none' | 'mild' | 'moderate' | 'severe' | null
  calculus: 'none' | 'mild' | 'moderate' | 'severe' | null
  plaque: 'none' | 'mild' | 'moderate' | 'severe' | null

  // 치주낭 깊이 (mm)
  probing_ml: number | null
  probing_l: number | null
  probing_dl: number | null
  probing_mb: number | null
  probing_b: number | null
  probing_db: number | null

  // 치은 퇴축 (mm)
  recession_ml: number | null
  recession_l: number | null
  recession_dl: number | null
  recession_mb: number | null
  recession_b: number | null
  recession_db: number | null

  // 동요도 / 분기부
  mobility: 'none' | 'grade1' | 'grade2' | 'grade3' | null
  furcation: 'none' | 'grade1' | 'grade2' | 'grade3' | null

  // 병변
  fracture: 'none' | 'enamel' | 'uncomplicated' | 'complicated' | 'crown_root' | 'root' | null
  pulp_exposure: boolean
  caries: 'none' | 'mild' | 'moderate' | 'severe' | null
  resorption: 'none' | 'type1' | 'type2' | 'type3' | null
  staining: 'none' | 'mild' | 'moderate' | 'severe' | null
  attrition: 'none' | 'mild' | 'moderate' | 'severe' | null
  abrasion: 'none' | 'mild' | 'moderate' | 'severe' | null
  supernumerary: boolean

  // 방사선 / 처치 / 계획
  xray_finding: string | null
  treatment_done: string[]
  treatment_plan: string[]
  treatment_priority: 'urgent' | 'recommended' | 'elective' | 'monitor' | null

  tooth_note: string | null

  created_at?: string
  updated_at?: string
}

// ──────────────────────────────────────────────
// 레거시 (하위 호환)
// ──────────────────────────────────────────────
export type DentalChart = {
  id: string
  hos_id: string
  patient_id: string
  vet_id: string | null
  chart_date: string
  memo?: string | null
  general_note?: string | null
  anesthesia?: boolean | null
  created_at: string
  updated_at: string
}

export type DentalChartWithPatient = DentalChart & {
  patient: {
    name: string
    species: string
    breed: string
    hos_patient_id: string
    birth: string
    gender: string
    owner_name: string | null
    hos_owner_id: string | null
    microchip_no: string | null
    memo: string | null
  }
  vet?: { name: string; user_id: string } | null
}
