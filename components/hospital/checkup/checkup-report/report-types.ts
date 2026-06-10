import type { BreedRisk, AgeRisk, Management } from '@/lib/actions/checkup/inquiry-risk-analysis'

export type InquiryData = {
  living_type: string
  toilet_env: string
  diet_main: string
  diet_treats: string
  diet_allergies: string
  living_other: string
  condition_vitality: string
  condition_appetite: string
  condition_water: string
  condition_urination: string
  condition_defecation: string
  condition_notes: string
  chief_complaint: string
  past_history: string
  current_diseases: string
  vaccination: string
  heartworm: string
  internal_parasite: string
  external_parasite: string
  prev_checkup: string
  ai_breed_risk: BreedRisk | string
  ai_age_risk: AgeRisk | string
  ai_management: Management | string
}

export type OverallStatus = 'severe' | 'moderate' | 'mild' | 'normal'

export const OVERALL_STYLE: Record<
  OverallStatus,
  { headerBg: string; badge: string; dot: string; alertBorder: string; alertBg: string; alertText: string }
> = {
  severe:   { headerBg: 'bg-red-500',     badge: 'text-red-700',     dot: 'bg-red-500',     alertBorder: 'border-red-300',    alertBg: 'bg-red-50',    alertText: 'text-red-800'     },
  moderate: { headerBg: 'bg-orange-500',  badge: 'text-orange-700',  dot: 'bg-orange-500',  alertBorder: 'border-orange-300', alertBg: 'bg-orange-50', alertText: 'text-orange-800'  },
  mild:     { headerBg: 'bg-amber-400',   badge: 'text-amber-700',   dot: 'bg-amber-400',   alertBorder: 'border-amber-300',  alertBg: 'bg-amber-50',  alertText: 'text-amber-800'   },
  normal:   { headerBg: 'bg-emerald-500', badge: 'text-emerald-700', dot: 'bg-emerald-500', alertBorder: 'border-emerald-200',alertBg: 'bg-emerald-50',alertText: 'text-emerald-800' },
}

export const OVERALL_LABEL: Record<OverallStatus, string> = {
  severe: '즉각 처치 필요',
  moderate: '추가 검사 권장',
  mild: '경미한 이상 소견',
  normal: '전반적 양호',
}

export const STATUS_DOT: Record<string, string> = {
  severe: 'bg-red-500',
  moderate: 'bg-orange-500',
  mild: 'bg-amber-400',
  normal: 'bg-emerald-500',
}
