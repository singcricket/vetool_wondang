'use client'

import { useState, useMemo } from 'react'
import { CheckIcon, XIcon, ChevronDownIcon, FlaskConicalIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  approveAiOrder,
  rejectAiOrder,
  type StoredAiOrder,
} from '@/lib/actions/icu/ai-session-actions'
import { parseDoseMgPerKg } from '@/lib/utils/icu/drug-calc'
import { DEFAULT_ICU_ORDER_TYPE_DIC } from '@/constants/hospital/icu/chart/order'

const TYPE_COLORS: Record<string, string> = {
  fluid:     'bg-blue-100 text-blue-700',
  injection: 'bg-orange-100 text-orange-700',
  po:        'bg-green-100 text-green-700',
  checklist: 'bg-slate-100 text-slate-600',
  test:      'bg-purple-100 text-purple-700',
  feed:      'bg-yellow-100 text-yellow-700',
  manual:    'bg-gray-100 text-gray-600',
}

interface Props {
  order: StoredAiOrder
  hosId: string
  icuChartId: string
  patientWeight: string   // chartData.weight (kg, string)
  onUpdated: () => void
}

export default function AiOrderCard({ order, hosId, icuChartId, patientWeight, onUpdated }: Props) {
  const detail = order.order_detail ?? {}
  const orderComment = detail.order_comment ?? ''
  const orderTimes: string[] = detail.order_times ?? []

  const [expanded, setExpanded] = useState(false)
  const [rejectMode, setRejectMode] = useState(false)
  const [vetComment, setVetComment] = useState('')
  const [drugConc, setDrugConc] = useState('')
  const [loading, setLoading] = useState(false)

  const isDone = order.approval_status !== 'pending'
  const isInjection = order.order_type === 'injection'

  // 실시간 용량 계산 (주사 오더 + 농도 입력 시)
  const calcPreview = useMemo(() => {
    if (!isInjection || !drugConc) return null
    const conc = parseFloat(drugConc)
    const weight = parseFloat(patientWeight)
    if (!conc || conc <= 0 || !weight || weight <= 0) return null

    const doseMgKg = parseDoseMgPerKg(orderComment)
    if (!doseMgKg) return null

    const totalMg  = Math.round(doseMgKg * weight * 100) / 100
    const volumeMl = Math.round((totalMg / conc) * 100) / 100

    // 계산 검증
    const check = Math.abs(volumeMl * conc - totalMg) < 0.01
    return { doseMgKg, totalMg, volumeMl, conc, weight, valid: check }
  }, [drugConc, patientWeight, orderComment, isInjection])

  const handleApprove = async () => {
    setLoading(true)
    try {
      await approveAiOrder({
        aiOrderId: order.id,
        hosId,
        icuChartId,
        orderType: order.order_type,
        orderName: order.order_name,
        orderComment,
        orderTimes,
        drugConcMgPerMl: drugConc ? parseFloat(drugConc) : null,
        patientWeightKg: patientWeight ? parseFloat(patientWeight) : null,
        vetComment: vetComment || undefined,
      })
      toast.success(`"${order.order_name}" 오더가 차트에 추가되었습니다.`)
      onUpdated()
    } catch (e: any) {
      toast.error(e?.message ?? '승인 실패')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    setLoading(true)
    try {
      await rejectAiOrder({ aiOrderId: order.id, vetComment: vetComment || undefined })
      toast.success('거절되었습니다.')
      onUpdated()
    } catch {
      toast.error('거절 처리 실패')
    } finally {
      setLoading(false)
    }
  }

  const statusBadge =
    order.approval_status === 'approved' ? (
      <Badge className="h-4 bg-green-500 px-1.5 text-[10px] hover:bg-green-500">승인됨</Badge>
    ) : order.approval_status === 'rejected' ? (
      <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">거절됨</Badge>
    ) : null

  return (
    <div className={`rounded-md border bg-white ${isDone ? 'opacity-60' : ''}`}>
      {/* 헤더 */}
      <div
        className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-muted/30"
        onClick={() => setExpanded((v) => !v)}
      >
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold ${TYPE_COLORS[order.order_type] ?? TYPE_COLORS.manual}`}
        >
          {DEFAULT_ICU_ORDER_TYPE_DIC[order.order_type as keyof typeof DEFAULT_ICU_ORDER_TYPE_DIC] ?? order.order_type}
        </span>
        <span className="flex-1 truncate text-sm font-medium">{order.order_name}</span>
        {statusBadge}
        <ChevronDownIcon
          size={14}
          className={`shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </div>

      {expanded && (
        <div className="border-t px-3 pb-3 pt-2">
          {/* 용법 */}
          {orderComment && (
            <p className="mb-1.5 text-xs font-medium text-slate-700">{orderComment}</p>
          )}

          {/* 투여 시간 */}
          {orderTimes.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {orderTimes.map((t) => (
                <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono">{t}</span>
              ))}
            </div>
          )}

          {/* AI 근거 */}
          {order.ai_reasoning && (
            <div className="mb-3 rounded bg-muted/40 px-2.5 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">AI 근거: </span>
              {order.ai_reasoning}
            </div>
          )}

          {/* 수의사 코멘트 (완료된 경우) */}
          {isDone && order.vet_comment && (
            <p className="mb-2 text-xs text-muted-foreground">
              <span className="font-medium">코멘트: </span>{order.vet_comment}
            </p>
          )}

          {/* 약물 농도 입력 + 실시간 계산 */}
          {!isDone && (
            <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2">
              <div className="mb-1.5 flex items-center gap-1 text-[11px] font-medium text-amber-700">
                <FlaskConicalIcon size={11} />
                약물 농도 입력
                <span className="font-normal text-amber-600">
                  {isInjection ? ' — 입력 시 ml 자동 계산' : ' (선택사항)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={drugConc}
                  onChange={(e) => setDrugConc(e.target.value)}
                  placeholder="농도 (예: 10)"
                  type="number"
                  min="0"
                  step="0.1"
                  className="h-7 w-28 text-xs"
                />
                <span className="text-xs text-muted-foreground">mg/mL</span>
              </div>

              {/* 실시간 계산 미리보기 */}
              {calcPreview && (
                <div className="mt-2 rounded border border-green-200 bg-green-50 px-2 py-1.5">
                  <p className="mb-0.5 text-[10px] font-semibold text-green-700">계산 결과</p>
                  <p className="font-mono text-[11px] text-green-800">
                    {calcPreview.doseMgKg} mg/kg × {calcPreview.weight} kg
                    {' = '}
                    <span className="font-bold">{calcPreview.totalMg} mg</span>
                  </p>
                  <p className="font-mono text-[11px] text-green-800">
                    {calcPreview.totalMg} mg ÷ {calcPreview.conc} mg/ml
                    {' = '}
                    <span className="font-bold text-green-700">{calcPreview.volumeMl} ml</span>
                  </p>
                  {!calcPreview.valid && (
                    <p className="mt-0.5 text-[10px] text-amber-600">⚠ 계산 검증 오류 확인 필요</p>
                  )}
                </div>
              )}

              {isInjection && drugConc && !calcPreview && (
                <p className="mt-1.5 text-[10px] text-amber-600">
                  {parseDoseMgPerKg(orderComment)
                    ? '체중 또는 농도 값을 확인해주세요.'
                    : '이 오더에서 mg/kg 용량을 인식할 수 없습니다.'}
                </p>
              )}
            </div>
          )}

          {/* 승인/거절 버튼 */}
          {!isDone && !rejectMode && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-7 flex-1 gap-1 bg-green-600 text-xs hover:bg-green-700"
                onClick={handleApprove}
                disabled={loading}
              >
                <CheckIcon size={12} />
                승인 (차트 적용)
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                onClick={() => setRejectMode(true)}
                disabled={loading}
              >
                <XIcon size={12} />
                거절
              </Button>
            </div>
          )}

          {!isDone && rejectMode && (
            <div className="flex flex-col gap-2">
              <Textarea
                value={vetComment}
                onChange={(e) => setVetComment(e.target.value)}
                placeholder="거절 사유 (선택)"
                className="resize-none text-xs"
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 flex-1 text-xs"
                  onClick={handleReject}
                  disabled={loading}
                >
                  거절 확인
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => setRejectMode(false)}
                  disabled={loading}
                >
                  취소
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
