'use client'

import { useEffect, useState, useMemo } from 'react'
import { fetchEchoChartDetail } from '@/lib/services/echocardio/fetch-echo'
import type { EchoChartDetail, EchoResultMap } from '@/types/echocardio/echocardio-type'
import EchoReport from './echo-report'
import { Skeleton } from '@/components/ui/skeleton'

interface EchoReportPreviewProps {
  echoId: string
}

export default function EchoReportPreview({ echoId }: EchoReportPreviewProps) {
  const [chartDetail, setChartDetail] = useState<EchoChartDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const detail = await fetchEchoChartDetail(echoId)
      setChartDetail(detail)
      setLoading(false)
    }
    load()
  }, [echoId])

  const resultMap = useMemo(() => {
    if (!chartDetail) return {}
    const map: EchoResultMap = {}
    chartDetail.results.forEach((r) => {
      if (r.value !== null) map[r.keyword_id] = r.value
    })
    return map
  }, [chartDetail])

  const computedResults = useMemo(() => {
    if (!chartDetail) return {}
    const computed: Record<string, { result: string; comment: string }> = {}
    chartDetail.results.forEach((r) => {
      computed[r.keyword_id] = {
        result: r.result ?? '',
        comment: r.comment ?? '',
      }
    })
    return computed
  }, [chartDetail])

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-60 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!chartDetail) {
    return <div className="p-8 text-center text-muted-foreground">차트 정보를 불러올 수 없습니다.</div>
  }

  return (
    <EchoReport
      chartDetail={chartDetail}
      resultMap={resultMap}
      computedResults={computedResults}
    />
  )
}
