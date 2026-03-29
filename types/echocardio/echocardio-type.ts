// =============================================
// Echo Test 타입 정의
// keywordID: 유일 식별자 (절대 변경 금지)
// keywordName: 표시용 레이블 (자유롭게 변경 가능)
// =============================================

export const ECHO_SECTION_LIST = [
  'PE',
  'Radio',
  'Bmode',
  'Mmode',
  'ColorDoppler',
  'SpectralDoppler',
  'TDI',
] as const

export type EchoSection = (typeof ECHO_SECTION_LIST)[number]

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

// 모든 테스트 항목의 공통 기본 필드
type BaseTest = {
  keywordID: string
  keywordName: string
  section: EchoSection
  group: string
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
  | CalculatedTest
  | OtherTest
  | TextCommentTest

// =============================================
// 클라이언트에 전달하는 경량 UI 메타데이터
// (thresholds, optResult, optComment 등 해석 로직 제외)
// =============================================
export type EchoTestUIMeta = {
  keywordID: string
  keywordName: string
  section: EchoSection
  group: string
  testType: EchoTest['testType']
  unit?: string
  options?: string[]           // select 타입용
  dependencies?: string[]      // calculated 타입용 (의존 필드 렌더링)
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

// 하위 호환 alias
export type EchoSettings = EchoTemplate
export type EchoGuideImage = EchoTemplateGuideImage

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
