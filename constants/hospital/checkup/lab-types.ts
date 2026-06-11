// ============================================================
// lab-types.ts — 임상병리 ref 타입 정의
// ============================================================

export type LabSection =
  | 'cbc'          // 혈액검사 (Complete Blood Count)
  | 'chemistry'    // 혈청화학 전체
  | 'liver'        // 간 기능
  | 'kidney'       // 신장 기능
  | 'pancreas'     // 췌장
  | 'protein'      // 단백질
  | 'glucose'      // 혈당
  | 'lipid'        // 지질
  | 'electrolyte'  // 전해질
  | 'endocrine'    // 내분비 (갑상선 포함)
  | 'thyroid'      // 갑상선 (endocrine 하위)
  | 'urinalysis'   // 요검사
  | 'special'      // 특수검사
  | 'blood_gas'    // 혈액가스검사 (ABG)
  | 'coagulation'  // 응고계 검사

export const LAB_SECTION_LABEL: Record<LabSection, string> = {
  cbc: '혈액검사 (CBC)',
  chemistry: '혈청화학',
  liver: '간 기능',
  kidney: '신장 기능',
  pancreas: '췌장',
  protein: '단백질',
  glucose: '혈당',
  lipid: '지질',
  electrolyte: '전해질',
  endocrine: '내분비',
  thyroid: '갑상선',
  urinalysis: '요검사',
  special: '특수검사',
  blood_gas: '혈액가스검사',
  coagulation: '응고계 검사',
}

export type LabTestType = 'range' | 'select' | 'multiselect' | 'text'
export type LabSeverity = 'critical' | 'high' | 'moderate' | 'mild'
export type FoldProfile = 'enzyme' | 'renal' | 'electrolyte' | 'cell'

export interface RangeEntry {
  min: number | null
  max: number | null
  resultText: string
  resultTextKo: string
  isAbnormal: boolean
  severity?: LabSeverity
}

export interface SelectOption {
  value: string
  labelKo?: string
  isAbnormal?: boolean
  severity?: LabSeverity
}

export interface DefaultRefRange {
  dog?: string
  cat?: string
  common?: string
}

export interface LabRefItem {
  id: string
  nameKo: string
  nameEn: string
  unit: string
  section: LabSection[]
  testType: LabTestType
  ranges?: { dog?: RangeEntry[]; cat?: RangeEntry[]; common?: RangeEntry[] }
  options?: SelectOption[]           // select / multiselect 전용
  defaultRefRange?: string | DefaultRefRange
  foldProfile?: FoldProfile          // AI 경로 fold-change 기준 프로필
  descriptionKo?: string             // 보호자용 검사 설명 (리포트에 표시)
  comment: {
    increase: string
    decrease: string
    normal?: string
  }
  aiExtractKeywords?: string[]
}

// checkup_sections.data 내 lab 섹션의 저장 구조
export interface LabSectionData {
  items: LabResultItem[]
}

export interface LabResultItem {
  id: string
  nameEn: string
  nameKo: string
  unit: string
  value: string | null
  ref_range: string | null
  is_abnormal: boolean | null
  result_text: string | null   // 자동 평가 결과 텍스트
  severity: LabSeverity | null // 이상 심각도
  comment: string | null       // 이상 시 코멘트 (자동 입력 후 사용자 수정 가능)
  section: LabSection[]
  source?: 'manual' | 'ai'     // 값 입력 경로
  descriptionKo?: string        // 보호자용 검사 설명 (lab-ref에서 복사)
  include_in_report?: boolean   // 미분류 항목: 리포트 포함 여부 (기본 true)
  target_section?: LabSection | null // 미분류 항목: 배치할 섹션
}
