'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, CheckCircle2, LinkIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { CheckupPatient } from '@/types/hospital/checkup-type'
import {
  fetchLinkedChartInfo,
  createLinkedSubChart,
  updateLinkedChartSummary,
  clearLinkedSubChart,
  type SubChartType,
  type LinkedChartInfo,
} from '@/lib/actions/checkup/linked-chart-actions'

const CHART_LABELS: Record<SubChartType, string> = {
  ultrasound: '복부초음파',
  echo: '심초음파',
  ophthalmic: '안과',
  dental: '치과',
  neuro: '신경계',
}

const SUMMARY_PLACEHOLDER: Record<SubChartType, string> = {
  ultrasound: '장기별 이상 소견 및 종합 인상을 입력하세요',
  echo: '심장 기능 평가 및 주요 소견을 입력하세요',
  ophthalmic: '안구 검사 주요 소견 및 진단을 입력하세요',
  dental: '구강 검사 소견 및 권고사항을 입력하세요',
  neuro: '신경계 검사 소견 및 국소화 결과를 입력하세요',
}

const CHART_ROUTE: Record<SubChartType, string> = {
  ultrasound: 'ultrasound',
  echo: 'echocardio',
  ophthalmic: 'ophthalmic',
  dental: 'dental',
  neuro: 'neuro',
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  chartType: SubChartType
  checkupId: string
  hosId: string
  patientId: string
  patient: CheckupPatient
  checkupDate: string
  linkedChartId: string | null
  onLinked: (chartType: SubChartType, chartId: string | null) => void
}

export default function SubChartLinkDialog({
  open,
  onOpenChange,
  chartType,
  checkupId,
  hosId,
  patientId,
  patient,
  checkupDate,
  linkedChartId,
  onLinked,
}: Props) {
  const [chartInfo, setChartInfo] = useState<LinkedChartInfo | null>(null)
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (!linkedChartId) {
      setChartInfo(null)
      setSummary('')
      return
    }
    setLoading(true)
    fetchLinkedChartInfo(linkedChartId, chartType).then((info) => {
      if (!info) {
        // 차트가 삭제된 경우 stale 링크 자동 정리
        clearLinkedSubChart(checkupId, chartType).catch(() => {})
        onLinked(chartType, null)
        setChartInfo(null)
        setSummary('')
      } else {
        setChartInfo(info)
        setSummary(info.summary ?? '')
      }
      setLoading(false)
    })
  }, [open, linkedChartId, chartType])

  const handleSave = async () => {
    try {
      setSaving(true)
      let chartId = linkedChartId

      if (!chartId) {
        chartId = await createLinkedSubChart({
          checkupId,
          chartType,
          hosId,
          patientId,
          patient,
          chartDate: checkupDate,
        })
        onLinked(chartType, chartId)
      }

      if (summary.trim()) {
        await updateLinkedChartSummary({ chartId, chartType, summary })
      }

      toast.success('저장되었습니다.')
      onOpenChange(false)
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const fullChartUrl =
    chartInfo || linkedChartId
      ? `/hospital/${hosId}/${CHART_ROUTE[chartType]}/${checkupDate}/${linkedChartId ?? chartInfo?.id}`
      : null

  const label = CHART_LABELS[chartType]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <LinkIcon size={15} className="text-teal-600" />
            {label} 차트 연동
            {linkedChartId ? (
              <Badge className="bg-teal-100 text-teal-700 text-[11px] font-normal">연동됨</Badge>
            ) : (
              <Badge variant="outline" className="text-slate-400 text-[11px] font-normal">
                미연동
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {loading ? (
            <p className="py-6 text-center text-sm text-slate-400">불러오는 중...</p>
          ) : (
            <>
              {!linkedChartId && (
                <div className="rounded-md bg-slate-50 px-3 py-2.5 text-xs text-slate-500 leading-relaxed">
                  새 <span className="font-medium text-slate-700">{label}</span> 차트를 생성하고
                  이 검진에 연동합니다. 소견 입력 후 전체 차트에서 상세 기록을 이어갈 수 있습니다.
                </div>
              )}

              {chartInfo && (
                <p className="text-xs text-slate-400">
                  차트 작성일: <span className="text-slate-600">{chartInfo.chartDate}</span>
                </p>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700">종합 소견 요약</label>
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder={SUMMARY_PLACEHOLDER[chartType]}
                  className="min-h-[110px] resize-none text-sm"
                />
                <p className="text-[10px] text-slate-400">
                  상세 항목 입력은 전체 차트에서 가능합니다.
                </p>
              </div>

              {fullChartUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-teal-300 text-teal-700 hover:bg-teal-50"
                  onClick={() => window.open(fullChartUrl, '_blank')}
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  전체 차트에서 상세 입력
                </Button>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {saving ? '저장 중...' : linkedChartId ? '저장' : '차트 생성 및 연동'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
