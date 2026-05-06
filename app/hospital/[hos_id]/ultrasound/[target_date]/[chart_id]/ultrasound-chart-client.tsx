'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UltrasoundChartDetail, UltrasoundChartOrgan } from '@/types/hospital/ultrasound-type'
import { getUltrasoundChartOrgans } from '@/lib/services/ultrasound/ultrasound-charts'
import UltrasoundChartLayout from '@/components/hospital/ultrasound/ultrasound-chart-layout'
import UltrasoundOrganTabs from '@/components/hospital/ultrasound/ultrasound-organ-tabs'
import UltrasoundDynamicForm from '@/components/hospital/ultrasound/ultrasound-dynamic-form'
import { organSections, Organ } from '@/constants/hospital/ultrasound'

import { toast } from 'sonner'
import UltrasoundImpressionPanel from '@/components/hospital/ultrasound/ultrasound-impression-panel'
import { updateUltrasoundChart, upsertUltrasoundOrgan, deleteUltrasoundChart, getPatientUltrasoundCharts } from '@/lib/services/ultrasound/ultrasound-charts'
import UltrasoundPreviousComparison from '@/components/hospital/ultrasound/ultrasound-previous-comparison'

interface Props {
  hosId: string
  chartId: string
  chartDate: string
  chartDetail: UltrasoundChartDetail
  vetList: { user_id: string; name: string }[]
}

export default function UltrasoundChartClient({ hosId, chartId, chartDate, chartDetail, vetList }: Props) {
  const router = useRouter()
  const [activeOrgan, setActiveOrgan] = useState<Organ>('liver')
  const [organsData, setOrgansData] = useState<Record<string, UltrasoundChartOrgan>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [prevCharts, setPrevCharts] = useState<UltrasoundChartDetail[]>([])
  const [prevOrgansData, setPrevOrgansData] = useState<Record<string, UltrasoundChartOrgan>>({})
  const [hasPrevData, setHasPrevData] = useState(false)

  useEffect(() => {
    const fetchOrgans = async () => {
      setIsLoading(true)
      
      // 1. 현재 차트 데이터 가져오기
      const data = await getUltrasoundChartOrgans(chartId)
      const dataMap = data.reduce((acc, curr) => {
        acc[curr.organ_name] = curr
        return acc
      }, {} as Record<string, UltrasoundChartOrgan>)
      setOrgansData(dataMap)

      // 2. 환자의 전체 차트 히스토리 가져오기
      if (chartDetail.patient_id) {
        const history = await getPatientUltrasoundCharts(chartDetail.patient_id)
        setPrevCharts(history as any)

        // 3. 현재 차트보다 이전의 가장 최신 차트 찾기
        const currentChartIndex = history.findIndex(h => h.id === chartId)
        // history는 최신순(DESC)으로 정렬되어 있음. 
        // 현재 차트 인덱스 다음(index + 1)이 바로 이전 차트임.
        const prevChart = history[currentChartIndex + 1]

        if (prevChart) {
          const prevData = await getUltrasoundChartOrgans(prevChart.id)
          const prevDataMap = prevData.reduce((acc, curr) => {
            acc[curr.organ_name] = curr
            return acc
          }, {} as Record<string, UltrasoundChartOrgan>)
          setPrevOrgansData(prevDataMap)
          setHasPrevData(true)
        }
      }

      setIsLoading(false)
    }
    fetchOrgans()
  }, [chartId, chartDetail.patient_id])

  const handleSave = async () => {
    setIsSaving(true)
    const toastId = toast.loading('차트를 저장하는 중...')
    
    try {
      // 1. 장기 데이터 개별 저장 (병렬 처리)
      const organPromises = Object.values(organsData).map(organ => {
        return upsertUltrasoundOrgan({
          chart_id: chartId,
          organ_name: organ.organ_name,
          status: organ.status,
          findings_data: organ.findings_data,
          organ_memo: organ.organ_memo,
        })
      })
      
      await Promise.all(organPromises)
      
      // 2. 차트 메타데이터 (impression_summary 등) 저장 로직은 나중에 확장 가능
      
      toast.success('저장되었습니다.', { id: toastId })
    } catch (err) {
      toast.error('저장 중 오류가 발생했습니다.', { id: toastId })
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const toastId = toast.loading('차트를 삭제하는 중...')

    try {
      await deleteUltrasoundChart(chartId)
      toast.success('삭제되었습니다.', { id: toastId })
      router.push(`/hospital/${hosId}/ultrasound` as any)
    } catch (err) {
      toast.error('삭제 중 오류가 발생했습니다.', { id: toastId })
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">로딩 중...</div>
  }

  const currentOrganData = organsData[activeOrgan] || {
    chart_id: chartId,
    organ_name: activeOrgan,
    status: 'not_examined',
    findings_data: {},
    organ_memo: '',
  }

  return (
    <UltrasoundChartLayout 
      chartDetail={chartDetail} 
      onSave={handleSave} 
      isSaving={isSaving}
      onDelete={handleDelete}
      isDeleting={isDeleting}
      vetList={vetList}
      prevCharts={prevCharts}
      currentChartId={chartId}
    >
      <div className="flex h-full w-full bg-slate-50 overflow-hidden">
        {/* Left Side: Organ Navigation Tabs */}
        <div className="w-48 sm:w-64 border-r bg-white h-full overflow-y-auto">
          <UltrasoundOrganTabs
            organs={organSections}
            activeOrgan={activeOrgan}
            onChangeOrgan={setActiveOrgan}
            organsData={organsData}
          />
        </div>

        {/* Center: Dynamic Form Area */}
        <div className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              {organSections.find(s => s.organ === activeOrgan)?.organNameKo || activeOrgan} 평가
            </h2>
            <UltrasoundDynamicForm
              organ={activeOrgan}
              organData={currentOrganData}
              species={chartDetail.patient?.species}
              onUpdate={(updatedData) => {
                setOrgansData(prev => ({
                  ...prev,
                  [activeOrgan]: updatedData
                }))
              }}
            />
          </div>

          {/* Previous Chart Comparison (Visible if previous data exists) */}
          {hasPrevData && (
            <div className="w-full lg:w-80 xl:w-96 border rounded-xl bg-white shadow-sm flex flex-col overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700">과거 기록과 비교</h3>
                <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase font-bold">
                  {prevCharts.find(c => c.id === prevOrgansData[activeOrgan]?.chart_id)?.chart_date || 'Previous'}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <UltrasoundPreviousComparison
                  organ={activeOrgan}
                  prevData={prevOrgansData[activeOrgan]}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Side: DDx & Summary Panel */}
        <div className="w-64 sm:w-80 border-l bg-slate-50 h-full overflow-y-auto p-4 space-y-4">
          <UltrasoundImpressionPanel organsData={organsData} lang="ko" />
          <UltrasoundImpressionPanel organsData={organsData} lang="en" />
        </div>
      </div>
    </UltrasoundChartLayout>
  )
}
