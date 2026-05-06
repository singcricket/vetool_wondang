// ============================================================
// ultrasound_ref.ts
// Veterinary Abdominal Ultrasound Reference Data
// 수의 복부 초음파 표준화 참조 데이터
// ============================================================

// ─────────────────────────────────────────────
// SECTION 1: TYPE DEFINITIONS
// ─────────────────────────────────────────────

export type Species = 'dog' | 'cat' | 'both';
export type TestType = 'select' | 'multiselect' | 'range' | 'boolean' | 'score';
export type ClinicalSignificance = 'high' | 'medium' | 'low';
export type Organ =
  | 'liver'
  | 'gallbladder'
  | 'spleen'
  | 'kidney'
  | 'left_kidney'
  | 'right_kidney'
  | 'urinary_bladder'
  | 'pancreas'
  | 'gi_tract'
  | 'adrenal'
  | 'left_adrenal'
  | 'right_adrenal'
  | 'lymph_node'
  | 'free_fluid'
  | 'reproductive';

export type PartOfOrgan =
  | 'diffuse'
  | 'focal'
  | 'right_lobe'
  | 'left_lobe'
  | 'medial_lobe'
  | 'right_kidney'
  | 'left_kidney'
  | 'cortex'
  | 'medulla'
  | 'pelvis'
  | 'neck'
  | 'body'
  | 'tail'
  | 'fundus'
  | 'wall'
  | 'lumen'
  | 'solitary'
  | 'multiple'
  | 'bilateral'
  | 'right'
  | 'left'
  | 'cranial'
  | 'caudal'
  | 'parenchyma'
  | 'general';

// ─── Select Option ───
export interface SelectOption {
  value: string;
  label: string;                  // 화면 표시용 (영문 전문용어)
  labelKo: string;                // 한국어 레이블
  resultText: string;             // 차트 출력 문구 (영문 - 수의사용)
  resultTextKo: string;           // 차트 출력 문구 (한국어 - 수의사용)
  ownerResultTextKo?: string;     // 보호자용 순화된 설명 (한국어)
  isAbnormal: boolean;            // 정상 여부
  severity?: 'mild' | 'moderate' | 'severe'; // 이상 소견의 중등도
}

// ─── Range Segment ───
export interface RangeSegment {
  min: number | null;
  max: number | null;             // null = 상한 없음
  resultText: string;
  resultTextKo: string;
  ownerResultTextKo?: string;     // 보호자용 순화된 설명 (한국어)
  isAbnormal: boolean;
  severity?: 'mild' | 'moderate' | 'severe';
}

// ─── Normal Reference Range by species ───
export interface NormalRange {
  dog?: { min?: number; max?: number };
  cat?: { min?: number; max?: number };
}

// ─────────────────────────────────────────────
// DEPENDENCY SYSTEM
// ─────────────────────────────────────────────
//
// UI 렌더링 계층 구조:
//
//   [Level 0] OrganGate      — 장기 이상 여부 (e.g. liver_status: normal | abnormal)
//       │
//   [Level 1] TopLevel       — 장기 기본 검사 항목 (dependsOn 없음, organ_status=abnormal 시 표시)
//       │
//   [Level 2] Conditional    — 특정 항목 선택 후 표시 (dependsOn 있음)
//       │
//   [Level 3] SubConditional — Level 2 항목에 다시 종속된 항목
//
// 예시 흐름:
//   liver_status = 'abnormal'
//     → liver_echogenicity, liver_texture, liver_size, liver_nodule_presence 표시 (Level 1)
//       → liver_nodule_presence = 'present'
//           → liver_nodule_number, liver_nodule_size, liver_nodule_echogenicity 표시 (Level 2)
//
// ─────────────────────────────────────────────

export type DisplayLevel = 0 | 1 | 2 | 3;

/**
 * 이 항목이 표시되기 위한 선행 조건.
 * testID 항목이 triggerValues 중 하나의 값을 가질 때 이 항목이 활성화된다.
 * operator: 'OR' (기본값) = triggerValues 중 하나라도 해당
 *           'AND' = conditions 배열 내 모든 조건이 충족되어야 함 (다중 조건 시 사용)
 */
export interface DependsOn {
  testID: string;                       // 선행 항목의 testID
  triggerValues: string[];              // 이 값들 중 하나가 선택되어야 현재 항목 활성화
  operator?: 'OR' | 'AND';             // 기본값: 'OR'
}

/**
 * 장기 레벨 게이트.
 * 각 OrganSection이 화면에 표시되려면 organ_status가 abnormal이어야 한다.
 * organ_status testID 규칙: `{organ}_status` (e.g. 'liver_status', 'kidney_status')
 */
export interface OrganStatusGate {
  testID: string;                       // e.g. 'liver_status'
  testName: string;
  testNameKo: string;
  normalValue: string;                  // e.g. 'normal' → 하위 항목 숨김
  abnormalValue: string;                // e.g. 'abnormal' → 하위 항목 표시
  options: Array<{
    value: string;
    label: string;
    labelKo: string;
  }>;
}

// ─── Base Test Item ───
interface BaseTestItem {
  testID: string;                       // 고정 키 (DB 컬럼명, 절대 변경 불가)
  testName: string;                     // 영문 검사명
  testNameKo: string;                   // 한국어 검사명
  organ: Organ;
  partOfOrgan: PartOfOrgan | PartOfOrgan[];
  clinicalSignificance: ClinicalSignificance;
  species: Species;
  required: boolean;                    // 기본 검사 여부
  displayLevel: DisplayLevel;           // UI 렌더링 계층 (0=gate, 1=top, 2=conditional, 3=sub)
  dependsOn?: DependsOn | DependsOn[];  // 단일 또는 복수 선행 조건 (없으면 Level 1)
  relatedTests?: string[];              // 임상적 연관성 참조 (종속성과 무관)
  note?: string;                        // 임상 메모
}

// ─── Select Test ───
export interface SelectTestItem extends BaseTestItem {
  testType: 'select';
  options: SelectOption[];
}

// ─── Multi-select Test ───
export interface MultiSelectTestItem extends BaseTestItem {
  testType: 'multiselect';
  options: SelectOption[];
  resultTemplate: string;               // e.g. "다음 소견 관찰: {values}"
  resultTemplateKo: string;
  resultTemplateOwnerKo?: string;       // e.g. "다음 위치의 림프절들이 부어있습니다: {values}"
}

// ─── Range Test ───
export interface RangeTestItem extends BaseTestItem {
  testType: 'range';
  unit: string;
  normalRange: NormalRange;
  ranges: RangeSegment[];
}

// ─── Boolean Test ───
export interface BooleanTestItem extends BaseTestItem {
  testType: 'boolean';
  positiveResultText: string;
  positiveResultTextKo: string;
  positiveOwnerResultTextKo?: string;   // 보호자용 순화된 설명 (긍정 소견 시)
  negativeResultText: string;
  negativeResultTextKo: string;
  negativeOwnerResultTextKo?: string;   // 보호자용 순화된 설명 (부정 소견 시)
  positiveIsAbnormal: boolean;
}

// ─── Score Test (e.g. BCS) ───
export interface ScoreTestItem extends BaseTestItem {
  testType: 'score';
  minScore: number;
  maxScore: number;
  unit?: string;
  ranges: RangeSegment[];
}

export type UltrasoundTestItem =
  | SelectTestItem
  | MultiSelectTestItem
  | RangeTestItem
  | BooleanTestItem
  | ScoreTestItem;

// ─── Impression Rule (복합 조건) ───
export interface ImpressionRule {
  ruleID: string;
  conditions: Partial<Record<string, string | string[]>>;   // testID: value
  impression: string;
  impressionKo: string;
  differentials: string[];      // DDx 목록
  differentialsKo: string[];
  recommendation: string;
  recommendationKo: string;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
}

// ─── Organ Section (장기별 그룹) ───
export interface OrganSection {
  organ: Organ;
  organName: string;
  organNameKo: string;
  scanningOrder: number;         // 검사 순서
  statusGate: OrganStatusGate;  // Level 0: 장기 이상 여부 게이트
  tests: UltrasoundTestItem[];
}

// ─── Full Reference Structure ───
export interface UltrasoundReference {
  version: string;
  lastUpdated: string;
  organs: OrganSection[];
  impressionRules: ImpressionRule[];
}


// ─────────────────────────────────────────────
// SECTION 2: TEST DATA
// ─────────────────────────────────────────────

// ══════════════════════════════════════════════
// 2-1. LIVER 간
// ══════════════════════════════════════════════

const liverTests: UltrasoundTestItem[] = [

  // 에코 음영
  {
    testID: 'liver_echogenicity',
    testName: 'Hepatic Echogenicity',
    testNameKo: '간 에코 음영',
    organ: 'liver',
    partOfOrgan: 'diffuse',
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: true,
    displayLevel: 1,
    relatedTests: ['liver_texture', 'liver_size'],
    options: [
      {
        value: 'normal',
        label: 'Normal (isoechoic to spleen/cortex)',
        labelKo: '정상',
        resultText: 'Hepatic echogenicity within normal limits',
        resultTextKo: '간 에코 음영 정상 범위',
        ownerResultTextKo: '간의 밝기가 정상입니다.',
        isAbnormal: false,
      },
      {
        value: 'mildly_hyperechoic',
        label: 'Mildly hyperechoic',
        labelKo: '경미하게 고에코',
        resultText: 'Mildly increased hepatic echogenicity observed',
        resultTextKo: '간 에코 음영 경미한 증가 소견',
        ownerResultTextKo: '간의 밝기가 조금 밝아져 있습니다. 지방간 등이 의심될 수 있습니다.',
        isAbnormal: true,
        severity: 'mild',
      },
      {
        value: 'markedly_hyperechoic',
        label: 'Markedly hyperechoic',
        labelKo: '현저하게 고에코',
        resultText: 'Markedly increased hepatic echogenicity; fat infiltration or vacuolar hepatopathy suspected',
        resultTextKo: '간 에코 음영 현저한 증가; 지방 침윤 또는 공포성 간증 의심',
        ownerResultTextKo: '간의 밝기가 매우 밝습니다. 심한 지방간이나 간 수치와 관련된 변화가 의심됩니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
      {
        value: 'hypoechoic',
        label: 'Hypoechoic',
        labelKo: '저에코',
        resultText: 'Decreased hepatic echogenicity; congestion, hepatitis, or lymphoma suspected',
        resultTextKo: '간 에코 음영 감소; 울혈성 간, 간염 또는 림프종 의심',
        ownerResultTextKo: '간의 밝기가 어둡게 보입니다. 간의 혈액 순환 장애나 염증 등이 의심될 수 있습니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
      {
        value: 'mixed',
        label: 'Mixed / Heterogeneous',
        labelKo: '혼합/불균질',
        resultText: 'Heterogeneous hepatic echogenicity; multifocal lesions suspected',
        resultTextKo: '간 에코 음영 불균질; 다발성 병변 의심',
        ownerResultTextKo: '간의 밝기가 일정하지 않고 얼룩덜룩하게 보입니다. 여러 군데에 변화가 생긴 상태일 수 있습니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
    ],
  },

  // 실질 텍스처
  {
    testID: 'liver_texture',
    testName: 'Hepatic Parenchymal Texture',
    testNameKo: '간 실질 텍스처',
    organ: 'liver',
    partOfOrgan: 'diffuse',
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: true,
    displayLevel: 1,
    relatedTests: ['liver_echogenicity'],
    options: [
      {
        value: 'fine',
        label: 'Fine and homogeneous',
        labelKo: '미세 균질',
        resultText: 'Hepatic parenchymal texture fine and homogeneous',
        resultTextKo: '간 실질 텍스처 미세 균질',
        ownerResultTextKo: '간 내부 조직이 아주 고르고 깨끗하게 보입니다.',
        isAbnormal: false,
      },
      {
        value: 'coarse',
        label: 'Coarse / Nodular',
        labelKo: '조대/결절성',
        resultText: 'Coarse hepatic parenchymal texture; chronic hepatopathy or cirrhosis suspected',
        resultTextKo: '간 실질 텍스처 조대; 만성 간질환 또는 간경변 의심',
        ownerResultTextKo: '간 조직이 거칠게 보입니다. 만성적인 간 손상이나 간경화 가능성이 있습니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
      {
        value: 'target_pattern',
        label: 'Target pattern (halo sign)',
        labelKo: '표적 패턴 (halo sign)',
        resultText: 'Target pattern lesion(s) identified; neoplasia or abscess suspected',
        resultTextKo: '표적 패턴 병변 관찰; 종양 또는 농양 의심',
        ownerResultTextKo: '과녁 모양의 특수한 병변이 보입니다. 종양이나 농양 같은 덩어리가 의심됩니다.',
        isAbnormal: true,
        severity: 'severe',
      },
    ],
  },

  // 간 크기
  {
    testID: 'liver_size',
    testName: 'Hepatic Size',
    testNameKo: '간 크기',
    organ: 'liver',
    partOfOrgan: 'diffuse',
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: true,
    displayLevel: 1,
    options: [
      {
        value: 'normal',
        label: 'Normal size',
        labelKo: '정상',
        resultText: 'Liver size within normal limits',
        resultTextKo: '간 크기 정상 범위',
        ownerResultTextKo: '간의 크기가 정상 범위 내에 있습니다.',
        isAbnormal: false,
      },
      {
        value: 'hepatomegaly_mild',
        label: 'Mild hepatomegaly',
        labelKo: '경미한 간비대',
        resultText: 'Mild hepatomegaly noted',
        resultTextKo: '경미한 간비대 소견',
        ownerResultTextKo: '간이 평소보다 약간 부어 있는 상태입니다.',
        isAbnormal: true,
        severity: 'mild',
      },
      {
        value: 'hepatomegaly_marked',
        label: 'Marked hepatomegaly',
        labelKo: '현저한 간비대',
        resultText: 'Marked hepatomegaly; neoplasia, congestion, or hepatocellular disease suspected',
        resultTextKo: '현저한 간비대; 종양, 울혈 또는 간세포 질환 의심',
        ownerResultTextKo: '간이 상당히 부어 있습니다. 혈액 순환 장애나 간 질환, 혹은 종양 가능성이 있습니다.',
        isAbnormal: true,
        severity: 'severe',
      },
      {
        value: 'microhepatica',
        label: 'Microhepatica',
        labelKo: '간 위축',
        resultText: 'Microhepatica noted; portosystemic shunt or end-stage liver disease suspected',
        resultTextKo: '간 위축 소견; 문맥체순환 단락 또는 말기 간질환 의심',
        ownerResultTextKo: '간이 정상보다 작아져 있습니다. 선천적인 혈관 이상이나 만성적인 간 위축이 의심됩니다.',
        isAbnormal: true,
        severity: 'severe',
      },
    ],
  },

  // 간 경계
  {
    testID: 'liver_margin',
    testName: 'Hepatic Margin',
    testNameKo: '간 경계',
    organ: 'liver',
    partOfOrgan: 'diffuse',
    testType: 'select',
    clinicalSignificance: 'medium',
    species: 'both',
    required: true,
    displayLevel: 1,
    options: [
      {
        value: 'smooth',
        label: 'Smooth and sharp',
        labelKo: '매끈하고 명확',
        resultText: 'Hepatic margins smooth and well-defined',
        resultTextKo: '간 경계 매끈하고 명확',
        ownerResultTextKo: '간의 테두리가 매끄럽고 건강해 보입니다.',
        isAbnormal: false,
      },
      {
        value: 'irregular',
        label: 'Irregular / Lobulated',
        labelKo: '불규칙/엽상',
        resultText: 'Irregular hepatic margin; chronic fibrosis or nodular hyperplasia suspected',
        resultTextKo: '간 경계 불규칙; 만성 섬유화 또는 결절성 과증식 의심',
        ownerResultTextKo: '간의 테두리가 울퉁불퉁합니다. 만성적인 변화나 조직의 변성이 의심됩니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
      {
        value: 'rounded',
        label: 'Rounded (blunted edges)',
        labelKo: '둥근 경계 (뭉툭한 끝)',
        resultText: 'Rounded hepatic margins; hepatomegaly or diffuse infiltration suspected',
        resultTextKo: '간 경계 둥글게 뭉툭; 간비대 또는 미만성 침윤 의심',
        ownerResultTextKo: '간의 끝부분이 뾰족하지 않고 둥글게 부어 있습니다. 간 비대가 의심됩니다.',
        isAbnormal: true,
        severity: 'mild',
      },
    ],
  },

  // 간 혈관 패턴
  {
    testID: 'liver_vascularity',
    testName: 'Hepatic Vascular Pattern',
    testNameKo: '간 혈관 패턴',
    organ: 'liver',
    partOfOrgan: 'diffuse',
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 1,
    relatedTests: ['liver_size'],
    note: 'Portal vein diameter >13mm (dog) suggests portal hypertension',
    options: [
      {
        value: 'normal',
        label: 'Normal vascular pattern',
        labelKo: '정상 혈관 패턴',
        resultText: 'Normal hepatic vascular pattern',
        resultTextKo: '간 혈관 패턴 정상',
        ownerResultTextKo: '간 내부의 혈관 흐름이 정상적입니다.',
        isAbnormal: false,
      },
      {
        value: 'portal_dilation',
        label: 'Portal vein dilation',
        labelKo: '문맥 확장',
        resultText: 'Portal vein dilation noted; portal hypertension suspected',
        resultTextKo: '문맥 확장 소견; 문맥 고혈압 의심',
        ownerResultTextKo: '간으로 들어가는 주요 혈관이 확장되어 있습니다. 혈압이 높거나 혈류 정체가 의심됩니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
      {
        value: 'hepatic_vein_dilation',
        label: 'Hepatic vein dilation',
        labelKo: '간정맥 확장',
        resultText: 'Hepatic vein dilation; right-sided heart failure or hepatic venous obstruction suspected',
        resultTextKo: '간정맥 확장; 우심부전 또는 간정맥 폐쇄 의심',
        ownerResultTextKo: '간에서 나가는 혈관이 넓어져 있습니다. 심장 기능 저하나 혈액 배출 장애가 의심됩니다.',
        isAbnormal: true,
        severity: 'severe',
      },
      {
        value: 'tortuous_vessel',
        label: 'Tortuous / Anomalous vessel',
        labelKo: '사행/이상 혈관',
        resultText: 'Anomalous or tortuous hepatic vessel(s) observed; portosystemic shunt suspected',
        resultTextKo: '사행 또는 이상 혈관 관찰; 문맥체순환 단락 의심',
        ownerResultTextKo: '간 주변 혈관이 꼬여있거나 비정상적인 경로로 흐릅니다. 선천적인 혈관 기형 가능성이 있습니다.',
        isAbnormal: true,
        severity: 'severe',
      },
    ],
  },

  // ── NODULE GROUP ──────────────────────────────────────────────────────────
  // Level 1: 결절 존재 여부 (gate)
  // Level 2: 결절 세부 항목 (liver_nodule_presence = 'present' 일 때만 표시)
  // ──────────────────────────────────────────────────────────────────────────

  // [Level 1] 결절 존재 여부
  {
    testID: 'liver_nodule_presence',
    testName: 'Hepatic Nodule / Mass Presence',
    testNameKo: '간 결절/종괴 유무',
    organ: 'liver',
    partOfOrgan: 'diffuse',
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: true,
    displayLevel: 1,
    note: 'If present, complete all Level 2 nodule sub-items below',
    options: [
      {
        value: 'absent',
        label: 'No nodule / mass',
        labelKo: '결절/종괴 없음',
        resultText: 'No focal hepatic lesion identified',
        resultTextKo: '간 내 국소 병변 관찰되지 않음',
        ownerResultTextKo: '간 내부에 특별한 혹이나 덩어리가 보이지 않습니다.',
        isAbnormal: false,
      },
      {
        value: 'present',
        label: 'Nodule / Mass present',
        labelKo: '결절/종괴 있음',
        resultText: 'Focal hepatic lesion(s) identified; see details below',
        resultTextKo: '간 내 국소 병변 관찰; 세부 항목 참조',
        ownerResultTextKo: '간 내부에서 혹이나 덩어리 같은 변화가 관찰됩니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
    ],
  },

  // [Level 2] 결절 개수 ← liver_nodule_presence = 'present' 일 때만 표시
  {
    testID: 'liver_nodule_number',
    testName: 'Hepatic Nodule Number',
    testNameKo: '간 결절 개수',
    organ: 'liver',
    partOfOrgan: ['solitary', 'multiple'],
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: {
      testID: 'liver_nodule_presence',
      triggerValues: ['present'],
    },
    relatedTests: ['liver_nodule_size', 'liver_nodule_echogenicity', 'liver_nodule_location'],
    options: [
      {
        value: 'solitary',
        label: 'Solitary (single)',
        labelKo: '단발성 (1개)',
        resultText: 'Single hepatic focal lesion',
        resultTextKo: '단발성 간 국소 병변',
        ownerResultTextKo: '한 개의 혹이 발견되었습니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
      {
        value: 'few',
        label: 'Few (2–3)',
        labelKo: '소수 (2-3개)',
        resultText: 'Few (2–3) hepatic focal lesions',
        resultTextKo: '소수(2-3개) 간 국소 병변',
        ownerResultTextKo: '2~3개 정도의 적은 수의 혹이 보입니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
      {
        value: 'multiple',
        label: 'Multiple (≥4)',
        labelKo: '다발성 (4개 이상)',
        resultText: 'Multiple (≥4) hepatic focal lesions; multifocal neoplasia or nodular hyperplasia suspected',
        resultTextKo: '다발성(4개 이상) 간 국소 병변; 다발성 종양 또는 결절성 과증식 의심',
        ownerResultTextKo: '여러 군데에 혹들이 퍼져 있습니다.',
        isAbnormal: true,
        severity: 'severe',
      },
      {
        value: 'innumerable',
        label: 'Innumerable / Diffuse',
        labelKo: '셀 수 없이 많음 / 미만성',
        resultText: 'Innumerable / diffusely distributed hepatic lesions; diffuse neoplastic infiltration suspected',
        resultTextKo: '셀 수 없이 많은/미만성 간 병변; 미만성 종양 침윤 의심',
        ownerResultTextKo: '간 전체에 셀 수 없을 정도로 많은 혹이나 변화가 퍼져 있습니다.',
        isAbnormal: true,
        severity: 'severe',
      },
    ],
  },

  // [Level 2] 결절 크기 ← liver_nodule_presence = 'present' 일 때만 표시
  {
    testID: 'liver_nodule_size',
    testName: 'Hepatic Nodule / Mass Size (largest)',
    testNameKo: '간 결절/종괴 크기 (최대 병변)',
    organ: 'liver',
    partOfOrgan: ['solitary', 'multiple'],
    testType: 'range',
    unit: 'cm',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: {
      testID: 'liver_nodule_presence',
      triggerValues: ['present'],
    },
    relatedTests: ['liver_nodule_echogenicity', 'liver_nodule_number', 'liver_nodule_location'],
    normalRange: { dog: { max: 0 }, cat: { max: 0 } },
    ranges: [
      {
        min: 0,
        max: 1,
        resultText: 'Hepatic nodule(s) <1 cm; nodular hyperplasia vs neoplasia, follow-up recommended',
        resultTextKo: '1cm 미만 간 결절 관찰; 결절성 과증식 vs 종양성 병변 감별 필요, 추적 검사 권장',
        ownerResultTextKo: '1cm 미만의 작은 혹이 보입니다. 단순 노화 현상일 수 있지만 정기적인 관찰이 필요합니다.',
        isAbnormal: true,
        severity: 'mild',
      },
      {
        min: 1,
        max: 3,
        resultText: 'Hepatic nodule(s) 1–3 cm; fine needle aspiration recommended',
        resultTextKo: '1-3cm 간 결절 관찰; 세침흡인 검사 권장',
        ownerResultTextKo: '1~3cm 크기의 혹이 보입니다. 정확한 성상을 알기 위해 세포 검사가 권장될 수 있습니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
      {
        min: 3,
        max: null,
        resultText: 'Hepatic mass >3 cm; hepatocellular carcinoma or other neoplasia suspected; further evaluation recommended',
        resultTextKo: '3cm 초과 간 종괴 관찰; 간세포암종 또는 기타 종양 의심; 정밀 평가 권장',
        ownerResultTextKo: '3cm가 넘는 큰 덩어리(혹)가 관찰됩니다. 정밀 검사나 수술적 처치가 필요할 수 있습니다.',
        isAbnormal: true,
        severity: 'severe',
      },
    ],
  },

  // [Level 2] 결절 에코 음영 ← liver_nodule_presence = 'present' 일 때만 표시
  {
    testID: 'liver_nodule_echogenicity',
    testName: 'Hepatic Nodule Echogenicity',
    testNameKo: '간 결절 에코 음영',
    organ: 'liver',
    partOfOrgan: ['solitary', 'multiple'],
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: {
      testID: 'liver_nodule_presence',
      triggerValues: ['present'],
    },
    relatedTests: ['liver_nodule_size', 'liver_nodule_number', 'liver_nodule_location'],
    options: [
      {
        value: 'hyperechoic_nodule',
        label: 'Hyperechoic',
        labelKo: '고에코',
        resultText: 'Hyperechoic hepatic nodule; hepatocellular carcinoma, nodular hyperplasia, or lipoma suspected',
        resultTextKo: '고에코 간 결절; 간세포암종, 결절성 과증식 또는 지방종 의심',
        ownerResultTextKo: '주변보다 밝게 보이는 혹이 관찰됩니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
      {
        value: 'hypoechoic_nodule',
        label: 'Hypoechoic',
        labelKo: '저에코',
        resultText: 'Hypoechoic hepatic nodule; lymphoma, mast cell tumor, or abscess suspected',
        resultTextKo: '저에코 간 결절; 림프종, 비만세포종양 또는 농양 의심',
        ownerResultTextKo: '주변보다 어둡게 보이는 혹이 관찰됩니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
      {
        value: 'anechoic_nodule',
        label: 'Anechoic (cyst)',
        labelKo: '무에코 (낭종)',
        resultText: 'Anechoic hepatic lesion with posterior acoustic enhancement; cyst suspected',
        resultTextKo: '후방음향증강을 동반한 무에코 간 병변; 낭종 의심',
        ownerResultTextKo: '간 내부에 물주머니(낭종)가 관찰됩니다.',
        isAbnormal: true,
        severity: 'mild',
      },
      {
        value: 'mixed_nodule',
        label: 'Mixed / Heterogeneous',
        labelKo: '혼합/불균질',
        resultText: 'Mixed echogenicity hepatic nodule; malignant neoplasia or abscess suspected',
        resultTextKo: '혼합 에코 간 결절; 악성 종양 또는 농양 의심',
        ownerResultTextKo: '밝고 어두운 부분이 섞여 있는 복잡한 형태의 혹이 관찰됩니다.',
        isAbnormal: true,
        severity: 'severe',
      },
      {
        value: 'target_nodule',
        label: 'Target pattern (halo sign)',
        labelKo: '표적 패턴 (halo sign)',
        resultText: 'Target pattern hepatic nodule; malignant neoplasia or abscess strongly suspected',
        resultTextKo: '표적 패턴 간 결절; 악성 종양 또는 농양 강력 의심',
        ownerResultTextKo: '과녁 모양의 종괴가 보입니다. 종양일 가능성이 높아 정밀 검사가 필요합니다.',
        isAbnormal: true,
        severity: 'severe',
      },
    ],
  },

  // [Level 2] 결절 위치 ← liver_nodule_presence = 'present' 일 때만 표시
  {
    testID: 'liver_nodule_location',
    testName: 'Hepatic Nodule Location',
    testNameKo: '간 결절 위치',
    organ: 'liver',
    partOfOrgan: ['solitary', 'multiple'],
    testType: 'multiselect',
    clinicalSignificance: 'medium',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: {
      testID: 'liver_nodule_presence',
      triggerValues: ['present'],
    },
    relatedTests: ['liver_nodule_size', 'liver_nodule_number', 'liver_nodule_echogenicity'],
    resultTemplate: 'Hepatic nodule location(s): {values}',
    resultTemplateKo: '간 결절 위치: {values}',
    resultTemplateOwnerKo: '간의 다음 부위에서 결절(혹)이 관찰됩니다: {values}',
    options: [
      { value: 'left_lobe', label: 'Left lobe', labelKo: '좌엽', resultText: '', resultTextKo: '', isAbnormal: true },
      { value: 'right_lobe', label: 'Right lobe', labelKo: '우엽', resultText: '', resultTextKo: '', isAbnormal: true },
      { value: 'quadrate_lobe', label: 'Quadrate lobe', labelKo: '방형엽', resultText: '', resultTextKo: '', isAbnormal: true },
      { value: 'caudate_lobe', label: 'Caudate lobe', labelKo: '미상엽', resultText: '', resultTextKo: '', isAbnormal: true },
      { value: 'diffuse', label: 'Throughout all lobes', labelKo: '전체 간에 걸쳐', resultText: '', resultTextKo: '', isAbnormal: true },
    ],
  },

  // [Level 2] 결절 경계 ← liver_nodule_presence = 'present' 일 때만 표시
  {
    testID: 'liver_nodule_margin',
    testName: 'Hepatic Nodule Margin',
    testNameKo: '간 결절 경계',
    organ: 'liver',
    partOfOrgan: ['solitary', 'multiple'],
    testType: 'select',
    clinicalSignificance: 'medium',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: {
      testID: 'liver_nodule_presence',
      triggerValues: ['present'],
    },
    options: [
      {
        value: 'well_defined',
        label: 'Well-defined / Smooth margin',
        labelKo: '경계 명확/매끈',
        resultText: 'Hepatic lesion with well-defined smooth margin; benign lesion more likely',
        resultTextKo: '경계 명확하고 매끈한 간 병변; 양성 병변 가능성 높음',
        ownerResultTextKo: '혹의 테두리가 매끈하고 명확합니다. 상대적으로 얌전한 혹일 가능성이 있습니다.',
        isAbnormal: true,
        severity: 'mild',
      },
      {
        value: 'ill_defined',
        label: 'Ill-defined / Irregular margin',
        labelKo: '경계 불명확/불규칙',
        resultText: 'Hepatic lesion with ill-defined or irregular margin; malignant neoplasia suspected',
        resultTextKo: '경계 불명확하거나 불규칙한 간 병변; 악성 종양 의심',
        ownerResultTextKo: '혹의 테두리가 울퉁불퉁하거나 흐릿합니다. 주변 조직으로 침범하는 나쁜 혹일 가능성이 있습니다.',
        isAbnormal: true,
        severity: 'severe',
      },
    ],
  },

  // 담도 확장
  {
    testID: 'liver_biliary_dilation',
    testName: 'Intrahepatic Biliary Dilation',
    testNameKo: '간내 담도 확장',
    organ: 'liver',
    partOfOrgan: 'diffuse',
    testType: 'boolean',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 1,
    positiveResultText: 'Intrahepatic biliary dilation noted; biliary obstruction suspected',
    positiveResultTextKo: '간내 담도 확장 소견; 담도 폐쇄 의심',
    positiveOwnerResultTextKo: '간 내부의 담즙이 흐르는 길이 확장되어 있습니다. 담즙 배출이 원활하지 않을 수 있습니다.',
    negativeResultText: 'No intrahepatic biliary dilation',
    negativeResultTextKo: '간내 담도 확장 없음',
    negativeOwnerResultTextKo: '간 내부 담즙 통로에 특별한 이상이 없습니다.',
    positiveIsAbnormal: true,
  },
];


// ══════════════════════════════════════════════
// 2-2. GALLBLADDER 담낭
// ══════════════════════════════════════════════

const gallbladderTests: UltrasoundTestItem[] = [
  {
    testID: 'organ_absent_reason',
    testName: 'Reason for Absence',
    testNameKo: '장기 결손/적출 사유',
    organ: 'gallbladder',
    partOfOrgan: 'general',
    testType: 'select',
    clinicalSignificance: 'medium',
    species: 'both',
    required: false,
    displayLevel: 1,
    dependsOn: { testID: 'organ_status', triggerValues: ['absent'] },
    options: [
      { value: 'surgical_removal', label: 'Surgical removal', labelKo: '수술적 적출', resultText: 'Previously removed surgically', resultTextKo: '기존 수술을 통해 적출됨', isAbnormal: true },
      { value: 'congenital_absence', label: 'Congenital absence / Agenesis', labelKo: '선천적 결손', resultText: 'Congenital absence / agenesis', resultTextKo: '선천적 결손/미발달', isAbnormal: true },
      { value: 'not_identified', label: 'Not identified (Gas, etc.)', labelKo: '관찰 불가 (가스 등)', resultText: 'Not identified on ultrasound', resultTextKo: '초음파상 관찰되지 않음', isAbnormal: true },
      { value: 'ectopic', label: 'Ectopic location', labelKo: '이소성 위치', resultText: 'Ectopic location suspected', resultTextKo: '이소성 위치 의심', isAbnormal: true },
      { value: 'contracted_gb', label: 'Contracted GB (chronic cholecystitis,fibrosis, post-prandial)', labelKo: '담낭 위축 (만성 담낭염, 섬유화, 식후 등)', resultText: 'Contracted gallbladder', resultTextKo: '위축된 담낭', isAbnormal: true },
    ],
  },

  // 담낭벽 두께
  {
    testID: 'gb_wall_thickness',
    testName: 'Gallbladder Wall Thickness',
    testNameKo: '담낭벽 두께',
    organ: 'gallbladder',
    partOfOrgan: 'wall',
    testType: 'range',
    unit: 'mm',
    clinicalSignificance: 'high',
    species: 'both',
    required: true,
    displayLevel: 1,
    relatedTests: ['gb_content'],
    normalRange: {
      dog: { max: 3 },
      cat: { max: 1 },
    },
    ranges: [
      {
        min: 0,
        max: 3,    // dog
        resultText: 'Gallbladder wall thickness within normal limits',
        resultTextKo: '담낭벽 두께 정상 범위',
        ownerResultTextKo: '담낭 벽의 두께가 정상입니다.',
        isAbnormal: false,
      },
      {
        min: 3,
        max: 5,
        resultText: 'Mild gallbladder wall thickening; cholecystitis or hypoalbuminemia suspected',
        resultTextKo: '경미한 담낭벽 비후; 담낭염 또는 저알부민혈증 의심',
        ownerResultTextKo: '담낭 벽이 약간 두꺼워져 있습니다. 담낭염이나 혈액 내 단백질 부족이 원인일 수 있습니다.',
        isAbnormal: true,
        severity: 'mild',
      },
      {
        min: 5,
        max: null,
        resultText: 'Marked gallbladder wall thickening (>5mm); cholecystitis, neoplasia, or oedema suspected',
        resultTextKo: '현저한 담낭벽 비후(>5mm); 담낭염, 종양 또는 부종 의심',
        ownerResultTextKo: '담낭 벽이 매우 두껍게 부어 있습니다. 심한 담낭염이나 부종 등이 의심됩니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
    ],
  },

  // 담낭 내용물
  {
    testID: 'gb_content',
    testName: 'Gallbladder Contents',
    testNameKo: '담낭 내용물',
    organ: 'gallbladder',
    partOfOrgan: 'lumen',
    testType: 'multiselect',
    clinicalSignificance: 'high',
    species: 'both',
    required: true,
    displayLevel: 1,
    resultTemplate: 'Gallbladder contents: {values}',
    resultTemplateKo: '담낭 내용물: {values}',
    resultTemplateOwnerKo: '담낭(쓸개) 내부에 다음 내용물들이 관찰됩니다: {values}',
    options: [
      {
        value: 'anechoic',
        label: 'Anechoic (normal bile)',
        labelKo: '무에코 (정상 담즙)',
        resultText: 'anechoic bile (normal)',
        resultTextKo: '무에코 담즙 (정상)',
        ownerResultTextKo: '깨끗한 담즙 (정상)',
        isAbnormal: false,
      },
      {
        value: 'sludge',
        label: 'Biliary sludge',
        labelKo: '담즙 슬러지',
        resultText: 'biliary sludge',
        resultTextKo: '담즙 슬러지',
        ownerResultTextKo: '담즙 찌꺼기(슬러지)',
        isAbnormal: true,
        severity: 'mild',
      },
      {
        value: 'cholelith',
        label: 'Cholelith (gallstone)',
        labelKo: '담석',
        resultText: 'cholelith with acoustic shadowing',
        resultTextKo: '음향 음영을 동반한 담석',
        ownerResultTextKo: '담석(쓸개 돌)',
        isAbnormal: true,
        severity: 'moderate',
      },
      {
        value: 'mucocele',
        label: 'Mucocele (stellate/kiwi pattern)',
        labelKo: '담낭 점액낭종 (별모양/키위 패턴)',
        resultText: 'gallbladder mucocele with stellate echogenic content',
        resultTextKo: '별모양의 고에코 내용물을 동반한 담낭 점액낭종',
        ownerResultTextKo: '담낭 점액낭종(담즙이 끈적하게 굳는 질환)',
        isAbnormal: true,
        severity: 'severe',
      },
      {
        value: 'mass',
        label: 'Intraluminal mass',
        labelKo: '내강 내 종괴',
        resultText: 'intraluminal gallbladder mass; neoplasia suspected',
        resultTextKo: '담낭 내강 내 종괴; 종양 의심',
        ownerResultTextKo: '담낭 내 혹(덩어리)',
        isAbnormal: true,
        severity: 'severe',
      },
    ],
  },

  // 담낭 파열 위험
  {
    testID: 'gb_rupture_risk',
    testName: 'Gallbladder Rupture Risk Signs',
    testNameKo: '담낭 파열 위험 징후',
    organ: 'gallbladder',
    partOfOrgan: 'wall',
    testType: 'boolean',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 1,
    note: 'Striated wall, pericholecystic fluid, or wall discontinuity suggest impending rupture',
    positiveResultText: 'Gallbladder rupture risk signs present (striated wall / pericholecystic fluid); emergency evaluation required',
    positiveResultTextKo: '담낭 파열 위험 징후 관찰 (줄무늬 담낭벽 / 담낭 주변 삼출); 응급 평가 필요',
    positiveOwnerResultTextKo: '담낭 파열 위험 징후(담낭벽 변화 또는 주변 삼출액)가 관찰됩니다. 즉각적인 응급 처치가 필요합니다.',
    negativeResultText: 'No gallbladder rupture risk signs',
    negativeResultTextKo: '담낭 파열 위험 징후 없음',
    negativeOwnerResultTextKo: '담낭 파열을 시사하는 위험 징후는 없습니다.',
    positiveIsAbnormal: true,
  },

  // 총담관 직경
  {
    testID: 'cbd_diameter',
    testName: 'Common Bile Duct Diameter',
    testNameKo: '총담관 직경',
    organ: 'gallbladder',
    partOfOrgan: 'general',
    testType: 'range',
    unit: 'mm',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 1,
    dependsOn: { testID: 'gallbladder_status', triggerValues: ['abnormal', 'absent'] },
    normalRange: {
      dog: { max: 3 },
      cat: { max: 4 },
    },
    ranges: [
      {
        min: 0,
        max: 3,
        resultText: 'Common bile duct within normal limits',
        resultTextKo: '총담관 직경 정상',
        ownerResultTextKo: '담즙이 내려가는 통로의 크기가 정상입니다.',
        isAbnormal: false,
      },
      {
        min: 3,
        max: 5,
        resultText: 'Mild common bile duct dilation; biliary obstruction or cholangitis suspected',
        resultTextKo: '경미한 총담관 확장; 담도 폐쇄 또는 담관염 의심',
        ownerResultTextKo: '담즙이 내려가는 통로가 약간 넓어져 있습니다. 담관염이나 경미한 폐쇄 가능성이 있습니다.',
        isAbnormal: true,
        severity: 'mild',
      },
      {
        min: 5,
        max: null,
        resultText: 'Marked common bile duct dilation (>5mm); biliary obstruction suspected',
        resultTextKo: '현저한 총담관 확장(>5mm); 담도 폐쇄 의심',
        ownerResultTextKo: '담즙이 내려가는 주요 통로가 막혀서 확장되어 있습니다. 즉각적인 처치가 필요할 수 있습니다.',
        isAbnormal: true,
        severity: 'severe',
      },
    ],
  },
];


// ══════════════════════════════════════════════
// 2-3. SPLEEN 비장
// ══════════════════════════════════════════════

const spleenTests: UltrasoundTestItem[] = [
  {
    testID: 'organ_absent_reason',
    testName: 'Reason for Absence',
    testNameKo: '장기 결손/적출 사유',
    organ: 'spleen',
    partOfOrgan: 'general',
    testType: 'select',
    clinicalSignificance: 'medium',
    species: 'both',
    required: false,
    displayLevel: 1,
    dependsOn: { testID: 'organ_status', triggerValues: ['absent'] },
    options: [
      { value: 'surgical_removal', label: 'Surgical removal', labelKo: '수술적 적출', resultText: 'Previously removed surgically', resultTextKo: '기존 수술을 통해 적출됨', isAbnormal: true },
      { value: 'congenital_absence', label: 'Congenital absence / Agenesis', labelKo: '선천적 결손', resultText: 'Congenital absence / agenesis', resultTextKo: '선천적 결손/미발달', isAbnormal: true },
      { value: 'not_identified', label: 'Not identified (Gas, etc.)', labelKo: '관찰 불가 (가스 등)', resultText: 'Not identified on ultrasound', resultTextKo: '초음파상 관찰되지 않음', isAbnormal: true },
      { value: 'ectopic', label: 'Ectopic location', labelKo: '이소성 위치', resultText: 'Ectopic location suspected', resultTextKo: '이소성 위치 의심', isAbnormal: true },
    ],
  },

  {
    testID: 'spleen_echogenicity',
    testName: 'Splenic Echogenicity',
    testNameKo: '비장 에코 음영',
    organ: 'spleen',
    partOfOrgan: 'diffuse',
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: true,
    displayLevel: 1,
    relatedTests: ['spleen_size', 'spleen_texture'],
    options: [
      {
        value: 'normal',
        label: 'Normal (homogeneous, mildly hyperechoic to liver)',
        labelKo: '정상 (균질, 간보다 약간 고에코)',
        resultText: 'Splenic echogenicity within normal limits',
        resultTextKo: '비장 에코 음영 정상 범위',
        ownerResultTextKo: '비장의 밝기가 정상입니다.',
        isAbnormal: false,
      },
      {
        value: 'hyperechoic',
        label: 'Hyperechoic / Heterogeneous',
        labelKo: '고에코/불균질',
        resultText: 'Increased or heterogeneous splenic echogenicity; diffuse infiltration or neoplasia suspected',
        resultTextKo: '비장 에코 음영 증가 또는 불균질; 미만성 침윤 또는 종양 의심',
        ownerResultTextKo: '비장의 밝기가 평소보다 밝거나 균일하지 않습니다. 만성적인 변화가 의심됩니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
      {
        value: 'hypoechoic',
        label: 'Hypoechoic',
        labelKo: '저에코',
        resultText: 'Decreased splenic echogenicity; congestion or lymphoma suspected',
        resultTextKo: '비장 에코 음영 감소; 울혈 또는 림프종 의심',
        ownerResultTextKo: '비장의 밝기가 어둡게 보입니다. 혈액 정체나 종양성 변화 가능성이 있습니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
    ],
  },

  {
    testID: 'spleen_size',
    testName: 'Splenic Size',
    testNameKo: '비장 크기',
    organ: 'spleen',
    partOfOrgan: 'diffuse',
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: true,
    displayLevel: 1,
    options: [
      {
        value: 'normal',
        label: 'Normal',
        labelKo: '정상',
        resultText: 'Spleen size within normal limits',
        resultTextKo: '비장 크기 정상',
        ownerResultTextKo: '비장의 크기가 정상입니다.',
        isAbnormal: false,
      },
      {
        value: 'splenomegaly_mild',
        label: 'Mild splenomegaly',
        labelKo: '경미한 비장 비대',
        resultText: 'Mild splenomegaly noted',
        resultTextKo: '경미한 비장 비대 소견',
        ownerResultTextKo: '비장이 약간 커져 있습니다. 가벼운 염증 등이 원인일 수 있습니다.',
        isAbnormal: true,
        severity: 'mild',
      },
      {
        value: 'splenomegaly_marked',
        label: 'Marked splenomegaly',
        labelKo: '현저한 비장 비대',
        resultText: 'Marked splenomegaly; neoplasia, congestion, or haematopoietic disease suspected',
        resultTextKo: '현저한 비장 비대; 종양, 울혈 또는 조혈계 질환 의심',
        ownerResultTextKo: '비장이 상당히 커져 있습니다. 종양이나 혈액 질환 등의 정밀 검사가 필요합니다.',
        isAbnormal: true,
        severity: 'severe',
      },
    ],
  },

  // ── NODULE / MASS GROUP ───────────────────────────────────────────────────
  // Level 1: 결절/종괴 존재 여부 (gate)
  // Level 2: 결절 세부 항목 (spleen_nodule_presence = 'present' 일 때만 표시)
  // ──────────────────────────────────────────────────────────────────────────

  // [Level 1] 결절/종괴 존재 여부
  {
    testID: 'spleen_nodule_presence',
    testName: 'Splenic Nodule / Mass Presence',
    testNameKo: '비장 결절/종괴 유무',
    organ: 'spleen',
    partOfOrgan: 'diffuse',
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: true,
    displayLevel: 1,
    note: 'Haemangiosarcoma risk is high in GSDs and Golden Retrievers',
    options: [
      {
        value: 'absent',
        label: 'No nodule / mass',
        labelKo: '결절/종괴 없음',
        resultText: 'No focal splenic lesion identified',
        resultTextKo: '비장 내 국소 병변 관찰되지 않음',
        ownerResultTextKo: '비장 내 이상 병변은 보이지 않습니다.',
        isAbnormal: false,
      },
      {
        value: 'present',
        label: 'Nodule / Mass present',
        labelKo: '결절/종괴 있음',
        resultText: 'Focal splenic lesion(s) identified; see details below',
        resultTextKo: '비장 내 국소 병변 관찰; 세부 항목 참조',
        ownerResultTextKo: '비장 내에 혹(결절/종괴)이 관찰됩니다. 성상 확인을 위한 추가 검사가 필요할 수 있습니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
    ],
  },

  // [Level 2] 결절 개수
  {
    testID: 'spleen_nodule_number',
    testName: 'Splenic Nodule Number',
    testNameKo: '비장 결절 개수',
    organ: 'spleen',
    partOfOrgan: ['solitary', 'multiple'],
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'spleen_nodule_presence', triggerValues: ['present'] },
    options: [
      {
        value: 'solitary',
        label: 'Solitary (single)',
        labelKo: '단발성 (1개)',
        resultText: 'Single splenic focal lesion',
        resultTextKo: '단발성 비장 국소 병변',
        ownerResultTextKo: '비장에 한 개의 혹이 관찰됩니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
      {
        value: 'few',
        label: 'Few (2–3)',
        labelKo: '소수 (2-3개)',
        resultText: 'Few (2–3) splenic focal lesions',
        resultTextKo: '소수(2-3개) 비장 국소 병변',
        ownerResultTextKo: '비장에 몇 개의 혹이 관찰됩니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
      {
        value: 'multiple',
        label: 'Multiple (≥4)',
        labelKo: '다발성 (4개 이상)',
        resultText: 'Multiple (≥4) splenic focal lesions; multifocal haemangiosarcoma or nodular hyperplasia suspected',
        resultTextKo: '다발성(4개 이상) 비장 국소 병변; 다발성 혈관육종 또는 결절성 과증식 의심',
        ownerResultTextKo: '비장에 다수의 혹이 퍼져 있습니다. 종양성 변화에 대한 정밀 검사가 강력히 권장됩니다.',
        isAbnormal: true,
        severity: 'severe',
      },
    ],
  },

  // [Level 2] 결절 크기
  {
    testID: 'spleen_nodule_size',
    testName: 'Splenic Nodule / Mass Size (largest)',
    testNameKo: '비장 결절/종괴 크기 (최대 병변)',
    organ: 'spleen',
    partOfOrgan: ['solitary', 'multiple'],
    testType: 'range',
    unit: 'cm',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'spleen_nodule_presence', triggerValues: ['present'] },
    normalRange: { dog: { max: 0 }, cat: { max: 0 } },
    ranges: [
      {
        min: 0,
        max: 1,
        resultText: 'Splenic nodule <1 cm; nodular hyperplasia vs neoplasia, monitoring recommended',
        resultTextKo: '1cm 미만 비장 결절; 결절성 과증식 vs 종양성 감별, 모니터링 권장',
        ownerResultTextKo: '1cm 미만의 작은 결절이 보입니다. 정기적인 추적 관찰이 필요합니다.',
        isAbnormal: true,
        severity: 'mild',
      },
      {
        min: 1,
        max: 3,
        resultText: 'Splenic nodule/mass 1–3 cm; haemangiosarcoma or nodular hyperplasia suspected; cytology recommended',
        resultTextKo: '1-3cm 비장 결절/종괴; 혈관육종 또는 결절성 과증식 의심; 세포 검사 권장',
        ownerResultTextKo: '1~3cm 크기의 종괴가 보입니다. 세포 검사 등을 통해 성상을 확인하는 것이 좋습니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
      {
        min: 3,
        max: null,
        resultText: 'Splenic mass >3 cm; haemangiosarcoma suspected; surgical evaluation recommended',
        resultTextKo: '3cm 초과 비장 종괴; 혈관육종 의심; 외과적 평가 권장',
        ownerResultTextKo: '3cm가 넘는 큰 종괴가 관찰됩니다. 수술적 처치나 정밀 검사가 즉시 필요할 수 있습니다.',
        isAbnormal: true,
        severity: 'severe',
      },
    ],
  },

  // [Level 2] 결절 에코 음영
  {
    testID: 'spleen_nodule_echogenicity',
    testName: 'Splenic Nodule Echogenicity',
    testNameKo: '비장 결절 에코 음영',
    organ: 'spleen',
    partOfOrgan: ['solitary', 'multiple'],
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'spleen_nodule_presence', triggerValues: ['present'] },
    options: [
      {
        value: 'hyperechoic_nodule',
        label: 'Hyperechoic',
        labelKo: '고에코',
        resultText: 'Hyperechoic splenic nodule; myelolipoma or nodular hyperplasia suspected',
        resultTextKo: '고에코 비장 결절; 골수지방종 또는 결절성 과증식 의심',
        ownerResultTextKo: '밝게 보이는 혹이 관찰됩니다.',
        isAbnormal: true,
        severity: 'mild',
      },
      {
        value: 'hypoechoic_nodule',
        label: 'Hypoechoic / Anechoic',
        labelKo: '저에코/무에코',
        resultText: 'Hypoechoic/anechoic splenic nodule; haemangiosarcoma, haematoma, or cyst suspected',
        resultTextKo: '저에코/무에코 비장 결절; 혈관육종, 혈종 또는 낭종 의심',
        ownerResultTextKo: '어둡거나 비어 보이는 혹이 관찰됩니다. 혈종이나 종양의 가능성이 있습니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
      {
        value: 'mixed_nodule',
        label: 'Mixed / Heterogeneous',
        labelKo: '혼합/불균질',
        resultText: 'Mixed echogenicity splenic lesion; malignant neoplasia suspected',
        resultTextKo: '혼합 에코 비장 병변; 악성 종양 의심',
        ownerResultTextKo: '밝고 어두운 부분이 섞여 있는 복잡한 혹이 관찰됩니다. 주의 깊은 평가가 필요합니다.',
        isAbnormal: true,
        severity: 'severe',
      },
    ],
  },

  // [Level 2] 결절 경계
  {
    testID: 'spleen_nodule_margin',
    testName: 'Splenic Nodule Margin',
    testNameKo: '비장 결절 경계',
    organ: 'spleen',
    partOfOrgan: ['solitary', 'multiple'],
    testType: 'select',
    clinicalSignificance: 'medium',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'spleen_nodule_presence', triggerValues: ['present'] },
    options: [
      {
        value: 'well_defined',
        label: 'Well-defined / Smooth',
        labelKo: '경계 명확/매끈',
        resultText: 'Splenic lesion with well-defined smooth margin; benign lesion more likely',
        resultTextKo: '경계 명확하고 매끈한 비장 병변; 양성 병변 가능성 높음',
        ownerResultTextKo: '혹의 경계가 매끈하고 명확합니다. 양성일 가능성이 있습니다.',
        isAbnormal: true,
        severity: 'mild',
      },
      {
        value: 'ill_defined',
        label: 'Ill-defined / Irregular',
        labelKo: '경계 불명확/불규칙',
        resultText: 'Splenic lesion with ill-defined or irregular margin; malignant neoplasia suspected',
        resultTextKo: '경계 불명확하거나 불규칙한 비장 병변; 악성 종양 의심',
        ownerResultTextKo: '혹의 경계가 불규칙하거나 흐릿합니다. 악성 종양 가능성을 고려해야 합니다.',
        isAbnormal: true,
        severity: 'severe',
      },
    ],
  },
];


// ══════════════════════════════════════════════
// 2-4. KIDNEYS 신장
// ══════════════════════════════════════════════

const kidneyTests: UltrasoundTestItem[] = [
  {
    testID: 'organ_absent_reason',
    testName: 'Reason for Absence',
    testNameKo: '장기 결손/적출 사유',
    organ: 'left_kidney', // Placeholder, will be mapped in organSections
    partOfOrgan: 'general',
    testType: 'select',
    clinicalSignificance: 'medium',
    species: 'both',
    required: false,
    displayLevel: 1,
    dependsOn: { testID: 'organ_status', triggerValues: ['absent'] },
    options: [
      { value: 'surgical_removal', label: 'Surgical removal', labelKo: '수술적 적출', resultText: 'Previously removed surgically', resultTextKo: '기존 수술을 통해 적출됨', isAbnormal: true },
      { value: 'congenital_absence', label: 'Congenital absence / Agenesis', labelKo: '선천적 결손', resultText: 'Congenital absence / agenesis', resultTextKo: '선천적 결손/미발달', isAbnormal: true },
      { value: 'not_identified', label: 'Not identified (Gas, etc.)', labelKo: '관찰 불가 (가스 등)', resultText: 'Not identified on ultrasound', resultTextKo: '초음파상 관찰되지 않음', isAbnormal: true },
      { value: 'ectopic', label: 'Ectopic location', labelKo: '이소성 위치', resultText: 'Ectopic location suspected', resultTextKo: '이소성 위치 의심', isAbnormal: true },
    ],
  },

  {
    testID: 'kidney_cortex_echogenicity',
    testName: 'Renal Cortical Echogenicity',
    testNameKo: '신피질 에코 음영',
    organ: 'kidney',
    partOfOrgan: ['bilateral', 'cortex'],
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: true,
    displayLevel: 1,
    relatedTests: ['kidney_cmd', 'kidney_size'],
    note: 'Normal: cortex isoechoic or slightly hypoechoic to liver/spleen',
    options: [
      {
        value: 'normal',
        label: 'Normal cortical echogenicity',
        labelKo: '정상 신피질 에코',
        resultText: 'Renal cortical echogenicity within normal limits',
        resultTextKo: '신피질 에코 음영 정상 범위',
        ownerResultTextKo: '신장의 밝기가 정상적입니다.',
        isAbnormal: false,
      },
      {
        value: 'mildly_increased',
        label: 'Mildly increased (=liver)',
        labelKo: '경미하게 증가 (=간)',
        resultText: 'Mildly increased renal cortical echogenicity (isoechoic to liver); early chronic kidney disease suspected',
        resultTextKo: '신피질 에코 음영 경미한 증가 (간과 동등); 초기 만성 신장 질환 의심',
        ownerResultTextKo: '신장의 밝기가 약간 밝아져 있습니다. 초기 신장 기능 저하가 의심될 수 있습니다.',
        isAbnormal: true,
        severity: 'mild',
      },
      {
        value: 'markedly_increased',
        label: 'Markedly increased (>liver, =spleen or brighter)',
        labelKo: '현저하게 증가 (>간, ≥비장)',
        resultText: 'Markedly increased renal cortical echogenicity; chronic kidney disease, glomerulonephritis, or nephrocalcinosis suspected',
        resultTextKo: '신피질 에코 음영 현저한 증가; 만성 신장 질환, 사구체신염 또는 신장 석회화 의심',
        ownerResultTextKo: '신장의 밝기가 매우 밝습니다. 만성 신부전이나 신장 조직의 손상이 상당히 진행되었을 가능성이 있습니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
      {
        value: 'decreased',
        label: 'Decreased',
        labelKo: '감소',
        resultText: 'Decreased renal cortical echogenicity; acute nephritis or lymphoma suspected',
        resultTextKo: '신피질 에코 음영 감소; 급성 신염 또는 림프종 의심',
        ownerResultTextKo: '신장의 밝기가 어둡게 보입니다. 급성 염증이나 종양성 변화 가능성이 있습니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
    ],
  },

  {
    testID: 'kidney_cmd',
    testName: 'Corticomedullary Distinction (CMD)',
    testNameKo: '피수질 구분',
    organ: 'kidney',
    partOfOrgan: ['bilateral', 'cortex', 'medulla'],
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: true,
    displayLevel: 1,
    options: [
      {
        value: 'distinct',
        label: 'Distinct',
        labelKo: '명확',
        resultText: 'Corticomedullary distinction clear',
        resultTextKo: '피수질 구분 명확',
        ownerResultTextKo: '신장의 겉부분과 속부분이 아주 뚜렷하게 잘 구분됩니다. 건강한 상태입니다.',
        isAbnormal: false,
      },
      {
        value: 'reduced',
        label: 'Reduced',
        labelKo: '감소',
        resultText: 'Reduced corticomedullary distinction; chronic kidney disease suspected',
        resultTextKo: '피수질 구분 감소; 만성 신장 질환 의심',
        ownerResultTextKo: '신장의 내부 구조 경계가 흐릿해져 있습니다. 만성 신부전 가능성이 있습니다.',
        isAbnormal: true,
        severity: 'mild',
      },
      {
        value: 'absent',
        label: 'Absent',
        labelKo: '소실',
        resultText: 'Corticomedullary distinction absent; advanced chronic kidney disease suspected',
        resultTextKo: '피수질 구분 소실; 진행성 만성 신장 질환 의심',
        ownerResultTextKo: '신장의 내부 구조가 거의 구분되지 않습니다. 신장 기능이 상당히 저하된 상태로 보입니다.',
        isAbnormal: true,
        severity: 'severe',
      },
    ],
  },

  {
    testID: 'kidney_medullary_rim_sign',
    testName: 'Medullary Rim Sign',
    testNameKo: '피수질 경계 고에코 라인 (Medullary rim sign)',
    organ: 'kidney',
    partOfOrgan: ['bilateral', 'medulla'],
    testType: 'select',
    clinicalSignificance: 'medium',
    species: 'both',
    required: false,
    displayLevel: 1,
    options: [
      {
        value: 'absent',
        label: 'Absent',
        labelKo: '없음',
        resultText: 'Medullary rim sign absent',
        resultTextKo: '피수질 경계 고에코 라인 관찰되지 않음',
        isAbnormal: false,
      },
      {
        value: 'present',
        label: 'Present',
        labelKo: '있음',
        resultText: 'Medullary rim sign observed; consider underlying kidney disease or non-specific finding',
        resultTextKo: '피수질 경계 고에코 라인(Medullary rim sign) 관찰됨; 신장 질환 또는 비특이적 소견 고려',
        ownerResultTextKo: '신장 내부에 비정상적인 밝은 선이 보입니다. 신장 질환의 신호일 수 있습니다.',
        isAbnormal: true,
        severity: 'mild',
      },
    ],
  },

  {
    testID: 'kidney_nephrocalcinosis',
    testName: 'Nephrocalcinosis',
    testNameKo: '신석회증 (Nephrocalcinosis)',
    organ: 'kidney',
    partOfOrgan: ['bilateral', 'parenchyma'],
    testType: 'select',
    clinicalSignificance: 'medium',
    species: 'both',
    required: false,
    displayLevel: 1,
    options: [
      {
        value: 'none',
        label: 'None',
        labelKo: '없음',
        resultText: 'No evidence of nephrocalcinosis',
        resultTextKo: '신석회증 관찰되지 않음',
        isAbnormal: false,
      },
      {
        value: 'mild',
        label: 'Mild',
        labelKo: '경미',
        resultText: 'Mild nephrocalcinosis observed; small hyperechoic foci without shadowing',
        resultTextKo: '경미한 신석회증 관찰됨 (음영 없는 미세한 고에코 입자)',
        ownerResultTextKo: '신장 조직 내부에 아주 미세한 석회화(딱딱한 침착물)가 보입니다. 현재로서는 큰 이상은 없으나 정기적인 관찰이 필요합니다.',
        isAbnormal: true,
        severity: 'mild',
      },
      {
        value: 'moderate_to_severe',
        label: 'Moderate to Severe',
        labelKo: '중등도 이상',
        resultText: 'Significant nephrocalcinosis observed; multiple hyperechoic foci with acoustic shadowing',
        resultTextKo: '중등도 이상의 신석회증 관찰됨 (음영을 동반한 다수의 고에코 입자)',
        ownerResultTextKo: '신장 내부에 뚜렷한 석회화가 진행되어 있습니다. 이는 신장 기능 저하나 대사 이상과 관련이 있을 수 있습니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
    ],
  },

  {
    testID: 'kidney_size_length',
    testName: 'Renal Length',
    testNameKo: '신장 길이',
    organ: 'kidney',
    partOfOrgan: 'bilateral',
    testType: 'range',
    unit: 'cm',
    clinicalSignificance: 'high',
    species: 'both',
    required: true,
    displayLevel: 1,
    note: 'Measure longest axis. Dog: ~2.5–4.4 cm (varies with body weight). Cat: 3.0–4.3 cm.',
    normalRange: {
      dog: { min: 2.5, max: 6.5 },
      cat: { min: 3.0, max: 4.3 },
    },
    ranges: [
      {
        min: 0,
        max: 2.5,
        resultText: 'Small kidney; renal hypoplasia or end-stage chronic kidney disease suspected',
        resultTextKo: '신장 길이 감소; 신장 형성부전 또는 말기 만성 신장 질환 의심',
        ownerResultTextKo: '신장의 크기가 정상보다 매우 작습니다. 선천적인 원인이나 만성 신부전 말기 가능성이 있습니다.',
        isAbnormal: true,
        severity: 'severe',
      },
      {
        min: 2.5,
        max: 6.5,
        resultText: 'Renal size within normal limits',
        resultTextKo: '신장 크기 정상 범위',
        ownerResultTextKo: '신장의 크기가 정상입니다.',
        isAbnormal: false,
      },
      {
        min: 6.5,
        max: null,
        resultText: 'Renomegaly; hydronephrosis, neoplasia, or acute nephritis suspected',
        resultTextKo: '신장 비대; 수신증, 종양 또는 급성 신염 의심',
        ownerResultTextKo: '신장이 정상보다 커져 있습니다. 부종이나 염증, 종양 혹은 소변 정체 가능성이 있습니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
    ],
  },

  {
    testID: 'kidney_pelvis_dilation',
    testName: 'Renal Pelvis Dilation',
    testNameKo: '신우 확장',
    organ: 'kidney',
    partOfOrgan: 'pelvis',
    testType: 'range',
    unit: 'mm',
    clinicalSignificance: 'high',
    species: 'both',
    required: true,
    displayLevel: 1,
    relatedTests: ['kidney_ureter_dilation'],
    normalRange: {
      dog: { max: 3 },
      cat: { max: 3 },
    },
    ranges: [
      {
        min: 0,
        max: 3,
        resultText: 'Renal pelvis within normal limits',
        resultTextKo: '신우 확장 없음, 정상 범위',
        ownerResultTextKo: '신장 내부 소변이 모이는 곳에 확장이 없습니다. 정상입니다.',
        isAbnormal: false,
      },
      {
        min: 3,
        max: 8,
        resultText: 'Mild renal pelvic dilation; mild hydronephrosis; urinary obstruction or pyelonephritis suspected',
        resultTextKo: '경미한 신우 확장; 경미한 수신증; 요로 폐쇄 또는 신우신염 의심',
        ownerResultTextKo: '신장 내부 소변 주머니가 약간 늘어나 있습니다. 소변 정체나 신장 염증이 의심됩니다.',
        isAbnormal: true,
        severity: 'mild',
      },
      {
        min: 8,
        max: null,
        resultText: 'Marked renal pelvic dilation; moderate-to-severe hydronephrosis; urinary obstruction suspected',
        resultTextKo: '현저한 신우 확장; 중등도-중증 수신증; 요로 폐쇄 의심',
        ownerResultTextKo: '신장 내부 소변 주머니가 아주 많이 늘어나 있습니다. 하부 요로가 막혔을 가능성이 높습니다.',
        isAbnormal: true,
        severity: 'severe',
      },
    ],
  },

  // ── NEPHROLITHIASIS GROUP ────────────────────────────────────────────────
  // [Level 1] 신결석 유무 (gate)
  {
    testID: 'kidney_stone',
    testName: 'Nephrolithiasis',
    testNameKo: '신결석',
    organ: 'kidney',
    partOfOrgan: 'bilateral',
    testType: 'boolean',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 1,
    positiveResultText: 'Renal calculus/calculi identified with acoustic shadowing',
    positiveResultTextKo: '음향 음영을 동반한 신결석 관찰',
    positiveOwnerResultTextKo: '신장 내부에 결석(돌)이 관찰됩니다.',
    negativeResultText: 'No renal calculi identified',
    negativeResultTextKo: '신결석 없음',
    negativeOwnerResultTextKo: '신장에 결석은 보이지 않습니다.',
    positiveIsAbnormal: true,
  },

  // [Level 2] 신결석 크기 ← kidney_stone = 'true'
  {
    testID: 'kidney_stone_size',
    testName: 'Nephrolithiasis Size (largest)',
    testNameKo: '신결석 크기 (최대)',
    organ: 'kidney',
    partOfOrgan: 'bilateral',
    testType: 'range',
    unit: 'mm',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'kidney_stone', triggerValues: ['true'] },
    normalRange: { dog: { max: 0 }, cat: { max: 0 } },
    ranges: [
      {
        min: 0, max: 5,
        resultText: 'Small nephrolithiasis (<5mm); may pass spontaneously',
        resultTextKo: '소형 신결석(<5mm); 자연 배출 가능',
        ownerResultTextKo: '5mm 미만의 작은 신장 결석입니다. 자연적으로 배출될 가능성이 있습니다.',
        isAbnormal: true, severity: 'mild',
      },
      {
        min: 5, max: 10,
        resultText: 'Moderate nephrolithiasis (5–10mm); monitoring or intervention required',
        resultTextKo: '중간 크기 신결석(5-10mm); 모니터링 또는 중재 필요',
        ownerResultTextKo: '5~10mm 크기의 결석입니다. 정기적인 확인이나 치료가 필요할 수 있습니다.',
        isAbnormal: true, severity: 'moderate',
      },
      {
        min: 10, max: null,
        resultText: 'Large nephrolithiasis (>10mm); obstruction risk high; surgical or lithotripsy evaluation recommended',
        resultTextKo: '대형 신결석(>10mm); 폐쇄 위험 높음; 수술 또는 쇄석술 평가 권장',
        ownerResultTextKo: '10mm 이상의 큰 결석입니다. 요관을 막을 위험이 있어 수술적 처치가 고려됩니다.',
        isAbnormal: true, severity: 'severe',
      },
    ],
  },

  // [Level 2] 신결석 위치 ← kidney_stone = 'true'
  {
    testID: 'kidney_stone_location',
    testName: 'Nephrolithiasis Location',
    testNameKo: '신결석 위치',
    organ: 'kidney',
    partOfOrgan: ['pelvis', 'cortex'],
    testType: 'multiselect',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'kidney_stone', triggerValues: ['true'] },
    resultTemplate: 'Nephrolithiasis location(s): {values}',
    resultTemplateKo: '신결석 위치: {values}',
    resultTemplateOwnerKo: '다음 부위에서 신장 결석이 관찰됩니다: {values}',
    options: [
      {
        value: 'pelvis',
        label: 'Renal pelvis',
        labelKo: '신우',
        resultText: '',
        resultTextKo: '',
        isAbnormal: true, severity: 'moderate',
      },
      {
        value: 'parenchyma',
        label: 'Renal parenchyma (nephrocalcinosis)',
        labelKo: '신실질 (신장 석회화)',
        resultText: '',
        resultTextKo: '',
        isAbnormal: true, severity: 'moderate',
      },
      {
        value: 'bilateral',
        label: 'Bilateral',
        labelKo: '양측성',
        resultText: '',
        resultTextKo: '',
        isAbnormal: true, severity: 'severe',
      },
    ],
  },

  // ── RENAL CYST GROUP ─────────────────────────────────────────────────────
  // [Level 1] 신장 낭종 유무 (gate)
  {
    testID: 'kidney_cyst',
    testName: 'Renal Cyst',
    testNameKo: '신장 낭종',
    organ: 'kidney',
    partOfOrgan: 'bilateral',
    testType: 'boolean',
    clinicalSignificance: 'medium',
    species: 'both',
    required: false,
    displayLevel: 1,
    positiveResultText: 'Renal cyst(s) identified; polycystic kidney disease vs simple cyst',
    positiveResultTextKo: '신장 낭종 관찰; 다낭성 신장 질환 vs 단순 낭종 감별 필요',
    positiveOwnerResultTextKo: '신장에 물주머니(낭종)가 관찰됩니다.',
    negativeResultText: 'No renal cysts identified',
    negativeResultTextKo: '신장 낭종 없음',
    negativeOwnerResultTextKo: '신장에 물주머니는 보이지 않습니다.',
    positiveIsAbnormal: true,
  },

  // [Level 2] 낭종 개수 ← kidney_cyst = 'true'
  {
    testID: 'kidney_cyst_number',
    testName: 'Renal Cyst Number',
    testNameKo: '신장 낭종 개수',
    organ: 'kidney',
    partOfOrgan: 'bilateral',
    testType: 'select',
    clinicalSignificance: 'medium',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'kidney_cyst', triggerValues: ['true'] },
    options: [
      {
        value: 'single',
        label: 'Single',
        labelKo: '단발성 (1개)',
        resultText: 'Single renal cyst; simple renal cyst',
        resultTextKo: '단발성 신장 낭종; 단순 낭종',
        ownerResultTextKo: '한 개의 물주머니가 관찰됩니다.',
        isAbnormal: true, severity: 'mild',
      },
      {
        value: 'few',
        label: 'Few (2–3)',
        labelKo: '소수 (2-3개)',
        resultText: 'Few renal cysts (2–3)',
        resultTextKo: '소수의 신장 낭종 (2-3개)',
        ownerResultTextKo: '적은 수의 물주머니가 관찰됩니다.',
        isAbnormal: true, severity: 'mild',
      },
      {
        value: 'multiple_polycystic',
        label: 'Multiple / Polycystic',
        labelKo: '다발성 / 다낭성',
        resultText: 'Multiple renal cysts; polycystic kidney disease suspected',
        resultTextKo: '다발성 신장 낭종; 다낭성 신장 질환 의심',
        ownerResultTextKo: '매우 많은 수의 물주머니가 관찰됩니다. 유전성 다낭성 신장 질환 가능성이 있습니다.',
        isAbnormal: true, severity: 'severe',
      },
    ],
  },

  // [Level 2] 낭종 크기 ← kidney_cyst = 'true'
  {
    testID: 'kidney_cyst_size',
    testName: 'Renal Cyst Size (largest)',
    testNameKo: '신장 낭종 크기 (최대)',
    organ: 'kidney',
    partOfOrgan: 'bilateral',
    testType: 'range',
    unit: 'cm',
    clinicalSignificance: 'medium',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'kidney_cyst', triggerValues: ['true'] },
    normalRange: { dog: { max: 0 }, cat: { max: 0 } },
    ranges: [
      {
        min: 0, max: 1,
        resultText: 'Small renal cyst(s) <1 cm; routine monitoring recommended',
        resultTextKo: '1cm 미만 소형 신장 낭종; 정기적 모니터링 권장',
        ownerResultTextKo: '1cm 미만의 작은 물주머니입니다. 정기적인 확인만으로 충분할 수 있습니다.',
        isAbnormal: true, severity: 'mild',
      },
      {
        min: 1, max: 3,
        resultText: 'Renal cyst(s) 1–3 cm; follow-up ultrasound recommended',
        resultTextKo: '1-3cm 신장 낭종; 추적 초음파 검사 권장',
        ownerResultTextKo: '1~3cm 크기의 물주머니가 보입니다. 주기적인 초음파 검사가 필요합니다.',
        isAbnormal: true, severity: 'mild',
      },
      {
        min: 3, max: null,
        resultText: 'Large renal cyst(s) >3 cm; compression of adjacent parenchyma possible',
        resultTextKo: '3cm 초과 대형 신장 낭종; 인접 실질 압박 가능성',
        ownerResultTextKo: '3cm가 넘는 큰 물주머니가 있습니다. 신장 조직을 압박할 수 있어 주의가 필요합니다.',
        isAbnormal: true, severity: 'moderate',
      },
    ],
  },

  // ── FOCAL RENAL LESION GROUP ─────────────────────────────────────────────
  // [Level 1] 신장 국소 병변 유무 (결절/종괴 — 낭종/결석 제외)
  {
    testID: 'kidney_focal_lesion_presence',
    testName: 'Focal Renal Lesion (non-cystic)',
    testNameKo: '신장 국소 병변 (비낭성)',
    organ: 'kidney',
    partOfOrgan: 'bilateral',
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 1,
    note: 'Solid or mixed renal mass excluding simple cysts and calculi',
    options: [
      {
        value: 'absent',
        label: 'No focal solid lesion',
        labelKo: '국소 고형 병변 없음',
        resultText: 'No focal solid renal lesion identified',
        resultTextKo: '신장 내 국소 고형 병변 관찰되지 않음',
        ownerResultTextKo: '신장 내부에 단단한 혹이나 덩어리는 보이지 않습니다.',
        isAbnormal: false,
      },
      {
        value: 'present',
        label: 'Focal solid lesion present',
        labelKo: '국소 고형 병변 있음',
        resultText: 'Focal solid renal lesion identified; see details below',
        resultTextKo: '신장 내 국소 고형 병변 관찰; 세부 항목 참조',
        ownerResultTextKo: '신장 내부에서 혹이나 덩어리 같은 변화가 관찰됩니다.',
        isAbnormal: true, severity: 'moderate',
      },
    ],
  },

  // [Level 2] 병변 크기 ← kidney_focal_lesion_presence = 'present'
  {
    testID: 'kidney_focal_size',
    testName: 'Focal Renal Lesion Size',
    testNameKo: '신장 국소 병변 크기',
    organ: 'kidney',
    partOfOrgan: 'bilateral',
    testType: 'range',
    unit: 'cm',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'kidney_focal_lesion_presence', triggerValues: ['present'] },
    normalRange: { dog: { max: 0 }, cat: { max: 0 } },
    ranges: [
      {
        min: 0, max: 1,
        resultText: 'Small focal renal lesion <1 cm; cytology or follow-up recommended',
        resultTextKo: '1cm 미만 소형 신장 국소 병변; 세포검사 또는 추적 검사 권장',
        ownerResultTextKo: '신장에 1cm 미만의 작은 혹이 보입니다. 정기적인 추적 관찰이 권장됩니다.',
        isAbnormal: true, severity: 'mild',
      },
      {
        min: 1, max: 3,
        resultText: 'Focal renal lesion 1–3 cm; neoplasia suspected; cytology recommended',
        resultTextKo: '1-3cm 신장 국소 병변; 종양 의심; 세포검사 권장',
        ownerResultTextKo: '1~3cm 크기의 혹이 보입니다. 종양 가능성을 배제하기 위해 추가 검사가 권장됩니다.',
        isAbnormal: true, severity: 'moderate',
      },
      {
        min: 3, max: null,
        resultText: 'Large focal renal mass >3 cm; renal carcinoma or lymphoma suspected',
        resultTextKo: '3cm 초과 신장 종괴; 신세포암종 또는 림프종 의심',
        ownerResultTextKo: '3cm 이상의 큰 종괴가 관찰됩니다. 정밀 검사와 적극적인 치료가 필요할 수 있습니다.',
        isAbnormal: true, severity: 'severe',
      },
    ],
  },

  // [Level 2] 병변 에코 ← kidney_focal_lesion_presence = 'present'
  {
    testID: 'kidney_focal_echogenicity',
    testName: 'Focal Renal Lesion Echogenicity',
    testNameKo: '신장 국소 병변 에코 음영',
    organ: 'kidney',
    partOfOrgan: 'bilateral',
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'kidney_focal_lesion_presence', triggerValues: ['present'] },
    options: [
      {
        value: 'hyperechoic',
        label: 'Hyperechoic',
        labelKo: '고에코',
        resultText: 'Hyperechoic focal renal lesion; lipoma or angiomyolipoma suspected',
        resultTextKo: '고에코 신장 국소 병변; 지방종 또는 혈관근지방종 의심',
        ownerResultTextKo: '주변보다 밝게 보이는 혹이 관찰됩니다. 지방종 등 양성 병변일 수 있습니다.',
        isAbnormal: true, severity: 'mild',
      },
      {
        value: 'hypoechoic',
        label: 'Hypoechoic',
        labelKo: '저에코',
        resultText: 'Hypoechoic focal renal lesion; lymphoma or renal carcinoma suspected',
        resultTextKo: '저에코 신장 국소 병변; 림프종 또는 신세포암종 의심',
        ownerResultTextKo: '주변보다 어둡게 보이는 혹이 관찰됩니다. 종양성 변화에 대한 주의가 필요합니다.',
        isAbnormal: true, severity: 'moderate',
      },
      {
        value: 'mixed',
        label: 'Mixed / Heterogeneous',
        labelKo: '혼합/불균질',
        resultText: 'Mixed echogenicity focal renal lesion; malignant neoplasia suspected',
        resultTextKo: '혼합 에코 신장 국소 병변; 악성 종양 의심',
        ownerResultTextKo: '밝고 어두운 부분이 섞인 복잡한 형태의 혹이 보입니다. 악성 가능성을 고려해야 합니다.',
        isAbnormal: true, severity: 'severe',
      },
    ],
  },
];


// ══════════════════════════════════════════════
// 2-5. URINARY BLADDER 방광
// ══════════════════════════════════════════════

const urinaryBladderTests: UltrasoundTestItem[] = [

  {
    testID: 'ub_wall_thickness',
    testName: 'Urinary Bladder Wall Thickness',
    testNameKo: '방광벽 두께',
    organ: 'urinary_bladder',
    partOfOrgan: 'wall',
    testType: 'range',
    unit: 'mm',
    clinicalSignificance: 'high',
    species: 'both',
    required: true,
    displayLevel: 1,
    note: 'Measure when moderately distended. Empty bladder has physiologically thicker wall.',
    normalRange: {
      dog: { max: 2 },
      cat: { max: 1.5 },
    },
    ranges: [
      {
        min: 0,
        max: 2,
        resultText: 'Urinary bladder wall within normal limits',
        resultTextKo: '방광벽 두께 정상 범위',
        ownerResultTextKo: '방광 벽의 두께가 정상입니다.',
        isAbnormal: false,
      },
      {
        min: 2,
        max: 4,
        resultText: 'Mild urinary bladder wall thickening; cystitis suspected',
        resultTextKo: '경미한 방광벽 비후; 방광염 의심',
        ownerResultTextKo: '방광 벽이 약간 두꺼워져 있습니다. 방광염 가능성이 있습니다.',
        isAbnormal: true,
        severity: 'mild',
      },
      {
        min: 4,
        max: null,
        resultText: 'Marked urinary bladder wall thickening; neoplasia, chronic cystitis, or polypoid cystitis suspected',
        resultTextKo: '현저한 방광벽 비후; 종양, 만성 방광염 또는 폴립성 방광염 의심',
        ownerResultTextKo: '방광 벽이 매우 두껍게 부어 있습니다. 만성적인 염증이나 종양 확인이 필요합니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
    ],
  },

  {
    testID: 'ub_content',
    testName: 'Urinary Bladder Contents',
    testNameKo: '방광 내용물',
    organ: 'urinary_bladder',
    partOfOrgan: 'lumen',
    testType: 'multiselect',
    clinicalSignificance: 'high',
    species: 'both',
    required: true,
    displayLevel: 1,
    resultTemplate: 'Urinary bladder contents: {values}',
    resultTemplateKo: '방광 내용물: {values}',
    resultTemplateOwnerKo: '방광 내부에 다음 내용물들이 관찰됩니다: {values}',
    options: [
      {
        value: 'anechoic',
        label: 'Anechoic (normal urine)',
        labelKo: '무에코 (정상 소변)',
        resultText: 'anechoic urine (normal)',
        resultTextKo: '무에코 소변 (정상)',
        ownerResultTextKo: '깨끗한 소변 (정상)',
        isAbnormal: false,
      },
      {
        value: 'sediment',
        label: 'Echogenic sediment',
        labelKo: '에코성 침전물',
        resultText: 'echogenic sediment (crystalluria/pyuria)',
        resultTextKo: '에코성 침전물 (결정뇨/농뇨)',
        ownerResultTextKo: '소변 찌꺼기(슬러지)',
        isAbnormal: true,
        severity: 'mild',
      },
      {
        value: 'cystic_calculi',
        label: 'Cystic calculi',
        labelKo: '방광결석',
        resultText: 'cystic calculi with acoustic shadowing',
        resultTextKo: '음향 음영을 동반한 방광결석',
        ownerResultTextKo: '방광결석(돌)',
        isAbnormal: true,
        severity: 'moderate',
      },
      {
        value: 'mass',
        label: 'Intraluminal mass',
        labelKo: '방광 내강 내 종괴',
        resultText: 'intraluminal bladder mass; transitional cell carcinoma suspected',
        resultTextKo: '방광 내강 내 종괴; 이행상피세포암 의심',
        ownerResultTextKo: '방광 내 혹(덩어리)',
        isAbnormal: true,
        severity: 'severe',
      },
      {
        value: 'blood_clot',
        label: 'Blood clot',
        labelKo: '혈액 응괴',
        resultText: 'echogenic non-shadowing intraluminal material consistent with blood clot',
        resultTextKo: '음향 음영 없는 에코성 내강 내 물질; 혈액 응괴에 합당',
        ownerResultTextKo: '피떡(혈괴)',
        isAbnormal: true,
        severity: 'moderate',
      },
    ],
  },

  // ── BLADDER MASS GROUP ───────────────────────────────────────────────────
  // [Level 1] 방광 종괴 유무 (gate)
  {
    testID: 'ub_mass_presence',
    testName: 'Bladder Mass / Mural Lesion Presence',
    testNameKo: '방광 종괴/벽 내 병변 유무',
    organ: 'urinary_bladder',
    partOfOrgan: 'wall',
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: true,
    displayLevel: 1,
    note: 'Trigone-based mass in dogs is highly suspicious for TCC/urothelial carcinoma',
    options: [
      {
        value: 'absent',
        label: 'No intraluminal or mural mass',
        labelKo: '방광 내강/벽 내 종괴 없음',
        resultText: 'No bladder mass or mural lesion identified',
        resultTextKo: '방광 종괴 또는 벽 내 병변 관찰되지 않음',
        ownerResultTextKo: '방광 내부나 벽에 혹 또는 덩어리는 보이지 않습니다.',
        isAbnormal: false,
      },
      {
        value: 'present',
        label: 'Mass / Mural lesion present',
        labelKo: '종괴/벽 내 병변 있음',
        resultText: 'Bladder mass or mural lesion identified; see details below',
        resultTextKo: '방광 종괴 또는 벽 내 병변 관찰; 세부 항목 참조',
        ownerResultTextKo: '방광 내부나 벽에서 혹 같은 변화가 관찰됩니다.',
        isAbnormal: true, severity: 'severe',
      },
    ],
  },

  // [Level 2] 종괴 위치 ← ub_mass_presence = 'present'
  {
    testID: 'ub_mass_location',
    testName: 'Bladder Mass Location',
    testNameKo: '방광 종괴 위치',
    organ: 'urinary_bladder',
    partOfOrgan: 'wall',
    testType: 'multiselect',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'ub_mass_presence', triggerValues: ['present'] },
    resultTemplate: 'Bladder mass location(s): {values}',
    resultTemplateKo: '방광 종괴 위치: {values}',
    resultTemplateOwnerKo: '다음 부위에서 방광 종괴(혹)가 확인됩니다: {values}',
    note: 'Trigone location highly suspicious for TCC',
    options: [
      {
        value: 'trigone',
        label: 'Trigone',
        labelKo: '삼각부',
        resultText: '',
        resultTextKo: '',
        isAbnormal: true, severity: 'severe',
      },
      {
        value: 'cranial',
        label: 'Cranial / Apex',
        labelKo: '전방/첨부',
        resultText: '',
        resultTextKo: '',
        isAbnormal: true, severity: 'moderate',
      },
      {
        value: 'lateral_wall',
        label: 'Lateral wall',
        labelKo: '측벽',
        resultText: '',
        resultTextKo: '',
        isAbnormal: true, severity: 'moderate',
      },
      {
        value: 'diffuse',
        label: 'Diffuse / Circumferential',
        labelKo: '미만성/전주',
        resultText: '',
        resultTextKo: '',
        isAbnormal: true, severity: 'severe',
      },
    ],
  },

  // [Level 2] 종괴 크기 ← ub_mass_presence = 'present'
  {
    testID: 'ub_mass_size',
    testName: 'Bladder Mass Size',
    testNameKo: '방광 종괴 크기',
    organ: 'urinary_bladder',
    partOfOrgan: 'wall',
    testType: 'range',
    unit: 'cm',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'ub_mass_presence', triggerValues: ['present'] },
    normalRange: { dog: { max: 0 }, cat: { max: 0 } },
    ranges: [
      {
        min: 0, max: 1,
        resultText: 'Small bladder mass <1 cm; polyp or early neoplasia suspected',
        resultTextKo: '1cm 미만 소형 방광 종괴; 폴립 또는 초기 종양 의심',
        ownerResultTextKo: '방광에 1cm 미만의 작은 혹이 보입니다. 폴립(양성)이나 초기 종양일 수 있습니다.',
        isAbnormal: true, severity: 'mild',
      },
      {
        min: 1, max: 3,
        resultText: 'Bladder mass 1–3 cm; transitional cell carcinoma suspected; cystoscopy or biopsy recommended',
        resultTextKo: '1-3cm 방광 종괴; 이행상피세포암 의심; 방광경 검사 또는 생검 권장',
        ownerResultTextKo: '1~3cm 크기의 혹이 관찰됩니다. 악성 종양 여부를 확인하기 위해 정밀 검사가 권장됩니다.',
        isAbnormal: true, severity: 'moderate',
      },
      {
        min: 3, max: null,
        resultText: 'Large bladder mass >3 cm; advanced transitional cell carcinoma suspected',
        resultTextKo: '3cm 초과 대형 방광 종괴; 진행성 이행상피세포암 의심',
        ownerResultTextKo: '3cm 이상의 큰 종괴가 관찰됩니다. 진행된 상태의 암종일 가능성이 높습니다.',
        isAbnormal: true, severity: 'severe',
      },
    ],
  },

  // [Level 2] 종괴 에코 ← ub_mass_presence = 'present'
  {
    testID: 'ub_mass_echogenicity',
    testName: 'Bladder Mass Echogenicity',
    testNameKo: '방광 종괴 에코 음영',
    organ: 'urinary_bladder',
    partOfOrgan: 'wall',
    testType: 'select',
    clinicalSignificance: 'medium',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'ub_mass_presence', triggerValues: ['present'] },
    options: [
      {
        value: 'hyperechoic',
        label: 'Hyperechoic (polypoid)',
        labelKo: '고에코 (폴립성)',
        resultText: 'Hyperechoic bladder mass consistent with polypoid cystitis or benign polyp',
        resultTextKo: '고에코 방광 종괴; 폴립성 방광염 또는 양성 폴립에 합당',
        isAbnormal: true, severity: 'moderate',
      },
      {
        value: 'hypoechoic',
        label: 'Hypoechoic / Mixed',
        labelKo: '저에코/혼합',
        resultText: 'Hypoechoic or mixed bladder mass; transitional cell carcinoma suspected',
        resultTextKo: '저에코 또는 혼합 에코 방광 종괴; 이행상피세포암 의심',
        isAbnormal: true, severity: 'severe',
      },
    ],
  },

  // ── CYSTIC CALCULI GROUP ─────────────────────────────────────────────────
  // [Level 1] 방광결석 유무 (gate)
  {
    testID: 'ub_calculi_presence',
    testName: 'Cystic Calculi Presence',
    testNameKo: '방광결석 유무',
    organ: 'urinary_bladder',
    partOfOrgan: 'lumen',
    testType: 'boolean',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 1,
    positiveResultText: 'Cystic calculi identified with acoustic shadowing',
    positiveResultTextKo: '음향 음영을 동반한 방광결석 관찰',
    positiveOwnerResultTextKo: '방광 내부에 결석(돌)이 관찰됩니다.',
    negativeResultText: 'No cystic calculi identified',
    negativeResultTextKo: '방광결석 없음',
    negativeOwnerResultTextKo: '방광 내부에 결석은 보이지 않습니다.',
    positiveIsAbnormal: true,
  },

  // [Level 2] 방광결석 개수/양 ← ub_calculi_presence = 'true'
  {
    testID: 'ub_calculi_number',
    testName: 'Cystic Calculi Number / Amount',
    testNameKo: '방광결석 개수/양',
    organ: 'urinary_bladder',
    partOfOrgan: 'lumen',
    testType: 'select',
    clinicalSignificance: 'medium',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'ub_calculi_presence', triggerValues: ['true'] },
    options: [
      {
        value: 'single',
        label: 'Single',
        labelKo: '단발성 (1개)',
        resultText: 'Single cystic calculus identified',
        resultTextKo: '단발성 방광결석 관찰',
        ownerResultTextKo: '한 개의 결석이 발견되었습니다.',
        isAbnormal: true, severity: 'moderate',
      },
      {
        value: 'few',
        label: 'Few (2–5)',
        labelKo: '소수 (2-5개)',
        resultText: 'Few cystic calculi (2–5) identified',
        resultTextKo: '소수(2-5개) 방광결석 관찰',
        ownerResultTextKo: '몇 개의 결석이 관찰됩니다.',
        isAbnormal: true, severity: 'moderate',
      },
      {
        value: 'multiple',
        label: 'Multiple / Gravel',
        labelKo: '다수/자갈형',
        resultText: 'Multiple cystic calculi / urinary gravel identified',
        resultTextKo: '다수의 방광결석/요석 자갈 관찰',
        ownerResultTextKo: '다수의 결석이나 모래 같은 자갈형 요석들이 많이 깔려 있습니다.',
        isAbnormal: true, severity: 'moderate',
      },
    ],
  },

  // [Level 2] 방광결석 크기 ← ub_calculi_presence = 'true'
  {
    testID: 'ub_calculi_size',
    testName: 'Cystic Calculi Size (largest)',
    testNameKo: '방광결석 크기 (최대)',
    organ: 'urinary_bladder',
    partOfOrgan: 'lumen',
    testType: 'range',
    unit: 'mm',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'ub_calculi_presence', triggerValues: ['true'] },
    normalRange: { dog: { max: 0 }, cat: { max: 0 } },
    ranges: [
      {
        min: 0, max: 5,
        resultText: 'Small cystic calculus (<5mm); may pass through urethra',
        resultTextKo: '소형 방광결석(<5mm); 요도 통과 가능',
        isAbnormal: true, severity: 'mild',
      },
      {
        min: 5, max: 15,
        resultText: 'Moderate cystic calculus (5–15mm); urethral obstruction risk in cats/small dogs',
        resultTextKo: '중간 크기 방광결석(5-15mm); 고양이/소형견 요도 폐쇄 위험',
        isAbnormal: true, severity: 'moderate',
      },
      {
        min: 15, max: null,
        resultText: 'Large cystic calculus (>15mm); surgical removal recommended',
        resultTextKo: '대형 방광결석(>15mm); 외과적 제거 권장',
        isAbnormal: true, severity: 'severe',
      },
    ],
  },
];


// ══════════════════════════════════════════════
// 2-6. PANCREAS 췌장
// ══════════════════════════════════════════════

const pancreasTests: UltrasoundTestItem[] = [

  {
    testID: 'pancreas_echogenicity',
    testName: 'Pancreatic Echogenicity',
    testNameKo: '췌장 에코 음영',
    organ: 'pancreas',
    partOfOrgan: 'diffuse',
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: true,
    displayLevel: 1,
    relatedTests: ['pancreas_size', 'peripancreatic_effusion'],
    options: [
      {
        value: 'normal',
        label: 'Normal (isoechoic to mesentery)',
        labelKo: '정상 (장간막과 동등)',
        resultText: 'Pancreatic echogenicity within normal limits',
        resultTextKo: '췌장 에코 음영 정상 범위',
        ownerResultTextKo: '췌장의 밝기가 정상입니다.',
        isAbnormal: false,
      },
      {
        value: 'hypoechoic',
        label: 'Hypoechoic',
        labelKo: '저에코',
        resultText: 'Hypoechoic pancreas; acute pancreatitis suspected',
        resultTextKo: '저에코 췌장; 급성 췌장염 의심',
        ownerResultTextKo: '췌장이 어둡게 부어 있습니다. 급성 췌장염이 의심됩니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
      {
        value: 'hyperechoic',
        label: 'Hyperechoic',
        labelKo: '고에코',
        resultText: 'Hyperechoic pancreas; chronic pancreatitis or fibrosis suspected',
        resultTextKo: '고에코 췌장; 만성 췌장염 또는 섬유화 의심',
        ownerResultTextKo: '췌장이 밝게 변해 있습니다. 만성적인 염증이나 조직의 변성이 의심됩니다.',
        isAbnormal: true,
        severity: 'mild',
      },
      {
        value: 'mixed',
        label: 'Mixed / Heterogeneous',
        labelKo: '혼합/불균질',
        resultText: 'Heterogeneous pancreatic echogenicity; neoplasia or severe pancreatitis suspected',
        resultTextKo: '불균질 췌장 에코 음영; 종양 또는 중증 췌장염 의심',
        ownerResultTextKo: '췌장의 밝기가 일정하지 않고 불규칙합니다. 심한 염증이나 종양성 변화 가능성이 있습니다.',
        isAbnormal: true,
        severity: 'severe',
      },
    ],
  },

  {
    testID: 'pancreas_size',
    testName: 'Pancreatic Thickness',
    testNameKo: '췌장 두께',
    organ: 'pancreas',
    partOfOrgan: 'body',
    testType: 'range',
    unit: 'mm',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 1,
    note: 'Pancreatic body thickness. Dog: <10mm. Cat: <10mm at body.',
    normalRange: {
      dog: { max: 10 },
      cat: { max: 10 },
    },
    ranges: [
      {
        min: 0,
        max: 10,
        resultText: 'Pancreatic thickness within normal limits',
        resultTextKo: '췌장 두께 정상 범위',
        ownerResultTextKo: '췌장의 두께가 정상 범위 내에 있습니다.',
        isAbnormal: false,
      },
      {
        min: 10,
        max: 15,
        resultText: 'Mildly enlarged pancreas; early pancreatitis suspected',
        resultTextKo: '경미한 췌장 비대; 초기 췌장염 의심',
        ownerResultTextKo: '췌장이 약간 부어 있습니다. 췌장염 가능성이 있습니다.',
        isAbnormal: true,
        severity: 'mild',
      },
      {
        min: 15,
        max: null,
        resultText: 'Marked pancreatic enlargement; severe pancreatitis or neoplasia suspected',
        resultTextKo: '현저한 췌장 비대; 중증 췌장염 또는 종양 의심',
        ownerResultTextKo: '췌장이 매우 심하게 부어 있습니다. 심각한 췌장염이나 종양 확인이 필요합니다.',
        isAbnormal: true,
        severity: 'severe',
      },
    ],
  },

  {
    testID: 'peripancreatic_effusion',
    testName: 'Peripancreatic Effusion / Hyperechoic Mesentery',
    testNameKo: '췌장 주변 삼출 / 장간막 고에코',
    organ: 'pancreas',
    partOfOrgan: 'general',
    testType: 'boolean',
    clinicalSignificance: 'high',
    species: 'both',
    required: true,
    displayLevel: 1,
    positiveResultText: 'Peripancreatic free fluid and/or hyperechoic mesentery identified; pancreatitis strongly suspected',
    positiveResultTextKo: '췌장 주변 삼출액 및/또는 고에코 장간막 관찰; 췌장염 강력 의심',
    positiveOwnerResultTextKo: '췌장 주변에 물이 차 있거나 주변 지방 조직의 염증 반응이 관찰됩니다. 췌장염일 가능성이 매우 높습니다.',
    negativeResultText: 'No peripancreatic effusion',
    negativeResultTextKo: '췌장 주변 삼출액 없음',
    negativeOwnerResultTextKo: '췌장 주변에 특별한 액체 저류나 염증 소견이 보이지 않습니다.',
    positiveIsAbnormal: true,
  },

  {
    testID: 'pancreatic_duct_dilation',
    testName: 'Pancreatic Duct Dilation',
    testNameKo: '췌관 확장',
    organ: 'pancreas',
    partOfOrgan: 'body',
    testType: 'boolean',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 1,
    positiveResultText: 'Pancreatic duct dilation noted; chronic pancreatitis or pancreatic mass suspected',
    positiveResultTextKo: '췌관 확장 소견; 만성 췌장염 또는 췌장 종괴 의심',
    positiveOwnerResultTextKo: '췌장 내부의 관이 확장되어 있습니다. 만성적인 췌장염이나 혹에 의한 폐쇄 가능성이 있습니다.',
    negativeResultText: 'No pancreatic duct dilation',
    negativeResultTextKo: '췌관 확장 없음',
    negativeOwnerResultTextKo: '췌장 내부 관의 크기가 정상입니다.',
    positiveIsAbnormal: true,
  },

  // ── PANCREATIC MASS GROUP ─────────────────────────────────────────────────
  // [Level 1] 췌장 종괴 유무 (gate)
  {
    testID: 'pancreas_mass_presence',
    testName: 'Pancreatic Mass Presence',
    testNameKo: '췌장 종괴 유무',
    organ: 'pancreas',
    partOfOrgan: ['body', 'neck', 'tail'],
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 1,
    note: 'Distinct from diffuse enlargement; look for focal hypo/hyperechoic lesion',
    options: [
      {
        value: 'absent',
        label: 'No focal pancreatic mass',
        labelKo: '췌장 종괴 없음',
        resultText: 'No focal pancreatic mass identified',
        resultTextKo: '췌장 내 국소 종괴 관찰되지 않음',
        ownerResultTextKo: '췌장 내부에 혹이나 덩어리는 보이지 않습니다.',
        isAbnormal: false,
      },
      {
        value: 'present',
        label: 'Focal mass present',
        labelKo: '국소 종괴 있음',
        resultText: 'Focal pancreatic mass identified; see details below',
        resultTextKo: '췌장 내 국소 종괴 관찰; 세부 항목 참조',
        ownerResultTextKo: '췌장 내부에서 혹이나 덩어리 같은 변화가 관찰됩니다.',
        isAbnormal: true, severity: 'severe',
      },
    ],
  },

  // [Level 2] 종괴 위치 ← pancreas_mass_presence = 'present'
  {
    testID: 'pancreas_mass_location',
    testName: 'Pancreatic Mass Location',
    testNameKo: '췌장 종괴 위치',
    organ: 'pancreas',
    partOfOrgan: ['neck', 'body', 'tail'],
    testType: 'multiselect',
    clinicalSignificance: 'medium',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'pancreas_mass_presence', triggerValues: ['present'] },
    resultTemplate: 'Pancreatic mass location(s): {values}',
    resultTemplateKo: '췌장 종괴 위치: {values}',
    resultTemplateOwnerKo: '다음 부위에서 췌장 종괴(혹)가 확인됩니다: {values}',
    options: [
      {
        value: 'right_lobe',
        label: 'Right lobe / duodenal limb',
        labelKo: '우엽 / 십이지장 분지',
        resultText: '',
        resultTextKo: '',
        isAbnormal: true, severity: 'severe',
      },
      {
        value: 'body',
        label: 'Body',
        labelKo: '체부',
        resultText: '',
        resultTextKo: '',
        isAbnormal: true, severity: 'severe',
      },
      {
        value: 'left_lobe',
        label: 'Left lobe / splenic limb',
        labelKo: '좌엽 / 비장 분지',
        resultText: '',
        resultTextKo: '',
        isAbnormal: true, severity: 'severe',
      },
    ],
  },

  // [Level 2] 종괴 크기 ← pancreas_mass_presence = 'present'
  {
    testID: 'pancreas_mass_size',
    testName: 'Pancreatic Mass Size',
    testNameKo: '췌장 종괴 크기',
    organ: 'pancreas',
    partOfOrgan: ['body', 'neck', 'tail'],
    testType: 'range',
    unit: 'cm',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'pancreas_mass_presence', triggerValues: ['present'] },
    normalRange: { dog: { max: 0 }, cat: { max: 0 } },
    ranges: [
      {
        min: 0, max: 2,
        resultText: 'Small pancreatic mass <2 cm; insulinoma or focal pancreatitis suspected',
        resultTextKo: '2cm 미만 소형 췌장 종괴; 인슐린종 또는 국소 췌장염 의심',
        ownerResultTextKo: '2cm 미만의 작은 혹이 췌장에서 발견되었습니다. 인슐린종이나 부분적인 염증일 수 있습니다.',
        isAbnormal: true, severity: 'moderate',
      },
      {
        min: 2, max: null,
        resultText: 'Pancreatic mass ≥2 cm; exocrine pancreatic adenocarcinoma suspected; CT/biopsy recommended',
        resultTextKo: '2cm 이상 췌장 종괴; 외분비 췌장 선암종 의심; CT/생검 권장',
        ownerResultTextKo: '2cm 이상의 혹이 관찰됩니다. 악성 종양 가능성이 있어 정밀 검사가 강력히 권장됩니다.',
        isAbnormal: true, severity: 'severe',
      },
    ],
  },

  // [Level 2] 종괴 에코 ← pancreas_mass_presence = 'present'
  {
    testID: 'pancreas_mass_echogenicity',
    testName: 'Pancreatic Mass Echogenicity',
    testNameKo: '췌장 종괴 에코 음영',
    organ: 'pancreas',
    partOfOrgan: ['body', 'neck', 'tail'],
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'pancreas_mass_presence', triggerValues: ['present'] },
    options: [
      {
        value: 'hypoechoic',
        label: 'Hypoechoic',
        labelKo: '저에코',
        resultText: 'Hypoechoic pancreatic mass; exocrine adenocarcinoma or insulinoma suspected',
        resultTextKo: '저에코 췌장 종괴; 외분비 선암종 또는 인슐린종 의심',
        isAbnormal: true, severity: 'severe',
      },
      {
        value: 'mixed',
        label: 'Mixed / Cavitating',
        labelKo: '혼합/공동형성',
        resultText: 'Mixed or cavitating pancreatic mass; abscess or necrotic neoplasia suspected',
        resultTextKo: '혼합 또는 공동형성 췌장 종괴; 농양 또는 괴사성 종양 의심',
        isAbnormal: true, severity: 'severe',
      },
    ],
  },
];


// ══════════════════════════════════════════════
// 2-7. GI TRACT 위장관
// ══════════════════════════════════════════════

const giTractTests: UltrasoundTestItem[] = [

  {
    testID: 'gi_wall_thickness',
    testName: 'GI Wall Thickness',
    testNameKo: '위장관 벽 두께',
    organ: 'gi_tract',
    partOfOrgan: 'wall',
    testType: 'range',
    unit: 'mm',
    clinicalSignificance: 'high',
    species: 'both',
    required: true,
    displayLevel: 1,
    note: 'Stomach: dog <5mm, cat <4.5mm. Small intestine: dog <5mm, cat <2mm. Large intestine: <3mm.',
    normalRange: {
      dog: { max: 5 },
      cat: { max: 4.5 },
    },
    ranges: [
      {
        min: 0,
        max: 5,
        resultText: 'GI wall thickness within normal limits',
        resultTextKo: '위장관 벽 두께 정상 범위',
        ownerResultTextKo: '위장관(위/장) 벽의 두께가 정상입니다.',
        isAbnormal: false,
      },
      {
        min: 5,
        max: 8,
        resultText: 'Mild GI wall thickening; inflammatory bowel disease or gastroenteritis suspected',
        resultTextKo: '경미한 위장관 벽 비후; 염증성 장질환 또는 위장염 의심',
        ownerResultTextKo: '위장관 벽이 약간 두꺼워져 있습니다. 만성 장염이나 일시적인 염증 가능성이 있습니다.',
        isAbnormal: true,
        severity: 'mild',
      },
      {
        min: 8,
        max: null,
        resultText: 'Marked GI wall thickening (>8mm); neoplasia (lymphoma, adenocarcinoma) or severe IBD suspected',
        resultTextKo: '현저한 위장관 벽 비후(>8mm); 종양 (림프종, 선암종) 또는 중증 염증성 장질환 의심',
        ownerResultTextKo: '위장관 벽이 매우 두껍게 부어 있습니다. 종양이나 심각한 장염 가능성을 확인해야 합니다.',
        isAbnormal: true,
        severity: 'severe',
      },
    ],
  },

  {
    testID: 'gi_wall_layering',
    testName: 'GI Wall Layering',
    testNameKo: '위장관 벽 층구조',
    organ: 'gi_tract',
    partOfOrgan: 'wall',
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: true,
    displayLevel: 1,
    options: [
      {
        value: 'preserved',
        label: 'Normal 5-layer preserved',
        labelKo: '정상 5층 구조 보존',
        resultText: 'GI wall 5-layer structure preserved',
        resultTextKo: '위장관 벽 5층 구조 보존',
        ownerResultTextKo: '위장관의 벽 구조가 아주 뚜렷하고 건강하게 보입니다.',
        isAbnormal: false,
      },
      {
        value: 'indistinct',
        label: 'Indistinct layers',
        labelKo: '층구조 불명확',
        resultText: 'GI wall layering indistinct; infiltrative disease or severe inflammation suspected',
        resultTextKo: '위장관 벽 층구조 불명확; 침윤성 질환 또는 중증 염증 의심',
        ownerResultTextKo: '위장관 벽의 층 구분이 흐릿해졌습니다. 염증이나 세포 침윤이 의심됩니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
      {
        value: 'obliterated',
        label: 'Obliterated (loss of layering)',
        labelKo: '층구조 소실',
        resultText: 'GI wall layering obliterated; neoplasia (lymphoma, carcinoma) strongly suspected',
        resultTextKo: '위장관 벽 층구조 소실; 종양 (림프종, 암종) 강력 의심',
        ownerResultTextKo: '위장관 벽의 층 구조가 완전히 파괴되었습니다. 종양성 변화 가능성이 매우 높습니다.',
        isAbnormal: true,
        severity: 'severe',
      },
    ],
  },

  {
    testID: 'gi_motility',
    testName: 'GI Motility',
    testNameKo: '위장관 운동성',
    organ: 'gi_tract',
    partOfOrgan: 'general',
    testType: 'select',
    clinicalSignificance: 'medium',
    species: 'both',
    required: false,
    displayLevel: 1,
    options: [
      {
        value: 'normal',
        label: 'Normal peristalsis',
        labelKo: '정상 연동운동',
        resultText: 'GI motility normal',
        resultTextKo: '위장관 운동성 정상',
        ownerResultTextKo: '음식물을 밀어내는 장의 운동이 아주 활발하고 정상적입니다.',
        isAbnormal: false,
      },
      {
        value: 'hypomotility',
        label: 'Hypomotility / Ileus',
        labelKo: '저운동성/마비성 장폐색',
        resultText: 'GI hypomotility or ileus; obstruction or severe systemic disease suspected',
        resultTextKo: '위장관 저운동성 또는 마비성 장폐색; 폐쇄 또는 중증 전신 질환 의심',
        ownerResultTextKo: '장의 운동이 매우 떨어져 있거나 멈춘 상태입니다. 장폐색 가능성이 있습니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
      {
        value: 'hypermotility',
        label: 'Hypermotility',
        labelKo: '과운동성',
        resultText: 'GI hypermotility; enteritis suspected',
        resultTextKo: '위장관 과운동성; 장염 의심',
        ownerResultTextKo: '장의 운동이 비정상적으로 빠릅니다. 장염에 의한 설사 증상이 있을 수 있습니다.',
        isAbnormal: true,
        severity: 'mild',
      },
    ],
  },

  // ── GI FOREIGN BODY GROUP ────────────────────────────────────────────────
  // [Level 1] 이물/폐쇄 유무 (gate)
  {
    testID: 'gi_foreign_body',
    testName: 'GI Foreign Body / Obstruction',
    testNameKo: '위장관 이물/폐쇄',
    organ: 'gi_tract',
    partOfOrgan: 'lumen',
    testType: 'boolean',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 1,
    positiveResultText: 'Intraluminal foreign body or mechanical obstruction identified; corrugation pattern or proximal dilation present',
    positiveResultTextKo: '위장관 내강 이물 또는 기계적 폐쇄 관찰; 주름 패턴 또는 근위부 확장 동반',
    positiveOwnerResultTextKo: '위장관 내부에서 이물질(먹어서는 안 되는 물건)이나 장이 막힌 소견이 관찰됩니다.',
    negativeResultText: 'No GI foreign body or obstruction identified',
    negativeResultTextKo: '위장관 이물/폐쇄 없음',
    negativeOwnerResultTextKo: '위장관 내부에서 특별한 이물질이나 막힌 곳은 보이지 않습니다.',
    positiveIsAbnormal: true,
  },

  // [Level 2] 이물 위치 ← gi_foreign_body = 'true'
  {
    testID: 'gi_fb_location',
    testName: 'GI Foreign Body Location',
    testNameKo: '위장관 이물 위치',
    organ: 'gi_tract',
    partOfOrgan: 'lumen',
    testType: 'multiselect',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'gi_foreign_body', triggerValues: ['true'] },
    resultTemplate: 'GI foreign body location(s): {values}',
    resultTemplateKo: '위장관 이물 위치: {values}',
    resultTemplateOwnerKo: '다음 부위에서 이물질이 확인됩니다: {values}',
    options: [
      {
        value: 'stomach',
        label: 'Stomach',
        labelKo: '위',
        resultText: '',
        resultTextKo: '',
        isAbnormal: true, severity: 'moderate',
      },
      {
        value: 'duodenum',
        label: 'Duodenum',
        labelKo: '십이지장',
        resultText: '',
        resultTextKo: '',
        isAbnormal: true, severity: 'severe',
      },
      {
        value: 'jejunum_ileum',
        label: 'Jejunum / Ileum',
        labelKo: '공장/회장',
        resultText: '',
        resultTextKo: '',
        isAbnormal: true, severity: 'severe',
      },
      {
        value: 'colon',
        label: 'Colon',
        labelKo: '결장',
        resultText: '',
        resultTextKo: '',
        isAbnormal: true, severity: 'moderate',
      },
    ],
  },

  // [Level 2] 이물 에코 특성 ← gi_foreign_body = 'true'
  {
    testID: 'gi_fb_echogenicity',
    testName: 'GI Foreign Body Acoustic Character',
    testNameKo: '위장관 이물 음향 특성',
    organ: 'gi_tract',
    partOfOrgan: 'lumen',
    testType: 'select',
    clinicalSignificance: 'medium',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'gi_foreign_body', triggerValues: ['true'] },
    options: [
      {
        value: 'shadowing',
        label: 'Hyperechoic with acoustic shadowing (mineral/bone/metal)',
        labelKo: '고에코 + 음향 음영 (광물/뼈/금속)',
        resultText: 'Hyperechoic foreign body with acoustic shadowing; mineral, bone, or metal suspected',
        resultTextKo: '음향 음영을 동반한 고에코 이물; 광물, 뼈 또는 금속 의심',
        ownerResultTextKo: '뼈, 금속, 돌 같은 단단한 물체가 관찰됩니다.',
        isAbnormal: true, severity: 'moderate',
      },
      {
        value: 'reverberation',
        label: 'Reverberation artefact (gas-producing / linear)',
        labelKo: '반향 허상 (가스 발생/선형 이물)',
        resultText: 'Foreign body with reverberation artefact; linear or gas-producing material suspected',
        resultTextKo: '반향 허상을 동반한 이물; 선형 이물 또는 가스 발생 이물 의심',
        ownerResultTextKo: '끈이나 가스를 포함한 이물질이 의심됩니다. 선형 이물의 경우 장 꼬임 위험이 큽니다.',
        isAbnormal: true, severity: 'severe',
      },
      {
        value: 'soft_tissue',
        label: 'Soft tissue / Mixed (fabric/food)',
        labelKo: '연조직/혼합 (섬유/음식물)',
        resultText: 'Soft tissue density foreign body; fabric, food material, or bezoar suspected',
        resultTextKo: '연조직 밀도 이물; 섬유, 음식물 또는 모구 의심',
        ownerResultTextKo: '헝겊, 음식물 덩어리, 털뭉치(모구) 같은 이물이 의심됩니다.',
        isAbnormal: true, severity: 'moderate',
      },
    ],
  },

  // ── GI MURAL MASS GROUP ───────────────────────────────────────────────────
  // [Level 1] 위장관 벽 내 종괴 유무 (gate)
  {
    testID: 'gi_mass_presence',
    testName: 'GI Mural / Intraluminal Mass Presence',
    testNameKo: '위장관 벽 내/내강 종괴 유무',
    organ: 'gi_tract',
    partOfOrgan: 'wall',
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 1,
    note: 'Distinct from diffuse wall thickening; focal mural or intraluminal lesion',
    options: [
      {
        value: 'absent',
        label: 'No focal GI mass',
        labelKo: '위장관 종괴 없음',
        resultText: 'No focal GI mural or intraluminal mass identified',
        resultTextKo: '위장관 내 국소 종괴 관찰되지 않음',
        isAbnormal: false,
      },
      {
        value: 'present',
        label: 'Focal mass present',
        labelKo: '국소 종괴 있음',
        resultText: 'Focal GI mural or intraluminal mass identified; see details below',
        resultTextKo: '위장관 내 국소 종괴 관찰; 세부 항목 참조',
        isAbnormal: true, severity: 'severe',
      },
    ],
  },

  // [Level 2] 종괴 위치 ← gi_mass_presence = 'present'
  {
    testID: 'gi_mass_location',
    testName: 'GI Mass Location',
    testNameKo: '위장관 종괴 위치',
    organ: 'gi_tract',
    partOfOrgan: 'wall',
    testType: 'multiselect',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'gi_mass_presence', triggerValues: ['present'] },
    resultTemplate: 'GI mass location(s): {values}',
    resultTemplateKo: '위장관 종괴 위치: {values}',
    resultTemplateOwnerKo: '다음 부위에서 종괴(혹)가 관찰됩니다: {values}',
    options: [
      {
        value: 'stomach',
        label: 'Stomach',
        labelKo: '위',
        resultText: '',
        resultTextKo: '',
        isAbnormal: true, severity: 'severe',
      },
      {
        value: 'small_intestine',
        label: 'Small intestine',
        labelKo: '소장',
        resultText: '',
        resultTextKo: '',
        isAbnormal: true, severity: 'severe',
      },
      {
        value: 'large_intestine',
        label: 'Large intestine',
        labelKo: '대장',
        resultText: '',
        resultTextKo: '',
        isAbnormal: true, severity: 'severe',
      },
    ],
  },

  // [Level 2] 종괴 크기 ← gi_mass_presence = 'present'
  {
    testID: 'gi_mass_size',
    testName: 'GI Mass Size',
    testNameKo: '위장관 종괴 크기',
    organ: 'gi_tract',
    partOfOrgan: 'wall',
    testType: 'range',
    unit: 'cm',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'gi_mass_presence', triggerValues: ['present'] },
    normalRange: { dog: { max: 0 }, cat: { max: 0 } },
    ranges: [
      {
        min: 0, max: 2,
        resultText: 'Small GI mass <2 cm; biopsy recommended for definitive diagnosis',
        resultTextKo: '2cm 미만 소형 위장관 종괴; 확진을 위한 생검 권장',
        ownerResultTextKo: '2cm 미만의 작은 혹이 위장관에서 관찰됩니다. 정밀 검사가 필요합니다.',
        isAbnormal: true, severity: 'moderate',
      },
      {
        min: 2, max: null,
        resultText: 'GI mass ≥2 cm; malignant neoplasia likely; surgical evaluation and biopsy recommended',
        resultTextKo: '2cm 이상 위장관 종괴; 악성 종양 가능성 높음; 외과적 평가 및 생검 권장',
        ownerResultTextKo: '2cm 이상의 큰 종괴가 관찰됩니다. 악성 종양 가능성을 배제할 수 없어 적극적인 치료가 권장됩니다.',
        isAbnormal: true, severity: 'severe',
      },
    ],
  },
];


// ══════════════════════════════════════════════
// 2-8. ADRENAL GLANDS 부신
// ══════════════════════════════════════════════

const adrenalTests: UltrasoundTestItem[] = [
  {
    testID: 'organ_absent_reason',
    testName: 'Reason for Absence',
    testNameKo: '장기 결손/적출 사유',
    organ: 'left_adrenal', // Placeholder
    partOfOrgan: 'general',
    testType: 'select',
    clinicalSignificance: 'medium',
    species: 'both',
    required: false,
    displayLevel: 1,
    dependsOn: { testID: 'organ_status', triggerValues: ['absent'] },
    options: [
      { value: 'surgical_removal', label: 'Surgical removal', labelKo: '수술적 적출', resultText: 'Previously removed surgically', resultTextKo: '기존 수술을 통해 적출됨', isAbnormal: true },
      { value: 'congenital_absence', label: 'Congenital absence / Agenesis', labelKo: '선천적 결손', resultText: 'Congenital absence / agenesis', resultTextKo: '선천적 결손/미발달', isAbnormal: true },
      { value: 'not_identified', label: 'Not identified (Gas, etc.)', labelKo: '관찰 불가 (가스 등)', resultText: 'Not identified on ultrasound', resultTextKo: '초음파상 관찰되지 않음', isAbnormal: true },
      { value: 'ectopic', label: 'Ectopic location', labelKo: '이소성 위치', resultText: 'Ectopic location suspected', resultTextKo: '이소성 위치 의심', isAbnormal: true },
    ],
  },

  {
    testID: 'adrenal_size',
    testName: 'Adrenal Gland Thickness (Width)',
    testNameKo: '부신 두께',
    organ: 'adrenal',
    partOfOrgan: 'bilateral',
    testType: 'range',
    unit: 'mm',
    clinicalSignificance: 'high',
    species: 'both',
    required: true,
    displayLevel: 1,
    note: 'Measure the width (pole-to-pole). Dog: <7.4mm. Cat: <4.3mm.',
    normalRange: {
      dog: { max: 7.4 },
      cat: { max: 4.3 },
    },
    ranges: [
      {
        min: 0,
        max: 7.4,
        resultText: 'Adrenal gland size within normal limits',
        resultTextKo: '부신 크기 정상 범위',
        ownerResultTextKo: '부신의 크기가 정상 범위 내에 있습니다.',
        isAbnormal: false,
      },
      {
        min: 7.4,
        max: 15,
        resultText: 'Adrenal gland enlargement; hyperadrenocorticism (pituitary-dependent) or early neoplasia suspected',
        resultTextKo: '부신 비대; 뇌하수체 의존성 부신피질 기능항진증 또는 초기 종양 의심',
        ownerResultTextKo: '부신이 커져 있습니다. 부신피질 기능항진증(쿠싱)이나 초기 종양 가능성이 있어 관련 검사가 필요할 수 있습니다.',
        isAbnormal: true,
        severity: 'mild',
      },
      {
        min: 15,
        max: null,
        resultText: 'Marked adrenal enlargement (>15mm); adrenal tumour (adenoma/carcinoma) suspected',
        resultTextKo: '현저한 부신 비대(>15mm); 부신 종양 (선종/암종) 의심',
        ownerResultTextKo: '부신이 매우 심하게 커져 있습니다. 부신 종양(혹) 가능성이 매우 높습니다.',
        isAbnormal: true,
        severity: 'severe',
      },
    ],
  },

  {
    testID: 'adrenal_shape',
    testName: 'Adrenal Gland Shape',
    testNameKo: '부신 형태',
    organ: 'adrenal',
    partOfOrgan: 'bilateral',
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: true,
    displayLevel: 1,
    options: [
      {
        value: 'normal_bilobed',
        label: 'Normal peanut/bilobed shape',
        labelKo: '정상 땅콩/이엽 형태',
        resultText: 'Adrenal gland morphology normal (peanut-shaped)',
        resultTextKo: '부신 형태 정상 (땅콩 모양)',
        ownerResultTextKo: '부신이 정상적인 땅콩 모양을 유지하고 있습니다.',
        isAbnormal: false,
      },
      {
        value: 'rounded',
        label: 'Rounded / Spherical',
        labelKo: '둥근/구형',
        resultText: 'Rounded adrenal gland; neoplasia suspected',
        resultTextKo: '둥근 형태의 부신; 종양 의심',
        ownerResultTextKo: '부신이 둥글게 변해 있습니다. 종양성 변화에 대한 주의가 필요합니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
      {
        value: 'irregular_mass',
        label: 'Irregular mass',
        labelKo: '불규칙한 종괴',
        resultText: 'Irregular adrenal mass; adrenocortical carcinoma or phaeochromocytoma suspected',
        resultTextKo: '불규칙한 부신 종괴; 부신피질암종 또는 갈색세포종 의심',
        ownerResultTextKo: '부신에 불규칙한 혹(종괴)이 관찰됩니다. 악성 종양 가능성을 확인해야 합니다.',
        isAbnormal: true,
        severity: 'severe',
      },
    ],
  },

  {
    testID: 'adrenal_asymmetry',
    testName: 'Adrenal Asymmetry',
    testNameKo: '부신 비대칭',
    organ: 'adrenal',
    partOfOrgan: 'bilateral',
    testType: 'boolean',
    clinicalSignificance: 'high',
    species: 'both',
    required: true,
    displayLevel: 1,
    positiveResultText: 'Unilateral adrenal enlargement (asymmetry); adrenal-dependent hyperadrenocorticism or unilateral adrenal neoplasia suspected',
    positiveResultTextKo: '일측성 부신 비대 (비대칭); 부신 의존성 부신피질 기능항진증 또는 일측성 부신 종양 의심',
    positiveOwnerResultTextKo: '양쪽 부신의 크기가 다릅니다. 한쪽 부신에 종양이나 기능 이상이 있을 가능성이 있습니다.',
    negativeResultText: 'Bilateral adrenal glands symmetrical',
    negativeResultTextKo: '양측 부신 대칭',
    negativeOwnerResultTextKo: '양쪽 부신의 크기가 대칭적이고 정상입니다.',
    positiveIsAbnormal: true,
  },

  // ── ADRENAL MASS GROUP ────────────────────────────────────────────────────
  // Triggered when adrenal_shape = 'rounded' or 'irregular_mass'
  // [Level 2] 부신 종괴 크기
  {
    testID: 'adrenal_mass_size',
    testName: 'Adrenal Mass Size',
    testNameKo: '부신 종괴 크기',
    organ: 'adrenal',
    partOfOrgan: 'bilateral',
    testType: 'range',
    unit: 'mm',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'adrenal_shape', triggerValues: ['rounded', 'irregular_mass'] },
    normalRange: { dog: { max: 0 }, cat: { max: 0 } },
    ranges: [
      {
        min: 0, max: 20,
        resultText: 'Adrenal mass <20mm; adenoma or pheochromocytoma possible; endocrine evaluation recommended',
        resultTextKo: '20mm 미만 부신 종괴; 선종 또는 갈색세포종 가능; 내분비 평가 권장',
        ownerResultTextKo: '부신에 2cm 미만의 작은 혹(종괴)이 관찰됩니다. 양성 선종이나 기능성 종양 가능성이 있어 추가적인 호르몬 검사가 권장됩니다.',
        isAbnormal: true, severity: 'moderate',
      },
      {
        min: 20, max: 40,
        resultText: 'Adrenal mass 20–40mm; adrenocortical carcinoma or pheochromocytoma suspected',
        resultTextKo: '20-40mm 부신 종괴; 부신피질암종 또는 갈색세포종 의심',
        ownerResultTextKo: '부신에 2~4cm 크기의 혹이 관찰됩니다. 악성 종양 가능성이 있어 정밀한 평가가 필요합니다.',
        isAbnormal: true, severity: 'severe',
      },
      {
        min: 40, max: null,
        resultText: 'Large adrenal mass >40mm; malignant adrenal neoplasia; vascular invasion evaluation required',
        resultTextKo: '40mm 초과 대형 부신 종괴; 악성 부신 종양; 혈관 침습 평가 필요',
        ownerResultTextKo: '부신에 4cm 이상의 큰 혹이 관찰됩니다. 악성 종양 가능성이 매우 높으며 주변 혈관 침습 여부에 대한 추가 검사가 반드시 필요합니다.',
        isAbnormal: true, severity: 'severe',
      },
    ],
  },

  // [Level 2] 부신 종괴 에코 음영
  {
    testID: 'adrenal_mass_echogenicity',
    testName: 'Adrenal Mass Echogenicity',
    testNameKo: '부신 종괴 에코 음영',
    organ: 'adrenal',
    partOfOrgan: 'bilateral',
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'adrenal_shape', triggerValues: ['rounded', 'irregular_mass'] },
    options: [
      {
        value: 'homogeneous_hypo',
        label: 'Homogeneous hypoechoic',
        labelKo: '균질 저에코',
        resultText: 'Homogeneous hypoechoic adrenal mass; adenoma suspected',
        resultTextKo: '균질 저에코 부신 종괴; 선종 의심',
        ownerResultTextKo: '부신의 혹이 내부적으로 균일하고 어둡게 보입니다. 비교적 얌전한 선종일 가능성이 있습니다.',
        isAbnormal: true, severity: 'moderate',
      },
      {
        value: 'heterogeneous',
        label: 'Heterogeneous / Mixed',
        labelKo: '불균질/혼합',
        resultText: 'Heterogeneous adrenal mass; pheochromocytoma or carcinoma suspected',
        resultTextKo: '불균질 부신 종괴; 갈색세포종 또는 암종 의심',
        ownerResultTextKo: '부신의 혹 내부가 불규칙하고 지저분하게 보입니다. 공격적인 종양일 가능성을 고려해야 합니다.',
        isAbnormal: true, severity: 'severe',
      },
      {
        value: 'mineralised',
        label: 'Mineralised (with shadowing)',
        labelKo: '석회화 동반',
        resultText: 'Mineralised adrenal mass with acoustic shadowing; chronic haematoma or carcinoma suspected',
        resultTextKo: '음향 음영을 동반한 석회화 부신 종괴; 만성 혈종 또는 암종 의심',
        ownerResultTextKo: '부신의 혹 내부에 딱딱한 석회 성분이 관찰됩니다. 오래된 혈종이거나 종양성 변화일 수 있습니다.',
        isAbnormal: true, severity: 'severe',
      },
    ],
  },

  // [Level 2] 혈관 침습 ← adrenal_shape = 'rounded' or 'irregular_mass'
  {
    testID: 'adrenal_vascular_invasion',
    testName: 'Adrenal Mass — Vascular Invasion',
    testNameKo: '부신 종괴 혈관 침습',
    organ: 'adrenal',
    partOfOrgan: 'bilateral',
    testType: 'boolean',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 2,
    dependsOn: { testID: 'adrenal_shape', triggerValues: ['rounded', 'irregular_mass'] },
    note: 'Check for caudal vena cava (CVC) invasion — increases surgical risk significantly',
    positiveResultText: 'Vascular invasion (CVC or aorta) identified; surgical risk high; CT/MRI recommended',
    positiveResultTextKo: '혈관 침습(후대정맥 또는 대동맥) 관찰; 수술 위험도 높음; CT/MRI 권장',
    positiveOwnerResultTextKo: '부신의 혹이 주변의 큰 혈관(대정맥 등)을 파고든 것이 관찰됩니다. 수술 위험도가 매우 높으며 CT 등의 정밀 검사가 필요합니다.',
    negativeResultText: 'No vascular invasion identified',
    negativeResultTextKo: '혈관 침습 없음',
    negativeOwnerResultTextKo: '부신의 혹이 주변 큰 혈관을 침습한 흔적은 아직 보이지 않습니다.',
    positiveIsAbnormal: true,
  },
];


// ══════════════════════════════════════════════
// 2-9. LYMPH NODES 림프절
// ══════════════════════════════════════════════

const lymphNodeTests: UltrasoundTestItem[] = [
  {
    testID: 'ln_location',
    testName: 'Target Lymph Nodes',
    testNameKo: '대상 림프절 위치',
    organ: 'lymph_node',
    partOfOrgan: 'general',
    testType: 'multiselect',
    clinicalSignificance: 'medium',
    species: 'both',
    required: true,
    displayLevel: 1,
    resultTemplate: 'Observed Lymph Nodes: {values}',
    resultTemplateKo: '대상 림프절 위치: {values}',
    resultTemplateOwnerKo: '다음 위치의 림프절들을 확인했습니다: {values}',
    options: [
      { value: 'jejunal', label: 'Jejunal', labelKo: '공장', resultText: '', resultTextKo: '', isAbnormal: false },
      { value: 'medial_iliac', label: 'Medial Iliac', labelKo: '내장골', resultText: '', resultTextKo: '', isAbnormal: false },
      { value: 'hypogastric', label: 'Hypogastric', labelKo: '하복부', resultText: '', resultTextKo: '', isAbnormal: false },
      { value: 'colic', label: 'Colic', labelKo: '결장', resultText: '', resultTextKo: '', isAbnormal: false },
      { value: 'portal', label: 'Portal', labelKo: '간문', resultText: '', resultTextKo: '', isAbnormal: false },
      { value: 'splenic', label: 'Splenic', labelKo: '비장', resultText: '', resultTextKo: '', isAbnormal: false },
      { value: 'gastric', label: 'Gastric', labelKo: '위', resultText: '', resultTextKo: '', isAbnormal: false },
      { value: 'pancreaticoduodenal', label: 'Pancreaticoduodenal', labelKo: '췌십이지장', resultText: '', resultTextKo: '', isAbnormal: false },
      { value: 'renal', label: 'Renal', labelKo: '신장', resultText: '', resultTextKo: '', isAbnormal: false },
      { value: 'aortic', label: 'Aortic', labelKo: '대동맥', resultText: '', resultTextKo: '', isAbnormal: false },
    ],
  },

  {
    testID: 'ln_enlargement',
    testName: 'Abdominal Lymph Node Enlargement',
    testNameKo: '복강 림프절 비대',
    organ: 'lymph_node',
    partOfOrgan: 'general',
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: true,
    displayLevel: 1,
    relatedTests: ['ln_echogenicity', 'ln_shape'],
    options: [
      {
        value: 'not_visible',
        label: 'Not visible / Normal size',
        labelKo: '관찰되지 않음 / 정상 크기',
        resultText: 'No significant abdominal lymph node enlargement',
        resultTextKo: '복강 림프절 유의미한 비대 없음',
        ownerResultTextKo: '복강 내 림프절이 붓지 않고 정상적인 크기입니다.',
        isAbnormal: false,
      },
      {
        value: 'mild',
        label: 'Mildly enlarged',
        labelKo: '경미한 비대',
        resultText: 'Mildly enlarged abdominal lymph node(s); reactive lymphadenopathy suspected',
        resultTextKo: '복강 림프절 경미한 비대; 반응성 림프절병증 의심',
        ownerResultTextKo: '복강 내 림프절이 약간 커져 있습니다. 염증 등에 의한 단순 반응일 수 있습니다.',
        isAbnormal: true,
        severity: 'mild',
      },
      {
        value: 'marked',
        label: 'Markedly enlarged',
        labelKo: '현저한 비대',
        resultText: 'Markedly enlarged abdominal lymph node(s); lymphoma or metastatic neoplasia suspected',
        resultTextKo: '복강 림프절 현저한 비대; 림프종 또는 전이성 종양 의심',
        ownerResultTextKo: '복강 내 림프절이 매우 크게 부어 있습니다. 종양(림프종 등)이나 다른 곳에서 암이 전이되었을 가능성이 높습니다.',
        isAbnormal: true,
        severity: 'severe',
      },
    ],
  },

  {
    testID: 'ln_echogenicity',
    testName: 'Lymph Node Echogenicity',
    testNameKo: '림프절 에코 음영',
    organ: 'lymph_node',
    partOfOrgan: 'general',
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 1,
    options: [
      {
        value: 'normal_hypoechoic',
        label: 'Normal (homogeneous, mildly hypoechoic)',
        labelKo: '정상 (균질, 경미하게 저에코)',
        resultText: 'Lymph node echogenicity normal',
        resultTextKo: '림프절 에코 음영 정상',
        ownerResultTextKo: '림프절 내부의 음영이 정상적입니다.',
        isAbnormal: false,
      },
      {
        value: 'hypoechoic_rounded',
        label: 'Hypoechoic and rounded',
        labelKo: '저에코 및 둥근 형태',
        resultText: 'Hypoechoic rounded lymph node; lymphoma suspected',
        resultTextKo: '저에코 둥근 림프절; 림프종 의심',
        ownerResultTextKo: '림프절이 매우 어둡게 보이고 동그랗게 부어 있습니다. 림프종 같은 종양성 변화가 강력히 의심됩니다.',
        isAbnormal: true,
        severity: 'severe',
      },
      {
        value: 'hyperechoic_heterogeneous',
        label: 'Hyperechoic / Heterogeneous',
        labelKo: '고에코/불균질',
        resultText: 'Heterogeneous lymph node; metastatic neoplasia or abscess suspected',
        resultTextKo: '불균질 림프절; 전이성 종양 또는 농양 의심',
        ownerResultTextKo: '림프절 내부가 얼룩덜룩하고 지저분하게 보입니다. 전이성 종양이나 농양(고름집) 가능성이 있습니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
    ],
  },

  {
    testID: 'ln_shape',
    testName: 'Lymph Node Shape',
    testNameKo: '림프절 형태',
    organ: 'lymph_node',
    partOfOrgan: 'general',
    testType: 'select',
    clinicalSignificance: 'medium',
    species: 'both',
    required: false,
    displayLevel: 1,
    options: [
      {
        value: 'elongated_normal',
        label: 'Elongated (normal L:W >2)',
        labelKo: '타원형 (정상 L:W >2)',
        resultText: 'Lymph node shape normal (elongated)',
        resultTextKo: '림프절 형태 정상 (타원형)',
        ownerResultTextKo: '림프절이 정상적인 길쭉한 타원형 모양을 유지하고 있습니다.',
        isAbnormal: false,
      },
      {
        value: 'rounded_abnormal',
        label: 'Rounded (L:W <2)',
        labelKo: '둥근 형태 (L:W <2)',
        resultText: 'Rounded lymph node shape (L:W ratio <2); neoplastic infiltration suspected',
        resultTextKo: '둥근 림프절 형태 (L:W 비 <2); 종양성 침윤 의심',
        ownerResultTextKo: '림프절이 정상적인 타원형을 잃고 동그랗게 변했습니다. 종양 세포의 침투 가능성이 있습니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
    ],
  },
];


// ══════════════════════════════════════════════
// 2-10. FREE FLUID 복강 내 유리액
// ══════════════════════════════════════════════

const freeFluідTests: UltrasoundTestItem[] = [

  {
    testID: 'free_fluid_presence',
    testName: 'Abdominal Free Fluid',
    testNameKo: '복강 내 유리액',
    organ: 'free_fluid',
    partOfOrgan: 'general',
    testType: 'boolean',
    clinicalSignificance: 'high',
    species: 'both',
    required: true,
    displayLevel: 1,
    relatedTests: ['free_fluid_amount', 'free_fluid_echogenicity', 'free_fluid_location'],
    positiveResultText: 'Abdominal free fluid identified',
    positiveResultTextKo: '복강 내 유리액 관찰',
    positiveOwnerResultTextKo: '복강 내부에 비정상적인 물(복수 등)이 고여 있는 것이 확인됩니다.',
    negativeResultText: 'No abdominal free fluid',
    negativeResultTextKo: '복강 내 유리액 없음',
    negativeOwnerResultTextKo: '복강 내부에 고인 물(복수)은 관찰되지 않습니다.',
    positiveIsAbnormal: true,
  },

  {
    testID: 'free_fluid_amount',
    testName: 'Free Fluid Amount',
    testNameKo: '유리액 양',
    organ: 'free_fluid',
    partOfOrgan: 'general',
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 1,
    options: [
      {
        value: 'trace',
        label: 'Trace (focal pocket)',
        labelKo: '미량 (국소적)',
        resultText: 'Trace amount of abdominal free fluid',
        resultTextKo: '소량의 복강 내 유리액 관찰',
        ownerResultTextKo: '아주 적은 양의 물이 특정 부위에 고여 있습니다.',
        isAbnormal: true,
        severity: 'mild',
      },
      {
        value: 'mild',
        label: 'Mild',
        labelKo: '경미',
        resultText: 'Mild abdominal free fluid',
        resultTextKo: '경미한 복강 내 유리액',
        ownerResultTextKo: '약간의 복수가 관찰됩니다.',
        isAbnormal: true,
        severity: 'mild',
      },
      {
        value: 'moderate',
        label: 'Moderate',
        labelKo: '중등도',
        resultText: 'Moderate abdominal free fluid (ascites)',
        resultTextKo: '중등도의 복강 내 유리액 (복수)',
        ownerResultTextKo: '복수가 어느 정도 고여 있어 원인 파악이 필요합니다.',
        isAbnormal: true,
        severity: 'moderate',
      },
      {
        value: 'marked',
        label: 'Marked',
        labelKo: '다량',
        resultText: 'Marked abdominal free fluid; portal hypertension, right-sided heart failure, hypoalbuminemia, or haemoabdomen suspected',
        resultTextKo: '다량의 복강 내 유리액; 문맥 고혈압, 우심부전, 저알부민혈증 또는 혈복강 의심',
        ownerResultTextKo: '매우 많은 양의 복수가 차 있습니다. 심장병, 간질환 또는 출혈 등 심각한 원인을 찾아야 합니다.',
        isAbnormal: true,
        severity: 'severe',
      },
    ],
  },

  {
    testID: 'free_fluid_echogenicity',
    testName: 'Free Fluid Echogenicity',
    testNameKo: '유리액 에코 음영',
    organ: 'free_fluid',
    partOfOrgan: 'general',
    testType: 'select',
    clinicalSignificance: 'high',
    species: 'both',
    required: false,
    displayLevel: 1,
    options: [
      {
        value: 'anechoic',
        label: 'Anechoic (transudate)',
        labelKo: '무에코 (여출액)',
        resultText: 'Anechoic abdominal free fluid consistent with transudate; hypoalbuminemia or portal hypertension suspected',
        resultTextKo: '무에코 복강 내 유리액; 여출액에 합당; 저알부민혈증 또는 문맥 고혈압 의심',
        ownerResultTextKo: '고여 있는 물이 깨끗하고 맑게 보입니다. 단백질 부족이나 순환 장애일 수 있습니다.',
        isAbnormal: true,
        severity: 'mild',
      },
      {
        value: 'echogenic',
        label: 'Echogenic (exudate/haemorrhage)',
        labelKo: '에코성 (삼출액/출혈)',
        resultText: 'Echogenic abdominal free fluid consistent with exudate or haemorrhage; haemoabdomen or septic peritonitis suspected',
        resultTextKo: '에코성 복강 내 유리액; 삼출액 또는 출혈에 합당; 혈복강 또는 패혈성 복막염 의심',
        ownerResultTextKo: '고여 있는 물이 탁하거나 입자가 보입니다. 염증(삼출액)이나 피(출혈)가 섞여 있을 가능성이 큽니다.',
        isAbnormal: true,
        severity: 'severe',
      },
      {
        value: 'mixed',
        label: 'Mixed / Fibrinous',
        labelKo: '혼합/섬유소성',
        resultText: 'Mixed echogenic abdominal free fluid with fibrin strands; septic peritonitis or chylous effusion suspected',
        resultTextKo: '섬유소 가닥을 동반한 혼합 에코성 복강 내 유리액; 패혈성 복막염 또는 유미성 삼출 의심',
        ownerResultTextKo: '고여 있는 물 내부에 찌꺼기가 섞여 있습니다. 심한 염증이나 감염성 복막염 등이 의심됩니다.',
        isAbnormal: true,
        severity: 'severe',
      },
    ],
  },
];


// ══════════════════════════════════════════════
// SECTION 3: IMPRESSION RULES (복합 소견 인상)
// ══════════════════════════════════════════════

export const impressionRules: ImpressionRule[] = [

  {
    ruleID: 'rule_hepatic_lipidosis',
    conditions: {
      liver_echogenicity: 'markedly_hyperechoic',
      liver_texture: 'fine',
    },
    impression: 'Diffuse hepatic lipidosis or vacuolar hepatopathy pattern',
    impressionKo: '미만성 간 지방증 또는 공포성 간증 패턴',
    differentials: ['Hepatic lipidosis', 'Steroid hepatopathy', 'Vacuolar hepatopathy', 'Hyperadrenocorticism'],
    differentialsKo: ['간 지방증', '스테로이드 간증', '공포성 간증', '부신피질 기능항진증'],
    recommendation: 'Hepatic cytology / biopsy; evaluate cortisol, bile acids, ALT, ALP',
    recommendationKo: '간 세포 검사 / 생검; 코르티솔, 담즙산, ALT, ALP 평가',
    severity: 'moderate',
  },

  {
    ruleID: 'rule_chronic_hepatopathy',
    conditions: {
      liver_echogenicity: ['mildly_hyperechoic', 'mixed'],
      liver_texture: 'coarse',
      liver_margin: 'irregular',
    },
    impression: 'Chronic hepatopathy / hepatic fibrosis pattern',
    impressionKo: '만성 간질환 / 간 섬유화 패턴',
    differentials: ['Chronic hepatitis', 'Hepatic fibrosis', 'Cirrhosis', 'Chronic toxin exposure'],
    differentialsKo: ['만성 간염', '간 섬유화', '간경변', '만성 독소 노출'],
    recommendation: 'Hepatic biopsy, liver function tests (bile acids, albumin, coagulation panel)',
    recommendationKo: '간 생검, 간 기능 검사 (담즙산, 알부민, 응고 패널)',
    severity: 'moderate',
  },

  {
    ruleID: 'rule_acute_pancreatitis',
    conditions: {
      pancreas_echogenicity: 'hypoechoic',
      peripancreatic_effusion: 'true',
    },
    impression: 'Acute pancreatitis pattern',
    impressionKo: '급성 췌장염 패턴',
    differentials: ['Acute pancreatitis', 'Pancreatic neoplasia with inflammation'],
    differentialsKo: ['급성 췌장염', '염증 동반 췌장 종양'],
    recommendation: 'cPLI/fPLI, supportive care; repeat ultrasound in 48-72h if severe',
    recommendationKo: 'cPLI/fPLI 검사, 지지 치료; 중증인 경우 48-72시간 후 재검',
    severity: 'severe',
  },

  {
    ruleID: 'rule_gallbladder_mucocele',
    conditions: {
      gb_content: 'mucocele',
    },
    impression: 'Gallbladder mucocele',
    impressionKo: '담낭 점액낭종',
    differentials: ['Gallbladder mucocele', 'Inspissated bile'],
    differentialsKo: ['담낭 점액낭종', '농축 담즙'],
    recommendation: 'Surgical consultation; cholecystectomy often indicated',
    recommendationKo: '외과적 상담; 담낭 절제술 고려 필요',
    severity: 'severe',
  },

  {
    ruleID: 'rule_ckd_advanced',
    conditions: {
      kidney_cortex_echogenicity: 'markedly_increased',
      kidney_cmd: 'absent',
    },
    impression: 'Advanced chronic kidney disease pattern',
    impressionKo: '진행성 만성 신장 질환 패턴',
    differentials: ['Advanced CKD', 'End-stage renal disease'],
    differentialsKo: ['진행성 만성 신장 질환', '말기 신부전'],
    recommendation: 'IRIS staging, serum creatinine, SDMA, urine protein:creatinine ratio',
    recommendationKo: 'IRIS 단계 평가, 혈청 크레아티닌, SDMA, 단백뇨/크레아티닌 비율',
    severity: 'severe',
  },

  {
    ruleID: 'rule_haemoabdomen',
    conditions: {
      free_fluid_presence: 'true',
      free_fluid_echogenicity: 'echogenic',
      spleen_size: ['splenomegaly_mild', 'splenomegaly_marked'],
    },
    impression: 'Haemoabdomen with splenic lesion; haemangiosarcoma strongly suspected',
    impressionKo: '비장 병변을 동반한 혈복강; 혈관육종 강력 의심',
    differentials: ['Splenic haemangiosarcoma', 'Nodular hyperplasia with rupture', 'Traumatic haemorrhage'],
    differentialsKo: ['비장 혈관육종', '파열을 동반한 결절성 과증식', '외상성 출혈'],
    recommendation: 'Emergency evaluation; CBC, coagulation, surgical consultation',
    recommendationKo: '응급 평가; CBC, 응고 검사, 외과적 상담',
    severity: 'critical',
  },

  {
    ruleID: 'rule_hyperadrenocorticism',
    conditions: {
      adrenal_size: 'mild',           // bilateral enlargement
      adrenal_asymmetry: 'false',     // symmetric = PDH
      liver_echogenicity: 'markedly_hyperechoic',
    },
    impression: 'Pituitary-dependent hyperadrenocorticism (PDH) pattern',
    impressionKo: '뇌하수체 의존성 부신피질 기능항진증 패턴',
    differentials: ['PDH (Cushing\'s disease)', 'Iatrogenic hyperadrenocorticism'],
    differentialsKo: ['뇌하수체 의존성 부신피질 기능항진증', '의원성 부신피질 기능항진증'],
    recommendation: 'LDDS/HDDS test, ACTH stimulation test, urine cortisol:creatinine ratio',
    recommendationKo: '저용량/고용량 덱사메타손 억제 검사, ACTH 자극 검사, 소변 코르티솔:크레아티닌 비율',
    severity: 'moderate',
  },

  {
    ruleID: 'rule_lymphoma',
    conditions: {
      ln_enlargement: 'marked',
      ln_echogenicity: 'hypoechoic_rounded',
      gi_wall_layering: 'obliterated',
    },
    impression: 'Multicentric or alimentary lymphoma pattern',
    impressionKo: '다발성 또는 소화기형 림프종 패턴',
    differentials: ['Alimentary lymphoma', 'Multicentric lymphoma', 'IBD with reactive lymphadenopathy'],
    differentialsKo: ['소화기형 림프종', '다발성 림프종', '반응성 림프절병증을 동반한 염증성 장질환'],
    recommendation: 'FNA of lymph node or GI wall, PARR, histopathology for classification',
    recommendationKo: '림프절 또는 위장관 벽 세침흡인, PARR, 분류를 위한 조직병리 검사',
    severity: 'severe',
  },
];


// ─────────────────────────────────────────────
// SECTION 4: ORGAN SECTIONS ASSEMBLY
// ─────────────────────────────────────────────

// helper: statusGate factory
function makeGate(organID: string, organNameEn: string, organNameKo: string, includeAbsent: boolean = false): OrganStatusGate {
  const options = [
    { value: 'normal',      label: 'Normal — no further evaluation needed', labelKo: '정상 — 추가 평가 불필요' },
    { value: 'abnormal',    label: 'Abnormal — evaluate sub-items',          labelKo: '이상 — 세부 항목 평가' },
  ];

  if (includeAbsent) {
    options.push({ value: 'absent', label: 'Absent / Removed', labelKo: '결손 / 적출됨' });
  }

  options.push({ value: 'not_examined', label: 'Not examined', labelKo: '검사 불가' });

  return {
    testID: `${organID}_status`,
    testName: `${organNameEn} — Overall Assessment`,
    testNameKo: `${organNameKo} 전반적 평가`,
    normalValue: 'normal',
    abnormalValue: 'abnormal',
    options: options,
  };
}

export const organSections: OrganSection[] = [
  {
    organ: 'liver',
    organName: 'Liver',
    organNameKo: '간',
    scanningOrder: 1,
    statusGate: makeGate('liver', 'Liver', '간'),
    tests: liverTests,
  },
  {
    organ: 'gallbladder',
    organName: 'Gallbladder & Biliary System',
    organNameKo: '담낭 및 담도계',
    scanningOrder: 2,
    statusGate: makeGate('gallbladder', 'Gallbladder', '담낭', true),
    tests: gallbladderTests,
  },
  {
    organ: 'spleen',
    organName: 'Spleen',
    organNameKo: '비장',
    scanningOrder: 3,
    statusGate: makeGate('spleen', 'Spleen', '비장', true),
    tests: spleenTests,
  },
  {
    organ: 'pancreas',
    organName: 'Pancreas',
    organNameKo: '췌장',
    scanningOrder: 4,
    statusGate: makeGate('pancreas', 'Pancreas', '췌장'),
    tests: pancreasTests,
  },
  {
    organ: 'left_kidney',
    organName: 'Left Kidney',
    organNameKo: '좌측 신장',
    scanningOrder: 5.1,
    statusGate: makeGate('left_kidney', 'Left Kidney', '좌측 신장', true),
    tests: kidneyTests.map(t => ({ ...t, organ: 'left_kidney' as Organ })),
  },
  {
    organ: 'right_kidney',
    organName: 'Right Kidney',
    organNameKo: '우측 신장',
    scanningOrder: 5.2,
    statusGate: makeGate('right_kidney', 'Right Kidney', '우측 신장', true),
    tests: kidneyTests.map(t => ({ ...t, organ: 'right_kidney' as Organ })),
  },
  {
    organ: 'urinary_bladder',
    organName: 'Urinary Bladder',
    organNameKo: '방광',
    scanningOrder: 6,
    statusGate: makeGate('urinary_bladder', 'Urinary Bladder', '방광'),
    tests: urinaryBladderTests,
  },
  {
    organ: 'left_adrenal',
    organName: 'Left Adrenal Gland',
    organNameKo: '좌측 부신',
    scanningOrder: 7.1,
    statusGate: makeGate('left_adrenal', 'Left Adrenal Gland', '좌측 부신', true),
    tests: adrenalTests.map(t => ({ ...t, organ: 'left_adrenal' as Organ })),
  },
  {
    organ: 'right_adrenal',
    organName: 'Right Adrenal Gland',
    organNameKo: '우측 부신',
    scanningOrder: 7.2,
    statusGate: makeGate('right_adrenal', 'Right Adrenal Gland', '우측 부신', true),
    tests: adrenalTests.map(t => ({ ...t, organ: 'right_adrenal' as Organ })),
  },
  {
    organ: 'gi_tract',
    organName: 'GI Tract',
    organNameKo: '위장관',
    scanningOrder: 8,
    statusGate: makeGate('gi_tract', 'GI Tract', '위장관'),
    tests: giTractTests,
  },
  {
    organ: 'lymph_node',
    organName: 'Abdominal Lymph Nodes',
    organNameKo: '복강 림프절',
    scanningOrder: 9,
    statusGate: makeGate('lymph_node', 'Abdominal Lymph Nodes', '복강 림프절'),
    tests: lymphNodeTests,
  },
  {
    organ: 'free_fluid',
    organName: 'Abdominal Free Fluid',
    organNameKo: '복강 내 유리액',
    scanningOrder: 10,
    statusGate: makeGate('free_fluid', 'Abdominal Free Fluid', '복강 내 유리액'),
    tests: freeFluідTests,
  },
];


// ─────────────────────────────────────────────
// SECTION 5: FULL REFERENCE EXPORT
// ─────────────────────────────────────────────

export const ultrasoundReference: UltrasoundReference = {
  version: '1.0.0',
  lastUpdated: '2025-04-30',
  organs: organSections,
  impressionRules,
};

export default ultrasoundReference;


// ─────────────────────────────────────────────
// SECTION 6: UTILITY FUNCTIONS
// ─────────────────────────────────────────────

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * UI VISIBILITY ENGINE
 * ─────────────────────────────────────────────────────────────────────────────
 * 사용법:
 *   const results: Record<string, string> = {};  // 유저 입력 상태
 *
 *   // 1. 장기 게이트 체크 (OrganSection 표시 여부)
 *   isOrganVisible(section, results)
 *     → liver_status = 'abnormal' 일 때 true
 *
 *   // 2. 개별 항목 표시 여부
 *   isTestVisible(test, results)
 *     → displayLevel=1: 항상 true (장기가 abnormal이면)
 *     → displayLevel=2: dependsOn 조건이 충족될 때 true
 *
 *   // 3. 전체 렌더링 순서
 *   for (section of organSections) {
 *     if (!isOrganVisible(section, results)) continue;
 *     for (test of section.tests) {
 *       if (!isTestVisible(test, results)) continue;
 *       renderTest(test);
 *     }
 *   }
 */

/**
 * 장기 섹션이 화면에 표시되어야 하는지 여부.
 * organ_status 가 abnormal 일 때 true.
 */
export function isOrganVisible(
  section: OrganSection,
  results: Record<string, string>
): boolean {
  const gateValue = results[section.statusGate.testID];
  return gateValue === section.statusGate.abnormalValue;
}

/**
 * 개별 검사 항목이 화면에 표시되어야 하는지 여부.
 * - displayLevel 1: dependsOn 없음 → 항상 true (장기 게이트 통과 후)
 * - displayLevel 2+: dependsOn 조건이 충족되어야 true
 * - dependsOn 배열: 모든 조건이 충족되어야 함 (AND)
 */
export function isTestVisible(
  test: UltrasoundTestItem,
  results: Record<string, any>
): boolean {
  // 장기 상태 가져오기 (results에 { [organ_status_id]: status } 가 포함되어 있다고 가정)
  const organStatusID = test.organ + '_status';
  const organStatus = results[organStatusID];

  if (!test.dependsOn) {
    // Level 1 항목은 기본적으로 'abnormal' 상태일 때만 표시
    // 'absent' 상태일 때는 dependsOn이 설정된 전용 항목들만 표시됨
    return organStatus === 'abnormal';
  }

  const deps = Array.isArray(test.dependsOn) ? test.dependsOn : [test.dependsOn];

  return deps.every((dep) => {
    let currentValue = results[dep.testID];
    
    // 'organ_status'는 특별한 키로 처리하여 현재 장기의 상태를 참조함
    if (dep.testID === 'organ_status') {
      currentValue = organStatus;
    }

    if (!currentValue) return false;
    const op = dep.operator ?? 'OR';
    if (op === 'OR') {
      return dep.triggerValues.includes(String(currentValue));
    } else {
      return dep.triggerValues.includes(String(currentValue));
    }
  });
}

/**
 * 특정 testID의 선택값에서 결과 텍스트를 반환
 */
export function getSelectResult(
  testID: string,
  selectedValue: string,
  lang: 'en' | 'ko' = 'ko'
): string | null {
  for (const section of organSections) {
    const test = section.tests.find((t) => t.testID === testID);
    if (!test) continue;
    if (test.testType === 'select' || test.testType === 'multiselect') {
      const option = test.options.find((o) => o.value === selectedValue);
      if (option) return lang === 'ko' ? option.resultTextKo : option.resultText;
    }
  }
  return null;
}

/**
 * 수치 입력값에 대해 range 결과 텍스트를 반환
 */
export function getRangeResult(
  testID: string,
  measuredValue: number,
  lang: 'en' | 'ko' = 'ko'
): string | null {
  for (const section of organSections) {
    const test = section.tests.find((t) => t.testID === testID);
    if (!test || test.testType !== 'range') continue;
    const segment = test.ranges.find(
      (r) =>
        (r.min === null || measuredValue >= r.min) &&
        (r.max === null || measuredValue < r.max)
    );
    if (segment) return lang === 'ko' ? segment.resultTextKo : segment.resultText;
  }
  return null;
}

/**
 * 검사 결과 Map을 기반으로 적용 가능한 임프레션 룰을 반환
 * results: { testID: selectedValue or 'true'/'false' }
 */
export function evaluateImpressionRules(
  results: Record<string, string>
): ImpressionRule[] {
  return impressionRules.filter((rule) => {
    return Object.entries(rule.conditions).every(([testID, expected]) => {
      const actual = results[testID];
      if (!actual) return false;
      if (Array.isArray(expected)) return expected.includes(actual);
      return actual === expected;
    });
  });
}

/**
 * 이상 소견만 필터링하여 최종 차트 문구 배열을 반환
 */
export function buildChartSummary(
  results: Record<string, string | number>,
  lang: 'en' | 'ko' = 'ko',
  targetOrgan?: Organ
): string[] {
  const lines: string[] = [];
  const processedTestIDs = new Set<string>();

  for (const section of organSections) {
    if (targetOrgan && section.organ !== targetOrgan) continue;

    for (const test of section.tests) {
      if (processedTestIDs.has(test.testID)) continue;
      if (!targetOrgan) processedTestIDs.add(test.testID);

      const val = results[test.testID];
      if (val === undefined || val === null) continue;

      let resultText = '';

      if (test.testType === 'select') {
        if (val === 'other') {
          resultText = (results[test.testID + '_other'] as string) || '';
        } else {
          const opt = test.options.find((o) => o.value === val);
          if (opt && opt.isAbnormal) {
            resultText = lang === 'ko' ? opt.resultTextKo : opt.resultText;
          }
        }
      } else if (test.testType === 'range' && typeof val === 'number') {
        const seg = test.ranges.find(
          (r) =>
            (r.min === null || val >= r.min) &&
            (r.max === null || val < r.max)
        );
        if (seg && seg.isAbnormal) {
          resultText = lang === 'ko' ? seg.resultTextKo : seg.resultText;
        }
      } else if (test.testType === 'boolean') {
        if (val === 'true' && test.positiveIsAbnormal) {
          resultText = lang === 'ko' ? test.positiveResultTextKo : test.positiveResultText;
        }
      } else if (test.testType === 'multiselect' && Array.isArray(val)) {
        const selectedOptions = test.options.filter(o => val.includes(o.value));
        const otherVal = val.includes('other') ? (results[test.testID + '_other'] as string) : '';

        if (selectedOptions.length > 0 || otherVal) {
          const labels = selectedOptions.map(o => (lang === 'ko' ? o.labelKo : o.label));
          if (otherVal) labels.push(otherVal);

          const template = lang === 'ko' ? test.resultTemplateKo : test.resultTemplate;
          
          if (template) {
            resultText = template.replace('{values}', labels.join(', '));
          } else {
            resultText = lang === 'ko' 
              ? `${test.testNameKo}: ${labels.join(', ')}` 
              : `${test.testName}: ${labels.join(', ')}`;
          }
        }
      }

      if (resultText) {
        lines.push(resultText);
      }
    }
  }
  return lines;
}
