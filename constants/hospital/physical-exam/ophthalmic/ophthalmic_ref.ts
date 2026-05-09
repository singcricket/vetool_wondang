// ============================================================
// ophthalmic_ref.ts
// 소동물 안과 검진 Reference Database (v1.0.0)
// Small Animal Ophthalmic Examination Reference Database
// ============================================================

// ============================================================
// SECTION 1: TYPE DEFINITIONS
// ============================================================

export type Species = 'dog' | 'cat' | 'both'
export type ClinicalSignificance = 'low' | 'medium' | 'high' | 'critical'

export type OphExamDomain =
  | 'gross_inspection'
  | 'functional_tests'
  | 'iop'
  | 'slit_lamp_cornea'
  | 'slit_lamp_ac'
  | 'slit_lamp_iris'
  | 'slit_lamp_lens'
  | 'fundoscopy'
  | 'ocular_ultrasound'
  | 'extraocular'
  | 'vision_assessment'

export interface DependsOn {
  testID: string
  triggerValues: string[]
}

export interface SelectOption {
  value: string
  label: string
  labelKo: string
  resultText: string
  resultTextKo: string
  isAbnormal: boolean
  severity?: 'mild' | 'moderate' | 'severe' | 'critical'
  signs?: OphthalmicSign[]
}

interface BaseOphTest {
  testID: string
  testName: string
  testNameKo: string
  domain: OphExamDomain
  eye: 'OD' | 'OS' | 'OU' | 'global'
  species: Species
  required: boolean
  clinicalSignificance: ClinicalSignificance
  dependsOn?: DependsOn | DependsOn[]
  howTo?: string
  note?: string
  displayLevel?: number
}

export interface SelectOphTest extends BaseOphTest {
  testType: 'select'
  options: SelectOption[]
}
export interface MultiSelectOphTest extends BaseOphTest {
  testType: 'multiselect'
  options: SelectOption[]
}
export interface BooleanOphTest extends BaseOphTest {
  testType: 'boolean'
  positiveLabel: string
  positiveLabelKo: string
  negativeLabel: string
  negativeLabelKo: string
  positiveIsAbnormal: boolean
  positiveSigns?: OphthalmicSign[]
  negativeSigns?: OphthalmicSign[]
}

interface RangeSegment {
  min: number | null
  max: number | null
  resultText: string
  resultTextKo: string
  isAbnormal: boolean
  severity?: 'mild' | 'moderate' | 'severe' | 'critical'
  signs?: OphthalmicSign[]
}

export interface RangeOphTest extends BaseOphTest {
  testType: 'range'
  unit: string
  normalRange?: {
    dog?: { min?: number; max?: number }
    cat?: { min?: number; max?: number }
  }
  ranges: RangeSegment[]
}

export interface TextOphTest extends BaseOphTest {
  testType: 'text'
  placeholder?: string
}

export type OphTestItem =
  | SelectOphTest
  | MultiSelectOphTest
  | BooleanOphTest
  | RangeOphTest
  | TextOphTest

export interface OphDomainStatusGate {
  testID: string
  displayText: string
  displayTextKo: string
  normalValue: string
  abnormalValue: string
}

export interface OphDomainSection {
  domain: OphExamDomain
  domainName: string
  domainNameKo: string
  examOrder: number
  statusGate: OphDomainStatusGate
  tests: OphTestItem[]
}

export interface DiagnosisRule {
  diagnosisID: string
  diagnosisName: string
  diagnosisNameKo: string
  abbreviation?: string
  category: 'cornea' | 'glaucoma' | 'uveitis' | 'lens' | 'retina' | 'optic_nerve' | 'orbit' | 'neurological' | 'systemic' | 'vision_loss'
  requiredSigns: OphthalmicSign[]
  supportingSigns: OphthalmicSign[]
  exclusionSigns?: OphthalmicSign[]
  baseConfidence: number
  supportingWeight: number
  maxConfidence: number
  descriptionKo: string
  treatmentHintKo?: string
  ddx?: string[]
}

export interface OphDiagnosisResult {
  rule: DiagnosisRule
  confidenceScore: number
  matchedSigns: OphthalmicSign[]
  missingRequiredSigns: OphthalmicSign[]
}

export interface OphEngineOutput {
  activeSigns: OphthalmicSign[]
  diagnoses: OphDiagnosisResult[]
  criticalFindings: string[]
  visionStatus: {
    od: 'visual' | 'impaired' | 'blind' | 'unknown'
    os: 'visual' | 'impaired' | 'blind' | 'unknown'
  }
}

// ============================================================
// SECTION 2: OPHTHALMIC SIGN TAXONOMY
// ============================================================

export type OphthalmicSign =
  // Vision status
  | 'blind_od' | 'blind_os' | 'bilateral_blindness' | 'sudden_blindness'
  | 'rapd_od' | 'rapd_os' | 'menace_deficit_od' | 'menace_deficit_os'
  | 'dazzle_deficit_od' | 'dazzle_deficit_os'
  | 'plr_direct_deficit_od' | 'plr_direct_deficit_os'
  | 'plr_indirect_deficit_od' | 'plr_indirect_deficit_os'
  // Tear film
  | 'dry_eye_od' | 'dry_eye_os' | 'epiphora_od' | 'epiphora_os'
  // Cornea
  | 'corneal_ulcer_od' | 'corneal_ulcer_os'
  | 'deep_ulcer_od' | 'deep_ulcer_os'
  | 'descemetocele_od' | 'descemetocele_os'
  | 'corneal_opacity_od' | 'corneal_opacity_os'
  | 'corneal_vascularization_od' | 'corneal_vascularization_os'
  | 'corneal_pigmentation_od' | 'corneal_pigmentation_os'
  | 'corneal_sequestrum_os' | 'corneal_sequestrum_od'
  // Anterior chamber / Uveitis
  | 'uveitis_od' | 'uveitis_os'
  | 'hyphema_od' | 'hyphema_os'
  | 'hypopyon_od' | 'hypopyon_os'
  | 'shallow_ac_od' | 'shallow_ac_os'
  | 'deep_ac_od' | 'deep_ac_os'
  | 'ac_flare_od' | 'ac_flare_os'
  // IOP
  | 'high_iop_od' | 'high_iop_os'
  | 'very_high_iop_od' | 'very_high_iop_os'
  | 'low_iop_od' | 'low_iop_os'
  // Iris
  | 'synechia_posterior_od' | 'synechia_posterior_os'
  | 'iris_bombe_od' | 'iris_bombe_os'
  | 'iris_mass_od' | 'iris_mass_os'
  | 'mydriasis_od' | 'mydriasis_os'
  | 'miosis_od' | 'miosis_os'
  | 'iris_atrophy_od' | 'iris_atrophy_os'
  // Lens
  | 'cataract_od' | 'cataract_os'
  | 'mature_cataract_od' | 'mature_cataract_os'
  | 'hypermature_cataract_od' | 'hypermature_cataract_os'
  | 'diabetic_cataract_suspect_od' | 'diabetic_cataract_suspect_os'
  | 'lens_luxation_od' | 'lens_luxation_os'
  | 'lens_subluxation_od' | 'lens_subluxation_os'
  | 'nuclear_sclerosis_od' | 'nuclear_sclerosis_os'
  // Fundus / Retina
  | 'retinal_detachment_od' | 'retinal_detachment_os'
  | 'retinal_hemorrhage_od' | 'retinal_hemorrhage_os'
  | 'retinal_degeneration_od' | 'retinal_degeneration_os'
  | 'pra_suspect_od' | 'pra_suspect_os'
  | 'sard_suspect'
  | 'chorioretinitis_od' | 'chorioretinitis_os'
  | 'subretinal_fluid_od' | 'subretinal_fluid_os'
  | 'tapetal_hyperreflectivity_od' | 'tapetal_hyperreflectivity_os'
  | 'retinal_folds_od' | 'retinal_folds_os'
  | 'retinal_hemorrhage_multifocal'
  | 'hypertensive_retinopathy_suspect'
  // Optic disc
  | 'optic_neuritis_od' | 'optic_neuritis_os'
  | 'papilledema_od' | 'papilledema_os'
  | 'optic_disc_pallor_od' | 'optic_disc_pallor_os'
  | 'optic_disc_cupping_od' | 'optic_disc_cupping_os'
  // Vitreous / Ultrasound
  | 'vitreous_opacity_od' | 'vitreous_opacity_os'
  | 'vitreous_hemorrhage_od' | 'vitreous_hemorrhage_os'
  | 'intraocular_mass_od' | 'intraocular_mass_os'
  | 'retinal_detachment_us_od' | 'retinal_detachment_us_os'
  // Extraocular / Orbit
  | 'proptosis_od' | 'proptosis_os'
  | 'enophthalmos_od' | 'enophthalmos_os'
  | 'third_eyelid_protrusion_od' | 'third_eyelid_protrusion_os'
  | 'ptosis_od' | 'ptosis_os'
  | 'orbital_mass_od' | 'orbital_mass_os'
  // Neurological / Systemic
  | 'horner_od' | 'horner_os'
  | 'immune_uveitis_suspect'
  | 'infectious_uveitis_suspect'
  | 'glaucoma_secondary_suspect_od' | 'glaucoma_secondary_suspect_os'
