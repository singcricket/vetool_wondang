import type React from 'react'
import type { LucideIcon } from 'lucide-react'

const GRADIENTS = {
  teal:   'from-teal-500 to-emerald-400',
  blue:   'from-blue-500 to-cyan-400',
  amber:  'from-amber-500 to-orange-400',
  violet: 'from-violet-500 to-purple-400',
  rose:   'from-rose-500 to-pink-400',
  indigo: 'from-indigo-500 to-blue-500',
  slate:  'from-slate-600 to-slate-500',
  red:    'from-red-500 to-rose-400',
  cyan:   'from-cyan-500 to-teal-400',
  orange: 'from-orange-500 to-amber-400',
  sky:    'from-sky-500 to-blue-400',
  purple: 'from-purple-500 to-violet-400',
} as const

export type SectionColor = keyof typeof GRADIENTS

interface SectionBlockProps {
  icon?: LucideIcon
  title: string
  color?: SectionColor
  action?: React.ReactNode
  children: React.ReactNode
}

/** 대분류 카드: 그라디언트 헤더 + 흰 배경 본문 */
export function SectionBlock({ icon: Icon, title, color = 'teal', action, children }: SectionBlockProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
      <div className={`flex items-center gap-2 bg-gradient-to-r ${GRADIENTS[color]} px-4 py-3`}>
        {Icon && <Icon size={15} className="shrink-0 text-white/80" strokeWidth={2} />}
        <h4 className="flex-1 text-sm font-bold text-white">{title}</h4>
        {action}
      </div>
      <div className="bg-white p-4">
        {children}
      </div>
    </div>
  )
}

interface SubSectionProps {
  title: string
  color?: SectionColor
  children: React.ReactNode
}

/** 소분류 구분선: 컬러 좌측 바 + 굵은 라벨 */
export function SubSection({ title, color = 'teal', children }: SubSectionProps) {
  const barColors: Partial<Record<SectionColor, string>> = {
    teal:   'bg-teal-400',
    blue:   'bg-blue-400',
    amber:  'bg-amber-400',
    violet: 'bg-violet-400',
    rose:   'bg-rose-400',
    indigo: 'bg-indigo-400',
    slate:  'bg-slate-400',
    red:    'bg-red-400',
    cyan:   'bg-cyan-400',
    orange: 'bg-orange-400',
    sky:    'bg-sky-400',
    purple: 'bg-purple-400',
  }
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-2 flex items-center gap-1.5">
        <div className={`h-3.5 w-0.5 shrink-0 rounded-full ${barColors[color] ?? 'bg-teal-400'}`} />
        <p className="text-xs font-bold text-slate-600">{title}</p>
      </div>
      {children}
    </div>
  )
}

interface FieldLabelProps {
  children: React.ReactNode
  sub?: string
}

/** 필드 레이블 */
export function FieldLabel({ children, sub }: FieldLabelProps) {
  return (
    <p className="mb-1 text-xs font-semibold text-slate-600">
      {children}
      {sub && <span className="ml-1 font-normal text-slate-400">{sub}</span>}
    </p>
  )
}
