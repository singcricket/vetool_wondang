import type { LabResultItem } from '@/constants/hospital/checkup/lab-types'
import type { ResolvedOrganSection, DxEvaluation } from '@/lib/config/checkup-report-modules'
import { isDxEvaluation } from './report-utils'
import { OVERALL_STYLE, OVERALL_LABEL, type OverallStatus } from './report-types'

const STATUS_BOX: Record<string, { border: string; bg: string; dot: string; badge: string; badgeText: string }> = {
  severe:   { border: 'border-red-200',    bg: 'bg-red-50',     dot: 'bg-red-500',     badge: 'bg-red-100 text-red-700',        badgeText: '중증'  },
  moderate: { border: 'border-orange-200', bg: 'bg-orange-50',  dot: 'bg-orange-500',  badge: 'bg-orange-100 text-orange-700',  badgeText: '중등도' },
  mild:     { border: 'border-amber-200',  bg: 'bg-amber-50',   dot: 'bg-amber-400',   badge: 'bg-amber-100 text-amber-700',    badgeText: '경도'  },
  normal:   { border: 'border-slate-200',  bg: 'bg-slate-50',   dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', badgeText: '정상'  },
}

interface ExecutiveSummaryProps {
  organSections: ResolvedOrganSection[]
  labItems: LabResultItem[]
  plan: Record<string, unknown>
}

export function ExecutiveSummary({ organSections, labItems, plan }: ExecutiveSummaryProps) {
  const abnormalLabs = labItems.filter((i) => i.is_abnormal && i.value)
  const criticalLabs = abnormalLabs.filter((i) => i.severity === 'critical' || i.severity === 'high')

  if (organSections.length === 0 && abnormalLabs.length === 0) return null

  const severeOrgans   = organSections.filter((s) => isDxEvaluation(s.aiEval) && s.aiEval.status === 'severe')
  const moderateOrgans = organSections.filter((s) => isDxEvaluation(s.aiEval) && s.aiEval.status === 'moderate')
  const mildOrgans     = organSections.filter((s) => isDxEvaluation(s.aiEval) && s.aiEval.status === 'mild')

  const overall: OverallStatus =
    severeOrgans.length > 0 || criticalLabs.length > 0 ? 'severe'
    : moderateOrgans.length > 0 || abnormalLabs.some((i) => i.severity === 'moderate') ? 'moderate'
    : mildOrgans.length > 0 || abnormalLabs.length > 0 ? 'mild'
    : 'normal'

  const sty = OVERALL_STYLE[overall]
  const urgentAction = typeof plan.tx_priority_summary === 'string' ? plan.tx_priority_summary : ''

  return (
    <div className="mb-8 break-inside-avoid overflow-hidden rounded-[10px] border border-slate-200 shadow-sm">

      {/* ── 헤더 ── */}
      <div className={`px-6 py-5 ${sty.headerBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-white">종합 평가 요약</h2>
          <span className={`rounded-full bg-white/95 px-4 py-1 text-sm font-bold ${sty.badge}`}>
            {overall === 'severe' ? '🔴' : overall === 'moderate' ? '🟠' : overall === 'mild' ? '🟡' : '🟢'}{' '}
            {OVERALL_LABEL[overall]}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-6 p-6">

        {/* ── 즉시 처치 강조 박스 ── */}
        {(severeOrgans.length > 0 || criticalLabs.length > 0) && (
          <div className="rounded-md border border-red-300 bg-red-50 p-4">
            <p className="mb-3 text-sm font-bold uppercase tracking-wide text-red-700">⚠ 즉시 처치 필요</p>
            <div className="flex flex-col gap-2">
              {severeOrgans.map((s) => {
                const eval_ = s.aiEval as DxEvaluation
                return (
                  <p key={s.key} className="text-sm font-medium text-red-800">
                    <span className="font-bold">{s.label}</span>
                    {eval_.summary ? ` — ${eval_.summary}` : ''}
                  </p>
                )
              })}
              {criticalLabs.length > 0 && (
                <p className="text-sm font-medium text-red-800">
                  <span className="font-bold">긴급 이상 수치</span>
                  {' '}— {criticalLabs.map((i) => `${i.nameEn} ${i.value}${i.unit ?? ''}`).join(' · ')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── 계통별 평가 (개별 박스) ── */}
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">계통별 평가</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {organSections.map((s) => {
              const eval_ = s.aiEval
              const isDx = isDxEvaluation(eval_)
              const status: string = isDx
                ? eval_.status
                : s.labItems.some((i) => i.severity === 'critical' || i.severity === 'high') ? 'severe'
                : s.xrayFindings.some((f) => f.severity === 'severe') ? 'severe'
                : s.labItems.some((i) => i.is_abnormal) ? 'mild'
                : s.xrayFindings.some((f) => f.severity === 'moderate') ? 'moderate'
                : s.physicalFindings.some((f) => f.isAbnormal) ? 'mild'
                : s.xrayFindings.length > 0 ? 'mild'
                : 'normal'

              const summary = isDx && eval_.summary
                ? eval_.summary
                : s.labItems.filter((i) => i.is_abnormal).length > 0
                ? `이상 수치 ${s.labItems.filter((i) => i.is_abnormal).length}건`
                : s.xrayFindings.length > 0
                ? `방사선 이상 소견 ${s.xrayFindings.length}건`
                : s.physicalFindings.some((f) => f.isAbnormal)
                ? `신체검사 이상 소견`
                : '이상 소견 없음'

              const box = STATUS_BOX[status] ?? STATUS_BOX.normal

              return (
                <div
                  key={s.key}
                  className={`flex flex-col gap-2 rounded-[10px] border ${box.border} ${box.bg} px-4 py-3`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-bold text-slate-800">{s.label}</span>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${box.badge}`}>
                      {box.badgeText}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${box.dot}`} />
                    <p className="text-xs leading-relaxed text-slate-600">{summary}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── 주요 이상 수치 ── */}
        {abnormalLabs.length > 0 && (
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">주요 이상 수치</p>
            <div className="flex flex-wrap gap-2">
              {abnormalLabs.slice(0, 12).map((item) => (
                <span
                  key={item.id}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${
                    item.severity === 'critical' || item.severity === 'high'
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : item.severity === 'moderate'
                      ? 'border-orange-300 bg-orange-50 text-orange-700'
                      : 'border-amber-300 bg-amber-50 text-amber-700'
                  }`}
                >
                  <span className="font-bold">{item.nameEn}</span>
                  <span>{item.value}{item.unit}</span>
                </span>
              ))}
              {abnormalLabs.length > 12 && (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-500">
                  외 {abnormalLabs.length - 12}건
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── 권장 조치 요약 ── */}
        {urgentAction && (
          <div className={`rounded-md border p-4 ${sty.alertBorder} ${sty.alertBg}`}>
            <p className={`mb-2 text-sm font-bold uppercase tracking-wide ${sty.alertText}`}>
              권장 조치 요약
            </p>
            <p className={`whitespace-pre-wrap text-sm leading-relaxed ${sty.alertText}`}>
              {urgentAction}
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
