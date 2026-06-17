import type { Database } from '@/lib/supabase/database.types'

// ── Marker types ──────────────────────────────────────────────

export interface MarkerPoint {
  type: 'point'
  x: number        // 0.0–1.0 normalized (relative to image width)
  y: number        // 0.0–1.0 normalized (relative to image height)
  number: number
}

export interface MarkerArea {
  type: 'area'
  x: number
  y: number
  width: number
  height: number
  number: number
}

export type Marker = MarkerPoint | MarkerArea

// ── Core table rows ───────────────────────────────────────────

export interface DermChart {
  id: string
  hos_id: string
  patient_id: string
  chart_date: string
  visit_type: 'initial' | 'followup'
  chief_complaint: string | null
  overview_image_url: string | null
  overall_severity: 1 | 2 | 3 | 4 | null
  ai_summary: string | null
  notes: string | null
  evaluator_id: string | null
  vet_id: string | null
  user_tags: string | null
  created_at: string | null
  updated_at: string | null
}

export type DermChartDetail = DermChart & {
  patient: Database['public']['Tables']['patients']['Row'] | null
  evaluator: { user_id: string; name: string } | null
}

export interface DermLesionGroup {
  id: string
  hos_id: string
  patient_id: string
  initial_chart_id: string
  group_label: string
  group_color: string | null
  suspected_type: string | null
  marker_data: Marker[] | null
  status: 'active' | 'resolved'
  created_at: string | null
}

export type ImprovementType =
  | 'worsened'
  | 'unchanged'
  | 'mild_improvement'
  | 'improved'
  | 'resolved'

export interface DermAiAnalysis {
  lesion_type: string[]
  anatomical_location: string
  description: string
  confidence: number
  severity: 1 | 2 | 3 | 4
  differential: string[]
  recommended_tests: string[]
  immediate_action: string
}

export interface DermLesionVisit {
  id: string
  hos_id: string
  chart_id: string
  lesion_group_id: string
  raw_input: string | null
  formal_findings: string | null
  lesion_types: string[] | null
  ai_analysis: DermAiAnalysis | null
  severity: 1 | 2 | 3 | 4 | null
  improvement: ImprovementType | null
  ai_comparison_notes: string | null
  created_at: string | null
}

export interface DermImage {
  id: string
  hos_id: string
  chart_id: string
  lesion_group_id: string | null
  image_type: 'overview' | 'detail'
  image_url: string
  sort_order: number
  created_at: string | null
}

// ── UI constants ──────────────────────────────────────────────

export const GROUP_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
]

export const SEVERITY_CONFIG: Record<number, { label: string; dot: string; badge: string }> = {
  1: { label: 'Grade 1 — 경미', dot: 'bg-emerald-500', badge: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  2: { label: 'Grade 2 — 중등도', dot: 'bg-yellow-500', badge: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  3: { label: 'Grade 3 — 중증', dot: 'bg-orange-500', badge: 'text-orange-700 bg-orange-50 border-orange-200' },
  4: { label: 'Grade 4 — 매우 중증', dot: 'bg-rose-600', badge: 'text-rose-700 bg-rose-50 border-rose-200' },
}

export const IMPROVEMENT_CONFIG: Record<ImprovementType, { label: string; icon: string; color: string }> = {
  worsened:         { label: '악화',         icon: '🔴', color: 'text-rose-700' },
  unchanged:        { label: '변화없음',      icon: '🟠', color: 'text-orange-600' },
  mild_improvement: { label: '경미한 호전',   icon: '🟡', color: 'text-yellow-600' },
  improved:         { label: '호전',          icon: '🟢', color: 'text-emerald-600' },
  resolved:         { label: '완치',          icon: '✅', color: 'text-emerald-700' },
}

export const LESION_TYPES: { value: string; label: string; labelEn: string }[] = [
  { value: 'macule',            label: '반점',       labelEn: 'Macule' },
  { value: 'papule',            label: '구진',       labelEn: 'Papule' },
  { value: 'plaque',            label: '판',         labelEn: 'Plaque' },
  { value: 'pustule',           label: '농포',       labelEn: 'Pustule' },
  { value: 'vesicle',           label: '수포',       labelEn: 'Vesicle' },
  { value: 'nodule',            label: '결절',       labelEn: 'Nodule' },
  { value: 'tumor',             label: '종양',       labelEn: 'Tumor/Mass' },
  { value: 'erythema',          label: '홍반',       labelEn: 'Erythema' },
  { value: 'alopecia',          label: '탈모',       labelEn: 'Alopecia' },
  { value: 'scale',             label: '비듬',       labelEn: 'Scale' },
  { value: 'crust',             label: '딱지',       labelEn: 'Crust' },
  { value: 'erosion',           label: '미란',       labelEn: 'Erosion' },
  { value: 'ulcer',             label: '궤양',       labelEn: 'Ulcer' },
  { value: 'lichenification',   label: '태선화',     labelEn: 'Lichenification' },
  { value: 'hyperpigmentation', label: '과색소침착', labelEn: 'Hyperpigmentation' },
  { value: 'hypopigmentation',  label: '색소감소',   labelEn: 'Hypopigmentation' },
  { value: 'comedone',          label: '면포',       labelEn: 'Comedone' },
  { value: 'excoriation',       label: '찰상',       labelEn: 'Excoriation' },
  { value: 'fistula',           label: '누공',       labelEn: 'Fistula/Sinus' },
  { value: 'wheal',             label: '팽진',       labelEn: 'Wheal/Urticaria' },
]
