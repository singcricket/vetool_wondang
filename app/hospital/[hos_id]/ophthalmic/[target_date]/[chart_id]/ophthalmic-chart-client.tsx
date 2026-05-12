'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { OphthalmicChartDetail } from '@/types/hospital/ophthalmic-type'
import { 
  updateOphthalmicChartResults, 
  deleteOphthalmicChart, 
  getPatientOphthalmicCharts 
} from '@/lib/services/ophthalmic/ophthalmic-charts'
import { ophthalmicReference } from '@/constants/hospital/ophthalmic/ophthalmic_ref'
import OphthalmicChartLayout from '@/components/hospital/ophthalmic/ophthalmic-chart-layout'
import OphthalmicDynamicForm from '@/components/hospital/ophthalmic/ophthalmic-dynamic-form'
import OphthalmicDiagnosisPanel from '@/components/hospital/ophthalmic/ophthalmic-diagnosis-panel'
import OphthalmicPreviousComparison from '@/components/hospital/ophthalmic/ophthalmic-previous-comparison'
import OphthalmicTreatmentForm from '@/components/hospital/ophthalmic/ophthalmic-treatment-form'
import { toast } from 'sonner'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger, 
} from '@/components/ui/sheet'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import OphthalmicImageUploadDialog from '@/components/hospital/ophthalmic/ophthalmic-image-uploader/ophthalmic-image-upload-dialog'

interface Props {
  hosId: string
  chartId: string
  chartDate: string
  chartDetail: OphthalmicChartDetail
  guestMode?: boolean
}

export default function OphthalmicChartClient({ hosId, chartId, chartDate, chartDetail, guestMode = false }: Props) {
  const router = useRouter()
  
  // State
  const [results, setResults] = useState<Record<string, string | string[]>>(chartDetail.results as any || {})
  const [summary, setSummary] = useState<string | null>(chartDetail.summary)
  const [treatment, setTreatment] = useState<Record<string, any>>(chartDetail.treatment || {})
  const [userTags, setUserTags] = useState<string | null>(chartDetail.user_tags)
  const [activeDomain, setActiveDomain] = useState<string>(ophthalmicReference.domainSections[0].domain)
  
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Previous Chart Data
  const [prevChart, setPrevChart] = useState<OphthalmicChartDetail | null>(null)

  // Initialization & History Fetch
  useEffect(() => {
    const fetchHistory = async () => {
      if (chartDetail.patient_id) {
        const history = await getPatientOphthalmicCharts(chartDetail.patient_id)
        const currentIndex = history.findIndex(h => h.id === chartId)
        if (currentIndex >= 0 && currentIndex + 1 < history.length) {
          setPrevChart(history[currentIndex + 1] as OphthalmicChartDetail)
        } else {
          setPrevChart(null)
        }
      }
    }
    fetchHistory()
  }, [chartDetail.patient_id, chartId])

  // Run Analysis Engine whenever results change
  const engineOutput = useMemo(() => {
    return ophthalmicReference.runFullAnalysis(results)
  }, [results])

  const liveSummary = useMemo(() => {
    return ophthalmicReference.buildChartSummary(results)
  }, [results])

  const handleUpdateResults = (newResults: Record<string, string | string[]>) => {
    setResults(newResults)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const currentSummary = ophthalmicReference.buildChartSummary(results)
      
      // tags generation from diagnoses
      const tagsString = engineOutput.diagnoses
        .filter(d => d.confidenceScore >= 60)
        .map(d => d.rule.diagnosisNameKo)
        .join(',')

      // setSummary(currentSummary) // No longer needed as we use liveSummary for UI

      await updateOphthalmicChartResults(
        chartId,
        results,
        engineOutput,
        liveSummary,
        userTags,
        tagsString,
        treatment
      )

      toast.success('안과 차트가 저장되었습니다.')
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('차트를 삭제하시겠습니까?')) return
    try {
      setIsDeleting(true)
      await deleteOphthalmicChart(chartId)
      toast.success('삭제되었습니다.')
      router.push(`/hospital/${hosId}/ophthalmic/${chartDate}` as any)
    } catch (error) {
      console.error(error)
      toast.error('삭제에 실패했습니다.')
      setIsDeleting(false)
    }
  }

  const handleResetAll = () => {
    const initialResults: Record<string, string | string[]> = {}
    ophthalmicReference.domainSections.forEach((domain) => {
      initialResults[domain.statusGate.testID] = domain.statusGate.normalValue
    })
    setResults(initialResults)
    toast.success('모든 항목이 초기화되었습니다.')
  }

  return (
    <OphthalmicChartLayout
      chartDetail={chartDetail}
      onSave={handleSave}
      onDelete={guestMode ? undefined : handleDelete}
      isSaving={isSaving}
      isDeleting={isDeleting}
      activeDomain={activeDomain}
      setActiveDomain={setActiveDomain}
      guestMode={guestMode}
      currentResults={results}
      onResetAll={handleResetAll}
      engineOutput={engineOutput}
      treatmentData={treatment}
    >
      <div className="flex h-full w-full flex-col lg:flex-row lg:overflow-hidden bg-slate-50/50">
        
        {/* Center: Dynamic Form Area */}
        <div className="flex-1 h-full overflow-hidden p-4 sm:p-6 border-r flex">
          {/* Main Form */}
          <div className="flex-1 min-w-0 h-full overflow-y-auto no-scrollbar">
            {activeDomain === 'treatment' ? (
              <OphthalmicTreatmentForm 
                treatmentData={treatment}
                onUpdate={setTreatment}
              />
            ) : (
              <OphthalmicDynamicForm
                domain={ophthalmicReference.domainSections.find(d => d.domain === activeDomain)!}
                results={results}
                onUpdate={handleUpdateResults}
                species={chartDetail.patient?.species || 'dog'}
                chartId={chartId}
                hosId={hosId}
              />
            )}
          </div>
          
          {/* Previous Chart Comparison */}
          {prevChart && (
            <div className="w-1/2 border-l pl-4 ml-4 hidden xl:block opacity-70 h-full overflow-y-auto no-scrollbar pb-20">
              <OphthalmicPreviousComparison
                domain={ophthalmicReference.domainSections.find(d => d.domain === activeDomain)!}
                prevResults={prevChart.results as any}
              />
            </div>
          )}
        </div>

        {/* Right: Diagnosis Panel - Desktop only */}
        <div className="hidden lg:block w-[380px] xl:w-[450px] shrink-0 h-full overflow-y-auto bg-white border-l shadow-sm z-10 no-scrollbar">
          <OphthalmicDiagnosisPanel
            engineOutput={engineOutput}
            results={results}
            summary={liveSummary}
            treatmentData={treatment}
          />
        </div>

        {/* Mobile Floating Trigger for Diagnosis Results */}
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="lg" className="rounded-full h-14 w-14 shadow-xl bg-blue-600 hover:bg-blue-700">
                <Eye className="h-6 w-6 text-white" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[90%] sm:w-[450px] p-0 border-l-0">
              <VisuallyHidden>
                <SheetHeader>
                  <SheetTitle>진단 및 소견 패널</SheetTitle>
                  <SheetDescription>현재 검사 결과를 기반으로 생성된 진단 및 분석 결과를 표시합니다.</SheetDescription>
                </SheetHeader>
              </VisuallyHidden>
              <div className="h-full overflow-y-auto">
                <OphthalmicDiagnosisPanel 
                  engineOutput={engineOutput}
                  results={results}
                  summary={liveSummary}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Floating Image Uploader Trigger */}
      {!guestMode && (
        <OphthalmicImageUploadDialog 
          chartId={chartId} 
          hosId={hosId} 
        />
      )}
    </OphthalmicChartLayout>
  )
}
