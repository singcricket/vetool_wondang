'use client'

import { useState, useEffect, useRef } from 'react'
import { List, X, ChevronRight } from 'lucide-react'
import type { ResolvedOrganSection } from '@/lib/config/checkup-report-modules'

interface NavItem {
  id: string
  label: string
  sub?: { id: string; label: string }[]
}

interface Props {
  organSections: ResolvedOrganSection[]
  hasPhysical: boolean
  hasNeuro: boolean
  hasLab: boolean
  hasPlan: boolean
  hasFollowup: boolean
  hasAppendixImaging: boolean
}

export function ReportFloatingNav({
  organSections,
  hasPhysical,
  hasNeuro,
  hasLab,
  hasPlan,
  hasFollowup,
  hasAppendixImaging,
}: Props) {
  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState<string>('')
  const panelRef = useRef<HTMLDivElement>(null)

  const items: NavItem[] = [
    { id: 'section-header', label: '환자 정보' },
    { id: 'section-summary', label: '종합 요약' },
    { id: 'section-inquiry', label: '문진' },
    ...(hasPhysical ? [{ id: 'section-physical', label: '신체검사' }] : []),
    ...(hasNeuro ? [{ id: 'section-neuro', label: '신경계' }] : []),
    ...(organSections.length > 0
      ? [{
          id: 'section-organs',
          label: '장기별 평가',
          sub: organSections.map((s) => ({ id: `organ-${s.key}`, label: s.label })),
        }]
      : []),
    ...(hasPlan ? [{ id: 'section-plan', label: '권고사항' }] : []),
    ...(hasFollowup ? [{ id: 'section-followup', label: '추적 관찰' }] : []),
    ...(hasLab ? [{ id: 'section-appendix-lab', label: '부록: 임상병리' }] : []),
    ...(hasAppendixImaging ? [{ id: 'section-appendix-imaging', label: '부록: 영상검사' }] : []),
  ]

  // IntersectionObserver — 현재 화면에 보이는 섹션 추적
  useEffect(() => {
    const allIds = items.flatMap((item) => [item.id, ...(item.sub?.map((c) => c.id) ?? [])])

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-10% 0px -70% 0px', threshold: 0 },
    )

    allIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organSections.length, hasPhysical, hasNeuro, hasLab, hasPlan, hasFollowup])

  // 패널 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setOpen(false)
  }

  return (
    <div ref={panelRef} className="no-print fixed right-4 top-14 z-50 flex flex-col items-end gap-2">
      {/* 패널 */}
      {open && (
        <div className="w-52 rounded-xl bg-white shadow-xl ring-1 ring-slate-200">
          <div className="max-h-[calc(100vh-120px)] overflow-y-auto py-1.5">
            {items.map((item) => (
              <div key={item.id}>
                <button
                  onClick={() => scrollTo(item.id)}
                  className={`w-full px-4 py-1.5 text-left text-xs font-medium transition-colors ${
                    activeId === item.id
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
                {item.sub?.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => scrollTo(child.id)}
                    className={`flex w-full items-center gap-1 py-1 pl-7 pr-4 text-left text-xs transition-colors ${
                      activeId === child.id
                        ? 'font-medium text-teal-600'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <ChevronRight size={10} className="shrink-0" />
                    {child.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 토글 버튼 */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="목차"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg transition-colors hover:bg-teal-700"
      >
        {open ? <X size={15} /> : <List size={15} />}
      </button>
    </div>
  )
}
