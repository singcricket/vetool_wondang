// ============================================================
// cytology-types.ts — Veterinary Cytology Type Definitions
// ============================================================

// ── Sample Types ─────────────────────────────────────────────
export type CytologySampleType =
  | 'otic'             // 귀도말
  | 'skin_impression'  // 피부 인상도말
  | 'skin_exudate'     // 피부 삼출물 도말
  | 'fecal'            // 분변염색
  | 'blood_smear'      // 혈액도말
  | 'fna_skin'         // FNA - 피부/피하
  | 'fna_lymph'        // FNA - 림프절
  | 'fna_organ'        // FNA - 내부 장기
  | 'effusion'         // 체강액 (흉수/복수)
  | 'synovial'         // 관절액
  | 'csf'              // 뇌척수액
  | 'bal'              // 기관지폐포세척액

export type CytologyMode = 'ai' | 'specialist'

export type SemiQuantitative = 'none' | 'rare' | 'few' | 'moderate' | 'many'
// none=0, rare=1-2/HPF, few=3-5/HPF, moderate=6-20/HPF, many=>20/HPF

// ── Finding Options ──────────────────────────────────────────
export interface CytologyFindingOption {
  value: string
  label: string          // 한국어
  labelEn: string
  isAbnormal: boolean
  severity?: 'mild' | 'moderate' | 'severe' | 'critical'
  signs?: CytologySign[] // 이 option 선택 시 activate될 signs
}

// ── Routine Test Items ────────────────────────────────────────
export interface CytologyRoutineTest {
  testId: string
  label: string
  labelEn: string
  testType: 'select' | 'semiquant' | 'boolean' | 'text' | 'multiselect'
  options?: CytologyFindingOption[]
  placeholder?: string
  note?: string
  dependsOn?: { testId: string; value: string }
}

export interface CytologyRoutineSection {
  sectionId: string
  label: string
  labelEn: string
  tests: CytologyRoutineTest[]
}

export interface CytologySampleDefinition {
  sampleType: CytologySampleType
  nameKo: string
  nameEn: string
  category: 'routine' | 'specialist'
  stainMethods: string[]
  sections: CytologyRoutineSection[]
}

// ── Specialist Mode — Cell Types ─────────────────────────────
export type CytologyCellCategory =
  | 'epithelial'
  | 'mesenchymal'
  | 'round_cell'
  | 'inflammatory'
  | 'background'

export interface CytologyMorphTest {
  testId: string
  label: string
  labelEn: string
  testType: 'select' | 'multiselect' | 'semiquant' | 'boolean' | 'text'
  options?: CytologyFindingOption[]
  placeholder?: string
}

export interface CytologyCellType {
  cellId: string
  nameKo: string
  nameEn: string
  category: CytologyCellCategory
  morphTests: CytologyMorphTest[]
}

// ── Diagnosis Rules ──────────────────────────────────────────
export type CytologyDiagnosisCategory =
  | 'inflammation'
  | 'infection'
  | 'neoplasia'
  | 'hyperplasia'
  | 'cyst'
  | 'normal'
  | 'hormonal'
  | 'parasitic'
  | 'immune_mediated'

export interface CytologyDiagnosisRule {
  diagnosisId: string
  nameKo: string
  nameEn: string
  abbreviation?: string
  category: CytologyDiagnosisCategory
  malignancyGrade?: 'benign' | 'low' | 'intermediate' | 'high' | 'undetermined'
  applicableSampleTypes: CytologySampleType[]
  requiredSigns: CytologySign[]
  supportingSigns: CytologySign[]
  exclusionSigns?: CytologySign[]
  baseConfidence: number
  supportingWeight: number
  maxConfidence: number
  descriptionKo: string
  treatmentHintKo?: string
  additionalTestsKo?: string[]
  ddx?: string[]
}

// ── Engine Output ─────────────────────────────────────────────
export interface CytologyDiagnosisResult {
  rule: CytologyDiagnosisRule
  confidenceScore: number
  matchedSigns: CytologySign[]
  missingRequiredSigns: CytologySign[]
}

export interface CytologyEngineOutput {
  activeSigns: CytologySign[]
  diagnoses: CytologyDiagnosisResult[]
  criticalFindings: string[]
  inflammationType: 'neutrophilic' | 'macrophagic' | 'eosinophilic' | 'mixed' | 'lymphocytic' | null
  malignancySuspicion: 'none' | 'low' | 'moderate' | 'high' | null
}

// ── AI Analysis ───────────────────────────────────────────────
export interface CytologyAIResult {
  sampleType: CytologySampleType
  findings: Record<string, string | string[]>  // 자동 추출된 소견
  summary: string
  confidence: number
  rawResponse: string
}

// ── Sign Taxonomy ─────────────────────────────────────────────
export type CytologySign =
  // Otic
  | 'otic_malassezia_rare' | 'otic_malassezia_few' | 'otic_malassezia_moderate' | 'otic_malassezia_many'
  | 'otic_cocci_rare' | 'otic_cocci_few' | 'otic_cocci_moderate' | 'otic_cocci_many'
  | 'otic_rods_rare' | 'otic_rods_few' | 'otic_rods_moderate' | 'otic_rods_many'
  | 'otic_neutrophils_present' | 'otic_neutrophils_many' | 'otic_mites_present'
  | 'otic_candida_present' | 'otic_mixed_bacteria' | 'otic_degenerate_neutrophils'
  // Skin
  | 'skin_cocci_rare' | 'skin_cocci_few' | 'skin_cocci_moderate' | 'skin_cocci_many'
  | 'skin_rods_present' | 'skin_malassezia_rare' | 'skin_malassezia_few' | 'skin_malassezia_moderate' | 'skin_malassezia_many'
  | 'skin_neutrophils_present' | 'skin_neutrophils_many' | 'skin_eosinophils_present' | 'skin_eosinophils_many'
  | 'skin_acantholytic_cells' | 'skin_macrophages_present' | 'skin_degenerate_neutrophils'
  | 'skin_giant_cells' | 'skin_plasma_cells'
  // Fecal
  | 'fecal_bacteria_normal' | 'fecal_bacteria_overgrowth' | 'fecal_rods_excess' | 'fecal_cocci_excess'
  | 'fecal_spiral_bacteria' | 'fecal_spores_clostridium' | 'fecal_yeast_present'
  | 'fecal_giardia' | 'fecal_isospora' | 'fecal_toxocara' | 'fecal_trichuris' | 'fecal_strongyle'
  | 'fecal_neutrophils_present' | 'fecal_rbc_present'
  // Specialist — Inflammation
  | 'infl_neutrophilic_pure' | 'infl_neutrophilic_septic' | 'infl_neutrophilic_nonseptic'
  | 'infl_macrophagic' | 'infl_eosinophilic' | 'infl_lymphocytic' | 'infl_mixed'
  | 'infl_giant_cells' | 'infl_plasma_cells_many'
  // Specialist — Cellularity/Background
  | 'spec_low_cellularity' | 'spec_high_cellularity' | 'spec_hemodilution_severe'
  | 'spec_necrosis' | 'spec_background_bacteria' | 'spec_high_protein'
  // Specialist — Epithelial
  | 'epi_cohesive_clusters' | 'epi_acinar_pattern' | 'epi_squamous_pearls'
  | 'epi_nuclear_pleomorphism' | 'epi_high_nc_ratio' | 'epi_prominent_nucleoli'
  | 'epi_mitoses' | 'epi_multinucleation' | 'epi_anisocytosis_moderate' | 'epi_anisocytosis_severe'
  | 'epi_cytoplasm_secretory' | 'epi_signet_ring'
  // Specialist — Mesenchymal
  | 'mes_spindle_cells' | 'mes_stellate_cells' | 'mes_bare_nuclei'
  | 'mes_nuclear_pleomorphism' | 'mes_high_nc_ratio' | 'mes_mitoses' | 'mes_lipid_vacuoles'
  // Specialist — Round Cells
  | 'rc_mast_cell_granules' | 'rc_mast_cell_degranulated' | 'rc_lymphoblasts'
  | 'rc_small_lymphocytes' | 'rc_plasma_cells' | 'rc_russell_bodies'
  | 'rc_histiocytes' | 'rc_tvt_cells' | 'rc_binucleation'
  // Specialist — Lymph node
  | 'ln_reactive_pattern' | 'ln_lymphoblasts_many' | 'ln_monomorphic_population'
  | 'ln_plasma_cells_many' | 'ln_neutrophils_many' | 'ln_eosinophils_many'
  // Specialist — Organ-specific
  | 'liver_hepatocytes' | 'liver_vacuolation' | 'liver_bile_pigment'
  | 'spleen_hematopoiesis' | 'spleen_lymphoid'
  // Effusion
  | 'eff_transudate' | 'eff_modified_transudate' | 'eff_exudate' | 'eff_hemorrhagic'
  | 'eff_chylous' | 'eff_septic' | 'eff_neoplastic_cells'
  // Malignancy criteria
  | 'malig_criteria_1' | 'malig_criteria_2' | 'malig_criteria_3'
  | 'malig_criteria_4' | 'malig_criteria_5'
