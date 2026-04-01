// =============================================
// 섹션 메타데이터 (한국어 표시명, 기본 순서)
// =============================================

import type { EchoSection } from '@/types/echocardio/echocardio-type'

export const ECHO_SECTION_META: Record<
  EchoSection,
  { label: string; description: string }
> = {
  PE: {
    label: '신체검사',
    description: '체중, 활력징후, 심음 등 기본 신체검사 항목',
  },
  Radio: {
    label: '방사선',
    description: 'VHS, VLAS 등 흉부 방사선 측정값',
  },
  Bmode: {
    label: 'B-mode',
    description: '이차원 초음파 - 판막 형태 이상, 삼출액 평가',
  },
  Objective_Evaluation: {
    label: 'Objective Evaluation',
    description: 'M-mode 측정값 및 파생 지수 (FS, EF, LA:AO 등)',
  },
  
  ColorDoppler: {
    label: 'Color Doppler',
    description: '색 도플러 - 역류 및 난류 제트 평가',
  },
  SpectralDoppler: {
    label: 'Spectral Doppler',
    description: '스펙트럼 도플러 - 혈류 속도 및 압력차 측정',
  },
  TDI: {
    label: 'TDI',
    description: '조직 도플러 영상 - 심근 기능 평가',
  },
  HCM_Evaluation: {
    label: 'HCM Evaluation',
    description: '고양이 HCM 진단 및 평가 항목',
  },
   Pulmonary_Hypertension: {
    label: 'Pulmonary Hypertension',
    description: 'Pulmonary Hypertension 관련 지표 인자',
  },
 
  PosibilityOfPH: {
    label: 'Posibility Of Pulmonary Hypertension',
    description: 'Posibility Of PH',
  },
   MINE_SCORE: {
    label: 'MINE SCORE',
    description: 'MINE SCORE',
  },
  ACVIM: {
    label: 'ACVIM',
    description: 'ACVIM',
  },
  
  General_Review: {
    label: 'General Review',
    description: '종합평가',
  },
}

export const DEFAULT_SECTION_ORDER: EchoSection[] = [
  'PE',
  'Radio',
  'Bmode',
  'Objective_Evaluation',
  'ColorDoppler',
  'SpectralDoppler',
  'TDI',
  'Pulmonary_Hypertension',
  'PosibilityOfPH',
  'ACVIM',
  'HCM_Evaluation',
  'MINE_SCORE',
  'General_Review'
]
