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
import { Loader2, ChevronDown, ChevronRight, Pencil, Trash2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  getItemDetailLogs,
  updateUsageLog,
  deleteUsageLog,
} from '@/lib/actions/supply-order/inventory-actions'
import type { ProductDetailLog, UsageLogEntry } from '@/lib/actions/supply-order/inventory-actions'
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
  const [editingLogId, setEditingLogId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState('')
  const [editMemo, setEditMemo] = useState('')
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

  const startEdit = (log: UsageLogEntry) => {
    setEditingLogId(log.id)
    setEditQty(String(Math.abs(log.quantity)))
    setEditMemo(log.memo ?? '')
  }

  const cancelEdit = () => setEditingLogId(null)

  const handleUpdate = async (logId: string) => {
    const qty = Number(editQty)
    if (!qty || qty <= 0) { toast.error('수량을 입력하세요.'); return }
    try {
      setSaving(true)
      await updateUsageLog(hosId, logId, qty, editMemo)
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

  const handleDelete = async (logId: string) => {
    if (!confirm('사용 기록을 삭제하시겠습니까?')) return
    try {
      setSaving(true)
      await deleteUsageLog(hosId, logId)
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
                const isExpanded = expandedId === product.item_product_id
                return (
                  <div key={product.item_product_id}>

                    {/* 제품(IN) 행 */}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : product.item_product_id)}
                      className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50"
                    >
                      {isExpanded
                        ? <ChevronDown size={15} className="shrink-0 text-slate-400" />
                        : <ChevronRight size={15} className="shrink-0 text-slate-400" />
                      }
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800">{product.brand_name}</p>
                        {(product.manufacturer || product.specification) && (
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {[product.manufacturer, product.specification].filter(Boolean).join(' · ')}
                          </p>
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

                    {/* 사용 기록(OUT) 목록 */}
                    {isExpanded && (
                      <div className="border-t bg-slate-50/60">
                        {product.out_logs.length === 0 ? (
                          <p className="px-12 py-3 text-xs text-slate-400">사용 기록이 없습니다.</p>
                        ) : (
                          product.out_logs.map((log) => (
                            <div key={log.id} className="border-b px-12 py-2.5 last:border-b-0">
                              {editingLogId === log.id ? (
                                /* 편집 모드 */
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
                                /* 보기 모드 */
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
                                      onClick={() => startEdit(log)}
                                    >
                                      <Pencil size={11} />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6 text-red-400 hover:bg-red-50 hover:text-red-600"
                                      onClick={() => handleDelete(log.id)}
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
