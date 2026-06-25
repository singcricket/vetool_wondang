'use client'

import { useState, useRef } from 'react'
import { Plus, Trash2, Save, RotateCcw, ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils/utils'
import { toast } from 'sonner'
import { saveBlogLabData } from '@/lib/actions/blog/blog-pdf-actions'
import { labRefAll } from '@/constants/hospital/checkup/lab-ref'
import { evaluateLabValue } from '@/lib/utils/lab-evaluate'
import { LAB_SECTION_LABEL } from '@/constants/hospital/checkup/lab-types'
import type { BlogLabSession } from '@/types/hospital/blog-type'
import type { LabResultItem, LabSection, LabSeverity } from '@/constants/hospital/checkup/lab-types'

interface Props {
  hosId: string
  postId: string
  initialSessions: BlogLabSession[]
  initialComment?: string
  species?: string
}

const SECTION_ORDER: LabSection[] = [
  'cbc', 'chemistry', 'liver', 'kidney', 'pancreas',
  'protein', 'glucose', 'lipid', 'electrolyte',
  'endocrine', 'thyroid', 'blood_gas', 'coagulation',
  'urinalysis', 'special',
]

const SEVERITY_COLOR: Record<LabSeverity, string> = {
  critical: 'text-red-600',
  high:     'text-orange-500',
  moderate: 'text-yellow-600',
  mild:     'text-slate-500',
}

function primarySection(item: LabResultItem): LabSection {
  for (const s of SECTION_ORDER) {
    if (item.section.includes(s)) return s
  }
  return item.section[0] ?? 'special'
}

function groupBySection(items: LabResultItem[]) {
  const map = new Map<LabSection, LabResultItem[]>()
  for (const item of items) {
    const sec = primarySection(item)
    if (!map.has(sec)) map.set(sec, [])
    map.get(sec)!.push(item)
  }
  return SECTION_ORDER
    .filter((s) => map.has(s))
    .map((s) => ({ section: s, items: map.get(s)! }))
}

export default function BlogLabEditor({ hosId, postId, initialSessions, initialComment = '', species = '' }: Props) {
  const [sessions, setSessions] = useState<BlogLabSession[]>(initialSessions)
  const [comment, setComment] = useState(initialComment)
  const [selectedIdx, setSelectedIdx] = useState(Math.max(0, initialSessions.length - 1))
  const [saving, setSaving] = useState(false)

  // 세션 추가 폼
  const [addOpen, setAddOpen] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newLabel, setNewLabel] = useState('')

  // 항목 추가
  const [itemSearch, setItemSearch] = useState('')
  const [itemSearchOpen, setItemSearchOpen] = useState(false)
  const [itemValue, setItemValue] = useState('')
  const [selectedRefId, setSelectedRefId] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  const searchResults = itemSearch.length >= 1
    ? labRefAll.filter((r) =>
        r.nameKo.includes(itemSearch) || r.nameEn.toLowerCase().includes(itemSearch.toLowerCase())
      ).slice(0, 8)
    : []

  const selectedRef = selectedRefId ? labRefAll.find((r) => r.id === selectedRefId) : null

  // ── 세션 저장 ──────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    try {
      await saveBlogLabData(hosId, postId, sessions, undefined, comment || undefined)
      toast.success('혈액검사 데이터가 저장됐습니다.')
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // ── 전체 초기화 ────────────────────────────────────────────────
  const handleClearAll = async () => {
    if (!confirm('모든 혈액검사 데이터를 삭제하시겠습니까?')) return
    setSaving(true)
    try {
      await saveBlogLabData(hosId, postId, [], undefined, undefined)
      setSessions([])
      setComment('')
      setSelectedIdx(0)
      toast.success('전체 초기화됐습니다.')
    } catch {
      toast.error('초기화에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // ── 세션 삭제 ──────────────────────────────────────────────────
  const handleDeleteSession = (idx: number) => {
    if (!confirm('이 검사 세션을 삭제하시겠습니까?')) return
    const next = sessions.filter((_, i) => i !== idx)
    setSessions(next)
    setSelectedIdx(Math.max(0, Math.min(idx, next.length - 1)))
  }

  // ── 세션 추가 ──────────────────────────────────────────────────
  const handleAddSession = () => {
    if (!newDate && !newLabel) { toast.error('날짜 또는 레이블을 입력하세요.'); return }
    const session: BlogLabSession = { date: newDate, label: newLabel || undefined, items: [] }
    const next = [...sessions, session]
    setSessions(next)
    setSelectedIdx(next.length - 1)
    setNewDate('')
    setNewLabel('')
    setAddOpen(false)
  }

  // ── 항목 값 수정 ───────────────────────────────────────────────
  const handleValueChange = (sessionIdx: number, itemId: string, value: string) => {
    setSessions((prev) => prev.map((s, si) => {
      if (si !== sessionIdx) return s
      return {
        ...s,
        items: s.items.map((it) => {
          if (it.id !== itemId) return it
          const ref = labRefAll.find((r) => r.id === itemId)
          if (!ref) return { ...it, value: value || null }
          const evaled = value ? evaluateLabValue(value, ref, species, 'manual', it.ref_range) : null
          return {
            ...it,
            value: value || null,
            is_abnormal: evaled ? evaled.isAbnormal : null,
            severity: evaled?.severity ?? null,
            result_text: evaled?.resultTextKo ?? null,
          }
        }),
      }
    }))
  }

  // ── 항목 추가 ──────────────────────────────────────────────────
  const handleAddItem = () => {
    if (!selectedRef) { toast.error('항목을 선택하세요.'); return }
    if (selectedIdx < 0 || selectedIdx >= sessions.length) return

    const currentItems = sessions[selectedIdx].items
    if (currentItems.find((it) => it.id === selectedRef.id)) {
      toast.error('이미 추가된 항목입니다.')
      return
    }

    const evaled = itemValue ? evaluateLabValue(itemValue, selectedRef, species, 'manual', null) : null
    const newItem: LabResultItem = {
      id: selectedRef.id,
      nameEn: selectedRef.nameEn,
      nameKo: selectedRef.nameKo,
      unit: selectedRef.unit,
      value: itemValue || null,
      ref_range: null,
      is_abnormal: evaled ? evaled.isAbnormal : null,
      severity: evaled?.severity ?? null,
      result_text: evaled?.resultTextKo ?? null,
      comment: null,
      source: 'manual',
      section: selectedRef.section,
      descriptionKo: selectedRef.descriptionKo,
    }

    setSessions((prev) => prev.map((s, si) =>
      si !== selectedIdx ? s : { ...s, items: [...s.items, newItem] }
    ))
    setItemSearch('')
    setItemValue('')
    setSelectedRefId(null)
    setItemSearchOpen(false)
  }

  // ── 항목 삭제 ──────────────────────────────────────────────────
  const handleDeleteItem = (sessionIdx: number, itemId: string) => {
    setSessions((prev) => prev.map((s, si) =>
      si !== sessionIdx ? s : { ...s, items: s.items.filter((it) => it.id !== itemId) }
    ))
  }

  const current = sessions[selectedIdx]
  const groups = current ? groupBySection(current.items) : []

  return (
    <div className="space-y-3">
      {/* 소견 입력 */}
      <div className="space-y-1">
        <label className="text-[11px] font-medium text-slate-500">혈액검사 소견</label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="전체 혈액검사에 대한 수의사 소견을 입력하세요. (블로그 혈액검사 표 하단에 표시됩니다)"
          rows={3}
          className="text-xs resize-none"
        />
      </div>

      {/* 상단 액션 */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">
          {sessions.length > 0 ? `${sessions.length}개 세션` : '데이터 없음'}
        </span>
        <div className="flex gap-1.5">
          {sessions.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearAll}
              disabled={saving}
              className="h-7 gap-1 px-2 text-[11px] text-slate-400 hover:text-red-500"
            >
              <RotateCcw size={11} />
              전체 초기화
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="h-7 gap-1 px-2.5 text-[11px] bg-teal-600 hover:bg-teal-700"
          >
            <Save size={11} />
            저장
          </Button>
        </div>
      </div>

      {/* 세션 탭 + 추가 버튼 */}
      <div className="flex flex-wrap items-center gap-1">
        {sessions.map((s, i) => (
          <div key={i} className="flex items-center">
            <button
              type="button"
              onClick={() => setSelectedIdx(i)}
              className={cn(
                'rounded-l-full border px-3 py-1 text-[11px] font-medium transition-colors',
                selectedIdx === i
                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                  : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600',
              )}
            >
              {s.label || s.date || `세션 ${i + 1}`}
            </button>
            <button
              type="button"
              onClick={() => handleDeleteSession(i)}
              className={cn(
                'rounded-r-full border-y border-r px-1.5 py-1 text-[11px] transition-colors',
                selectedIdx === i
                  ? 'border-teal-500 bg-teal-50 text-red-400 hover:bg-red-50 hover:text-red-600'
                  : 'border-slate-200 text-slate-300 hover:border-slate-300 hover:text-red-400',
              )}
            >
              <X size={10} />
            </button>
          </div>
        ))}

        {/* 세션 추가 버튼 */}
        {!addOpen && (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1 text-[11px] text-slate-400 hover:border-teal-400 hover:text-teal-600"
          >
            <Plus size={10} />
            새 세션
          </button>
        )}
      </div>

      {/* 세션 추가 폼 */}
      {addOpen && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-teal-300 bg-teal-50/40 px-3 py-2">
          <Input
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            placeholder="날짜 (예: 2025-03-01)"
            className="h-7 flex-1 text-xs"
          />
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="레이블 (예: 입원 1일차)"
            className="h-7 flex-1 text-xs"
          />
          <Button size="sm" onClick={handleAddSession} className="h-7 px-2.5 text-[11px] bg-teal-600 hover:bg-teal-700">
            생성
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAddOpen(false)} className="h-7 px-2 text-[11px]">
            취소
          </Button>
        </div>
      )}

      {/* 세션 데이터 없는 경우 */}
      {sessions.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
          <p className="text-xs">등록된 혈액검사 데이터가 없습니다.</p>
          <p className="text-[11px]">위의 "새 세션" 버튼으로 직접 추가하거나 AI 분석 탭에서 PDF를 업로드하세요.</p>
        </div>
      )}

      {/* 현재 세션 테이블 */}
      {current && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {/* 세션 헤더 */}
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">
              {current.label || current.date || `세션 ${selectedIdx + 1}`}
            </span>
            <span className="text-[11px] text-slate-400">{current.items.filter((it) => it.value).length}개 값 입력됨</span>
          </div>

          {/* 섹션별 항목 */}
          {groups.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-slate-400">항목이 없습니다. 아래에서 항목을 추가하세요.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {groups.map(({ section, items }) => (
                <div key={section}>
                  <div className="bg-slate-50 px-4 py-1.5">
                    <span className="text-[11px] font-semibold text-slate-500">
                      {LAB_SECTION_LABEL[section]}
                    </span>
                  </div>
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-slate-50">
                      {items.map((item) => (
                        <tr key={item.id} className="group/row">
                          <td className="px-4 py-2 w-40">
                            <span className="font-medium text-slate-700">{item.nameKo}</span>
                            <span className="ml-1 text-[10px] text-slate-400">({item.nameEn})</span>
                          </td>
                          <td className="px-3 py-1.5 w-28">
                            <Input
                              value={item.value ?? ''}
                              onChange={(e) => handleValueChange(selectedIdx, item.id, e.target.value)}
                              placeholder="수치"
                              className="h-7 text-xs w-full"
                            />
                          </td>
                          <td className="px-2 py-2 text-slate-400 w-16">{item.unit}</td>
                          <td className="px-2 py-2 text-slate-400 w-24">{item.ref_range ?? '—'}</td>
                          <td className="px-2 py-2 w-20">
                            {item.is_abnormal === true && item.severity && (
                              <span className={cn('text-[11px] font-semibold', SEVERITY_COLOR[item.severity])}>
                                ↑ {item.severity}
                              </span>
                            )}
                            {item.is_abnormal === false && (
                              <span className="text-[11px] text-teal-500">정상</span>
                            )}
                          </td>
                          <td className="px-2 py-2 w-8">
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(selectedIdx, item.id)}
                              className="hidden text-slate-300 hover:text-red-400 group-hover/row:block"
                            >
                              <X size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* 항목 추가 */}
          <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 space-y-2">
            <p className="text-[11px] font-medium text-slate-500">항목 추가</p>
            <div className="flex gap-2">
              {/* 항목 검색 */}
              <div className="relative flex-1" ref={searchRef}>
                <Input
                  value={selectedRef ? `${selectedRef.nameKo} (${selectedRef.nameEn})` : itemSearch}
                  onChange={(e) => {
                    setItemSearch(e.target.value)
                    setSelectedRefId(null)
                    setItemSearchOpen(true)
                  }}
                  onFocus={() => setItemSearchOpen(true)}
                  placeholder="항목 검색 (예: ALT, 알부민)"
                  className="h-7 text-xs"
                />
                {itemSearchOpen && searchResults.length > 0 && (
                  <div className="absolute top-8 left-0 z-50 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                    {searchResults.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSelectedRefId(r.id)
                          setItemSearch('')
                          setItemSearchOpen(false)
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-slate-50"
                      >
                        <span className="font-medium text-slate-700">{r.nameKo}</span>
                        <span className="text-slate-400">{r.nameEn} · {LAB_SECTION_LABEL[r.section[0]]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 수치 입력 */}
              <Input
                value={itemValue}
                onChange={(e) => setItemValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddItem() }}
                placeholder={selectedRef ? `${selectedRef.unit}` : '수치'}
                className="h-7 w-24 text-xs"
                disabled={!selectedRef}
              />

              <Button
                size="sm"
                onClick={handleAddItem}
                disabled={!selectedRef}
                className="h-7 px-2.5 text-[11px] bg-slate-600 hover:bg-slate-700"
              >
                <Plus size={11} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
