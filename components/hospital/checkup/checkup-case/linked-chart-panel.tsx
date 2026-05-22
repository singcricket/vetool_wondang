'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ExternalLink, Link2, Link2Off, Plus, RefreshCw, Stethoscope } from 'lucide-react'
import { toast } from 'sonner'
import {
  linkSubChartToCheckup,
  clearLinkedSubChart,
  type SubChartType,
} from '@/lib/actions/checkup/linked-chart-actions'

export type ChartListItem = {
  id: string
  chartDate: string
  previewText?: string | null
}

interface Props {
  label: string
  chartType: SubChartType
  checkupId: string
  charts: ChartListItem[]
  linkedChartId: string | null
  buildChartUrl: (chartId: string, chartDate: string) => string
  onLinkChange: (chartId: string | null) => void
  // 새 차트 생성 (neuro 전용)
  onCreateNew?: () => Promise<void>
  // 결과 불러오기 (neuro / ultrasound)
  onDataLoaded?: (text: string) => void
  getChartText?: (chartId: string) => string | null
}

export default function LinkedChartPanel({
  label,
  chartType,
  checkupId,
  charts,
  linkedChartId,
  buildChartUrl,
  onLinkChange,
  onCreateNew,
  onDataLoaded,
  getChartText,
}: Props) {
  const [open, setOpen] = useState(false)
  const [working, setWorking] = useState(false)

  const linkedChart = charts.find((c) => c.id === linkedChartId)
  const isDataPullMode = !!onDataLoaded

  const handleLink = async (chartId: string) => {
    try {
      setWorking(true)
      await linkSubChartToCheckup(checkupId, chartType, chartId)
      onLinkChange(chartId)
      if (isDataPullMode && getChartText) {
        const text = getChartText(chartId)
        if (text) onDataLoaded!(text)
      }
      setOpen(false)
      toast.success(`${label}이(가) 연동되었습니다.`)
    } catch {
      toast.error('연동에 실패했습니다.')
    } finally {
      setWorking(false)
    }
  }

  const handleUnlink = async () => {
    try {
      setWorking(true)
      await clearLinkedSubChart(checkupId, chartType)
      onLinkChange(null)
      toast.success('연동이 해제되었습니다.')
    } catch {
      toast.error('연동 해제에 실패했습니다.')
    } finally {
      setWorking(false)
    }
  }

  const handleRefresh = () => {
    if (!linkedChartId || !getChartText || !onDataLoaded) return
    const text = getChartText(linkedChartId)
    if (text) {
      onDataLoaded(text)
      toast.success('결과를 불러왔습니다.')
    } else {
      toast.info('불러올 데이터가 없습니다.')
    }
  }

  const handleCreateNew = async () => {
    if (!onCreateNew) return
    try {
      setWorking(true)
      setOpen(false)
      await onCreateNew()
    } catch {
      toast.error('차트 생성에 실패했습니다.')
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      {/* 연동 상태 */}
      {linkedChart ? (
        <div className="flex items-center gap-1.5 rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-xs text-teal-700">
          <Link2 size={11} />
          <span className="font-medium">{label}</span>
          <span className="text-teal-500">·</span>
          <span>{linkedChart.chartDate}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 rounded-md border border-dashed border-slate-200 px-2 py-1 text-xs text-slate-400">
          <Link2Off size={11} />
          <span>{label} 연동 없음</span>
        </div>
      )}

      {/* 차트 열기 */}
      {linkedChart && (
        <a
          href={buildChartUrl(linkedChart.id, linkedChart.chartDate)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 rounded px-1.5 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <ExternalLink size={11} />
          차트 열기
        </a>
      )}

      {/* 결과 불러오기 */}
      {isDataPullMode && linkedChart && (
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs text-teal-600 hover:bg-teal-50"
          onClick={handleRefresh}
          disabled={working}
        >
          <RefreshCw size={11} className="mr-1" />
          결과 불러오기
        </Button>
      )}

      {/* 연결 해제 */}
      {linkedChart && (
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600"
          onClick={handleUnlink}
          disabled={working}
        >
          <Link2Off size={11} className="mr-1" />
          연결 해제
        </Button>
      )}

      {/* 정밀검사 연동 다이얼로그 */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs border-teal-300 text-teal-700 hover:bg-teal-50"
          >
            <Stethoscope size={11} className="mr-1" />
            {linkedChart ? '차트 변경' : '정밀검사 연동'}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">{label} 연동</DialogTitle>
          </DialogHeader>

          {/* 새 차트 만들기 (onCreateNew 제공 시) */}
          {onCreateNew && (
            <div className="rounded-md border border-dashed border-teal-200 bg-teal-50 p-3">
              <p className="mb-2 text-xs text-teal-700">
                새로운 {label}를 작성하고 바로 연동합니다.
              </p>
              <Button
                size="sm"
                className="h-7 bg-teal-600 text-xs hover:bg-teal-700"
                onClick={handleCreateNew}
                disabled={working}
              >
                <Plus size={11} className="mr-1" />
                새 {label} 작성하기
              </Button>
            </div>
          )}

          {/* 기존 차트 목록 */}
          {charts.length === 0 ? (
            !onCreateNew && (
              <div className="py-6 text-center text-sm text-slate-400">
                연동 가능한 {label}가 없습니다.
              </div>
            )
          ) : (
            <>
              {onCreateNew && (
                <p className="text-xs font-medium text-slate-500">또는 기존 차트 연동</p>
              )}
              <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
                {charts.map((chart) => {
                  const isLinked = chart.id === linkedChartId
                  return (
                    <div
                      key={chart.id}
                      className={`flex items-center justify-between rounded-md border px-3 py-2 ${
                        isLinked ? 'border-teal-200 bg-teal-50' : 'border-slate-100'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-800">{chart.chartDate}</p>
                        {chart.previewText && (
                          <p className="mt-0.5 truncate text-[10px] text-slate-400">
                            {chart.previewText.slice(0, 60)}
                          </p>
                        )}
                      </div>
                      <div className="ml-2 flex shrink-0 items-center gap-1">
                        <a
                          href={buildChartUrl(chart.id, chart.chartDate)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={12} />
                        </a>
                        {isLinked ? (
                          <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-medium text-teal-700">
                            연동중
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs"
                            onClick={() => handleLink(chart.id)}
                            disabled={working}
                          >
                            연동
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
