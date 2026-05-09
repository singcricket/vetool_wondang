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

// ============================================================
// SECTION 3: HELPER
// ============================================================

function makeGate(domain: OphExamDomain): OphDomainStatusGate {
  return { testID: `${domain}_gate`, displayText: 'Abnormal findings present', displayTextKo: '이상 소견 있음', normalValue: 'normal', abnormalValue: 'abnormal' }
}

// ============================================================
// SECTION 4: DOMAIN A — GROSS INSPECTION (육안적 검사)
// ============================================================

const grossInspectionTests: OphTestItem[] = [
  {
    testID: 'globe_position_od', testName: 'Globe Position (OD)', testNameKo: '안구 위치 (우안)',
    domain: 'gross_inspection', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'high', testType: 'select',
    options: [
      { value: 'normal', label: 'Normal position', labelKo: '정상', resultText: 'Globe position normal OD', resultTextKo: '우안 안구 위치 정상', isAbnormal: false },
      { value: 'proptosis', label: 'Proptosis (exophthalmos)', labelKo: '안구 돌출(프랍토시스)', resultText: 'Proptosis OD', resultTextKo: '우안 안구 돌출', isAbnormal: true, severity: 'critical', signs: ['proptosis_od'] },
      { value: 'enophthalmos', label: 'Enophthalmos', labelKo: '안구 함몰', resultText: 'Enophthalmos OD', resultTextKo: '우안 안구 함몰', isAbnormal: true, severity: 'moderate', signs: ['enophthalmos_od'] },
      { value: 'strabismus_medial', label: 'Medial strabismus', labelKo: '내사시', resultText: 'Medial strabismus OD', resultTextKo: '우안 내사시', isAbnormal: true, severity: 'mild' },
      { value: 'strabismus_lateral', label: 'Lateral strabismus', labelKo: '외사시', resultText: 'Lateral strabismus OD', resultTextKo: '우안 외사시', isAbnormal: true, severity: 'mild' },
      { value: 'strabismus_dorsal', label: 'Dorsal strabismus', labelKo: '상사시', resultText: 'Dorsal strabismus OD', resultTextKo: '우안 상사시', isAbnormal: true, severity: 'mild' },
      { value: 'strabismus_ventral', label: 'Ventral strabismus', labelKo: '하사시', resultText: 'Ventral strabismus OD', resultTextKo: '우안 하사시', isAbnormal: true, severity: 'mild' },
    ],
  },
  {
    testID: 'globe_position_os', testName: 'Globe Position (OS)', testNameKo: '안구 위치 (좌안)',
    domain: 'gross_inspection', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'high', testType: 'select',
    options: [
      { value: 'normal', label: 'Normal position', labelKo: '정상', resultText: 'Globe position normal OS', resultTextKo: '좌안 안구 위치 정상', isAbnormal: false },
      { value: 'proptosis', label: 'Proptosis', labelKo: '안구 돌출', resultText: 'Proptosis OS', resultTextKo: '좌안 안구 돌출', isAbnormal: true, severity: 'critical', signs: ['proptosis_os'] },
      { value: 'enophthalmos', label: 'Enophthalmos', labelKo: '안구 함몰', resultText: 'Enophthalmos OS', resultTextKo: '좌안 안구 함몰', isAbnormal: true, severity: 'moderate', signs: ['enophthalmos_os'] },
      { value: 'strabismus_medial', label: 'Medial strabismus', labelKo: '내사시', resultText: 'Medial strabismus OS', resultTextKo: '좌안 내사시', isAbnormal: true, severity: 'mild' },
      { value: 'strabismus_lateral', label: 'Lateral strabismus', labelKo: '외사시', resultText: 'Lateral strabismus OS', resultTextKo: '좌안 외사시', isAbnormal: true, severity: 'mild' },
    ],
  },
  {
    testID: 'third_eyelid_od', testName: 'Third Eyelid (OD)', testNameKo: '제3안검 (우안)',
    domain: 'gross_inspection', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'medium', testType: 'select',
    options: [
      { value: 'normal', label: 'Normal — not visible', labelKo: '정상 (보이지 않음)', resultText: 'Third eyelid normal OD', resultTextKo: '우안 제3안검 정상', isAbnormal: false },
      { value: 'protruding', label: 'Protruding / Elevated', labelKo: '돌출/거상', resultText: 'Third eyelid protrusion OD', resultTextKo: '우안 제3안검 돌출', isAbnormal: true, severity: 'moderate', signs: ['third_eyelid_protrusion_od'] },
      { value: 'mass', label: 'Mass on third eyelid', labelKo: '제3안검 종괴', resultText: 'Mass on third eyelid OD', resultTextKo: '우안 제3안검 종괴', isAbnormal: true, severity: 'moderate' },
      { value: 'prolapse_gland', label: 'Prolapsed nictitans gland (cherry eye)', labelKo: '제3안검 선 탈출 (체리아이)', resultText: 'Prolapsed nictitans gland OD', resultTextKo: '우안 체리아이', isAbnormal: true, severity: 'mild' },
      { value: 'scrolled', label: 'Scrolled cartilage', labelKo: '연골 말림', resultText: 'Scrolled third eyelid cartilage OD', resultTextKo: '우안 제3안검 연골 말림', isAbnormal: true, severity: 'mild' },
    ],
  },
  {
    testID: 'third_eyelid_os', testName: 'Third Eyelid (OS)', testNameKo: '제3안검 (좌안)',
    domain: 'gross_inspection', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'medium', testType: 'select',
    options: [
      { value: 'normal', label: 'Normal', labelKo: '정상', resultText: 'Third eyelid normal OS', resultTextKo: '좌안 제3안검 정상', isAbnormal: false },
      { value: 'protruding', label: 'Protruding', labelKo: '돌출', resultText: 'Third eyelid protrusion OS', resultTextKo: '좌안 제3안검 돌출', isAbnormal: true, severity: 'moderate', signs: ['third_eyelid_protrusion_os'] },
      { value: 'mass', label: 'Mass on third eyelid', labelKo: '종괴', resultText: 'Mass on third eyelid OS', resultTextKo: '좌안 제3안검 종괴', isAbnormal: true, severity: 'moderate' },
      { value: 'prolapse_gland', label: 'Prolapsed nictitans gland', labelKo: '체리아이', resultText: 'Prolapsed nictitans gland OS', resultTextKo: '좌안 체리아이', isAbnormal: true, severity: 'mild' },
    ],
  },
  {
    testID: 'eyelid_od', testName: 'Eyelid Examination (OD)', testNameKo: '안검 검사 (우안)',
    domain: 'gross_inspection', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'medium', testType: 'multiselect',
    options: [
      { value: 'normal', label: 'Normal', labelKo: '정상', resultText: 'Eyelid normal OD', resultTextKo: '우안 안검 정상', isAbnormal: false },
      { value: 'entropion', label: 'Entropion', labelKo: '안검내반', resultText: 'Entropion OD', resultTextKo: '우안 안검내반', isAbnormal: true, severity: 'moderate' },
      { value: 'ectropion', label: 'Ectropion', labelKo: '안검외반', resultText: 'Ectropion OD', resultTextKo: '우안 안검외반', isAbnormal: true, severity: 'mild' },
      { value: 'trichiasis', label: 'Trichiasis / Distichiasis', labelKo: '첩모난생/삼모증', resultText: 'Trichiasis OD', resultTextKo: '우안 첩모난생', isAbnormal: true, severity: 'mild' },
      { value: 'lagophthalmos', label: 'Lagophthalmos (incomplete closure)', labelKo: '토끼눈(불완전 폐검)', resultText: 'Lagophthalmos OD', resultTextKo: '우안 토끼눈', isAbnormal: true, severity: 'moderate' },
      { value: 'ptosis', label: 'Ptosis (drooping)', labelKo: '안검 하수(프토시스)', resultText: 'Ptosis OD', resultTextKo: '우안 안검 하수', isAbnormal: true, severity: 'mild', signs: ['ptosis_od'] },
      { value: 'mass', label: 'Eyelid mass', labelKo: '안검 종괴', resultText: 'Eyelid mass OD', resultTextKo: '우안 안검 종괴', isAbnormal: true, severity: 'moderate' },
    ],
  },
  {
    testID: 'eyelid_os', testName: 'Eyelid Examination (OS)', testNameKo: '안검 검사 (좌안)',
    domain: 'gross_inspection', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'medium', testType: 'multiselect',
    options: [
      { value: 'normal', label: 'Normal', labelKo: '정상', resultText: 'Eyelid normal OS', resultTextKo: '좌안 안검 정상', isAbnormal: false },
      { value: 'entropion', label: 'Entropion', labelKo: '안검내반', resultText: 'Entropion OS', resultTextKo: '좌안 안검내반', isAbnormal: true, severity: 'moderate' },
      { value: 'ectropion', label: 'Ectropion', labelKo: '안검외반', resultText: 'Ectropion OS', resultTextKo: '좌안 안검외반', isAbnormal: true, severity: 'mild' },
      { value: 'trichiasis', label: 'Trichiasis', labelKo: '첩모난생', resultText: 'Trichiasis OS', resultTextKo: '좌안 첩모난생', isAbnormal: true, severity: 'mild' },
      { value: 'lagophthalmos', label: 'Lagophthalmos', labelKo: '토끼눈', resultText: 'Lagophthalmos OS', resultTextKo: '좌안 토끼눈', isAbnormal: true, severity: 'moderate' },
      { value: 'ptosis', label: 'Ptosis', labelKo: '안검 하수', resultText: 'Ptosis OS', resultTextKo: '좌안 안검 하수', isAbnormal: true, severity: 'mild', signs: ['ptosis_os'] },
      { value: 'mass', label: 'Eyelid mass', labelKo: '안검 종괴', resultText: 'Eyelid mass OS', resultTextKo: '좌안 안검 종괴', isAbnormal: true, severity: 'moderate' },
    ],
  },
  {
    testID: 'conjunctiva_od', testName: 'Conjunctiva (OD)', testNameKo: '결막 (우안)',
    domain: 'gross_inspection', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'medium', testType: 'multiselect',
    options: [
      { value: 'normal', label: 'Normal — pink, moist', labelKo: '정상 (분홍색, 습윤)', resultText: 'Conjunctiva normal OD', resultTextKo: '우안 결막 정상', isAbnormal: false },
      { value: 'hyperemia', label: 'Hyperaemia (redness)', labelKo: '충혈/발적', resultText: 'Conjunctival hyperaemia OD', resultTextKo: '우안 결막 충혈', isAbnormal: true, severity: 'mild' },
      { value: 'chemosis', label: 'Chemosis (oedema)', labelKo: '결막 부종', resultText: 'Conjunctival chemosis OD', resultTextKo: '우안 결막 부종', isAbnormal: true, severity: 'moderate' },
      { value: 'follicles', label: 'Follicles', labelKo: '여포 형성', resultText: 'Conjunctival follicles OD', resultTextKo: '우안 결막 여포', isAbnormal: true, severity: 'mild' },
      { value: 'pallor', label: 'Pallor (pale)', labelKo: '창백', resultText: 'Conjunctival pallor OD', resultTextKo: '우안 결막 창백', isAbnormal: true, severity: 'moderate' },
      { value: 'mass', label: 'Conjunctival mass', labelKo: '결막 종괴', resultText: 'Conjunctival mass OD', resultTextKo: '우안 결막 종괴', isAbnormal: true, severity: 'moderate' },
      { value: 'symblepharon', label: 'Symblepharon', labelKo: '결막 유착', resultText: 'Symblepharon OD', resultTextKo: '우안 결막 유착', isAbnormal: true, severity: 'moderate' },
    ],
  },
  {
    testID: 'conjunctiva_os', testName: 'Conjunctiva (OS)', testNameKo: '결막 (좌안)',
    domain: 'gross_inspection', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'medium', testType: 'multiselect',
    options: [
      { value: 'normal', label: 'Normal', labelKo: '정상', resultText: 'Conjunctiva normal OS', resultTextKo: '좌안 결막 정상', isAbnormal: false },
      { value: 'hyperemia', label: 'Hyperaemia', labelKo: '충혈', resultText: 'Conjunctival hyperaemia OS', resultTextKo: '좌안 결막 충혈', isAbnormal: true, severity: 'mild' },
      { value: 'chemosis', label: 'Chemosis', labelKo: '결막 부종', resultText: 'Conjunctival chemosis OS', resultTextKo: '좌안 결막 부종', isAbnormal: true, severity: 'moderate' },
      { value: 'follicles', label: 'Follicles', labelKo: '여포', resultText: 'Conjunctival follicles OS', resultTextKo: '좌안 결막 여포', isAbnormal: true, severity: 'mild' },
      { value: 'pallor', label: 'Pallor', labelKo: '창백', resultText: 'Conjunctival pallor OS', resultTextKo: '좌안 결막 창백', isAbnormal: true, severity: 'moderate' },
      { value: 'mass', label: 'Conjunctival mass', labelKo: '결막 종괴', resultText: 'Conjunctival mass OS', resultTextKo: '좌안 결막 종괴', isAbnormal: true, severity: 'moderate' },
    ],
  },
  {
    testID: 'discharge_od', testName: 'Ocular Discharge (OD)', testNameKo: '안구 분비물 (우안)',
    domain: 'gross_inspection', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'medium', testType: 'select',
    options: [
      { value: 'none', label: 'None', labelKo: '없음', resultText: 'No discharge OD', resultTextKo: '우안 분비물 없음', isAbnormal: false },
      { value: 'serous', label: 'Serous (clear, watery)', labelKo: '장액성 (맑고 수양성)', resultText: 'Serous discharge OD', resultTextKo: '우안 장액성 분비물', isAbnormal: true, severity: 'mild', signs: ['epiphora_od'] },
      { value: 'mucoid', label: 'Mucoid (thick, clear)', labelKo: '점액성 (두껍고 맑음)', resultText: 'Mucoid discharge OD', resultTextKo: '우안 점액성 분비물', isAbnormal: true, severity: 'mild' },
      { value: 'mucopurulent', label: 'Mucopurulent (yellow-green)', labelKo: '점액화농성 (노란-초록)', resultText: 'Mucopurulent discharge OD', resultTextKo: '우안 점액화농성 분비물', isAbnormal: true, severity: 'moderate' },
      { value: 'purulent', label: 'Purulent (frank pus)', labelKo: '화농성 (고름)', resultText: 'Purulent discharge OD', resultTextKo: '우안 화농성 분비물', isAbnormal: true, severity: 'severe' },
      { value: 'hemorrhagic', label: 'Haemorrhagic', labelKo: '혈성', resultText: 'Haemorrhagic discharge OD', resultTextKo: '우안 혈성 분비물', isAbnormal: true, severity: 'severe' },
    ],
  },
  {
    testID: 'discharge_os', testName: 'Ocular Discharge (OS)', testNameKo: '안구 분비물 (좌안)',
    domain: 'gross_inspection', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'medium', testType: 'select',
    options: [
      { value: 'none', label: 'None', labelKo: '없음', resultText: 'No discharge OS', resultTextKo: '좌안 분비물 없음', isAbnormal: false },
      { value: 'serous', label: 'Serous', labelKo: '장액성', resultText: 'Serous discharge OS', resultTextKo: '좌안 장액성 분비물', isAbnormal: true, severity: 'mild', signs: ['epiphora_os'] },
      { value: 'mucoid', label: 'Mucoid', labelKo: '점액성', resultText: 'Mucoid discharge OS', resultTextKo: '좌안 점액성 분비물', isAbnormal: true, severity: 'mild' },
      { value: 'mucopurulent', label: 'Mucopurulent', labelKo: '점액화농성', resultText: 'Mucopurulent discharge OS', resultTextKo: '좌안 점액화농성 분비물', isAbnormal: true, severity: 'moderate' },
      { value: 'purulent', label: 'Purulent', labelKo: '화농성', resultText: 'Purulent discharge OS', resultTextKo: '좌안 화농성 분비물', isAbnormal: true, severity: 'severe' },
    ],
  },
  {
    testID: 'pupil_size_od', testName: 'Pupil Size (OD)', testNameKo: '동공 크기 (우안)',
    domain: 'gross_inspection', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'high', testType: 'select',
    howTo: 'Examine in dim light. Compare symmetry between OD and OS.',
    options: [
      { value: 'normal', label: 'Normal (appropriate to light)', labelKo: '정상 (조도에 적절)', resultText: 'Pupil size normal OD', resultTextKo: '우안 동공 크기 정상', isAbnormal: false },
      { value: 'mydriasis', label: 'Mydriasis (fixed dilated)', labelKo: '산동 (고정 확장)', resultText: 'Fixed mydriasis OD', resultTextKo: '우안 고정 산동', isAbnormal: true, severity: 'critical', signs: ['mydriasis_od'] },
      { value: 'miosis', label: 'Miosis (constricted)', labelKo: '축동 (수축)', resultText: 'Miosis OD', resultTextKo: '우안 축동', isAbnormal: true, severity: 'moderate', signs: ['miosis_od'] },
      { value: 'anisocoria', label: 'Anisocoria (asymmetric vs OS)', labelKo: '동공 부동 (좌우 비대칭)', resultText: 'Anisocoria — OD abnormal', resultTextKo: '동공 부동 — 우안 이상', isAbnormal: true, severity: 'severe' },
    ],
  },
  {
    testID: 'pupil_size_os', testName: 'Pupil Size (OS)', testNameKo: '동공 크기 (좌안)',
    domain: 'gross_inspection', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'high', testType: 'select',
    options: [
      { value: 'normal', label: 'Normal', labelKo: '정상', resultText: 'Pupil size normal OS', resultTextKo: '좌안 동공 크기 정상', isAbnormal: false },
      { value: 'mydriasis', label: 'Mydriasis', labelKo: '산동', resultText: 'Fixed mydriasis OS', resultTextKo: '좌안 고정 산동', isAbnormal: true, severity: 'critical', signs: ['mydriasis_os'] },
      { value: 'miosis', label: 'Miosis', labelKo: '축동', resultText: 'Miosis OS', resultTextKo: '좌안 축동', isAbnormal: true, severity: 'moderate', signs: ['miosis_os'] },
      { value: 'anisocoria', label: 'Anisocoria (asymmetric vs OD)', labelKo: '동공 부동', resultText: 'Anisocoria — OS abnormal', resultTextKo: '동공 부동 — 좌안 이상', isAbnormal: true, severity: 'severe' },
    ],
  },
]


// ============================================================
// SECTION 5: DOMAIN B — FUNCTIONAL TESTS (기능 검사)
// ============================================================

const functionalTests: OphTestItem[] = [
  {
    testID: 'stt_od', testName: 'Schirmer Tear Test (OD)', testNameKo: 'STT 눈물 측정 (우안)',
    domain: 'functional_tests', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'high',
    howTo: 'STT strip in lower conjunctival fornix 60sec BEFORE drops. Dog normal >=15mm/min, Cat >=9mm/min.',
    testType: 'range', unit: 'mm/min',
    normalRange: { dog: { min: 15 }, cat: { min: 9 } },
    ranges: [
      { min: null, max: 5, resultText: 'Severe KCS OD', resultTextKo: '우안 중증 건성각막결막염', isAbnormal: true, severity: 'severe', signs: ['dry_eye_od'] },
      { min: 5, max: 10, resultText: 'Moderate KCS OD', resultTextKo: '우안 중등도 건성각막결막염', isAbnormal: true, severity: 'moderate', signs: ['dry_eye_od'] },
      { min: 10, max: 15, resultText: 'Borderline KCS OD (dog)', resultTextKo: '우안 경계성 KCS', isAbnormal: true, severity: 'mild', signs: ['dry_eye_od'] },
      { min: 15, max: null, resultText: 'Normal tear production OD', resultTextKo: '우안 눈물 분비 정상', isAbnormal: false },
    ],
  },
  {
    testID: 'stt_os', testName: 'Schirmer Tear Test (OS)', testNameKo: 'STT 눈물 측정 (좌안)',
    domain: 'functional_tests', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'high',
    testType: 'range', unit: 'mm/min',
    normalRange: { dog: { min: 15 }, cat: { min: 9 } },
    ranges: [
      { min: null, max: 5, resultText: 'Severe KCS OS', resultTextKo: '좌안 중증 건성각막결막염', isAbnormal: true, severity: 'severe', signs: ['dry_eye_os'] },
      { min: 5, max: 10, resultText: 'Moderate KCS OS', resultTextKo: '좌안 중등도 건성각막결막염', isAbnormal: true, severity: 'moderate', signs: ['dry_eye_os'] },
      { min: 10, max: 15, resultText: 'Borderline KCS OS', resultTextKo: '좌안 경계성 KCS', isAbnormal: true, severity: 'mild', signs: ['dry_eye_os'] },
      { min: 15, max: null, resultText: 'Normal tear production OS', resultTextKo: '좌안 눈물 분비 정상', isAbnormal: false },
    ],
  },
  {
    testID: 'fdt_od', testName: 'Fluorescein Dye Test (OD)', testNameKo: '형광 염색 검사 (우안)',
    domain: 'functional_tests', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'critical',
    howTo: 'Apply wetted fluorescein strip. Observe under cobalt-blue light. Positive=epithelial defect.',
    testType: 'select',
    options: [
      { value: 'negative', label: 'Negative — intact epithelium', labelKo: '음성 (각막 상피 정상)', resultText: 'FDT negative OD', resultTextKo: '우안 형광 음성', isAbnormal: false },
      { value: 'superficial', label: 'Positive — superficial erosion', labelKo: '양성 — 표층 미란', resultText: 'Superficial corneal erosion OD', resultTextKo: '우안 각막 표층 미란', isAbnormal: true, severity: 'mild', signs: ['corneal_ulcer_od'] },
      { value: 'stromal', label: 'Positive — stromal ulcer', labelKo: '양성 — 기질성 궤양', resultText: 'Corneal stromal ulcer OD', resultTextKo: '우안 기질성 각막 궤양', isAbnormal: true, severity: 'moderate', signs: ['corneal_ulcer_od', 'deep_ulcer_od'] },
      { value: 'deep', label: 'Positive — deep/near descemetocele', labelKo: '양성 — 심층/데스메막 노출 직전', resultText: 'Deep corneal ulcer OD', resultTextKo: '우안 심층 각막 궤양', isAbnormal: true, severity: 'critical', signs: ['deep_ulcer_od'] },
      { value: 'descemetocele', label: 'Descemetocele confirmed', labelKo: '데스메막 탈출 확인', resultText: 'Descemetocele OD', resultTextKo: '우안 데스메막 탈출', isAbnormal: true, severity: 'critical', signs: ['descemetocele_od'] },
    ],
  },
  {
    testID: 'fdt_os', testName: 'Fluorescein Dye Test (OS)', testNameKo: '형광 염색 검사 (좌안)',
    domain: 'functional_tests', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'critical',
    testType: 'select',
    options: [
      { value: 'negative', label: 'Negative', labelKo: '음성', resultText: 'FDT negative OS', resultTextKo: '좌안 형광 음성', isAbnormal: false },
      { value: 'superficial', label: 'Superficial erosion', labelKo: '표층 미란', resultText: 'Superficial erosion OS', resultTextKo: '좌안 각막 표층 미란', isAbnormal: true, severity: 'mild', signs: ['corneal_ulcer_os'] },
      { value: 'stromal', label: 'Stromal ulcer', labelKo: '기질성 궤양', resultText: 'Stromal ulcer OS', resultTextKo: '좌안 기질성 궤양', isAbnormal: true, severity: 'moderate', signs: ['corneal_ulcer_os', 'deep_ulcer_os'] },
      { value: 'deep', label: 'Deep ulcer', labelKo: '심층 궤양', resultText: 'Deep corneal ulcer OS', resultTextKo: '좌안 심층 각막 궤양', isAbnormal: true, severity: 'critical', signs: ['deep_ulcer_os'] },
      { value: 'descemetocele', label: 'Descemetocele', labelKo: '데스메막 탈출', resultText: 'Descemetocele OS', resultTextKo: '좌안 데스메막 탈출', isAbnormal: true, severity: 'critical', signs: ['descemetocele_os'] },
    ],
  },
  {
    testID: 'plr_direct_od', testName: 'Direct PLR (OD)', testNameKo: '직접 동공 반사 (우안)',
    domain: 'functional_tests', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'critical',
    howTo: 'Focal light into OD. OD constricts. Tests retina + CN II + CN III.',
    testType: 'select',
    options: [
      { value: 'brisk', label: 'Brisk / Normal', labelKo: '신속/정상', resultText: 'PLR direct brisk OD', resultTextKo: '우안 직접 동공 반사 정상', isAbnormal: false },
      { value: 'sluggish', label: 'Sluggish', labelKo: '느림/감소', resultText: 'PLR direct sluggish OD', resultTextKo: '우안 직접 동공 반사 감소', isAbnormal: true, severity: 'moderate', signs: ['plr_direct_deficit_od'] },
      { value: 'absent', label: 'Absent', labelKo: '소실', resultText: 'PLR direct absent OD', resultTextKo: '우안 직접 동공 반사 소실', isAbnormal: true, severity: 'critical', signs: ['plr_direct_deficit_od', 'blind_od'] },
    ],
  },
  {
    testID: 'plr_direct_os', testName: 'Direct PLR (OS)', testNameKo: '직접 동공 반사 (좌안)',
    domain: 'functional_tests', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'critical',
    testType: 'select',
    options: [
      { value: 'brisk', label: 'Brisk', labelKo: '정상', resultText: 'PLR direct brisk OS', resultTextKo: '좌안 직접 동공 반사 정상', isAbnormal: false },
      { value: 'sluggish', label: 'Sluggish', labelKo: '느림', resultText: 'PLR direct sluggish OS', resultTextKo: '좌안 직접 동공 반사 감소', isAbnormal: true, severity: 'moderate', signs: ['plr_direct_deficit_os'] },
      { value: 'absent', label: 'Absent', labelKo: '소실', resultText: 'PLR direct absent OS', resultTextKo: '좌안 직접 동공 반사 소실', isAbnormal: true, severity: 'critical', signs: ['plr_direct_deficit_os', 'blind_os'] },
    ],
  },
  {
    testID: 'plr_indirect_od', testName: 'Indirect PLR (OD light, OS response)', testNameKo: '간접 동공 반사 (우안 자극)',
    domain: 'functional_tests', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'high',
    testType: 'select',
    options: [
      { value: 'brisk', label: 'Brisk (OS constricts)', labelKo: '정상 (좌안 수축)', resultText: 'Consensual PLR normal (OD stim)', resultTextKo: '간접 동공 반사 정상', isAbnormal: false },
      { value: 'sluggish', label: 'Sluggish', labelKo: '느림', resultText: 'Consensual PLR sluggish', resultTextKo: '간접 동공 반사 감소', isAbnormal: true, severity: 'moderate', signs: ['plr_indirect_deficit_od'] },
      { value: 'absent', label: 'Absent', labelKo: '소실', resultText: 'Consensual PLR absent', resultTextKo: '간접 동공 반사 소실', isAbnormal: true, severity: 'critical', signs: ['plr_indirect_deficit_od'] },
    ],
  },
  {
    testID: 'plr_indirect_os', testName: 'Indirect PLR (OS light, OD response)', testNameKo: '간접 동공 반사 (좌안 자극)',
    domain: 'functional_tests', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'high',
    testType: 'select',
    options: [
      { value: 'brisk', label: 'Brisk', labelKo: '정상', resultText: 'Consensual PLR normal (OS stim)', resultTextKo: '간접 동공 반사 정상', isAbnormal: false },
      { value: 'sluggish', label: 'Sluggish', labelKo: '느림', resultText: 'Consensual PLR sluggish', resultTextKo: '간접 동공 반사 감소', isAbnormal: true, severity: 'moderate', signs: ['plr_indirect_deficit_os'] },
      { value: 'absent', label: 'Absent', labelKo: '소실', resultText: 'Consensual PLR absent', resultTextKo: '간접 동공 반사 소실', isAbnormal: true, severity: 'critical', signs: ['plr_indirect_deficit_os'] },
    ],
  },
  {
    testID: 'rapd_od', testName: 'RAPD — OD afferent', testNameKo: 'RAPD 검사 (우안 구심성 결손)',
    domain: 'functional_tests', eye: 'OD', species: 'both', required: false, clinicalSignificance: 'critical',
    howTo: 'Swinging flashlight test. RAPD+ = both pupils dilate when light moved to OD. Indicates asymmetric optic nerve/retinal disease.',
    testType: 'boolean',
    positiveLabel: 'RAPD present OD', positiveLabelKo: 'RAPD 양성 (우안)',
    negativeLabel: 'RAPD absent OD', negativeLabelKo: 'RAPD 음성 (우안)',
    positiveIsAbnormal: true, positiveSigns: ['rapd_od'],
  },
  {
    testID: 'rapd_os', testName: 'RAPD — OS afferent', testNameKo: 'RAPD 검사 (좌안 구심성 결손)',
    domain: 'functional_tests', eye: 'OS', species: 'both', required: false, clinicalSignificance: 'critical',
    testType: 'boolean',
    positiveLabel: 'RAPD present OS', positiveLabelKo: 'RAPD 양성 (좌안)',
    negativeLabel: 'RAPD absent OS', negativeLabelKo: 'RAPD 음성 (좌안)',
    positiveIsAbnormal: true, positiveSigns: ['rapd_os'],
  },
  {
    testID: 'menace_od', testName: 'Menace Response (OD)', testNameKo: '위협 반응 검사 (우안)',
    domain: 'functional_tests', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'critical',
    howTo: 'Threatening gesture toward OD. Normal=blink. Tests vision + CN VII. Cover OS during test.',
    testType: 'boolean',
    positiveLabel: 'Present (blinks)', positiveLabelKo: '양성 (눈 깜빡임)',
    negativeLabel: 'Absent (no blink)', negativeLabelKo: '음성 (반응 없음)',
    positiveIsAbnormal: false, negativeSigns: ['menace_deficit_od', 'blind_od'],
  },
  {
    testID: 'menace_os', testName: 'Menace Response (OS)', testNameKo: '위협 반응 검사 (좌안)',
    domain: 'functional_tests', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'critical',
    testType: 'boolean',
    positiveLabel: 'Present', positiveLabelKo: '양성',
    negativeLabel: 'Absent', negativeLabelKo: '음성',
    positiveIsAbnormal: false, negativeSigns: ['menace_deficit_os', 'blind_os'],
  },
  {
    testID: 'dazzle_od', testName: 'Dazzle Reflex (OD)', testNameKo: '눈부심 반사 (우안)',
    domain: 'functional_tests', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'high',
    howTo: 'Bright light into OD. Normal=blink. Subcortical reflex; preserved in cortical blindness.',
    testType: 'boolean',
    positiveLabel: 'Present', positiveLabelKo: '양성',
    negativeLabel: 'Absent', negativeLabelKo: '음성',
    positiveIsAbnormal: false, negativeSigns: ['dazzle_deficit_od'],
  },
  {
    testID: 'dazzle_os', testName: 'Dazzle Reflex (OS)', testNameKo: '눈부심 반사 (좌안)',
    domain: 'functional_tests', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'high',
    testType: 'boolean',
    positiveLabel: 'Present', positiveLabelKo: '양성',
    negativeLabel: 'Absent', negativeLabelKo: '음성',
    positiveIsAbnormal: false, negativeSigns: ['dazzle_deficit_os'],
  },
]

// ============================================================
// SECTION 6: DOMAIN C — INTRAOCULAR PRESSURE
// ============================================================

const iopTests: OphTestItem[] = [
  {
    testID: 'iop_od', testName: 'Intraocular Pressure (OD)', testNameKo: '안압 (우안)',
    domain: 'iop', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'critical',
    howTo: 'Rebound tonometer (TonoVet) preferred. 3 readings average. Measure BEFORE any drops. Normal 10-25 mmHg.',
    testType: 'range', unit: 'mmHg',
    normalRange: { dog: { min: 10, max: 25 }, cat: { min: 10, max: 25 } },
    ranges: [
      { min: null, max: 10, resultText: 'Hypotony OD', resultTextKo: '우안 저안압 — 포도막염/천공 의심', isAbnormal: true, severity: 'severe', signs: ['low_iop_od', 'uveitis_od'] },
      { min: 10, max: 25, resultText: 'IOP normal OD', resultTextKo: '우안 안압 정상', isAbnormal: false },
      { min: 25, max: 30, resultText: 'Borderline elevated IOP OD', resultTextKo: '우안 경계성 안압 상승', isAbnormal: true, severity: 'mild', signs: ['high_iop_od'] },
      { min: 30, max: 40, resultText: 'Elevated IOP OD — glaucoma likely', resultTextKo: '우안 안압 상승 — 녹내장 가능', isAbnormal: true, severity: 'moderate', signs: ['high_iop_od'] },
      { min: 40, max: null, resultText: 'Severely elevated IOP OD — acute glaucoma', resultTextKo: '우안 심각한 안압 상승 — 급성 녹내장', isAbnormal: true, severity: 'critical', signs: ['very_high_iop_od'] },
    ],
  },
  {
    testID: 'iop_os', testName: 'Intraocular Pressure (OS)', testNameKo: '안압 (좌안)',
    domain: 'iop', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'critical',
    testType: 'range', unit: 'mmHg',
    normalRange: { dog: { min: 10, max: 25 }, cat: { min: 10, max: 25 } },
    ranges: [
      { min: null, max: 10, resultText: 'Hypotony OS', resultTextKo: '좌안 저안압', isAbnormal: true, severity: 'severe', signs: ['low_iop_os', 'uveitis_os'] },
      { min: 10, max: 25, resultText: 'IOP normal OS', resultTextKo: '좌안 안압 정상', isAbnormal: false },
      { min: 25, max: 30, resultText: 'Borderline elevated IOP OS', resultTextKo: '좌안 경계성 안압 상승', isAbnormal: true, severity: 'mild', signs: ['high_iop_os'] },
      { min: 30, max: 40, resultText: 'Elevated IOP OS', resultTextKo: '좌안 안압 상승', isAbnormal: true, severity: 'moderate', signs: ['high_iop_os'] },
      { min: 40, max: null, resultText: 'Severely elevated IOP OS', resultTextKo: '좌안 심각한 안압 상승', isAbnormal: true, severity: 'critical', signs: ['very_high_iop_os'] },
    ],
  },
]

// ============================================================
// SECTION 7: DOMAIN D — SLIT LAMP: CORNEA (각막)
// ============================================================

const slitLampCorneaTests: OphTestItem[] = [
  {
    testID: 'cornea_clarity_od', testName: 'Corneal Clarity (OD)', testNameKo: '각막 투명도 (우안)',
    domain: 'slit_lamp_cornea', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'high',
    testType: 'select',
    options: [
      { value: 'clear', label: 'Clear / Transparent', labelKo: '투명 (정상)', resultText: 'Cornea clear OD', resultTextKo: '우안 각막 투명', isAbnormal: false },
      { value: 'mild_opacity', label: 'Mild focal opacity (oedema/scar)', labelKo: '경도 국소 혼탁 (부종/반흔)', resultText: 'Mild corneal opacity OD', resultTextKo: '우안 경도 각막 혼탁', isAbnormal: true, severity: 'mild', signs: ['corneal_opacity_od'] },
      { value: 'moderate_opacity', label: 'Moderate diffuse opacity', labelKo: '중등도 미만성 혼탁', resultText: 'Moderate corneal opacity OD', resultTextKo: '우안 중등도 각막 혼탁', isAbnormal: true, severity: 'moderate', signs: ['corneal_opacity_od'] },
      { value: 'severe_opacity', label: 'Severe opacity — vision impaired', labelKo: '심한 혼탁 — 시각 장애', resultText: 'Severe corneal opacity OD', resultTextKo: '우안 심한 각막 혼탁', isAbnormal: true, severity: 'severe', signs: ['corneal_opacity_od'] },
      { value: 'sequestrum', label: 'Corneal sequestrum (cat)', labelKo: '각막 격리부 (고양이)', resultText: 'Corneal sequestrum OD', resultTextKo: '우안 각막 격리부', isAbnormal: true, severity: 'moderate', signs: ['corneal_sequestrum_od'] },
    ],
  },
  {
    testID: 'cornea_clarity_os', testName: 'Corneal Clarity (OS)', testNameKo: '각막 투명도 (좌안)',
    domain: 'slit_lamp_cornea', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'high',
    testType: 'select',
    options: [
      { value: 'clear', label: 'Clear', labelKo: '투명', resultText: 'Cornea clear OS', resultTextKo: '좌안 각막 투명', isAbnormal: false },
      { value: 'mild_opacity', label: 'Mild opacity', labelKo: '경도 혼탁', resultText: 'Mild corneal opacity OS', resultTextKo: '좌안 경도 각막 혼탁', isAbnormal: true, severity: 'mild', signs: ['corneal_opacity_os'] },
      { value: 'moderate_opacity', label: 'Moderate opacity', labelKo: '중등도 혼탁', resultText: 'Moderate corneal opacity OS', resultTextKo: '좌안 중등도 각막 혼탁', isAbnormal: true, severity: 'moderate', signs: ['corneal_opacity_os'] },
      { value: 'severe_opacity', label: 'Severe opacity', labelKo: '심한 혼탁', resultText: 'Severe corneal opacity OS', resultTextKo: '좌안 심한 각막 혼탁', isAbnormal: true, severity: 'severe', signs: ['corneal_opacity_os'] },
      { value: 'sequestrum', label: 'Corneal sequestrum (cat)', labelKo: '각막 격리부', resultText: 'Corneal sequestrum OS', resultTextKo: '좌안 각막 격리부', isAbnormal: true, severity: 'moderate', signs: ['corneal_sequestrum_os'] },
    ],
  },
  {
    testID: 'corneal_vascularization_od', testName: 'Corneal Vascularisation (OD)', testNameKo: '각막 혈관 신생 (우안)',
    domain: 'slit_lamp_cornea', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'medium',
    testType: 'select',
    options: [
      { value: 'none', label: 'None', labelKo: '없음', resultText: 'No corneal vascularisation OD', resultTextKo: '우안 각막 혈관 신생 없음', isAbnormal: false },
      { value: 'superficial', label: 'Superficial — brush-like vessels', labelKo: '표층 혈관 (붓 모양)', resultText: 'Superficial corneal vascularisation OD', resultTextKo: '우안 각막 표층 혈관 신생', isAbnormal: true, severity: 'mild', signs: ['corneal_vascularization_od'] },
      { value: 'deep', label: 'Deep — straight vessels from limbus', labelKo: '심층 혈관 (윤부에서 직선)', resultText: 'Deep corneal vascularisation OD', resultTextKo: '우안 각막 심층 혈관 신생', isAbnormal: true, severity: 'moderate', signs: ['corneal_vascularization_od'] },
      { value: 'both', label: 'Superficial + deep', labelKo: '표층+심층 혼합', resultText: 'Mixed superficial and deep vascularisation OD', resultTextKo: '우안 혼합성 각막 혈관 신생', isAbnormal: true, severity: 'moderate', signs: ['corneal_vascularization_od'] },
    ],
  },
  {
    testID: 'corneal_vascularization_os', testName: 'Corneal Vascularisation (OS)', testNameKo: '각막 혈관 신생 (좌안)',
    domain: 'slit_lamp_cornea', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'medium',
    testType: 'select',
    options: [
      { value: 'none', label: 'None', labelKo: '없음', resultText: 'No vascularisation OS', resultTextKo: '좌안 혈관 신생 없음', isAbnormal: false },
      { value: 'superficial', label: 'Superficial', labelKo: '표층', resultText: 'Superficial vascularisation OS', resultTextKo: '좌안 각막 표층 혈관', isAbnormal: true, severity: 'mild', signs: ['corneal_vascularization_os'] },
      { value: 'deep', label: 'Deep', labelKo: '심층', resultText: 'Deep vascularisation OS', resultTextKo: '좌안 각막 심층 혈관', isAbnormal: true, severity: 'moderate', signs: ['corneal_vascularization_os'] },
      { value: 'both', label: 'Mixed', labelKo: '혼합', resultText: 'Mixed vascularisation OS', resultTextKo: '좌안 혼합성 각막 혈관', isAbnormal: true, severity: 'moderate', signs: ['corneal_vascularization_os'] },
    ],
  },
  {
    testID: 'corneal_pigmentation_od', testName: 'Corneal Pigmentation (OD)', testNameKo: '각막 색소 침착 (우안)',
    domain: 'slit_lamp_cornea', eye: 'OD', species: 'both', required: false, clinicalSignificance: 'medium',
    testType: 'boolean',
    positiveLabel: 'Pigmentation present', positiveLabelKo: '색소 침착 있음',
    negativeLabel: 'No pigmentation', negativeLabelKo: '색소 침착 없음',
    positiveIsAbnormal: true, positiveSigns: ['corneal_pigmentation_od'],
  },
  {
    testID: 'corneal_pigmentation_os', testName: 'Corneal Pigmentation (OS)', testNameKo: '각막 색소 침착 (좌안)',
    domain: 'slit_lamp_cornea', eye: 'OS', species: 'both', required: false, clinicalSignificance: 'medium',
    testType: 'boolean',
    positiveLabel: 'Pigmentation present', positiveLabelKo: '색소 침착 있음',
    negativeLabel: 'No pigmentation', negativeLabelKo: '색소 침착 없음',
    positiveIsAbnormal: true, positiveSigns: ['corneal_pigmentation_os'],
  },
]

// ============================================================
// SECTION 8: DOMAIN E — SLIT LAMP: ANTERIOR CHAMBER (전안방)
// ============================================================

const slitLampACTests: OphTestItem[] = [
  {
    testID: 'ac_depth_od', testName: 'Anterior Chamber Depth (OD)', testNameKo: '전안방 깊이 (우안)',
    domain: 'slit_lamp_ac', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'high',
    testType: 'select',
    options: [
      { value: 'normal', label: 'Normal depth', labelKo: '정상', resultText: 'AC depth normal OD', resultTextKo: '우안 전안방 깊이 정상', isAbnormal: false },
      { value: 'shallow', label: 'Shallow (iris bombe / forward lens)', labelKo: '얕음 (홍채 돌출/수정체 전방)', resultText: 'Shallow AC OD', resultTextKo: '우안 전안방 얕음', isAbnormal: true, severity: 'severe', signs: ['shallow_ac_od'] },
      { value: 'deep', label: 'Deep (aphakia / lens luxation)', labelKo: '깊음 (무수정체/수정체 탈구)', resultText: 'Deep AC OD — aphakia or lens luxation', resultTextKo: '우안 전안방 깊음 — 무수정체 또는 수정체 탈구', isAbnormal: true, severity: 'moderate', signs: ['deep_ac_od'] },
    ],
  },
  {
    testID: 'ac_depth_os', testName: 'Anterior Chamber Depth (OS)', testNameKo: '전안방 깊이 (좌안)',
    domain: 'slit_lamp_ac', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'high',
    testType: 'select',
    options: [
      { value: 'normal', label: 'Normal', labelKo: '정상', resultText: 'AC depth normal OS', resultTextKo: '좌안 전안방 깊이 정상', isAbnormal: false },
      { value: 'shallow', label: 'Shallow', labelKo: '얕음', resultText: 'Shallow AC OS', resultTextKo: '좌안 전안방 얕음', isAbnormal: true, severity: 'severe', signs: ['shallow_ac_os'] },
      { value: 'deep', label: 'Deep', labelKo: '깊음', resultText: 'Deep AC OS', resultTextKo: '좌안 전안방 깊음', isAbnormal: true, severity: 'moderate', signs: ['deep_ac_os'] },
    ],
  },
  {
    testID: 'ac_flare_od', testName: 'Aqueous Flare (OD)', testNameKo: '전방 혼탁/플레어 (우안)',
    domain: 'slit_lamp_ac', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'critical',
    howTo: 'Slit beam through AC. Flare = protein leakage (Tyndall effect). Grade 0-4.',
    testType: 'select',
    options: [
      { value: '0', label: '0 — None', labelKo: '0 — 없음', resultText: 'No aqueous flare OD', resultTextKo: '우안 전방 플레어 없음', isAbnormal: false },
      { value: '1', label: '+1 — Trace (faint)', labelKo: '+1 — 미미 (희미)', resultText: 'Trace aqueous flare OD', resultTextKo: '우안 미미한 전방 플레어', isAbnormal: true, severity: 'mild', signs: ['ac_flare_od', 'uveitis_od'] },
      { value: '2', label: '+2 — Moderate (iris/lens visible)', labelKo: '+2 — 중등도 (홍채/수정체 보임)', resultText: 'Moderate aqueous flare OD', resultTextKo: '우안 중등도 전방 플레어', isAbnormal: true, severity: 'moderate', signs: ['ac_flare_od', 'uveitis_od'] },
      { value: '3', label: '+3 — Marked (iris details hazy)', labelKo: '+3 — 현저 (홍채 세부 불분명)', resultText: 'Marked aqueous flare OD', resultTextKo: '우안 심한 전방 플레어', isAbnormal: true, severity: 'severe', signs: ['ac_flare_od', 'uveitis_od'] },
      { value: '4', label: '+4 — Intense (fibrin/plastic)', labelKo: '+4 — 심각 (섬유소/플라스틱)', resultText: 'Intense fibrinous aqueous OD', resultTextKo: '우안 심각한 섬유소성 전방 삼출', isAbnormal: true, severity: 'critical', signs: ['ac_flare_od', 'uveitis_od'] },
    ],
  },
  {
    testID: 'ac_flare_os', testName: 'Aqueous Flare (OS)', testNameKo: '전방 혼탁/플레어 (좌안)',
    domain: 'slit_lamp_ac', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'critical',
    testType: 'select',
    options: [
      { value: '0', label: '0 — None', labelKo: '0 — 없음', resultText: 'No aqueous flare OS', resultTextKo: '좌안 전방 플레어 없음', isAbnormal: false },
      { value: '1', label: '+1 Trace', labelKo: '+1 미미', resultText: 'Trace flare OS', resultTextKo: '좌안 미미한 플레어', isAbnormal: true, severity: 'mild', signs: ['ac_flare_os', 'uveitis_os'] },
      { value: '2', label: '+2 Moderate', labelKo: '+2 중등도', resultText: 'Moderate flare OS', resultTextKo: '좌안 중등도 플레어', isAbnormal: true, severity: 'moderate', signs: ['ac_flare_os', 'uveitis_os'] },
      { value: '3', label: '+3 Marked', labelKo: '+3 현저', resultText: 'Marked flare OS', resultTextKo: '좌안 심한 플레어', isAbnormal: true, severity: 'severe', signs: ['ac_flare_os', 'uveitis_os'] },
      { value: '4', label: '+4 Fibrinous', labelKo: '+4 섬유소성', resultText: 'Intense fibrinous flare OS', resultTextKo: '좌안 심각한 섬유소성 플레어', isAbnormal: true, severity: 'critical', signs: ['ac_flare_os', 'uveitis_os'] },
    ],
  },
  {
    testID: 'hyphema_od', testName: 'Hyphema (OD)', testNameKo: '전방 출혈 (우안)',
    domain: 'slit_lamp_ac', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'critical',
    testType: 'boolean',
    positiveLabel: 'Hyphema present', positiveLabelKo: '전방 출혈 있음',
    negativeLabel: 'No hyphema', negativeLabelKo: '전방 출혈 없음',
    positiveIsAbnormal: true, positiveSigns: ['hyphema_od', 'uveitis_od'],
  },
  {
    testID: 'hyphema_os', testName: 'Hyphema (OS)', testNameKo: '전방 출혈 (좌안)',
    domain: 'slit_lamp_ac', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'critical',
    testType: 'boolean',
    positiveLabel: 'Hyphema present', positiveLabelKo: '전방 출혈 있음',
    negativeLabel: 'No hyphema', negativeLabelKo: '전방 출혈 없음',
    positiveIsAbnormal: true, positiveSigns: ['hyphema_os', 'uveitis_os'],
  },
  {
    testID: 'hypopyon_od', testName: 'Hypopyon (OD)', testNameKo: '전방 축농 (우안)',
    domain: 'slit_lamp_ac', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'critical',
    testType: 'boolean',
    positiveLabel: 'Hypopyon present', positiveLabelKo: '전방 축농 있음',
    negativeLabel: 'No hypopyon', negativeLabelKo: '전방 축농 없음',
    positiveIsAbnormal: true, positiveSigns: ['hypopyon_od', 'uveitis_od'],
  },
  {
    testID: 'hypopyon_os', testName: 'Hypopyon (OS)', testNameKo: '전방 축농 (좌안)',
    domain: 'slit_lamp_ac', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'critical',
    testType: 'boolean',
    positiveLabel: 'Hypopyon present', positiveLabelKo: '전방 축농 있음',
    negativeLabel: 'No hypopyon', negativeLabelKo: '전방 축농 없음',
    positiveIsAbnormal: true, positiveSigns: ['hypopyon_os', 'uveitis_os'],
  },
]

// ============================================================
// SECTION 9: DOMAIN F — SLIT LAMP: IRIS (홍채)
// ============================================================

const slitLampIrisTests: OphTestItem[] = [
  {
    testID: 'iris_appearance_od', testName: 'Iris Appearance (OD)', testNameKo: '홍채 외관 (우안)',
    domain: 'slit_lamp_iris', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'high',
    testType: 'multiselect',
    options: [
      { value: 'normal', label: 'Normal texture and colour', labelKo: '정상 질감 및 색상', resultText: 'Iris normal OD', resultTextKo: '우안 홍채 정상', isAbnormal: false },
      { value: 'hyperemia', label: 'Iris hyperaemia (rubeosis)', labelKo: '홍채 충혈 (루베오시스)', resultText: 'Iris hyperaemia OD', resultTextKo: '우안 홍채 충혈', isAbnormal: true, severity: 'moderate', signs: ['uveitis_od'] },
      { value: 'synechia_posterior', label: 'Posterior synechia (iris adhered to lens)', labelKo: '후방 유착 (홍채-수정체)', resultText: 'Posterior synechia OD', resultTextKo: '우안 후방 유착', isAbnormal: true, severity: 'moderate', signs: ['synechia_posterior_od', 'uveitis_od'] },
      { value: 'iris_bombe', label: 'Iris bombe (forward bowing)', labelKo: '홍채 팽융', resultText: 'Iris bombe OD', resultTextKo: '우안 홍채 팽융', isAbnormal: true, severity: 'critical', signs: ['iris_bombe_od', 'shallow_ac_od'] },
      { value: 'atrophy', label: 'Iris atrophy (transillumination defects)', labelKo: '홍채 위축', resultText: 'Iris atrophy OD', resultTextKo: '우안 홍채 위축', isAbnormal: true, severity: 'moderate', signs: ['iris_atrophy_od'] },
      { value: 'mass', label: 'Iris mass / melanoma', labelKo: '홍채 종괴/흑색종', resultText: 'Iris mass OD — neoplasia suspected', resultTextKo: '우안 홍채 종괴 — 종양 의심', isAbnormal: true, severity: 'critical', signs: ['iris_mass_od'] },
    ],
  },
  {
    testID: 'iris_appearance_os', testName: 'Iris Appearance (OS)', testNameKo: '홍채 외관 (좌안)',
    domain: 'slit_lamp_iris', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'high',
    testType: 'multiselect',
    options: [
      { value: 'normal', label: 'Normal', labelKo: '정상', resultText: 'Iris normal OS', resultTextKo: '좌안 홍채 정상', isAbnormal: false },
      { value: 'hyperemia', label: 'Iris hyperaemia', labelKo: '홍채 충혈', resultText: 'Iris hyperaemia OS', resultTextKo: '좌안 홍채 충혈', isAbnormal: true, severity: 'moderate', signs: ['uveitis_os'] },
      { value: 'synechia_posterior', label: 'Posterior synechia', labelKo: '후방 유착', resultText: 'Posterior synechia OS', resultTextKo: '좌안 후방 유착', isAbnormal: true, severity: 'moderate', signs: ['synechia_posterior_os', 'uveitis_os'] },
      { value: 'iris_bombe', label: 'Iris bombe', labelKo: '홍채 팽융', resultText: 'Iris bombe OS', resultTextKo: '좌안 홍채 팽융', isAbnormal: true, severity: 'critical', signs: ['iris_bombe_os', 'shallow_ac_os'] },
      { value: 'atrophy', label: 'Iris atrophy', labelKo: '홍채 위축', resultText: 'Iris atrophy OS', resultTextKo: '좌안 홍채 위축', isAbnormal: true, severity: 'moderate', signs: ['iris_atrophy_os'] },
      { value: 'mass', label: 'Iris mass', labelKo: '홍채 종괴', resultText: 'Iris mass OS', resultTextKo: '좌안 홍채 종괴', isAbnormal: true, severity: 'critical', signs: ['iris_mass_os'] },
    ],
  },
]

// ============================================================
// SECTION 10: DOMAIN G — SLIT LAMP: LENS (수정체)
// Full cataract grading: maturity + location + suspected aetiology
// ============================================================

const slitLampLensTests: OphTestItem[] = [
  {
    testID: 'lens_clarity_od', testName: 'Lens Clarity / Nuclear Sclerosis (OD)', testNameKo: '수정체 투명도/핵 경화 (우안)',
    domain: 'slit_lamp_lens', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'critical',
    howTo: 'Retroillumination (tapetal reflex) + direct slit beam. Distinguish nuclear sclerosis (tapetal reflex present) from cataract (reflex blocked).',
    testType: 'select',
    options: [
      { value: 'clear', label: 'Clear / Transparent', labelKo: '투명 (정상)', resultText: 'Lens clear OD', resultTextKo: '우안 수정체 투명', isAbnormal: false },
      { value: 'nuclear_sclerosis', label: 'Nuclear sclerosis (age-related, not cataract)', labelKo: '핵 경화 (노령성, 백내장 아님)', resultText: 'Nuclear sclerosis OD — not cataract', resultTextKo: '우안 핵 경화 — 백내장 아님', isAbnormal: false, signs: ['nuclear_sclerosis_od'] },
      { value: 'incipient', label: 'Incipient cataract (<15% opacity, no vision impairment)', labelKo: '초기 백내장 (<15% 혼탁, 시각 유지)', resultText: 'Incipient cataract OD', resultTextKo: '우안 초기 백내장', isAbnormal: true, severity: 'mild', signs: ['cataract_od'] },
      { value: 'immature', label: 'Immature cataract (15-99%, tapetal reflex present, vision reduced)', labelKo: '미성숙 백내장 (15-99%, 반사광 있음, 시각 감소)', resultText: 'Immature cataract OD — vision reduced', resultTextKo: '우안 미성숙 백내장 — 시각 감소', isAbnormal: true, severity: 'moderate', signs: ['cataract_od'] },
      { value: 'mature', label: 'Mature cataract (100% opacity, no tapetal reflex, blind)', labelKo: '성숙 백내장 (100% 혼탁, 반사광 없음, 실명)', resultText: 'Mature cataract OD — functional blindness', resultTextKo: '우안 성숙 백내장 — 기능적 실명', isAbnormal: true, severity: 'severe', signs: ['cataract_od', 'mature_cataract_od', 'blind_od'] },
      { value: 'hypermature', label: 'Hypermature cataract (liquefied cortex, wrinkled capsule)', labelKo: '과성숙 백내장 (피질 액화, 피막 수축)', resultText: 'Hypermature / Morgagnian cataract OD', resultTextKo: '우안 과성숙 백내장', isAbnormal: true, severity: 'critical', signs: ['cataract_od', 'hypermature_cataract_od', 'blind_od'] },
    ],
  },
  {
    testID: 'lens_clarity_os', testName: 'Lens Clarity / Nuclear Sclerosis (OS)', testNameKo: '수정체 투명도/핵 경화 (좌안)',
    domain: 'slit_lamp_lens', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'critical',
    testType: 'select',
    options: [
      { value: 'clear', label: 'Clear', labelKo: '투명', resultText: 'Lens clear OS', resultTextKo: '좌안 수정체 투명', isAbnormal: false },
      { value: 'nuclear_sclerosis', label: 'Nuclear sclerosis', labelKo: '핵 경화', resultText: 'Nuclear sclerosis OS', resultTextKo: '좌안 핵 경화', isAbnormal: false, signs: ['nuclear_sclerosis_os'] },
      { value: 'incipient', label: 'Incipient cataract', labelKo: '초기 백내장', resultText: 'Incipient cataract OS', resultTextKo: '좌안 초기 백내장', isAbnormal: true, severity: 'mild', signs: ['cataract_os'] },
      { value: 'immature', label: 'Immature cataract', labelKo: '미성숙 백내장', resultText: 'Immature cataract OS', resultTextKo: '좌안 미성숙 백내장', isAbnormal: true, severity: 'moderate', signs: ['cataract_os'] },
      { value: 'mature', label: 'Mature cataract', labelKo: '성숙 백내장', resultText: 'Mature cataract OS', resultTextKo: '좌안 성숙 백내장', isAbnormal: true, severity: 'severe', signs: ['cataract_os', 'mature_cataract_os', 'blind_os'] },
      { value: 'hypermature', label: 'Hypermature cataract', labelKo: '과성숙 백내장', resultText: 'Hypermature cataract OS', resultTextKo: '좌안 과성숙 백내장', isAbnormal: true, severity: 'critical', signs: ['cataract_os', 'hypermature_cataract_os', 'blind_os'] },
    ],
  },
  {
    testID: 'cataract_location_od', testName: 'Cataract Location (OD)', testNameKo: '백내장 위치 (우안)',
    domain: 'slit_lamp_lens', eye: 'OD', species: 'both', required: false, clinicalSignificance: 'high',
    dependsOn: { testID: 'lens_clarity_od', triggerValues: ['incipient', 'immature', 'mature', 'hypermature'] },
    testType: 'multiselect',
    options: [
      { value: 'nuclear', label: 'Nuclear', labelKo: '핵성', resultText: 'Nuclear cataract OD', resultTextKo: '우안 핵성 백내장', isAbnormal: true },
      { value: 'ant_cortical', label: 'Anterior cortical', labelKo: '전피질성', resultText: 'Anterior cortical cataract OD', resultTextKo: '우안 전피질성 백내장', isAbnormal: true },
      { value: 'post_cortical', label: 'Posterior cortical', labelKo: '후피질성', resultText: 'Posterior cortical cataract OD', resultTextKo: '우안 후피질성 백내장', isAbnormal: true },
      { value: 'equatorial', label: 'Equatorial cortical', labelKo: '적도부 피질성', resultText: 'Equatorial cataract OD', resultTextKo: '우안 적도부 백내장', isAbnormal: true },
      { value: 'psc', label: 'Posterior subcapsular (PSC)', labelKo: '후낭하성 (PSC)', resultText: 'Posterior subcapsular cataract OD', resultTextKo: '우안 후낭하 백내장', isAbnormal: true },
      { value: 'asc', label: 'Anterior subcapsular (ASC)', labelKo: '전낭하성 (ASC)', resultText: 'Anterior subcapsular cataract OD', resultTextKo: '우안 전낭하 백내장', isAbnormal: true },
      { value: 'total', label: 'Total / Diffuse', labelKo: '전체성/미만성', resultText: 'Total cataract OD', resultTextKo: '우안 전체성 백내장', isAbnormal: true },
    ],
  },
  {
    testID: 'cataract_location_os', testName: 'Cataract Location (OS)', testNameKo: '백내장 위치 (좌안)',
    domain: 'slit_lamp_lens', eye: 'OS', species: 'both', required: false, clinicalSignificance: 'high',
    dependsOn: { testID: 'lens_clarity_os', triggerValues: ['incipient', 'immature', 'mature', 'hypermature'] },
    testType: 'multiselect',
    options: [
      { value: 'nuclear', label: 'Nuclear', labelKo: '핵성', resultText: 'Nuclear cataract OS', resultTextKo: '좌안 핵성 백내장', isAbnormal: true },
      { value: 'ant_cortical', label: 'Anterior cortical', labelKo: '전피질성', resultText: 'Anterior cortical cataract OS', resultTextKo: '좌안 전피질성 백내장', isAbnormal: true },
      { value: 'post_cortical', label: 'Posterior cortical', labelKo: '후피질성', resultText: 'Posterior cortical cataract OS', resultTextKo: '좌안 후피질성 백내장', isAbnormal: true },
      { value: 'equatorial', label: 'Equatorial', labelKo: '적도부', resultText: 'Equatorial cataract OS', resultTextKo: '좌안 적도부 백내장', isAbnormal: true },
      { value: 'psc', label: 'PSC', labelKo: '후낭하성', resultText: 'PSC OS', resultTextKo: '좌안 후낭하 백내장', isAbnormal: true },
      { value: 'asc', label: 'ASC', labelKo: '전낭하성', resultText: 'ASC OS', resultTextKo: '좌안 전낭하 백내장', isAbnormal: true },
      { value: 'total', label: 'Total', labelKo: '전체성', resultText: 'Total cataract OS', resultTextKo: '좌안 전체성 백내장', isAbnormal: true },
    ],
  },
  {
    testID: 'cataract_etiology_od', testName: 'Suspected Cataract Aetiology (OD)', testNameKo: '백내장 추정 원인 (우안)',
    domain: 'slit_lamp_lens', eye: 'OD', species: 'both', required: false, clinicalSignificance: 'high',
    dependsOn: { testID: 'lens_clarity_od', triggerValues: ['incipient', 'immature', 'mature', 'hypermature'] },
    testType: 'select',
    options: [
      { value: 'hereditary', label: 'Hereditary / Breed-related', labelKo: '유전성/품종 관련', resultText: 'Hereditary cataract OD suspected', resultTextKo: '우안 유전성 백내장 의심', isAbnormal: true },
      { value: 'diabetic', label: 'Diabetic (rapid bilateral, cortical)', labelKo: '당뇨성 (빠른 양측성, 피질성)', resultText: 'Diabetic cataract OD suspected', resultTextKo: '우안 당뇨성 백내장 의심', isAbnormal: true, signs: ['diabetic_cataract_suspect_od'] },
      { value: 'post_uveitis', label: 'Post-uveitis / Inflammatory', labelKo: '포도막염 후/염증성', resultText: 'Post-uveitis cataract OD', resultTextKo: '우안 포도막염 후 백내장', isAbnormal: true },
      { value: 'traumatic', label: 'Traumatic', labelKo: '외상성', resultText: 'Traumatic cataract OD', resultTextKo: '우안 외상성 백내장', isAbnormal: true },
      { value: 'senile', label: 'Age-related / Senile', labelKo: '노령성', resultText: 'Senile cataract OD', resultTextKo: '우안 노령성 백내장', isAbnormal: true },
      { value: 'radiation', label: 'Radiation-induced', labelKo: '방사선 유발', resultText: 'Radiation-induced cataract OD', resultTextKo: '우안 방사선 유발 백내장', isAbnormal: true },
      { value: 'unknown', label: 'Unknown / Idiopathic', labelKo: '불명/특발성', resultText: 'Idiopathic cataract OD', resultTextKo: '우안 특발성 백내장', isAbnormal: true },
    ],
  },
  {
    testID: 'cataract_etiology_os', testName: 'Suspected Cataract Aetiology (OS)', testNameKo: '백내장 추정 원인 (좌안)',
    domain: 'slit_lamp_lens', eye: 'OS', species: 'both', required: false, clinicalSignificance: 'high',
    dependsOn: { testID: 'lens_clarity_os', triggerValues: ['incipient', 'immature', 'mature', 'hypermature'] },
    testType: 'select',
    options: [
      { value: 'hereditary', label: 'Hereditary', labelKo: '유전성', resultText: 'Hereditary cataract OS', resultTextKo: '좌안 유전성 백내장', isAbnormal: true },
      { value: 'diabetic', label: 'Diabetic', labelKo: '당뇨성', resultText: 'Diabetic cataract OS', resultTextKo: '좌안 당뇨성 백내장', isAbnormal: true, signs: ['diabetic_cataract_suspect_os'] },
      { value: 'post_uveitis', label: 'Post-uveitis', labelKo: '포도막염 후', resultText: 'Post-uveitis cataract OS', resultTextKo: '좌안 포도막염 후 백내장', isAbnormal: true },
      { value: 'traumatic', label: 'Traumatic', labelKo: '외상성', resultText: 'Traumatic cataract OS', resultTextKo: '좌안 외상성 백내장', isAbnormal: true },
      { value: 'senile', label: 'Age-related', labelKo: '노령성', resultText: 'Senile cataract OS', resultTextKo: '좌안 노령성 백내장', isAbnormal: true },
      { value: 'unknown', label: 'Unknown', labelKo: '불명', resultText: 'Idiopathic cataract OS', resultTextKo: '좌안 특발성 백내장', isAbnormal: true },
    ],
  },
  {
    testID: 'lens_position_od', testName: 'Lens Position (OD)', testNameKo: '수정체 위치 (우안)',
    domain: 'slit_lamp_lens', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'critical',
    testType: 'select',
    options: [
      { value: 'normal', label: 'Normal position (emmetropia)', labelKo: '정상 위치', resultText: 'Lens in normal position OD', resultTextKo: '우안 수정체 정상 위치', isAbnormal: false },
      { value: 'subluxation', label: 'Subluxation (partial dislocation — phacodonesis, vitreous in AC)', labelKo: '아탈구 (부분 탈구)', resultText: 'Lens subluxation OD', resultTextKo: '우안 수정체 아탈구', isAbnormal: true, severity: 'severe', signs: ['lens_subluxation_od'] },
      { value: 'anterior_luxation', label: 'Anterior luxation (lens in AC)', labelKo: '전방 탈구 (수정체 전안방 내)', resultText: 'Anterior lens luxation OD', resultTextKo: '우안 수정체 전방 탈구', isAbnormal: true, severity: 'critical', signs: ['lens_luxation_od', 'shallow_ac_od'] },
      { value: 'posterior_luxation', label: 'Posterior luxation (lens in vitreous)', labelKo: '후방 탈구 (유리체 내)', resultText: 'Posterior lens luxation OD', resultTextKo: '우안 수정체 후방 탈구', isAbnormal: true, severity: 'severe', signs: ['lens_luxation_od', 'deep_ac_od'] },
    ],
  },
  {
    testID: 'lens_position_os', testName: 'Lens Position (OS)', testNameKo: '수정체 위치 (좌안)',
    domain: 'slit_lamp_lens', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'critical',
    testType: 'select',
    options: [
      { value: 'normal', label: 'Normal', labelKo: '정상', resultText: 'Lens in normal position OS', resultTextKo: '좌안 수정체 정상 위치', isAbnormal: false },
      { value: 'subluxation', label: 'Subluxation', labelKo: '아탈구', resultText: 'Lens subluxation OS', resultTextKo: '좌안 수정체 아탈구', isAbnormal: true, severity: 'severe', signs: ['lens_subluxation_os'] },
      { value: 'anterior_luxation', label: 'Anterior luxation', labelKo: '전방 탈구', resultText: 'Anterior lens luxation OS', resultTextKo: '좌안 수정체 전방 탈구', isAbnormal: true, severity: 'critical', signs: ['lens_luxation_os', 'shallow_ac_os'] },
      { value: 'posterior_luxation', label: 'Posterior luxation', labelKo: '후방 탈구', resultText: 'Posterior lens luxation OS', resultTextKo: '좌안 수정체 후방 탈구', isAbnormal: true, severity: 'severe', signs: ['lens_luxation_os', 'deep_ac_os'] },
    ],
  },
]

// ============================================================
// SECTION 11: DOMAIN H — FUNDOSCOPY (안저 검사)
// ============================================================

const fundoscopyTests: OphTestItem[] = [
  {
    testID: 'optic_disc_od', testName: 'Optic Disc (OD)', testNameKo: '시신경 유두 (우안)',
    domain: 'fundoscopy', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'critical',
    howTo: 'Direct/indirect ophthalmoscope or panoptic lens. Assess colour, margin, cup:disc ratio.',
    testType: 'select',
    options: [
      { value: 'normal', label: 'Normal — pink, sharp margins', labelKo: '정상 (분홍색, 경계 선명)', resultText: 'Optic disc normal OD', resultTextKo: '우안 시신경 유두 정상', isAbnormal: false },
      { value: 'papilledema', label: 'Papilloedema (swollen, blurred margins)', labelKo: '유두 부종 (부종, 경계 불분명)', resultText: 'Papilloedema OD', resultTextKo: '우안 시신경 유두 부종', isAbnormal: true, severity: 'critical', signs: ['papilledema_od'] },
      { value: 'optic_neuritis', label: 'Optic neuritis (hyperaemic, swollen)', labelKo: '시신경염 (충혈, 부종)', resultText: 'Optic neuritis OD', resultTextKo: '우안 시신경염', isAbnormal: true, severity: 'critical', signs: ['optic_neuritis_od', 'blind_od'] },
      { value: 'pallor', label: 'Optic disc pallor (pale/white)', labelKo: '시신경 유두 창백 (흰색)', resultText: 'Optic disc pallor OD — atrophy suspected', resultTextKo: '우안 시신경 유두 창백 — 위축 의심', isAbnormal: true, severity: 'severe', signs: ['optic_disc_pallor_od'] },
      { value: 'cupping', label: 'Disc cupping (increased C:D ratio)', labelKo: '유두 함몰 (C:D 비율 증가)', resultText: 'Disc cupping OD — glaucomatous atrophy', resultTextKo: '우안 유두 함몰 — 녹내장성 위축', isAbnormal: true, severity: 'severe', signs: ['optic_disc_cupping_od'] },
      { value: 'coloboma', label: 'Optic disc coloboma', labelKo: '시신경 유두 결손증', resultText: 'Optic disc coloboma OD', resultTextKo: '우안 시신경 유두 결손증', isAbnormal: true, severity: 'moderate' },
    ],
  },
  {
    testID: 'optic_disc_os', testName: 'Optic Disc (OS)', testNameKo: '시신경 유두 (좌안)',
    domain: 'fundoscopy', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'critical',
    testType: 'select',
    options: [
      { value: 'normal', label: 'Normal', labelKo: '정상', resultText: 'Optic disc normal OS', resultTextKo: '좌안 시신경 유두 정상', isAbnormal: false },
      { value: 'papilledema', label: 'Papilloedema', labelKo: '유두 부종', resultText: 'Papilloedema OS', resultTextKo: '좌안 시신경 유두 부종', isAbnormal: true, severity: 'critical', signs: ['papilledema_os'] },
      { value: 'optic_neuritis', label: 'Optic neuritis', labelKo: '시신경염', resultText: 'Optic neuritis OS', resultTextKo: '좌안 시신경염', isAbnormal: true, severity: 'critical', signs: ['optic_neuritis_os', 'blind_os'] },
      { value: 'pallor', label: 'Disc pallor', labelKo: '시신경 유두 창백', resultText: 'Optic disc pallor OS', resultTextKo: '좌안 시신경 유두 창백', isAbnormal: true, severity: 'severe', signs: ['optic_disc_pallor_os'] },
      { value: 'cupping', label: 'Disc cupping', labelKo: '유두 함몰', resultText: 'Disc cupping OS', resultTextKo: '좌안 유두 함몰', isAbnormal: true, severity: 'severe', signs: ['optic_disc_cupping_os'] },
    ],
  },
  {
    testID: 'retinal_vessels_od', testName: 'Retinal Vessels (OD)', testNameKo: '망막 혈관 (우안)',
    domain: 'fundoscopy', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'high',
    testType: 'select',
    options: [
      { value: 'normal', label: 'Normal — distinct, appropriate calibre', labelKo: '정상 (선명, 적절한 굵기)', resultText: 'Retinal vessels normal OD', resultTextKo: '우안 망막 혈관 정상', isAbnormal: false },
      { value: 'attenuated', label: 'Attenuated / Thin vessels', labelKo: '혈관 가늘어짐', resultText: 'Retinal vascular attenuation OD', resultTextKo: '우안 망막 혈관 감소', isAbnormal: true, severity: 'moderate', signs: ['retinal_degeneration_od'] },
      { value: 'tortuous', label: 'Tortuous / Engorged (hypertension)', labelKo: '구불구불/확장 (고혈압)', resultText: 'Tortuous retinal vessels OD — hypertension suspected', resultTextKo: '우안 망막 혈관 구불구불 — 고혈압 의심', isAbnormal: true, severity: 'moderate', signs: ['hypertensive_retinopathy_suspect'] },
      { value: 'hemorrhage', label: 'Perivascular / Flame haemorrhages', labelKo: '혈관 주위/화염상 출혈', resultText: 'Retinal haemorrhages OD', resultTextKo: '우안 망막 출혈', isAbnormal: true, severity: 'severe', signs: ['retinal_hemorrhage_od'] },
    ],
  },
  {
    testID: 'retinal_vessels_os', testName: 'Retinal Vessels (OS)', testNameKo: '망막 혈관 (좌안)',
    domain: 'fundoscopy', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'high',
    testType: 'select',
    options: [
      { value: 'normal', label: 'Normal', labelKo: '정상', resultText: 'Retinal vessels normal OS', resultTextKo: '좌안 망막 혈관 정상', isAbnormal: false },
      { value: 'attenuated', label: 'Attenuated', labelKo: '혈관 가늘어짐', resultText: 'Vascular attenuation OS', resultTextKo: '좌안 망막 혈관 감소', isAbnormal: true, severity: 'moderate', signs: ['retinal_degeneration_os'] },
      { value: 'tortuous', label: 'Tortuous/Engorged', labelKo: '구불구불/확장', resultText: 'Tortuous vessels OS', resultTextKo: '좌안 망막 혈관 구불구불', isAbnormal: true, severity: 'moderate', signs: ['hypertensive_retinopathy_suspect'] },
      { value: 'hemorrhage', label: 'Haemorrhages', labelKo: '출혈', resultText: 'Retinal haemorrhages OS', resultTextKo: '좌안 망막 출혈', isAbnormal: true, severity: 'severe', signs: ['retinal_hemorrhage_os'] },
    ],
  },
  {
    testID: 'retinal_lesions_od', testName: 'Retinal Lesions (OD)', testNameKo: '망막 병변 (우안)',
    domain: 'fundoscopy', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'critical',
    testType: 'multiselect',
    options: [
      { value: 'normal', label: 'No lesions', labelKo: '병변 없음', resultText: 'No retinal lesions OD', resultTextKo: '우안 망막 병변 없음', isAbnormal: false },
      { value: 'focal_hyperreflectivity', label: 'Focal hyperreflectivity (degeneration)', labelKo: '국소 과반사 (변성)', resultText: 'Focal retinal hyperreflectivity OD', resultTextKo: '우안 국소 망막 과반사', isAbnormal: true, severity: 'moderate', signs: ['retinal_degeneration_od'] },
      { value: 'diffuse_hyperreflectivity', label: 'Diffuse hyperreflectivity (PRA pattern)', labelKo: '미만성 과반사 (PRA 패턴)', resultText: 'Diffuse tapetal hyperreflectivity OD — PRA suspected', resultTextKo: '우안 미만성 과반사 — PRA 의심', isAbnormal: true, severity: 'severe', signs: ['tapetal_hyperreflectivity_od', 'pra_suspect_od', 'retinal_degeneration_od'] },
      { value: 'subretinal_fluid', label: 'Subretinal fluid / bullous detachment', labelKo: '망막하 삼출액/수포성 박리', resultText: 'Subretinal fluid OD', resultTextKo: '우안 망막하 삼출액', isAbnormal: true, severity: 'critical', signs: ['subretinal_fluid_od', 'retinal_detachment_od'] },
      { value: 'detachment', label: 'Retinal detachment (complete)', labelKo: '망막 박리 (완전)', resultText: 'Complete retinal detachment OD', resultTextKo: '우안 완전 망막 박리', isAbnormal: true, severity: 'critical', signs: ['retinal_detachment_od', 'blind_od'] },
      { value: 'hemorrhage', label: 'Intraretinal / preretinal haemorrhage', labelKo: '망막내/망막전 출혈', resultText: 'Retinal haemorrhage OD', resultTextKo: '우안 망막 출혈', isAbnormal: true, severity: 'severe', signs: ['retinal_hemorrhage_od'] },
      { value: 'chorioretinitis', label: 'Chorioretinitis (focal white lesions)', labelKo: '맥락망막염 (국소 백색 병변)', resultText: 'Active chorioretinitis OD', resultTextKo: '우안 활동성 맥락망막염', isAbnormal: true, severity: 'severe', signs: ['chorioretinitis_od'] },
      { value: 'retinal_folds', label: 'Retinal folds / dysplasia', labelKo: '망막 주름/이형성', resultText: 'Retinal folds OD', resultTextKo: '우안 망막 주름', isAbnormal: true, severity: 'moderate', signs: ['retinal_folds_od'] },
    ],
  },
  {
    testID: 'retinal_lesions_os', testName: 'Retinal Lesions (OS)', testNameKo: '망막 병변 (좌안)',
    domain: 'fundoscopy', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'critical',
    testType: 'multiselect',
    options: [
      { value: 'normal', label: 'No lesions', labelKo: '병변 없음', resultText: 'No retinal lesions OS', resultTextKo: '좌안 망막 병변 없음', isAbnormal: false },
      { value: 'focal_hyperreflectivity', label: 'Focal hyperreflectivity', labelKo: '국소 과반사', resultText: 'Focal hyperreflectivity OS', resultTextKo: '좌안 국소 망막 과반사', isAbnormal: true, severity: 'moderate', signs: ['retinal_degeneration_os'] },
      { value: 'diffuse_hyperreflectivity', label: 'Diffuse hyperreflectivity (PRA)', labelKo: '미만성 과반사 (PRA)', resultText: 'Diffuse hyperreflectivity OS — PRA suspected', resultTextKo: '좌안 미만성 과반사 — PRA 의심', isAbnormal: true, severity: 'severe', signs: ['tapetal_hyperreflectivity_os', 'pra_suspect_os', 'retinal_degeneration_os'] },
      { value: 'subretinal_fluid', label: 'Subretinal fluid', labelKo: '망막하 삼출액', resultText: 'Subretinal fluid OS', resultTextKo: '좌안 망막하 삼출액', isAbnormal: true, severity: 'critical', signs: ['subretinal_fluid_os', 'retinal_detachment_os'] },
      { value: 'detachment', label: 'Retinal detachment', labelKo: '망막 박리', resultText: 'Retinal detachment OS', resultTextKo: '좌안 망막 박리', isAbnormal: true, severity: 'critical', signs: ['retinal_detachment_os', 'blind_os'] },
      { value: 'hemorrhage', label: 'Retinal haemorrhage', labelKo: '망막 출혈', resultText: 'Retinal haemorrhage OS', resultTextKo: '좌안 망막 출혈', isAbnormal: true, severity: 'severe', signs: ['retinal_hemorrhage_os'] },
      { value: 'chorioretinitis', label: 'Chorioretinitis', labelKo: '맥락망막염', resultText: 'Chorioretinitis OS', resultTextKo: '좌안 맥락망막염', isAbnormal: true, severity: 'severe', signs: ['chorioretinitis_os'] },
      { value: 'retinal_folds', label: 'Retinal folds', labelKo: '망막 주름', resultText: 'Retinal folds OS', resultTextKo: '좌안 망막 주름', isAbnormal: true, severity: 'moderate', signs: ['retinal_folds_os'] },
    ],
  },
  {
    testID: 'tapetum_od', testName: 'Tapetum Lucidum (OD)', testNameKo: '반사막 (우안)',
    domain: 'fundoscopy', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'high',
    testType: 'select',
    options: [
      { value: 'normal', label: 'Normal (uniform green/gold/blue)', labelKo: '정상 (균일한 녹색/금색/청색)', resultText: 'Tapetum normal OD', resultTextKo: '우안 반사막 정상', isAbnormal: false },
      { value: 'hyperreflective', label: 'Hyperreflective (bright, retinal thinning)', labelKo: '과반사 (밝음, 망막 얇아짐)', resultText: 'Tapetal hyperreflectivity OD — retinal degeneration', resultTextKo: '우안 반사막 과반사 — 망막 변성', isAbnormal: true, severity: 'moderate', signs: ['tapetal_hyperreflectivity_od', 'retinal_degeneration_od'] },
      { value: 'hyporeflective', label: 'Hyporeflective / Dull', labelKo: '저반사/흐릿함', resultText: 'Tapetal hyporeflectivity OD', resultTextKo: '우안 반사막 저반사', isAbnormal: true, severity: 'mild' },
      { value: 'absent', label: 'Absent (subretinal fluid covering)', labelKo: '소실 (망막하액으로 가려짐)', resultText: 'Tapetum absent/obscured OD', resultTextKo: '우안 반사막 소실/가려짐', isAbnormal: true, severity: 'critical', signs: ['retinal_detachment_od'] },
    ],
  },
  {
    testID: 'tapetum_os', testName: 'Tapetum Lucidum (OS)', testNameKo: '반사막 (좌안)',
    domain: 'fundoscopy', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'high',
    testType: 'select',
    options: [
      { value: 'normal', label: 'Normal', labelKo: '정상', resultText: 'Tapetum normal OS', resultTextKo: '좌안 반사막 정상', isAbnormal: false },
      { value: 'hyperreflective', label: 'Hyperreflective', labelKo: '과반사', resultText: 'Tapetal hyperreflectivity OS', resultTextKo: '좌안 반사막 과반사', isAbnormal: true, severity: 'moderate', signs: ['tapetal_hyperreflectivity_os', 'retinal_degeneration_os'] },
      { value: 'hyporeflective', label: 'Hyporeflective', labelKo: '저반사', resultText: 'Tapetal hyporeflectivity OS', resultTextKo: '좌안 반사막 저반사', isAbnormal: true, severity: 'mild' },
      { value: 'absent', label: 'Absent', labelKo: '소실', resultText: 'Tapetum absent OS', resultTextKo: '좌안 반사막 소실', isAbnormal: true, severity: 'critical', signs: ['retinal_detachment_os'] },
    ],
  },
  {
    testID: 'chorioretinitis_od', testName: 'Chorioretinitis Activity (OD)', testNameKo: '맥락망막염 활동성 (우안)',
    domain: 'fundoscopy', eye: 'OD', species: 'both', required: false, clinicalSignificance: 'high',
    dependsOn: { testID: 'retinal_lesions_od', triggerValues: ['chorioretinitis'] },
    testType: 'select',
    options: [
      { value: 'active', label: 'Active (ill-defined white/grey lesions)', labelKo: '활동성 (경계 불분명한 흰/회색 병변)', resultText: 'Active chorioretinitis OD', resultTextKo: '우안 활동성 맥락망막염', isAbnormal: true, severity: 'severe', signs: ['chorioretinitis_od', 'infectious_uveitis_suspect'] },
      { value: 'inactive', label: 'Inactive / Scar (hyperreflective, well-defined)', labelKo: '비활동성/반흔 (과반사, 경계 선명)', resultText: 'Inactive chorioretinal scar OD', resultTextKo: '우안 비활동성 맥락망막 반흔', isAbnormal: true, severity: 'mild' },
      { value: 'multifocal', label: 'Multifocal (systemic disease suspect)', labelKo: '다발성 (전신 질환 의심)', resultText: 'Multifocal chorioretinitis OD', resultTextKo: '우안 다발성 맥락망막염', isAbnormal: true, severity: 'severe', signs: ['chorioretinitis_od', 'infectious_uveitis_suspect'] },
    ],
  },
  {
    testID: 'chorioretinitis_os', testName: 'Chorioretinitis Activity (OS)', testNameKo: '맥락망막염 활동성 (좌안)',
    domain: 'fundoscopy', eye: 'OS', species: 'both', required: false, clinicalSignificance: 'high',
    dependsOn: { testID: 'retinal_lesions_os', triggerValues: ['chorioretinitis'] },
    testType: 'select',
    options: [
      { value: 'active', label: 'Active', labelKo: '활동성', resultText: 'Active chorioretinitis OS', resultTextKo: '좌안 활동성 맥락망막염', isAbnormal: true, severity: 'severe', signs: ['chorioretinitis_os', 'infectious_uveitis_suspect'] },
      { value: 'inactive', label: 'Inactive scar', labelKo: '비활동성 반흔', resultText: 'Inactive scar OS', resultTextKo: '좌안 비활동성 반흔', isAbnormal: true, severity: 'mild' },
      { value: 'multifocal', label: 'Multifocal', labelKo: '다발성', resultText: 'Multifocal chorioretinitis OS', resultTextKo: '좌안 다발성 맥락망막염', isAbnormal: true, severity: 'severe', signs: ['chorioretinitis_os', 'infectious_uveitis_suspect'] },
    ],
  },
]

// ============================================================
// SECTION 12: DOMAIN I — OCULAR ULTRASOUND (안구 초음파)
// ============================================================

const ocularUltrasoundTests: OphTestItem[] = [
  {
    testID: 'vitreous_od', testName: 'Vitreous (OD)', testNameKo: '유리체 (우안)',
    domain: 'ocular_ultrasound', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'high',
    howTo: 'High-frequency probe (10-20 MHz). Gel on closed eyelid. Assess vitreous clarity, retinal attachment.',
    testType: 'select',
    options: [
      { value: 'clear', label: 'Clear / Anechoic', labelKo: '투명/무에코', resultText: 'Vitreous clear OD', resultTextKo: '우안 유리체 투명', isAbnormal: false },
      { value: 'mild_opacity', label: 'Mild opacity / fine echoes', labelKo: '경도 혼탁/미세 에코', resultText: 'Mild vitreous opacity OD', resultTextKo: '우안 유리체 경도 혼탁', isAbnormal: true, severity: 'mild', signs: ['vitreous_opacity_od'] },
      { value: 'hemorrhage', label: 'Haemorrhage (hyperechoic swirling)', labelKo: '출혈 (소용돌이 과에코)', resultText: 'Vitreous haemorrhage OD', resultTextKo: '우안 유리체 출혈', isAbnormal: true, severity: 'severe', signs: ['vitreous_hemorrhage_od'] },
      { value: 'fibrous', label: 'Fibrous / organised opacity', labelKo: '섬유화/조직화된 혼탁', resultText: 'Fibrous vitreous opacity OD', resultTextKo: '우안 유리체 섬유화 혼탁', isAbnormal: true, severity: 'moderate', signs: ['vitreous_opacity_od'] },
    ],
  },
  {
    testID: 'vitreous_os', testName: 'Vitreous (OS)', testNameKo: '유리체 (좌안)',
    domain: 'ocular_ultrasound', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'high',
    testType: 'select',
    options: [
      { value: 'clear', label: 'Clear', labelKo: '투명', resultText: 'Vitreous clear OS', resultTextKo: '좌안 유리체 투명', isAbnormal: false },
      { value: 'mild_opacity', label: 'Mild opacity', labelKo: '경도 혼탁', resultText: 'Mild vitreous opacity OS', resultTextKo: '좌안 유리체 경도 혼탁', isAbnormal: true, severity: 'mild', signs: ['vitreous_opacity_os'] },
      { value: 'hemorrhage', label: 'Haemorrhage', labelKo: '출혈', resultText: 'Vitreous haemorrhage OS', resultTextKo: '좌안 유리체 출혈', isAbnormal: true, severity: 'severe', signs: ['vitreous_hemorrhage_os'] },
      { value: 'fibrous', label: 'Fibrous opacity', labelKo: '섬유화 혼탁', resultText: 'Fibrous vitreous OS', resultTextKo: '좌안 유리체 섬유화', isAbnormal: true, severity: 'moderate', signs: ['vitreous_opacity_os'] },
    ],
  },
  {
    testID: 'retinal_attachment_us_od', testName: 'Retinal Attachment on US (OD)', testNameKo: '초음파 망막 부착 상태 (우안)',
    domain: 'ocular_ultrasound', eye: 'OD', species: 'both', required: true, clinicalSignificance: 'critical',
    testType: 'select',
    options: [
      { value: 'attached', label: 'Attached — flat hyperechoic line', labelKo: '부착됨 (납작한 과에코선)', resultText: 'Retina attached OD', resultTextKo: '우안 망막 부착', isAbnormal: false },
      { value: 'partial', label: 'Partial detachment (V-shaped membrane)', labelKo: '부분 박리 (V자형 막)', resultText: 'Partial retinal detachment OD', resultTextKo: '우안 부분 망막 박리', isAbnormal: true, severity: 'severe', signs: ['retinal_detachment_us_od', 'retinal_detachment_od'] },
      { value: 'complete', label: 'Complete detachment (T/funnel-shaped)', labelKo: '완전 박리 (T자/깔때기형)', resultText: 'Complete retinal detachment OD', resultTextKo: '우안 완전 망막 박리', isAbnormal: true, severity: 'critical', signs: ['retinal_detachment_us_od', 'retinal_detachment_od', 'blind_od'] },
    ],
  },
  {
    testID: 'retinal_attachment_us_os', testName: 'Retinal Attachment on US (OS)', testNameKo: '초음파 망막 부착 상태 (좌안)',
    domain: 'ocular_ultrasound', eye: 'OS', species: 'both', required: true, clinicalSignificance: 'critical',
    testType: 'select',
    options: [
      { value: 'attached', label: 'Attached', labelKo: '부착됨', resultText: 'Retina attached OS', resultTextKo: '좌안 망막 부착', isAbnormal: false },
      { value: 'partial', label: 'Partial detachment', labelKo: '부분 박리', resultText: 'Partial retinal detachment OS', resultTextKo: '좌안 부분 망막 박리', isAbnormal: true, severity: 'severe', signs: ['retinal_detachment_us_os', 'retinal_detachment_os'] },
      { value: 'complete', label: 'Complete detachment', labelKo: '완전 박리', resultText: 'Complete retinal detachment OS', resultTextKo: '좌안 완전 망막 박리', isAbnormal: true, severity: 'critical', signs: ['retinal_detachment_us_os', 'retinal_detachment_os', 'blind_os'] },
    ],
  },
  {
    testID: 'intraocular_mass_od', testName: 'Intraocular Mass on US (OD)', testNameKo: '안구내 종괴 (우안)',
    domain: 'ocular_ultrasound', eye: 'OD', species: 'both', required: false, clinicalSignificance: 'critical',
    testType: 'boolean',
    positiveLabel: 'Mass identified', positiveLabelKo: '종괴 확인',
    negativeLabel: 'No mass', negativeLabelKo: '종괴 없음',
    positiveIsAbnormal: true, positiveSigns: ['intraocular_mass_od'],
  },
  {
    testID: 'intraocular_mass_os', testName: 'Intraocular Mass on US (OS)', testNameKo: '안구내 종괴 (좌안)',
    domain: 'ocular_ultrasound', eye: 'OS', species: 'both', required: false, clinicalSignificance: 'critical',
    testType: 'boolean',
    positiveLabel: 'Mass identified', positiveLabelKo: '종괴 확인',
    negativeLabel: 'No mass', negativeLabelKo: '종괴 없음',
    positiveIsAbnormal: true, positiveSigns: ['intraocular_mass_os'],
  },
  {
    testID: 'axial_length_od', testName: 'Axial Length (OD)', testNameKo: '안축장 (우안)',
    domain: 'ocular_ultrasound', eye: 'OD', species: 'both', required: false, clinicalSignificance: 'medium',
    note: 'Dog: ~22mm, Cat: ~20mm. Buphthalmos = increased axial length in glaucoma.',
    testType: 'range', unit: 'mm',
    normalRange: { dog: { min: 19, max: 25 }, cat: { min: 17, max: 22 } },
    ranges: [
      { min: null, max: 19, resultText: 'Reduced axial length OD — microphthalmos?', resultTextKo: '우안 안축장 감소 — 소안구증?', isAbnormal: true, severity: 'moderate' },
      { min: 19, max: 25, resultText: 'Axial length normal OD', resultTextKo: '우안 안축장 정상', isAbnormal: false },
      { min: 25, max: null, resultText: 'Increased axial length OD — buphthalmos (glaucoma)', resultTextKo: '우안 안축장 증가 — 우안 녹내장성 안구 확장', isAbnormal: true, severity: 'moderate' },
    ],
  },
  {
    testID: 'axial_length_os', testName: 'Axial Length (OS)', testNameKo: '안축장 (좌안)',
    domain: 'ocular_ultrasound', eye: 'OS', species: 'both', required: false, clinicalSignificance: 'medium',
    testType: 'range', unit: 'mm',
    normalRange: { dog: { min: 19, max: 25 }, cat: { min: 17, max: 22 } },
    ranges: [
      { min: null, max: 19, resultText: 'Reduced axial length OS', resultTextKo: '좌안 안축장 감소', isAbnormal: true, severity: 'moderate' },
      { min: 19, max: 25, resultText: 'Axial length normal OS', resultTextKo: '좌안 안축장 정상', isAbnormal: false },
      { min: 25, max: null, resultText: 'Increased axial length OS — buphthalmos', resultTextKo: '좌안 안축장 증가 — 녹내장성 안구 확장', isAbnormal: true, severity: 'moderate' },
    ],
  },
]

// ============================================================
// SECTION 13: DOMAIN J — VISION ASSESSMENT (시각 평가)
// ============================================================

const visionAssessmentTests: OphTestItem[] = [
  {
    testID: 'obstacle_course_od', testName: 'Obstacle Course / Visual Placing (OD)', testNameKo: '장애물 코스/시각 배치 반응 (우안)',
    domain: 'vision_assessment', eye: 'OD', species: 'both', required: false, clinicalSignificance: 'critical',
    howTo: 'Cover OS. Lead animal through obstacle course in photopic and scotopic light. Scotopic deficits = rod disease (early PRA, SARD).',
    testType: 'select',
    options: [
      { value: 'normal_both', label: 'Navigates normally — photopic & scotopic', labelKo: '명소/암소시 모두 정상 통과', resultText: 'Visual navigation normal OD', resultTextKo: '우안 시각 정상', isAbnormal: false },
      { value: 'deficient_scotopic', label: 'Deficient in scotopic only (night blindness)', labelKo: '암소시만 결함 (야맹증)', resultText: 'Scotopic visual deficiency OD — rod disease suspected', resultTextKo: '우안 암소시 결함 — 간상세포 질환 의심', isAbnormal: true, severity: 'moderate', signs: ['pra_suspect_od'] },
      { value: 'deficient_photopic', label: 'Deficient in photopic (cone disease)', labelKo: '명소시 결함 (추상세포 질환)', resultText: 'Photopic visual deficiency OD', resultTextKo: '우안 명소시 결함', isAbnormal: true, severity: 'moderate' },
      { value: 'blind', label: 'Unable to navigate — effectively blind OD', labelKo: '통과 불가 — 우안 실명', resultText: 'Functionally blind OD', resultTextKo: '우안 기능적 실명', isAbnormal: true, severity: 'critical', signs: ['blind_od'] },
    ],
  },
  {
    testID: 'obstacle_course_os', testName: 'Obstacle Course (OS)', testNameKo: '장애물 코스 (좌안)',
    domain: 'vision_assessment', eye: 'OS', species: 'both', required: false, clinicalSignificance: 'critical',
    testType: 'select',
    options: [
      { value: 'normal_both', label: 'Normal photopic & scotopic', labelKo: '명소/암소시 정상', resultText: 'Visual navigation normal OS', resultTextKo: '좌안 시각 정상', isAbnormal: false },
      { value: 'deficient_scotopic', label: 'Scotopic deficient only', labelKo: '암소시만 결함', resultText: 'Scotopic deficiency OS', resultTextKo: '좌안 암소시 결함', isAbnormal: true, severity: 'moderate', signs: ['pra_suspect_os'] },
      { value: 'blind', label: 'Functionally blind OS', labelKo: '기능적 실명 (좌안)', resultText: 'Functionally blind OS', resultTextKo: '좌안 기능적 실명', isAbnormal: true, severity: 'critical', signs: ['blind_os'] },
    ],
  },
  {
    testID: 'blindness_onset', testName: 'Blindness Onset (if applicable)', testNameKo: '실명 발생 양상',
    domain: 'vision_assessment', eye: 'OU', species: 'both', required: false, clinicalSignificance: 'critical',
    testType: 'select',
    options: [
      { value: 'na', label: 'Not applicable — vision present', labelKo: '해당 없음 (시각 있음)', resultText: 'Vision present — onset N/A', resultTextKo: '시각 있음', isAbnormal: false },
      { value: 'acute', label: 'Acute / Sudden onset (<24–48h)', labelKo: '급성/갑작스러운 발생 (24-48시간 이내)', resultText: 'Acute-onset blindness', resultTextKo: '급성 발생 실명', isAbnormal: true, severity: 'critical', signs: ['sudden_blindness'] },
      { value: 'subacute', label: 'Subacute (days to weeks)', labelKo: '아급성 (수일~수주)', resultText: 'Subacute-onset blindness', resultTextKo: '아급성 발생 실명', isAbnormal: true, severity: 'critical' },
      { value: 'chronic_progressive', label: 'Chronic progressive (months to years)', labelKo: '만성 진행성 (수개월~수년)', resultText: 'Chronic progressive visual loss', resultTextKo: '만성 진행성 시각 소실', isAbnormal: true, severity: 'severe', signs: ['pra_suspect_od', 'pra_suspect_os'] },
    ],
  },
  {
    testID: 'erg_result', testName: 'Electroretinogram (ERG) — if performed', testNameKo: '망막전위도 (ERG) 결과',
    domain: 'vision_assessment', eye: 'OU', species: 'both', required: false, clinicalSignificance: 'critical',
    note: 'Referral test. Extinguished ERG = generalized retinal dysfunction (SARD, PRA, severe detachment). Normal ERG with blindness = post-retinal (optic nerve/brain).',
    testType: 'select',
    options: [
      { value: 'not_performed', label: 'Not performed', labelKo: '미실시', resultText: 'ERG not performed', resultTextKo: 'ERG 미실시', isAbnormal: false },
      { value: 'normal', label: 'Normal amplitude and waveform', labelKo: '정상 진폭 및 파형', resultText: 'ERG normal — post-retinal cause of blindness suspected', resultTextKo: 'ERG 정상 — 망막 후 원인 실명 의심 (시신경/뇌)', isAbnormal: false },
      { value: 'reduced', label: 'Reduced amplitude', labelKo: '진폭 감소', resultText: 'ERG reduced amplitude — partial retinal dysfunction', resultTextKo: 'ERG 진폭 감소 — 부분 망막 기능 이상', isAbnormal: true, severity: 'moderate' },
      { value: 'extinguished', label: 'Extinguished (flat line)', labelKo: '소실 (평탄선)', resultText: 'ERG extinguished — generalised retinal dysfunction (SARD/PRA/severe detachment)', resultTextKo: 'ERG 소실 — 전반적 망막 기능 부전 (SARD/PRA/심한 박리)', isAbnormal: true, severity: 'critical', signs: ['sard_suspect', 'blind_od', 'blind_os', 'bilateral_blindness'] },
    ],
  },
]
