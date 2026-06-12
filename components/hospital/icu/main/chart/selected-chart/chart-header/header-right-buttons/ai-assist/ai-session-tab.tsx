'use client'

import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { BotIcon, RefreshCwIcon, SparklesIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getAiSessions, type StoredAiSession, type VitalRecord } from '@/lib/actions/icu/ai-session-actions'
import AiRequestDialog from './ai-request-dialog'
import AiOrderCard from './ai-order-card'
import type { SelectedIcuChart } from '@/types/icu/chart'

const CERTAINTY_LABEL: Record<string, string> = {
  confirmed: '확진',
  probable:  '가진단',
  suspected: '추측',
  rule_out:  '배제진단',
}

interface Props {
  hosId: string
  chartData: SelectedIcuChart
}

export default function AiSessionTab({ hosId, chartData }: Props) {
  const { icu_chart_id, icu_io, patient, orders } = chartData

  const currentOrders = orders
    .filter((o) => o.icu_chart_order_type !== 'checklist')
    .map((o) => ({
      type: o.icu_chart_order_type,
      name: o.icu_chart_order_name,
      comment: o.icu_chart_order_comment ?? null,
    }))

  // checklist 오더의 처치 결과 → 바이탈/임상 기록
  const currentVitals: VitalRecord[] = orders
    .filter((o) => o.icu_chart_order_type === 'checklist')
    .map((o) => ({
      name: o.icu_chart_order_name,
      results: (o.treatments ?? [])
        .filter((t) => t.icu_chart_tx_result && t.icu_chart_tx_result !== '0')
        .map((t) => ({ time: t.time, result: t.icu_chart_tx_result! })),
    }))
    .filter((v) => v.results.length > 0)

  const [sessions, setSessions] = useState<StoredAiSession[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [requestOpen, setRequestOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAiSessions(icu_io.icu_io_id)
      setSessions(data)
      if (data.length > 0 && !selectedSessionId) {
        setSelectedSessionId(data[0].id)
      }
    } catch {
      toast.error('AI 세션 불러오기 실패')
    } finally {
      setLoading(false)
    }
  }, [icu_io.icu_io_id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) ?? null

  const pendingCount = selectedSession?.orders.filter((o) => o.approval_status === 'pending').length ?? 0
  const summary = (selectedSession?.ai_response as any)?.summary as string | undefined

  return (
    <div className="flex h-full flex-col pt-3">
      {/* 상단 액션 바 */}
      <div className="mb-3 flex items-center gap-2">
        {sessions.length > 0 ? (
          <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
            <SelectTrigger className="h-7 flex-1 text-xs">
              <SelectValue placeholder="세션 선택" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-xs">
                  {format(new Date(s.created_at), 'MM/dd HH:mm', { locale: ko })}
                  {' — '}
                  {s.dx_name}
                  <span className="ml-1 text-muted-foreground">({CERTAINTY_LABEL[s.dx_certainty]})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="flex-1 text-xs text-muted-foreground">아직 AI 추천 없음</span>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={load}
          disabled={loading}
          title="새로고침"
        >
          <RefreshCwIcon size={13} className={loading ? 'animate-spin' : ''} />
        </Button>

        <Button
          size="sm"
          className="h-7 shrink-0 gap-1 text-xs"
          onClick={() => setRequestOpen(true)}
        >
          <SparklesIcon size={12} />
          새 추천
        </Button>
      </div>

      {/* 세션 요약 */}
      {selectedSession && summary && (
        <div className="mb-3 rounded-md border border-blue-100 bg-blue-50 px-3 py-2">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-blue-700">
            <BotIcon size={11} />
            AI 치료 방향 요약
          </div>
          <p className="text-xs leading-relaxed text-slate-700">{summary}</p>
          {pendingCount > 0 && (
            <Badge className="mt-2 h-4 bg-amber-500 px-1.5 text-[10px] hover:bg-amber-500">
              {pendingCount}건 승인 대기
            </Badge>
          )}
        </div>
      )}

      {/* 오더 목록 */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">불러오는 중...</div>
        ) : !selectedSession ? (
          <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
            <BotIcon size={32} strokeWidth={1.2} />
            <p className="text-sm">AI 추천 기록이 없습니다</p>
            <p className="text-xs">검사결과를 등록한 후 AI 추천을 받아보세요.</p>
            <Button size="sm" variant="outline" className="mt-1 text-xs" onClick={() => setRequestOpen(true)}>
              <SparklesIcon size={12} className="mr-1" />
              AI 추천 받기
            </Button>
          </div>
        ) : (
          <div className="space-y-2 pr-1">
            {selectedSession.orders.map((order) => (
              <AiOrderCard
                key={order.id}
                order={order}
                hosId={hosId}
                icuChartId={icu_chart_id}
                patientWeight={chartData.weight}
                onUpdated={load}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <AiRequestDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        hosId={hosId}
        icuIoId={icu_io.icu_io_id}
        icuChartId={icu_chart_id}
        patientName={patient.name}
        species={patient.species}
        breed={patient.breed}
        weight={chartData.weight}
        ageInDays={icu_io.age_in_days}
        icuIoCc={icu_io.icu_io_cc}
        icuIoDx={icu_io.icu_io_dx}
        inDate={icu_io.in_date}
        targetDate={chartData.target_date ?? new Date().toISOString().slice(0, 10)}
        currentOrders={currentOrders}
        currentVitals={currentVitals}
        onResult={(result) => {
          setSelectedSessionId(result.sessionId)
          load()
        }}
      />
    </div>
  )
}
