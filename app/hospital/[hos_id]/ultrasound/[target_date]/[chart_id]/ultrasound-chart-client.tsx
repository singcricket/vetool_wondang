'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UltrasoundChartDetail, UltrasoundChartOrgan } from '@/types/hospital/ultrasound-type'
import { getUltrasoundChartOrgans } from '@/lib/services/ultrasound/ultrasound-charts'
import UltrasoundChartLayout from '@/components/hospital/ultrasound/ultrasound-chart-layout'
import UltrasoundOrganTabs from '@/components/hospital/ultrasound/ultrasound-organ-tabs'
import UltrasoundDynamicForm from '@/components/hospital/ultrasound/ultrasound-dynamic-form'
import { organSections, Organ } from '@/constants/hospital/ultrasound/ultrasound_testref'

import { toast } from 'sonner'
import UltrasoundImpressionPanel from '@/components/hospital/ultrasound/ultrasound-impression-panel'
import { updateUltrasoundChart, upsertUltrasoundOrgan, deleteUltrasoundChart } from '@/lib/services/ultrasound/ultrasound-charts'

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

  useEffect(() => {
    const fetchOrgans = async () => {
      setIsLoading(true)
      const data = await getUltrasoundChartOrgans(chartId)
      const dataMap = data.reduce((acc, curr) => {
        acc[curr.organ_name] = curr
        return acc
      }, {} as Record<string, UltrasoundChartOrgan>)
      setOrgansData(dataMap)
      setIsLoading(false)
    }
    fetchOrgans()
  }, [chartId])

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
        <div className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
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

        {/* Right Side: DDx & Summary Panel */}
        <div className="w-64 sm:w-80 border-l bg-slate-50 h-full overflow-y-auto p-4 space-y-4">
          <UltrasoundImpressionPanel organsData={organsData} lang="ko" />
          <UltrasoundImpressionPanel organsData={organsData} lang="en" />
        </div>
      </div>
    </UltrasoundChartLayout>
  )
}
