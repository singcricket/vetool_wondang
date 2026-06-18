'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, ChevronDown, ChevronRight, Pencil, Trash2, Check, X, PackageX, CalendarClock, Hash, Banknote } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  getItemDetailLogs,
  updateUsageLog,
  deleteUsageLog,
  updateStockInLog,
  deleteStockInLog,
} from '@/lib/actions/supply-order/inventory-actions'
import type { ProductDetailLog, UsageLogEntry, InLogEntry } from '@/lib/actions/supply-order/inventory-actions'
import type { InventoryItem } from '@/types/hospital/supply-order-type'

interface Props {
  hosId: string
  item: InventoryItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function InventoryDetailDialog({ hosId, item, open, onOpenChange }: Props) {
  const router = useRouter()
  const [logs, setLogs] = useState<ProductDetailLog[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  // 편집 상태 (IN/OUT 공용)
  const [editingLogId, setEditingLogId] = useState<string | null>(null)
  const [editingType, setEditingType] = useState<'IN' | 'OUT'>('OUT')
  const [editQty, setEditQty] = useState('')
  const [editMemo, setEditMemo] = useState('')
  const [editExpiry, setEditExpiry] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!item) return
    setLoading(true)
    try {
      setLogs(await getItemDetailLogs(hosId, item.item_master_id))
    } catch {
      toast.error('데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [hosId, item])

  useEffect(() => {
    if (!open || !item) return
    setExpandedId(null)
    setEditingLogId(null)
    load()
  }, [open, item, load])

  const startEdit = (log: UsageLogEntry | InLogEntry, type: 'IN' | 'OUT') => {
    setEditingLogId(log.id)
    setEditingType(type)
    setEditQty(String(Math.abs(log.quantity)))
    setEditMemo(log.memo ?? '')
    setEditExpiry(type === 'IN' ? ((log as InLogEntry).expiry_date ?? '') : '')
  }

  const cancelEdit = () => setEditingLogId(null)

  const handleUpdate = async (logId: string) => {
    const qty = Number(editQty)
    if (!qty || qty <= 0) { toast.error('수량을 입력하세요.'); return }
    try {
      setSaving(true)
      if (editingType === 'OUT') {
        await updateUsageLog(hosId, logId, qty, editMemo)
      } else {
        await updateStockInLog(hosId, logId, qty, editMemo, editExpiry || null)
      }
      toast.success('수정되었습니다.')
      setEditingLogId(null)
      await load()
      router.refresh()
    } catch {
      toast.error('수정에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (logId: string, type: 'IN' | 'OUT') => {
    const msg = type === 'IN' ? '입고 기록을 삭제하시겠습니까?' : '사용 기록을 삭제하시겠습니까?'
    if (!confirm(msg)) return
    try {
      setSaving(true)
      if (type === 'OUT') await deleteUsageLog(hosId, logId)
      else await deleteStockInLog(hosId, logId)
      toast.success('삭제되었습니다.')
      await load()
      router.refresh()
    } catch {
      toast.error('삭제에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full max-w-lg flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-5 py-4">
          <DialogTitle className="text-base">
            {item.generic_name}
            <span className="ml-2 text-sm font-normal text-slate-400">재고 상세</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={22} className="animate-spin text-slate-300" />
            </div>
          ) : logs.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-400">입고 내역이 없습니다.</p>
          ) : (
            <div className="divide-y">
              {logs.map((product) => {
                const rowKey = product.item_product_id ?? '__unspecified__'
                const isUnspecified = product.item_product_id === null
                const isExpanded = expandedId === rowKey
                return (
                  <div key={rowKey}>

                    {/* 제품(IN) 행 */}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : rowKey)}
                      className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50"
                    >
                      {isExpanded
                        ? <ChevronDown size={15} className="shrink-0 text-slate-400" />
                        : <ChevronRight size={15} className="shrink-0 text-slate-400" />
                      }
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {isUnspecified && <PackageX size={13} className="shrink-0 text-slate-400" />}
                          <p className={cn(
                            'text-sm font-medium',
                            isUnspecified ? 'text-slate-400' : 'text-slate-800',
                          )}>
                            {product.brand_name}
                          </p>
                        </div>
                        {!isUnspecified && (product.manufacturer || product.specification) && (
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {[product.manufacturer, product.specification].filter(Boolean).join(' · ')}
                          </p>
                        )}
                        {isUnspecified && (
                          <p className="mt-0.5 text-[11px] text-slate-400">제품 미지정으로 입고된 수량</p>
                        )}
                        <p className="mt-1 text-[11px] text-slate-400">
                          입고 {product.in_logs.map((l) => l.created_at.slice(0, 10)).join(', ')}
                          <span className="mx-1 text-slate-200">·</span>
                          총 {product.total_in}{item.base_unit} 입고
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={cn(
                          'text-base font-bold',
                          product.current_stock <= 0 ? 'text-slate-300' : 'text-slate-800',
                        )}>
                          {product.current_stock}
                        </p>
                        <p className="text-[10px] text-slate-400">{item.base_unit}</p>
                      </div>
                    </button>

                    {/* 입고/사용 기록 목록 */}
                    {isExpanded && (
                      <div className="border-t bg-slate-50/60">
                        {/* 입고(IN) 기록 */}
                        <p className="px-5 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">입고</p>
                        {product.in_logs.length === 0 ? (
                          <p className="px-12 py-2 text-xs text-slate-400">입고 기록이 없습니다.</p>
                        ) : (
                          product.in_logs.map((log) => (
                            <div key={log.id} className="border-b px-12 py-2.5 last:border-b-0">
                              {editingLogId === log.id ? (
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="shrink-0 text-[11px] text-slate-400">
                                      {log.created_at.slice(0, 10)}
                                    </span>
                                    <Input
                                      type="number"
                                      min="0.01"
                                      step="0.01"
                                      value={editQty}
                                      onChange={(e) => setEditQty(e.target.value)}
                                      className="h-7 w-20 text-right text-xs"
                                      autoFocus
                                    />
                                    <span className="text-xs text-slate-400">{log.base_unit}</span>
                                    <Input
                                      value={editMemo}
                                      onChange={(e) => setEditMemo(e.target.value)}
                                      placeholder="메모"
                                      className="h-7 min-w-0 flex-1 text-xs"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdate(log.id)}
                                      disabled={saving}
                                      className="shrink-0 text-teal-600 hover:text-teal-700 disabled:opacity-40"
                                    >
                                      {saving
                                        ? <Loader2 size={14} className="animate-spin" />
                                        : <Check size={14} />
                                      }
                                    </button>
                                    <button
                                      type="button"
                                      onClick={cancelEdit}
                                      className="shrink-0 text-slate-400 hover:text-slate-600"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <CalendarClock size={11} className="shrink-0 text-slate-400" />
                                    <Input
                                      type="date"
                                      value={editExpiry}
                                      onChange={(e) => setEditExpiry(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && handleUpdate(log.id)}
                                      className="h-7 w-36 text-xs"
                                    />
                                    <span className="text-[11px] text-slate-400">유통기한</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                  <span className="shrink-0 text-[11px] text-slate-400">
                                    {log.created_at.slice(0, 10)}
                                  </span>
                                  <span className="text-xs font-medium text-teal-700">
                                    입고 {log.quantity}{log.base_unit}
                                  </span>
                                  {log.expiry_date && (() => {
                                    const today = new Date(); today.setHours(0, 0, 0, 0)
                                    const exp = new Date(log.expiry_date!); exp.setHours(0, 0, 0, 0)
                                    const diffDays = Math.floor((exp.getTime() - today.getTime()) / 86400000)
                                    return (
                                      <span className={cn(
                                        'flex items-center gap-0.5 text-[10px] font-medium',
                                        diffDays < 0 ? 'text-red-500' : diffDays <= 30 ? 'text-red-400' : 'text-amber-500',
                                      )}>
                                        <CalendarClock size={10} />
                                        {diffDays < 0 ? '기한초과' : `~${log.expiry_date}`}
                                      </span>
                                    )
                                  })()}
                                  {log.memo && (
                                    <span className="min-w-0 flex-1 truncate text-[11px] text-slate-400">
                                      {log.memo}
                                    </span>
                                  )}
                                  <div className="ml-auto flex shrink-0 gap-0.5">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6"
                                      onClick={() => startEdit(log, 'IN')}
                                    >
                                      <Pencil size={11} />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6 text-red-400 hover:bg-red-50 hover:text-red-600"
                                      onClick={() => handleDelete(log.id, 'IN')}
                                      disabled={saving}
                                    >
                                      <Trash2 size={11} />
                                    </Button>
                                  </div>
                                </div>
                                  {(log.lot_number || log.unit_price != null) && (
                                    <div className="flex flex-wrap items-center gap-3 pl-1">
                                      {log.lot_number && (
                                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                          <Hash size={9} className="shrink-0" />
                                          {log.lot_number}
                                        </span>
                                      )}
                                      {log.unit_price != null && (
                                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                          <Banknote size={9} className="shrink-0" />
                                          {log.unit_price.toLocaleString()}원
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))
                        )}

                        {/* 사용(OUT) 기록 */}
                        <p className="px-5 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">사용</p>
                        {product.out_logs.length === 0 ? (
                          <p className="px-12 py-2 text-xs text-slate-400">사용 기록이 없습니다.</p>
                        ) : (
                          product.out_logs.map((log) => (
                            <div key={log.id} className="border-b px-12 py-2.5 last:border-b-0">
                              {editingLogId === log.id ? (
                                <div className="flex items-center gap-2">
                                  <span className="shrink-0 text-[11px] text-slate-400">
                                    {log.created_at.slice(0, 10)}
                                  </span>
                                  <Input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={editQty}
                                    onChange={(e) => setEditQty(e.target.value)}
                                    className="h-7 w-20 text-right text-xs"
                                    autoFocus
                                  />
                                  <span className="text-xs text-slate-400">{log.base_unit}</span>
                                  <Input
                                    value={editMemo}
                                    onChange={(e) => setEditMemo(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate(log.id)}
                                    placeholder="메모"
                                    className="h-7 min-w-0 flex-1 text-xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdate(log.id)}
                                    disabled={saving}
                                    className="shrink-0 text-teal-600 hover:text-teal-700 disabled:opacity-40"
                                  >
                                    {saving
                                      ? <Loader2 size={14} className="animate-spin" />
                                      : <Check size={14} />
                                    }
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="shrink-0 text-slate-400 hover:text-slate-600"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="shrink-0 text-[11px] text-slate-400">
                                    {log.created_at.slice(0, 10)}
                                  </span>
                                  <span className="text-xs font-medium text-slate-700">
                                    사용 {Math.abs(log.quantity)}{log.base_unit}
                                  </span>
                                  {log.memo && (
                                    <span className="min-w-0 flex-1 truncate text-[11px] text-slate-400">
                                      {log.memo}
                                    </span>
                                  )}
                                  <div className="ml-auto flex shrink-0 gap-0.5">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6"
                                      onClick={() => startEdit(log, 'OUT')}
                                    >
                                      <Pencil size={11} />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6 text-red-400 hover:bg-red-50 hover:text-red-600"
                                      onClick={() => handleDelete(log.id, 'OUT')}
                                      disabled={saving}
                                    >
                                      <Trash2 size={11} />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
