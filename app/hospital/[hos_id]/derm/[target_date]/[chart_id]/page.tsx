import { redirect } from 'next/navigation'
import { getDermChart } from '@/lib/services/derm/derm-charts'
import { fetchDermLayoutData } from '@/lib/services/derm/fetch-derm'
import { getLesionGroups, getLesionVisits, getDermImages } from '@/lib/services/derm/derm-charts'
import DermSidebar from '@/components/hospital/derm/derm-sidebar/derm-sidebar'
import DermChartClient from './derm-chart-client'

interface Props {
  params: Promise<{ hos_id: string; target_date: string; chart_id: string }>
}

export default async function DermChartPage({ params }: Props) {
  const { hos_id, target_date, chart_id } = await params

  const [chartDetail, layoutData, lesionGroups, lesionVisits, images] = await Promise.all([
    getDermChart(chart_id),
    fetchDermLayoutData(hos_id),
    (async () => {
      const chart = await getDermChart(chart_id)
      if (!chart) return []
      return getLesionGroups(chart.patient_id)
    })(),
    getLesionVisits(chart_id),
    getDermImages(chart_id),
  ])

  if (!chartDetail) {
    redirect(`/hospital/${hos_id}/derm/${target_date}`)
  }

  return (
    <div className="flex h-desktop">
      <DermSidebar hosId={hos_id} targetDate={target_date} />
      <div className="flex flex-1 overflow-hidden 2xl:ml-[200px]">
        <DermChartClient
          hosId={hos_id}
          chartId={chart_id}
          chartDate={target_date}
          chartDetail={chartDetail!}
          vetList={layoutData.vetList}
          initialLesionGroups={lesionGroups}
          initialLesionVisits={lesionVisits}
          initialImages={images}
        />
      </div>
    </div>
  )
}
