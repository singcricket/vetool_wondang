'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FileSpreadsheet, Camera, Loader2, CheckCircle2,
  AlertCircle, Circle, SkipForward, RotateCcw, Save,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { toast } from 'sonner'
import {
  parseDeliveryExcel,
  matchItemsWithAI,
  extractFromInvoicePhoto,
  bulkSaveReviewedItems,
} from '@/lib/actions/supply-order/delivery-upload-actions'
import ItemProductCombobox from './item-product-combobox'
import type {
  ItemProduct, ReviewDeliveryItem, ReviewItemMatchStatus,
} from '@/types/hospital/supply-order-type'

type Stage = 'upload' | 'processing' | 'review' | 'saving'

interface Props {
  hosId: string
  deliveryId: string
  vendorId: string
  itemProducts: ItemProduct[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STATUS_STYLE: Record<ReviewItemMatchStatus, { dot: string; card: string; label: string }> = {
  matched:      { dot: 'bg-emerald-500', card: 'border-emerald-200 bg-emerald-50/40', label: '자동매칭' },
  ai_suggested: { dot: 'bg-amber-400',   card: 'border-amber-200 bg-amber-50/40',    label: 'AI 추천'  },
  unmatched:    { dot: 'bg-slate-300',   card: 'border-slate-200 bg-white',           label: '신규등록' },
}

export default function UploadReviewSheet({
  hosId, deliveryId, vendorId, itemProducts, open, onOpenChange,
}: Props) {
  const router = useRouter()
  const excelInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [stage, setStage] = useState<Stage>('upload')
  const [processingLabel, setProcessingLabel] = useState('')
  const [items, setItems] = useState<ReviewDeliveryItem[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const reset = () => {
    setStage('upload')
    setItems([])
    setExpandedId(null)
  }

  const handleOpenChange = (v: boolean) => {
    if (!v) reset()
    onOpenChange(v)
  }

  // ── Excel 처리 ────────────────────────────────────────────

  const handleExcelFile = async (file: File) => {
    try {
      setProcessingLabel('엑셀 파싱 중...')
      setStage('processing')

      const formData = new FormData()
      formData.append('file', file)
      const extracted = await parseDeliveryExcel(formData)

      if (!extracted.length) {
        toast.error('품목을 찾을 수 없습니다. 파일 형식을 확인하세요.')
        setStage('upload')
        return
      }

      setProcessingLabel(`AI 매칭 중... (${extracted.length}개 품목)`)
      const reviewed = await matchItemsWithAI(extracted, itemProducts, vendorId)
      setItems(reviewed)
      setStage('review')
    } catch (e) {
      toast.error('파일 처리에 실패했습니다.')
      setStage('upload')
    }
  }

  // ── 사진 처리 ─────────────────────────────────────────────

  const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
  type AllowedMime = (typeof ALLOWED_MIME)[number]

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const MAX = 1600
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * ratio)
        canvas.height = Math.round(img.height * ratio)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82).split(',')[1])
      }
      img.onerror = reject
      img.src = url
    })

  const handlePhotoFiles = async (files: File[]) => {
    const validFiles = files.filter((f) => ALLOWED_MIME.includes(f.type as AllowedMime))
    if (!validFiles.length) {
      toast.error('JPG, PNG, WEBP, GIF 파일만 지원합니다.')
      return
    }

    try {
      setStage('processing')
      const allExtracted = []

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        setProcessingLabel(
          validFiles.length > 1
            ? `납품전표 OCR 중... (${i + 1}/${validFiles.length}장)`
            : '납품전표 OCR 중...',
        )
        const base64 = await compressImage(file)
        const extracted = await extractFromInvoicePhoto(base64, 'image/jpeg')
        allExtracted.push(...extracted)
      }

      if (!allExtracted.length) {
        toast.error('품목을 추출하지 못했습니다. 다른 사진을 시도해보세요.')
        setStage('upload')
        return
      }

      setProcessingLabel(`AI 매칭 중... (${allExtracted.length}개 품목)`)
      const reviewed = await matchItemsWithAI(allExtracted, itemProducts, vendorId)
      setItems(reviewed)
      setStage('review')
    } catch {
      toast.error('사진 처리에 실패했습니다.')
      setStage('upload')
    }
  }

  // ── 리뷰 아이템 수정 ──────────────────────────────────────

  const updateItem = (id: string, patch: Partial<ReviewDeliveryItem>) =>
    setItems((prev) => prev.map((item) => item._id === id ? { ...item, ...patch } : item))

  const toggleSkip = (id: string) =>
    setItems((prev) => prev.map((item) => {
      if (item._id !== id) return item
      if (item.decision === 'skip') {
        return { ...item, decision: item.matched_product_id ? 'confirm' : 'new_product' }
      }
      return { ...item, decision: 'skip' }
    }))

  const handleProductChange = (id: string, product: ItemProduct) =>
    updateItem(id, {
      matched_product_id: product.id,
      match_status: 'matched',
      match_confidence: 1,
      decision: 'confirm',
    })

  const handleClearMatch = (id: string) =>
    updateItem(id, {
      matched_product_id: null,
      match_status: 'unmatched',
      match_confidence: null,
      decision: 'new_product',
    })

  // ── 저장 ─────────────────────────────────────────────────

  const handleSave = async () => {
    const saveCount = items.filter((i) => i.decision !== 'skip').length
    if (!saveCount) { toast.error('저장할 품목이 없습니다.'); return }
    try {
      setStage('saving')
      await bulkSaveReviewedItems(hosId, deliveryId, items, vendorId)
      toast.success(`${saveCount}개 품목이 추가되었습니다.`)
      handleOpenChange(false)
      router.refresh()
    } catch {
      toast.error('저장에 실패했습니다.')
      setStage('review')
    }
  }

  // ── 통계 ─────────────────────────────────────────────────
  const active = items.filter((i) => i.decision !== 'skip')
  const matchedCount = active.filter((i) => i.match_status === 'matched').length
  const suggestedCount = active.filter((i) => i.match_status === 'ai_suggested').length
  const newCount = active.filter((i) => i.match_status === 'unmatched').length
  const skipCount = items.filter((i) => i.decision === 'skip').length

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex h-full w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="shrink-0 border-b pb-3">
          <SheetTitle className="text-base">납품 품목 일괄 추가</SheetTitle>
        </SheetHeader>

        {/* ── UPLOAD ── */}
        {stage === 'upload' && (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-6 px-1">
            <p className="text-xs text-slate-500">
              엑셀 또는 납품전표 사진을 업로드하면 품목을 자동으로 추출하고 기존 제품과 매칭합니다.
            </p>

            <button
              type="button"
              onClick={() => excelInputRef.current?.click()}
              className="flex items-center gap-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-left hover:border-teal-400 hover:bg-teal-50/40 transition-colors"
            >
              <FileSpreadsheet size={28} className="shrink-0 text-teal-600" />
              <div>
                <p className="text-sm font-semibold text-slate-700">Excel 업로드</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  .xlsx / .xls 파일 · 제품명, 수량, 단가 등 자동 인식
                </p>
              </div>
            </button>
            <input
              ref={excelInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleExcelFile(f)
                e.target.value = ''
              }}
            />

            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="flex items-center gap-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-left hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors"
            >
              <Camera size={28} className="shrink-0 text-indigo-600" />
              <div>
                <p className="text-sm font-semibold text-slate-700">납품전표 사진 업로드</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  JPG / PNG / WEBP · 여러 장 동시 선택 가능 · AI가 품목 목록을 자동 추출
                </p>
              </div>
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? [])
                if (files.length) handlePhotoFiles(files)
                e.target.value = ''
              }}
            />

            <div className="rounded-lg border bg-slate-50 p-3 text-[11px] text-slate-400">
              <p className="font-medium text-slate-500 mb-1">Excel 권장 열 이름</p>
              <p>제품명 · 제조사 · 규격 · 수량 · 단위 · 단가 · 유통기한 · LOT번호</p>
            </div>
          </div>
        )}

        {/* ── PROCESSING ── */}
        {stage === 'processing' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <Loader2 size={32} className="animate-spin text-teal-600" />
            <p className="text-sm text-slate-600">{processingLabel}</p>
          </div>
        )}

        {/* ── REVIEW ── */}
        {(stage === 'review' || stage === 'saving') && (
          <>
            {/* 통계 요약 */}
            <div className="shrink-0 flex flex-wrap gap-2 border-b px-1 py-2.5 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 size={11} /> {matchedCount}개 자동매칭
              </span>
              <span className="flex items-center gap-1 text-amber-600">
                <AlertCircle size={11} /> {suggestedCount}개 AI추천
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <Circle size={11} /> {newCount}개 신규등록
              </span>
              {skipCount > 0 && (
                <span className="flex items-center gap-1 text-slate-400">
                  <SkipForward size={11} /> {skipCount}개 건너뜀
                </span>
              )}
            </div>

            {/* 리뷰 카드 목록 */}
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto py-3 px-1">
              {items.map((item) => {
                const style = STATUS_STYLE[item.match_status]
                const isSkipped = item.decision === 'skip'
                const isExpanded = expandedId === item._id

                return (
                  <div
                    key={item._id}
                    className={cn(
                      'rounded-lg border transition-opacity',
                      style.card,
                      isSkipped && 'opacity-40',
                    )}
                  >
                    {/* 카드 헤더 */}
                    <div className="flex items-center gap-2 p-3">
                      <span className={cn('mt-0.5 h-2 w-2 shrink-0 rounded-full', style.dot)} />
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-medium text-slate-800 truncate', isSkipped && 'line-through')}>
                          {item.raw_name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {[item.raw_manufacturer, item.raw_spec].filter(Boolean).join(' · ') || style.label}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleSkip(item._id)}
                          className="rounded px-1.5 py-0.5 text-[10px] text-slate-400 hover:bg-slate-100"
                        >
                          {isSkipped ? <RotateCcw size={11} /> : <SkipForward size={11} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : item._id)}
                          className="rounded p-0.5 text-slate-400 hover:bg-slate-100"
                        >
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </div>
                    </div>

                    {/* 매칭 제품 표시 (접혀있을 때) */}
                    {!isSkipped && !isExpanded && (
                      <div className="border-t px-3 py-1.5">
                        {item.matched_product_id ? (
                          <p className="text-[11px] text-slate-600 truncate">
                            <span className={cn('mr-1 font-medium', item.match_status === 'matched' ? 'text-emerald-600' : 'text-amber-600')}>
                              {style.label}
                            </span>
                            {itemProducts.find((p) => p.id === item.matched_product_id)?.brand_name ?? '(알 수 없음)'}
                            {item.match_confidence != null && (
                              <span className="ml-1 text-slate-400">
                                {Math.round(item.match_confidence * 100)}%
                              </span>
                            )}
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400">신규 제품으로 등록됩니다</p>
                        )}
                      </div>
                    )}

                    {/* 펼쳐진 편집 영역 */}
                    {!isSkipped && isExpanded && (
                      <div className="space-y-2.5 border-t p-3">
                        {/* 제품 매칭 변경 */}
                        <div className="space-y-1">
                          <p className="text-[10px] font-medium text-slate-500">매칭 제품</p>
                          <ItemProductCombobox
                            itemProducts={itemProducts.filter((p) => p.is_active)}
                            value={item.matched_product_id ?? ''}
                            onChange={(p) => handleProductChange(item._id, p)}
                            placeholder="제품 검색 또는 신규 등록"
                          />
                          {item.matched_product_id && (
                            <button
                              type="button"
                              onClick={() => handleClearMatch(item._id)}
                              className="text-[10px] text-slate-400 hover:text-red-500"
                            >
                              매칭 해제 (신규 등록으로 변경)
                            </button>
                          )}
                        </div>

                        {/* 수량 / 단위 */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <p className="text-[10px] font-medium text-slate-500">수량</p>
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              value={item.quantity_received}
                              onChange={(e) => updateItem(item._id, { quantity_received: Number(e.target.value) })}
                              className="h-7 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-medium text-slate-500">단위</p>
                            <Input
                              value={item.unit}
                              onChange={(e) => updateItem(item._id, { unit: e.target.value })}
                              className="h-7 text-xs"
                            />
                          </div>
                        </div>

                        {/* 단가 / 유통기한 */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <p className="text-[10px] font-medium text-slate-500">단가 (원)</p>
                            <Input
                              type="number"
                              min={0}
                              value={item.unit_price ?? ''}
                              onChange={(e) => updateItem(item._id, { unit_price: e.target.value ? Number(e.target.value) : null })}
                              className="h-7 text-xs"
                              placeholder="0"
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-medium text-slate-500">유통기한</p>
                            <Input
                              type="date"
                              value={item.expiry_date ?? ''}
                              onChange={(e) => updateItem(item._id, { expiry_date: e.target.value || null })}
                              className="h-7 text-xs"
                            />
                          </div>
                        </div>

                        {/* LOT */}
                        <div className="space-y-1">
                          <p className="text-[10px] font-medium text-slate-500">LOT번호</p>
                          <Input
                            value={item.lot_number ?? ''}
                            onChange={(e) => updateItem(item._id, { lot_number: e.target.value || null })}
                            className="h-7 text-xs"
                            placeholder="LOT-XXXXX"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* 저장 버튼 */}
            <div className="shrink-0 border-t pt-3">
              <Button
                onClick={handleSave}
                disabled={stage === 'saving' || active.length === 0}
                className="w-full bg-teal-600 hover:bg-teal-700 gap-1.5"
              >
                {stage === 'saving'
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Save size={14} />}
                {stage === 'saving' ? '저장 중...' : `${active.length}개 품목 저장`}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
