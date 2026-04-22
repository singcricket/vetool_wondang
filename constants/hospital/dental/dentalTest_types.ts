// ============================================================
// Dental Tests — Type Definitions
// ============================================================

export type Species = 'canine' | 'feline';
export type UrgencyLevel = 'urgent' | 'recommended' | 'elective' | 'monitor' | 'none';
export type DentalTestType = 'select' | 'multiselect' | 'grade' | 'text' | 'range';
export type GradeValue = 'none' | 'mild' | 'moderate' | 'severe';

export interface DentalTestOption {
  value:  string;   // AVDC 약어 or 'none' — DB 저장 키
  detail: string;   // 전문 영문 용어
  label:  string;   // UI 표시 (한글+영문)
}

export interface DentalTest {
  testID:   string;
  testName: string;         // 영문 검사명
  testNameKo: string;       // 한글 검사명
  testType: DentalTestType;
  unit?:    string;
  testInfo: string;         // 검사 설명 (수의사용)
  affectedSpecies: Species[];

  // select / multiselect
  options?:        DentalTestOption[];
  optComment?:     Record<string, string>;  // 수의사 소견
  generalComment?: Record<string, string>;  // 보호자 설명
  urgency?:        Record<string, UrgencyLevel>;
  suggestedTx?:    Record<string, string[]>; // AVDC tx 약어

  // grade (calculus, plaque, gingivitis 등)
  gradeLabels?: Record<GradeValue, { detail: string; optComment: string; generalComment: string }>;

  // range (probing depth 등)
  thresholds?: number[];
  thresholds_canine?: number[];
  thresholds_feline?: number[];
  unit_range?: string;

  rangeComments?: Record<string, {
    label: string;
    optComment: string;
    generalComment: string;
    urgency: UrgencyLevel;
    suggestedTx: string[];
  }>;

  noteTags: string[];
}

