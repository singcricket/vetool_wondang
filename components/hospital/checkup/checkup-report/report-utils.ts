import type { LabSeverity } from '@/constants/hospital/checkup/lab-types'
import type { DxEvaluation } from '@/lib/config/checkup-report-modules'

export function calcAge(birth: string | null): string {
  if (!birth) return ''
  const b = new Date(birth)
  const today = new Date()
  const totalMonths =
    (today.getFullYear() - b.getFullYear()) * 12 +
    (today.getMonth() - b.getMonth()) +
    (today.getDate() < b.getDate() ? -1 : 0)
  if (totalMonths < 12) return `${totalMonths}개월령`
  const y = Math.floor(totalMonths / 12)
  const m = totalMonths % 12
  return m > 0 ? `${y}세 ${m}개월` : `${y}세`
}

export function speciesLabel(species: string): string {
  if (/^(dog|canine)/i.test(species)) return '개'
  if (/^(cat|feline)/i.test(species)) return '고양이'
  return species
}

export const PHYSICAL_NORMAL_PATTERNS = [
  '정상', 'BAR', 'QAR', '없음', '정상 범위', '검사 미실시', '해당 없음', '<5%', '변화 없음',
  '정규', // 심장 리듬 "정규 (Regular)"
]

export function isPhysicalNormalValue(val: string): boolean {
  return PHYSICAL_NORMAL_PATTERNS.some((p) => val.includes(p))
}

export function parseRange(rangeStr: string): [number, number] | null {
  const m = rangeStr.match(/([\d.]+)[–\-]([\d.]+)/)
  return m ? [parseFloat(m[1]), parseFloat(m[2])] : null
}

export function isDxEvaluation(v: unknown): v is DxEvaluation {
  return !!v && typeof v === 'object' && 'status' in v
}

export const SEVERITY_BORDER: Record<LabSeverity, string> = {
  critical: 'border-red-500',
  high:     'border-red-400',
  moderate: 'border-orange-400',
  mild:     'border-amber-400',
}

export const SEVERITY_BADGE: Record<LabSeverity, string> = {
  critical: 'bg-red-600 text-white',
  high:     'bg-red-100 text-red-700',
  moderate: 'bg-orange-100 text-orange-700',
  mild:     'bg-amber-100 text-amber-700',
}
