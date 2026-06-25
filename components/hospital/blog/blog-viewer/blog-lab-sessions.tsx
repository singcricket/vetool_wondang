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
  comment?: string
  patientName?: string
}

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

function cleanLabel(s: string): string {
  return s.replace(/\s*\([^)]*\)/g, '').trim()
}

// "입원 15일차 CBC·단백질·전해질 추적" → "입원 15일차"
function visitLabel(raw: string): string {
  const parts = raw.split(' ')
  const cutIdx = parts.findIndex((p) => p.includes('·') || /^[A-Z]{2,}$/.test(p))
  return cleanLabel((cutIdx > 0 ? parts.slice(0, cutIdx) : parts).join(' '))
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

function primarySection(item: LabResultItem): LabSection {
  for (const { section } of SECTION_ORDER) {
    if (item.section.includes(section)) return section
  }
  return item.section[0] ?? 'special'
}

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

// ── 비교 테이블용 데이터 빌드 ─────────────────────────────────

type ComparisonRow = {
  meta: LabResultItem                   // 대표 메타 (이름, 단위, ref_range)
  values: ({ value: string | null; isAbnormal: boolean | null; severity: LabSeverity | null })[]
}

function buildComparison(
  sessions: BlogLabSession[],
  idxs: number[],   // 오름차순 정렬된 인덱스
): { section: LabSection; rows: ComparisonRow[] }[] {
  const selected = idxs.map((i) => sessions[i])
  const sessionMaps = selected.map(
    (s) => new Map(s.items.map((it) => [it.id, it])),
  )

  // 선택된 세션들에 등장하는 모든 아이템(값 있는 것만) 수집
  const itemMeta = new Map<string, LabResultItem>()
  for (const s of selected) {
    for (const it of s.items) {
      if (it.value && !itemMeta.has(it.id)) itemMeta.set(it.id, it)
    }
  }

  // 섹션별 그룹핑
  const sectionMap = new Map<LabSection, ComparisonRow[]>()
  for (const [id, meta] of itemMeta) {
    const sec = primarySection(meta)
    if (!sectionMap.has(sec)) sectionMap.set(sec, [])
    sectionMap.get(sec)!.push({
      meta,
      values: sessionMaps.map((m) => {
        const it = m.get(id)
        return {
          value: it?.value ?? null,
          isAbnormal: it?.is_abnormal ?? null,
          severity: it?.severity ?? null,
        }
      }),
    })
  }

  return SECTION_ORDER
    .filter(({ section }) => sectionMap.has(section))
    .map(({ section }) => ({ section, rows: sectionMap.get(section)! }))
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────

export default function BlogLabSessions({ sessions, comment, patientName }: Props) {
  const [selectedIdxs, setSelectedIdxs] = useState<number[]>([sessions.length - 1])
  const captureRef = useRef<HTMLDivElement>(null)

  if (!sessions.length) return null

  const isMulti = selectedIdxs.length > 1

  const toggleIdx = (i: number) => {
    setSelectedIdxs((prev) => {
      if (prev.includes(i)) {
        if (prev.length === 1) return prev  // 마지막 선택은 해제 불가
        return prev.filter((x) => x !== i)
      }
      return [...prev, i].sort((a, b) => a - b)
    })
  }

  // 단일 모드
  const singleIdx = selectedIdxs[selectedIdxs.length - 1]
  const current = sessions[singleIdx]
  const prev = singleIdx > 0 ? sessions[singleIdx - 1] : null
  const prevMap = new Map(prev?.items.map((it) => [it.id, it]) ?? [])
  const singleGroups = groupBySection(current.items)

  // 비교 모드
  const compGroups = isMulti ? buildComparison(sessions, selectedIdxs) : []
  const selectedSessions = selectedIdxs.map((i) => sessions[i])

  const sessionLabel = (s: BlogLabSession, i: number) =>
    visitLabel(s.label || `검사 ${i + 1}`)

  const handleSavePng = async () => {
    if (!captureRef.current) return
    try {
      toast.loading('이미지를 생성하는 중…', { id: 'lab-png' })
      const html2canvas = (await import('html2canvas')).default

      let targetEl: HTMLElement = captureRef.current
      let cloneEl: HTMLElement | null = null

      if (isMulti) {
        // 비교 모드: overflow-x: auto 제한 없이 전체 테이블을 캡처하기 위해
        // off-screen 복제본을 만들어 overflow 제약을 제거한 뒤 캡처
        cloneEl = captureRef.current.cloneNode(true) as HTMLElement
        Object.assign(cloneEl.style, {
          position: 'fixed',
          top: '0px',
          left: '-99999px',
          width: 'max-content',
          maxWidth: 'none',
          overflow: 'visible',
        })
        const scrollContainer = cloneEl.querySelector('.overflow-x-auto') as HTMLElement | null
        if (scrollContainer) {
          Object.assign(scrollContainer.style, { overflow: 'visible', width: 'max-content' })
        }
        // sticky 포지셔닝 제거: scroll container가 없으면 left 값이 잘못 계산되어 컬럼이 밀림
        cloneEl.querySelectorAll<HTMLElement>('td.sticky, th.sticky').forEach((el) => {
          el.style.position = 'static'
          el.style.left = 'auto'
          el.style.zIndex = 'auto'
          el.style.boxShadow = 'none'
        })
        document.body.appendChild(cloneEl)
        targetEl = cloneEl
      }

      const canvas = await html2canvas(targetEl, {
        scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff',
      })

      if (cloneEl) document.body.removeChild(cloneEl)

      const link = document.createElement('a')
      const label = isMulti
        ? selectedSessions.map((s, i) => sessionLabel(s, selectedIdxs[i])).join('_')
        : sessionLabel(current, singleIdx)
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
          size="sm" variant="outline" onClick={handleSavePng}
          className="h-7 gap-1 px-2.5 text-[11px] text-slate-500"
        >
          <Download size={11} />
          이미지로 저장
        </Button>
      </div>

      {/* 날짜 배지 */}
      {sessions.length > 1 && (
        <div className="flex gap-1 flex-wrap">
          {sessions.map((s, i) => {
            const isSelected = selectedIdxs.includes(i)
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggleIdx(i)}
                className={cn(
                  'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors',
                  isSelected
                    ? 'border-teal-500 bg-teal-500 text-white'
                    : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600',
                )}
              >
                {sessionLabel(s, i)}
              </button>
            )
          })}
          {isMulti && (
            <span className="self-center text-[10px] text-slate-400 ml-1">
              {selectedIdxs.length}개 비교 중
            </span>
          )}
        </div>
      )}

      {/* 캡처 영역 */}
      <div ref={captureRef} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {/* 캡처용 헤더 */}
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">
            {isMulti
              ? selectedSessions.map((s, i) => sessionLabel(s, selectedIdxs[i])).join(' · ')
              : sessionLabel(current, singleIdx)
            }
          </span>
          {patientName && (
            <span className="text-[11px] text-slate-400">{patientName}</span>
          )}
        </div>

        {/* ── 단일 세션 뷰 ── */}
        {!isMulti && (
          singleGroups.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-slate-400">값이 기록된 항목이 없습니다.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {singleGroups.map(({ section, items }) => {
                const meta = SECTION_ORDER.find((s) => s.section === section)!
                return (
                  <div key={section}>
                    <div className={cn('px-4 py-1.5 flex items-center gap-1.5', meta.bg)}>
                      <span className={cn('text-[11px] font-semibold', meta.color)}>
                        {LAB_SECTION_LABEL[section]}
                      </span>
                    </div>
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
                            <tr key={item.id} className={item.is_abnormal === true ? 'bg-orange-50/50' : ''}>
                              <td className="px-4 py-2">
                                <span className="font-medium text-slate-700">{item.nameKo}</span>
                                <span className="ml-1 text-[10px] text-slate-400">({item.nameEn})</span>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <span className={cn('font-semibold', item.is_abnormal === true ? 'text-orange-600' : 'text-slate-700')}>
                                  {item.value}
                                </span>
                                {prev && prevItem && <Trend cur={item.value} prev={prevItem.value} />}
                              </td>
                              <td className="px-3 py-2 text-slate-500">{item.unit}</td>
                              <td className="px-3 py-2 text-slate-400">{item.ref_range ?? '—'}</td>
                              {prev && (
                                <td className="px-3 py-2 text-center text-slate-400">{prevItem?.value ?? '—'}</td>
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
          )
        )}

        {/* ── 비교 뷰 ── */}
        {isMulti && (
          compGroups.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-slate-400">값이 기록된 항목이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              {/*
                단일 테이블 + 다중 tbody 구조:
                - border-separate + border-spacing-0 필수 (border-collapse는 sticky와 충돌)
                - 섹션 헤더를 <tr>의 sticky <td>로 구성해야 수평 고정이 작동함
              */}
              <table className="w-full text-xs border-separate border-spacing-0">
                <thead>
                  <tr className="text-left text-[10px] text-slate-400">
                    <th className="sticky left-0 z-20 bg-slate-50 px-4 py-1.5 font-medium min-w-[160px] border-b border-slate-100">
                      항목
                    </th>
                    <th className="sticky left-[160px] z-20 bg-slate-50 px-2 py-1.5 font-medium min-w-[50px] border-b border-slate-100">
                      단위
                    </th>
                    <th className="sticky left-[210px] z-20 bg-slate-50 px-2 py-1.5 font-medium min-w-[92px] border-b border-r border-slate-200 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.08)]">
                      정상범위
                    </th>
                    {selectedSessions.map((s, colIdx) => (
                      <th key={colIdx} className="px-3 py-1.5 font-medium text-center text-teal-600 whitespace-nowrap min-w-[76px] border-b border-slate-100">
                        {sessionLabel(s, selectedIdxs[colIdx])}
                      </th>
                    ))}
                  </tr>
                </thead>
                {compGroups.map(({ section, rows }) => {
                  const meta = SECTION_ORDER.find((s) => s.section === section)!
                  return (
                    <tbody key={section}>
                      {/* 섹션 헤더 행 — sticky td로 구성해야 수평 고정됨 */}
                      <tr>
                        <td className={cn('sticky left-0 z-10 px-4 py-1.5 border-t border-slate-100', meta.bg)}>
                          <span className={cn('text-[11px] font-semibold', meta.color)}>
                            {LAB_SECTION_LABEL[section]}
                          </span>
                        </td>
                        <td className={cn('sticky left-[160px] z-10 border-t border-slate-100', meta.bg)} />
                        <td className={cn('sticky left-[210px] z-10 border-t border-r border-slate-200 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.08)]', meta.bg)} />
                        {selectedSessions.map((_, colIdx) => (
                          <td key={colIdx} className={cn('border-t border-slate-100', meta.bg)} />
                        ))}
                      </tr>
                      {/* 데이터 행 */}
                      {rows.map(({ meta: item, values }) => {
                        const anyAbnormal = values.some((v) => v.isAbnormal === true)
                        const rowBg = anyAbnormal ? 'bg-orange-50' : 'bg-white'
                        return (
                          <tr key={item.id}>
                            <td className={cn('sticky left-0 z-10 px-4 py-2 border-b border-slate-50', rowBg)}>
                              <span className="font-medium text-slate-700">{item.nameKo}</span>
                              <span className="ml-1 text-[10px] text-slate-400">({item.nameEn})</span>
                            </td>
                            <td className={cn('sticky left-[160px] z-10 px-2 py-2 text-slate-500 whitespace-nowrap border-b border-slate-50', rowBg)}>
                              {item.unit}
                            </td>
                            <td className={cn('sticky left-[210px] z-10 px-2 py-2 text-slate-400 whitespace-nowrap border-b border-r border-slate-200 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.08)]', rowBg)}>
                              {item.ref_range ?? '—'}
                            </td>
                            {values.map((v, colIdx) => (
                              <td key={colIdx} className="px-3 py-2 text-center border-b border-slate-50">
                                {v.value ? (
                                  <span className={cn('font-semibold', v.isAbnormal === true ? 'text-orange-600' : 'text-slate-700')}>
                                    {v.value}
                                    {colIdx > 0 && <Trend cur={v.value} prev={values[colIdx - 1].value} />}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        )
                      })}
                    </tbody>
                  )
                })}
              </table>
            </div>
          )
        )}

        {/* 범례 */}
        {!isMulti && prev && (
          <div className="border-t border-slate-100 px-4 py-2 text-[10px] text-slate-400">
            이전 검사({cleanLabel(prev.label || prev.date || '')})와 비교&nbsp;&nbsp;
            <span className="font-bold text-red-400">↑</span> 증가&nbsp;
            <span className="font-bold text-blue-400">↓</span> 감소&nbsp;
            <span>→</span> 동일
          </div>
        )}
        {isMulti && (
          <div className="border-t border-slate-100 px-4 py-2 text-[10px] text-slate-400">
            왼쪽 → 오른쪽 시간순&nbsp;&nbsp;
            <span className="font-bold text-red-400">↑</span> 직전 대비 증가&nbsp;
            <span className="font-bold text-blue-400">↓</span> 직전 대비 감소
          </div>
        )}

        {/* 수의사 소견 */}
        {comment && (
          <div className="border-t border-slate-100 px-4 py-3">
            <p className="mb-1 text-[11px] font-semibold text-slate-500">수의사 소견</p>
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{comment}</p>
          </div>
        )}
      </div>
    </div>
  )
}
