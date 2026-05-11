// ============================================================
// neuro_ref.ts  — Part 1 of 4
// Veterinary Neurological Examination Reference Data
// 수의 신경학적 검사 표준화 참조 데이터
// ============================================================

// ─────────────────────────────────────────────
// SECTION 1: CORE TYPE DEFINITIONS
// ─────────────────────────────────────────────

export type Species = 'dog' | 'cat' | 'both';
export type Laterality = 'left' | 'right' | 'bilateral' | 'none' | 'unspecified';
export type Severity  = 'mild' | 'moderate' | 'severe' | 'complete';
export type Onset     = 'peracute' | 'acute' | 'subacute' | 'chronic' | 'chronic_progressive' | 'episodic';
export type DisplayLevel = 1 | 2 | 3;
export type ClinicalSignificance = 'high' | 'medium' | 'low';
export type TestType  = 'select' | 'multiselect' | 'boolean' | 'range' | 'grade';

// ── Neurological location taxonomy ──────────────────────────
export type NeuroLocation =
  // Intracranial
  | 'cerebral_cortex'
  | 'thalamus_hypothalamus'
  | 'basal_ganglia'
  | 'midbrain'
  | 'pons'
  | 'medulla'
  | 'cerebellum'
  | 'cerebellar_peduncles'
  | 'vestibular_peripheral'   // inner ear / CN VIII
  | 'vestibular_central'      // brainstem / cerebellum
  // Spinal
  | 'C1_C5'
  | 'C6_T2'
  | 'T3_L3'
  | 'L4_S3'
  | 'sacrocaudal'
  // Peripheral
  | 'peripheral_nerve'
  | 'neuromuscular_junction'
  | 'muscle'
  | 'multifocal'
  | 'diffuse';

// ── Neurological domain taxonomy ───────────────────────────
export type NeuroDomain =
  | 'mentation_consciousness'
  | 'gait_posture'
  | 'cranial_nerve'
  | 'spinal_reflex'
  | 'postural_reaction'
  | 'pain_assessment'
  | 'autonomic';

// ── Dependency system (same as ultrasound_ref) ─────────────
export interface DependsOn {
  testID: string;
  triggerValues: string[];
  operator?: 'OR' | 'AND';
}

// ── Select option ───────────────────────────────────────────
export interface SelectOption {
  value: string;
  label: string;
  labelKo: string;
  resultText: string;
  resultTextKo: string;
  isAbnormal: boolean;
  severity?: Severity;
  // Neurological sign tags — used by localisation engine
  signs?: NeurologicalSign[];
}

// ── Range segment ───────────────────────────────────────────
export interface RangeSegment {
  min: number | null;
  max: number | null;
  resultText: string;
  resultTextKo: string;
  isAbnormal: boolean;
  severity?: Severity;
  signs?: NeurologicalSign[];
}

// ── Base test item ──────────────────────────────────────────
interface BaseNeuroTest {
  testID: string;
  testName: string;
  testNameKo: string;
  domain: NeuroDomain;
  cranialNerve?: CranialNerve;        // CN I–XII if applicable
  species: Species;
  required: boolean;
  displayLevel: DisplayLevel;
  dependsOn?: DependsOn | DependsOn[];
  relatedTests?: string[];
  lateralityCapture: boolean;         // whether this test records left/right
  clinicalSignificance: ClinicalSignificance;
  howTo?: string;                     // brief examination technique
  note?: string;
}

export interface SelectNeuroTest extends BaseNeuroTest {
  testType: 'select';
  options: SelectOption[];
}
export interface MultiSelectNeuroTest extends BaseNeuroTest {
  testType: 'multiselect';
  options: SelectOption[];
  resultTemplate: string;
  resultTemplateKo: string;
}
export interface BooleanNeuroTest extends BaseNeuroTest {
  testType: 'boolean';
  positiveResultText: string;
  positiveResultTextKo: string;
  negativeResultText: string;
  negativeResultTextKo: string;
  positiveIsAbnormal: boolean;
  positiveSigns?: NeurologicalSign[];
}
export interface RangeNeuroTest extends BaseNeuroTest {
  testType: 'range';
  unit: string;
  normalRange?: { dog?: { min?: number; max?: number }; cat?: { min?: number; max?: number } };
  ranges: RangeSegment[];
}
export interface GradeNeuroTest extends BaseNeuroTest {
  testType: 'grade';
  gradeSystem: string;                // e.g. 'modified_frankel', 'schiff-sherrington'
  grades: Array<{
    grade: number | string;
    label: string;
    labelKo: string;
    description: string;
    descriptionKo: string;
    isAbnormal: boolean;
    signs?: NeurologicalSign[];
  }>;
}

export type NeuroTestItem =
  | SelectNeuroTest
  | MultiSelectNeuroTest
  | BooleanNeuroTest
  | RangeNeuroTest
  | GradeNeuroTest;

// ── Cranial nerve enum ──────────────────────────────────────
export type CranialNerve = 'CN_I' | 'CN_II' | 'CN_III' | 'CN_IV' | 'CN_V'
  | 'CN_VI' | 'CN_VII' | 'CN_VIII' | 'CN_IX' | 'CN_X' | 'CN_XI' | 'CN_XII';

// ─────────────────────────────────────────────
// SECTION 2: NEUROLOGICAL SIGN TAXONOMY
// Signs are atomic, labelled findings that feed the localisation engine
// ─────────────────────────────────────────────

export type NeurologicalSign =
  // Consciousness & Mentation
  | 'altered_mentation'
  | 'seizure'
  | 'dementia_behaviour_change'
  | 'head_pressing'
  | 'circling_ipsilateral'
  | 'circling_contralateral'
  | 'compulsive_pacing'
  // Vestibular
  | 'head_tilt_left'
  | 'head_tilt_right'
  | 'nystagmus_horizontal'
  | 'nystagmus_vertical'
  | 'nystagmus_rotatory'
  | 'nystagmus_fast_phase_left'
  | 'nystagmus_fast_phase_right'
  | 'nystagmus_fast_phase_up'
  | 'nystagmus_fast_phase_down'
  | 'nystagmus_positional'
  | 'falling_left'
  | 'falling_right'
  | 'rolling'
  | 'paradoxical_vestibular'
  // Gait
  | 'ataxia_vestibular'
  | 'ataxia_cerebellar'
  | 'ataxia_proprioceptive'
  | 'tetraparesis'
  | 'paraparesis'
  | 'hemiparesis_left'
  | 'hemiparesis_right'
  | 'monoparesis'
  | 'tetraplegia'
  | 'paraplegia'
  | 'UMN_pelvic'
  | 'UMN_thoracic'
  | 'LMN_pelvic'
  | 'LMN_thoracic'
  | 'schiff_sherrington'
  // Cerebellar
  | 'intention_tremor'
  | 'dysmetria'
  | 'menace_absent_ipsilateral'
  | 'wide_based_stance'
  | 'truncal_ataxia'
  // CN signs
  | 'anosmia'
  | 'vision_deficit_left'
  | 'vision_deficit_right'
  | 'vision_deficit_bilateral'
  | 'menace_absent_left'
  | 'menace_absent_right'
  | 'PLR_absent_direct_left'
  | 'PLR_absent_direct_right'
  | 'PLR_absent_consensual_left'
  | 'PLR_absent_consensual_right'
  | 'anisocoria_left_larger'
  | 'anisocoria_right_larger'
  | 'mydriasis_bilateral'
  | 'miosis_unilateral'
  | 'strabismus_ventrolateral'
  | 'strabismus_dorsomedial'
  | 'strabismus_other'
  | 'ptosis'
  | 'facial_hypoalgesia_ipsilateral'
  | 'facial_hypoalgesia_contralateral'
  | 'masseter_atrophy'
  | 'jaw_drop'
  | 'facial_paresis_ipsilateral'
  | 'facial_paresis_bilateral'
  | 'ear_droop'
  | 'lip_droop'
  | 'eye_droop'
  | 'decreased_tear_production'
  | 'dysphonia'
  | 'dysphagia'
  | 'laryngeal_paralysis'
  | 'tongue_deviation'
  | 'tongue_atrophy'
  // Horner's syndrome components
  | 'horners_miosis'
  | 'horners_ptosis'
  | 'horners_enophthalmos'
  | 'horners_third_eyelid'
  // Reflexes
  | 'patellar_increased'
  | 'patellar_decreased'
  | 'patellar_absent'
  | 'withdrawal_increased'
  | 'withdrawal_decreased'
  | 'withdrawal_absent'
  | 'biceps_increased'
  | 'biceps_decreased'
  | 'biceps_absent'
  | 'triceps_increased'
  | 'triceps_decreased'
  | 'triceps_absent'
  | 'perineal_absent'
  | 'babinski_present'
  | 'crossed_extensor_present'
  // Postural reactions
  | 'proprioception_deficit_pelvic_left'
  | 'proprioception_deficit_pelvic_right'
  | 'proprioception_deficit_thoracic_left'
  | 'proprioception_deficit_thoracic_right'
  | 'hopping_deficit_left'
  | 'hopping_deficit_right'
  | 'wheelbarrowing_deficit'
  | 'hemiwalking_deficit_left'
  | 'hemiwalking_deficit_right'
  // Autonomic
  | 'urinary_retention_UMN'
  | 'urinary_incontinence_LMN'
  | 'faecal_incontinence'
  | 'hyperhidrosis'
  | 'anhidrosis'
  // Pain & Hyperesthesia
  | 'cervical_pain'
  | 'thoracolumbar_pain'
  | 'lumbosacral_pain'
  | 'hyperesthesia_diffuse'
  // Spinal — exact level hyperesthesia bands
  | 'hyperesthesia_band_cervical'
  | 'hyperesthesia_band_cervicothoracic'
  | 'hyperesthesia_band_thoracic'
  | 'hyperesthesia_band_thoracolumbar'
  | 'hyperesthesia_band_lumbar'
  // Cutaneous trunci (panniculus) reflex
  | 'cutaneous_trunci_absent_bilateral'
  | 'cutaneous_trunci_absent_left'
  | 'cutaneous_trunci_absent_right'
  | 'cutaneous_trunci_level_cervical'
  | 'cutaneous_trunci_level_thoracic'
  | 'cutaneous_trunci_level_lumbar'
  // Tail tone
  | 'tail_tone_absent'
  | 'tail_tone_reduced'
  | 'tail_paralysis'
  // Muscle atrophy patterns (LMN segment-specific)
  | 'atrophy_supraspinatus_infraspinatus'
  | 'atrophy_triceps'
  | 'atrophy_quadriceps'
  | 'atrophy_caudal_thigh'
  | 'atrophy_gastrocnemius'
  | 'atrophy_distal_limb_generalised'
  // Spinal cord lateralisation
  | 'deficit_worse_left_pelvic'
  | 'deficit_worse_right_pelvic'
  | 'deficit_worse_left_thoracic'
  | 'deficit_worse_right_thoracic'
  | 'hemisection_left'
  | 'hemisection_right';

// ─────────────────────────────────────────────
// SECTION 3: LOCALISATION ENGINE TYPES
// ─────────────────────────────────────────────

export interface LocalisationRule {
  ruleID: string;
  description: string;
  descriptionKo: string;
  // Required signs that MUST be present
  requiredSigns: NeurologicalSign[];
  // Signs that SUPPORT this localisation (not all required)
  supportingSigns: NeurologicalSign[];
  // Minimum number of supportingSigns needed
  minSupportCount: number;
  // Signs that EXCLUDE this localisation
  excludingSigns: NeurologicalSign[];
  // Candidate locations with confidence
  locations: Array<{
    location: NeuroLocation;
    confidence: 'high' | 'medium' | 'low';
    laterality?: 'ipsilateral' | 'contralateral' | 'bilateral' | 'variable';
    note?: string;
  }>;
  // Syndrome label if applicable
  syndrome?: string;
  syndromeKo?: string;
  // Differentials at this location
  differentials: {
    dog: string[];
    cat: string[];
  };
  // Recommended diagnostics
  diagnostics: string[];
  diagnosticsKo: string[];
  // Onset pattern that fits best
  onsetPattern?: Onset[];
}

// Computed result from localisation engine
export interface LocalisationResult {
  location: NeuroLocation;
  confidence: 'high' | 'medium' | 'low';
  confidenceScore: number;           // 0–100
  supportingFindings: string[];
  contradictingFindings: string[];
  syndrome?: string;
  syndromeKo?: string;
  differentials: string[];
  diagnostics: string[];
}

// ─────────────────────────────────────────────
// SECTION 4: SYNDROME COMPOSITE RULES
// Syndromes = named clusters of signs detected automatically
// ─────────────────────────────────────────────

export interface SyndromeRule {
  syndromeID: string;
  name: string;
  nameKo: string;
  description: string;
  // All of these signs must be present
  requiredSigns: NeurologicalSign[];
  // At least one of these signs must be present
  atLeastOneSigns?: NeurologicalSign[];
  // Output when detected
  interpretation: string;
  interpretationKo: string;
  locations: NeuroLocation[];
  urgency: 'emergency' | 'urgent' | 'elective';
}

// ─────────────────────────────────────────────
// SECTION 5: DOMAIN SECTION (same pattern as OrganSection)
// ─────────────────────────────────────────────

export interface DomainStatusGate {
  testID: string;
  testName: string;
  testNameKo: string;
  options: Array<{ value: string; label: string; labelKo: string }>;
  normalValue: string;
  abnormalValue: string;
}

export interface NeuroDomainSection {
  domain: NeuroDomain;
  domainName: string;
  domainNameKo: string;
  examOrder: number;
  statusGate: DomainStatusGate;
  tests: NeuroTestItem[];
}

// ─────────────────────────────────────────────
// SECTION 6: PATIENT CONTEXT (feeds localisation)
// ─────────────────────────────────────────────

export interface NeuroPatientContext {
  species: 'dog' | 'cat';
  breed?: string;
  age?: number;           // years
  sex?: string;
  onset: Onset;
  progression: 'improving' | 'static' | 'progressive' | 'episodic' | 'waxing_waning';
  duration?: string;      // free text: "3 days", "2 weeks"
  painPresent: boolean;
}


// ============================================================
// SECTION 7: DOMAIN A — MENTATION & CONSCIOUSNESS
// ============================================================

const mentationTests: NeuroTestItem[] = [

  // ── [Level 1] Overall Mentation ───────────────────────────
  {
    testID: 'mentation_level',
    testName: 'Level of Consciousness',
    testNameKo: '의식 수준',
    domain: 'mentation_consciousness',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: false,
    clinicalSignificance: 'high',
    howTo: 'Observe spontaneous behaviour, response to name, response to visual and auditory stimuli',
    testType: 'select',
    options: [
      {
        value: 'alert',
        label: 'Alert and responsive',
        labelKo: '각성, 반응 정상',
        resultText: 'Alert and fully responsive',
        resultTextKo: '각성 및 반응 정상',
        isAbnormal: false,
      },
      {
        value: 'depressed',
        label: 'Depressed (dull but responsive)',
        labelKo: '억압 (둔하지만 반응 있음)',
        resultText: 'Depressed mentation; reduced response to stimuli',
        resultTextKo: '억압된 의식; 자극에 대한 반응 감소',
        isAbnormal: true, severity: 'mild',
        signs: ['altered_mentation'],
      },
      {
        value: 'obtunded',
        label: 'Obtunded (markedly reduced response)',
        labelKo: '혼미 (반응 현저히 감소)',
        resultText: 'Obtunded; markedly reduced response to stimuli',
        resultTextKo: '혼미; 자극에 대한 반응 현저히 감소',
        isAbnormal: true, severity: 'moderate',
        signs: ['altered_mentation'],
      },
      {
        value: 'stupor',
        label: 'Stupor (responds only to noxious stimuli)',
        labelKo: '혼수전 상태 (유해 자극에만 반응)',
        resultText: 'Stuporous; responds only to noxious stimuli',
        resultTextKo: '반혼수; 유해 자극에만 반응',
        isAbnormal: true, severity: 'severe',
        signs: ['altered_mentation'],
      },
      {
        value: 'coma',
        label: 'Coma (no response to stimuli)',
        labelKo: '혼수 (자극에 전혀 반응 없음)',
        resultText: 'Comatose; no response to stimuli',
        resultTextKo: '혼수; 자극에 전혀 반응 없음',
        isAbnormal: true, severity: 'complete',
        signs: ['altered_mentation'],
      },
    ],
  },

  // ── [Level 1] Behaviour Changes ───────────────────────────
  {
    testID: 'behaviour_change',
    testName: 'Behavioural Changes',
    testNameKo: '행동 변화',
    domain: 'mentation_consciousness',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: false,
    clinicalSignificance: 'high',
    testType: 'multiselect',
    resultTemplate: 'Behavioural abnormalities: {values}',
    resultTemplateKo: '행동 이상: {values}',
    options: [
      {
        value: 'none',
        label: 'No behavioural change',
        labelKo: '행동 변화 없음',
        resultText: 'no behavioural change',
        resultTextKo: '행동 변화 없음',
        isAbnormal: false,
      },
      {
        value: 'aggression',
        label: 'Aggression / Irritability',
        labelKo: '공격성/과민성',
        resultText: 'aggression / irritability',
        resultTextKo: '공격성/과민성',
        isAbnormal: true, severity: 'mild',
        signs: ['dementia_behaviour_change'],
      },
      {
        value: 'anxiety',
        label: 'Anxiety / Restlessness',
        labelKo: '불안/안절부절',
        resultText: 'anxiety / restlessness',
        resultTextKo: '불안/안절부절',
        isAbnormal: true, severity: 'mild',
        signs: ['dementia_behaviour_change'],
      },
      {
        value: 'head_pressing',
        label: 'Head pressing',
        labelKo: '머리 밀어붙임',
        resultText: 'head pressing',
        resultTextKo: '머리 밀어붙임',
        isAbnormal: true, severity: 'moderate',
        signs: ['head_pressing'],
      },
      {
        value: 'circling',
        label: 'Compulsive circling',
        labelKo: '강박적 선회',
        resultText: 'compulsive circling',
        resultTextKo: '강박적 선회',
        isAbnormal: true, severity: 'moderate',
      },
      {
        value: 'pacing',
        label: 'Compulsive pacing',
        labelKo: '강박적 배회',
        resultText: 'compulsive pacing',
        resultTextKo: '강박적 배회',
        isAbnormal: true, severity: 'moderate',
        signs: ['compulsive_pacing'],
      },
      {
        value: 'dementia',
        label: 'Cognitive decline / Disorientation',
        labelKo: '인지 저하/방향감각 상실',
        resultText: 'cognitive decline / disorientation',
        resultTextKo: '인지 저하/방향감각 상실',
        isAbnormal: true, severity: 'moderate',
        signs: ['dementia_behaviour_change'],
      },
    ],
  },

  // ── [Level 2] Circling direction ← behaviour_change includes 'circling'
  {
    testID: 'circling_direction',
    testName: 'Circling Direction',
    testNameKo: '선회 방향',
    domain: 'mentation_consciousness',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'behaviour_change', triggerValues: ['circling'] },
    lateralityCapture: true,
    clinicalSignificance: 'high',
    note: 'Tight circle toward lesion side suggests forebrain/thalamus; large circle suggests vestibular',
    testType: 'select',
    options: [
      {
        value: 'left',
        label: 'Circles to the LEFT',
        labelKo: '좌측으로 선회',
        resultText: 'Circles to the left; lesion ipsilateral (left) forebrain or left vestibular suspected',
        resultTextKo: '좌측 선회; 좌측 전뇌 또는 좌측 전정계 병변 의심',
        isAbnormal: true, severity: 'moderate',
        signs: ['circling_ipsilateral'],
      },
      {
        value: 'right',
        label: 'Circles to the RIGHT',
        labelKo: '우측으로 선회',
        resultText: 'Circles to the right; lesion ipsilateral (right) forebrain or right vestibular suspected',
        resultTextKo: '우측 선회; 우측 전뇌 또는 우측 전정계 병변 의심',
        isAbnormal: true, severity: 'moderate',
        signs: ['circling_ipsilateral'],
      },
    ],
  },

  // ── [Level 1] Seizure History ──────────────────────────────
  {
    testID: 'seizure_history',
    testName: 'Seizure History',
    testNameKo: '발작 병력',
    domain: 'mentation_consciousness',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: false,
    clinicalSignificance: 'high',
    testType: 'boolean',
    positiveResultText: 'History of seizures reported',
    positiveResultTextKo: '발작 병력 있음',
    negativeResultText: 'No seizure history',
    negativeResultTextKo: '발작 병력 없음',
    positiveIsAbnormal: true,
    positiveSigns: ['seizure'],
  },

  // ── [Level 2] Seizure type ← seizure_history = true ───────
  {
    testID: 'seizure_type',
    testName: 'Seizure Type',
    testNameKo: '발작 유형',
    domain: 'mentation_consciousness',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'seizure_history', triggerValues: ['true'] },
    lateralityCapture: false,
    clinicalSignificance: 'high',
    note: 'Generalised TC seizures → bilateral forebrain. Focal → unilateral cortex. Focal→secondary generalisation → unilateral cortex with spread.',
    testType: 'select',
    options: [
      {
        value: 'generalised_tc',
        label: 'Generalised tonic-clonic',
        labelKo: '전신성 강직-간대 발작',
        resultText: 'Generalised tonic-clonic seizures; bilateral forebrain involvement suspected',
        resultTextKo: '전신성 강직-간대 발작; 양측 전뇌 이상 의심',
        isAbnormal: true, severity: 'severe',
        signs: ['seizure'],
      },
      {
        value: 'focal',
        label: 'Focal (partial) seizure',
        labelKo: '국소성(부분) 발작',
        resultText: 'Focal seizures; unilateral cortical lesion suspected',
        resultTextKo: '국소성 발작; 일측성 피질 병변 의심',
        isAbnormal: true, severity: 'moderate',
        signs: ['seizure'],
      },
      {
        value: 'focal_secondary',
        label: 'Focal with secondary generalisation',
        labelKo: '이차성 전신화를 동반한 국소 발작',
        resultText: 'Focal seizures with secondary generalisation; unilateral cortical lesion with spread',
        resultTextKo: '이차성 전신화를 동반한 국소 발작; 일측성 피질 병변과 파급',
        isAbnormal: true, severity: 'severe',
        signs: ['seizure'],
      },
      {
        value: 'absence',
        label: 'Absence / Petit mal',
        labelKo: '소발작',
        resultText: 'Absence seizures; diffuse cortical hyperexcitability suspected',
        resultTextKo: '소발작; 미만성 피질 과흥분성 의심',
        isAbnormal: true, severity: 'mild',
        signs: ['seizure'],
      },
      {
        value: 'cluster',
        label: 'Cluster seizures (>2 in 24h)',
        labelKo: '군발 발작 (24시간 내 2회 이상)',
        resultText: 'Cluster seizures; structural or metabolic aetiology requires urgent evaluation',
        resultTextKo: '군발 발작; 구조적 또는 대사성 원인 긴급 평가 필요',
        isAbnormal: true, severity: 'severe',
        signs: ['seizure'],
      },
      {
        value: 'status_epilepticus',
        label: 'Status epilepticus (>5 min continuous)',
        labelKo: '지속성 간질 중첩증 (5분 이상 지속)',
        resultText: 'Status epilepticus; emergency intervention required',
        resultTextKo: '지속성 간질 중첩증; 응급 처치 필요',
        isAbnormal: true, severity: 'complete',
        signs: ['seizure'],
      },
    ],
  },

  // ── [Level 2] Seizure lateralisation ─────────────────────
  {
    testID: 'seizure_lateralisation',
    testName: 'Seizure Lateralisation / Focal Onset Side',
    testNameKo: '발작 편측화 / 국소 발작 발생 측',
    domain: 'mentation_consciousness',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'seizure_type', triggerValues: ['focal', 'focal_secondary'] },
    lateralityCapture: true,
    clinicalSignificance: 'high',
    testType: 'select',
    options: [
      {
        value: 'left',
        label: 'Left-sided focal onset',
        labelKo: '좌측 국소 발생',
        resultText: 'Focal seizures with left-sided onset; right cerebral cortex lesion suspected (contralateral)',
        resultTextKo: '좌측 국소 발생 발작; 우측 대뇌 피질 병변 의심 (반대측)',
        isAbnormal: true, severity: 'moderate',
      },
      {
        value: 'right',
        label: 'Right-sided focal onset',
        labelKo: '우측 국소 발생',
        resultText: 'Focal seizures with right-sided onset; left cerebral cortex lesion suspected (contralateral)',
        resultTextKo: '우측 국소 발생 발작; 좌측 대뇌 피질 병변 의심 (반대측)',
        isAbnormal: true, severity: 'moderate',
      },
    ],
  },
];


// ============================================================
// SECTION 8: DOMAIN B — GAIT & POSTURE
// ============================================================

const gaitPostureTests: NeuroTestItem[] = [

  // ── [Level 1] Gait Overall ────────────────────────────────
  {
    testID: 'gait_overall',
    testName: 'Gait Assessment (Overall)',
    testNameKo: '보행 전반적 평가',
    domain: 'gait_posture',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: false,
    clinicalSignificance: 'high',
    howTo: 'Observe on a non-slip surface. Walk in straight line, circle, and up/down stairs.',
    testType: 'select',
    options: [
      {
        value: 'normal',
        label: 'Normal gait',
        labelKo: '정상 보행',
        resultText: 'Gait normal',
        resultTextKo: '보행 정상',
        isAbnormal: false,
      },
      {
        value: 'ataxia_vestibular',
        label: 'Vestibular ataxia (swaying, wide-based, falling)',
        labelKo: '전정 실조 (흔들림, 넓은 지지기반, 낙상)',
        resultText: 'Vestibular ataxia with swaying and wide-based stance',
        resultTextKo: '흔들림 및 넓은 지지기반을 동반한 전정 실조',
        isAbnormal: true, severity: 'moderate',
        signs: ['ataxia_vestibular', 'wide_based_stance'],
      },
      {
        value: 'ataxia_cerebellar',
        label: 'Cerebellar ataxia (dysmetric, hypermetric, tremor)',
        labelKo: '소뇌 실조 (운동이상, 과다운동, 진전)',
        resultText: 'Cerebellar ataxia with dysmetria and intention tremor',
        resultTextKo: '운동이상 및 의도 진전을 동반한 소뇌 실조',
        isAbnormal: true, severity: 'moderate',
        signs: ['ataxia_cerebellar', 'dysmetria', 'intention_tremor'],
      },
      {
        value: 'ataxia_proprioceptive',
        label: 'Proprioceptive (spinal) ataxia — crossing, knuckling',
        labelKo: '고유감각(척수) 실조 — 교차, 발등 걸음',
        resultText: 'Proprioceptive ataxia with knuckling and crossing of limbs',
        resultTextKo: '발등 걸음 및 사지 교차를 동반한 고유감각 실조',
        isAbnormal: true, severity: 'moderate',
        signs: ['ataxia_proprioceptive'],
      },
      {
        value: 'paresis_tetraparesis',
        label: 'Tetraparesis (weakness all 4 limbs)',
        labelKo: '사지 부전마비 (4지 모두 약화)',
        resultText: 'Tetraparesis; weakness affecting all four limbs',
        resultTextKo: '사지 부전마비; 4지 모두 약화',
        isAbnormal: true, severity: 'moderate',
        signs: ['tetraparesis'],
      },
      {
        value: 'paresis_paraparesis',
        label: 'Paraparesis (pelvic limb weakness only)',
        labelKo: '후지 부전마비 (후지만 약화)',
        resultText: 'Paraparesis; pelvic limb weakness',
        resultTextKo: '후지 부전마비; 후지 약화',
        isAbnormal: true, severity: 'moderate',
        signs: ['paraparesis'],
      },
      {
        value: 'paresis_hemiparesis',
        label: 'Hemiparesis (ipsilateral thoracic and pelvic)',
        labelKo: '편측 부전마비 (동측 전후지)',
        resultText: 'Hemiparesis; ipsilateral thoracic and pelvic limb weakness',
        resultTextKo: '편측 부전마비; 동측 전후지 약화',
        isAbnormal: true, severity: 'moderate',
      },
      {
        value: 'paresis_monoparesis',
        label: 'Monoparesis (single limb)',
        labelKo: '단지 부전마비 (1지만 약화)',
        resultText: 'Monoparesis; single limb weakness',
        resultTextKo: '단지 부전마비; 단일 사지 약화',
        isAbnormal: true, severity: 'moderate',
        signs: ['monoparesis'],
      },
      {
        value: 'plegia_tetraplegia',
        label: 'Tetraplegia (complete paralysis all 4 limbs)',
        labelKo: '사지 완전마비',
        resultText: 'Tetraplegia; complete paralysis of all four limbs',
        resultTextKo: '사지 완전마비',
        isAbnormal: true, severity: 'complete',
        signs: ['tetraplegia'],
      },
      {
        value: 'plegia_paraplegia',
        label: 'Paraplegia (complete pelvic limb paralysis)',
        labelKo: '후지 완전마비',
        resultText: 'Paraplegia; complete pelvic limb paralysis',
        resultTextKo: '후지 완전마비',
        isAbnormal: true, severity: 'complete',
        signs: ['paraplegia'],
      },
    ],
  },

  // ── [Level 2] Hemiparesis side ───────────────────────────
  {
    testID: 'hemiparesis_side',
    testName: 'Hemiparesis — Affected Side',
    testNameKo: '편측 부전마비 — 이환 측',
    domain: 'gait_posture',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'gait_overall', triggerValues: ['paresis_hemiparesis'] },
    lateralityCapture: true,
    clinicalSignificance: 'high',
    testType: 'select',
    options: [
      {
        value: 'left',
        label: 'Left hemiparesis',
        labelKo: '좌측 편측 부전마비',
        resultText: 'Left hemiparesis; right-sided brain lesion (contralateral) or left C1–C5 spinal lesion suspected',
        resultTextKo: '좌측 편측 부전마비; 우측 뇌 병변(반대측) 또는 좌측 C1-C5 척수 병변 의심',
        isAbnormal: true, severity: 'moderate',
        signs: ['hemiparesis_left'],
      },
      {
        value: 'right',
        label: 'Right hemiparesis',
        labelKo: '우측 편측 부전마비',
        resultText: 'Right hemiparesis; left-sided brain lesion (contralateral) or right C1–C5 spinal lesion suspected',
        resultTextKo: '우측 편측 부전마비; 좌측 뇌 병변(반대측) 또는 우측 C1-C5 척수 병변 의심',
        isAbnormal: true, severity: 'moderate',
        signs: ['hemiparesis_right'],
      },
    ],
  },

  // ── [Level 1] UMN vs LMN character ───────────────────────
  {
    testID: 'paresis_character',
    testName: 'Paresis Character — UMN vs LMN',
    testNameKo: '부전마비 특성 — UMN vs LMN',
    domain: 'gait_posture',
    species: 'both',
    required: false,
    displayLevel: 1,
    dependsOn: { testID: 'gait_overall', triggerValues: ['paresis_tetraparesis','paresis_paraparesis','paresis_hemiparesis','paresis_monoparesis','plegia_tetraplegia','plegia_paraplegia'] },
    lateralityCapture: false,
    clinicalSignificance: 'high',
    note: 'UMN: spastic, hyperreflexic, no atrophy. LMN: flaccid, hyporeflexic, rapid atrophy.',
    testType: 'select',
    options: [
      {
        value: 'UMN_pelvic',
        label: 'UMN — Pelvic limbs (spastic, hyperreflexic)',
        labelKo: 'UMN — 후지 (경직, 반사 항진)',
        resultText: 'UMN pelvic limb signs; lesion cranial to L4 (T3–L3 or above)',
        resultTextKo: 'UMN 후지 징후; L4 전방 병변 (T3-L3 이상)',
        isAbnormal: true, severity: 'moderate',
        signs: ['UMN_pelvic'],
      },
      {
        value: 'LMN_pelvic',
        label: 'LMN — Pelvic limbs (flaccid, hyporeflexic, atrophy)',
        labelKo: 'LMN — 후지 (이완, 반사 감소, 근위축)',
        resultText: 'LMN pelvic limb signs; lesion at L4–S3 or peripheral nerve',
        resultTextKo: 'LMN 후지 징후; L4-S3 병변 또는 말초 신경',
        isAbnormal: true, severity: 'moderate',
        signs: ['LMN_pelvic'],
      },
      {
        value: 'UMN_thoracic',
        label: 'UMN — Thoracic limbs (spastic)',
        labelKo: 'UMN — 전지 (경직)',
        resultText: 'UMN thoracic limb signs; lesion cranial to C6 (C1–C5)',
        resultTextKo: 'UMN 전지 징후; C6 전방 병변 (C1-C5)',
        isAbnormal: true, severity: 'moderate',
        signs: ['UMN_thoracic'],
      },
      {
        value: 'LMN_thoracic',
        label: 'LMN — Thoracic limbs (flaccid, atrophy)',
        labelKo: 'LMN — 전지 (이완, 근위축)',
        resultText: 'LMN thoracic limb signs; lesion at C6–T2 or brachial plexus',
        resultTextKo: 'LMN 전지 징후; C6-T2 병변 또는 상완신경총',
        isAbnormal: true, severity: 'moderate',
        signs: ['LMN_thoracic'],
      },
      {
        value: 'mixed_UMN_pelvic_LMN_thoracic',
        label: 'LMN thoracic + UMN pelvic (C6–T2 signature)',
        labelKo: 'LMN 전지 + UMN 후지 (C6-T2 특징)',
        resultText: 'LMN thoracic + UMN pelvic limbs; C6–T2 lesion localisation',
        resultTextKo: 'LMN 전지 + UMN 후지; C6-T2 병변 국소화',
        isAbnormal: true, severity: 'severe',
        signs: ['LMN_thoracic', 'UMN_pelvic'],
      },
    ],
  },

  // ── [Level 1] Schiff-Sherrington ─────────────────────────
  {
    testID: 'schiff_sherrington',
    testName: 'Schiff-Sherrington Posture',
    testNameKo: '쉬프-셰링턴 자세',
    domain: 'gait_posture',
    species: 'both',
    required: false,
    displayLevel: 1,
    lateralityCapture: false,
    clinicalSignificance: 'high',
    howTo: 'Rigid extension of thoracic limbs with flaccid/paralysed pelvic limbs. Does NOT indicate severity of prognosis.',
    note: 'Indicates acute T3–L3 lesion. Does not change prognosis by itself.',
    testType: 'boolean',
    positiveResultText: 'Schiff-Sherrington posture present; acute T3–L3 spinal cord lesion localisation',
    positiveResultTextKo: '쉬프-셰링턴 자세 관찰; 급성 T3-L3 척수 병변 국소화',
    negativeResultText: 'No Schiff-Sherrington posture',
    negativeResultTextKo: '쉬프-셰링턴 자세 없음',
    positiveIsAbnormal: true,
    positiveSigns: ['schiff_sherrington'],
  },

  // ── [Level 1] Intention tremor / Dysmetria ────────────────
  {
    testID: 'cerebellar_signs',
    testName: 'Cerebellar Signs (Dysmetria / Intention Tremor)',
    testNameKo: '소뇌 징후 (운동이상 / 의도 진전)',
    domain: 'gait_posture',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: false,
    clinicalSignificance: 'high',
    howTo: 'Observe limb placement accuracy. Touch nose/food to elicit intention tremor of head.',
    testType: 'multiselect',
    resultTemplate: 'Cerebellar signs: {values}',
    resultTemplateKo: '소뇌 징후: {values}',
    options: [
      {
        value: 'none',
        label: 'No cerebellar signs',
        labelKo: '소뇌 징후 없음',
        resultText: 'no cerebellar signs',
        resultTextKo: '소뇌 징후 없음',
        isAbnormal: false,
      },
      {
        value: 'intention_tremor',
        label: 'Intention tremor',
        labelKo: '의도 진전',
        resultText: 'intention tremor',
        resultTextKo: '의도 진전',
        isAbnormal: true, severity: 'moderate',
        signs: ['intention_tremor'],
      },
      {
        value: 'dysmetria_hyper',
        label: 'Hypermetria (goose-stepping)',
        labelKo: '과다운동 (거위발걸음)',
        resultText: 'hypermetria (goose-stepping gait)',
        resultTextKo: '과다운동 (거위발걸음)',
        isAbnormal: true, severity: 'moderate',
        signs: ['dysmetria'],
      },
      {
        value: 'dysmetria_hypo',
        label: 'Hypometria',
        labelKo: '운동 저하',
        resultText: 'hypometria',
        resultTextKo: '운동 저하',
        isAbnormal: true, severity: 'mild',
        signs: ['dysmetria'],
      },
      {
        value: 'truncal_ataxia',
        label: 'Truncal ataxia (swaying body)',
        labelKo: '몸통 실조 (몸통 흔들림)',
        resultText: 'truncal ataxia',
        resultTextKo: '몸통 실조',
        isAbnormal: true, severity: 'moderate',
        signs: ['truncal_ataxia'],
      },
      {
        value: 'menace_absent',
        label: 'Absent menace response (with normal vision)',
        labelKo: '위협 반응 소실 (시력 정상)',
        resultText: 'absent menace response with normal vision; cerebellar involvement suspected',
        resultTextKo: '시력 정상에서 위협 반응 소실; 소뇌 이상 의심',
        isAbnormal: true, severity: 'moderate',
        signs: ['menace_absent_ipsilateral'],
      },
    ],
  },
];


// ============================================================
// SECTION 9: DOMAIN C — CRANIAL NERVE EXAMINATION CN I–IV
// ============================================================

const cranialNerveTests_I_IV: NeuroTestItem[] = [

  // ════════════════════════════════
  // CN I — OLFACTORY
  // ════════════════════════════════
  {
    testID: 'cn1_olfaction',
    testName: 'CN I — Olfactory (Smell)',
    testNameKo: 'CN I — 후각신경 (냄새)',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_I',
    species: 'both',
    required: false,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'medium',
    howTo: 'Occlude vision. Present non-irritating scent (food) near each nostril alternately. Assess response.',
    note: 'Difficult to assess reliably. Anosmia suggests cribriform plate / olfactory bulb lesion.',
    testType: 'select',
    options: [
      {
        value: 'normal',
        label: 'Normal — responds to scent bilaterally',
        labelKo: '정상 — 양측 냄새 반응 정상',
        resultText: 'CN I intact bilaterally',
        resultTextKo: 'CN I 양측 정상',
        isAbnormal: false,
      },
      {
        value: 'reduced_unilateral',
        label: 'Reduced response — unilateral',
        labelKo: '반응 감소 — 일측',
        resultText: 'Reduced olfaction unilaterally; unilateral olfactory nerve or bulb lesion suspected',
        resultTextKo: '일측 후각 감소; 일측 후각신경 또는 후각구 병변 의심',
        isAbnormal: true, severity: 'mild',
        signs: ['anosmia'],
      },
      {
        value: 'absent_bilateral',
        label: 'Absent — bilateral anosmia',
        labelKo: '소실 — 양측 후각 소실',
        resultText: 'Bilateral anosmia; cribriform plate, olfactory bulb, or nasal disease suspected',
        resultTextKo: '양측 후각 소실; 사상판, 후각구 또는 비강 질환 의심',
        isAbnormal: true, severity: 'moderate',
        signs: ['anosmia'],
      },
    ],
  },

  // ════════════════════════════════
  // CN II — OPTIC
  // ════════════════════════════════
  {
    testID: 'cn2_menace',
    testName: 'CN II + VII — Menace Response',
    testNameKo: 'CN II + VII — 위협 반응',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_II',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Make threatening gesture toward each eye separately without creating air current. Blink = intact CN II afferent + CN VII efferent + cortex/cerebellum.',
    note: 'Absent menace with intact PLR → cortical or cerebellar lesion. Absent menace + absent PLR → CN II or retinal.',
    relatedTests: ['cn2_plr', 'cn7_facial'],
    testType: 'select',
    options: [
      {
        value: 'normal_bilateral',
        label: 'Normal — both eyes blink',
        labelKo: '정상 — 양안 모두 깜빡임',
        resultText: 'Menace response intact bilaterally',
        resultTextKo: '위협 반응 양측 정상',
        isAbnormal: false,
      },
      {
        value: 'absent_left',
        label: 'Absent — LEFT eye only',
        labelKo: '소실 — 좌안만',
        resultText: 'Absent menace response LEFT eye; left CN II, left optic tract, right occipital cortex, or left CN VII suspected',
        resultTextKo: '좌안 위협 반응 소실; 좌측 CN II, 좌측 시각로, 우측 후두피질 또는 좌측 CN VII 의심',
        isAbnormal: true, severity: 'moderate',
        signs: ['menace_absent_left'],
      },
      {
        value: 'absent_right',
        label: 'Absent — RIGHT eye only',
        labelKo: '소실 — 우안만',
        resultText: 'Absent menace response RIGHT eye; right CN II, right optic tract, left occipital cortex, or right CN VII suspected',
        resultTextKo: '우안 위협 반응 소실; 우측 CN II, 우측 시각로, 좌측 후두피질 또는 우측 CN VII 의심',
        isAbnormal: true, severity: 'moderate',
        signs: ['menace_absent_right'],
      },
      {
        value: 'absent_bilateral',
        label: 'Absent — both eyes',
        labelKo: '소실 — 양안 모두',
        resultText: 'Absent menace response bilaterally; bilateral cortical, bilateral CN II, or diffuse cerebellar disease suspected',
        resultTextKo: '양측 위협 반응 소실; 양측 피질, 양측 CN II 또는 미만성 소뇌 질환 의심',
        isAbnormal: true, severity: 'severe',
        signs: ['menace_absent_left', 'menace_absent_right'],
      },
    ],
  },

  {
    testID: 'cn2_plr',
    testName: 'CN II + III — Pupillary Light Reflex (PLR)',
    testNameKo: 'CN II + III — 동공 대광 반사 (PLR)',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_II',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Shine bright light in each eye. Direct PLR: ipsilateral constriction. Consensual PLR: contralateral constriction. Assess latency and completeness.',
    relatedTests: ['cn3_pupil_size', 'cn2_menace'],
    testType: 'select',
    options: [
      {
        value: 'normal_bilateral',
        label: 'Normal direct and consensual — both eyes',
        labelKo: '직접 및 간접 반사 정상 — 양안',
        resultText: 'PLR intact direct and consensual bilaterally',
        resultTextKo: '직접 및 간접 동공 대광 반사 양측 정상',
        isAbnormal: false,
      },
      {
        value: 'absent_direct_left',
        label: 'Absent DIRECT PLR — LEFT eye (light in left → no left constriction)',
        labelKo: '직접 PLR 소실 — 좌안 (좌안 빛 → 좌안 수축 없음)',
        resultText: 'Absent direct PLR left eye; left CN II (afferent) or left CN III (efferent) lesion',
        resultTextKo: '좌안 직접 동공 대광 반사 소실; 좌측 CN II(구심성) 또는 좌측 CN III(원심성) 병변',
        isAbnormal: true, severity: 'moderate',
        signs: ['PLR_absent_direct_left'],
      },
      {
        value: 'absent_direct_right',
        label: 'Absent DIRECT PLR — RIGHT eye',
        labelKo: '직접 PLR 소실 — 우안',
        resultText: 'Absent direct PLR right eye; right CN II (afferent) or right CN III (efferent) lesion',
        resultTextKo: '우안 직접 동공 대광 반사 소실; 우측 CN II(구심성) 또는 우측 CN III(원심성) 병변',
        isAbnormal: true, severity: 'moderate',
        signs: ['PLR_absent_direct_right'],
      },
      {
        value: 'absent_consensual_left',
        label: 'Absent CONSENSUAL PLR — LEFT eye (light in right → no left constriction)',
        labelKo: '간접 PLR 소실 — 좌안 (우안 빛 → 좌안 수축 없음)',
        resultText: 'Absent consensual PLR left eye; left CN III efferent lesion or left optic chiasm',
        resultTextKo: '좌안 간접 동공 대광 반사 소실; 좌측 CN III 원심성 병변 또는 좌측 시각교차 병변',
        isAbnormal: true, severity: 'moderate',
        signs: ['PLR_absent_consensual_left'],
      },
      {
        value: 'absent_consensual_right',
        label: 'Absent CONSENSUAL PLR — RIGHT eye',
        labelKo: '간접 PLR 소실 — 우안',
        resultText: 'Absent consensual PLR right eye; right CN III efferent lesion or right optic chiasm',
        resultTextKo: '우안 간접 동공 대광 반사 소실; 우측 CN III 원심성 병변 또는 우측 시각교차 병변',
        isAbnormal: true, severity: 'moderate',
        signs: ['PLR_absent_consensual_right'],
      },
      {
        value: 'absent_all',
        label: 'Absent ALL PLR (direct and consensual, both eyes)',
        labelKo: '모든 PLR 소실 (직접/간접, 양안)',
        resultText: 'All PLR absent; bilateral CN II or severe midbrain lesion suspected',
        resultTextKo: '모든 동공 대광 반사 소실; 양측 CN II 또는 중증 중뇌 병변 의심',
        isAbnormal: true, severity: 'complete',
        signs: ['PLR_absent_direct_left','PLR_absent_direct_right','PLR_absent_consensual_left','PLR_absent_consensual_right'],
      },
    ],
  },

  {
    testID: 'cn2_vision_tracking',
    testName: 'CN II — Visual Tracking / Cotton Ball Test',
    testNameKo: 'CN II — 시각 추적 / 솜뭉치 검사',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_II',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Drop cotton ball in visual field (no air current). Assess tracking. Cover alternate eyes. Test each visual field (nasal/temporal).',
    testType: 'select',
    options: [
      {
        value: 'normal',
        label: 'Tracks normally — both eyes, all fields',
        labelKo: '정상 추적 — 양안, 전 시야',
        resultText: 'Visual tracking intact bilaterally',
        resultTextKo: '시각 추적 양측 정상',
        isAbnormal: false,
      },
      {
        value: 'deficit_left_eye',
        label: 'Vision deficit — LEFT eye',
        labelKo: '시각 결손 — 좌안',
        resultText: 'Vision deficit left eye; left retina, left CN II, or contralateral occipital cortex suspected',
        resultTextKo: '좌안 시각 결손; 좌측 망막, 좌측 CN II 또는 반대측 후두피질 의심',
        isAbnormal: true, severity: 'moderate',
        signs: ['vision_deficit_left'],
      },
      {
        value: 'deficit_right_eye',
        label: 'Vision deficit — RIGHT eye',
        labelKo: '시각 결손 — 우안',
        resultText: 'Vision deficit right eye; right retina, right CN II, or contralateral occipital cortex suspected',
        resultTextKo: '우안 시각 결손; 우측 망막, 우측 CN II 또는 반대측 후두피질 의심',
        isAbnormal: true, severity: 'moderate',
        signs: ['vision_deficit_right'],
      },
      {
        value: 'deficit_bilateral',
        label: 'Vision deficit — both eyes (bilateral blindness)',
        labelKo: '시각 결손 — 양안 (양측 실명)',
        resultText: 'Bilateral visual deficit; bilateral CN II, bilateral occipital cortex, or bilateral optic tract lesion suspected',
        resultTextKo: '양안 시각 결손; 양측 CN II, 양측 후두피질 또는 양측 시각로 병변 의심',
        isAbnormal: true, severity: 'severe',
        signs: ['vision_deficit_bilateral'],
      },
    ],
  },

  // ════════════════════════════════
  // CN III — OCULOMOTOR
  // ════════════════════════════════
  {
    testID: 'cn3_pupil_size',
    testName: 'CN III — Pupil Size Assessment (Anisocoria)',
    testNameKo: 'CN III — 동공 크기 평가 (동공 부등)',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_III',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Assess in dim AND bright light. If difference increases in dim light → sympathetic deficit (Horner\'s). If increases in bright light → CN III or sympathetic.',
    relatedTests: ['cn2_plr', 'autonomic_horners'],
    testType: 'select',
    options: [
      {
        value: 'isocoric_normal',
        label: 'Isocoric — equal and normal size',
        labelKo: '동동공 — 크기 동일 및 정상',
        resultText: 'Pupils isocoric and normally sized',
        resultTextKo: '동동공, 정상 크기',
        isAbnormal: false,
      },
      {
        value: 'anisocoria_left_larger',
        label: 'Anisocoria — LEFT pupil LARGER (left mydriasis)',
        labelKo: '동공 부등 — 좌측 동공 확대',
        resultText: 'Left mydriasis / anisocoria; left CN III lesion (parasympathetic loss) or right sympathetic excess',
        resultTextKo: '좌측 동공 확대/동공 부등; 좌측 CN III 병변(부교감 소실) 또는 우측 교감 항진',
        isAbnormal: true, severity: 'moderate',
        signs: ['anisocoria_left_larger'],
      },
      {
        value: 'anisocoria_right_larger',
        label: 'Anisocoria — RIGHT pupil LARGER (right mydriasis)',
        labelKo: '동공 부등 — 우측 동공 확대',
        resultText: 'Right mydriasis / anisocoria; right CN III lesion or left sympathetic excess',
        resultTextKo: '우측 동공 확대/동공 부등; 우측 CN III 병변 또는 좌측 교감 항진',
        isAbnormal: true, severity: 'moderate',
        signs: ['anisocoria_right_larger'],
      },
      {
        value: 'bilateral_mydriasis',
        label: 'Bilateral mydriasis (both pupils fixed and dilated)',
        labelKo: '양측 동공 산대 (고정 산대)',
        resultText: 'Bilateral fixed dilated pupils; severe midbrain lesion, bilateral CN III, or drug effect suspected',
        resultTextKo: '양측 동공 고정 산대; 중증 중뇌 병변, 양측 CN III 또는 약물 효과 의심',
        isAbnormal: true, severity: 'complete',
        signs: ['mydriasis_bilateral'],
      },
      {
        value: 'miosis_unilateral',
        label: 'Unilateral miosis (smaller pupil)',
        labelKo: '일측성 동공 축소',
        resultText: 'Unilateral miosis; Horner\'s syndrome component suspected (sympathetic deficit)',
        resultTextKo: '일측성 동공 축소; 호르너 증후군 요소 의심(교감신경 결핍)',
        isAbnormal: true, severity: 'mild',
        signs: ['horners_miosis', 'miosis_unilateral'],
      },
    ],
  },

  {
    testID: 'cn3_strabismus',
    testName: 'CN III / IV / VI — Strabismus (Ocular Position)',
    testNameKo: 'CN III / IV / VI — 사시 (안구 위치)',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_III',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Observe resting eye position. Check for positional strabismus (changes with head position = vestibular).',
    relatedTests: ['cn8_vestibular', 'cn3_pupil_size'],
    note: 'Positional strabismus (ventrolateral on side of head tilt) = peripheral vestibular. Fixed strabismus = CN III/IV/VI nuclear lesion.',
    testType: 'multiselect',
    resultTemplate: 'Strabismus findings: {values}',
    resultTemplateKo: '사시 소견: {values}',
    options: [
      {
        value: 'none',
        label: 'Orthotopic — no strabismus',
        labelKo: '정상 안구 위치 — 사시 없음',
        resultText: 'no strabismus; normal ocular position',
        resultTextKo: '사시 없음; 정상 안구 위치',
        isAbnormal: false,
      },
      {
        value: 'ventrolateral_left',
        label: 'Ventrolateral strabismus — LEFT eye',
        labelKo: '복외측 사시 — 좌안',
        resultText: 'Ventrolateral strabismus left eye; left CN III palsy or left vestibular disease suspected',
        resultTextKo: '좌안 복외측 사시; 좌측 CN III 마비 또는 좌측 전정계 질환 의심',
        isAbnormal: true, severity: 'moderate',
        signs: ['strabismus_ventrolateral'],
      },
      {
        value: 'ventrolateral_right',
        label: 'Ventrolateral strabismus — RIGHT eye',
        labelKo: '복외측 사시 — 우안',
        resultText: 'Ventrolateral strabismus right eye; right CN III palsy or right vestibular disease suspected',
        resultTextKo: '우안 복외측 사시; 우측 CN III 마비 또는 우측 전정계 질환 의심',
        isAbnormal: true, severity: 'moderate',
        signs: ['strabismus_ventrolateral'],
      },
      {
        value: 'dorsomedial_left',
        label: 'Dorsomedial strabismus — LEFT eye (CN VI palsy)',
        labelKo: '배내측 사시 — 좌안 (CN VI 마비)',
        resultText: 'Dorsomedial strabismus left eye; left CN VI (abducens) palsy suspected',
        resultTextKo: '좌안 배내측 사시; 좌측 CN VI(외전신경) 마비 의심',
        isAbnormal: true, severity: 'moderate',
        signs: ['strabismus_dorsomedial'],
      },
      {
        value: 'dorsomedial_right',
        label: 'Dorsomedial strabismus — RIGHT eye (CN VI palsy)',
        labelKo: '배내측 사시 — 우안 (CN VI 마비)',
        resultText: 'Dorsomedial strabismus right eye; right CN VI (abducens) palsy suspected',
        resultTextKo: '우안 배내측 사시; 우측 CN VI(외전신경) 마비 의심',
        isAbnormal: true, severity: 'moderate',
        signs: ['strabismus_dorsomedial'],
      },
      {
        value: 'positional_vestibular',
        label: 'Positional strabismus (changes with head position)',
        labelKo: '체위성 사시 (머리 위치에 따라 변함)',
        resultText: 'Positional strabismus; peripheral or central vestibular disease',
        resultTextKo: '체위성 사시; 말초 또는 중추 전정계 질환',
        isAbnormal: true, severity: 'moderate',
        signs: ['strabismus_other'],
      },
    ],
  },

  // ════════════════════════════════
  // CN IV — TROCHLEAR
  // ════════════════════════════════
  {
    testID: 'cn4_trochlear',
    testName: 'CN IV — Trochlear (Extorsion)',
    testNameKo: 'CN IV — 도르래신경 (안구 외전)',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_IV',
    species: 'both',
    required: false,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'medium',
    howTo: 'Observe fundic vessels and optic disc orientation. Extorsion (dorsal rotation of globe) suggests CN IV lesion — most visible in cats.',
    note: 'CN IV palsy causes extorsion and dorsomedial strabismus. Very subtle — most reliably assessed by fundic examination in cats.',
    testType: 'select',
    options: [
      {
        value: 'normal',
        label: 'Normal fundic orientation',
        labelKo: '정상 안저 방향',
        resultText: 'CN IV intact; normal fundic orientation',
        resultTextKo: 'CN IV 정상; 안저 방향 정상',
        isAbnormal: false,
      },
      {
        value: 'extorsion_left',
        label: 'Extorsion — LEFT eye (dorsal rotation)',
        labelKo: '외전 — 좌안 (등쪽 회전)',
        resultText: 'Left globe extorsion; left CN IV (trochlear) lesion suspected',
        resultTextKo: '좌안 외전; 좌측 CN IV(도르래신경) 병변 의심',
        isAbnormal: true, severity: 'mild',
      },
      {
        value: 'extorsion_right',
        label: 'Extorsion — RIGHT eye',
        labelKo: '외전 — 우안',
        resultText: 'Right globe extorsion; right CN IV (trochlear) lesion suspected',
        resultTextKo: '우안 외전; 우측 CN IV(도르래신경) 병변 의심',
        isAbnormal: true, severity: 'mild',
      },
    ],
  },
];



// ============================================================
// SECTION 10: DOMAIN C — CN V (TRIGEMINAL)
// ============================================================

const cranialNerveTests_V: NeuroTestItem[] = [

  // ── [Level 1] CN V Sensory — Facial Sensation ─────────────
  {
    testID: 'cn5_facial_sensation',
    testName: 'CN V — Facial Sensation (Trigeminal Sensory)',
    testNameKo: 'CN V — 안면 감각 (삼차신경 감각)',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_V',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Apply gentle pinprick / haemostat to nasal mucosa, periocular skin, lip. Watch for withdrawal (blink, head turn). Assess each of: ophthalmic, maxillary, mandibular branches.',
    relatedTests: ['cn5_motor', 'cn7_facial'],
    note: 'CN V sensory: afferent for palpebral reflex and corneal reflex. Distinguish from CN VII (efferent/motor).',
    testType: 'select',
    options: [
      {
        value: 'normal_bilateral',
        label: 'Normal facial sensation — bilateral',
        labelKo: '정상 안면 감각 — 양측',
        resultText: 'CN V facial sensation intact bilaterally',
        resultTextKo: 'CN V 안면 감각 양측 정상',
        isAbnormal: false,
      },
      {
        value: 'hypoalgesia_left',
        label: 'Facial hypoalgesia — LEFT side',
        labelKo: '안면 통각 저하 — 좌측',
        resultText: 'Left facial hypoalgesia; left CN V (trigeminal) lesion or left brainstem lesion suspected',
        resultTextKo: '좌측 안면 통각 저하; 좌측 CN V 병변 또는 좌측 뇌간 병변 의심',
        isAbnormal: true, severity: 'moderate',
        signs: ['facial_hypoalgesia_ipsilateral'],
      },
      {
        value: 'hypoalgesia_right',
        label: 'Facial hypoalgesia — RIGHT side',
        labelKo: '안면 통각 저하 — 우측',
        resultText: 'Right facial hypoalgesia; right CN V or right brainstem lesion suspected',
        resultTextKo: '우측 안면 통각 저하; 우측 CN V 또는 우측 뇌간 병변 의심',
        isAbnormal: true, severity: 'moderate',
        signs: ['facial_hypoalgesia_ipsilateral'],
      },
      {
        value: 'hypoalgesia_contralateral',
        label: 'Contralateral facial hypoalgesia (crossed pattern)',
        labelKo: '반대측 안면 통각 저하 (교차 패턴)',
        resultText: 'Contralateral facial hypoalgesia with ipsilateral body deficits; medullary or pontine lesion (crossed syndrome) suspected',
        resultTextKo: '동측 체간 결손을 동반한 반대측 안면 통각 저하; 연수 또는 교뇌 병변(교차 증후군) 의심',
        isAbnormal: true, severity: 'severe',
        signs: ['facial_hypoalgesia_contralateral'],
      },
      {
        value: 'absent_bilateral',
        label: 'Absent — bilateral facial anaesthesia',
        labelKo: '소실 — 양측 안면 마취',
        resultText: 'Bilateral facial anaesthesia; bilateral CN V or diffuse brainstem lesion suspected',
        resultTextKo: '양측 안면 무감각; 양측 CN V 또는 미만성 뇌간 병변 의심',
        isAbnormal: true, severity: 'severe',
      },
    ],
  },

  // ── [Level 1] CN V Motor — Jaw / Masseter ─────────────────
  {
    testID: 'cn5_motor',
    testName: 'CN V — Jaw Motor (Masseter / Temporalis)',
    testNameKo: 'CN V — 하악 운동 (교근/측두근)',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_V',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Observe jaw tone when opening mouth. Palpate masseter and temporalis for symmetry and bulk. Open mouth against resistance.',
    note: 'Bilateral CN V motor loss → dropped jaw syndrome. Unilateral → asymmetric muscle atrophy.',
    testType: 'select',
    options: [
      {
        value: 'normal',
        label: 'Normal jaw tone and muscle bulk bilateral',
        labelKo: '정상 하악 긴장도 및 근육량 양측',
        resultText: 'CN V motor (jaw) intact bilaterally',
        resultTextKo: 'CN V 하악 운동 기능 양측 정상',
        isAbnormal: false,
      },
      {
        value: 'atrophy_left',
        label: 'Masseter / Temporalis atrophy — LEFT',
        labelKo: '교근/측두근 위축 — 좌측',
        resultText: 'Left masticatory muscle atrophy; left CN V motor branch or left trigeminal nucleus lesion suspected',
        resultTextKo: '좌측 저작근 위축; 좌측 CN V 운동 분지 또는 좌측 삼차신경 핵 병변 의심',
        isAbnormal: true, severity: 'moderate',
        signs: ['masseter_atrophy'],
      },
      {
        value: 'atrophy_right',
        label: 'Masseter / Temporalis atrophy — RIGHT',
        labelKo: '교근/측두근 위축 — 우측',
        resultText: 'Right masticatory muscle atrophy; right CN V motor lesion suspected',
        resultTextKo: '우측 저작근 위축; 우측 CN V 운동 병변 의심',
        isAbnormal: true, severity: 'moderate',
        signs: ['masseter_atrophy'],
      },
      {
        value: 'dropped_jaw',
        label: 'Dropped jaw (bilateral — cannot close mouth)',
        labelKo: '하악 하수 (양측 — 입 다물기 불가)',
        resultText: 'Dropped jaw syndrome; bilateral CN V motor lesion or masticatory muscle myositis suspected',
        resultTextKo: '하악 하수 증후군; 양측 CN V 운동 병변 또는 저작근 근염 의심',
        isAbnormal: true, severity: 'severe',
        signs: ['jaw_drop'],
      },
    ],
  },

  // ── [Level 1] Palpebral Reflex (CN V afferent, CN VII efferent)
  {
    testID: 'cn5_palpebral_reflex',
    testName: 'CN V + VII — Palpebral Reflex',
    testNameKo: 'CN V + VII — 안검 반사',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_V',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Touch medial and lateral canthi with fingertip. Normal = blink. Afferent: CN V. Efferent: CN VII.',
    relatedTests: ['cn7_facial', 'cn5_facial_sensation'],
    testType: 'select',
    options: [
      {
        value: 'normal_bilateral',
        label: 'Normal — both eyes blink to touch',
        labelKo: '정상 — 양안 모두 촉각에 깜빡임',
        resultText: 'Palpebral reflex intact bilaterally',
        resultTextKo: '안검 반사 양측 정상',
        isAbnormal: false,
      },
      {
        value: 'absent_left',
        label: 'Absent — LEFT eye',
        labelKo: '소실 — 좌안',
        resultText: 'Absent palpebral reflex left; left CN V afferent or left CN VII efferent lesion',
        resultTextKo: '좌안 안검 반사 소실; 좌측 CN V 구심성 또는 좌측 CN VII 원심성 병변',
        isAbnormal: true, severity: 'moderate',
      },
      {
        value: 'absent_right',
        label: 'Absent — RIGHT eye',
        labelKo: '소실 — 우안',
        resultText: 'Absent palpebral reflex right; right CN V afferent or right CN VII efferent lesion',
        resultTextKo: '우안 안검 반사 소실; 우측 CN V 구심성 또는 우측 CN VII 원심성 병변',
        isAbnormal: true, severity: 'moderate',
      },
      {
        value: 'absent_bilateral',
        label: 'Absent — bilateral',
        labelKo: '소실 — 양측',
        resultText: 'Absent palpebral reflex bilaterally; bilateral CN V or VII lesion or severe brainstem disease',
        resultTextKo: '양측 안검 반사 소실; 양측 CN V 또는 VII 병변 또는 중증 뇌간 질환',
        isAbnormal: true, severity: 'severe',
      },
    ],
  },

  // ── [Level 1] Corneal Reflex ──────────────────────────────
  {
    testID: 'cn5_corneal_reflex',
    testName: 'CN V + VII — Corneal Reflex',
    testNameKo: 'CN V + VII — 각막 반사',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_V',
    species: 'both',
    required: false,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Gently touch cornea with moist cotton wisp. Response: blink and globe retraction. Afferent CN V ophthalmic branch; efferent CN VII + CN VI.',
    testType: 'boolean',
    positiveResultText: 'Corneal reflex present bilaterally',
    positiveResultTextKo: '각막 반사 양측 정상',
    negativeResultText: 'Absent corneal reflex; CN V ophthalmic branch or CN VII lesion suspected',
    negativeResultTextKo: '각막 반사 소실; CN V 안과 분지 또는 CN VII 병변 의심',
    positiveIsAbnormal: false,
  },
];


// ============================================================
// SECTION 11: DOMAIN C — CN VI (ABDUCENS)
// ============================================================
// CN VI assessed within cn3_strabismus (dorsomedial strabismus).
// Separate item for medial strabismus / inability to abduct:

const cranialNerveTests_VI: NeuroTestItem[] = [
  {
    testID: 'cn6_abduction',
    testName: 'CN VI — Abducens (Lateral Eye Movement)',
    testNameKo: 'CN VI — 외전신경 (안구 외전 운동)',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_VI',
    species: 'both',
    required: false,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'medium',
    howTo: 'Move visual target laterally. Normal = eye tracks fully to lateral canthus. CN VI palsy = cannot abduct (medial strabismus at rest).',
    testType: 'select',
    options: [
      {
        value: 'normal',
        label: 'Full abduction — both eyes',
        labelKo: '완전 외전 — 양안',
        resultText: 'CN VI intact bilaterally; full lateral eye movement',
        resultTextKo: 'CN VI 양측 정상; 완전 안구 외전',
        isAbnormal: false,
      },
      {
        value: 'deficit_left',
        label: 'Impaired abduction — LEFT eye (medial strabismus)',
        labelKo: '외전 장애 — 좌안 (내측 사시)',
        resultText: 'Left abduction deficit; left CN VI (abducens) palsy; pontine lesion suspected',
        resultTextKo: '좌안 외전 장애; 좌측 CN VI(외전신경) 마비; 교뇌 병변 의심',
        isAbnormal: true, severity: 'moderate',
        signs: ['strabismus_dorsomedial'],
      },
      {
        value: 'deficit_right',
        label: 'Impaired abduction — RIGHT eye',
        labelKo: '외전 장애 — 우안',
        resultText: 'Right abduction deficit; right CN VI palsy; pontine lesion suspected',
        resultTextKo: '우안 외전 장애; 우측 CN VI 마비; 교뇌 병변 의심',
        isAbnormal: true, severity: 'moderate',
        signs: ['strabismus_dorsomedial'],
      },
    ],
  },
];


// ============================================================
// SECTION 12: DOMAIN C — CN VII (FACIAL)
// ============================================================

const cranialNerveTests_VII: NeuroTestItem[] = [

  {
    testID: 'cn7_facial',
    testName: 'CN VII — Facial Nerve (Motor)',
    testNameKo: 'CN VII — 안면신경 (운동)',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_VII',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Observe lip, ear, and eyelid symmetry at rest and with stimulation. Lip droop, ear drop, inability to blink = CN VII paresis.',
    relatedTests: ['cn5_palpebral_reflex', 'autonomic_horners', 'cn7_schirmer'],
    testType: 'select',
    options: [
      {
        value: 'normal',
        label: 'Normal facial symmetry — bilateral',
        labelKo: '정상 안면 대칭 — 양측',
        resultText: 'CN VII intact bilaterally; normal facial symmetry',
        resultTextKo: 'CN VII 양측 정상; 안면 대칭 정상',
        isAbnormal: false,
      },
      {
        value: 'paresis_left',
        label: 'Facial paresis — LEFT (lip droop, ear droop, incomplete blink)',
        labelKo: '안면 부전마비 — 좌측 (입술 하수, 귀 하수, 불완전 눈 깜빡임)',
        resultText: 'Left facial paresis (CN VII); left peripheral CN VII or left facial nucleus (pons) lesion suspected',
        resultTextKo: '좌측 안면 부전마비(CN VII); 좌측 말초 CN VII 또는 좌측 안면핵(교뇌) 병변 의심',
        isAbnormal: true, severity: 'moderate',
        signs: ['facial_paresis_ipsilateral', 'lip_droop', 'ear_droop', 'eye_droop'],
      },
      {
        value: 'paresis_right',
        label: 'Facial paresis — RIGHT',
        labelKo: '안면 부전마비 — 우측',
        resultText: 'Right facial paresis (CN VII); right peripheral CN VII or pontine lesion suspected',
        resultTextKo: '우측 안면 부전마비(CN VII); 우측 말초 CN VII 또는 교뇌 병변 의심',
        isAbnormal: true, severity: 'moderate',
        signs: ['facial_paresis_ipsilateral', 'lip_droop', 'ear_droop', 'eye_droop'],
      },
      {
        value: 'paresis_bilateral',
        label: 'Facial paresis — BILATERAL',
        labelKo: '안면 부전마비 — 양측',
        resultText: 'Bilateral facial paresis; bilateral peripheral CN VII, polyneuropathy, or pontine lesion suspected',
        resultTextKo: '양측 안면 부전마비; 양측 말초 CN VII, 다발신경병증 또는 교뇌 병변 의심',
        isAbnormal: true, severity: 'severe',
        signs: ['facial_paresis_bilateral'],
      },
    ],
  },

  // ── [Level 2] Facial paresis components ──────────────────
  {
    testID: 'cn7_paresis_components',
    testName: 'CN VII — Paresis Components',
    testNameKo: 'CN VII — 부전마비 세부 소견',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_VII',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'cn7_facial', triggerValues: ['paresis_left','paresis_right','paresis_bilateral'] },
    lateralityCapture: true,
    clinicalSignificance: 'medium',
    testType: 'multiselect',
    resultTemplate: 'CN VII paresis components: {values}',
    resultTemplateKo: 'CN VII 부전마비 세부 소견: {values}',
    options: [
      { value: 'lip_droop', label: 'Lip droop / deviation', labelKo: '입술 하수/편위',
        resultText: 'lip droop or deviation', resultTextKo: '입술 하수/편위', isAbnormal: true, signs: ['lip_droop'] },
      { value: 'ear_droop', label: 'Ear droop (pinnae drop)', labelKo: '귀 하수',
        resultText: 'ear droop', resultTextKo: '귀 하수', isAbnormal: true, signs: ['ear_droop'] },
      { value: 'incomplete_blink', label: 'Incomplete blink / lagophthalmos', labelKo: '불완전 눈 깜빡임/토안',
        resultText: 'incomplete blink (lagophthalmos)', resultTextKo: '불완전 눈 깜빡임(토안)', isAbnormal: true, signs: ['eye_droop'] },
      { value: 'nose_deviation', label: 'Nose deviation (away from lesion)', labelKo: '코 편위 (병변 반대측)',
        resultText: 'nose deviation', resultTextKo: '코 편위', isAbnormal: true },
    ],
  },

  // ── [Level 1] Schirmer Tear Test (CN VII parasympathetic) ─
  {
    testID: 'cn7_schirmer',
    testName: 'CN VII — Schirmer Tear Test (Lacrimation)',
    testNameKo: 'CN VII — 쉬르머 눈물 검사 (누액 분비)',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_VII',
    species: 'both',
    required: false,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Schirmer tear test strip in lower conjunctival fornix for 60 seconds. Normal dog: ≥15mm/min. Normal cat: ≥10mm/min.',
    note: 'Decreased STT with CN VII paresis → parasympathetic (lacrimal) branch involvement; risk of KCS.',
    testType: 'range',
    unit: 'mm/min',
    normalRange: { dog: { min: 15 }, cat: { min: 10 } },
    ranges: [
      { min: 15, max: null, resultText: 'Schirmer tear test normal (dog ≥15mm/min)', resultTextKo: '쉬르머 검사 정상 (개 ≥15mm/분)', isAbnormal: false },
      { min: 10, max: 15, resultText: 'Borderline tear production (10–14mm/min); early KCS or CN VII parasympathetic involvement', resultTextKo: '경계선 눈물 분비(10-14mm/분); 초기 KCS 또는 CN VII 부교감 관련', isAbnormal: true, severity: 'mild', signs: ['decreased_tear_production'] },
      { min: 0, max: 10, resultText: 'Decreased tear production (<10mm/min); CN VII parasympathetic branch lesion or KCS', resultTextKo: '눈물 분비 감소(<10mm/분); CN VII 부교감 분지 병변 또는 KCS', isAbnormal: true, severity: 'moderate', signs: ['decreased_tear_production'] },
    ],
  },
];


// ============================================================
// SECTION 13: DOMAIN C — CN VIII (VESTIBULOCOCHLEAR)
// The most detailed section — nystagmus subtyping is critical
// ============================================================

const cranialNerveTests_VIII: NeuroTestItem[] = [

  // ── [Level 1] Vestibular signs — overall gate ─────────────
  {
    testID: 'cn8_vestibular',
    testName: 'CN VIII — Vestibular Signs (Overall)',
    testNameKo: 'CN VIII — 전정 징후 (전체)',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_VIII',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: false,
    clinicalSignificance: 'high',
    testType: 'select',
    options: [
      { value: 'normal', label: 'No vestibular signs', labelKo: '전정 징후 없음',
        resultText: 'No vestibular signs', resultTextKo: '전정 징후 없음', isAbnormal: false },
      { value: 'abnormal', label: 'Vestibular signs present', labelKo: '전정 징후 있음',
        resultText: 'Vestibular signs present; assess sub-items', resultTextKo: '전정 징후 있음; 세부 항목 평가',
        isAbnormal: true, severity: 'moderate' },
    ],
  },

  // ── [Level 2] Head Tilt ───────────────────────────────────
  {
    testID: 'cn8_head_tilt',
    testName: 'CN VIII — Head Tilt',
    testNameKo: 'CN VIII — 두부 경사',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_VIII',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'cn8_vestibular', triggerValues: ['abnormal'] },
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Observe ear-to-shoulder tilt at rest. Note: head tilt toward lesion side in PERIPHERAL; same rule in central but may have paradoxical presentation.',
    note: 'Head tilt direction = side of lesion in peripheral vestibular disease.',
    testType: 'select',
    options: [
      { value: 'none', label: 'No head tilt', labelKo: '두부 경사 없음',
        resultText: 'No head tilt', resultTextKo: '두부 경사 없음', isAbnormal: false },
      { value: 'left', label: 'Head tilt — LEFT (left ear toward shoulder)',
        labelKo: '두부 경사 — 좌측 (좌측 귀가 어깨 방향)',
        resultText: 'Head tilt left; left vestibular lesion suspected',
        resultTextKo: '좌측 두부 경사; 좌측 전정 병변 의심',
        isAbnormal: true, severity: 'moderate', signs: ['head_tilt_left'] },
      { value: 'right', label: 'Head tilt — RIGHT',
        labelKo: '두부 경사 — 우측',
        resultText: 'Head tilt right; right vestibular lesion suspected',
        resultTextKo: '우측 두부 경사; 우측 전정 병변 의심',
        isAbnormal: true, severity: 'moderate', signs: ['head_tilt_right'] },
    ],
  },

  // ── [Level 2] Nystagmus Presence ─────────────────────────
  {
    testID: 'cn8_nystagmus_presence',
    testName: 'CN VIII — Nystagmus Presence',
    testNameKo: 'CN VIII — 안구 진탕 유무',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_VIII',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'cn8_vestibular', triggerValues: ['abnormal'] },
    lateralityCapture: false,
    clinicalSignificance: 'high',
    howTo: 'Observe eyes at rest (spontaneous) and with head in various positions (positional). Note direction of fast phase.',
    testType: 'boolean',
    positiveResultText: 'Nystagmus present; assess type, direction, and fast phase below',
    positiveResultTextKo: '안구 진탕 있음; 유형, 방향, 급속안구운동 방향 세부 평가 필요',
    negativeResultText: 'No nystagmus observed',
    negativeResultTextKo: '안구 진탕 없음',
    positiveIsAbnormal: true,
  },

  // ── [Level 3] Nystagmus Type ← nystagmus_presence = true ──
  {
    testID: 'cn8_nystagmus_type',
    testName: 'Nystagmus — Occurrence Type',
    testNameKo: '안구 진탕 — 발생 유형',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_VIII',
    species: 'both',
    required: false,
    displayLevel: 3,
    dependsOn: { testID: 'cn8_nystagmus_presence', triggerValues: ['true'] },
    lateralityCapture: false,
    clinicalSignificance: 'high',
    note: 'Spontaneous = seen at rest. Positional = only with head in certain positions. Positional nystagmus that changes direction with head position strongly suggests CENTRAL.',
    testType: 'select',
    options: [
      { value: 'spontaneous_persistent',
        label: 'Spontaneous — persistent (present at rest, does not fatigue)',
        labelKo: '자발성 — 지속성 (안정 시 존재, 피로 없음)',
        resultText: 'Persistent spontaneous nystagmus; vestibular disease (peripheral or central)',
        resultTextKo: '지속성 자발성 안구 진탕; 전정 질환 (말초 또는 중추)',
        isAbnormal: true, severity: 'moderate' },
      { value: 'spontaneous_fatigable',
        label: 'Spontaneous — fatigable (diminishes with gaze fixation)',
        labelKo: '자발성 — 피로성 (응시 고정 시 감소)',
        resultText: 'Fatigable spontaneous nystagmus; peripheral vestibular disease more likely',
        resultTextKo: '피로성 자발성 안구 진탕; 말초 전정 질환 가능성 높음',
        isAbnormal: true, severity: 'mild' },
      { value: 'positional',
        label: 'Positional — only with head position change',
        labelKo: '체위성 — 두부 자세 변화 시에만 발생',
        resultText: 'Positional nystagmus; seen only with specific head positions',
        resultTextKo: '체위성 안구 진탕; 특정 두부 자세에서만 관찰',
        isAbnormal: true, severity: 'mild',
        signs: ['nystagmus_positional'] },
    ],
  },

  // ── [Level 3] Nystagmus Direction ────────────────────────
  {
    testID: 'cn8_nystagmus_direction',
    testName: 'Nystagmus — Direction of Plane',
    testNameKo: '안구 진탕 — 운동 방향',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_VIII',
    species: 'both',
    required: false,
    displayLevel: 3,
    dependsOn: { testID: 'cn8_nystagmus_presence', triggerValues: ['true'] },
    lateralityCapture: false,
    clinicalSignificance: 'high',
    note: 'CRITICAL: Vertical or rotatory nystagmus = CENTRAL until proven otherwise. Horizontal nystagmus can be peripheral OR central.',
    testType: 'select',
    options: [
      { value: 'horizontal',
        label: 'Horizontal',
        labelKo: '수평',
        resultText: 'Horizontal nystagmus; peripheral vestibular more likely but central not excluded',
        resultTextKo: '수평 안구 진탕; 말초 전정 가능성 높으나 중추 배제 불가',
        isAbnormal: true, severity: 'mild',
        signs: ['nystagmus_horizontal'] },
      { value: 'vertical',
        label: 'Vertical — CENTRAL sign',
        labelKo: '수직 — 중추 징후',
        resultText: 'Vertical nystagmus; CENTRAL vestibular disease strongly suspected (brainstem or cerebellum)',
        resultTextKo: '수직 안구 진탕; 중추 전정 질환 강력 의심 (뇌간 또는 소뇌)',
        isAbnormal: true, severity: 'severe',
        signs: ['nystagmus_vertical'] },
      { value: 'rotatory',
        label: 'Rotatory — CENTRAL sign',
        labelKo: '회전성 — 중추 징후',
        resultText: 'Rotatory nystagmus; CENTRAL vestibular disease suspected',
        resultTextKo: '회전성 안구 진탕; 중추 전정 질환 의심',
        isAbnormal: true, severity: 'severe',
        signs: ['nystagmus_rotatory'] },
    ],
  },

  // ── [Level 3] Nystagmus Fast Phase Direction ──────────────
  {
    testID: 'cn8_nystagmus_fast_phase',
    testName: 'Nystagmus — Fast Phase Direction',
    testNameKo: '안구 진탕 — 급속안구운동 방향',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_VIII',
    species: 'both',
    required: false,
    displayLevel: 3,
    dependsOn: { testID: 'cn8_nystagmus_presence', triggerValues: ['true'] },
    lateralityCapture: false,
    clinicalSignificance: 'high',
    note: 'Fast phase is away from the lesion side in peripheral vestibular disease. If fast phase changes direction with head position → CENTRAL.',
    testType: 'select',
    options: [
      { value: 'left',
        label: 'Fast phase — LEFT',
        labelKo: '급속안구운동 — 좌측',
        resultText: 'Fast phase left; lesion likely RIGHT vestibular (peripheral) or variable (central)',
        resultTextKo: '급속안구운동 좌측; 우측 전정 병변 가능(말초) 또는 가변적(중추)',
        isAbnormal: true, signs: ['nystagmus_fast_phase_left'] },
      { value: 'right',
        label: 'Fast phase — RIGHT',
        labelKo: '급속안구운동 — 우측',
        resultText: 'Fast phase right; lesion likely LEFT vestibular (peripheral) or variable (central)',
        resultTextKo: '급속안구운동 우측; 좌측 전정 병변 가능(말초) 또는 가변적(중추)',
        isAbnormal: true, signs: ['nystagmus_fast_phase_right'] },
      { value: 'up',
        label: 'Fast phase — UPWARD',
        labelKo: '급속안구운동 — 상방',
        resultText: 'Upbeat nystagmus (fast phase up); CENTRAL vestibular — brainstem lesion suspected',
        resultTextKo: '상향 안구 진탕(급속안구운동 상방); 중추 전정 — 뇌간 병변 의심',
        isAbnormal: true, severity: 'severe', signs: ['nystagmus_fast_phase_up'] },
      { value: 'down',
        label: 'Fast phase — DOWNWARD',
        labelKo: '급속안구운동 — 하방',
        resultText: 'Downbeat nystagmus (fast phase down); CENTRAL vestibular — cerebellar or medullary lesion suspected',
        resultTextKo: '하향 안구 진탕(급속안구운동 하방); 중추 전정 — 소뇌 또는 연수 병변 의심',
        isAbnormal: true, severity: 'severe', signs: ['nystagmus_fast_phase_down'] },
      { value: 'direction_changing',
        label: 'Direction-changing (varies with head position) — CENTRAL sign',
        labelKo: '방향 변환성 (두부 자세에 따라 변함) — 중추 징후',
        resultText: 'Direction-changing nystagmus; CENTRAL vestibular disease (brainstem or cerebellum) strongly suspected',
        resultTextKo: '방향 변환성 안구 진탕; 중추 전정 질환(뇌간 또는 소뇌) 강력 의심',
        isAbnormal: true, severity: 'severe', signs: ['nystagmus_vertical'] },
    ],
  },

  // ── [Level 2] Falling / Rolling ──────────────────────────
  {
    testID: 'cn8_falling_rolling',
    testName: 'CN VIII — Falling / Rolling',
    testNameKo: 'CN VIII — 낙상/구르기',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_VIII',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'cn8_vestibular', triggerValues: ['abnormal'] },
    lateralityCapture: true,
    clinicalSignificance: 'high',
    testType: 'select',
    options: [
      { value: 'none', label: 'No falling or rolling', labelKo: '낙상/구르기 없음',
        resultText: 'No falling or rolling', resultTextKo: '낙상/구르기 없음', isAbnormal: false },
      { value: 'falling_left', label: 'Falls / leans to LEFT', labelKo: '좌측으로 낙상/기울음',
        resultText: 'Falls to the left; left vestibular lesion suspected', resultTextKo: '좌측 낙상; 좌측 전정 병변 의심',
        isAbnormal: true, severity: 'moderate', signs: ['falling_left'] },
      { value: 'falling_right', label: 'Falls / leans to RIGHT', labelKo: '우측으로 낙상/기울음',
        resultText: 'Falls to the right; right vestibular lesion suspected', resultTextKo: '우측 낙상; 우측 전정 병변 의심',
        isAbnormal: true, severity: 'moderate', signs: ['falling_right'] },
      { value: 'rolling', label: 'Rolling (barrel rolling — severe)',
        labelKo: '구르기 (심한 회전)',
        resultText: 'Barrel rolling; severe vestibular crisis — central or acute severe peripheral',
        resultTextKo: '배럴 구르기; 중증 전정 위기 — 중추 또는 급성 중증 말초',
        isAbnormal: true, severity: 'severe', signs: ['rolling'] },
    ],
  },

  // ── [Level 2] Central vs Peripheral Assessment ────────────
  {
    testID: 'cn8_central_peripheral',
    testName: 'Vestibular — Central vs Peripheral Classification',
    testNameKo: '전정 — 중추 vs 말초 분류',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_VIII',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'cn8_vestibular', triggerValues: ['abnormal'] },
    lateralityCapture: false,
    clinicalSignificance: 'high',
    note: 'Central signs: vertical/rotatory nystagmus, direction-changing nystagmus, altered mentation, ipsilateral hemiparesis, multiple CN deficits, cerebellar signs. Peripheral: horizontal nystagmus, head tilt, normal mentation, no other CN deficits.',
    testType: 'select',
    options: [
      { value: 'peripheral',
        label: 'Peripheral vestibular (inner ear / CN VIII)',
        labelKo: '말초 전정 (내이 / CN VIII)',
        resultText: 'Peripheral vestibular disease pattern; otitis interna, idiopathic vestibular syndrome, or CN VIII neoplasia',
        resultTextKo: '말초 전정 질환 패턴; 내이염, 특발성 전정 증후군 또는 CN VIII 종양',
        isAbnormal: true, severity: 'moderate' },
      { value: 'central',
        label: 'Central vestibular (brainstem / cerebellum)',
        labelKo: '중추 전정 (뇌간 / 소뇌)',
        resultText: 'Central vestibular disease pattern; brainstem or cerebellar lesion — MRI recommended urgently',
        resultTextKo: '중추 전정 질환 패턴; 뇌간 또는 소뇌 병변 — MRI 긴급 권장',
        isAbnormal: true, severity: 'severe' },
      { value: 'paradoxical',
        label: 'Paradoxical vestibular (head tilt AWAY from lesion side)',
        labelKo: '역설적 전정 (두부 경사가 병변 반대측)',
        resultText: 'Paradoxical vestibular disease; cerebellar flocculonodular lobe or cerebellar peduncle lesion suspected',
        resultTextKo: '역설적 전정 질환; 소뇌 타래 소엽 또는 소뇌 다리 병변 의심',
        isAbnormal: true, severity: 'severe',
        signs: ['paradoxical_vestibular'] },
    ],
  },

  // ── [Level 1] CN VIII — Hearing ───────────────────────────
  {
    testID: 'cn8_hearing',
    testName: 'CN VIII — Hearing Assessment',
    testNameKo: 'CN VIII — 청력 평가',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_VIII',
    species: 'both',
    required: false,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'medium',
    howTo: 'Hand clap or whistle out of visual field. BAER (Brainstem Auditory Evoked Response) for definitive assessment.',
    note: 'Congenital deafness (white/merle dogs, white cats with blue eyes) detectable by BAER.',
    testType: 'select',
    options: [
      { value: 'normal', label: 'Responds to sound bilaterally', labelKo: '양측 청각 반응 정상',
        resultText: 'Hearing appears intact bilaterally', resultTextKo: '양측 청력 정상',
        isAbnormal: false },
      { value: 'deficit_unilateral', label: 'Unilateral hearing deficit (suspected)',
        labelKo: '일측성 청력 감소 (의심)',
        resultText: 'Unilateral hearing deficit suspected; BAER recommended',
        resultTextKo: '일측성 청력 감소 의심; BAER 검사 권장',
        isAbnormal: true, severity: 'mild' },
      { value: 'deaf_bilateral', label: 'Bilateral deafness',
        labelKo: '양측성 청력 소실',
        resultText: 'Bilateral deafness; CN VIII cochlear lesion, bilateral otitis, or congenital deafness',
        resultTextKo: '양측성 청력 소실; CN VIII 달팽이 병변, 양측 중이염 또는 선천성 청력 소실',
        isAbnormal: true, severity: 'moderate' },
    ],
  },
];


// ============================================================
// SECTION 14: DOMAIN C — CN IX, X, XI, XII
// ============================================================

const cranialNerveTests_IX_XII: NeuroTestItem[] = [

  // ── CN IX + X — Glossopharyngeal + Vagus ──────────────────
  {
    testID: 'cn9_10_swallow',
    testName: 'CN IX + X — Gag / Swallowing Reflex',
    testNameKo: 'CN IX + X — 구역/연하 반사',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_IX',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: false,
    clinicalSignificance: 'high',
    howTo: 'Gently touch pharynx with cotton swab or gloved finger. Normal = gag/swallow. Observe swallowing during water intake.',
    relatedTests: ['cn10_laryngeal', 'cn9_10_dysphagia'],
    testType: 'select',
    options: [
      { value: 'normal', label: 'Normal gag and swallowing reflex', labelKo: '정상 구역 및 연하 반사',
        resultText: 'CN IX/X swallowing reflex intact', resultTextKo: 'CN IX/X 연하 반사 정상', isAbnormal: false },
      { value: 'reduced', label: 'Reduced gag / delayed swallowing', labelKo: '구역 감소 / 연하 지연',
        resultText: 'Reduced gag reflex or delayed swallowing; CN IX/X or medullary lesion suspected',
        resultTextKo: '구역 반사 감소 또는 연하 지연; CN IX/X 또는 연수 병변 의심',
        isAbnormal: true, severity: 'moderate', signs: ['dysphagia'] },
      { value: 'absent', label: 'Absent gag reflex / cannot swallow', labelKo: '구역 반사 소실 / 연하 불가',
        resultText: 'Absent gag reflex; severe CN IX/X dysfunction — aspiration risk high',
        resultTextKo: '구역 반사 소실; 심각한 CN IX/X 기능 이상 — 흡인 위험 높음',
        isAbnormal: true, severity: 'severe', signs: ['dysphagia'] },
    ],
  },

  // ── [Level 1] CN IX/X Dysphagia assessment ───────────────
  {
    testID: 'cn9_10_dysphagia',
    testName: 'CN IX + X — Dysphagia / Regurgitation',
    testNameKo: 'CN IX + X — 연하 곤란 / 역류',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_X',
    species: 'both',
    required: false,
    displayLevel: 1,
    lateralityCapture: false,
    clinicalSignificance: 'high',
    testType: 'multiselect',
    resultTemplate: 'Dysphagia findings: {values}',
    resultTemplateKo: '연하 곤란 소견: {values}',
    options: [
      { value: 'none', label: 'No dysphagia', labelKo: '연하 곤란 없음', resultText: 'no dysphagia', resultTextKo: '연하 곤란 없음', isAbnormal: false },
      { value: 'dysphagia_solid', label: 'Difficulty swallowing solids', labelKo: '고형물 연하 곤란',
        resultText: 'dysphagia (solids)', resultTextKo: '고형물 연하 곤란', isAbnormal: true, severity: 'moderate', signs: ['dysphagia'] },
      { value: 'dysphagia_liquid', label: 'Difficulty swallowing liquids', labelKo: '액체 연하 곤란',
        resultText: 'dysphagia (liquids — nasal reflux possible)', resultTextKo: '액체 연하 곤란(비강 역류 가능)', isAbnormal: true, severity: 'moderate', signs: ['dysphagia'] },
      { value: 'nasal_reflux', label: 'Nasal reflux during drinking', labelKo: '음수 시 비강 역류',
        resultText: 'nasal reflux', resultTextKo: '비강 역류', isAbnormal: true, severity: 'moderate', signs: ['dysphagia'] },
      { value: 'aspiration_signs', label: 'Signs of aspiration (coughing/gagging with food/water)',
        labelKo: '흡인 징후 (식이/음수 시 기침/구역)',
        resultText: 'aspiration signs — aspiration pneumonia risk', resultTextKo: '흡인 징후 — 흡인성 폐렴 위험',
        isAbnormal: true, severity: 'severe', signs: ['dysphagia'] },
    ],
  },

  // ── CN X — Laryngeal Paralysis ────────────────────────────
  {
    testID: 'cn10_laryngeal',
    testName: 'CN X — Laryngeal Function',
    testNameKo: 'CN X — 후두 기능',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_X',
    species: 'both',
    required: false,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Auscultate larynx during respiration. Look for inspiratory stridor, stertor, or voice change. Laryngoscopy for definitive assessment.',
    note: 'Laryngeal paralysis in large-breed older dogs: often polyneuropathy. Bilateral = life-threatening.',
    testType: 'select',
    options: [
      { value: 'normal', label: 'Normal voice and breathing', labelKo: '정상 음성 및 호흡',
        resultText: 'CN X laryngeal function intact', resultTextKo: 'CN X 후두 기능 정상', isAbnormal: false },
      { value: 'dysphonia', label: 'Dysphonia / voice change', labelKo: '발성 장애 / 음성 변화',
        resultText: 'Dysphonia; unilateral CN X (recurrent laryngeal nerve) lesion suspected',
        resultTextKo: '발성 장애; 일측성 CN X(반회후두신경) 병변 의심',
        isAbnormal: true, severity: 'mild', signs: ['dysphonia'] },
      { value: 'laryngeal_paralysis_unilateral', label: 'Laryngeal paralysis — unilateral (inspiratory stridor)',
        labelKo: '후두 마비 — 일측 (흡기 협착음)',
        resultText: 'Unilateral laryngeal paralysis; inspiratory stridor; CN X or polyneuropathy suspected',
        resultTextKo: '일측성 후두 마비; 흡기 협착음; CN X 또는 다발신경병증 의심',
        isAbnormal: true, severity: 'moderate', signs: ['laryngeal_paralysis'] },
      { value: 'laryngeal_paralysis_bilateral', label: 'Laryngeal paralysis — bilateral (severe stridor, cyanosis risk)',
        labelKo: '후두 마비 — 양측 (심한 협착음, 청색증 위험)',
        resultText: 'Bilateral laryngeal paralysis; severe respiratory compromise — emergency evaluation required',
        resultTextKo: '양측성 후두 마비; 심각한 호흡 곤란 — 응급 평가 필요',
        isAbnormal: true, severity: 'complete', signs: ['laryngeal_paralysis'] },
    ],
  },

  // ── CN XI — Accessory ─────────────────────────────────────
  {
    testID: 'cn11_trapezius',
    testName: 'CN XI — Accessory (Trapezius / SCM Atrophy)',
    testNameKo: 'CN XI — 부신경 (승모근 / 흉쇄유돌근 위축)',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_XI',
    species: 'both',
    required: false,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'low',
    howTo: 'Palpate trapezius muscle for atrophy. CN XI often evaluated together with CN IX/X.',
    testType: 'boolean',
    positiveResultText: 'Trapezius / SCM atrophy present; CN XI lesion suspected',
    positiveResultTextKo: '승모근/흉쇄유돌근 위축; CN XI 병변 의심',
    negativeResultText: 'CN XI intact; no trapezius atrophy',
    negativeResultTextKo: 'CN XI 정상; 승모근 위축 없음',
    positiveIsAbnormal: true,
  },

  // ── CN XII — Hypoglossal ──────────────────────────────────
  {
    testID: 'cn12_tongue',
    testName: 'CN XII — Hypoglossal (Tongue Motor)',
    testNameKo: 'CN XII — 설하신경 (혀 운동)',
    domain: 'cranial_nerve',
    cranialNerve: 'CN_XII',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Observe tongue at rest and during lapping. Look for deviation, atrophy, fasciculations.',
    testType: 'select',
    options: [
      { value: 'normal', label: 'Normal tongue — symmetric, no atrophy', labelKo: '정상 혀 — 대칭, 위축 없음',
        resultText: 'CN XII intact; tongue normal', resultTextKo: 'CN XII 정상; 혀 정상', isAbnormal: false },
      { value: 'deviation_left', label: 'Tongue deviates LEFT (left CN XII weakness)',
        labelKo: '혀 좌측 편위 (좌측 CN XII 약화)',
        resultText: 'Tongue deviates left; left CN XII or left medullary lesion suspected',
        resultTextKo: '혀 좌측 편위; 좌측 CN XII 또는 좌측 연수 병변 의심',
        isAbnormal: true, severity: 'moderate', signs: ['tongue_deviation'] },
      { value: 'deviation_right', label: 'Tongue deviates RIGHT',
        labelKo: '혀 우측 편위',
        resultText: 'Tongue deviates right; right CN XII or medullary lesion suspected',
        resultTextKo: '혀 우측 편위; 우측 CN XII 또는 연수 병변 의심',
        isAbnormal: true, severity: 'moderate', signs: ['tongue_deviation'] },
      { value: 'atrophy_unilateral', label: 'Unilateral tongue atrophy ± fasciculations',
        labelKo: '일측성 혀 위축 ± 근섬유속연축',
        resultText: 'Unilateral tongue atrophy; LMN CN XII lesion; denervation suspected',
        resultTextKo: '일측성 혀 위축; LMN CN XII 병변; 탈신경 의심',
        isAbnormal: true, severity: 'moderate', signs: ['tongue_atrophy'] },
      { value: 'atrophy_bilateral', label: 'Bilateral tongue atrophy / cannot lap',
        labelKo: '양측성 혀 위축 / 핥기 불가',
        resultText: 'Bilateral tongue atrophy; bilateral CN XII or diffuse LMN disease suspected',
        resultTextKo: '양측성 혀 위축; 양측 CN XII 또는 미만성 LMN 질환 의심',
        isAbnormal: true, severity: 'severe', signs: ['tongue_atrophy'] },
    ],
  },
];


// ============================================================
// SECTION 15: DOMAIN D — SPINAL REFLEXES
// ============================================================

const spinalReflexTests: NeuroTestItem[] = [

  // ════════════════════════════════
  // PATELLAR REFLEX
  // ════════════════════════════════
  {
    testID: 'reflex_patellar',
    testName: 'Patellar Reflex (L4–L6, femoral nerve)',
    testNameKo: '슬개골 반사 (L4-L6, 대퇴신경)',
    domain: 'spinal_reflex',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Animal in lateral recumbency. Strike patellar ligament with reflex hammer. Grade 0–4.',
    note: 'Grade 0: absent (LMN L4-L6 or femoral). Grade 3–4: hyperreflexic (UMN). Pendulum reflex = cerebellar.',
    testType: 'grade',
    gradeSystem: 'spinal_reflex_grade',
    grades: [
      { grade: 0, label: 'Grade 0 — Absent', labelKo: '0등급 — 소실',
        description: 'No reflex; LMN lesion at L4–L6 or femoral nerve', descriptionKo: 'L4-L6 또는 대퇴신경 LMN 병변', isAbnormal: true, signs: ['patellar_absent'] },
      { grade: 1, label: 'Grade 1 — Reduced', labelKo: '1등급 — 감소',
        description: 'Reduced; mild LMN lesion or early LMN disease', descriptionKo: '경미한 LMN 병변', isAbnormal: true, signs: ['patellar_decreased'] },
      { grade: 2, label: 'Grade 2 — Normal', labelKo: '2등급 — 정상',
        description: 'Normal reflex', descriptionKo: '정상 반사', isAbnormal: false },
      { grade: 3, label: 'Grade 3 — Exaggerated', labelKo: '3등급 — 항진',
        description: 'Exaggerated; UMN lesion cranial to L4', descriptionKo: 'L4 전방 UMN 병변', isAbnormal: true, signs: ['patellar_increased'] },
      { grade: 4, label: 'Grade 4 — Clonus / Severely exaggerated', labelKo: '4등급 — 간대/심한 항진',
        description: 'Clonus present; severe UMN lesion or spinal shock recovery', descriptionKo: '간대 존재; 중증 UMN 병변 또는 척수 충격 회복', isAbnormal: true, signs: ['patellar_increased'] },
    ],
  },

  // ════════════════════════════════
  // WITHDRAWAL REFLEX — PELVIC
  // ════════════════════════════════
  {
    testID: 'reflex_withdrawal_pelvic',
    testName: 'Withdrawal Reflex — Pelvic Limb (L4–S1, sciatic nerve)',
    testNameKo: '굴곡 반사 — 후지 (L4-S1, 좌골신경)',
    domain: 'spinal_reflex',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Pinch digit; look for hip, stifle, hock flexion (not just digit withdrawal). Grade each limb separately.',
    note: 'Absent = LMN L4–S1 or sciatic. Exaggerated = UMN cranial to L4. Must distinguish from pain response (conscious withdrawal).',
    testType: 'grade',
    gradeSystem: 'spinal_reflex_grade',
    grades: [
      { grade: 0, label: 'Grade 0 — Absent', labelKo: '0등급 — 소실',
        description: 'Absent withdrawal; LMN L4–S1 or sciatic nerve', descriptionKo: 'LMN L4-S1 또는 좌골신경 병변', isAbnormal: true, signs: ['withdrawal_absent'] },
      { grade: 1, label: 'Grade 1 — Reduced', labelKo: '1등급 — 감소',
        description: 'Reduced flexion; partial LMN lesion', descriptionKo: '부분적 LMN 병변', isAbnormal: true, signs: ['withdrawal_decreased'] },
      { grade: 2, label: 'Grade 2 — Normal', labelKo: '2등급 — 정상',
        description: 'Normal full limb flexion', descriptionKo: '정상 전체 사지 굴곡', isAbnormal: false },
      { grade: 3, label: 'Grade 3 — Exaggerated', labelKo: '3등급 — 항진',
        description: 'Exaggerated; UMN cranial to L4', descriptionKo: 'L4 전방 UMN 병변', isAbnormal: true, signs: ['withdrawal_increased'] },
    ],
  },

  // ════════════════════════════════
  // WITHDRAWAL REFLEX — THORACIC
  // ════════════════════════════════
  {
    testID: 'reflex_withdrawal_thoracic',
    testName: 'Withdrawal Reflex — Thoracic Limb (C6–T2, musculocutaneous/radial)',
    testNameKo: '굴곡 반사 — 전지 (C6-T2, 근피/요골신경)',
    domain: 'spinal_reflex',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Pinch digit of thoracic limb; look for shoulder, elbow, carpus flexion.',
    testType: 'grade',
    gradeSystem: 'spinal_reflex_grade',
    grades: [
      { grade: 0, label: 'Grade 0 — Absent', labelKo: '0등급 — 소실',
        description: 'Absent; LMN C6–T2 or brachial plexus', descriptionKo: 'LMN C6-T2 또는 상완신경총', isAbnormal: true, signs: ['withdrawal_absent'] },
      { grade: 1, label: 'Grade 1 — Reduced', labelKo: '1등급 — 감소',
        description: 'Reduced; partial C6–T2 LMN lesion', descriptionKo: '부분적 C6-T2 LMN 병변', isAbnormal: true, signs: ['withdrawal_decreased'] },
      { grade: 2, label: 'Grade 2 — Normal', labelKo: '2등급 — 정상',
        description: 'Normal', descriptionKo: '정상', isAbnormal: false },
      { grade: 3, label: 'Grade 3 — Exaggerated', labelKo: '3등급 — 항진',
        description: 'Exaggerated; UMN cranial to C6', descriptionKo: 'C6 전방 UMN 병변', isAbnormal: true, signs: ['withdrawal_increased'] },
    ],
  },

  // ════════════════════════════════
  // BICEPS REFLEX
  // ════════════════════════════════
  {
    testID: 'reflex_biceps',
    testName: 'Biceps Reflex (C6–C8, musculocutaneous nerve)',
    testNameKo: '이두근 반사 (C6-C8, 근피신경)',
    domain: 'spinal_reflex',
    species: 'both',
    required: false,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Place finger on biceps tendon at elbow; tap finger. Normal = mild elbow flexion. Difficult in cats.',
    testType: 'grade',
    gradeSystem: 'spinal_reflex_grade',
    grades: [
      { grade: 0, label: 'Absent', labelKo: '소실', description: 'LMN C6–C8', descriptionKo: 'LMN C6-C8', isAbnormal: true, signs: ['biceps_absent'] },
      { grade: 1, label: 'Reduced', labelKo: '감소', description: 'Mild C6–C8 LMN', descriptionKo: '경미한 C6-C8 LMN', isAbnormal: true, signs: ['biceps_decreased'] },
      { grade: 2, label: 'Normal', labelKo: '정상', description: 'Normal', descriptionKo: '정상', isAbnormal: false },
      { grade: 3, label: 'Exaggerated', labelKo: '항진', description: 'UMN cranial to C6', descriptionKo: 'C6 전방 UMN', isAbnormal: true, signs: ['biceps_increased'] },
    ],
  },

  // ════════════════════════════════
  // TRICEPS REFLEX
  // ════════════════════════════════
  {
    testID: 'reflex_triceps',
    testName: 'Triceps Reflex (C7–T1, radial nerve)',
    testNameKo: '삼두근 반사 (C7-T1, 요골신경)',
    domain: 'spinal_reflex',
    species: 'both',
    required: false,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Tap triceps tendon just proximal to olecranon. Normal = slight elbow extension.',
    testType: 'grade',
    gradeSystem: 'spinal_reflex_grade',
    grades: [
      { grade: 0, label: 'Absent', labelKo: '소실', description: 'LMN C7–T1 or radial nerve', descriptionKo: 'LMN C7-T1 또는 요골신경', isAbnormal: true, signs: ['triceps_absent'] },
      { grade: 1, label: 'Reduced', labelKo: '감소', description: 'Partial LMN C7–T1', descriptionKo: '부분적 LMN C7-T1', isAbnormal: true, signs: ['triceps_decreased'] },
      { grade: 2, label: 'Normal', labelKo: '정상', description: 'Normal', descriptionKo: '정상', isAbnormal: false },
      { grade: 3, label: 'Exaggerated', labelKo: '항진', description: 'UMN cranial to C7', descriptionKo: 'C7 전방 UMN', isAbnormal: true, signs: ['triceps_increased'] },
    ],
  },

  // ════════════════════════════════
  // PERINEAL REFLEX
  // ════════════════════════════════
  {
    testID: 'reflex_perineal',
    testName: 'Perineal Reflex (S1–S3, pudendal nerve)',
    testNameKo: '회음 반사 (S1-S3, 음부신경)',
    domain: 'spinal_reflex',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: false,
    clinicalSignificance: 'high',
    howTo: 'Touch perineum; normal = anal sphincter contraction and tail ventroflexion.',
    note: 'Absent = S1–S3 lesion. Critical for sacrocaudal vs L4–S3 differentiation.',
    testType: 'boolean',
    positiveResultText: 'Perineal reflex present; S1–S3 intact',
    positiveResultTextKo: '회음 반사 정상; S1-S3 정상',
    negativeResultText: 'Absent perineal reflex; S1–S3 or pudendal nerve lesion — urinary/faecal incontinence risk',
    negativeResultTextKo: '회음 반사 소실; S1-S3 또는 음부신경 병변 — 요실금/변실금 위험',
    positiveIsAbnormal: false,
  },

  // ════════════════════════════════
  // BABINSKI SIGN
  // ════════════════════════════════
  {
    testID: 'reflex_babinski',
    testName: 'Babinski Sign (UMN indicator)',
    testNameKo: '바빈스키 징후 (UMN 지표)',
    domain: 'spinal_reflex',
    species: 'both',
    required: false,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Stroke plantar surface of paw from heel to toes. Positive (abnormal) = digit extension/fanning.',
    note: 'Positive Babinski = UMN lesion (T3–L3 or higher). Not present in normal animals.',
    testType: 'boolean',
    positiveResultText: 'Positive Babinski sign; UMN lesion (T3–L3 or cranial) confirmed',
    positiveResultTextKo: '양성 바빈스키 징후; UMN 병변(T3-L3 이상) 확인',
    negativeResultText: 'No Babinski sign (normal)',
    negativeResultTextKo: '바빈스키 징후 없음 (정상)',
    positiveIsAbnormal: true,
    positiveSigns: ['babinski_present'],
  },

  // ════════════════════════════════
  // CROSSED EXTENSOR REFLEX
  // ════════════════════════════════
  {
    testID: 'reflex_crossed_extensor',
    testName: 'Crossed Extensor Reflex (UMN indicator)',
    testNameKo: '교차 신전 반사 (UMN 지표)',
    domain: 'spinal_reflex',
    species: 'both',
    required: false,
    displayLevel: 1,
    lateralityCapture: false,
    clinicalSignificance: 'high',
    howTo: 'Stimulate limb for withdrawal reflex; if contralateral limb extends = positive crossed extensor.',
    note: 'Present in normal neonates; abnormal in adults → UMN lesion.',
    testType: 'boolean',
    positiveResultText: 'Crossed extensor reflex present; UMN lesion confirmed',
    positiveResultTextKo: '교차 신전 반사 있음; UMN 병변 확인',
    negativeResultText: 'No crossed extensor reflex (normal in adults)',
    negativeResultTextKo: '교차 신전 반사 없음 (성체 정상)',
    positiveIsAbnormal: true,
    positiveSigns: ['crossed_extensor_present'],
  },

  // ════════════════════════════════
  // CUTANEOUS TRUNCI (PANNICULUS) REFLEX
  // ════════════════════════════════
  {
    testID: 'reflex_cutaneous_trunci',
    testName: 'Cutaneous Trunci Reflex (Panniculus Reflex)',
    testNameKo: '피부근 반사 (패니쿨러스 반사)',
    domain: 'spinal_reflex',
    species: 'both',
    required: false,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Using haemostat or pin, stimulate the skin lateral to the spine from caudal (L4-L5) toward cranial, 1 vertebra at a time. Normal = bilateral skin twitch. The reflex disappears 1–2 segments CRANIAL to the lesion (afferent T3–L4, efferent C8–T1 lateral thoracic nerve). Assess left and right sides independently.',
    note: 'Most precise neurological test for T-L level pinpointing. Lesion level = 1-2 segments cranial to where reflex disappears. Absent unilaterally → hemicord lesion ipsilateral.',
    relatedTests: ['pain_thoracolumbar', 'pain_vertebral_level'],
    testType: 'select',
    options: [
      {
        value: 'normal_bilateral',
        label: 'Normal — bilateral skin twitch throughout',
        labelKo: '정상 — 양측 피부 수축 전 구역',
        resultText: 'Cutaneous trunci reflex intact bilaterally; no T3–L4 cord lesion indicated',
        resultTextKo: '양측 피부근 반사 정상; T3-L4 척수 병변 없음',
        isAbnormal: false,
      },
      {
        value: 'absent_bilateral_at_level',
        label: 'Absent bilaterally at a specific level (mark level below)',
        labelKo: '특정 분절에서 양측 소실 (아래 분절 기록)',
        resultText: 'Cutaneous trunci reflex absent bilaterally at demarcated level; spinal cord lesion 1–2 segments cranial to absent level',
        resultTextKo: '피부근 반사 특정 분절에서 양측 소실; 척수 병변은 소실 분절보다 1-2분절 전방',
        isAbnormal: true, severity: 'moderate',
        signs: ['cutaneous_trunci_absent_bilateral'],
      },
      {
        value: 'absent_left_at_level',
        label: 'Absent LEFT side only at a level (right intact) — hemicord sign',
        labelKo: '좌측만 소실 (우측 정상) — 반척수 징후',
        resultText: 'Cutaneous trunci reflex absent on LEFT at demarcated level; LEFT hemicord (Brown-Séquard) lesion suspected ipsilateral',
        resultTextKo: '피부근 반사 좌측만 소실; 좌측 반척수(Brown-Séquard) 병변 의심',
        isAbnormal: true, severity: 'moderate',
        signs: ['cutaneous_trunci_absent_left', 'hemisection_left'],
      },
      {
        value: 'absent_right_at_level',
        label: 'Absent RIGHT side only at a level — hemicord sign',
        labelKo: '우측만 소실 (좌측 정상) — 반척수 징후',
        resultText: 'Cutaneous trunci reflex absent on RIGHT at demarcated level; RIGHT hemicord (Brown-Séquard) lesion suspected ipsilateral',
        resultTextKo: '피부근 반사 우측만 소실; 우측 반척수(Brown-Séquard) 병변 의심',
        isAbnormal: true, severity: 'moderate',
        signs: ['cutaneous_trunci_absent_right', 'hemisection_right'],
      },
      {
        value: 'absent_all',
        label: 'Absent throughout — no response at any level',
        labelKo: '전 구역 소실',
        resultText: 'Cutaneous trunci reflex absent throughout; severe bilateral T3–L3 lesion or C8–T1 efferent lesion suspected',
        resultTextKo: '전 구역 피부근 반사 소실; 중증 양측 T3-L3 병변 또는 C8-T1 원심성 병변 의심',
        isAbnormal: true, severity: 'severe',
        signs: ['cutaneous_trunci_absent_bilateral'],
      },
    ],
  },

  // [Level 2] Cutaneous trunci absent level — exact vertebral segment
  {
    testID: 'reflex_cutaneous_trunci_level',
    testName: 'Cutaneous Trunci — Level of Absence',
    testNameKo: '피부근 반사 소실 분절',
    domain: 'spinal_reflex',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: {
      testID: 'reflex_cutaneous_trunci',
      triggerValues: ['absent_bilateral_at_level', 'absent_left_at_level', 'absent_right_at_level'],
    },
    lateralityCapture: true,
    clinicalSignificance: 'high',
    note: 'Lesion is located 1–2 vertebrae CRANIAL to the first absent level. e.g., absent from T11 caudally → lesion at T9–T10.',
    testType: 'select',
    options: [
      { value: 'T3_T5', label: 'T3–T5 (cranial thoracic)', labelKo: 'T3-T5 (흉추 전방)',
        resultText: 'Cutaneous trunci absent from T3–T5 level; lesion estimated T1–T3',
        resultTextKo: 'T3-T5 분절부터 소실; 병변 추정 T1-T3',
        isAbnormal: true, severity: 'moderate', signs: ['cutaneous_trunci_level_thoracic'] },
      { value: 'T6_T9', label: 'T6–T9 (mid-thoracic)', labelKo: 'T6-T9 (흉추 중간)',
        resultText: 'Cutaneous trunci absent from T6–T9 level; lesion estimated T4–T7',
        resultTextKo: 'T6-T9 분절부터 소실; 병변 추정 T4-T7',
        isAbnormal: true, severity: 'moderate', signs: ['cutaneous_trunci_level_thoracic'] },
      { value: 'T10_T13', label: 'T10–T13 (caudal thoracic)', labelKo: 'T10-T13 (흉추 후방)',
        resultText: 'Cutaneous trunci absent from T10–T13 level; lesion estimated T8–T11 (most common IVDD zone)',
        resultTextKo: 'T10-T13 분절부터 소실; 병변 추정 T8-T11 (IVDD 최다 발생 구역)',
        isAbnormal: true, severity: 'moderate', signs: ['cutaneous_trunci_level_thoracic'] },
      { value: 'L1_L3', label: 'L1–L3 (cranial lumbar)', labelKo: 'L1-L3 (요추 전방)',
        resultText: 'Cutaneous trunci absent from L1–L3 level; lesion estimated T12–L1',
        resultTextKo: 'L1-L3 분절부터 소실; 병변 추정 T12-L1',
        isAbnormal: true, severity: 'moderate', signs: ['cutaneous_trunci_level_lumbar'] },
      { value: 'L4_L5', label: 'L4–L5 (caudal lumbar — at limit)', labelKo: 'L4-L5 (요추 후방 — 한계)',
        resultText: 'Cutaneous trunci absent from L4–L5 level; lesion estimated L2–L3; approaching lumbosacral intumescence',
        resultTextKo: 'L4-L5 분절부터 소실; 병변 추정 L2-L3; 요천추팽대부 근접',
        isAbnormal: true, severity: 'moderate', signs: ['cutaneous_trunci_level_lumbar'] },
    ],
  },

  // ════════════════════════════════
  // TAIL TONE
  // ════════════════════════════════
  {
    testID: 'reflex_tail_tone',
    testName: 'Tail Tone Assessment',
    testNameKo: '꼬리 긴장도 평가',
    domain: 'spinal_reflex',
    species: 'both',
    required: false,
    displayLevel: 1,
    lateralityCapture: false,
    clinicalSignificance: 'high',
    howTo: 'Extend tail ventrally and assess resistance. Grade: normal (active resistance), reduced (partial), absent (flaccid). Also observe tail carriage at rest and response to tail pinch.',
    note: 'Absent tail tone = S1–S3 or sacrocaudal lesion. Tail paralysis with intact perineal reflex → sacral fracture distal to S3. Distinguishes L4–S3 from sacrocaudal.',
    relatedTests: ['reflex_perineal', 'pain_lumbosacral'],
    testType: 'select',
    options: [
      {
        value: 'normal',
        label: 'Normal — active resistance to ventroflexion',
        labelKo: '정상 — 복굴에 능동적 저항',
        resultText: 'Tail tone normal',
        resultTextKo: '꼬리 긴장도 정상',
        isAbnormal: false,
      },
      {
        value: 'reduced',
        label: 'Reduced — weak resistance, low carriage',
        labelKo: '감소 — 약한 저항, 낮은 자세',
        resultText: 'Reduced tail tone; partial S1–S3 or sacrocaudal dysfunction',
        resultTextKo: '꼬리 긴장도 감소; 부분적 S1-S3 또는 천미 기능 이상',
        isAbnormal: true, severity: 'mild',
        signs: ['tail_tone_reduced'],
      },
      {
        value: 'absent_flaccid',
        label: 'Absent — completely flaccid (paralysed tail)',
        labelKo: '소실 — 완전 이완 (꼬리 마비)',
        resultText: 'Absent tail tone (flaccid tail paralysis); S1–S3 or sacrocaudal spinal cord lesion',
        resultTextKo: '꼬리 긴장도 소실(이완성 꼬리 마비); S1-S3 또는 천미 척수 병변',
        isAbnormal: true, severity: 'severe',
        signs: ['tail_tone_absent', 'tail_paralysis'],
      },
    ],
  },

  // ════════════════════════════════
  // MUSCLE ATROPHY PATTERN
  // ════════════════════════════════
  {
    testID: 'reflex_muscle_atrophy_pattern',
    testName: 'Neurogenic Muscle Atrophy Pattern',
    testNameKo: '신경인성 근위축 패턴',
    domain: 'spinal_reflex',
    species: 'both',
    required: false,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Palpate and visually compare muscle bulk bilaterally. Neurogenic atrophy develops within 7–10 days of LMN denervation (much faster than disuse atrophy).',
    note: 'Pattern of atrophy identifies the LMN segment: supraspinatus/infraspinatus→C5-C6; triceps→C7-T1; quadriceps→L4-L6; caudal thigh/gastrocnemius→L6-S2.',
    testType: 'multiselect',
    resultTemplate: 'Neurogenic atrophy pattern: {values}',
    resultTemplateKo: '신경인성 근위축 패턴: {values}',
    options: [
      { value: 'none', label: 'No neurogenic atrophy', labelKo: '신경인성 근위축 없음',
        resultText: 'no neurogenic muscle atrophy', resultTextKo: '신경인성 근위축 없음', isAbnormal: false },
      { value: 'supraspinatus_infraspinatus',
        label: 'Supraspinatus / Infraspinatus (suprascapular n.)',
        labelKo: '극상근/극하근 (견갑상신경)',
        resultText: 'supraspinatus/infraspinatus atrophy; C5–C6 LMN or suprascapular nerve lesion',
        resultTextKo: '극상근/극하근 위축; C5-C6 LMN 또는 견갑상신경 병변',
        isAbnormal: true, severity: 'moderate', signs: ['atrophy_supraspinatus_infraspinatus'] },
      { value: 'triceps',
        label: 'Triceps brachii (radial n. C7–T1)',
        labelKo: '상완삼두근 (요골신경 C7-T1)',
        resultText: 'triceps brachii atrophy; C7–T1 LMN or radial nerve lesion',
        resultTextKo: '상완삼두근 위축; C7-T1 LMN 또는 요골신경 병변',
        isAbnormal: true, severity: 'moderate', signs: ['atrophy_triceps'] },
      { value: 'quadriceps',
        label: 'Quadriceps (femoral n. L4–L6)',
        labelKo: '대퇴사두근 (대퇴신경 L4-L6)',
        resultText: 'quadriceps atrophy; L4–L6 LMN or femoral nerve lesion',
        resultTextKo: '대퇴사두근 위축; L4-L6 LMN 또는 대퇴신경 병변',
        isAbnormal: true, severity: 'moderate', signs: ['atrophy_quadriceps'] },
      { value: 'caudal_thigh',
        label: 'Caudal thigh muscles / Hamstrings (sciatic n. L6–S1)',
        labelKo: '후방 대퇴근/햄스트링 (좌골신경 L6-S1)',
        resultText: 'caudal thigh muscle atrophy; L6–S1 LMN or sciatic nerve lesion',
        resultTextKo: '후방 대퇴근 위축; L6-S1 LMN 또는 좌골신경 병변',
        isAbnormal: true, severity: 'moderate', signs: ['atrophy_caudal_thigh'] },
      { value: 'gastrocnemius',
        label: 'Gastrocnemius (tibial n. L6–S2)',
        labelKo: '비복근 (경골신경 L6-S2)',
        resultText: 'gastrocnemius atrophy; L6–S2 LMN or tibial nerve lesion',
        resultTextKo: '비복근 위축; L6-S2 LMN 또는 경골신경 병변',
        isAbnormal: true, severity: 'moderate', signs: ['atrophy_gastrocnemius'] },
      { value: 'distal_generalised',
        label: 'Diffuse distal limb atrophy (generalised)',
        labelKo: '미만성 원위부 사지 위축 (전반)',
        resultText: 'diffuse distal limb neurogenic atrophy; diffuse polyneuropathy or multifocal LMN disease',
        resultTextKo: '미만성 원위부 사지 신경인성 위축; 미만성 다발신경병증 또는 다발성 LMN 질환',
        isAbnormal: true, severity: 'moderate', signs: ['atrophy_distal_limb_generalised'] },
    ],
  },
];


// ============================================================
// SECTION 16: DOMAIN E — POSTURAL REACTIONS
// ============================================================

const posturalReactionTests: NeuroTestItem[] = [

  // ── Proprioceptive Positioning ────────────────────────────
  {
    testID: 'postural_proprioception',
    testName: 'Conscious Proprioception — Knuckling Test',
    testNameKo: '의식적 고유감각 — 발등 검사',
    domain: 'postural_reaction',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Knuckle each paw (dorsal surface on ground). Normal = immediate correction. Delayed or absent = proprioceptive deficit.',
    note: 'Most sensitive test for spinal cord/brain dysfunction. Assess each limb individually.',
    testType: 'multiselect',
    resultTemplate: 'Proprioception deficit: {values}',
    resultTemplateKo: '고유감각 결손: {values}',
    options: [
      { value: 'normal_all', label: 'Normal — all four limbs', labelKo: '정상 — 4지 모두',
        resultText: 'proprioception normal all limbs', resultTextKo: '4지 고유감각 정상', isAbnormal: false },
      { value: 'deficit_pelvic_left', label: 'Deficit — LEFT pelvic limb', labelKo: '결손 — 좌측 후지',
        resultText: 'proprioception deficit left pelvic limb', resultTextKo: '좌측 후지 고유감각 결손',
        isAbnormal: true, severity: 'moderate', signs: ['proprioception_deficit_pelvic_left'] },
      { value: 'deficit_pelvic_right', label: 'Deficit — RIGHT pelvic limb', labelKo: '결손 — 우측 후지',
        resultText: 'proprioception deficit right pelvic limb', resultTextKo: '우측 후지 고유감각 결손',
        isAbnormal: true, severity: 'moderate', signs: ['proprioception_deficit_pelvic_right'] },
      { value: 'deficit_thoracic_left', label: 'Deficit — LEFT thoracic limb', labelKo: '결손 — 좌측 전지',
        resultText: 'proprioception deficit left thoracic limb', resultTextKo: '좌측 전지 고유감각 결손',
        isAbnormal: true, severity: 'moderate', signs: ['proprioception_deficit_thoracic_left'] },
      { value: 'deficit_thoracic_right', label: 'Deficit — RIGHT thoracic limb', labelKo: '결손 — 우측 전지',
        resultText: 'proprioception deficit right thoracic limb', resultTextKo: '우측 전지 고유감각 결손',
        isAbnormal: true, severity: 'moderate', signs: ['proprioception_deficit_thoracic_right'] },
    ],
  },

  // ── Hopping Test ──────────────────────────────────────────
  {
    testID: 'postural_hopping',
    testName: 'Hopping Reaction',
    testNameKo: '홉핑 반응',
    domain: 'postural_reaction',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Support animal weight, lift 3 limbs, push body laterally over weight-bearing limb. Normal = immediate hop to new support position.',
    testType: 'multiselect',
    resultTemplate: 'Hopping deficit: {values}',
    resultTemplateKo: '홉핑 결손: {values}',
    options: [
      { value: 'normal_all', label: 'Normal — all limbs', labelKo: '정상 — 모든 사지', resultText: 'hopping normal all limbs', resultTextKo: '모든 사지 홉핑 정상', isAbnormal: false },
      { value: 'deficit_left_pelvic', label: 'Deficit — LEFT pelvic', labelKo: '결손 — 좌측 후지',
        resultText: 'hopping deficit left pelvic', resultTextKo: '좌측 후지 홉핑 결손', isAbnormal: true, severity: 'moderate', signs: ['hopping_deficit_left'] },
      { value: 'deficit_right_pelvic', label: 'Deficit — RIGHT pelvic', labelKo: '결손 — 우측 후지',
        resultText: 'hopping deficit right pelvic', resultTextKo: '우측 후지 홉핑 결손', isAbnormal: true, severity: 'moderate', signs: ['hopping_deficit_right'] },
      { value: 'deficit_left_thoracic', label: 'Deficit — LEFT thoracic', labelKo: '결손 — 좌측 전지',
        resultText: 'hopping deficit left thoracic', resultTextKo: '좌측 전지 홉핑 결손', isAbnormal: true, severity: 'moderate', signs: ['hopping_deficit_left'] },
      { value: 'deficit_right_thoracic', label: 'Deficit — RIGHT thoracic', labelKo: '결손 — 우측 전지',
        resultText: 'hopping deficit right thoracic', resultTextKo: '우측 전지 홉핑 결손', isAbnormal: true, severity: 'moderate', signs: ['hopping_deficit_right'] },
    ],
  },

  // ── Wheelbarrowing ────────────────────────────────────────
  {
    testID: 'postural_wheelbarrowing',
    testName: 'Wheelbarrowing Reaction (Thoracic Limbs)',
    testNameKo: '수레 반응 (전지)',
    domain: 'postural_reaction',
    species: 'both',
    required: false,
    displayLevel: 1,
    lateralityCapture: false,
    clinicalSignificance: 'high',
    howTo: 'Lift pelvic limbs; push animal forward on thoracic limbs. Normal = coordinated stepping. Occlude vision to remove visual compensation.',
    testType: 'boolean',
    positiveResultText: 'Wheelbarrowing normal; thoracic limb proprioception intact',
    positiveResultTextKo: '수레 반응 정상; 전지 고유감각 정상',
    negativeResultText: 'Wheelbarrowing deficit; thoracic limb proprioceptive ataxia or weakness',
    negativeResultTextKo: '수레 반응 결손; 전지 고유감각 실조 또는 약화',
    positiveIsAbnormal: false,
  },

  // ── Hemiwalking ───────────────────────────────────────────
  {
    testID: 'postural_hemiwalking',
    testName: 'Hemiwalking Reaction',
    testNameKo: '편측 보행 반응',
    domain: 'postural_reaction',
    species: 'both',
    required: false,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Support ipsilateral thoracic and pelvic limbs off ground; push toward contralateral side. Normal = stepping with contralateral limbs.',
    testType: 'select',
    options: [
      { value: 'normal_bilateral', label: 'Normal hemiwalking — both sides', labelKo: '정상 편측 보행 — 양측',
        resultText: 'Hemiwalking normal bilaterally', resultTextKo: '편측 보행 양측 정상', isAbnormal: false },
      { value: 'deficit_left', label: 'Deficit — LEFT side hemiwalking', labelKo: '결손 — 좌측 편측 보행',
        resultText: 'Left hemiwalking deficit; right forebrain or C1–C5 lesion suspected',
        resultTextKo: '좌측 편측 보행 결손; 우측 전뇌 또는 C1-C5 병변 의심',
        isAbnormal: true, severity: 'moderate', signs: ['hemiwalking_deficit_left'] },
      { value: 'deficit_right', label: 'Deficit — RIGHT side hemiwalking', labelKo: '결손 — 우측 편측 보행',
        resultText: 'Right hemiwalking deficit; left forebrain or C1–C5 lesion suspected',
        resultTextKo: '우측 편측 보행 결손; 좌측 전뇌 또는 C1-C5 병변 의심',
        isAbnormal: true, severity: 'moderate', signs: ['hemiwalking_deficit_right'] },
    ],
  },
];


// ============================================================
// SECTION 17: DOMAIN F — AUTONOMIC (Horner's + Bladder)
// ============================================================

const autonomicTests: NeuroTestItem[] = [

  // ── Horner's Syndrome ─────────────────────────────────────
  {
    testID: 'autonomic_horners',
    testName: "Horner's Syndrome",
    testNameKo: '호르너 증후군',
    domain: 'autonomic',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Observe in dim light: miosis, ptosis, enophthalmos, third eyelid protrusion. Phenylephrine 1% eye drops: if resolves in <20min → postganglionic; >20min → preganglionic.',
    relatedTests: ['cn3_pupil_size', 'cn7_facial', 'cn8_vestibular'],
    testType: 'select',
    options: [
      { value: 'absent', label: "No Horner's signs", labelKo: '호르너 징후 없음',
        resultText: "No Horner's syndrome", resultTextKo: '호르너 증후군 없음', isAbnormal: false },
      { value: 'present_left', label: "Horner's syndrome — LEFT", labelKo: '호르너 증후군 — 좌측',
        resultText: "Left Horner's syndrome (miosis, ptosis, enophthalmos, third eyelid protrusion)",
        resultTextKo: '좌측 호르너 증후군 (동공 축소, 안검 하수, 안구 함몰, 제3안검 돌출)',
        isAbnormal: true, severity: 'moderate',
        signs: ['horners_miosis','horners_ptosis','horners_enophthalmos','horners_third_eyelid'] },
      { value: 'present_right', label: "Horner's syndrome — RIGHT", labelKo: '호르너 증후군 — 우측',
        resultText: "Right Horner's syndrome",
        resultTextKo: '우측 호르너 증후군',
        isAbnormal: true, severity: 'moderate',
        signs: ['horners_miosis','horners_ptosis','horners_enophthalmos','horners_third_eyelid'] },
    ],
  },

  // ── [Level 2] Horner's localisation ──────────────────────
  {
    testID: 'autonomic_horners_localisation',
    testName: "Horner's — Pharmacological Localisation",
    testNameKo: '호르너 — 약리학적 국소화',
    domain: 'autonomic',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'autonomic_horners', triggerValues: ['present_left','present_right'] },
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Apply 1% phenylephrine to affected eye. Time to pupil dilation: <20min = postganglionic (T1–T3 spinal or brachial plexus); 20–45min = preganglionic (T1–T3); >45min = central (hypothalamus to T1).',
    testType: 'select',
    options: [
      { value: 'postganglionic_fast',
        label: 'Postganglionic (<20min response to phenylephrine)',
        labelKo: '절후성 (<20분 반응)',
        resultText: "Postganglionic Horner's; middle ear, retrobulbar, or brachial plexus lesion suspected",
        resultTextKo: '절후성 호르너; 중이, 안구 후방 또는 상완신경총 병변 의심',
        isAbnormal: true, severity: 'moderate' },
      { value: 'preganglionic',
        label: 'Preganglionic (20–45min response)',
        labelKo: '절전성 (20-45분 반응)',
        resultText: "Preganglionic Horner's; T1–T3 spinal cord, cranial thorax (mediastinal mass), or vagosympathetic trunk lesion suspected",
        resultTextKo: '절전성 호르너; T1-T3 척수, 흉강 전방(종격동 종괴) 또는 미주교감신경간 병변 의심',
        isAbnormal: true, severity: 'moderate' },
      { value: 'central',
        label: 'Central (>45min or no response)',
        labelKo: '중추성 (>45분 또는 무반응)',
        resultText: "Central Horner's; hypothalamus, brainstem, or C1–T2 spinal cord lesion suspected",
        resultTextKo: '중추성 호르너; 시상하부, 뇌간 또는 C1-T2 척수 병변 의심',
        isAbnormal: true, severity: 'severe' },
    ],
  },

  // ── Bladder Function ──────────────────────────────────────
  {
    testID: 'autonomic_bladder',
    testName: 'Bladder Function / Urinary Status',
    testNameKo: '방광 기능 / 배뇨 상태',
    domain: 'autonomic',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: false,
    clinicalSignificance: 'high',
    howTo: 'Palpate bladder size and tone. Observe voiding posture and stream. Manual expression test.',
    note: 'UMN bladder: large firm, cannot express easily. LMN bladder: large flaccid, easily expressed, dribbling.',
    testType: 'select',
    options: [
      { value: 'normal', label: 'Normal voluntary urination', labelKo: '정상 자발 배뇨',
        resultText: 'Bladder function normal', resultTextKo: '방광 기능 정상', isAbnormal: false },
      { value: 'UMN_retention', label: 'UMN bladder — retention (large firm, cannot express)',
        labelKo: 'UMN 방광 — 요 저류 (크고 단단함, 도뇨 어려움)',
        resultText: 'UMN bladder dysfunction; urinary retention; lesion cranial to L4–S3',
        resultTextKo: 'UMN 방광 기능 이상; 요 저류; L4-S3 전방 병변',
        isAbnormal: true, severity: 'severe', signs: ['urinary_retention_UMN'] },
      { value: 'LMN_incontinence', label: 'LMN bladder — incontinence (large flaccid, leaking)',
        labelKo: 'LMN 방광 — 요실금 (크고 이완됨, 요 흘림)',
        resultText: 'LMN bladder dysfunction; urinary incontinence; L4–S3 or pudendal nerve lesion',
        resultTextKo: 'LMN 방광 기능 이상; 요실금; L4-S3 또는 음부신경 병변',
        isAbnormal: true, severity: 'severe', signs: ['urinary_incontinence_LMN'] },
      { value: 'faecal_incontinence', label: 'Faecal incontinence', labelKo: '변실금',
        resultText: 'Faecal incontinence; S1–S3 or pudendal nerve lesion suspected',
        resultTextKo: '변실금; S1-S3 또는 음부신경 병변 의심',
        isAbnormal: true, severity: 'severe', signs: ['faecal_incontinence'] },
    ],
  },
];


// ============================================================
// SECTION 18: DOMAIN G — PAIN ASSESSMENT
// ============================================================

const painTests: NeuroTestItem[] = [

  // ── Spinal Pain — Cervical ────────────────────────────────
  {
    testID: 'pain_cervical',
    testName: 'Cervical Spinal Pain',
    testNameKo: '경추 척추 통증',
    domain: 'pain_assessment',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: false,
    clinicalSignificance: 'high',
    howTo: 'Palpate cervical vertebrae and paravertebral muscles. Flex/extend/lateroflex neck. Low head carriage, neck rigidity, crying on palpation = pain.',
    testType: 'select',
    options: [
      { value: 'none', label: 'No cervical pain', labelKo: '경추 통증 없음',
        resultText: 'No cervical spinal pain', resultTextKo: '경추 척추 통증 없음', isAbnormal: false },
      { value: 'mild', label: 'Mild — tenses on palpation', labelKo: '경미 — 촉진 시 긴장',
        resultText: 'Mild cervical pain', resultTextKo: '경미한 경추 통증', isAbnormal: true, severity: 'mild', signs: ['cervical_pain'] },
      { value: 'moderate', label: 'Moderate — vocalises, low head carriage', labelKo: '중등도 — 발성, 두부 하강',
        resultText: 'Moderate cervical pain; low head carriage', resultTextKo: '중등도 경추 통증; 두부 하강', isAbnormal: true, severity: 'moderate', signs: ['cervical_pain'] },
      { value: 'severe', label: 'Severe — marked guarding, unable to flex/extend',
        labelKo: '중증 — 현저한 근긴장, 굴곡/신전 불가',
        resultText: 'Severe cervical pain with guarding; disc herniation, meningitis, or atlantoaxial instability suspected',
        resultTextKo: '방어성 근긴장을 동반한 중증 경추 통증; 추간판 탈출, 수막염 또는 환축추 불안정성 의심',
        isAbnormal: true, severity: 'severe', signs: ['cervical_pain'] },
    ],
  },

  // ── Spinal Pain — Thoracolumbar ───────────────────────────
  {
    testID: 'pain_thoracolumbar',
    testName: 'Thoracolumbar Spinal Pain',
    testNameKo: '흉요추 척추 통증',
    domain: 'pain_assessment',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: false,
    clinicalSignificance: 'high',
    howTo: 'Palpate each thoracic and lumbar vertebra and paravertebral muscles. Apply lateral pressure. Look for kyphosis, epaxial muscle spasm.',
    testType: 'select',
    options: [
      { value: 'none', label: 'No thoracolumbar pain', labelKo: '흉요추 통증 없음',
        resultText: 'No thoracolumbar spinal pain', resultTextKo: '흉요추 척추 통증 없음', isAbnormal: false },
      { value: 'mild', label: 'Mild thoracolumbar pain', labelKo: '경미한 흉요추 통증',
        resultText: 'Mild thoracolumbar pain', resultTextKo: '경미한 흉요추 통증', isAbnormal: true, severity: 'mild', signs: ['thoracolumbar_pain'] },
      { value: 'moderate', label: 'Moderate — kyphosis, epaxial spasm', labelKo: '중등도 — 척추후만, 배축근 경련',
        resultText: 'Moderate thoracolumbar pain with kyphosis and epaxial muscle spasm',
        resultTextKo: '척추후만 및 배축근 경련을 동반한 중등도 흉요추 통증',
        isAbnormal: true, severity: 'moderate', signs: ['thoracolumbar_pain'] },
      { value: 'severe', label: 'Severe thoracolumbar pain', labelKo: '중증 흉요추 통증',
        resultText: 'Severe thoracolumbar pain; IVDD, fracture, or discospondylitis suspected',
        resultTextKo: '중증 흉요추 통증; 추간판 질환, 골절 또는 디스코스폰딜리티스 의심',
        isAbnormal: true, severity: 'severe', signs: ['thoracolumbar_pain'] },
    ],
  },

  // ── Spinal Pain — Lumbosacral ─────────────────────────────
  {
    testID: 'pain_lumbosacral',
    testName: 'Lumbosacral Pain',
    testNameKo: '요천추 통증',
    domain: 'pain_assessment',
    species: 'both',
    required: true,
    displayLevel: 1,
    lateralityCapture: false,
    clinicalSignificance: 'high',
    howTo: 'Palpate L7–S1 junction. Extend tail and hips simultaneously. Look for tail clamping, reluctance to sit.',
    testType: 'select',
    options: [
      { value: 'none', label: 'No lumbosacral pain', labelKo: '요천추 통증 없음',
        resultText: 'No lumbosacral pain', resultTextKo: '요천추 통증 없음', isAbnormal: false },
      { value: 'mild', label: 'Mild lumbosacral pain', labelKo: '경미한 요천추 통증',
        resultText: 'Mild lumbosacral pain', resultTextKo: '경미한 요천추 통증', isAbnormal: true, severity: 'mild', signs: ['lumbosacral_pain'] },
      { value: 'moderate', label: 'Moderate — tail clamping, reluctant to sit', labelKo: '중등도 — 꼬리 웅크림, 앉기 거부',
        resultText: 'Moderate lumbosacral pain; lumbosacral stenosis or IVDD at L7–S1 suspected',
        resultTextKo: '중등도 요천추 통증; 요천추 협착 또는 L7-S1 추간판 질환 의심',
        isAbnormal: true, severity: 'moderate', signs: ['lumbosacral_pain'] },
      { value: 'severe', label: 'Severe lumbosacral pain', labelKo: '중증 요천추 통증',
        resultText: 'Severe lumbosacral pain; lumbosacral instability, neoplasia, or severe IVDD suspected',
        resultTextKo: '중증 요천추 통증; 요천추 불안정성, 종양 또는 중증 추간판 질환 의심',
        isAbnormal: true, severity: 'severe', signs: ['lumbosacral_pain'] },
    ],
  },

  // ── Deep Pain Perception ──────────────────────────────────
  {
    testID: 'pain_deep_perception',
    testName: 'Deep Pain Perception (DPP)',
    testNameKo: '심부 통각 인지 (DPP)',
    domain: 'pain_assessment',
    species: 'both',
    required: false,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Apply firm haemostat pressure to digit bone / periosteum. Response = conscious withdrawal (vocalise, look, bite). NOT just spinal reflex leg pull.',
    note: 'DPP absent = most severe spinal cord injury. Prognosis significantly worsened. Must distinguish conscious response from reflex.',
    testType: 'select',
    options: [
      { value: 'present_all', label: 'Deep pain present — all limbs', labelKo: '심부 통각 있음 — 모든 사지',
        resultText: 'Deep pain perception intact all limbs', resultTextKo: '모든 사지 심부 통각 인지 정상', isAbnormal: false },
      { value: 'absent_pelvic', label: 'DPP absent — pelvic limb(s)', labelKo: 'DPP 소실 — 후지',
        resultText: 'Deep pain perception absent pelvic limbs; severe T3–L3 or L4–S3 lesion; guarded prognosis',
        resultTextKo: '후지 심부 통각 인지 소실; 중증 T3-L3 또는 L4-S3 병변; 예후 불량',
        isAbnormal: true, severity: 'complete' },
      { value: 'absent_all', label: 'DPP absent — all limbs', labelKo: 'DPP 소실 — 모든 사지',
        resultText: 'Deep pain perception absent all limbs; severe C1–C5 or diffuse lesion; grave prognosis',
        resultTextKo: '모든 사지 심부 통각 인지 소실; 중증 C1-C5 또는 미만성 병변; 예후 극히 불량',
        isAbnormal: true, severity: 'complete' },
    ],
  },

  // ── Exact Vertebral Pain Level ────────────────────────────
  {
    testID: 'pain_vertebral_level',
    testName: 'Spinal Pain — Exact Vertebral Level',
    testNameKo: '척추 통증 — 정확한 척추 분절',
    domain: 'pain_assessment',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: [
      { testID: 'pain_cervical',       triggerValues: ['mild','moderate','severe'] },
      { testID: 'pain_thoracolumbar',  triggerValues: ['mild','moderate','severe'] },
      { testID: 'pain_lumbosacral',    triggerValues: ['mild','moderate','severe'] },
    ],
    lateralityCapture: false,
    clinicalSignificance: 'high',
    howTo: 'Palpate each vertebra individually. Apply firm lateral pressure to spinous process and paravertebral muscles. Note the MOST PAINFUL single vertebral level. Correlate with cutaneous trunci reflex result.',
    note: 'Most common IVDD sites: T12-T13, T13-L1, L1-L2 (thoracolumbar); C2-C3, C3-C4 (cervical). Use cutaneous trunci to confirm.',
    testType: 'select',
    options: [
      { value: 'C1_C3', label: 'C1–C3', labelKo: 'C1-C3',
        resultText: 'Maximum spinal pain at C1–C3; atlantoaxial region or cranial cervical disc suspected',
        resultTextKo: 'C1-C3 최대 통증; 환축추 부위 또는 전방 경추 추간판 의심', isAbnormal: true, severity: 'moderate',
        signs: ['cervical_pain'] },
      { value: 'C4_C5', label: 'C4–C5', labelKo: 'C4-C5',
        resultText: 'Maximum spinal pain at C4–C5; mid-cervical disc or Wobbler site suspected',
        resultTextKo: 'C4-C5 최대 통증; 경추 중간 추간판 또는 워블러 병변 의심', isAbnormal: true, severity: 'moderate',
        signs: ['cervical_pain'] },
      { value: 'C5_C7', label: 'C5–C7', labelKo: 'C5-C7',
        resultText: 'Maximum spinal pain at C5–C7; caudal cervical disc or Wobbler (Dobermann) suspected',
        resultTextKo: 'C5-C7 최대 통증; 후방 경추 추간판 또는 워블러(도베르만) 의심', isAbnormal: true, severity: 'moderate',
        signs: ['cervical_pain'] },
      { value: 'T1_T9', label: 'T1–T9 (cranial-to-mid thoracic)', labelKo: 'T1-T9 (전-중 흉추)',
        resultText: 'Maximum spinal pain at T1–T9; thoracic disc or vertebral lesion',
        resultTextKo: 'T1-T9 최대 통증; 흉추 추간판 또는 척추 병변', isAbnormal: true, severity: 'moderate',
        signs: ['thoracolumbar_pain'] },
      { value: 'T10_T13', label: 'T10–T13 (caudal thoracic — most common IVDD zone)', labelKo: 'T10-T13 (후방 흉추 — IVDD 최다 발생)',
        resultText: 'Maximum spinal pain at T10–T13; high-risk IVDD zone (T12–L1 most common disc herniation site)',
        resultTextKo: 'T10-T13 최대 통증; IVDD 고위험 구역 (T12-L1 추간판 탈출 최다 발생)',
        isAbnormal: true, severity: 'moderate', signs: ['thoracolumbar_pain'] },
      { value: 'L1_L3', label: 'L1–L3 (cranial lumbar)', labelKo: 'L1-L3 (전방 요추)',
        resultText: 'Maximum spinal pain at L1–L3; lumbar disc or lumbosacral transition lesion suspected',
        resultTextKo: 'L1-L3 최대 통증; 요추 추간판 또는 요천추 전환부 병변 의심', isAbnormal: true, severity: 'moderate',
        signs: ['thoracolumbar_pain'] },
      { value: 'L4_L6', label: 'L4–L6 (mid-to-caudal lumbar)', labelKo: 'L4-L6 (중-후방 요추)',
        resultText: 'Maximum spinal pain at L4–L6; lumbosacral disc or cauda equina compression suspected',
        resultTextKo: 'L4-L6 최대 통증; 요천추 추간판 또는 마미 압박 의심', isAbnormal: true, severity: 'moderate',
        signs: ['lumbosacral_pain'] },
      { value: 'L7_S1', label: 'L7–S1 (lumbosacral junction)', labelKo: 'L7-S1 (요천추 접합부)',
        resultText: 'Maximum spinal pain at L7–S1 junction; lumbosacral stenosis or IVDD at L7–S1 (most common cauda equina site)',
        resultTextKo: 'L7-S1 접합부 최대 통증; 요천추 협착 또는 L7-S1 추간판 질환 (마미 증후군 최다 발생)',
        isAbnormal: true, severity: 'moderate', signs: ['lumbosacral_pain'] },
      { value: 'sacrocaudal', label: 'Sacrocaudal (S1–tail base)', labelKo: '천미 (S1-꼬리 기저부)',
        resultText: 'Maximum pain at sacrocaudal region; sacral fracture, sacrococcygeal disc, or tail base injury suspected',
        resultTextKo: '천미 부위 최대 통증; 천골 골절, 천미추 추간판, 또는 꼬리 기저부 손상 의심',
        isAbnormal: true, severity: 'moderate', signs: ['lumbosacral_pain'] },
    ],
  },

  // ── Hyperesthesia Band ────────────────────────────────────
  {
    testID: 'pain_hyperesthesia_band',
    testName: 'Hyperesthesia Band (Dermatomal)',
    testNameKo: '과민대 (피부분절)',
    domain: 'pain_assessment',
    species: 'both',
    required: false,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Walk fingertips or pin along paravertebral skin cranial to caudal. Hyperesthetic zone = skin rippling, vocalisation, muscle flinching at a specific dermatomal band. The hyperesthetic band is typically 1–3 segments CRANIAL to the lesion.',
    note: 'Hyperesthesia band + cutaneous trunci loss level = most accurate non-imaging spinal level localisation. Band of hyperesthesia immediately cranial to anaesthetic zone.',
    relatedTests: ['reflex_cutaneous_trunci', 'pain_vertebral_level'],
    testType: 'select',
    options: [
      { value: 'none', label: 'No hyperesthesia band', labelKo: '과민대 없음',
        resultText: 'No dermatomal hyperesthesia band identified',
        resultTextKo: '피부분절 과민대 관찰되지 않음', isAbnormal: false },
      { value: 'cervical_C1_C5',
        label: 'Hyperesthesia band — Cervical (C1–C5)',
        labelKo: '과민대 — 경추 (C1-C5)',
        resultText: 'Dermatomal hyperesthesia band at cervical level (C1–C5); spinal cord lesion in this region',
        resultTextKo: '경추 피부분절 과민대 (C1-C5); 해당 척수 분절 병변', isAbnormal: true, severity: 'mild',
        signs: ['hyperesthesia_band_cervical'] },
      { value: 'cervicothoracic_C6_T2',
        label: 'Hyperesthesia band — Cervicothoracic (C6–T2)',
        labelKo: '과민대 — 경흉추 (C6-T2)',
        resultText: 'Dermatomal hyperesthesia band at cervicothoracic junction (C6–T2)',
        resultTextKo: '경흉추 접합부 피부분절 과민대 (C6-T2)', isAbnormal: true, severity: 'mild',
        signs: ['hyperesthesia_band_cervicothoracic'] },
      { value: 'thoracic_T3_T9',
        label: 'Hyperesthesia band — Thoracic (T3–T9)',
        labelKo: '과민대 — 흉추 (T3-T9)',
        resultText: 'Dermatomal hyperesthesia band at mid-thoracic level (T3–T9)',
        resultTextKo: '중간 흉추 피부분절 과민대 (T3-T9)', isAbnormal: true, severity: 'mild',
        signs: ['hyperesthesia_band_thoracic'] },
      { value: 'thoracolumbar_T10_L3',
        label: 'Hyperesthesia band — Thoracolumbar (T10–L3)',
        labelKo: '과민대 — 흉요추 (T10-L3)',
        resultText: 'Dermatomal hyperesthesia band at thoracolumbar level (T10–L3); most common IVDD zone',
        resultTextKo: '흉요추 피부분절 과민대 (T10-L3); IVDD 최다 발생 구역', isAbnormal: true, severity: 'mild',
        signs: ['hyperesthesia_band_thoracolumbar'] },
      { value: 'lumbar_L4_S1',
        label: 'Hyperesthesia band — Lumbar (L4–S1)',
        labelKo: '과민대 — 요추 (L4-S1)',
        resultText: 'Dermatomal hyperesthesia band at lumbar level (L4–S1)',
        resultTextKo: '요추 피부분절 과민대 (L4-S1)', isAbnormal: true, severity: 'mild',
        signs: ['hyperesthesia_band_lumbar'] },
    ],
  },
];



// ============================================================
// SECTION 19: SYNDROME COMPOSITE RULES
// Automatically detected when required signs are all present
// ============================================================

export const syndromeRules: SyndromeRule[] = [

  // ── Horner's Syndrome ─────────────────────────────────────
  {
    syndromeID: 'syndrome_horners',
    name: "Horner's Syndrome",
    nameKo: '호르너 증후군',
    description: 'Sympathetic denervation of the eye: miosis, ptosis, enophthalmos, third eyelid protrusion',
    requiredSigns: ['horners_miosis'],
    atLeastOneSigns: ['horners_ptosis', 'horners_enophthalmos', 'horners_third_eyelid'],
    interpretation: "Horner's syndrome detected. Localise using pharmacological testing (phenylephrine). Locations: T1–T3 spinal cord, brachial plexus, middle ear, cranial mediastinum, hypothalamus/brainstem.",
    interpretationKo: '호르너 증후군 감지. 약리학적 검사(phenylephrine)로 국소화. 위치: T1-T3 척수, 상완신경총, 중이, 흉강 전방, 시상하부/뇌간.',
    locations: ['T3_L3', 'C6_T2', 'midbrain', 'pons', 'medulla', 'thalamus_hypothalamus'],
    urgency: 'urgent',
  },

  // ── Peripheral Vestibular Syndrome ────────────────────────
  {
    syndromeID: 'syndrome_peripheral_vestibular',
    name: 'Peripheral Vestibular Syndrome',
    nameKo: '말초 전정 증후군',
    description: 'Dysfunction of inner ear or CN VIII nerve trunk',
    requiredSigns: [],
    atLeastOneSigns: ['head_tilt_left', 'head_tilt_right', 'nystagmus_horizontal', 'falling_left', 'falling_right', 'ataxia_vestibular'],
    interpretation: 'Peripheral vestibular pattern: horizontal nystagmus, head tilt, normal mentation, no other CN deficits. Causes: otitis interna, idiopathic (geriatric), CN VIII neoplasia, hypothyroidism (dog), nasopharyngeal polyp (cat).',
    interpretationKo: '말초 전정 패턴: 수평 안구 진탕, 두부 경사, 정상 의식, 다른 CN 결손 없음. 원인: 내이염, 특발성(노령), CN VIII 종양, 갑상선 기능 저하증(개), 비인두 폴립(고양이).',
    locations: ['vestibular_peripheral'],
    urgency: 'urgent',
  },

  // ── Central Vestibular Syndrome ───────────────────────────
  {
    syndromeID: 'syndrome_central_vestibular',
    name: 'Central Vestibular Syndrome',
    nameKo: '중추 전정 증후군',
    description: 'Dysfunction of vestibular nuclei in brainstem or flocculonodular lobe of cerebellum',
    requiredSigns: [],
    atLeastOneSigns: ['nystagmus_vertical', 'nystagmus_rotatory', 'altered_mentation', 'hemiparesis_left', 'hemiparesis_right', 'UMN_pelvic', 'facial_paresis_ipsilateral'],
    interpretation: 'Central vestibular pattern: vertical/rotatory nystagmus OR direction-changing nystagmus OR altered mentation OR ipsilateral hemiparesis. MRI required urgently. Causes: neoplasia, GME, FIP, infarct, hemorrhage.',
    interpretationKo: '중추 전정 패턴: 수직/회전성 안구 진탕 또는 방향 변환 안구 진탕 또는 의식 변화 또는 동측 편측 부전마비. MRI 긴급 필요. 원인: 종양, GME, FIP, 경색, 출혈.',
    locations: ['vestibular_central', 'medulla', 'pons', 'cerebellum'],
    urgency: 'emergency',
  },

  // ── Paradoxical Vestibular Syndrome ──────────────────────
  {
    syndromeID: 'syndrome_paradoxical_vestibular',
    name: 'Paradoxical Vestibular Syndrome',
    nameKo: '역설적 전정 증후군',
    description: 'Cerebellar flocculonodular lobe lesion causing head tilt away from lesion side',
    requiredSigns: ['paradoxical_vestibular'],
    atLeastOneSigns: ['intention_tremor', 'dysmetria', 'truncal_ataxia'],
    interpretation: 'Paradoxical vestibular disease: head tilt is AWAY from lesion (ipsilateral to lesion side has deficits but head tilts contralaterally). Cerebellar flocculonodular lobe or cerebellar peduncle lesion. MRI required.',
    interpretationKo: '역설적 전정 질환: 두부 경사가 병변 반대측(결손이 있는 측의 반대로 기울어짐). 소뇌 타래 소엽 또는 소뇌 다리 병변. MRI 필요.',
    locations: ['cerebellum', 'cerebellar_peduncles'],
    urgency: 'urgent',
  },

  // ── Cerebellar Syndrome ───────────────────────────────────
  {
    syndromeID: 'syndrome_cerebellar',
    name: 'Cerebellar Syndrome',
    nameKo: '소뇌 증후군',
    description: 'Cerebellar dysfunction with dysmetria, intention tremor, wide-based stance',
    requiredSigns: [],
    atLeastOneSigns: ['intention_tremor', 'dysmetria', 'truncal_ataxia', 'wide_based_stance', 'menace_absent_ipsilateral'],
    interpretation: 'Cerebellar syndrome: dysmetria, intention tremor, wide-based stance. Strength and proprioception preserved. Menace absent with intact vision. Causes: CDV, NCL, cerebellar hypoplasia (cat/FPV), neoplasia, abiotrophy.',
    interpretationKo: '소뇌 증후군: 운동이상, 의도 진전, 넓은 지지기반. 근력과 고유감각 보존. 시력 정상에서 위협 반응 소실. 원인: 홍역, NCL, 소뇌 형성부전(고양이/범백혈구감소증), 종양, 실조증.',
    locations: ['cerebellum'],
    urgency: 'urgent',
  },

  // ── Forebrain / Prosencephalon Syndrome ───────────────────
  {
    syndromeID: 'syndrome_forebrain',
    name: 'Forebrain (Prosencephalon) Syndrome',
    nameKo: '전뇌(전뇌) 증후군',
    description: 'Cerebral cortex and/or thalamus dysfunction',
    requiredSigns: [],
    atLeastOneSigns: ['seizure', 'altered_mentation', 'dementia_behaviour_change', 'head_pressing', 'compulsive_pacing', 'circling_ipsilateral', 'vision_deficit_left', 'vision_deficit_right'],
    interpretation: 'Forebrain syndrome: seizures, behaviour change, altered mentation, contralateral vision deficit, compulsive circling/pacing. Causes: neoplasia, GME, encephalitis, storage disease, hydrocephalus, hepatic encephalopathy.',
    interpretationKo: '전뇌 증후군: 발작, 행동 변화, 의식 변화, 반대측 시각 결손, 강박적 선회/배회. 원인: 종양, GME, 뇌염, 저장 질환, 수두증, 간성 뇌병증.',
    locations: ['cerebral_cortex', 'thalamus_hypothalamus'],
    urgency: 'urgent',
  },

  // ── Dropped Jaw Syndrome ──────────────────────────────────
  {
    syndromeID: 'syndrome_dropped_jaw',
    name: 'Dropped Jaw Syndrome (Bilateral CN V Motor)',
    nameKo: '하악 하수 증후군 (양측 CN V 운동)',
    description: 'Bilateral trigeminal motor neuropathy — cannot close mouth',
    requiredSigns: ['jaw_drop'],
    atLeastOneSigns: ['masseter_atrophy'],
    interpretation: 'Dropped jaw syndrome: bilateral CN V motor dysfunction. Cannot close mouth. Masticatory muscle myositis (MMM) vs trigeminal neuropathy. EMG and muscle biopsy recommended.',
    interpretationKo: '하악 하수 증후군: 양측 CN V 운동 기능 이상. 입을 다물 수 없음. 저작근 근염(MMM) vs 삼차신경병증. EMG 및 근육 생검 권장.',
    locations: ['pons', 'peripheral_nerve'],
    urgency: 'urgent',
  },

  // ── C6–T2 (Brachial Intumescence) Syndrome ───────────────
  {
    syndromeID: 'syndrome_C6_T2',
    name: 'C6–T2 Brachial Intumescence Lesion',
    nameKo: 'C6-T2 상완팽대부 병변',
    description: 'LMN thoracic limbs + UMN pelvic limbs ± Horner\'s',
    requiredSigns: ['LMN_thoracic', 'UMN_pelvic'],
    atLeastOneSigns: ['horners_miosis', 'proprioception_deficit_thoracic_left', 'proprioception_deficit_thoracic_right'],
    interpretation: 'C6–T2 lesion signature: LMN thoracic limbs (flaccid, hyporeflexic, atrophy) + UMN pelvic limbs (spastic, hyperreflexic) ± Horner\'s syndrome. Causes: IVDD, neoplasia, FCE, trauma.',
    interpretationKo: 'C6-T2 병변 특징: LMN 전지(이완, 반사 감소, 위축) + UMN 후지(경직, 반사 항진) ± 호르너 증후군. 원인: 추간판 질환, 종양, FCE, 외상.',
    locations: ['C6_T2'],
    urgency: 'emergency',
  },

  // ── T3–L3 (Thoracolumbar) Syndrome ───────────────────────
  {
    syndromeID: 'syndrome_T3_L3',
    name: 'T3–L3 Thoracolumbar Spinal Cord Lesion',
    nameKo: 'T3-L3 흉요추 척수 병변',
    description: 'UMN pelvic limbs + normal thoracic limbs',
    requiredSigns: ['UMN_pelvic'],
    atLeastOneSigns: ['thoracolumbar_pain', 'schiff_sherrington', 'proprioception_deficit_pelvic_left', 'proprioception_deficit_pelvic_right', 'babinski_present'],
    interpretation: 'T3–L3 lesion: UMN pelvic limbs, thoracic limbs unaffected. ± Schiff-Sherrington (acute). ± Thoracolumbar pain. Most common site: T12–L2 (Hansen Type I IVDD in chondrodystrophic breeds).',
    interpretationKo: 'T3-L3 병변: UMN 후지, 전지 정상. ± 쉬프-셰링턴(급성). ± 흉요추 통증. 가장 흔한 위치: T12-L2(연골형성이상 품종 Hansen Type I 추간판 질환).',
    locations: ['T3_L3'],
    urgency: 'emergency',
  },

  // ── L4–S3 (Lumbosacral Intumescence) Syndrome ────────────
  {
    syndromeID: 'syndrome_L4_S3',
    name: 'L4–S3 Lumbosacral Intumescence Lesion',
    nameKo: 'L4-S3 요천추팽대부 병변',
    description: 'LMN pelvic limbs + bladder/bowel dysfunction',
    requiredSigns: ['LMN_pelvic'],
    atLeastOneSigns: ['patellar_absent', 'patellar_decreased', 'withdrawal_absent', 'perineal_absent', 'lumbosacral_pain', 'urinary_incontinence_LMN', 'faecal_incontinence'],
    interpretation: 'L4–S3 lesion: LMN pelvic limbs (flaccid, hyporeflexic), ± LMN bladder/bowel. Causes: lumbosacral stenosis/IVDD (dog), neoplasia, fracture, discospondylitis.',
    interpretationKo: 'L4-S3 병변: LMN 후지(이완, 반사 감소), ± LMN 방광/장 기능 이상. 원인: 요천추 협착/추간판 질환(개), 종양, 골절, 디스코스폰딜리티스.',
    locations: ['L4_S3'],
    urgency: 'emergency',
  },

  // ── Neuromuscular Junction / Muscle Syndrome ──────────────
  {
    syndromeID: 'syndrome_sacrocaudal',
    name: 'Sacrocaudal Lesion Syndrome',
    nameKo: '천미 척수 병변 증후군',
    description: 'Distal sacral / coccygeal cord or cauda equina distal to L4-S3 intumescence',
    requiredSigns: ['tail_tone_absent'],
    atLeastOneSigns: ['perineal_absent', 'faecal_incontinence', 'urinary_incontinence_LMN', 'tail_paralysis'],
    interpretation: 'Sacrocaudal syndrome: flaccid tail paralysis + perineal anaesthesia + faecal/urinary incontinence, WITH normal patellar reflex. Key distinguishing feature from L4–S3: patellar reflex INTACT. Causes: fracture, disc, tail avulsion.',
    interpretationKo: '천미 증후군: 이완성 꼬리 마비 + 회음 무감각 + 변실금/요실금, 슬개골 반사 정상. L4-S3과 구별되는 핵심: 슬개골 반사 정상. 원인: 골절, 추간판, 꼬리 견인 손상.',
    locations: ['sacrocaudal'],
    urgency: 'urgent',
  },

  {
    syndromeID: 'syndrome_NMJ_muscle',
    name: 'Generalised LMN / Neuromuscular Junction / Muscle Disease',
    nameKo: '전신 LMN / 신경근 접합부 / 근육 질환',
    description: 'Diffuse LMN signs, generalised weakness without pain, ± pharyngeal/laryngeal involvement',
    requiredSigns: [],
    atLeastOneSigns: ['LMN_pelvic', 'LMN_thoracic', 'laryngeal_paralysis', 'dysphagia', 'dysphonia'],
    interpretation: 'Generalised LMN / NMJ / Muscle syndrome: diffuse weakness without UMN signs or pain. Causes: myasthenia gravis (NMJ), botulism, tick paralysis, polyneuropathy, polymyositis.',
    interpretationKo: '전신 LMN/신경근 접합부/근육 증후군: UMN 징후나 통증 없이 미만성 약화. 원인: 중증 근무력증(신경근 접합부), 보툴리즘, 진드기 마비, 다발신경병증, 다발근염.',
    locations: ['neuromuscular_junction', 'muscle', 'peripheral_nerve', 'diffuse'],
    urgency: 'urgent',
  },
];


// ============================================================
// SECTION 20: LOCALISATION RULES
// Engine that maps sign patterns → NeuroLocation with confidence
// ============================================================

export const localisationRules: LocalisationRule[] = [

  // ── CEREBRAL CORTEX ───────────────────────────────────────
  {
    ruleID: 'loc_cerebral_cortex',
    description: 'Cerebral cortex / Prosencephalon',
    descriptionKo: '대뇌 피질 / 전뇌',
    requiredSigns: [],
    supportingSigns: ['seizure', 'altered_mentation', 'dementia_behaviour_change', 'head_pressing', 'compulsive_pacing', 'circling_ipsilateral', 'vision_deficit_left', 'vision_deficit_right', 'hemiparesis_left', 'hemiparesis_right'],
    minSupportCount: 2,
    excludingSigns: ['intention_tremor', 'nystagmus_vertical', 'LMN_pelvic', 'LMN_thoracic'],
    locations: [{ location: 'cerebral_cortex', confidence: 'high', laterality: 'contralateral', note: 'Deficits contralateral to lesion' }],
    differentials: {
      dog: ['Intracranial neoplasia (meningioma, glioma)', 'GME/NME', 'Canine distemper encephalitis', 'Hepatic encephalopathy', 'Hydrocephalus', 'Idiopathic epilepsy (<6yo)', 'Lysosomal storage disease', 'Polycythaemia'],
      cat: ['Meningioma', 'FIP encephalitis', 'Ischaemic encephalopathy', 'Hypertensive encephalopathy', 'FeLV/FIV encephalitis', 'Toxoplasmosis', 'Hyperthyroid-associated'],
    },
    diagnostics: ['MRI brain (T1, T2, FLAIR, T1+Gad)', 'CSF analysis', 'Bile acids / NH3 / BMP', 'Blood pressure measurement', 'Infectious titres (CDV, Neospora, Toxoplasma, FIP)'],
    diagnosticsKo: ['뇌 MRI (T1, T2, FLAIR, T1+조영)', 'CSF 분석', '담즙산/NH3/기본 혈액 검사', '혈압 측정', '감염 역가 (CDV, Neospora, Toxoplasma, FIP)'],
    onsetPattern: ['acute', 'chronic_progressive', 'episodic'],
  },

  // ── THALAMUS / HYPOTHALAMUS ───────────────────────────────
  {
    ruleID: 'loc_thalamus',
    description: 'Thalamus / Hypothalamus',
    descriptionKo: '시상 / 시상하부',
    requiredSigns: [],
    supportingSigns: ['altered_mentation', 'circling_ipsilateral', 'vision_deficit_left', 'vision_deficit_right', 'hemiparesis_left', 'hemiparesis_right', 'horners_miosis'],
    minSupportCount: 2,
    excludingSigns: ['seizure', 'intention_tremor', 'LMN_pelvic'],
    locations: [{ location: 'thalamus_hypothalamus', confidence: 'medium', laterality: 'contralateral' }],
    differentials: {
      dog: ['Neoplasia', 'GME', 'Vascular infarct', 'Hypothalamic dysfunction'],
      cat: ['Meningioma', 'FIP', 'Vascular infarct', 'Lymphoma'],
    },
    diagnostics: ['MRI brain (thalamic sequences)', 'CSF analysis', 'Endocrine panel (hypothalamic disease)'],
    diagnosticsKo: ['뇌 MRI (시상 시퀀스)', 'CSF 분석', '내분비 패널 (시상하부 질환)'],
    onsetPattern: ['acute', 'chronic_progressive'],
  },

  // ── MIDBRAIN (MESENCEPHALON) ──────────────────────────────
  {
    ruleID: 'loc_midbrain',
    description: 'Midbrain (Mesencephalon)',
    descriptionKo: '중뇌(중간뇌)',
    requiredSigns: [],
    supportingSigns: ['altered_mentation', 'anisocoria_left_larger', 'anisocoria_right_larger', 'mydriasis_bilateral', 'PLR_absent_direct_left', 'PLR_absent_direct_right', 'strabismus_ventrolateral', 'hemiparesis_left', 'hemiparesis_right'],
    minSupportCount: 2,
    excludingSigns: ['LMN_pelvic', 'LMN_thoracic', 'facial_paresis_ipsilateral'],
    locations: [{ location: 'midbrain', confidence: 'high', laterality: 'ipsilateral', note: 'CN III ipsilateral; motor deficits contralateral' }],
    differentials: {
      dog: ['Neoplasia', 'GME', 'Vascular infarct (basilar artery)', 'Trauma', 'Abscess'],
      cat: ['FIP', 'Lymphoma', 'Ischaemic infarct', 'Toxoplasmosis'],
    },
    diagnostics: ['MRI brain (DWI for infarct, T1+Gad for neoplasia/inflammation)', 'CSF', 'Blood pressure'],
    diagnosticsKo: ['뇌 MRI (경색 DWI, 종양/염증 T1+조영)', 'CSF', '혈압'],
    onsetPattern: ['peracute', 'acute', 'chronic_progressive'],
  },

  // ── PONS ──────────────────────────────────────────────────
  {
    ruleID: 'loc_pons',
    description: 'Pons',
    descriptionKo: '교뇌(뇌교)',
    requiredSigns: [],
    supportingSigns: ['facial_paresis_ipsilateral', 'facial_hypoalgesia_ipsilateral', 'strabismus_dorsomedial', 'nystagmus_horizontal', 'altered_mentation', 'hemiparesis_left', 'hemiparesis_right', 'UMN_pelvic'],
    minSupportCount: 2,
    excludingSigns: ['seizure', 'LMN_pelvic'],
    locations: [{ location: 'pons', confidence: 'high', laterality: 'ipsilateral', note: 'CN V/VI/VII ipsilateral; motor deficits contralateral' }],
    differentials: {
      dog: ['Neoplasia', 'GME', 'CDV', 'Vascular infarct', 'Abscess'],
      cat: ['FIP', 'Lymphoma', 'Ischaemic infarct'],
    },
    diagnostics: ['MRI brain/brainstem', 'CSF analysis', 'CDV / infectious titres'],
    diagnosticsKo: ['뇌/뇌간 MRI', 'CSF 분석', 'CDV / 감염 역가'],
    onsetPattern: ['peracute', 'acute', 'chronic_progressive'],
  },

  // ── MEDULLA OBLONGATA ─────────────────────────────────────
  {
    ruleID: 'loc_medulla',
    description: 'Medulla Oblongata',
    descriptionKo: '연수(숨뇌)',
    requiredSigns: [],
    supportingSigns: ['dysphagia', 'dysphonia', 'laryngeal_paralysis', 'tongue_deviation', 'tongue_atrophy', 'nystagmus_horizontal', 'altered_mentation', 'facial_hypoalgesia_contralateral', 'hemiparesis_left', 'hemiparesis_right'],
    minSupportCount: 2,
    excludingSigns: ['seizure', 'intention_tremor'],
    locations: [{ location: 'medulla', confidence: 'high', laterality: 'ipsilateral', note: 'CN IX/X/XI/XII ipsilateral; crossed sensory deficits possible' }],
    differentials: {
      dog: ['Neoplasia (choroid plexus tumour, glioma)', 'GME', 'CDV', 'Vascular infarct', 'Foramen magnum herniation'],
      cat: ['FIP', 'Lymphoma', 'Ischaemic infarct', 'Nasopharyngeal polyp extension'],
    },
    diagnostics: ['MRI brain/brainstem + cervical spine', 'CSF (with caution if HICP suspected)', 'Otoscopy / CT middle ear'],
    diagnosticsKo: ['뇌/뇌간 + 경추 MRI', 'CSF (두개내압 상승 의심 시 주의)', '이경검사 / 중이 CT'],
    onsetPattern: ['acute', 'chronic_progressive'],
  },

  // ── CEREBELLUM ────────────────────────────────────────────
  {
    ruleID: 'loc_cerebellum',
    description: 'Cerebellum',
    descriptionKo: '소뇌',
    requiredSigns: [],
    supportingSigns: ['intention_tremor', 'dysmetria', 'truncal_ataxia', 'wide_based_stance', 'ataxia_cerebellar', 'menace_absent_ipsilateral', 'nystagmus_rotatory', 'nystagmus_vertical'],
    minSupportCount: 2,
    excludingSigns: ['seizure', 'altered_mentation', 'LMN_pelvic', 'LMN_thoracic', 'UMN_pelvic'],
    locations: [
      { location: 'cerebellum', confidence: 'high', laterality: 'ipsilateral', note: 'Deficits ipsilateral to cerebellar lesion' },
      { location: 'cerebellar_peduncles', confidence: 'medium', laterality: 'ipsilateral' },
    ],
    differentials: {
      dog: ['Cerebellar abiotrophy (breed-specific)', 'CDV', 'Neoplasia', 'NCL', 'Metronidazole toxicity', 'Cerebellar infarct', 'Hypomyelination'],
      cat: ['Cerebellar hypoplasia (FPV in utero)', 'FIP', 'Neoplasia', 'Thiamine deficiency', 'Ischaemic infarct'],
    },
    diagnostics: ['MRI brain (FLAIR, DWI, T2)', 'CSF analysis', 'Breed-specific genetic testing (abiotrophy)', 'CDV / FPV titres'],
    diagnosticsKo: ['뇌 MRI (FLAIR, DWI, T2)', 'CSF 분석', '품종별 유전자 검사(실조증)', 'CDV / FPV 역가'],
    onsetPattern: ['peracute', 'acute', 'chronic_progressive'],
  },

  // ── PERIPHERAL VESTIBULAR ─────────────────────────────────
  {
    ruleID: 'loc_vestibular_peripheral',
    description: 'Peripheral Vestibular System (inner ear / CN VIII)',
    descriptionKo: '말초 전정계 (내이 / CN VIII)',
    requiredSigns: [],
    supportingSigns: ['head_tilt_left', 'head_tilt_right', 'nystagmus_horizontal', 'falling_left', 'falling_right', 'ataxia_vestibular'],
    minSupportCount: 2,
    excludingSigns: ['altered_mentation', 'nystagmus_vertical', 'nystagmus_rotatory', 'hemiparesis_left', 'hemiparesis_right', 'UMN_pelvic', 'seizure'],
    locations: [{ location: 'vestibular_peripheral', confidence: 'high', laterality: 'ipsilateral' }],
    differentials: {
      dog: ['Otitis interna / media', 'Idiopathic geriatric vestibular disease', 'CN VIII neoplasia', 'Hypothyroidism', 'Trauma', 'Aminoglycoside toxicity'],
      cat: ['Nasopharyngeal polyp', 'Otitis interna / media', 'Idiopathic vestibular disease', 'CN VIII neoplasia', 'Ototoxicity'],
    },
    diagnostics: ['Otoscopic examination', 'CT temporal bones (middle/inner ear)', 'Thyroid panel (dog)', 'BAER'],
    diagnosticsKo: ['이경 검사', 'CT 측두골(중이/내이)', '갑상선 패널(개)', 'BAER'],
    onsetPattern: ['peracute', 'acute'],
  },

  // ── C1–C5 ─────────────────────────────────────────────────
  {
    ruleID: 'loc_C1_C5',
    description: 'C1–C5 Cervical Spinal Cord',
    descriptionKo: 'C1-C5 경추 척수',
    requiredSigns: [],
    supportingSigns: [
      'UMN_thoracic', 'UMN_pelvic', 'tetraparesis', 'tetraplegia',
      'hemiparesis_left', 'hemiparesis_right', 'cervical_pain',
      'proprioception_deficit_thoracic_left', 'proprioception_deficit_thoracic_right',
      'hyperesthesia_band_cervical', 'hyperesthesia_band_cervicothoracic',
      'cutaneous_trunci_level_cervical',
      'deficit_worse_left_thoracic', 'deficit_worse_right_thoracic',
    ],
    minSupportCount: 2,
    excludingSigns: ['LMN_thoracic', 'seizure', 'altered_mentation', 'facial_paresis_ipsilateral', 'tongue_deviation'],
    locations: [{ location: 'C1_C5', confidence: 'high', laterality: 'variable' }],
    differentials: {
      dog: ['IVDD (Hansen I/II)', 'Atlantoaxial instability (toy breeds)', 'Wobbler syndrome (CDRM — Dobermann, Great Dane)', 'Neoplasia', 'Discospondylitis', 'FCE', 'Trauma'],
      cat: ['IVDD', 'Neoplasia (lymphoma)', 'FCE', 'Trauma', 'FIP myelitis'],
    },
    diagnostics: ['MRI cervical spine (preferred)', 'CT myelography', 'CSF', 'Spinal radiographs (fracture/discospondylitis)'],
    diagnosticsKo: ['경추 MRI (선호)', 'CT 척수조영술', 'CSF', '척추 방사선 촬영(골절/디스코스폰딜리티스)'],
    onsetPattern: ['peracute', 'acute', 'chronic_progressive'],
  },

  // ── C6–T2 ─────────────────────────────────────────────────
  {
    ruleID: 'loc_C6_T2',
    description: 'C6–T2 Brachial Intumescence / Cervicothoracic Spinal Cord',
    descriptionKo: 'C6-T2 상완팽대부 / 경흉추 척수',
    requiredSigns: ['LMN_thoracic'],
    supportingSigns: [
      'UMN_pelvic', 'horners_miosis',
      'proprioception_deficit_thoracic_left', 'proprioception_deficit_thoracic_right',
      'cervical_pain', 'biceps_absent', 'triceps_absent',
      'atrophy_supraspinatus_infraspinatus', 'atrophy_triceps',
      'hyperesthesia_band_cervicothoracic',
      'deficit_worse_left_thoracic', 'deficit_worse_right_thoracic',
      'hemisection_left', 'hemisection_right',
    ],
    minSupportCount: 1,
    excludingSigns: ['UMN_thoracic', 'seizure', 'altered_mentation'],
    locations: [{ location: 'C6_T2', confidence: 'high', laterality: 'variable', note: 'LMN thoracic + UMN pelvic ± Horner\'s is pathognomonic' }],
    differentials: {
      dog: ['IVDD', 'Neoplasia', 'FCE (fibrocartilaginous embolism)', 'Brachial plexus injury', 'Trauma', 'Discospondylitis'],
      cat: ['IVDD', 'Neoplasia (lymphoma)', 'Brachial plexus avulsion', 'Trauma'],
    },
    diagnostics: ['MRI C5–T3', 'CT myelography', 'EMG / nerve conduction (brachial plexus)', 'Chest radiograph (lung mass / mediastinal mass if Horner\'s)'],
    diagnosticsKo: ['MRI C5-T3', 'CT 척수조영술', 'EMG/신경전도 검사(상완신경총)', '흉부 방사선(호르너 시 폐/종격동 종괴 확인)'],
    onsetPattern: ['peracute', 'acute', 'chronic_progressive'],
  },

  // ── T3–L3 ─────────────────────────────────────────────────
  {
    ruleID: 'loc_T3_L3',
    description: 'T3–L3 Thoracolumbar Spinal Cord',
    descriptionKo: 'T3-L3 흉요추 척수',
    requiredSigns: ['UMN_pelvic'],
    supportingSigns: [
      'thoracolumbar_pain', 'schiff_sherrington',
      'proprioception_deficit_pelvic_left', 'proprioception_deficit_pelvic_right',
      'babinski_present', 'crossed_extensor_present',
      'urinary_retention_UMN', 'paraparesis', 'paraplegia',
      // New: level-pinpointing signs
      'cutaneous_trunci_absent_bilateral', 'cutaneous_trunci_absent_left', 'cutaneous_trunci_absent_right',
      'cutaneous_trunci_level_thoracic', 'cutaneous_trunci_level_lumbar',
      'hyperesthesia_band_thoracic', 'hyperesthesia_band_thoracolumbar',
      'deficit_worse_left_pelvic', 'deficit_worse_right_pelvic',
      'hemisection_left', 'hemisection_right',
    ],
    minSupportCount: 1,
    excludingSigns: ['LMN_thoracic', 'LMN_pelvic', 'altered_mentation', 'seizure'],
    locations: [{ location: 'T3_L3', confidence: 'high', laterality: 'variable' }],
    differentials: {
      dog: ['IVDD Hansen Type I (chondrodystrophic — Dachshund, Beagle, CKCS)', 'IVDD Hansen Type II (large breed)', 'FCE', 'Neoplasia', 'Discospondylitis', 'Trauma', 'Degenerative myelopathy (GSD, Pembroke Welsh Corgi)'],
      cat: ['IVDD', 'FCE', 'Neoplasia (lymphoma)', 'Aortic thromboembolism (T4–L4 ischaemia)', 'FIP myelitis', 'Trauma'],
    },
    diagnostics: ['MRI T-L spine (T2 hyperintensity, compression)', 'CT myelography (if MRI unavailable)', 'CSF (protein in IVDD, cytology in neoplasia/GME)', 'SOD1 mutation test (degenerative myelopathy)'],
    diagnosticsKo: ['흉요추 MRI (T2 고신호, 압박)', 'CT 척수조영술(MRI 불가 시)', 'CSF (추간판 질환 단백질, 종양/GME 세포검사)', 'SOD1 돌연변이 검사(변성 척수병증)'],
    onsetPattern: ['peracute', 'acute', 'chronic_progressive'],
  },

  // ── L4–S3 ─────────────────────────────────────────────────
  {
    ruleID: 'loc_L4_S3',
    description: 'L4–S3 Lumbosacral Intumescence / Cauda Equina',
    descriptionKo: 'L4-S3 요천추팽대부 / 마미',
    requiredSigns: ['LMN_pelvic'],
    supportingSigns: [
      'patellar_absent', 'patellar_decreased', 'withdrawal_absent',
      'lumbosacral_pain', 'urinary_incontinence_LMN', 'faecal_incontinence',
      'perineal_absent', 'proprioception_deficit_pelvic_left', 'proprioception_deficit_pelvic_right',
      // New: atrophy patterns + tail + hyperesthesia
      'atrophy_quadriceps', 'atrophy_caudal_thigh', 'atrophy_gastrocnemius',
      'tail_tone_absent', 'tail_tone_reduced', 'tail_paralysis',
      'hyperesthesia_band_lumbar',
      'deficit_worse_left_pelvic', 'deficit_worse_right_pelvic',
    ],
    minSupportCount: 1,
    excludingSigns: ['UMN_pelvic', 'UMN_thoracic', 'seizure', 'altered_mentation', 'babinski_present'],
    locations: [{ location: 'L4_S3', confidence: 'high', laterality: 'variable' }],
    differentials: {
      dog: ['Lumbosacral stenosis / CDRM', 'IVDD at L7–S1', 'Discospondylitis', 'Cauda equina neoplasia', 'Sacrocaudal fracture', 'Degenerative myelopathy (advanced)', 'Polyneuropathy'],
      cat: ['IVDD', 'Sacral fracture', 'Aortic thromboembolism', 'Lymphoma', 'FIP myelitis'],
    },
    diagnostics: ['MRI lumbosacral spine', 'CT lumbosacral (excellent bony detail)', 'EMG / nerve conduction (cauda equina branches)', 'Urodynamic studies'],
    diagnosticsKo: ['요천추 MRI', 'CT 요천추(뼈 구조 우수)', 'EMG/신경전도 검사(마미 분지)', '요역동학 검사'],
    onsetPattern: ['acute', 'chronic_progressive'],
  },

  // ── SACROCAUDAL ───────────────────────────────────────────
  {
    ruleID: 'loc_sacrocaudal',
    description: 'Sacrocaudal Spinal Cord (S1–Cd)',
    descriptionKo: '천미 척수 (S1-Cd)',
    requiredSigns: [],
    supportingSigns: [
      'tail_tone_absent', 'tail_paralysis', 'perineal_absent',
      'faecal_incontinence', 'urinary_incontinence_LMN',
      'lumbosacral_pain',
    ],
    minSupportCount: 2,
    excludingSigns: [
      'UMN_pelvic', 'patellar_increased', 'babinski_present',
      'UMN_thoracic', 'tetraparesis',
    ],
    locations: [{ location: 'sacrocaudal', confidence: 'high', laterality: 'variable' }],
    differentials: {
      dog: ['Sacrocaudal fracture / luxation', 'Sacrococcygeal disc herniation',
            'Sacral osteosarcoma', 'Cauda equina syndrome (distal)', 'Tail pull injury'],
      cat: ['Sacrocaudal fracture (hit-by-car)', 'Manx sacrocaudal dysgenesis',
            'Tail avulsion', 'Sacral lymphoma'],
    },
    diagnostics: [
      'Pelvic / sacral radiographs', 'CT sacrocaudal region', 'MRI lumbosacral + sacrocaudal',
      'Urodynamic studies (bladder/urethral tone)', 'Perineal EMG',
    ],
    diagnosticsKo: [
      '골반/천골 방사선 촬영', '천미 CT', '요천추 + 천미 MRI',
      '요역동학 검사 (방광/요도 긴장도)', '회음 EMG',
    ],
    onsetPattern: ['peracute', 'acute', 'chronic_progressive'],
  },

  // ── PERIPHERAL NERVE / NMJ / MUSCLE ──────────────────────
  {
    ruleID: 'loc_peripheral_NMJ',
    description: 'Peripheral Nerve / Neuromuscular Junction / Muscle',
    descriptionKo: '말초 신경 / 신경근 접합부 / 근육',
    requiredSigns: [],
    supportingSigns: ['LMN_pelvic', 'LMN_thoracic', 'laryngeal_paralysis', 'dysphagia', 'facial_paresis_bilateral', 'tongue_atrophy'],
    minSupportCount: 3,
    excludingSigns: ['UMN_pelvic', 'UMN_thoracic', 'seizure', 'altered_mentation', 'cervical_pain', 'thoracolumbar_pain', 'babinski_present'],
    locations: [
      { location: 'peripheral_nerve', confidence: 'medium' },
      { location: 'neuromuscular_junction', confidence: 'medium' },
      { location: 'muscle', confidence: 'medium' },
      { location: 'diffuse', confidence: 'low' },
    ],
    differentials: {
      dog: ['Myasthenia gravis (focal or generalised)', 'Botulism', 'Tick paralysis', 'Acute polyradiculoneuritis (Coonhound paralysis)', 'Polyneuropathy (diabetic, hypothyroid, paraneoplastic)', 'Polymyositis / Dermatomyositis', 'Masticatory muscle myositis (CN V motor)'],
      cat: ['Myasthenia gravis', 'Hypokalaemic myopathy', 'Thiamine deficiency', 'Hyperaldosteronism neuropathy', 'Diabetic polyneuropathy', 'Polymyositis'],
    },
    diagnostics: ['EMG / nerve conduction velocity', 'Acetylcholine receptor antibody (MG)', 'Repetitive nerve stimulation (MG)', 'Tensilon test (edrophonium)', 'Muscle biopsy', 'CK / LDH / AST', 'Tick search', 'Botulism toxin assay'],
    diagnosticsKo: ['EMG/신경전도 속도 검사', '아세틸콜린 수용체 항체(MG)', '반복 신경 자극(MG)', '텐실론 검사(에드로포늄)', '근육 생검', 'CK/LDH/AST', '진드기 검색', '보툴리눔 독소 검사'],
    onsetPattern: ['acute', 'subacute', 'chronic_progressive'],
  },
];


// ============================================================
// SECTION 21: DOMAIN SECTIONS (same pattern as OrganSection)
// ============================================================

function makeNeuroDomainGate(domainID: string, nameEn: string, nameKo: string): DomainStatusGate {
  return {
    testID: `${domainID}_status`,
    testName: `${nameEn} — Overall`,
    testNameKo: `${nameKo} 전반적 평가`,
    normalValue: 'normal',
    abnormalValue: 'abnormal',
    options: [
      { value: 'normal',       label: 'Normal — no abnormalities',       labelKo: '정상 — 이상 없음' },
      { value: 'abnormal',     label: 'Abnormal — evaluate sub-items',   labelKo: '이상 — 세부 항목 평가' },
      { value: 'not_assessed', label: 'Not assessed',                    labelKo: '평가 불가' },
    ],
  };
}

export const spinalAsymmetryTests: NeuroTestItem[] = [

  // ── Patellar reflex asymmetry ─────────────────────────────
  {
    testID: 'reflex_patellar_asymmetry',
    testName: 'Patellar Reflex — Left vs Right Comparison',
    testNameKo: '슬개골 반사 — 좌우 비교',
    domain: 'spinal_reflex',
    species: 'both',
    required: false,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Grade both sides independently. Note which side is absent/reduced vs exaggerated. Asymmetry in the same patient = lateralised cord or nerve root lesion.',
    note: 'Absent LEFT + Normal/Exaggerated RIGHT → LEFT LMN (L4-L6) or RIGHT UMN overlapping.',
    testType: 'select',
    options: [
      { value: 'symmetric', label: 'Symmetric — equal grade both sides', labelKo: '대칭 — 양측 동등',
        resultText: 'Patellar reflex symmetric bilaterally', resultTextKo: '슬개골 반사 양측 대칭', isAbnormal: false },
      { value: 'left_reduced_right_normal',
        label: 'LEFT reduced/absent — RIGHT normal',
        labelKo: '좌측 감소/소실 — 우측 정상',
        resultText: 'Asymmetric patellar reflex: left reduced/absent; left LMN (L4–L6) ipsilateral lesion suspected',
        resultTextKo: '비대칭 슬개골 반사: 좌측 감소/소실; 좌측 LMN(L4-L6) 동측 병변 의심',
        isAbnormal: true, severity: 'moderate', signs: ['deficit_worse_left_pelvic'] },
      { value: 'right_reduced_left_normal',
        label: 'RIGHT reduced/absent — LEFT normal',
        labelKo: '우측 감소/소실 — 좌측 정상',
        resultText: 'Asymmetric patellar reflex: right reduced/absent; right LMN (L4–L6) ipsilateral lesion suspected',
        resultTextKo: '비대칭 슬개골 반사: 우측 감소/소실; 우측 LMN(L4-L6) 동측 병변 의심',
        isAbnormal: true, severity: 'moderate', signs: ['deficit_worse_right_pelvic'] },
      { value: 'left_exaggerated_right_normal',
        label: 'LEFT exaggerated — RIGHT normal',
        labelKo: '좌측 항진 — 우측 정상',
        resultText: 'Asymmetric patellar reflex: left exaggerated (UMN); right-sided or bilateral cord lesion suspected with left predominance',
        resultTextKo: '비대칭 슬개골 반사: 좌측 항진(UMN); 우측 또는 양측 척수 병변 의심',
        isAbnormal: true, severity: 'moderate', signs: ['deficit_worse_right_pelvic'] },
      { value: 'right_exaggerated_left_normal',
        label: 'RIGHT exaggerated — LEFT normal',
        labelKo: '우측 항진 — 좌측 정상',
        resultText: 'Asymmetric patellar reflex: right exaggerated (UMN); left-sided or bilateral cord lesion suspected',
        resultTextKo: '비대칭 슬개골 반사: 우측 항진(UMN); 좌측 또는 양측 척수 병변 의심',
        isAbnormal: true, severity: 'moderate', signs: ['deficit_worse_left_pelvic'] },
      { value: 'left_absent_right_exaggerated',
        label: 'LEFT absent + RIGHT exaggerated — Classic hemicord',
        labelKo: '좌측 소실 + 우측 항진 — 전형적 반척수',
        resultText: 'Left patellar absent + right exaggerated: classic left hemicord (Brown-Séquard) pattern; LMN left + UMN right',
        resultTextKo: '좌측 슬개골 소실 + 우측 항진: 전형적 좌측 반척수(Brown-Séquard) 패턴',
        isAbnormal: true, severity: 'severe', signs: ['deficit_worse_left_pelvic', 'hemisection_left'] },
      { value: 'right_absent_left_exaggerated',
        label: 'RIGHT absent + LEFT exaggerated — Classic hemicord',
        labelKo: '우측 소실 + 좌측 항진 — 전형적 반척수',
        resultText: 'Right patellar absent + left exaggerated: classic right hemicord (Brown-Séquard) pattern',
        resultTextKo: '우측 슬개골 소실 + 좌측 항진: 전형적 우측 반척수(Brown-Séquard) 패턴',
        isAbnormal: true, severity: 'severe', signs: ['deficit_worse_right_pelvic', 'hemisection_right'] },
    ],
  },

  // ── Withdrawal reflex asymmetry ───────────────────────────
  {
    testID: 'reflex_withdrawal_asymmetry',
    testName: 'Withdrawal Reflex — Left vs Right Asymmetry',
    testNameKo: '굴곡 반사 — 좌우 비대칭',
    domain: 'spinal_reflex',
    species: 'both',
    required: false,
    displayLevel: 1,
    lateralityCapture: true,
    clinicalSignificance: 'high',
    howTo: 'Compare withdrawal response grade between left and right pelvic (or thoracic) limbs. Asymmetry indicates lateralised nerve root or hemicord lesion.',
    testType: 'select',
    options: [
      { value: 'symmetric', label: 'Symmetric — both sides equal', labelKo: '대칭 — 양측 동등',
        resultText: 'Withdrawal reflexes symmetric', resultTextKo: '굴곡 반사 양측 대칭', isAbnormal: false },
      { value: 'left_worse',
        label: 'LEFT worse (reduced/absent) than right',
        labelKo: '좌측이 더 나쁨 (감소/소실)',
        resultText: 'Left withdrawal worse; left-sided LMN or hemicord lesion suspected',
        resultTextKo: '좌측 굴곡 반사 더 나쁨; 좌측 LMN 또는 반척수 병변 의심',
        isAbnormal: true, severity: 'moderate', signs: ['deficit_worse_left_pelvic'] },
      { value: 'right_worse',
        label: 'RIGHT worse (reduced/absent) than left',
        labelKo: '우측이 더 나쁨 (감소/소실)',
        resultText: 'Right withdrawal worse; right-sided LMN or hemicord lesion suspected',
        resultTextKo: '우측 굴곡 반사 더 나쁨; 우측 LMN 또는 반척수 병변 의심',
        isAbnormal: true, severity: 'moderate', signs: ['deficit_worse_right_pelvic'] },
    ],
  },
];

export const neuroDomainSections: NeuroDomainSection[] = [
  {
    domain: 'mentation_consciousness',
    domainName: 'Mentation & Consciousness',
    domainNameKo: '의식 및 정신 상태',
    examOrder: 1,
    statusGate: makeNeuroDomainGate('mentation', 'Mentation & Consciousness', '의식 및 정신 상태'),
    tests: mentationTests,
  },
  {
    domain: 'gait_posture',
    domainName: 'Gait & Posture',
    domainNameKo: '보행 및 자세',
    examOrder: 2,
    statusGate: makeNeuroDomainGate('gait', 'Gait & Posture', '보행 및 자세'),
    tests: gaitPostureTests,
  },
  {
    domain: 'cranial_nerve',
    domainName: 'Cranial Nerve Examination (CN I–XII)',
    domainNameKo: '뇌신경 검사 (CN I-XII)',
    examOrder: 3,
    statusGate: makeNeuroDomainGate('cranial_nerve', 'Cranial Nerve Examination', '뇌신경 검사'),
    tests: [
      ...cranialNerveTests_I_IV,
      ...cranialNerveTests_V,
      ...cranialNerveTests_VI,
      ...cranialNerveTests_VII,
      ...cranialNerveTests_VIII,
      ...cranialNerveTests_IX_XII,
    ],
  },
  {
    domain: 'spinal_reflex',
    domainName: 'Spinal Reflexes',
    domainNameKo: '척수 반사',
    examOrder: 4,
    statusGate: makeNeuroDomainGate('reflex', 'Spinal Reflexes', '척수 반사'),
    tests: [...spinalReflexTests, ...spinalAsymmetryTests],
  },
  {
    domain: 'postural_reaction',
    domainName: 'Postural Reactions',
    domainNameKo: '자세 반응',
    examOrder: 5,
    statusGate: makeNeuroDomainGate('postural', 'Postural Reactions', '자세 반응'),
    tests: posturalReactionTests,
  },
  {
    domain: 'autonomic',
    domainName: 'Autonomic Nervous System',
    domainNameKo: '자율신경계',
    examOrder: 6,
    statusGate: makeNeuroDomainGate('autonomic', 'Autonomic Nervous System', '자율신경계'),
    tests: autonomicTests,
  },
  {
    domain: 'pain_assessment',
    domainName: 'Pain Assessment',
    domainNameKo: '통증 평가',
    examOrder: 7,
    statusGate: makeNeuroDomainGate('pain', 'Pain Assessment', '통증 평가'),
    tests: painTests,
  },
];



// ============================================================
// SECTION 22: PATIENT CONTEXT GATES
// Species-specific differential priority modifiers
// ============================================================

export interface SpeciesModifier {
  location: NeuroLocation;
  priorityDx: string[];       // push these DDx to top for this species
  deprioritiseDx?: string[];  // de-emphasise for this species
}

export const speciesModifiers: Record<'dog' | 'cat', SpeciesModifier[]> = {
  dog: [
    {
      location: 'T3_L3',
      priorityDx: ['IVDD Hansen Type I (chondrodystrophic)', 'Degenerative myelopathy (SOD1)', 'FCE'],
    },
    {
      location: 'C6_T2',
      priorityDx: ['Wobbler syndrome (CDRM)', 'Brachial plexus avulsion', 'IVDD'],
    },
    {
      location: 'cerebral_cortex',
      priorityDx: ['Idiopathic epilepsy (<6yo)', 'GME/NME', 'Hepatic encephalopathy'],
    },
    {
      location: 'vestibular_peripheral',
      priorityDx: ['Idiopathic geriatric vestibular disease', 'Otitis interna', 'Hypothyroidism'],
    },
    {
      location: 'neuromuscular_junction',
      priorityDx: ['Myasthenia gravis', 'Acute polyradiculoneuritis', 'Tick paralysis', 'Botulism'],
    },
  ],
  cat: [
    {
      location: 'cerebral_cortex',
      priorityDx: ['FIP encephalitis', 'Ischaemic encephalopathy', 'Meningioma', 'Hypertensive encephalopathy'],
    },
    {
      location: 'T3_L3',
      priorityDx: ['Aortic thromboembolism (ischaemic myelopathy)', 'Lymphoma', 'FIP myelitis'],
    },
    {
      location: 'vestibular_peripheral',
      priorityDx: ['Nasopharyngeal polyp', 'Otitis interna', 'Idiopathic vestibular disease'],
    },
    {
      location: 'cerebellum',
      priorityDx: ['Cerebellar hypoplasia (FPV in utero)', 'FIP', 'Thiamine deficiency'],
    },
    {
      location: 'neuromuscular_junction',
      priorityDx: ['Hypokalaemic myopathy', 'Hyperaldosteronism neuropathy', 'Myasthenia gravis'],
    },
  ],
};

// ============================================================
// SECTION 23: BREED-SPECIFIC RISK FLAGS
// ============================================================

export interface BreedRiskFlag {
  breeds: string[];
  species: 'dog' | 'cat';
  condition: string;
  conditionKo: string;
  location: NeuroLocation;
  note: string;
}

export const breedRiskFlags: BreedRiskFlag[] = [
  // ── Dogs ──
  {
    breeds: ['Dachshund', 'Beagle', 'CKCS', 'Shih Tzu', 'Lhasa Apso', 'French Bulldog', 'Pekingese', 'Bassett Hound'],
    species: 'dog',
    condition: 'IVDD Hansen Type I (T12–L2 most common)',
    conditionKo: '추간판 질환 Hansen Type I (T12-L2 가장 흔함)',
    location: 'T3_L3',
    note: 'Chondrodystrophic breeds. Acute peracute onset. MRI urgent.',
  },
  {
    breeds: ['Dobermann Pinscher', 'Great Dane', 'Weimaraner', 'Bernese Mountain Dog', 'Swiss Mountain Dog'],
    species: 'dog',
    condition: 'Wobbler Syndrome (CDRM) — C5–C7',
    conditionKo: '워블러 증후군(CDRM) — C5-C7',
    location: 'C1_C5',
    note: 'Hansen Type II disc or ligament hypertrophy. Slow progressive.',
  },
  {
    breeds: ['German Shepherd', 'Pembroke Welsh Corgi', 'Boxer', 'Rhodesian Ridgeback', 'Chesapeake Bay Retriever'],
    species: 'dog',
    condition: 'Degenerative Myelopathy (SOD1 mutation)',
    conditionKo: '변성 척수병증 (SOD1 돌연변이)',
    location: 'T3_L3',
    note: 'Painless progressive UMN → LMN. SOD1 genetic test.',
  },
  {
    breeds: ['Toy Poodle', 'Chihuahua', 'Pomeranian', 'Yorkshire Terrier', 'Miniature Pinscher'],
    species: 'dog',
    condition: 'Atlantoaxial Instability (AAI)',
    conditionKo: '환축추 불안정성 (AAI)',
    location: 'C1_C5',
    note: 'Young small breeds. Cervical pain ± tetraparesis. Radiograph flexion/extension.',
  },
  {
    breeds: ['Cavalier King Charles Spaniel', 'Chiari-like breeds'],
    species: 'dog',
    condition: 'Chiari-like Malformation / Syringomyelia',
    conditionKo: '키아리 유사 기형 / 척수 공동증',
    location: 'C1_C5',
    note: 'CKCS: phantom scratching at neck/shoulder, scoliosis. MRI brain + cervical.',
  },
  {
    breeds: ['Golden Retriever', 'Labrador Retriever', 'German Shepherd'],
    species: 'dog',
    condition: 'Lumbosacral Stenosis / CDRM',
    conditionKo: '요천추 협착 / CDRM',
    location: 'L4_S3',
    note: 'Lumbosacral pain, hindlimb lameness, tail paresis. CT or MRI.',
  },
  {
    breeds: ['Golden Retriever', 'Labrador Retriever', 'Cocker Spaniel'],
    species: 'dog',
    condition: 'Myasthenia Gravis (focal/generalised)',
    conditionKo: '중증 근무력증 (국소/전신)',
    location: 'neuromuscular_junction',
    note: 'Megaoesophagus, exercise-induced weakness, dysphagia. AChR antibody.',
  },
  {
    breeds: ['Pug', 'French Bulldog', 'Maltese'],
    species: 'dog',
    condition: 'Necrotising Meningoencephalitis (NME/PDE)',
    conditionKo: '괴사성 수막뇌염 (NME/PDE)',
    location: 'cerebral_cortex',
    note: 'Young small/toy breeds. Acute forebrain signs. MRI + CSF + genetic (PDE mutation in Pugs).',
  },
  {
    breeds: ['Beagle', 'Bernese Mountain Dog', 'Nova Scotia Duck Tolling Retriever'],
    species: 'dog',
    condition: 'Steroid-Responsive Meningitis-Arteritis (SRMA)',
    conditionKo: '스테로이드 반응 수막염-동맥염 (SRMA)',
    location: 'C1_C5',
    note: 'Young dogs <2yo. Severe cervical pain, fever. CSF neutrophilic pleocytosis.',
  },
  // ── Cats ──
  {
    breeds: ['Domestic Shorthair', 'Persian', 'Any breed with cardiomyopathy'],
    species: 'cat',
    condition: 'Aortic Thromboembolism (Saddle thrombus — T4 ischaemia)',
    conditionKo: '대동맥 혈전색전증 (안장 혈전 — T4 허혈)',
    location: 'T3_L3',
    note: 'Peracute bilateral pelvic limb paralysis, cold painful limbs, absent femoral pulse. Echo.',
  },
  {
    breeds: ['Any cat breed'],
    species: 'cat',
    condition: 'Ischaemic Encephalopathy (non-inflammatory infarct)',
    conditionKo: '허혈성 뇌병증 (비염증성 경색)',
    location: 'cerebral_cortex',
    note: 'Middle-aged cats. Peracute forebrain signs. MRI DWI. Often idiopathic (Cuterebra larva).',
  },
  {
    breeds: ['Burmese', 'Siamese', 'Tonkinese'],
    species: 'cat',
    condition: 'Hypokalaemic Myopathy',
    conditionKo: '저칼륨혈증 근육병증',
    location: 'muscle',
    note: 'Ventral neck flexion, generalised weakness. Serum K+. Supplement.',
  },
  {
    breeds: ['Birman'],
    species: 'cat',
    condition: 'Spongiform Leukoencephalomyelopathy',
    conditionKo: '스폰지형 백질 뇌척수병증',
    location: 'cerebral_cortex',
    note: 'Hereditary — progressive ataxia in young Birmans. MRI + histopathology.',
  },
];

// ============================================================
// SECTION 24: ONSET × LOCATION MODIFIER TABLE
// Onset pattern refines DDx priority
// ============================================================

export interface OnsetLocationModifier {
  onset: Onset;
  location: NeuroLocation;
  topDxDog: string[];
  topDxCat: string[];
  urgency: 'emergency' | 'urgent' | 'elective';
  note: string;
}

export const onsetLocationModifiers: OnsetLocationModifier[] = [
  {
    onset: 'peracute',
    location: 'T3_L3',
    topDxDog: ['IVDD Hansen Type I', 'FCE (fibrocartilaginous embolism)', 'Trauma', 'Spinal haemorrhage'],
    topDxCat: ['Aortic thromboembolism', 'Trauma', 'FCE'],
    urgency: 'emergency',
    note: 'Peracute T3–L3: IVDD vs FCE. FCE: pain resolves quickly, non-progressive. IVDD: ongoing pain.',
  },
  {
    onset: 'peracute',
    location: 'cerebral_cortex',
    topDxDog: ['Vascular infarct', 'Haemorrhagic stroke', 'Trauma', 'Metabolic crisis (hypoglycaemia)'],
    topDxCat: ['Ischaemic encephalopathy', 'Haemorrhagic stroke (hypertension)', 'Cuterebra larva migration', 'Trauma'],
    urgency: 'emergency',
    note: 'Peracute forebrain: vascular first. MRI DWI critical.',
  },
  {
    onset: 'acute',
    location: 'vestibular_peripheral',
    topDxDog: ['Idiopathic geriatric vestibular', 'Otitis interna', 'Hypothyroid', 'Ototoxicity'],
    topDxCat: ['Idiopathic vestibular', 'Nasopharyngeal polyp', 'Otitis interna'],
    urgency: 'urgent',
    note: 'Acute peripheral vestibular: idiopathic often improves in 72h. If not improving → imaging.',
  },
  {
    onset: 'chronic_progressive',
    location: 'T3_L3',
    topDxDog: ['Degenerative myelopathy', 'IVDD Hansen Type II', 'Spinal neoplasia', 'Discospondylitis'],
    topDxCat: ['Spinal lymphoma', 'FIP myelitis', 'IVDD', 'Vertebral neoplasia'],
    urgency: 'urgent',
    note: 'Chronic progressive T3-L3: degenerative myelopathy (painless) vs neoplasia (often painful).',
  },
  {
    onset: 'chronic_progressive',
    location: 'cerebral_cortex',
    topDxDog: ['Intracranial neoplasia', 'GME/NME', 'Storage disease', 'Hydrocephalus'],
    topDxCat: ['Meningioma', 'FIP', 'Lymphoma', 'Toxoplasmosis'],
    urgency: 'urgent',
    note: 'Chronic progressive forebrain: neoplasia most common in older animals.',
  },
  {
    onset: 'episodic',
    location: 'cerebral_cortex',
    topDxDog: ['Idiopathic epilepsy', 'Structural epilepsy (neoplasia/GME)', 'Metabolic epilepsy (hepatic/hypoglycaemia)'],
    topDxCat: ['Structural epilepsy', 'FIP', 'Metabolic (hypertensive, hyperthyroid)'],
    urgency: 'urgent',
    note: 'Episodic forebrain: inter-ictal normal → idiopathic. Inter-ictal abnormal → structural/metabolic.',
  },
  {
    onset: 'subacute',
    location: 'diffuse',
    topDxDog: ['GME', 'CDV encephalomyelitis', 'Neospora/Toxoplasma', 'Metabolic encephalopathy'],
    topDxCat: ['FIP', 'Toxoplasmosis', 'Cryptococcosis', 'FeLV/FIV encephalitis'],
    urgency: 'urgent',
    note: 'Subacute multifocal: infectious/inflammatory most likely.',
  },
];

// ============================================================
// SECTION 25: LOCALISATION ENGINE
// Core functions to compute localisation from collected signs
// ============================================================

/**
 * Collect all NeurologicalSign tags from a completed exam result map.
 * results: { testID → selected value(s) string }
 */
export function collectSigns(
  results: Record<string, string | string[]>,
  domainSections: NeuroDomainSection[]
): Set<NeurologicalSign> {
  const signs = new Set<NeurologicalSign>();

  for (const section of domainSections) {
    for (const test of section.tests) {
      const val = results[test.testID];
      if (val === undefined || val === null) continue;

      const addSignsFromList = (signList?: NeurologicalSign[]) => {
        if (signList) signList.forEach(s => signs.add(s));
      };

      if (test.testType === 'select') {
        const opt = test.options.find(o => o.value === val);
        if (opt) addSignsFromList(opt.signs);

      } else if (test.testType === 'multiselect') {
        const vals = Array.isArray(val) ? val : [val];
        for (const v of vals) {
          const opt = test.options.find(o => o.value === v);
          if (opt) addSignsFromList(opt.signs);
        }

      } else if (test.testType === 'boolean') {
        if (val === 'true' && test.positiveSigns) {
          addSignsFromList(test.positiveSigns);
        }

      } else if (test.testType === 'range') {
        const numVal = parseFloat(val as string);
        if (!isNaN(numVal)) {
          const seg = test.ranges.find(r =>
            (r.min === null || numVal >= r.min) &&
            (r.max === null || numVal < r.max)
          );
          if (seg) addSignsFromList(seg.signs);
        }

      } else if (test.testType === 'grade') {
        const grade = test.grades.find(g => String(g.grade) === String(val));
        if (grade) addSignsFromList(grade.signs);
      }
    }
  }
  return signs;
}

/**
 * Detect active syndromes from collected signs.
 */
export function detectSyndromes(
  activeSignsSet: Set<NeurologicalSign>
): SyndromeRule[] {
  return syndromeRules.filter(rule => {
    // All required signs must be present
    const requiredMet = rule.requiredSigns.every(s => activeSignsSet.has(s));
    if (!requiredMet) return false;

    // At least one of atLeastOneSigns must be present (if defined)
    if (rule.atLeastOneSigns && rule.atLeastOneSigns.length > 0) {
      return rule.atLeastOneSigns.some(s => activeSignsSet.has(s));
    }
    return true;
  });
}

/**
 * Score each localisation rule and return ranked candidates.
 *
 * Confidence score components:
 *   - Each required sign met:     +30 points
 *   - Each supporting sign met:   +10 points
 *   - Below minSupportCount:      -50 points (disqualified)
 *   - Each excluding sign present: -100 points (disqualified)
 *
 * Returns sorted by score descending.
 */
export function scoreLocalisations(
  activeSignsSet: Set<NeurologicalSign>,
  context?: NeuroPatientContext
): LocalisationResult[] {
  const results: LocalisationResult[] = [];

  for (const rule of localisationRules) {
    // Check excluding signs — any present = disqualify
    const excludingPresent = rule.excludingSigns.filter(s => activeSignsSet.has(s));
    if (excludingPresent.length > 0) continue;

    // Count required signs met
    const requiredMet = rule.requiredSigns.filter(s => activeSignsSet.has(s));
    if (requiredMet.length < rule.requiredSigns.length) continue;

    // Count supporting signs
    const supportingMet = rule.supportingSigns.filter(s => activeSignsSet.has(s));
    if (supportingMet.length < rule.minSupportCount) continue;

    // Calculate score
    let score = requiredMet.length * 30 + supportingMet.length * 10;

    // Onset modifier
    if (context?.onset && rule.onsetPattern) {
      if (rule.onsetPattern.includes(context.onset)) score += 15;
    }

    // Species modifier — boost relevant DDx
    const species = context?.species ?? 'dog';
    let differentials = rule.differentials[species];

    // Apply species modifiers
    const specMods = speciesModifiers[species]?.filter(m =>
      rule.locations.some(l => l.location === m.location)
    );
    if (specMods?.length) {
      // Reorder differentials: prioritised first
      const prioritised = specMods.flatMap(m => m.priorityDx);
      differentials = [
        ...prioritised.filter(d => differentials.includes(d)),
        ...differentials.filter(d => !prioritised.includes(d)),
      ];
    }

    // Clamp to 0–100
    const clampedScore = Math.min(100, Math.max(0, score));

    // Confidence tier
    const confidence: 'high' | 'medium' | 'low' =
      clampedScore >= 60 ? 'high' : clampedScore >= 30 ? 'medium' : 'low';

    for (const loc of rule.locations) {
      // Location-specific confidence can downgrade
      const finalConfidence: 'high' | 'medium' | 'low' =
        loc.confidence === 'low' ? 'low'
        : loc.confidence === 'medium' && confidence === 'high' ? 'medium'
        : confidence;

      results.push({
        location: loc.location,
        confidence: finalConfidence,
        confidenceScore: clampedScore,
        supportingFindings: supportingMet.map(s => s as string),
        contradictingFindings: [],
        differentials,
        diagnostics: rule.diagnostics,
      });
    }
  }

  // Sort by confidence score descending, then by confidence tier
  results.sort((a, b) => {
    if (b.confidenceScore !== a.confidenceScore) return b.confidenceScore - a.confidenceScore;
    const order = { high: 2, medium: 1, low: 0 };
    return order[b.confidence] - order[a.confidence];
  });

  // Deduplicate locations — keep highest score per location
  const seen = new Set<string>();
  return results.filter(r => {
    if (seen.has(r.location)) return false;
    seen.add(r.location);
    return true;
  });
}

/**
 * Master function: run full localisation pipeline.
 * Returns syndromes detected + ranked localisation candidates.
 */
export function runLocalisationEngine(
  results: Record<string, string | string[]>,
  context: NeuroPatientContext,
  domainSections: NeuroDomainSection[]
): {
  activeSigns: NeurologicalSign[];
  detectedSyndromes: SyndromeRule[];
  localisationCandidates: LocalisationResult[];
  breedFlags: BreedRiskFlag[];
  onsetModifiers: OnsetLocationModifier[];
} {
  // 1. Collect all signs
  const activeSignsSet = collectSigns(results, domainSections);
  const activeSigns = Array.from(activeSignsSet);

  // 2. Detect syndromes
  const detectedSyndromes = detectSyndromes(activeSignsSet);

  // 3. Score localisations
  const localisationCandidates = scoreLocalisations(activeSignsSet, context);

  // 4. Breed risk flags
  const breed = context.breed ?? '';
  const breedFlags = breedRiskFlags.filter(f =>
    f.species === context.species &&
    f.breeds.some(b => breed.toLowerCase().includes(b.toLowerCase()))
  );

  // 5. Onset modifiers for top candidates
  const topLocations = localisationCandidates.slice(0, 3).map(c => c.location);
  const onsetModifiers = onsetLocationModifiers.filter(m =>
    m.onset === context.onset && topLocations.includes(m.location)
  );

  return { activeSigns, detectedSyndromes, localisationCandidates, breedFlags, onsetModifiers };
}

// ============================================================
// SECTION 26: CHART GENERATION UTILITIES
// ============================================================

/**
 * Build structured chart text from exam results.
 * lang: 'ko' | 'en'
 */
export function buildNeuroChartSummary(
  results: Record<string, string | string[]>,
  context: NeuroPatientContext,
  domainSections: NeuroDomainSection[],
  lang: 'ko' | 'en' = 'ko'
): {
  domainSummaries: Array<{ domain: string; lines: string[] }>;
  localisationText: string;
  syndromeText: string;
  recommendationText: string;
  summaryText: string;
} {
  const domainSummaries: Array<{ domain: string; lines: string[] }> = [];

  // Per-domain chart lines
  for (const section of domainSections) {
    const lines: string[] = [];
    for (const test of section.tests) {
      const val = results[test.testID];
      if (!val) continue;

      const getLine = (text: string, textKo: string, isAbnormal: boolean): string | null => {
        if (!isAbnormal) return null;       // skip normal findings in chart
        return lang === 'ko' ? textKo : text;
      };

      if (test.testType === 'select') {
        const opt = test.options.find(o => o.value === val);
        if (opt && opt.isAbnormal) {
          const line = getLine(opt.resultText, opt.resultTextKo, true);
          if (line) lines.push(line);
        }
      } else if (test.testType === 'multiselect') {
        const vals = Array.isArray(val) ? val : [val];
        const abnormalOpts = test.options.filter(o => vals.includes(o.value) && o.isAbnormal);
        if (abnormalOpts.length > 0) {
          const template = lang === 'ko' ? test.resultTemplateKo : test.resultTemplate;
          const joined = abnormalOpts.map(o => lang === 'ko' ? o.labelKo : o.label).join(', ');
          lines.push(template.replace('{values}', joined));
        }
      } else if (test.testType === 'boolean') {
        if (val === 'true' && test.positiveIsAbnormal) {
          lines.push(lang === 'ko' ? test.positiveResultTextKo : test.positiveResultText);
        }
      } else if (test.testType === 'range') {
        const numVal = parseFloat(val as string);
        if (!isNaN(numVal)) {
          const seg = test.ranges.find(r =>
            (r.min === null || numVal >= r.min) &&
            (r.max === null || numVal < r.max)
          );
          if (seg && seg.isAbnormal) {
            lines.push(lang === 'ko' ? seg.resultTextKo : seg.resultText);
          }
        }
      } else if (test.testType === 'grade') {
        const grade = test.grades.find(g => String(g.grade) === String(val));
        if (grade && grade.isAbnormal) {
          const text = lang === 'ko'
            ? `${test.testNameKo}: ${grade.labelKo} — ${grade.descriptionKo}`
            : `${test.testName}: ${grade.label} — ${grade.description}`;
          lines.push(text);
        }
      }
    }
    if (lines.length > 0) {
      domainSummaries.push({
        domain: lang === 'ko' ? section.domainNameKo : section.domainName,
        lines,
      });
    }
  }

  // Localisation text
  const { localisationCandidates, detectedSyndromes, onsetModifiers } =
    runLocalisationEngine(results, context, domainSections);

  const topCandidates = localisationCandidates.slice(0, 3);
  const localisationText = lang === 'ko'
    ? `【병변 국소화】\n` + topCandidates.map((c, i) =>
        `  ${i + 1}. ${locationNameKo[c.location] ?? c.location} (신뢰도: ${c.confidence === 'high' ? '높음' : c.confidence === 'medium' ? '중간' : '낮음'})`
      ).join('\n')
    : `【Lesion Localisation】\n` + topCandidates.map((c, i) =>
        `  ${i + 1}. ${locationNameEn[c.location] ?? c.location} (Confidence: ${c.confidence})`
      ).join('\n');

  // Syndrome text
  const syndromeText = detectedSyndromes.length > 0
    ? (lang === 'ko'
        ? `【자동 감지 증후군】\n` + detectedSyndromes.map(s => `  • ${s.nameKo}: ${s.interpretationKo}`).join('\n')
        : `【Detected Syndromes】\n` + detectedSyndromes.map(s => `  • ${s.name}: ${s.interpretation}`).join('\n'))
    : '';

  // Recommendation
  const topDx = topCandidates[0];
  const recommendationText = topDx
    ? (lang === 'ko'
        ? `【권장 추가 검사】\n` + topDx.diagnostics.map(d => `  • ${d}`).join('\n')
        + (onsetModifiers[0]
            ? `\n\n  ※ 발병 패턴 메모: ${onsetModifiers[0].note}`
            : '')
        : `【Recommended Diagnostics】\n` + topDx.diagnostics.map(d => `  • ${d}`).join('\n')
        + (onsetModifiers[0]
            ? `\n\n  * Onset note: ${onsetModifiers[0].note}`
            : ''))
    : '';

  const summaryText = [
    domainSummaries
      .map(d => `▶ ${d.domain}\n` + d.lines.map(l => `  - ${l}`).join('\n'))
      .join('\n\n'),
    localisationText,
    syndromeText,
    recommendationText,
  ].filter(Boolean).join('\n\n');

  return { domainSummaries, localisationText, syndromeText, recommendationText, summaryText };
}

// Location name maps for chart text
const locationNameKo: Partial<Record<NeuroLocation, string>> = {
  cerebral_cortex: '대뇌 피질',
  thalamus_hypothalamus: '시상 / 시상하부',
  basal_ganglia: '기저핵',
  midbrain: '중뇌',
  pons: '교뇌',
  medulla: '연수',
  cerebellum: '소뇌',
  cerebellar_peduncles: '소뇌 다리',
  vestibular_peripheral: '말초 전정계 (내이 / CN VIII)',
  vestibular_central: '중추 전정계 (뇌간 / 소뇌)',
  C1_C5: 'C1-C5 경추 척수',
  C6_T2: 'C6-T2 경흉추 척수 (상완팽대부)',
  T3_L3: 'T3-L3 흉요추 척수',
  L4_S3: 'L4-S3 요천추 척수 (요천추팽대부)',
  sacrocaudal: '천미 척수',
  peripheral_nerve: '말초 신경',
  neuromuscular_junction: '신경근 접합부',
  muscle: '근육',
  multifocal: '다발성 병변',
  diffuse: '미만성 병변',
};

const locationNameEn: Partial<Record<NeuroLocation, string>> = {
  cerebral_cortex: 'Cerebral Cortex',
  thalamus_hypothalamus: 'Thalamus / Hypothalamus',
  basal_ganglia: 'Basal Ganglia',
  midbrain: 'Midbrain (Mesencephalon)',
  pons: 'Pons',
  medulla: 'Medulla Oblongata',
  cerebellum: 'Cerebellum',
  cerebellar_peduncles: 'Cerebellar Peduncles',
  vestibular_peripheral: 'Peripheral Vestibular System (Inner Ear / CN VIII)',
  vestibular_central: 'Central Vestibular System (Brainstem / Cerebellum)',
  C1_C5: 'C1–C5 Cervical Spinal Cord',
  C6_T2: 'C6–T2 Cervicothoracic Spinal Cord (Brachial Intumescence)',
  T3_L3: 'T3–L3 Thoracolumbar Spinal Cord',
  L4_S3: 'L4–S3 Lumbosacral Spinal Cord (Lumbosacral Intumescence)',
  sacrocaudal: 'Sacrocaudal Spinal Cord',
  peripheral_nerve: 'Peripheral Nerve',
  neuromuscular_junction: 'Neuromuscular Junction',
  muscle: 'Muscle',
  multifocal: 'Multifocal Lesion',
  diffuse: 'Diffuse Lesion',
};

/**
 * UI visibility helpers — same interface as ultrasound_ref
 */
export function isDomainVisible(
  section: NeuroDomainSection,
  results: Record<string, string>
): boolean {
  const gateValue = results[section.statusGate.testID];
  return gateValue === section.statusGate.abnormalValue;
}

export function isNeuroTestVisible(
  test: NeuroTestItem,
  results: Record<string, string | string[]>
): boolean {
  if (!test.dependsOn) return true;
  const deps = Array.isArray(test.dependsOn) ? test.dependsOn : [test.dependsOn];
  return deps.every(dep => {
    const current = results[dep.testID];
    if (!current) return false;
    const currentVals = Array.isArray(current) ? current : [current];
    const op = dep.operator ?? 'OR';
    if (op === 'OR') return dep.triggerValues.some(v => currentVals.includes(v));
    return dep.triggerValues.every(v => currentVals.includes(v));
  });
}

// ============================================================
// SECTION 27: FULL REFERENCE ASSEMBLY & EXPORT
// ============================================================

export interface NeuroReference {
  version: string;
  lastUpdated: string;
  // Data
  domainSections: NeuroDomainSection[];
  syndromeRules: SyndromeRule[];
  localisationRules: LocalisationRule[];
  breedRiskFlags: BreedRiskFlag[];
  onsetLocationModifiers: OnsetLocationModifier[];
  speciesModifiers: Record<'dog' | 'cat', SpeciesModifier[]>;
  spinalLocQuickRef: SpinalLocQuickRef[];
  lateralisationQuickRef: LateralisationQuickRef[];
  spinalVoteMappings: SpinalVoteMapping[];
  lateralisationVoteRules: LateralisationVoteRule[];
  cranialNerveSummary: CNSummary[];
  // Core engine
  runLocalisationEngine: typeof runLocalisationEngine;
  buildNeuroChartSummary: typeof buildNeuroChartSummary;
  isDomainVisible: typeof isDomainVisible;
  isNeuroTestVisible: typeof isNeuroTestVisible;
  collectSigns: typeof collectSigns;
  detectSyndromes: typeof detectSyndromes;
  // Lateralisation engines
  assessCerebralLateralisation: typeof assessCerebralLateralisation;
  assessSpinalLateralisation: typeof assessSpinalLateralisation;
  runFullLocalisationEngine: typeof runFullLocalisationEngine;
  runCompleteLocalisationEngine: typeof runCompleteLocalisationEngine;
  appendLateralisationToChart: typeof appendLateralisationToChart;
}


// ============================================================
// SECTION 28: QUICK REFERENCE — CN FUNCTION SUMMARY TABLE
// Useful for UI tooltip / reference panel
// ============================================================

export interface CNSummary {
  cn: CranialNerve;
  name: string;
  nameKo: string;
  fibreType: string;
  primaryFunction: string;
  primaryFunctionKo: string;
  testInExam: string;
  testInExamKo: string;
  lesionSign: string;
  lesionSignKo: string;
  nucleusLocation: NeuroLocation;
}

export const cranialNerveSummary: CNSummary[] = [
  {
    cn: 'CN_I', name: 'Olfactory', nameKo: '후각신경',
    fibreType: 'Sensory (special)',
    primaryFunction: 'Smell', primaryFunctionKo: '후각',
    testInExam: 'Scent response (food near nostril)', testInExamKo: '냄새 반응 (콧구멍 근처 음식)',
    lesionSign: 'Anosmia', lesionSignKo: '후각 소실',
    nucleusLocation: 'cerebral_cortex',
  },
  {
    cn: 'CN_II', name: 'Optic', nameKo: '시각신경',
    fibreType: 'Sensory (special)',
    primaryFunction: 'Vision; PLR afferent', primaryFunctionKo: '시각; PLR 구심성',
    testInExam: 'Menace, cotton ball, PLR', testInExamKo: '위협 반응, 솜뭉치, PLR',
    lesionSign: 'Blindness, absent PLR direct', lesionSignKo: '실명, 직접 PLR 소실',
    nucleusLocation: 'midbrain',
  },
  {
    cn: 'CN_III', name: 'Oculomotor', nameKo: '동안신경',
    fibreType: 'Motor (somatic + parasympathetic)',
    primaryFunction: 'Eyeball movement (dorsal, medial, ventral), pupil constriction, upper eyelid', primaryFunctionKo: '안구 운동(상내하), 동공 수축, 상안검',
    testInExam: 'Pupil size, PLR efferent, strabismus', testInExamKo: '동공 크기, PLR 원심성, 사시',
    lesionSign: 'Mydriasis, ventrolateral strabismus, ptosis', lesionSignKo: '동공 산대, 복외측 사시, 안검 하수',
    nucleusLocation: 'midbrain',
  },
  {
    cn: 'CN_IV', name: 'Trochlear', nameKo: '도르래신경',
    fibreType: 'Motor (somatic)',
    primaryFunction: 'Superior oblique muscle (intorsion / downward gaze)', primaryFunctionKo: '상사근 (내전/하방 응시)',
    testInExam: 'Fundic orientation (extorsion assessment)', testInExamKo: '안저 방향 (외전 평가)',
    lesionSign: 'Globe extorsion', lesionSignKo: '안구 외전',
    nucleusLocation: 'midbrain',
  },
  {
    cn: 'CN_V', name: 'Trigeminal', nameKo: '삼차신경',
    fibreType: 'Mixed (sensory + motor)',
    primaryFunction: 'Facial sensation (3 branches); jaw motor (masseter, temporalis)', primaryFunctionKo: '안면 감각(3분지); 하악 운동(교근, 측두근)',
    testInExam: 'Facial sensation, palpebral reflex, jaw tone, corneal reflex', testInExamKo: '안면 감각, 안검 반사, 하악 긴장도, 각막 반사',
    lesionSign: 'Facial hypoalgesia, dropped jaw, masseter atrophy', lesionSignKo: '안면 통각 저하, 하악 하수, 교근 위축',
    nucleusLocation: 'pons',
  },
  {
    cn: 'CN_VI', name: 'Abducens', nameKo: '외전신경',
    fibreType: 'Motor (somatic)',
    primaryFunction: 'Lateral rectus (eye abduction) + retractor bulbi', primaryFunctionKo: '외직근(안구 외전) + 안구 후퇴근',
    testInExam: 'Lateral eye movement, corneal reflex (retraction)', testInExamKo: '외측 안구 운동, 각막 반사(안구 후퇴)',
    lesionSign: 'Medial strabismus (dorsomedial), inability to abduct', lesionSignKo: '내측(배내측) 사시, 외전 불가',
    nucleusLocation: 'pons',
  },
  {
    cn: 'CN_VII', name: 'Facial', nameKo: '안면신경',
    fibreType: 'Mixed (motor + parasympathetic + sensory)',
    primaryFunction: 'Facial muscle motor; lacrimal / salivary glands; taste (rostral 2/3 tongue)', primaryFunctionKo: '안면근 운동; 누선/타액선; 미각(혀 앞 2/3)',
    testInExam: 'Facial symmetry, palpebral reflex, menace efferent, Schirmer test', testInExamKo: '안면 대칭, 안검 반사, 위협 반응 원심성, 쉬르머 검사',
    lesionSign: 'Facial paresis (lip/ear/eye droop), KCS, absent palpebral', lesionSignKo: '안면 부전마비(입술/귀/눈 하수), KCS, 안검 반사 소실',
    nucleusLocation: 'pons',
  },
  {
    cn: 'CN_VIII', name: 'Vestibulocochlear', nameKo: '전정와우신경',
    fibreType: 'Sensory (special)',
    primaryFunction: 'Balance (vestibular branch); hearing (cochlear branch)', primaryFunctionKo: '균형(전정 분지); 청각(달팽이관 분지)',
    testInExam: 'Head tilt, nystagmus (type/direction/fast phase), falling, BAER', testInExamKo: '두부 경사, 안구 진탕(유형/방향/급속안구운동), 낙상, BAER',
    lesionSign: 'Head tilt, nystagmus, vestibular ataxia, deafness', lesionSignKo: '두부 경사, 안구 진탕, 전정 실조, 청력 소실',
    nucleusLocation: 'medulla',
  },
  {
    cn: 'CN_IX', name: 'Glossopharyngeal', nameKo: '설인신경',
    fibreType: 'Mixed',
    primaryFunction: 'Pharyngeal sensation & motor; parotid salivation; taste (caudal tongue)', primaryFunctionKo: '인두 감각/운동; 이하선 타액; 미각(혀 뒤)',
    testInExam: 'Gag reflex (afferent), swallowing', testInExamKo: '구역 반사(구심성), 연하',
    lesionSign: 'Reduced gag, dysphagia', lesionSignKo: '구역 감소, 연하 곤란',
    nucleusLocation: 'medulla',
  },
  {
    cn: 'CN_X', name: 'Vagus', nameKo: '미주신경',
    fibreType: 'Mixed (motor + parasympathetic + sensory)',
    primaryFunction: 'Pharynx/larynx motor; visceral parasympathetic; visceral sensation', primaryFunctionKo: '인두/후두 운동; 내장 부교감; 내장 감각',
    testInExam: 'Gag reflex (efferent), laryngeal function, voice quality', testInExamKo: '구역 반사(원심성), 후두 기능, 음성 질',
    lesionSign: 'Dysphagia, dysphonia, laryngeal paralysis, absent gag', lesionSignKo: '연하 곤란, 발성 장애, 후두 마비, 구역 소실',
    nucleusLocation: 'medulla',
  },
  {
    cn: 'CN_XI', name: 'Accessory', nameKo: '부신경',
    fibreType: 'Motor (somatic)',
    primaryFunction: 'Trapezius, sternocleidomastoid muscles', primaryFunctionKo: '승모근, 흉쇄유돌근',
    testInExam: 'Trapezius palpation for atrophy', testInExamKo: '승모근 촉진 및 위축 확인',
    lesionSign: 'Trapezius atrophy', lesionSignKo: '승모근 위축',
    nucleusLocation: 'medulla',
  },
  {
    cn: 'CN_XII', name: 'Hypoglossal', nameKo: '설하신경',
    fibreType: 'Motor (somatic)',
    primaryFunction: 'Tongue motor (intrinsic and extrinsic muscles)', primaryFunctionKo: '혀 운동 (내인/외인근)',
    testInExam: 'Tongue symmetry, lapping, deviation, atrophy', testInExamKo: '혀 대칭, 핥기, 편위, 위축',
    lesionSign: 'Tongue deviation (to lesion side), atrophy, fasciculations', lesionSignKo: '혀 편위(병변 방향), 위축, 근섬유속연축',
    nucleusLocation: 'medulla',
  },
];

// ============================================================
// SECTION 29: CEREBRAL HEMISPHERE LATERALISATION ENGINE
// 대뇌 반구 편측화 추론 엔진
//
// Principle — Contralateral Control:
//   Left hemisphere lesion  → Right-sided body deficits
//   Right hemisphere lesion → Left-sided body deficits
//
// Vision is PARTIALLY crossed at the optic chiasm (~50% in dogs/cats):
//   Left eye deficit  → Left CN II / Left retina  (ipsilateral)
//                     OR Right occipital cortex   (contralateral)
//   Right visual field deficit in both eyes → Left occipital cortex
//
// Circling:
//   Tight ipsilateral circle → Forebrain / Thalamus (same side as lesion)
//   Large circle             → Vestibular
//
// Seizure focal onset:
//   Left focal onset → Right cortex lesion (contralateral)
// ============================================================

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type HemisphereSide = 'left' | 'right' | 'bilateral' | 'undetermined';

export interface LateralisationVote {
  // Which hemisphere this evidence points to
  side: 'left' | 'right';
  // Weight: high=3, medium=2, low=1
  weight: 3 | 2 | 1;
  // The sign or test that generated this vote
  sourceSign: string;
  // Clinical explanation
  reasoning: string;
  reasoningKo: string;
  // Which rule: contralateral | ipsilateral | direct
  rule: 'contralateral' | 'ipsilateral' | 'direct';
}

export interface CerebralLateralisationResult {
  // Final conclusion
  hemisphere: HemisphereSide;
  confidence: 'high' | 'medium' | 'low' | 'undetermined';
  confidenceScore: number;       // 0–100
  leftScore: number;             // raw weighted votes for LEFT hemisphere lesion
  rightScore: number;            // raw weighted votes for RIGHT hemisphere lesion
  // All individual votes that contributed
  votes: LateralisationVote[];
  // Conflicting votes (left and right both have evidence)
  conflicting: boolean;
  // Explanation for the clinician
  summary: string;
  summaryKo: string;
  // Caveat when confidence is limited
  caveat?: string;
  caveatKo?: string;
}

// ─────────────────────────────────────────────
// SECTION 29A: LATERALISATION VOTE RULES
// Each rule maps a sign → vote for left or right hemisphere lesion
// ─────────────────────────────────────────────

export interface LateralisationVoteRule {
  ruleID: string;
  description: string;
  descriptionKo: string;
  // Sign that triggers this rule
  triggerSign: NeurologicalSign;
  // Hemisphere the lesion is inferred to be in
  lesionHemisphere: 'left' | 'right';
  weight: 3 | 2 | 1;
  rule: 'contralateral' | 'ipsilateral' | 'direct';
  reasoning: string;
  reasoningKo: string;
}

export const lateralisationVoteRules: LateralisationVoteRule[] = [

  // ══ MOTOR DEFICITS — Contralateral rule (weight 3) ════════════════════════
  // Hemiparesis: deficit on one body side → lesion contralateral hemisphere
  {
    ruleID: 'lat_hemiparesis_left',
    description: 'Left hemiparesis → Right hemisphere lesion',
    descriptionKo: '좌측 편측 부전마비 → 우측 반구 병변',
    triggerSign: 'hemiparesis_left',
    lesionHemisphere: 'right',
    weight: 3,
    rule: 'contralateral',
    reasoning: 'Left-sided body weakness is controlled by the right motor cortex (contralateral).',
    reasoningKo: '좌측 신체 약화는 우측 운동피질(반대측)에 의해 지배됩니다.',
  },
  {
    ruleID: 'lat_hemiparesis_right',
    description: 'Right hemiparesis → Left hemisphere lesion',
    descriptionKo: '우측 편측 부전마비 → 좌측 반구 병변',
    triggerSign: 'hemiparesis_right',
    lesionHemisphere: 'left',
    weight: 3,
    rule: 'contralateral',
    reasoning: 'Right-sided body weakness is controlled by the left motor cortex (contralateral).',
    reasoningKo: '우측 신체 약화는 좌측 운동피질(반대측)에 의해 지배됩니다.',
  },

  // ══ POSTURAL REACTIONS — Contralateral rule (weight 3) ═══════════════════
  {
    ruleID: 'lat_prop_pelvic_left',
    description: 'Left pelvic proprioception deficit → Right hemisphere',
    descriptionKo: '좌측 후지 고유감각 결손 → 우측 반구',
    triggerSign: 'proprioception_deficit_pelvic_left',
    lesionHemisphere: 'right',
    weight: 3,
    rule: 'contralateral',
    reasoning: 'Left pelvic limb proprioception is processed in the right somatosensory cortex.',
    reasoningKo: '좌측 후지 고유감각은 우측 체성감각피질에서 처리됩니다.',
  },
  {
    ruleID: 'lat_prop_pelvic_right',
    description: 'Right pelvic proprioception deficit → Left hemisphere',
    descriptionKo: '우측 후지 고유감각 결손 → 좌측 반구',
    triggerSign: 'proprioception_deficit_pelvic_right',
    lesionHemisphere: 'left',
    weight: 3,
    rule: 'contralateral',
    reasoning: 'Right pelvic limb proprioception is processed in the left somatosensory cortex.',
    reasoningKo: '우측 후지 고유감각은 좌측 체성감각피질에서 처리됩니다.',
  },
  {
    ruleID: 'lat_prop_thoracic_left',
    description: 'Left thoracic proprioception deficit → Right hemisphere',
    descriptionKo: '좌측 전지 고유감각 결손 → 우측 반구',
    triggerSign: 'proprioception_deficit_thoracic_left',
    lesionHemisphere: 'right',
    weight: 3,
    rule: 'contralateral',
    reasoning: 'Left thoracic limb proprioception is processed in the right somatosensory cortex.',
    reasoningKo: '좌측 전지 고유감각은 우측 체성감각피질에서 처리됩니다.',
  },
  {
    ruleID: 'lat_prop_thoracic_right',
    description: 'Right thoracic proprioception deficit → Left hemisphere',
    descriptionKo: '우측 전지 고유감각 결손 → 좌측 반구',
    triggerSign: 'proprioception_deficit_thoracic_right',
    lesionHemisphere: 'left',
    weight: 3,
    rule: 'contralateral',
    reasoning: 'Right thoracic limb proprioception is processed in the left somatosensory cortex.',
    reasoningKo: '우측 전지 고유감각은 좌측 체성감각피질에서 처리됩니다.',
  },
  {
    ruleID: 'lat_hopping_left',
    description: 'Left hopping deficit → Right hemisphere',
    descriptionKo: '좌측 홉핑 결손 → 우측 반구',
    triggerSign: 'hopping_deficit_left',
    lesionHemisphere: 'right',
    weight: 3,
    rule: 'contralateral',
    reasoning: 'Hopping deficits reflect contralateral motor/proprioceptive cortex dysfunction.',
    reasoningKo: '홉핑 결손은 반대측 운동/고유감각 피질 기능 이상을 반영합니다.',
  },
  {
    ruleID: 'lat_hopping_right',
    description: 'Right hopping deficit → Left hemisphere',
    descriptionKo: '우측 홉핑 결손 → 좌측 반구',
    triggerSign: 'hopping_deficit_right',
    lesionHemisphere: 'left',
    weight: 3,
    rule: 'contralateral',
    reasoning: 'Hopping deficits reflect contralateral motor/proprioceptive cortex dysfunction.',
    reasoningKo: '홉핑 결손은 반대측 운동/고유감각 피질 기능 이상을 반영합니다.',
  },
  {
    ruleID: 'lat_hemiwalking_left',
    description: 'Left hemiwalking deficit → Right hemisphere',
    descriptionKo: '좌측 편측보행 결손 → 우측 반구',
    triggerSign: 'hemiwalking_deficit_left',
    lesionHemisphere: 'right',
    weight: 3,
    rule: 'contralateral',
    reasoning: 'Left hemiwalking deficit reflects right forebrain or right C1–C5 dysfunction.',
    reasoningKo: '좌측 편측보행 결손은 우측 전뇌 또는 우측 C1-C5 기능 이상을 반영합니다.',
  },
  {
    ruleID: 'lat_hemiwalking_right',
    description: 'Right hemiwalking deficit → Left hemisphere',
    descriptionKo: '우측 편측보행 결손 → 좌측 반구',
    triggerSign: 'hemiwalking_deficit_right',
    lesionHemisphere: 'left',
    weight: 3,
    rule: 'contralateral',
    reasoning: 'Right hemiwalking deficit reflects left forebrain or left C1–C5 dysfunction.',
    reasoningKo: '우측 편측보행 결손은 좌측 전뇌 또는 좌측 C1-C5 기능 이상을 반영합니다.',
  },

  // ══ VISION — Contralateral rule for cortex (weight 2) ════════════════════
  // NOTE: Vision deficit in one eye can be ipsilateral CN II OR contralateral cortex.
  // Weight 2 (not 3) because of the ambiguity — CN II lesion cannot be excluded
  // without PLR assessment. Use menace_absent for the cortex-specific vote.
  {
    ruleID: 'lat_menace_absent_left',
    description: 'Absent left menace (with intact PLR) → Right occipital cortex',
    descriptionKo: '좌안 위협 반응 소실 (PLR 정상 시) → 우측 후두피질',
    triggerSign: 'menace_absent_left',
    lesionHemisphere: 'right',
    weight: 2,
    rule: 'contralateral',
    reasoning: 'Absent menace with intact PLR in the left eye indicates right occipital cortex or right optic tract lesion (not CN II). Visual cortex is contralateral.',
    reasoningKo: 'PLR이 정상이면서 좌안 위협 반응이 소실된 경우 우측 후두피질 또는 우측 시각로 병변을 시사합니다(CN II 아님). 시각 피질은 반대측에 위치합니다.',
  },
  {
    ruleID: 'lat_menace_absent_right',
    description: 'Absent right menace (with intact PLR) → Left occipital cortex',
    descriptionKo: '우안 위협 반응 소실 (PLR 정상 시) → 좌측 후두피질',
    triggerSign: 'menace_absent_right',
    lesionHemisphere: 'left',
    weight: 2,
    rule: 'contralateral',
    reasoning: 'Absent menace with intact PLR in the right eye indicates left occipital cortex or left optic tract lesion.',
    reasoningKo: 'PLR이 정상이면서 우안 위협 반응이 소실된 경우 좌측 후두피질 또는 좌측 시각로 병변을 시사합니다.',
  },
  {
    ruleID: 'lat_vision_deficit_left',
    description: 'Left eye vision deficit → Right occipital cortex (if PLR intact)',
    descriptionKo: '좌안 시각 결손 → 우측 후두피질 (PLR 정상 시)',
    triggerSign: 'vision_deficit_left',
    lesionHemisphere: 'right',
    weight: 2,
    rule: 'contralateral',
    reasoning: 'Left visual field/eye deficit can indicate right occipital cortex lesion if PLR is intact (CN II not involved).',
    reasoningKo: 'PLR이 정상인 경우 좌안 시각 결손은 우측 후두피질 병변을 시사합니다.',
  },
  {
    ruleID: 'lat_vision_deficit_right',
    description: 'Right eye vision deficit → Left occipital cortex (if PLR intact)',
    descriptionKo: '우안 시각 결손 → 좌측 후두피질 (PLR 정상 시)',
    triggerSign: 'vision_deficit_right',
    lesionHemisphere: 'left',
    weight: 2,
    rule: 'contralateral',
    reasoning: 'Right visual field/eye deficit can indicate left occipital cortex lesion if PLR is intact.',
    reasoningKo: 'PLR이 정상인 경우 우안 시각 결손은 좌측 후두피질 병변을 시사합니다.',
  },

  // ══ CIRCLING — Ipsilateral rule (weight 2) ════════════════════════════════
  // Tight circle toward side of lesion (forebrain/thalamus)
  {
    ruleID: 'lat_circling_left',
    description: 'Circles LEFT (tight) → Left hemisphere lesion',
    descriptionKo: '좌측 선회 (타이트) → 좌측 반구 병변',
    // circling_ipsilateral is tagged when circling is to left (from circling_direction='left')
    // We handle this via the circling_direction test value directly in the engine
    triggerSign: 'circling_ipsilateral',
    lesionHemisphere: 'left',   // placeholder — overridden dynamically by engine
    weight: 2,
    rule: 'ipsilateral',
    reasoning: 'Tight compulsive circling toward the left indicates ipsilateral (left) forebrain or thalamic lesion.',
    reasoningKo: '좌측으로의 타이트한 강박적 선회는 동측(좌측) 전뇌 또는 시상 병변을 시사합니다.',
  },

  // ══ SEIZURE FOCAL ONSET — Contralateral rule (weight 3) ══════════════════
  // Handled dynamically via seizure_lateralisation test value in engine below
  // (not a NeurologicalSign tag — it's a testID value)

  // ══ HEAD PRESSING — Bilateral / non-lateralising (weight 1) ══════════════
  // head_pressing alone does not lateralise well, but supports forebrain
  {
    ruleID: 'lat_head_pressing_nonlat',
    description: 'Head pressing — non-lateralising forebrain sign',
    descriptionKo: '머리 밀어붙임 — 편측화 불가 전뇌 징후',
    triggerSign: 'head_pressing',
    lesionHemisphere: 'left',   // weight 1 — will not tip balance alone
    weight: 1,
    rule: 'direct',
    reasoning: 'Head pressing indicates forebrain disease but does not reliably lateralise on its own.',
    reasoningKo: '머리 밀어붙임은 전뇌 질환을 시사하지만 단독으로는 편측화에 신뢰성이 없습니다.',
  },
];

// ─────────────────────────────────────────────
// SECTION 29B: CEREBRAL LATERALISATION ENGINE
// ─────────────────────────────────────────────

/**
 * Determine which cerebral hemisphere the lesion is more likely in.
 *
 * @param activeSignsSet  — signs collected from collectSigns()
 * @param results         — raw test results (for direction-specific values)
 * @returns CerebralLateralisationResult
 *
 * Special cases handled:
 *  1. circling_direction value (left/right) → ipsilateral hemisphere vote
 *  2. seizure_lateralisation value (left/right) → contralateral hemisphere vote
 *  3. PLR intact + menace absent → cortex vote (not CN II)
 *  4. Bilateral deficits → reduce confidence, flag bilateral
 */
export function assessCerebralLateralisation(
  activeSignsSet: Set<NeurologicalSign>,
  results: Record<string, string | string[]>
): CerebralLateralisationResult {

  const votes: LateralisationVote[] = [];

  // ── 1. Apply static vote rules (sign-based) ──────────────────────────────
  for (const rule of lateralisationVoteRules) {
    if (!activeSignsSet.has(rule.triggerSign)) continue;

    // Special handling: circling_ipsilateral is direction-dependent
    // Skip here — handled dynamically below
    if (rule.triggerSign === 'circling_ipsilateral') continue;
    // head_pressing: non-lateralising on its own — skip unless other votes exist
    if (rule.triggerSign === 'head_pressing') continue;

    votes.push({
      side: rule.lesionHemisphere,
      weight: rule.weight,
      sourceSign: rule.triggerSign,
      reasoning: rule.reasoning,
      reasoningKo: rule.reasoningKo,
      rule: rule.rule,
    });
  }

  // ── 2. Dynamic: Circling direction ───────────────────────────────────────
  // circling_direction testID is in mentation domain
  const circlingDir = results['circling_direction'] as string | undefined;
  if (circlingDir === 'left') {
    votes.push({
      side: 'left',
      weight: 2,
      sourceSign: 'circling_direction:left',
      reasoning: 'Tight circling to the left indicates ipsilateral (left) forebrain or thalamic lesion.',
      reasoningKo: '좌측 타이트 선회 → 동측(좌측) 전뇌 또는 시상 병변.',
      rule: 'ipsilateral',
    });
  } else if (circlingDir === 'right') {
    votes.push({
      side: 'right',
      weight: 2,
      sourceSign: 'circling_direction:right',
      reasoning: 'Tight circling to the right indicates ipsilateral (right) forebrain or thalamic lesion.',
      reasoningKo: '우측 타이트 선회 → 동측(우측) 전뇌 또는 시상 병변.',
      rule: 'ipsilateral',
    });
  }

  // ── 3. Dynamic: Focal seizure onset lateralisation ───────────────────────
  // seizure_lateralisation testID (contralateral rule: focal onset left → right cortex)
  const seizureLat = results['seizure_lateralisation'] as string | undefined;
  if (seizureLat === 'left') {
    votes.push({
      side: 'right',
      weight: 3,
      sourceSign: 'seizure_lateralisation:left',
      reasoning: 'Focal seizure onset on the LEFT side indicates RIGHT cerebral cortex irritative lesion (contralateral).',
      reasoningKo: '좌측 국소 발작 발생 → 우측 대뇌 피질 자극성 병변(반대측).',
      rule: 'contralateral',
    });
  } else if (seizureLat === 'right') {
    votes.push({
      side: 'left',
      weight: 3,
      sourceSign: 'seizure_lateralisation:right',
      reasoning: 'Focal seizure onset on the RIGHT side indicates LEFT cerebral cortex irritative lesion (contralateral).',
      reasoningKo: '우측 국소 발작 발생 → 좌측 대뇌 피질 자극성 병변(반대측).',
      rule: 'contralateral',
    });
  }

  // ── 4. Dynamic: PLR status modifies menace vote weight ───────────────────
  // If PLR is absent same side as menace deficit → probably CN II, not cortex
  // Downgrade menace vote in that case
  const plrStatus = results['cn2_plr'] as string | undefined;
  if (plrStatus) {
    // Reduce vote weight for menace if direct PLR also absent (CN II more likely)
    for (const vote of votes) {
      if (vote.sourceSign === 'menace_absent_left' &&
          (plrStatus === 'absent_direct_left' || plrStatus === 'absent_all')) {
        vote.weight = 1;  // downgrade: CN II involved
        vote.reasoning += ' [Weight reduced: direct PLR also absent — CN II lesion possible]';
        vote.reasoningKo += ' [가중치 감소: 직접 PLR도 소실 — CN II 병변 가능]';
      }
      if (vote.sourceSign === 'menace_absent_right' &&
          (plrStatus === 'absent_direct_right' || plrStatus === 'absent_all')) {
        vote.weight = 1;
        vote.reasoning += ' [Weight reduced: direct PLR also absent — CN II lesion possible]';
        vote.reasoningKo += ' [가중치 감소: 직접 PLR도 소실 — CN II 병변 가능]';
      }
    }
  }

  // ── 5. Tally scores ───────────────────────────────────────────────────────
  let leftScore = 0;
  let rightScore = 0;
  for (const v of votes) {
    if (v.side === 'left')  leftScore  += v.weight;
    if (v.side === 'right') rightScore += v.weight;
  }

  const totalScore = leftScore + rightScore;
  const conflicting = leftScore > 0 && rightScore > 0;

  // ── 6. Determine hemisphere and confidence ────────────────────────────────
  let hemisphere: HemisphereSide = 'undetermined';
  let confidenceScore = 0;
  let confidence: 'high' | 'medium' | 'low' | 'undetermined' = 'undetermined';

  if (totalScore === 0) {
    hemisphere = 'undetermined';
    confidence = 'undetermined';
  } else if (leftScore === rightScore) {
    hemisphere = 'bilateral';
    confidence = 'low';
    confidenceScore = 20;
  } else {
    hemisphere = leftScore > rightScore ? 'left' : 'right';
    const dominantScore = Math.max(leftScore, rightScore);
    const ratio = dominantScore / totalScore;  // 0.5–1.0

    // Confidence tiers based on vote margin
    if (ratio >= 0.85 && !conflicting) {
      confidence = 'high';
      confidenceScore = Math.min(95, Math.round(ratio * 100));
    } else if (ratio >= 0.70) {
      confidence = 'medium';
      confidenceScore = Math.round(ratio * 80);
    } else {
      confidence = 'low';
      confidenceScore = Math.round(ratio * 60);
    }

    // Minimum 2 independent votes for any confidence > low
    const independentVotes = votes.filter(v => v.side === hemisphere).length;
    if (independentVotes < 2 && confidence === 'high') confidence = 'medium';
  }

  // ── 7. Build summary text ─────────────────────────────────────────────────
  const sideEn  = hemisphere === 'left' ? 'LEFT' : hemisphere === 'right' ? 'RIGHT' : hemisphere === 'bilateral' ? 'BILATERAL' : 'undetermined';
  const sideKo  = hemisphere === 'left' ? '좌측' : hemisphere === 'right' ? '우측' : hemisphere === 'bilateral' ? '양측' : '미결정';
  const confEn  = confidence === 'high' ? 'High' : confidence === 'medium' ? 'Medium' : confidence === 'low' ? 'Low' : 'Undetermined';
  const confKo  = confidence === 'high' ? '높음' : confidence === 'medium' ? '중간' : confidence === 'low' ? '낮음' : '미결정';

  const voteSummaryEn = votes.length > 0
    ? votes.map(v => `  • [${v.rule.toUpperCase()} → ${v.side.toUpperCase()} hemisphere, wt:${v.weight}] ${v.reasoning}`).join('\n')
    : '  • No lateralising signs detected.';
  const voteSummaryKo = votes.length > 0
    ? votes.map(v => `  • [${v.rule === 'contralateral' ? '반대측' : v.rule === 'ipsilateral' ? '동측' : '직접'} → ${v.side === 'left' ? '좌측' : '우측'} 반구, 가중치:${v.weight}] ${v.reasoningKo}`).join('\n')
    : '  • 편측화 징후 감지되지 않음.';

  const summary =
    `【Cerebral Hemisphere Lateralisation】\n` +
    `  Lesion hemisphere: ${sideEn} (Confidence: ${confEn}, Score: ${confidenceScore}/100)\n` +
    `  Left hemisphere score: ${leftScore} | Right hemisphere score: ${rightScore}\n` +
    (conflicting ? `  ⚠ Conflicting evidence detected — bilateral or multifocal lesion possible.\n` : '') +
    `\n  Evidence:\n${voteSummaryEn}`;

  const summaryKo =
    `【대뇌 반구 편측화】\n` +
    `  추정 병변 반구: ${sideKo} (신뢰도: ${confKo}, 점수: ${confidenceScore}/100)\n` +
    `  좌측 반구 점수: ${leftScore} | 우측 반구 점수: ${rightScore}\n` +
    (conflicting ? `  ⚠ 상충되는 근거 감지 — 양측성 또는 다발성 병변 가능.\n` : '') +
    `\n  근거:\n${voteSummaryKo}`;

  // ── 8. Caveats ────────────────────────────────────────────────────────────
  let caveat: string | undefined;
  let caveatKo: string | undefined;

  if (votes.length === 0) {
    caveat = 'No lateralising signs were identified. Cerebral hemisphere cannot be determined from available data.';
    caveatKo = '편측화 징후가 확인되지 않았습니다. 가용 데이터로는 대뇌 반구를 결정할 수 없습니다.';
  } else if (conflicting) {
    caveat = 'Conflicting lateralising signs detected. Consider bilateral cortical disease (e.g., GME, storage disease, bilateral infarcts) or multifocal lesions. Diffuse diseases (e.g., encephalitis, metabolic) may also produce apparent bilateral deficits.';
    caveatKo = '상충되는 편측화 징후가 감지되었습니다. 양측 피질 질환(예: GME, 저장 질환, 양측 경색) 또는 다발성 병변을 고려하십시오. 미만성 질환(뇌염, 대사성)도 외관상 양측 결손을 나타낼 수 있습니다.';
  } else if (confidence === 'low') {
    caveat = 'Limited lateralising evidence. Additional examination findings are needed to improve lateralisation confidence.';
    caveatKo = '편측화 근거가 제한적입니다. 편측화 신뢰도를 높이기 위해 추가 검사 소견이 필요합니다.';
  } else if (votes.some(v => v.sourceSign.startsWith('menace_absent') && v.weight === 1)) {
    caveat = 'Note: Menace vote weight was reduced because direct PLR was also absent — CN II lesion cannot be excluded without ophthalmological examination.';
    caveatKo = '참고: 직접 PLR도 소실되어 위협 반응 가중치가 감소하였습니다. 안과 검사 없이는 CN II 병변을 배제할 수 없습니다.';
  }

  return {
    hemisphere,
    confidence,
    confidenceScore,
    leftScore,
    rightScore,
    votes,
    conflicting,
    summary,
    summaryKo,
    caveat,
    caveatKo,
  };
}

// ─────────────────────────────────────────────
// SECTION 29C: INTEGRATION WITH MAIN ENGINE
// ─────────────────────────────────────────────

/**
 * Extended localisation engine output — adds cerebral lateralisation.
 * Drop-in replacement for runLocalisationEngine() when forebrain is suspected.
 */
export function runFullLocalisationEngine(
  results: Record<string, string | string[]>,
  context: NeuroPatientContext,
  domainSections: NeuroDomainSection[]
): {
  activeSigns: NeurologicalSign[];
  detectedSyndromes: SyndromeRule[];
  localisationCandidates: LocalisationResult[];
  breedFlags: BreedRiskFlag[];
  onsetModifiers: OnsetLocationModifier[];
  cerebralLateralisation: CerebralLateralisationResult | null;
} {
  // Run base engine
  const base = runLocalisationEngine(results, context, domainSections);

  // Only run cerebral lateralisation if forebrain is among top candidates
  const forebrainLocations: NeuroLocation[] = [
    'cerebral_cortex', 'thalamus_hypothalamus', 'basal_ganglia',
  ];
  const forebrainSuspected = base.localisationCandidates
    .slice(0, 4)
    .some(c => forebrainLocations.includes(c.location));

  const activeSignsSet = collectSigns(results, domainSections);

  const cerebralLateralisation = forebrainSuspected
    ? assessCerebralLateralisation(activeSignsSet, results)
    : null;

  return { ...base, cerebralLateralisation };
}

/**
 * Append cerebral lateralisation to chart summary if forebrain suspected.
 */
export function appendLateralisationToChart(
  chartSummary: ReturnType<typeof buildNeuroChartSummary>,
  lateralisation: CerebralLateralisationResult | SpinalLateralisationResult | null,
  lang: 'ko' | 'en' = 'ko'
): string {
  const baseText = chartSummary.summaryText;

  if (!lateralisation || (lateralisation as any).hemisphere === 'undetermined' || (lateralisation as any).side === 'undetermined') {
    return baseText;
  }

  const latText = lang === 'ko' ? lateralisation.summaryKo : lateralisation.summary;
  const caveatText = lateralisation.caveat
    ? (lang === 'ko'
        ? `\n  ※ 주의: ${lateralisation.caveatKo}`
        : `\n  * Note: ${lateralisation.caveat}`)
    : '';

  return baseText + '\n\n' + latText + caveatText;
}

// ─────────────────────────────────────────────
// SECTION 29D: QUICK REFERENCE TABLE
// Clinical cheat-sheet for contralateral rule
// ─────────────────────────────────────────────

export interface LateralisationQuickRef {
  finding: string;
  findingKo: string;
  impliedHemisphere: 'left' | 'right' | 'ipsilateral' | 'contralateral';
  impliedHemisphereKo: string;
  rule: string;
  ruleKo: string;
  weight: 'high' | 'medium' | 'low';
  caveat?: string;
  caveatKo?: string;
}

export const lateralisationQuickRef: LateralisationQuickRef[] = [
  {
    finding: 'Left hemiparesis (thoracic + pelvic)',
    findingKo: '좌측 편측 부전마비 (전지 + 후지)',
    impliedHemisphere: 'right',
    impliedHemisphereKo: '우측 반구',
    rule: 'Contralateral — right motor cortex controls left body',
    ruleKo: '반대측 — 우측 운동피질이 좌측 신체 지배',
    weight: 'high',
  },
  {
    finding: 'Right hemiparesis (thoracic + pelvic)',
    findingKo: '우측 편측 부전마비 (전지 + 후지)',
    impliedHemisphere: 'left',
    impliedHemisphereKo: '좌측 반구',
    rule: 'Contralateral — left motor cortex controls right body',
    ruleKo: '반대측 — 좌측 운동피질이 우측 신체 지배',
    weight: 'high',
  },
  {
    finding: 'Left postural reaction deficits (proprioception, hopping)',
    findingKo: '좌측 자세 반응 결손 (고유감각, 홉핑)',
    impliedHemisphere: 'right',
    impliedHemisphereKo: '우측 반구',
    rule: 'Contralateral — right somatosensory cortex',
    ruleKo: '반대측 — 우측 체성감각피질',
    weight: 'high',
  },
  {
    finding: 'Right postural reaction deficits',
    findingKo: '우측 자세 반응 결손',
    impliedHemisphere: 'left',
    impliedHemisphereKo: '좌측 반구',
    rule: 'Contralateral — left somatosensory cortex',
    ruleKo: '반대측 — 좌측 체성감각피질',
    weight: 'high',
  },
  {
    finding: 'Focal seizure onset on the left side of body',
    findingKo: '좌측 신체 국소 발작 발생',
    impliedHemisphere: 'right',
    impliedHemisphereKo: '우측 반구',
    rule: 'Contralateral — right cortex irritative focus causes left-sided seizures',
    ruleKo: '반대측 — 우측 피질 자극 병소가 좌측 발작 유발',
    weight: 'high',
  },
  {
    finding: 'Focal seizure onset on the right side of body',
    findingKo: '우측 신체 국소 발작 발생',
    impliedHemisphere: 'left',
    impliedHemisphereKo: '좌측 반구',
    rule: 'Contralateral — left cortex irritative focus',
    ruleKo: '반대측 — 좌측 피질 자극 병소',
    weight: 'high',
  },
  {
    finding: 'Compulsive tight circling to the LEFT',
    findingKo: '좌측 강박적 타이트 선회',
    impliedHemisphere: 'left',
    impliedHemisphereKo: '좌측 반구',
    rule: 'Ipsilateral — animal circles toward side of forebrain/thalamus lesion',
    ruleKo: '동측 — 동물은 전뇌/시상 병변 방향으로 선회',
    weight: 'medium',
    caveat: 'Large-radius circling may indicate vestibular (not forebrain)',
    caveatKo: '큰 반경의 선회는 전정계(전뇌 아님)를 시사할 수 있음',
  },
  {
    finding: 'Compulsive tight circling to the RIGHT',
    findingKo: '우측 강박적 타이트 선회',
    impliedHemisphere: 'right',
    impliedHemisphereKo: '우측 반구',
    rule: 'Ipsilateral — animal circles toward side of forebrain/thalamus lesion',
    ruleKo: '동측 — 동물은 전뇌/시상 병변 방향으로 선회',
    weight: 'medium',
    caveat: 'Large-radius circling may indicate vestibular (not forebrain)',
    caveatKo: '큰 반경의 선회는 전정계(전뇌 아님)를 시사할 수 있음',
  },
  {
    finding: 'Absent menace LEFT eye (with intact direct PLR)',
    findingKo: '좌안 위협 반응 소실 (직접 PLR 정상 시)',
    impliedHemisphere: 'right',
    impliedHemisphereKo: '우측 반구 (후두피질)',
    rule: 'Contralateral — right occipital cortex / right optic tract',
    ruleKo: '반대측 — 우측 후두피질 / 우측 시각로',
    weight: 'medium',
    caveat: 'If PLR is also absent → CN II lesion more likely (ipsilateral)',
    caveatKo: 'PLR도 소실된 경우 → CN II 병변 가능성 높음 (동측)',
  },
  {
    finding: 'Absent menace RIGHT eye (with intact direct PLR)',
    findingKo: '우안 위협 반응 소실 (직접 PLR 정상 시)',
    impliedHemisphere: 'left',
    impliedHemisphereKo: '좌측 반구 (후두피질)',
    rule: 'Contralateral — left occipital cortex / left optic tract',
    ruleKo: '반대측 — 좌측 후두피질 / 좌측 시각로',
    weight: 'medium',
    caveat: 'If PLR is also absent → CN II lesion more likely (ipsilateral)',
    caveatKo: 'PLR도 소실된 경우 → CN II 병변 가능성 높음 (동측)',
  },
  {
    finding: 'Left hemiwalking deficit',
    findingKo: '좌측 편측보행 결손',
    impliedHemisphere: 'right',
    impliedHemisphereKo: '우측 반구',
    rule: 'Contralateral — or right C1–C5 (must exclude spinal)',
    ruleKo: '반대측 — 또는 우측 C1-C5 (척수 병변 배제 필요)',
    weight: 'high',
  },
  {
    finding: 'Right hemiwalking deficit',
    findingKo: '우측 편측보행 결손',
    impliedHemisphere: 'left',
    impliedHemisphereKo: '좌측 반구',
    rule: 'Contralateral — or left C1–C5 (must exclude spinal)',
    ruleKo: '반대측 — 또는 좌측 C1-C5 (척수 병변 배제 필요)',
    weight: 'high',
  },
  {
    finding: 'Bilateral deficits — asymmetric but both sides involved',
    findingKo: '양측 결손 — 비대칭이나 양측 모두 이환',
    impliedHemisphere: 'contralateral',
    impliedHemisphereKo: '양측 또는 미결정',
    rule: 'Consider bilateral disease (GME, storage disease, encephalitis) or multifocal',
    ruleKo: '양측 질환(GME, 저장 질환, 뇌염) 또는 다발성 병변 고려',
    weight: 'low',
  },
];


// ============================================================
// SECTION 30: SPINAL CORD LATERALISATION ENGINE
// 척수 좌우 편측화 추론 엔진
//
// Spinal cord lateralisation principles:
//
// 1. IPSILATERAL rule (same side as lesion):
//    - Motor deficits (UMN/LMN) — corticospinal tract is ipsilateral in spinal cord
//    - Proprioception deficits (dorsal columns — ipsilateral)
//    - Muscle atrophy (LMN — ipsilateral)
//    - Cutaneous trunci absent — ipsilateral hemicord
//
// 2. CONTRALATERAL rule (opposite side to lesion):
//    - Superficial pain/temperature (spinothalamic — crosses 1-2 segments after entry)
//    - NOTE: In dogs/cats the spinothalamic decussation is incomplete — contralateral
//      pain loss is less reliable than in primates
//
// 3. Brown-Séquard syndrome (hemicord lesion):
//    IPSILATERAL: UMN/LMN motor loss + proprioception loss + deep pain loss
//    CONTRALATERAL: superficial pain/temperature loss (variable in small animals)
//
// Key asymmetry indicators:
//    - Worse motor deficit on one side
//    - Worse proprioception on one side
//    - Worse reflex changes on one side
//    - Cutaneous trunci absent unilaterally
//    - Muscle atrophy unilateral
// ============================================================

export type SpinalSide = 'left' | 'right' | 'bilateral_symmetric' | 'bilateral_asymmetric' | 'undetermined';

export interface SpinalLateralisationVote {
  side: 'left' | 'right';
  weight: 3 | 2 | 1;
  sourceTestID: string;
  sourceValue: string;
  reasoning: string;
  reasoningKo: string;
  rule: 'ipsilateral' | 'contralateral';
  // Spinal cord tract implicated
  tract: 'corticospinal' | 'dorsal_column' | 'spinothalamic' | 'LMN' | 'cutaneous_trunci' | 'combined';
}

export interface SpinalLateralisationResult {
  side: SpinalSide;
  confidence: 'high' | 'medium' | 'low' | 'undetermined';
  confidenceScore: number;
  leftScore: number;
  rightScore: number;
  votes: SpinalLateralisationVote[];
  conflicting: boolean;
  // Is Brown-Séquard pattern present?
  brownSequardSuspected: boolean;
  brownSequardSide?: 'left' | 'right';
  summary: string;
  summaryKo: string;
  caveat?: string;
  caveatKo?: string;
}

// ─────────────────────────────────────────────
// SECTION 30A: SPINAL LATERALISATION VOTE RULES
// ─────────────────────────────────────────────

// Maps testID + value → side vote with weight
// All spinal cord deficits are IPSILATERAL to lesion side
// (unlike cerebral which is contralateral for motor)

export interface SpinalVoteMapping {
  testID: string;
  valueToSide: Array<{
    values: string[];          // test values that trigger this vote
    side: 'left' | 'right';
    weight: 3 | 2 | 1;
    tract: SpinalLateralisationVote['tract'];
    reasoning: string;
    reasoningKo: string;
  }>;
}

export const spinalVoteMappings: SpinalVoteMapping[] = [

  // ── Motor — gait overall ─────────────────────────────────
  {
    testID: 'hemiparesis_side',
    valueToSide: [
      {
        values: ['left'],
        side: 'left',
        weight: 3,
        tract: 'corticospinal',
        reasoning: 'Left hemiparesis: ipsilateral spinal cord motor tract (corticospinal) — lesion on LEFT side of cord',
        reasoningKo: '좌측 편측 부전마비: 동측 척수 운동로(피질척수로) — 척수 좌측 병변',
      },
      {
        values: ['right'],
        side: 'right',
        weight: 3,
        tract: 'corticospinal',
        reasoning: 'Right hemiparesis: ipsilateral spinal cord lesion on RIGHT side',
        reasoningKo: '우측 편측 부전마비: 척수 우측 병변',
      },
    ],
  },

  // ── Proprioception — pelvic ──────────────────────────────
  {
    testID: 'postural_proprioception',
    valueToSide: [
      {
        values: ['deficit_pelvic_left'],
        side: 'left',
        weight: 3,
        tract: 'dorsal_column',
        reasoning: 'Left pelvic proprioception deficit: dorsal column ipsilateral — LEFT cord lesion',
        reasoningKo: '좌측 후지 고유감각 결손: 동측 후주 — 척수 좌측 병변',
      },
      {
        values: ['deficit_pelvic_right'],
        side: 'right',
        weight: 3,
        tract: 'dorsal_column',
        reasoning: 'Right pelvic proprioception deficit: dorsal column ipsilateral — RIGHT cord lesion',
        reasoningKo: '우측 후지 고유감각 결손: 동측 후주 — 척수 우측 병변',
      },
      {
        values: ['deficit_thoracic_left'],
        side: 'left',
        weight: 3,
        tract: 'dorsal_column',
        reasoning: 'Left thoracic proprioception deficit: dorsal column ipsilateral — LEFT cord lesion',
        reasoningKo: '좌측 전지 고유감각 결손: 동측 후주 — 척수 좌측 병변',
      },
      {
        values: ['deficit_thoracic_right'],
        side: 'right',
        weight: 3,
        tract: 'dorsal_column',
        reasoning: 'Right thoracic proprioception deficit: dorsal column ipsilateral — RIGHT cord lesion',
        reasoningKo: '우측 전지 고유감각 결손: 동측 후주 — 척수 우측 병변',
      },
    ],
  },

  // ── Hopping ──────────────────────────────────────────────
  {
    testID: 'postural_hopping',
    valueToSide: [
      {
        values: ['deficit_left_pelvic', 'deficit_left_thoracic'],
        side: 'left',
        weight: 2,
        tract: 'corticospinal',
        reasoning: 'Left hopping deficit: ipsilateral cord motor/proprioceptive tract — LEFT lesion',
        reasoningKo: '좌측 홉핑 결손: 동측 척수 운동/고유감각로 — 좌측 병변',
      },
      {
        values: ['deficit_right_pelvic', 'deficit_right_thoracic'],
        side: 'right',
        weight: 2,
        tract: 'corticospinal',
        reasoning: 'Right hopping deficit: ipsilateral cord motor/proprioceptive tract — RIGHT lesion',
        reasoningKo: '우측 홉핑 결손: 동측 척수 운동/고유감각로 — 우측 병변',
      },
    ],
  },

  // ── Cutaneous trunci — hemicord sign ─────────────────────
  {
    testID: 'reflex_cutaneous_trunci',
    valueToSide: [
      {
        values: ['absent_left_at_level'],
        side: 'left',
        weight: 3,
        tract: 'cutaneous_trunci',
        reasoning: 'Cutaneous trunci absent LEFT: ipsilateral hemicord lesion — Brown-Séquard LEFT side strongly suspected',
        reasoningKo: '피부근 반사 좌측 소실: 동측 반척수 병변 — 좌측 Brown-Séquard 강력 의심',
      },
      {
        values: ['absent_right_at_level'],
        side: 'right',
        weight: 3,
        tract: 'cutaneous_trunci',
        reasoning: 'Cutaneous trunci absent RIGHT: ipsilateral hemicord lesion — Brown-Séquard RIGHT side strongly suspected',
        reasoningKo: '피부근 반사 우측 소실: 동측 반척수 병변 — 우측 Brown-Séquard 강력 의심',
      },
    ],
  },

  // ── Muscle atrophy — LMN ipsilateral ─────────────────────
  // Asymmetric atrophy: assessed from lateralityCapture on reflex_muscle_atrophy_pattern
  // We handle this via the dedicated asymmetry test below

  // ── Patellar reflex — asymmetric ─────────────────────────
  // Captured via grade; asymmetry captured by left vs right entry
  // If grade 0 on left + grade 2-3 on right → left LMN or right UMN
  // This is assessed via reflex_patellar_asymmetry below

  // ── Muscle atrophy pattern — LMN ipsilateral ────────────────
  // Note: full lateralisation from muscle atrophy requires knowing WHICH side is atrophied.
  // This is captured via the lateralityCapture field on the test and the asymmetry tests.
  // The vote below is a placeholder structure; actual side determined by examiner laterality entry.

  // ── Horner's — ipsilateral cord T1-T3 ────────────────────
  {
    testID: 'autonomic_horners',
    valueToSide: [
      {
        values: ['present_left'],
        side: 'left',
        weight: 2,
        tract: 'combined',
        reasoning: "Left Horner's: ipsilateral sympathetic tract (T1–T3 lateral horn) — LEFT cord or brachial plexus lesion",
        reasoningKo: '좌측 호르너: 동측 교감신경로(T1-T3 측각) — 좌측 척수 또는 상완신경총 병변',
      },
      {
        values: ['present_right'],
        side: 'right',
        weight: 2,
        tract: 'combined',
        reasoning: "Right Horner's: ipsilateral sympathetic tract — RIGHT cord lesion",
        reasoningKo: '우측 호르너: 동측 교감신경로 — 우측 척수 병변',
      },
    ],
  },
];

// ─────────────────────────────────────────────
// SECTION 30B: ASYMMETRY CAPTURE TESTS
// Added to postural reaction domain for left/right reflex comparison
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// SECTION 30C: SPINAL LATERALISATION ENGINE FUNCTION
// ─────────────────────────────────────────────

export function assessSpinalLateralisation(
  results: Record<string, string | string[]>
): SpinalLateralisationResult {

  const votes: SpinalLateralisationVote[] = [];

  // ── 1. Apply vote mappings ────────────────────────────────
  for (const mapping of spinalVoteMappings) {
    const val = results[mapping.testID];
    if (!val) continue;
    const vals = Array.isArray(val) ? val : [val];

    for (const entry of mapping.valueToSide) {
      if (vals.some(v => entry.values.includes(v))) {
        votes.push({
          side: entry.side,
          weight: entry.weight,
          sourceTestID: mapping.testID,
          sourceValue: vals.join(','),
          reasoning: entry.reasoning,
          reasoningKo: entry.reasoningKo,
          rule: 'ipsilateral',
          tract: entry.tract,
        });
      }
    }
  }

  // ── 2. Asymmetry tests ────────────────────────────────────
  const patellarAsym = results['reflex_patellar_asymmetry'] as string | undefined;
  if (patellarAsym) {
    const leftWorse = ['left_reduced_right_normal', 'left_absent_right_exaggerated'];
    const rightWorse = ['right_reduced_left_normal', 'right_absent_left_exaggerated'];
    if (leftWorse.includes(patellarAsym)) {
      votes.push({ side: 'left', weight: 3, sourceTestID: 'reflex_patellar_asymmetry',
        sourceValue: patellarAsym, rule: 'ipsilateral', tract: 'LMN',
        reasoning: 'Patellar reflex asymmetry (left worse): left LMN/hemicord ipsilateral',
        reasoningKo: '슬개골 반사 비대칭(좌측 불량): 좌측 LMN/반척수 동측 병변' });
    } else if (rightWorse.includes(patellarAsym)) {
      votes.push({ side: 'right', weight: 3, sourceTestID: 'reflex_patellar_asymmetry',
        sourceValue: patellarAsym, rule: 'ipsilateral', tract: 'LMN',
        reasoning: 'Patellar reflex asymmetry (right worse): right LMN/hemicord ipsilateral',
        reasoningKo: '슬개골 반사 비대칭(우측 불량): 우측 LMN/반척수 동측 병변' });
    }
  }

  const withdrawalAsym = results['reflex_withdrawal_asymmetry'] as string | undefined;
  if (withdrawalAsym === 'left_worse') {
    votes.push({ side: 'left', weight: 2, sourceTestID: 'reflex_withdrawal_asymmetry',
      sourceValue: 'left_worse', rule: 'ipsilateral', tract: 'LMN',
      reasoning: 'Left withdrawal worse: left hemicord or LMN ipsilateral',
      reasoningKo: '좌측 굴곡 반사 불량: 좌측 반척수 또는 LMN 동측' });
  } else if (withdrawalAsym === 'right_worse') {
    votes.push({ side: 'right', weight: 2, sourceTestID: 'reflex_withdrawal_asymmetry',
      sourceValue: 'right_worse', rule: 'ipsilateral', tract: 'LMN',
      reasoning: 'Right withdrawal worse: right hemicord or LMN ipsilateral',
      reasoningKo: '우측 굴곡 반사 불량: 우측 반척수 또는 LMN 동측' });
  }

  // ── 3. Tally ──────────────────────────────────────────────
  let leftScore = 0;
  let rightScore = 0;
  for (const v of votes) {
    if (v.side === 'left')  leftScore  += v.weight;
    if (v.side === 'right') rightScore += v.weight;
  }

  const totalScore = leftScore + rightScore;
  const conflicting = leftScore > 0 && rightScore > 0;

  // ── 4. Brown-Séquard detection ────────────────────────────
  // Classic: cutaneous trunci absent unilaterally OR patellar absent one side + exaggerated other
  const brownSeqSigns = votes.filter(v =>
    v.tract === 'cutaneous_trunci' ||
    (v.sourceTestID === 'reflex_patellar_asymmetry' &&
     (v.sourceValue.includes('absent') && v.sourceValue.includes('exaggerated')))
  );
  const brownSequardSuspected = brownSeqSigns.length > 0;
  const brownSequardSide = brownSequardSuspected
    ? (brownSeqSigns[0].side as 'left' | 'right')
    : undefined;

  // ── 5. Side + confidence ──────────────────────────────────
  let side: SpinalSide = 'undetermined';
  let confidenceScore = 0;
  let confidence: SpinalLateralisationResult['confidence'] = 'undetermined';

  if (totalScore === 0) {
    side = 'undetermined';
  } else if (leftScore === rightScore) {
    side = 'bilateral_symmetric';
    confidence = 'low';
    confidenceScore = 20;
  } else {
    const dominant = leftScore > rightScore ? 'left' : 'right';
    const dominantScore = Math.max(leftScore, rightScore);
    const ratio = dominantScore / totalScore;

    // Asymmetric bilateral — if conflicting but one side clearly dominates
    if (conflicting && ratio < 0.75) {
      side = 'bilateral_asymmetric';
      confidence = 'low';
      confidenceScore = Math.round(ratio * 50);
    } else {
      side = dominant;
      confidenceScore = Math.min(95, Math.round(ratio * 100));
      confidence = confidenceScore >= 75 ? 'high'
                 : confidenceScore >= 55 ? 'medium'
                 : 'low';
    }

    // Require at least 2 independent votes for medium+
    const independentVotes = votes.filter(v => v.side === dominant).length;
    if (independentVotes < 2 && confidence === 'high') confidence = 'medium';
  }

  // ── 6. Summary text ───────────────────────────────────────
  const sideEn = side === 'left' ? 'LEFT' : side === 'right' ? 'RIGHT'
    : side === 'bilateral_symmetric' ? 'BILATERAL (symmetric)'
    : side === 'bilateral_asymmetric' ? 'BILATERAL (asymmetric — see votes)'
    : 'UNDETERMINED';
  const sideKo = side === 'left' ? '좌측' : side === 'right' ? '우측'
    : side === 'bilateral_symmetric' ? '양측 (대칭)'
    : side === 'bilateral_asymmetric' ? '양측 (비대칭 — 세부 근거 참조)'
    : '미결정';

  const confKo = confidence === 'high' ? '높음' : confidence === 'medium' ? '중간'
    : confidence === 'low' ? '낮음' : '미결정';

  const tractSummaryEn = votes.length > 0
    ? votes.map(v =>
        `  • [${v.tract.toUpperCase()} → ${v.side.toUpperCase()} side, wt:${v.weight}] ${v.reasoning}`
      ).join('\n')
    : '  • No lateralising spinal signs detected.';
  const tractSummaryKo = votes.length > 0
    ? votes.map(v =>
        `  • [${v.tract} → ${v.side === 'left' ? '좌측' : '우측'}, 가중치:${v.weight}] ${v.reasoningKo}`
      ).join('\n')
    : '  • 척수 편측화 징후 감지되지 않음.';

  const brownEn = brownSequardSuspected
    ? `\n  ⚠ Brown-Séquard (hemicord) syndrome suspected — ${brownSequardSide?.toUpperCase()} side`
    : '';
  const brownKo = brownSequardSuspected
    ? `\n  ⚠ Brown-Séquard (반척수) 증후군 의심 — ${brownSequardSide === 'left' ? '좌측' : '우측'}`
    : '';

  const summary =
    `【Spinal Cord Lateralisation】\n` +
    `  Lesion side: ${sideEn} (Confidence: ${confidence}, Score: ${confidenceScore}/100)\n` +
    `  Left score: ${leftScore} | Right score: ${rightScore}${brownEn}\n` +
    (conflicting && side !== 'bilateral_symmetric' && side !== 'bilateral_asymmetric'
      ? `  ⚠ Some conflicting evidence — bilateral or multifocal cord lesion possible.\n` : '') +
    `\n  Evidence:\n${tractSummaryEn}`;

  const summaryKo =
    `【척수 좌우 편측화】\n` +
    `  추정 병변 측: ${sideKo} (신뢰도: ${confKo}, 점수: ${confidenceScore}/100)\n` +
    `  좌측 점수: ${leftScore} | 우측 점수: ${rightScore}${brownKo}\n` +
    (conflicting && side !== 'bilateral_symmetric' && side !== 'bilateral_asymmetric'
      ? `  ⚠ 일부 상충 근거 — 양측 또는 다발성 척수 병변 가능.\n` : '') +
    `\n  근거:\n${tractSummaryKo}`;

  // ── 7. Caveat ─────────────────────────────────────────────
  let caveat: string | undefined;
  let caveatKo: string | undefined;

  if (votes.length === 0) {
    caveat = 'No asymmetric spinal signs detected. Cord lateralisation cannot be determined — lesion may be central/bilateral, or asymmetric findings were not recorded.';
    caveatKo = '비대칭 척수 징후 감지되지 않음. 척수 편측화를 결정할 수 없습니다. 병변이 중심성/양측성이거나, 비대칭 소견이 기록되지 않았을 수 있습니다.';
  } else if (brownSequardSuspected) {
    caveat = 'Brown-Séquard (hemicord) pattern detected. Classic presentation: ipsilateral UMN/LMN motor loss + ipsilateral proprioception loss + contralateral pain/temperature loss (variable in small animals). MRI recommended to confirm lateralised intramedullary or extramedullary compressive lesion.';
    caveatKo = 'Brown-Séquard(반척수) 패턴 감지. 전형 소견: 동측 UMN/LMN 운동 소실 + 동측 고유감각 소실 + 반대측 통각/온각 소실(소동물에서 가변적). 척수 내 또는 외 압박성 병변 확인을 위해 MRI 권장.';
  } else if (side === 'bilateral_asymmetric') {
    caveat = 'Bilateral asymmetric signs present. Consider lateralised but incomplete cord lesion, or separate left and right lesions (multifocal disease). MRI with axial cuts through lesion site recommended.';
    caveatKo = '양측 비대칭 징후 존재. 편측화되었지만 불완전한 척수 병변, 또는 별개의 좌우 병변(다발성 질환)을 고려하십시오. 병변 부위를 통과하는 축상면 MRI 권장.';
  } else if (confidence === 'low') {
    caveat = 'Limited lateralising evidence. Assess patellar reflex asymmetry, withdrawal asymmetry, cutaneous trunci, and muscle atrophy pattern more carefully to improve confidence.';
    caveatKo = '편측화 근거가 제한적입니다. 슬개골 반사 비대칭, 굴곡 반사 비대칭, 피부근 반사 및 근위축 패턴을 더 세밀히 평가하여 신뢰도를 높이십시오.';
  }

  return {
    side, confidence, confidenceScore,
    leftScore, rightScore, votes, conflicting,
    brownSequardSuspected, brownSequardSide,
    summary, summaryKo, caveat, caveatKo,
  };
}

// ─────────────────────────────────────────────
// SECTION 30D: INTEGRATED FULL ENGINE (spinal + cerebral)
// ─────────────────────────────────────────────

/**
 * Master engine: runs localisation + cerebral lateralisation + spinal lateralisation.
 * Automatically selects which lateralisation engine to run based on top candidates.
 */
export function runCompleteLocalisationEngine(
  results: Record<string, string | string[]>,
  context: NeuroPatientContext,
  domainSections: NeuroDomainSection[]
): {
  activeSigns: NeurologicalSign[];
  detectedSyndromes: SyndromeRule[];
  localisationCandidates: LocalisationResult[];
  breedFlags: BreedRiskFlag[];
  onsetModifiers: OnsetLocationModifier[];
  cerebralLateralisation: CerebralLateralisationResult | null;
  spinalLateralisation: SpinalLateralisationResult | null;
} {
  const base = runLocalisationEngine(results, context, domainSections);
  const activeSignsSet = collectSigns(results, domainSections);

  const forebrainLocations: NeuroLocation[] = [
    'cerebral_cortex', 'thalamus_hypothalamus', 'basal_ganglia',
  ];
  const spinalLocations: NeuroLocation[] = [
    'C1_C5', 'C6_T2', 'T3_L3', 'L4_S3', 'sacrocaudal',
  ];

  const top4 = base.localisationCandidates.slice(0, 4).map(c => c.location);

  const forebrainSuspected = top4.some(l => forebrainLocations.includes(l));
  const spinalSuspected    = top4.some(l => spinalLocations.includes(l));

  const cerebralLateralisation = forebrainSuspected
    ? assessCerebralLateralisation(activeSignsSet, results)
    : null;

  const spinalLateralisation = spinalSuspected
    ? assessSpinalLateralisation(results)
    : null;

  return { ...base, cerebralLateralisation, spinalLateralisation };
}

// ─────────────────────────────────────────────
// SECTION 30E: SPINAL LOCALISATION QUICK REFERENCE
// ─────────────────────────────────────────────

export interface SpinalLocQuickRef {
  segment: string;
  segmentKo: string;
  thoracicLimbs: string;
  thoracicLimbsKo: string;
  pelvicLimbs: string;
  pelvicLimbsKo: string;
  reflexChanges: string;
  reflexChangesKo: string;
  painLocation: string;
  painLocationKo: string;
  keyFeature: string;
  keyFeatureKo: string;
  bladder: string;
  bladderKo: string;
  schiffSherrington: boolean;
}

export const spinalLocQuickRef: SpinalLocQuickRef[] = [
  {
    segment: 'C1–C5',
    segmentKo: 'C1-C5',
    thoracicLimbs: 'UMN (spastic, hyperreflexic)',
    thoracicLimbsKo: 'UMN (경직, 반사 항진)',
    pelvicLimbs: 'UMN (spastic, hyperreflexic)',
    pelvicLimbsKo: 'UMN (경직, 반사 항진)',
    reflexChanges: 'Biceps ↑, Triceps ↑, Patellar ↑, Withdrawal ↑ all limbs',
    reflexChangesKo: '이두근 ↑, 삼두근 ↑, 슬개골 ↑, 굴곡 ↑ 모든 사지',
    painLocation: 'Cervical (neck pain, low head carriage)',
    painLocationKo: '경추 (목 통증, 두부 하강)',
    keyFeature: 'Tetraparesis/plegia. Hemiparesis if lateralised. No Schiff-Sherrington.',
    keyFeatureKo: '사지 부전마비/완전마비. 편측화 시 편측 부전마비. Schiff-Sherrington 없음.',
    bladder: 'UMN (retention, firm large bladder)',
    bladderKo: 'UMN (요 저류, 크고 단단한 방광)',
    schiffSherrington: false,
  },
  {
    segment: 'C6–T2',
    segmentKo: 'C6-T2',
    thoracicLimbs: 'LMN (flaccid, hyporeflexic, rapid atrophy)',
    thoracicLimbsKo: 'LMN (이완, 반사 감소, 빠른 위축)',
    pelvicLimbs: 'UMN (spastic, hyperreflexic)',
    pelvicLimbsKo: 'UMN (경직, 반사 항진)',
    reflexChanges: 'Biceps ↓/absent, Triceps ↓/absent (thoracic); Patellar ↑, Withdrawal ↑ (pelvic)',
    reflexChangesKo: '이두근 ↓/소실, 삼두근 ↓/소실(전지); 슬개골 ↑, 굴곡 ↑(후지)',
    painLocation: 'Cervicothoracic junction',
    painLocationKo: '경흉추 접합부',
    keyFeature: 'LMN thoracic + UMN pelvic = PATHOGNOMONIC for C6–T2. ± Horner\'s ipsilateral.',
    keyFeatureKo: 'LMN 전지 + UMN 후지 = C6-T2의 특징적 소견. ± 동측 호르너.',
    bladder: 'UMN (retention)',
    bladderKo: 'UMN (요 저류)',
    schiffSherrington: false,
  },
  {
    segment: 'T3–L3',
    segmentKo: 'T3-L3',
    thoracicLimbs: 'Normal (unaffected)',
    thoracicLimbsKo: '정상 (영향 없음)',
    pelvicLimbs: 'UMN (spastic, hyperreflexic)',
    pelvicLimbsKo: 'UMN (경직, 반사 항진)',
    reflexChanges: 'Thoracic normal; Patellar ↑, Withdrawal ↑, Babinski +, Crossed extensor +',
    reflexChangesKo: '전지 정상; 슬개골 ↑, 굴곡 ↑, 바빈스키 +, 교차 신전 +',
    painLocation: 'Thoracolumbar (epaxial spasm, kyphosis)',
    painLocationKo: '흉요추 (배축근 경련, 척추후만)',
    keyFeature: 'Most common IVDD site. Cutaneous trunci loss localises level. Schiff-Sherrington with acute lesion.',
    keyFeatureKo: 'IVDD 가장 흔한 위치. 피부근 반사 소실로 분절 확인. 급성 병변 시 Schiff-Sherrington.',
    bladder: 'UMN (retention, cannot express easily)',
    bladderKo: 'UMN (요 저류, 도뇨 어려움)',
    schiffSherrington: true,
  },
  {
    segment: 'L4–S3',
    segmentKo: 'L4-S3',
    thoracicLimbs: 'Normal',
    thoracicLimbsKo: '정상',
    pelvicLimbs: 'LMN (flaccid, hyporeflexic, atrophy)',
    pelvicLimbsKo: 'LMN (이완, 반사 감소, 위축)',
    reflexChanges: 'Patellar ↓/absent (L4-L6), Withdrawal ↓/absent (L6-S1), Perineal absent (S1-S3)',
    reflexChangesKo: '슬개골 ↓/소실(L4-L6), 굴곡 ↓/소실(L6-S1), 회음 반사 소실(S1-S3)',
    painLocation: 'Lumbosacral (L7-S1 most common — cauda equina)',
    painLocationKo: '요천추 (L7-S1 가장 흔함 — 마미 증후군)',
    keyFeature: 'LMN pelvic only. Muscle atrophy pattern identifies sub-level. No Babinski.',
    keyFeatureKo: 'LMN 후지만. 근위축 패턴으로 세부 분절 확인. 바빈스키 없음.',
    bladder: 'LMN (incontinence — large flaccid bladder, easy to express, urine dribbling)',
    bladderKo: 'LMN (요실금 — 크고 이완된 방광, 쉽게 도뇨, 요 흘림)',
    schiffSherrington: false,
  },
  {
    segment: 'Sacrocaudal (S1–Cd)',
    segmentKo: '천미 (S1-Cd)',
    thoracicLimbs: 'Normal',
    thoracicLimbsKo: '정상',
    pelvicLimbs: 'Normal or mild weakness',
    pelvicLimbsKo: '정상 또는 경미한 약화',
    reflexChanges: 'Perineal absent, Tail tone absent, Anal reflex absent',
    reflexChangesKo: '회음 반사 소실, 꼬리 긴장도 소실, 항문 반사 소실',
    painLocation: 'Sacrocaudal (tail base, perineum)',
    painLocationKo: '천미 (꼬리 기저부, 회음)',
    keyFeature: 'Tail paralysis + faecal/urinary incontinence + perineal anaesthesia. Patellar NORMAL.',
    keyFeatureKo: '꼬리 마비 + 변실금/요실금 + 회음 무감각. 슬개골 반사 정상.',
    bladder: 'LMN (incontinence, atonic bladder)',
    bladderKo: 'LMN (요실금, 긴장 소실 방광)',
    schiffSherrington: false,
  },

];

export const neuroReference: NeuroReference = {
  version: '1.1.0',
  lastUpdated: '2025-05-10',
  // Reference data
  domainSections: neuroDomainSections,
  syndromeRules,
  localisationRules,
  breedRiskFlags,
  onsetLocationModifiers,
  speciesModifiers,
  spinalLocQuickRef,
  lateralisationQuickRef,
  spinalVoteMappings,
  lateralisationVoteRules,
  cranialNerveSummary,
  // Core engine
  runLocalisationEngine,
  buildNeuroChartSummary,
  isDomainVisible,
  isNeuroTestVisible,
  collectSigns,
  detectSyndromes,
  // Lateralisation engines
  assessCerebralLateralisation,
  assessSpinalLateralisation,
  runFullLocalisationEngine,
  runCompleteLocalisationEngine,
  appendLateralisationToChart,
};

export default neuroReference;

