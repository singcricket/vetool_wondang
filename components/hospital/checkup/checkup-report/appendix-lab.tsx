import type { LabResultItem, LabSeverity } from '@/constants/hospital/checkup/lab-types'
import { LAB_TABLE_GROUPS } from '@/lib/config/checkup-report-modules'
import { AppendixSection } from './report-ui'
import { SEVERITY_BADGE } from './report-utils'

const SEVERITY_ROW: Record<LabSeverity, string> = {
  critical: 'bg-red-100',
  high:     'bg-red-50',
  moderate: 'bg-orange-50',
  mild:     'bg-amber-50/60',
}

function LabTable({ items, title }: { items: LabResultItem[]; title: string }) {
  const filled = items.filter((i) => i.value !== null && i.value !== '')
  if (!filled.length) return null

  return (
    <div className="mb-5 break-inside-avoid">
      <h3 className="mb-2 text-sm font-bold text-slate-700">{title}</h3>
      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-slate-500">
              <th className="px-3 py-2 font-medium">항목</th>
              <th className="px-3 py-2 font-medium">결과값</th>
              <th className="px-3 py-2 font-medium">참고범위</th>
              <th className="px-3 py-2 font-medium">평가</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filled.map((item) => (
              <tr key={item.id} className={item.is_abnormal ? item.severity ? SEVERITY_ROW[item.severity] : 'bg-red-50/60' : ''}>
                <td className="px-3 py-2">
                  <span className="font-medium text-slate-800">{item.nameEn}</span>
                  <span className="ml-1.5 text-slate-400">{item.nameKo}</span>
                </td>
                <td className="px-3 py-2 font-mono font-semibold text-slate-700">
                  {item.value}
                  <span className="ml-1 font-sans font-normal text-slate-400">{item.unit}</span>
                </td>
                <td className="px-3 py-2 text-slate-400">{item.ref_range ?? '—'}</td>
                <td className="px-3 py-2">
                  {item.result_text ? (
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                      item.severity
                        ? SEVERITY_BADGE[item.severity]
                        : item.is_abnormal ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {item.result_text}
                    </span>
                  ) : item.is_abnormal ? (
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">이상</span>
                  ) : item.value ? (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700">정상</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filled.some((i) => i.is_abnormal && i.comment) && (
        <div className="mt-2 space-y-1 px-1">
          {filled.filter((i) => i.is_abnormal && i.comment).map((item) => (
            <p key={item.id} className="text-xs text-slate-500">
              <span className="font-medium text-slate-700">{item.nameEn}</span>: {item.comment}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

export function AppendixLab({ labItems }: { labItems: LabResultItem[] }) {
  const hasLab = labItems.some((i) => i.value)
  if (!hasLab) return null

  return (
    <AppendixSection tag="부록 A" title="임상병리 검사 전체 결과">
      {LAB_TABLE_GROUPS.map((g) => {
        const normalItems = labItems.filter(
          (item) => !item.id?.startsWith('unmatched_') && item.section?.includes(g.section),
        )
        const reassignedItems = labItems.filter(
          (item) =>
            item.id?.startsWith('unmatched_') &&
            item.include_in_report !== false &&
            item.target_section === g.section,
        )
        return (
          <LabTable key={g.section} title={g.title} items={[...normalItems, ...reassignedItems]} />
        )
      })}
      {(() => {
        const miscItems = labItems.filter(
          (item) =>
            item.id?.startsWith('unmatched_') &&
            item.include_in_report !== false &&
            !item.target_section,
        )
        return miscItems.length > 0 ? <LabTable title="기타 (미분류)" items={miscItems} /> : null
      })()}
    </AppendixSection>
  )
}
