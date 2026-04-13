// =============================================
// Echo Test 타입 정의
// keywordID: 유일 식별자 (절대 변경 금지)
// keywordName: 표시용 레이블 (자유롭게 변경 가능)
// =============================================

export const ECHO_SECTION_LIST = [
  'PE',
  'Radio',
  'Bmode',
  'Objective_Evaluation',
  'Pulmonary_Hypertension',
  'ColorDoppler',
  'SpectralDoppler',
  'TDI',
  'MINE_SCORE',
  'PosibilityOfPH',
  'HCM_Evaluation', // 고양이 전용 섹션 추가
  'General_Review'
] as const

export type EchoSection = (typeof ECHO_SECTION_LIST)[number]

export type Species = 'canine' | 'feline'

export type TestType =
  | 'other'
  | 'range'
  | 'select'
  | 'calculated'
  | 'calculated_string'
  | 'mmode_range'
  | 'mmode_formula' // 고양이 전용: allometric formula 방식
  | 'textcomment'

export type AnatomicGroup =
  | 'LV'
  | 'LA'
  | 'AO'
  | 'MV'
  | 'TV'
  | 'PA'
  | 'RV'
  | 'RA'
  | 'Pericardium'
  | 'Pleura'
  | 'TDI'
  | 'General'

export type FunctionalGroup =
  | 'MMVD_staging' // 개 전용
  | 'HCM_evaluation' // 고양이 전용
  | 'LA_size'
  | 'LA_pressure'
  | 'LV_size'
  | 'LV_systolic'
  | 'LV_diastolic'
  | 'MV_morphology'
  | 'MV_regurgitation'
  | 'AV_disease'
  | 'TV_disease'
  | 'Pulmonary_Hypertension'
  | 'PA_pressure'
  | 'PA_flow'
  | 'RV_function'
  | 'Effusion'
  | 'Physical_Exam'
  | 'Cardiomegaly'

// Functional Group 메타데이터 (Functional 탭 렌더링 순서 및 레이블)
export const FUNCTIONAL_GROUP_META: Record<FunctionalGroup, {
  label: string
  priority: number
  description: string
}> = {
  MMVD_staging:     { label: 'MMVD Staging',         
  priority: 1,  description: 'MMVD 병기 평가 (MINE score, ACVIM)' },
  HCM_evaluation:   { label: 'HCM Evaluation',        priority: 1,  description: '고양이 HCM 진단 및 평가' },
  LA_size:          { label: 'LA Size',                priority: 2,  description: '좌심방 크기' },
  LA_pressure:      { label: 'LA Pressure',            priority: 3,  description: '좌심방압 상승 여부' },
  LV_size:          { label: 'LV Size',                priority: 4,  description: '좌심실 크기 / Preload' },
  LV_systolic:      { label: 'LV Systolic Function',   priority: 5,  description: '좌심실 수축 기능' },
  LV_diastolic:     { label: 'LV Diastolic Function',  priority: 6,  description: '이완기능 장애 여부' },
  MV_morphology:    { label: 'MV Morphology',          priority: 7,  description: '승모판 구조 이상' },
  MV_regurgitation: { label: 'MV Regurgitation',       priority: 8,  description: 'MR 정도' },
  AV_disease:       { label: 'AV Disease',             priority: 9,  description: '대동맥판 협착 / 역류' },
  TV_disease:       { label: 'TV Disease',             priority: 10, description: '삼첨판 구조 및 역류' },
  Pulmonary_Hypertension:   { label: 'Pulmonary Hypertension',         priority: 11, description: '폐고혈압 가능성 종합' },
  PA_pressure:      { label: 'PA Pressure',            priority: 12, description: '폐동맥압 추정' },
  PA_flow:          { label: 'PA Flow Pattern',        priority: 13, description: 'PA 혈류 패턴 이상' },
  RV_function:      { label: 'RV Function',            priority: 14, description: '우심실 기능 / 형태' },
  Effusion:         { label: 'Effusion',               priority: 15, description: '심낭 / 흉강 삼출액' },
  Physical_Exam:    { label: 'Physical Exam',          priority: 16, description: '전신 활력징후' },
  Cardiomegaly:     { label: 'Cardiomegaly',           priority: 17, description: '방사선상 심비대' },
}

// Anatomic Group 메타데이터
export const ANATOMIC_GROUP_META: Record<AnatomicGroup, {
  label: string
  priority: number
}> = {
  General:     { label: 'General / PE',    priority: 1 },
  LV:          { label: 'LV',             priority: 2 },
  LA:          { label: 'LA',             priority: 3 },
  MV:          { label: 'MV',             priority: 4 },
  AO:          { label: 'AO / AV',        priority: 5 },
  PA:          { label: 'PA / PV',        priority: 6 },
  RV:          { label: 'RV / IVS',       priority: 7 },
  RA:          { label: 'RA / CVC',       priority: 8 },
  TV:          { label: 'TV',             priority: 9 },
  TDI:         { label: 'TDI',            priority: 10 },
  Pericardium: { label: 'Pericardium',    priority: 11 },
  Pleura:      { label: 'Pleura',         priority: 12 },
}

export type EchoFormula =
  | 'LVFS'
  | 'EF'
  | 'LVIDDN'
  | 'ESVI'
  | 'LAAOratio'
  | 'MV_EAratio'
  | 'LVEIO'
  | 'EIVRT'
  | 'EEm'
  | 'LAFS'
  | 'PG'
  | 'EmAm'
  | 'RApressure'
  | 'PApressure'
  | 'PAAO'
  | 'ATET'
  | 'RPADi'
  | 'MINE_LAAO'
  | 'MINE_LVIDDN'
  | 'MINE_FS'
  | 'MINE_Ewave'
  | 'MINE_score'
  | 'decreasedSizeOfLV'
  | 'anatomic_PAAO'
  | 'anatomic_PR_vel'
  | 'anatomic_RPADi'
  | 'anatomic_AT'
  | 'anatomic_ATET'
  | 'anatomic_number1'
  | 'anatomic_number2'
  | 'anatomic_number3'
  | 'anatomic_numbertotal'
  | 'PHprob'

// 모든 테스트 항목의 공통 기본 필드
type BaseTest = {
  keywordID: string
  keywordName: string
  species: Species[] // 적용 대상 종
  sections: EchoSection[]
  groups: string[]
  testref?: string // 정상 범위 표시용 (디스플레이 전용)
  testinfo?: string // 검사 항목 설명 (툴팁용)
  anatomic_groups?: AnatomicGroup[]
  functional_groups?: FunctionalGroup[]
  priority?: number // 노출 우선순위 (낮을수록 상단)
}

// 옵션 선택형 (예: none/anterior/posterior)
export type SelectTest = BaseTest & {
  testType: 'select'
  options: string[]
  optResult: string[]
  optComment: string[]
}

// 수치 범위 판정형 (thresholds 기반)
export type RangeTest = BaseTest & {
  testType: 'range'
  unit: string
  thresholds: number[]     // 경계값 배열 (e.g. [50, 70])
  optResult: string[]      // thresholds.length + 1 개
  optComment: string[]
}

// M-mode 체중별 참조값 기반 판정형
export type MmodeRangeTest = BaseTest & {
  testType: 'mmode_range'
  unit: string
  refTable: 'mmoderef_dog'
  optResult: ['decrease', 'normal', 'increase']
  optComment: [string, string, string]
}

export type MmodeRefKey = 'VSd' | 'LVd' | 'LVWd' | 'VSs' | 'LVs' | 'LVWs' | 'AO' | 'LA'

export type CatMmodeRefFormula = Record<
  MmodeRefKey,
  { a: number; b: number }
>

// 고양이 M-mode: allometric formula 방식
export type MmodeFormulaTest = BaseTest & {
  testType: 'mmode_formula'
  unit: string
  refFormula: string // 'mmoderef_cat' 등 formula key
  optResult: ['decrease', 'normal', 'increase']
  optComment: [string, string, string]
}

// 다른 필드로 자동 계산되는 파생 항목
export type CalculatedTest = BaseTest & {
  testType: 'calculated'
  unit: string
  formula: EchoFormula
  dependencies: string[]   // keywordID 배열
  thresholds: number[]
  optResult: string[]
  optComment: string[]
}

export type CalculatedTestString = BaseTest & {
  testType: 'calculated_string'
  unit: string
  formula: EchoFormula
  dependencies: string[]   // keywordID 배열
  thresholds: string[]
  optResult: string[]
  optComment: string[]
}

// 단순 수치 입력 (판정 없음)
export type OtherTest = BaseTest & {
  testType: 'other'
  unit: string
}

// 텍스트 코멘트 입력
export type TextCommentTest = BaseTest & {
  testType: 'textcomment'
}

export type EchoTest =
  | SelectTest
  | RangeTest
  | MmodeRangeTest
  | MmodeFormulaTest
  | CalculatedTest
  | OtherTest
  | TextCommentTest
  | CalculatedTestString

// =============================================
// 클라이언트에 전달하는 경량 UI 메타데이터
// (thresholds, optResult, optComment 등 해석 로직 제외)
// =============================================
export type EchoTestUIMeta = {
  keywordID: string
  keywordName: string
  species: Species[]
  sections: EchoSection[]
  groups: string[]
  testType: EchoTest['testType']
  unit?: string
  testref?: string // 정상 범위 표시용
  testinfo?: string // 검사항목 설명
  options?: string[] // select 타입용
  dependencies?: string[] // calculated 타입용 (의존 필드 렌더링)
  formula?: EchoFormula
  anatomic_groups?: AnatomicGroup[]
  functional_groups?: FunctionalGroup[]
  priority?: number
  refTable?: string
  refFormula?: string
}

// ============================================================
// Layout Types
// ============================================================

export type GroupConfig = {
  groupID: string
  label: string
}

export type SectionConfig = {
  sectionID: string
  label: string
  groups: GroupConfig[]
}

export type LayoutConfig = {
  species: Species
  sections: SectionConfig[] // Section 탭용
  anatomicGroups: GroupConfig[] // Anatomic 탭용
  functionalGroups: GroupConfig[] // Functional 탭용
}

// =============================================
// echo_charts 테이블 타입
// =============================================
export type EchoChart = {
  id: string
  hos_id: string
  patient_id: string
  vet_id: string | null
  examiner_id: string | null
  exam_date: string
  memo: string | null
  user_tags: string | null
  tags: string | null
  template_id: string | null
  created_at: string
  updated_at: string
}

// =============================================
// echo_results 테이블 타입
// =============================================
export type EchoResult = {
  id: string
  echo_chart_id: string
  keyword_id: string
  value: string | null
  result: string | null
  comment: string | null
  created_at: string
}

// =============================================
// echo_templates 테이블 타입
// =============================================
export type EchoTemplate = {
  id: string
  hos_id: string
  name: string
  template_species: Species
  description: string | null
  section_order: EchoSection[]
  item_order: Record<string, string[]>    // 섹션별 keywordID 순서 + '_flat' 키로 목록 모드 전역 순서
  active_items: Partial<Record<EchoSection, string[]>>  // 섹션별 활성 keywordID 목록
  is_default: boolean
  display_order: number
  created_at: string
  updated_at: string
}

// =============================================
// echo_template_guide_images 테이블 타입
// =============================================
export type EchoTemplateGuideImage = {
  id: string
  template_id: string
  view_name: string
  image_url: string
  mapped_keywords: string[]  // keywordID 배열
  display_order: number
  created_at: string
}

// 템플릿 + 가이드 이미지 복합 타입
export type EchoTemplateWithImages = EchoTemplate & {
  guide_images: EchoTemplateGuideImage[]
}

// =============================================
// 서비스 레이어 복합 타입
// =============================================
export type EchoChartWithPatient = EchoChart & {
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
  vet: { name: string; user_id: string } | null
  examiner: { name: string; user_id: string } | null
}

// 차트 + 결과값 묶음
export type EchoChartDetail = EchoChartWithPatient & {
  results: EchoResult[]
}

// keyword_id → value 맵 (클라이언트 상태용)
export type EchoResultMap = Record<string, string>

// 사이드바 목록 항목
export type EchoSidebarItem = {
  id: string
  patient_id: string
  exam_date: string
  patient_name: string
  species: string
  breed: string
  hos_patient_id: string
  vet_name: string | null
  examiner_name: string | null
}
