'use client'

import { useState, useTransition } from 'react'
import { PackageSearch, Truck, Pencil, Trash2, Check, X, ChevronLeft, ChevronRight, CalendarDays, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import {
  getStockInLogsByDateRange,
  updateStockInLog,
  deleteStockInLog,
  type StockInLogItem,
} from '@/lib/actions/supply-order/inventory-actions'

interface Props {
  hosId: string
  initialLogs: StockInLogItem[]
  initialStart: string
  initialEnd: string
  vendors: { id: string; name: string }[]
}

type ViewMode = 'vendor_date' | 'date_vendor'

function toLocalDateString(date: Date) {
  return date.toLocaleDateString('sv-SE')
}
function today() { return toLocalDateString(new Date()) }
function mondayOfThisWeek() {
  const d = new Date()
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return toLocalDateString(d)
}
function firstOfThisMonth() {
  const d = new Date(); d.setDate(1); return toLocalDateString(d)
}
function shiftDate(dateStr: string, days: number) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return toLocalDateString(d)
}
function formatDateTime(isoStr: string) {
  return new Date(isoStr).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
}
function formatDateLabel(dateStr: string) {
  const t = today()
  if (dateStr === t) return `${dateStr} (오늘)`
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  if (dateStr === toLocalDateString(yesterday)) return `${dateStr} (어제)`
  return dateStr
}
function refTypeLabel(ref: string | null) {
  if (ref === 'manual_in') return '수동입고'
  if (ref === 'delivery') return '배송입고'
  if (ref === 'upload') return '명세서'
  return ref ?? ''
}

type EditState = {
  logId: string
  quantity: string
  expiryDate: string
  lotNumber: string
  vendorId: string
}

// ── 개별 입고 행 ──────────────────────────────────────────────

function LogRow({
  log, vendors, hosId,
  onUpdate, onDelete,
}: {
  log: StockInLogItem
  vendors: { id: string; name: string }[]
  hosId: string
  onUpdate: (updated: StockInLogItem) => void
  onDelete: (id: string) => void
}) {
  const [editState, setEditState] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const openEdit = () => setEditState({
    logId: log.id,
    quantity: String(log.quantity),
    expiryDate: log.expiry_date ?? '',
    lotNumber: log.lot_number ?? '',
    vendorId: log.vendor_id ?? '',
  })

  const saveEdit = async () => {
    if (!editState) return
    const qty = Number(editState.quantity)
    if (!qty || qty <= 0) { toast.error('수량은 0보다 커야 합니다.'); return }
    setSaving(true)
    try {
      await updateStockInLog(
        hosId, log.id, qty, log.memo ?? '',
        editState.expiryDate || null,
        editState.lotNumber || null,
        editState.vendorId || null,
      )
      const vendorName = vendors.find((v) => v.id === editState.vendorId)?.name ?? null
      onUpdate({
        ...log,
        quantity: qty,
        expiry_date: editState.expiryDate || null,
        lot_number: editState.lotNumber || null,
        vendor_id: editState.vendorId || null,
        vendor_name: vendorName,
      })
      setEditState(null)
      toast.success('수정되었습니다.')
    } catch {
      toast.error('수정에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`"${log.generic_name}" 입고 기록을 삭제하시겠습니까?\n삭제 시 재고에서도 차감됩니다.`)) return
    setDeleting(true)
    try {
      await deleteStockInLog(hosId, log.id)
      onDelete(log.id)
      toast.success('삭제되었습니다.')
    } catch {
      toast.error('삭제에 실패했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={cn('rounded-lg border bg-white transition-colors', editState ? 'border-teal-300' : 'border-slate-200')}>
      {!editState ? (
        <div className="flex items-center gap-2 px-3 py-2.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-medium text-slate-800">
                {log.brand_name ?? log.generic_name}
                {log.brand_name && log.generic_name && (
                  <span className="ml-1 text-xs font-normal text-slate-400">({log.generic_name})</span>
                )}
              </span>
              {log.reference_type && log.reference_type !== 'manual_in' && (
                <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-medium text-indigo-500">
                  {refTypeLabel(log.reference_type)}
                </span>
              )}
            </div>
            {(log.manufacturer || log.specification || log.ingredient) && (
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                {log.manufacturer && <span>{log.manufacturer}</span>}
                {log.specification && <span>{log.specification}</span>}
                {log.ingredient && <span>{log.ingredient}</span>}
              </div>
            )}
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
              {log.lot_number && <span>LOT {log.lot_number}</span>}
              {log.expiry_date && <span>유효 {log.expiry_date}</span>}
              {log.memo && <span className="truncate">{log.memo}</span>}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold text-teal-700">
              +{log.quantity} <span className="text-xs font-normal text-slate-400">{log.base_unit}</span>
            </p>
            {log.unit_price != null && (
              <p className="text-[11px] text-slate-400">{log.unit_price.toLocaleString()}원</p>
            )}
            <p className="text-[10px] text-slate-300">{formatDateTime(log.created_at)}</p>
          </div>
          <div className="shrink-0 flex items-center gap-0.5">
            <button
              type="button"
              onClick={openEdit}
              className="rounded p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              title="수정"
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-colors disabled:opacity-40"
              title="삭제"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ) : (
        <div className="px-3 py-3 space-y-2">
          <p className="text-xs font-semibold text-teal-700">{log.brand_name ?? log.generic_name} 수정</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500">수량 *</p>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={editState.quantity}
                  onChange={(e) => setEditState({ ...editState, quantity: e.target.value })}
                  className="h-7 text-xs"
                />
                <span className="shrink-0 text-[11px] text-slate-400">{log.base_unit}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500">유효기간</p>
              <Input
                type="date"
                value={editState.expiryDate}
                onChange={(e) => setEditState({ ...editState, expiryDate: e.target.value })}
                className="h-7 text-xs"
              />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500">일련번호 (LOT)</p>
            <Input
              value={editState.lotNumber}
              onChange={(e) => setEditState({ ...editState, lotNumber: e.target.value })}
              placeholder="LOT-XXXXX"
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500">업체</p>
            <select
              value={editState.vendorId}
              onChange={(e) => setEditState({ ...editState, vendorId: e.target.value })}
              className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs focus:border-teal-400 focus:outline-none"
            >
              <option value="">업체 미지정</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setEditState(null)}
              className="flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-200 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
            >
              <X size={12} /> 취소
            </button>
            <button
              type="button"
              onClick={saveEdit}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-1 rounded-md bg-teal-600 py-1.5 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50"
            >
              <Check size={12} /> {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────

export default function StockInHistoryClient({ hosId, initialLogs, initialStart, initialEnd, vendors }: Props) {
  const [startDate, setStartDate] = useState(initialStart)
  const [endDate, setEndDate] = useState(initialEnd)
  const [logs, setLogs] = useState<StockInLogItem[]>(initialLogs)
  const [isPending, startTransition] = useTransition()
  const [viewMode, setViewMode] = useState<ViewMode>('vendor_date')

  const isSingleDay = startDate === endDate

  const fetchLogs = (start: string, end: string) => {
    startTransition(async () => {
      const result = await getStockInLogsByDateRange(hosId, start, end)
      setLogs(result)
    })
  }

  const applyDates = (start: string, end: string) => {
    setStartDate(start); setEndDate(end); fetchLogs(start, end)
  }

  const handleStartChange = (val: string) => {
    setStartDate(val)
    if (val <= endDate) fetchLogs(val, endDate)
  }
  const handleEndChange = (val: string) => {
    setEndDate(val)
    if (startDate <= val) fetchLogs(startDate, val)
  }
  const applyPreset = (start: string, end: string) => applyDates(start, end)

  // 하루씩 이동 (범위 전체를 ±1일 이동)
  const shiftRange = (days: number) => {
    applyDates(shiftDate(startDate, days), shiftDate(endDate, days))
  }

  const handleUpdate = (updated: StockInLogItem) => {
    setLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
  }
  const handleDelete = (id: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== id))
  }

  // ── 그룹 헬퍼 ────────────────────────────────────────────────

  function groupByVendorThenDate(allLogs: StockInLogItem[]) {
    const map = new Map<string, { name: string; byDate: Map<string, StockInLogItem[]> }>()
    for (const log of allLogs) {
      const key = log.vendor_id ?? '__none__'
      const name = log.vendor_name ?? '업체 미지정'
      const date = log.created_at.slice(0, 10)
      if (!map.has(key)) map.set(key, { name, byDate: new Map() })
      const vg = map.get(key)!
      if (!vg.byDate.has(date)) vg.byDate.set(date, [])
      vg.byDate.get(date)!.push(log)
    }
    return Array.from(map.entries())
      .sort(([ka, va], [kb, vb]) => {
        if (ka === '__none__') return 1
        if (kb === '__none__') return -1
        return vb.byDate.size === va.byDate.size
          ? [...vb.byDate.values()].flat().length - [...va.byDate.values()].flat().length
          : 0
      })
  }

  function groupByDateThenVendor(allLogs: StockInLogItem[]) {
    const map = new Map<string, Map<string, { name: string; logs: StockInLogItem[] }>>()
    for (const log of allLogs) {
      const date = log.created_at.slice(0, 10)
      const vKey = log.vendor_id ?? '__none__'
      const vName = log.vendor_name ?? '업체 미지정'
      if (!map.has(date)) map.set(date, new Map())
      const dg = map.get(date)!
      if (!dg.has(vKey)) dg.set(vKey, { name: vName, logs: [] })
      dg.get(vKey)!.logs.push(log)
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a))
  }

  const vendorDateGroups = groupByVendorThenDate(logs)
  const dateThenVendorGroups = groupByDateThenVendor(logs)

  return (
    <div className="flex flex-col gap-0">
      {/* 헤더 */}
      <div className="shrink-0 border-b bg-white px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">입고내역</h2>
        <p className="mt-0.5 text-xs text-slate-400">기간별 입고 현황을 확인합니다.</p>
      </div>

      {/* 날짜 필터 */}
      <div className="sticky top-0 z-10 border-b bg-white px-4 py-3 space-y-2">
        {/* 날짜 입력 + 하루 이동 버튼 */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => shiftRange(-1)}
            className="rounded-md border border-slate-200 p-1.5 text-slate-400 hover:border-teal-400 hover:text-teal-600 transition-colors"
            title="하루 이전"
          >
            <ChevronLeft size={14} />
          </button>
          <input
            type="date"
            value={startDate}
            max={endDate}
            onChange={(e) => handleStartChange(e.target.value)}
            className="flex-1 rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-700 focus:border-teal-400 focus:outline-none"
          />
          <span className="text-xs text-slate-400">~</span>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => handleEndChange(e.target.value)}
            className="flex-1 rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-700 focus:border-teal-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => shiftRange(1)}
            disabled={endDate >= today()}
            className="rounded-md border border-slate-200 p-1.5 text-slate-400 hover:border-teal-400 hover:text-teal-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="하루 다음"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* 프리셋 + 보기 옵션 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            {[
              { label: '오늘', start: today(), end: today() },
              { label: '이번 주', start: mondayOfThisWeek(), end: today() },
              { label: '이번 달', start: firstOfThisMonth(), end: today() },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset.start, preset.end)}
                className={cn(
                  'rounded-full border px-3 py-0.5 text-[11px] font-medium transition-colors',
                  startDate === preset.start && endDate === preset.end
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300',
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* 보기 모드 토글 (기간이 하루 이상일 때만) */}
          {!isSingleDay && (
            <div className="flex rounded-md border border-slate-200 overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('date_vendor')}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 text-[10px] transition-colors',
                  viewMode === 'date_vendor'
                    ? 'bg-teal-600 text-white'
                    : 'bg-white text-slate-400 hover:text-slate-600',
                )}
                title="날짜 → 업체"
              >
                <CalendarDays size={11} />
                <span>날짜</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('vendor_date')}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 text-[10px] transition-colors border-l border-slate-200',
                  viewMode === 'vendor_date'
                    ? 'bg-teal-600 text-white'
                    : 'bg-white text-slate-400 hover:text-slate-600',
                )}
                title="업체 → 날짜"
              >
                <Building2 size={11} />
                <span>업체</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 목록 */}
      <div className={cn('flex flex-col gap-0 p-4', isPending && 'opacity-50 pointer-events-none')}>
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
            <PackageSearch size={32} strokeWidth={1.2} />
            <p className="text-sm">해당 기간에 입고 내역이 없습니다.</p>
          </div>
        ) : (isSingleDay || viewMode === 'vendor_date') ? (
          // ── 업체 → 날짜 ──
          vendorDateGroups.map(([vendorKey, { name, byDate }]) => (
            <div key={vendorKey} className="mb-6">
              <div className="mb-2 flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
                <Truck size={14} className="shrink-0 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">{name}</span>
                <span className="ml-auto text-[11px] text-slate-400">
                  {[...byDate.values()].flat().length}건
                </span>
              </div>
              {Array.from(byDate.entries())
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([date, dateLogs]) => (
                  <div key={date} className="mb-3 pl-1">
                    {!isSingleDay && (
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-400">{formatDateLabel(date)}</span>
                        <span className="text-[10px] text-slate-300">{dateLogs.length}건</span>
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      {dateLogs.map((log) => (
                        <LogRow
                          key={log.id}
                          log={log}
                          vendors={vendors}
                          hosId={hosId}
                          onUpdate={handleUpdate}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          ))
        ) : (
          // ── 날짜 → 업체 ──
          dateThenVendorGroups.map(([date, vendorMap]) => (
            <div key={date} className="mb-6">
              <div className="mb-2 flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
                <CalendarDays size={14} className="shrink-0 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">{formatDateLabel(date)}</span>
                <span className="ml-auto text-[11px] text-slate-400">
                  {[...vendorMap.values()].flatMap((v) => v.logs).length}건
                </span>
              </div>
              {Array.from(vendorMap.entries())
                .sort(([ka], [kb]) => {
                  if (ka === '__none__') return 1
                  if (kb === '__none__') return -1
                  return vendorMap.get(kb)!.logs.length - vendorMap.get(ka)!.logs.length
                })
                .map(([vKey, { name, logs: vLogs }]) => (
                  <div key={vKey} className="mb-3 pl-1">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Truck size={11} className="shrink-0 text-slate-400" />
                      <span className="text-[11px] font-semibold text-slate-500">{name}</span>
                      <span className="text-[10px] text-slate-300">{vLogs.length}건</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {vLogs.map((log) => (
                        <LogRow
                          key={log.id}
                          log={log}
                          vendors={vendors}
                          hosId={hosId}
                          onUpdate={handleUpdate}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
