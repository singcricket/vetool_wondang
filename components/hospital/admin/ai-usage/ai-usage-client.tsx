'use client'

import { useState, useTransition, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { getAiUsageStats } from '@/lib/actions/admin/ai-usage-actions'
import type { AiUsageStats, AiUsageSummary, AiUsageLog } from '@/lib/actions/admin/ai-usage-actions'
import { cn } from '@/lib/utils/utils'

const FEATURE_LABELS: Record<string, string> = {
  // 발주
  supply_order_ocr: '발주서 OCR',
  supply_order_match: '약품 매칭 (업로드)',
  supply_order_item_match: '약품 매칭 (설정)',
  // 환자
  patient_ocr: '환자 등록 OCR',
  // 에코
  echo_scan_vision: '에코 이미지 분석',
  echo_scan_ocr_match: '에코 OCR 매칭',
  echo_scan_finding: '에코 소견 생성',
  // ICU
  icu_lab_ocr: 'ICU 검사결과 분석',
  icu_ai_orders: 'ICU AI 오더 추천',
}

const MODEL_SHORT: Record<string, string> = {
  'claude-sonnet-4-6': 'Sonnet',
  'claude-opus-4-7': 'Opus',
  'claude-haiku-4-5-20251001': 'Haiku',
  'claude-haiku-4-5': 'Haiku',
}

function fmt(n: number, digits = 4) {
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

type DailyRow = {
  date: string
  calls: number
  cost_usd: number
  by_hospital: { hos_name: string; calls: number; cost_usd: number }[]
}

function buildDailyRows(logs: AiUsageLog[]): DailyRow[] {
  const map = new Map<string, DailyRow>()
  for (const log of logs) {
    const date = log.created_at.slice(0, 10)
    if (!map.has(date)) map.set(date, { date, calls: 0, cost_usd: 0, by_hospital: [] })
    const row = map.get(date)!
    row.calls += 1
    row.cost_usd += log.cost_usd
    const h = row.by_hospital.find((x) => x.hos_name === log.hos_name)
    if (h) { h.calls += 1; h.cost_usd += log.cost_usd }
    else row.by_hospital.push({ hos_name: log.hos_name, calls: 1, cost_usd: log.cost_usd })
  }
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date))
}

function DailyAggTable({ logs }: { logs: AiUsageLog[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const rows = useMemo(() => buildDailyRows(logs), [logs])

  if (rows.length === 0) return null

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-xs">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left font-semibold text-slate-500">날짜</th>
            <th className="px-3 py-2 text-right font-semibold text-slate-500">호출</th>
            <th className="px-3 py-2 text-right font-semibold text-slate-500">비용 (USD)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <>
              <tr
                key={row.date}
                className="cursor-pointer border-b hover:bg-slate-50"
                onClick={() => setExpanded((v) => (v === row.date ? null : row.date))}
              >
                <td className="px-3 py-1.5 font-medium text-slate-700">
                  <span className="mr-1.5 text-slate-300">
                    {expanded === row.date
                      ? <ChevronDown size={12} className="inline" />
                      : <ChevronRight size={12} className="inline" />}
                  </span>
                  {row.date}
                </td>
                <td className="px-3 py-1.5 text-right text-slate-600">{row.calls.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-right font-semibold text-teal-700">${fmt(row.cost_usd)}</td>
              </tr>
              {expanded === row.date && (
                <tr key={`${row.date}-detail`} className="border-b bg-slate-50/70">
                  <td colSpan={3} className="px-8 pb-2 pt-1">
                    <div className="space-y-0.5">
                      {row.by_hospital
                        .sort((a, b) => b.cost_usd - a.cost_usd)
                        .map((h) => (
                          <div key={h.hos_name} className="flex items-center gap-2 text-slate-600">
                            <span className="w-48 truncate text-slate-500">{h.hos_name}</span>
                            <span className="w-10 text-right">{h.calls}회</span>
                            <span className="w-20 text-right text-teal-600">${fmt(h.cost_usd)}</span>
                          </div>
                        ))}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
        <tfoot className="bg-slate-50">
          <tr>
            <td className="px-3 py-1.5 text-xs font-semibold text-slate-500">합계</td>
            <td className="px-3 py-1.5 text-right text-xs font-semibold text-slate-700">
              {rows.reduce((s, r) => s + r.calls, 0).toLocaleString()}
            </td>
            <td className="px-3 py-1.5 text-right text-xs font-semibold text-teal-700">
              ${fmt(rows.reduce((s, r) => s + r.cost_usd, 0))}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function LogsSection({ logs }: { logs: AiUsageLog[] }) {
  const [logTab, setLogTab] = useState<'daily' | 'all'>('daily')

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 border-b">
        {(['daily', 'all'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setLogTab(t)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium transition-colors',
              logTab === t
                ? 'border-b-2 border-teal-600 text-teal-700'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {t === 'daily' ? '일별 집계' : '전체 로그'}
          </button>
        ))}
      </div>

      {logTab === 'daily' && <DailyAggTable logs={logs} />}

      {logTab === 'all' && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">시각</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">병원</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">기능</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">모델</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-500">입력</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-500">출력</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-500">비용 (USD)</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">사용자</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-slate-50">
                  <td className="px-3 py-1.5 text-slate-500">
                    {new Date(log.created_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-3 py-1.5 font-medium text-slate-700">{log.hos_name}</td>
                  <td className="px-3 py-1.5 text-slate-600">{FEATURE_LABELS[log.feature] ?? log.feature}</td>
                  <td className="px-3 py-1.5 text-slate-500">{MODEL_SHORT[log.model] ?? log.model}</td>
                  <td className="px-3 py-1.5 text-right text-slate-600">{log.input_tokens.toLocaleString()}</td>
                  <td className="px-3 py-1.5 text-right text-slate-600">{log.output_tokens.toLocaleString()}</td>
                  <td className="px-3 py-1.5 text-right font-medium text-teal-700">${fmt(log.cost_usd)}</td>
                  <td className="px-3 py-1.5 text-slate-400">{log.user_name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function HospitalRow({ s }: { s: AiUsageSummary }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <tr
        className="cursor-pointer border-b hover:bg-slate-50"
        onClick={() => setOpen((v) => !v)}
      >
        <td className="px-3 py-2 text-sm font-medium text-slate-800">
          <span className="mr-1.5 text-slate-300">
            {open ? <ChevronDown size={13} className="inline" /> : <ChevronRight size={13} className="inline" />}
          </span>
          {s.hos_name}
        </td>
        <td className="px-3 py-2 text-right text-sm text-slate-600">{s.total_calls.toLocaleString()}</td>
        <td className="px-3 py-2 text-right text-sm text-slate-600">{s.total_input_tokens.toLocaleString()}</td>
        <td className="px-3 py-2 text-right text-sm text-slate-600">{s.total_output_tokens.toLocaleString()}</td>
        <td className="px-3 py-2 text-right text-sm font-semibold text-teal-700">${fmt(s.total_cost_usd)}</td>
      </tr>
      {open && (
        <tr className="border-b bg-slate-50">
          <td colSpan={5} className="px-6 pb-3 pt-1">
            <div className="flex gap-8">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">기능별</p>
                {s.by_feature.map((f) => (
                  <div key={f.feature} className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="w-36 truncate">{FEATURE_LABELS[f.feature] ?? f.feature}</span>
                    <span className="w-10 text-right">{f.calls}회</span>
                    <span className="w-20 text-right text-teal-600">${fmt(f.cost_usd)}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">모델별</p>
                {s.by_model.map((m) => (
                  <div key={m.model} className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="w-20">{MODEL_SHORT[m.model] ?? m.model}</span>
                    <span className="w-10 text-right">{m.calls}회</span>
                    <span className="w-20 text-right text-teal-600">${fmt(m.cost_usd)}</span>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

interface Props {
  initialStats: AiUsageStats
  initialFromDate: string
  initialToDate: string
}

export default function AiUsageClient({ initialStats, initialFromDate, initialToDate }: Props) {
  const [fromDate, setFromDate] = useState(initialFromDate)
  const [toDate, setToDate] = useState(initialToDate)
  const [stats, setStats] = useState<AiUsageStats>(initialStats)
  const [tab, setTab] = useState<'summary' | 'logs'>('summary')
  const [isPending, startTransition] = useTransition()

  const handleSearch = () => {
    startTransition(async () => {
      const result = await getAiUsageStats(fromDate, toDate)
      setStats(result)
    })
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 날짜 필터 */}
      <div className="flex items-center gap-2">
        <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-8 w-36 text-xs" />
        <span className="text-xs text-slate-400">~</span>
        <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-8 w-36 text-xs" />
        <Button
          onClick={handleSearch}
          disabled={isPending}
          size="sm"
          className="h-8 bg-teal-600 px-3 text-xs hover:bg-teal-700"
        >
          {isPending ? <Loader2 size={12} className="animate-spin" /> : '조회'}
        </Button>
      </div>

      {/* 전체 요약 카드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: '전체 호출', value: stats.total_calls.toLocaleString() + '회' },
          { label: '병원 수', value: stats.summaries.length.toLocaleString() + '곳' },
          { label: '총 비용 (USD)', value: '$' + fmt(stats.total_cost_usd) },
          { label: '평균 비용/호출', value: stats.total_calls > 0 ? '$' + fmt(stats.total_cost_usd / stats.total_calls) : '—' },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border bg-white p-3 shadow-sm">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{card.label}</p>
            <p className="mt-1 text-xl font-bold text-slate-800">{card.value}</p>
          </div>
        ))}
      </div>

      {/* 탭 */}
      <div className="flex border-b">
        {(['summary', 'logs'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              tab === t
                ? 'border-b-2 border-teal-600 text-teal-700'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {t === 'summary' ? '병원별 요약' : '상세 로그'}
          </button>
        ))}
      </div>

      {tab === 'summary' && (
        stats.summaries.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">해당 기간 AI 사용 기록이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">병원</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">호출</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">입력 토큰</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">출력 토큰</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">비용 (USD)</th>
                </tr>
              </thead>
              <tbody>
                {stats.summaries.map((s) => (
                  <HospitalRow key={s.hos_id} s={s} />
                ))}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr>
                  <td className="px-3 py-2 text-xs font-semibold text-slate-500">합계</td>
                  <td className="px-3 py-2 text-right text-xs font-semibold text-slate-700">{stats.total_calls.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-xs font-semibold text-slate-700">
                    {stats.summaries.reduce((s, h) => s + h.total_input_tokens, 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right text-xs font-semibold text-slate-700">
                    {stats.summaries.reduce((s, h) => s + h.total_output_tokens, 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right text-xs font-semibold text-teal-700">${fmt(stats.total_cost_usd)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )
      )}

      {tab === 'logs' && (
        stats.logs.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">해당 기간 AI 사용 기록이 없습니다.</p>
        ) : (
          <LogsSection logs={stats.logs} />
        )
      )}
    </div>
  )
}
