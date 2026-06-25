'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils/utils'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { BlogLabSession } from '@/types/hospital/blog-type'
import type { LabSection, LabSeverity } from '@/constants/hospital/checkup/lab-types'
import { LAB_SECTION_LABEL } from '@/constants/hospital/checkup/lab-types'
import type { LabResultItem } from '@/constants/hospital/checkup/lab-types'

interface Props {
  sessions: BlogLabSession[]
  patientName?: string
}

// 표시 순서 및 색상
const SECTION_ORDER: { section: LabSection; color: string; bg: string }[] = [
  { section: 'cbc',         color: 'text-red-700',    bg: 'bg-red-50' },
  { section: 'chemistry',   color: 'text-orange-700', bg: 'bg-orange-50' },
  { section: 'liver',       color: 'text-orange-700', bg: 'bg-orange-50' },
  { section: 'kidney',      color: 'text-amber-700',  bg: 'bg-amber-50' },
  { section: 'pancreas',    color: 'text-yellow-700', bg: 'bg-yellow-50' },
  { section: 'protein',     color: 'text-lime-700',   bg: 'bg-lime-50' },
  { section: 'glucose',     color: 'text-lime-700',   bg: 'bg-lime-50' },
  { section: 'lipid',       color: 'text-lime-700',   bg: 'bg-lime-50' },
  { section: 'electrolyte', color: 'text-sky-700',    bg: 'bg-sky-50' },
  { section: 'endocrine',   color: 'text-teal-700',   bg: 'bg-teal-50' },
  { section: 'thyroid',     color: 'text-teal-700',   bg: 'bg-teal-50' },
  { section: 'blood_gas',   color: 'text-sky-700',    bg: 'bg-sky-50' },
  { section: 'coagulation', color: 'text-purple-700', bg: 'bg-purple-50' },
  { section: 'urinalysis',  color: 'text-amber-700',  bg: 'bg-amber-50' },
  { section: 'special',     color: 'text-slate-700',  bg: 'bg-slate-50' },
]

const SEVERITY_BADGE: Record<LabSeverity, string> = {
  critical: 'bg-red-600 text-white',
  high:     'bg-orange-500 text-white',
  moderate: 'bg-yellow-400 text-slate-800',
  mild:     'bg-slate-200 text-slate-700',
}

// "(장비명)" 같은 괄호 내용 제거
function cleanLabel(s: string): string {
  return s.replace(/\s*\([^)]*\)/g, '').trim()
}

function parseNum(v: string | null): number | null {
  if (!v) return null
  const n = parseFloat(v.replace(/[^0-9.\-]/g, ''))
  return isNaN(n) ? null : n
}

function Trend({ cur, prev }: { cur: string | null; prev: string | null }) {
  const c = parseNum(cur)
  const p = parseNum(prev)
  if (c === null || p === null) return null
  if (c > p) return <span className="ml-0.5 text-[11px] font-bold text-red-500">↑</span>
  if (c < p) return <span className="ml-0.5 text-[11px] font-bold text-blue-500">↓</span>
  return <span className="ml-0.5 text-[11px] text-slate-400">→</span>
}

// 아이템의 대표 섹션 (SECTION_ORDER 순서 기준 첫 번째 매칭)
function primarySection(item: LabResultItem): LabSection {
  for (const { section } of SECTION_ORDER) {
    if (item.section.includes(section)) return section
  }
  return item.section[0] ?? 'special'
}

// 섹션별 그룹핑 (SECTION_ORDER 순서 유지)
function groupBySection(items: LabResultItem[]): { section: LabSection; items: LabResultItem[] }[] {
  const map = new Map<LabSection, LabResultItem[]>()
  for (const item of items) {
    if (!item.value) continue
    const sec = primarySection(item)
    if (!map.has(sec)) map.set(sec, [])
    map.get(sec)!.push(item)
  }
  return SECTION_ORDER
    .filter(({ section }) => map.has(section))
    .map(({ section }) => ({ section, items: map.get(section)! }))
}

export default function BlogLabSessions({ sessions, patientName }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(sessions.length - 1)
  const captureRef = useRef<HTMLDivElement>(null)

  if (!sessions.length) return null

  const current = sessions[selectedIdx]
  const prev = selectedIdx > 0 ? sessions[selectedIdx - 1] : null
  const prevMap = new Map(prev?.items.map((it) => [it.id, it]) ?? [])

  const groups = groupBySection(current.items)

  const handleSavePng = async () => {
    if (!captureRef.current) return
    try {
      toast.loading('이미지를 생성하는 중…', { id: 'lab-png' })
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })
      const link = document.createElement('a')
      const label = cleanLabel(current.label || current.date || `검사${selectedIdx + 1}`)
      link.download = `혈액검사_${patientName ?? ''}${label}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('이미지가 저장됐습니다.', { id: 'lab-png' })
    } catch {
      toast.error('이미지 저장에 실패했습니다.', { id: 'lab-png' })
    }
  }

  return (
    <div className="mx-6 mb-6 space-y-2">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">혈액검사</span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSavePng}
          className="h-7 gap-1 px-2.5 text-[11px] text-slate-500"
        >
          <Download size={11} />
          이미지로 저장
        </Button>
      </div>

      {/* 날짜 탭 */}
      {sessions.length > 1 && (
        <div className="flex gap-1 flex-wrap">
          {sessions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedIdx(i)}
              className={cn(
                'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors',
                selectedIdx === i
                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                  : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600',
              )}
            >
              {cleanLabel(s.label || s.date || `검사 ${i + 1}`)}
            </button>
          ))}
        </div>
      )}

      {/* 캡처 영역 */}
      <div ref={captureRef} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {/* 캡처용 헤더 */}
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">
            {current.label || current.date
              ? [current.label, current.date].filter(Boolean).map((s) => cleanLabel(s!)).join(' · ')
              : `검사 ${selectedIdx + 1}`}
          </span>
          {patientName && (
            <span className="text-[11px] text-slate-400">{patientName}</span>
          )}
        </div>

        {groups.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-slate-400">값이 기록된 항목이 없습니다.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {groups.map(({ section, items }) => {
              const meta = SECTION_ORDER.find((s) => s.section === section)!
              return (
                <div key={section}>
                  {/* 섹션 헤더 */}
                  <div className={cn('px-4 py-1.5 flex items-center gap-1.5', meta.bg)}>
                    <span className={cn('text-[11px] font-semibold', meta.color)}>
                      {LAB_SECTION_LABEL[section]}
                    </span>
                  </div>

                  {/* 아이템 테이블 */}
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-[10px] text-slate-400">
                        <th className="px-4 py-1.5 font-medium">항목</th>
                        <th className="px-3 py-1.5 font-medium text-right">수치</th>
                        <th className="px-3 py-1.5 font-medium">단위</th>
                        <th className="px-3 py-1.5 font-medium">정상범위</th>
                        {prev && <th className="px-3 py-1.5 font-medium text-center">이전값</th>}
                        <th className="px-3 py-1.5 font-medium">상태</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {items.map((item) => {
                        const prevItem = prevMap.get(item.id)
                        return (
                          <tr
                            key={item.id}
                            className={cn(
                              item.is_abnormal === true ? 'bg-orange-50/50' : '',
                            )}
                          >
                            <td className="px-4 py-2">
                              <span className="font-medium text-slate-700">{item.nameKo}</span>
                              <span className="ml-1 text-[10px] text-slate-400">({item.nameEn})</span>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <span className={cn(
                                'font-semibold',
                                item.is_abnormal === true ? 'text-orange-600' : 'text-slate-700',
                              )}>
                                {item.value}
                              </span>
                              {prev && prevItem && (
                                <Trend cur={item.value} prev={prevItem.value} />
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-500">{item.unit}</td>
                            <td className="px-3 py-2 text-slate-400">{item.ref_range ?? '—'}</td>
                            {prev && (
                              <td className="px-3 py-2 text-center text-slate-400">
                                {prevItem?.value ?? '—'}
                              </td>
                            )}
                            <td className="px-3 py-2">
                              {item.severity ? (
                                <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-semibold', SEVERITY_BADGE[item.severity])}>
                                  {item.severity}
                                </span>
                              ) : item.is_abnormal === false ? (
                                <span className="text-[10px] text-teal-500">정상</span>
                              ) : null}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </div>
        )}

        {/* 이전값 비교 범례 */}
        {prev && (
          <div className="border-t border-slate-100 px-4 py-2 text-[10px] text-slate-400">
            이전 검사({cleanLabel(prev.label || prev.date || '')})와 비교&nbsp;&nbsp;
            <span className="font-bold text-red-400">↑</span> 증가&nbsp;
            <span className="font-bold text-blue-400">↓</span> 감소&nbsp;
            <span>→</span> 동일
          </div>
        )}
      </div>
    </div>
  )
}
