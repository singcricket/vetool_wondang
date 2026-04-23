'use client'

import { useEffect, useState } from 'react'
import { fetchDentalChartDetail, fetchDentalChartTeeth } from '@/lib/services/dental/fetch-dental-chart'
import { getDentalImages } from '@/lib/actions/dental/get-dental-images'
import type { DentalChartDetail, DentalTooth, DentalImage } from '@/types/dental/dental-type'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DentalReportGeneral from './dental-report-general'
import DentalReportDetailed from './dental-report-detailed'
import DentalReportOwner from './dental-report-owner'

interface DentalReportPreviewProps {
  dentalId: string
}

export default function DentalReportPreview({ dentalId }: DentalReportPreviewProps) {
  const [chartDetail, setChartDetail] = useState<DentalChartDetail | null>(null)
  const [teeth, setTeeth] = useState<DentalTooth[]>([])
  const [images, setImages] = useState<DentalImage[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [detail, teethData, imagesData] = await Promise.all([
          fetchDentalChartDetail(dentalId),
          fetchDentalChartTeeth(dentalId),
          getDentalImages(dentalId)
        ])
        setChartDetail(detail)
        setTeeth(teethData)
        setImages(imagesData)
      } catch (error) {
        console.error('Failed to fetch dental report preview:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [dentalId])

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!chartDetail) {
    return <div className="p-8 text-center text-muted-foreground">차트 정보를 불러올 수 없습니다.</div>
  }

  const species = chartDetail.species ?? chartDetail.patient?.species ?? 'canine'

  return (
    <div className="bg-white rounded-lg p-1">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100/50 p-1 rounded-xl">
          <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">일반 리포트</TabsTrigger>
          <TabsTrigger value="detailed" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">상세 리포트</TabsTrigger>
          <TabsTrigger value="owner" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">보호자용 리포트</TabsTrigger>
        </TabsList>
        
        <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          <TabsContent value="general" className="mt-0 focus-visible:outline-none">
            <DentalReportGeneral chartDetail={chartDetail} teeth={teeth} images={images} species={species} />
          </TabsContent>
          <TabsContent value="detailed" className="mt-0 focus-visible:outline-none">
            <DentalReportDetailed chartDetail={chartDetail} teeth={teeth} images={images} species={species} />
          </TabsContent>
          <TabsContent value="owner" className="mt-0 focus-visible:outline-none">
            <DentalReportOwner chartDetail={chartDetail} teeth={teeth} images={images} species={species} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
