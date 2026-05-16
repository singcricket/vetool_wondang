'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { NeuroChartDetail } from '@/types/hospital/neuro-type'
import { updateNeuroChartResults, deleteNeuroChart, getPatientNeuroCharts } from '@/lib/services/neuro/neuro-charts'
import NeuroChartLayout from '@/components/hospital/neuro/neuro-chart-layout'
import { neuroReference } from '@/constants/hospital/physical-exam/neuro/neuro_ref'
import NeuroDynamicForm from '@/components/hospital/neuro/neuro-dynamic-form'
import NeuroLocalisationPanel from '@/components/hospital/neuro/neuro-localisation-panel'
import NeuroPreviousComparison from '@/components/hospital/neuro/neuro-previous-comparison'
import { toast } from 'sonner'
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet'
import { BrainCircuit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

interface Props {
  hosId: string
  chartId: string
  chartDate: string
  chartDetail: NeuroChartDetail
  guestMode?: boolean
}

export default function NeuroChartClient({ hosId, chartId, chartDate, chartDetail, guestMode = false }: Props) {
  const router = useRouter()
  
  // State
  const [results, setResults] = useState<Record<string, string | string[]>>(chartDetail.results || {})
  const [localisations, setLocalisations] = useState<Record<string, any>>(chartDetail.localisations || {})
  const [summary, setSummary] = useState<string | null>(chartDetail.summary)
  const [activeDomain, setActiveDomain] = useState<string>(neuroReference.domainSections[0].domain)
  
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Previous Chart Data
  const [prevChart, setPrevChart] = useState<NeuroChartDetail | null>(null)

  // Initialization & History Fetch
  useEffect(() => {
    const fetchHistory = async () => {
      if (chartDetail.patient_id) {
        const history = await getPatientNeuroCharts(chartDetail.patient_id)
        const currentIndex = history.findIndex(h => h.id === chartId)
        if (currentIndex >= 0 && currentIndex + 1 < history.length) {
          setPrevChart(history[currentIndex + 1] as NeuroChartDetail)
        } else {
          setPrevChart(null)
        }
      }
    }
    fetchHistory()
  }, [chartDetail.patient_id, chartId])

  // Run Full Localisation Engine (includes cerebral lateralisation) whenever results change
  useEffect(() => {
    const context = {
      species: (chartDetail.patient?.species as 'dog' | 'cat') || 'dog',
      breed: chartDetail.patient?.breed || '',
      onset: (results['onset'] as any) || 'acute',
      progression: (results['progression'] as any) || 'static',
      painPresent: results['neck_pain'] === 'present' || results['back_pain'] === 'present',
    }
    const engineResults = neuroReference.runCompleteLocalisationEngine(
      results,
      context,
      neuroReference.domainSections,
    )
    setLocalisations(engineResults as any)
  }, [results, chartDetail.patient?.species, chartDetail.patient?.breed])


  const handleUpdateResults = (newResults: Record<string, string | string[]>) => {
    setResults(newResults)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const currentSummary = neuroReference.buildNeuroChartSummary(
        results,
        {
          species: (chartDetail.patient?.species as 'dog' | 'cat') || 'dog',
          breed: chartDetail.patient?.breed || '',
          onset: (results['onset'] as any) || 'acute',
          progression: (results['progression'] as any) || 'static',
          painPresent: results['neck_pain'] === 'present' || results['back_pain'] === 'present',
        },
        neuroReference.domainSections,
      )

      // 포맷팅된 문자열 생성 + 편측화 결과 추가
      const cerebralLat = (localisations as any)?.cerebralLateralisation ?? null
      const spinalLat = (localisations as any)?.spinalLateralisation ?? null
      
      let finalSummary = currentSummary.summaryText
      if (cerebralLat) {
        finalSummary = neuroReference.appendLateralisationToChart(currentSummary, cerebralLat, 'ko')
      }
      if (spinalLat) {
        finalSummary = neuroReference.appendLateralisationToChart(
          { ...currentSummary, summaryText: finalSummary }, 
          spinalLat as any, 
          'ko'
        )
      }

      setSummary(finalSummary)

      await updateNeuroChartResults(
        chartId,
        results,
        localisations,
        finalSummary,
      )


      toast.success('신경계 차트가 저장되었습니다.')
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
      await deleteNeuroChart(chartId)
      toast.success('삭제되었습니다.')
      router.push(`/hospital/${hosId}/patients/${chartDetail.patient_id}` as any)
    } catch (error) {
      console.error(error)
      toast.error('삭제에 실패했습니다.')
      setIsDeleting(false)
    }
  }

  const handleResetAll = () => {
    const initialResults: Record<string, string | string[]> = {}
    neuroReference.domainSections.forEach((domain) => {
      initialResults[domain.statusGate.testID] = domain.statusGate.normalValue
    })
    setResults(initialResults)
    toast.success('모든 항목이 초기화되었습니다.')
  }

  return (
    <NeuroChartLayout
      chartDetail={chartDetail}
      onSave={handleSave}
      onDelete={guestMode ? undefined : handleDelete}
      isSaving={isSaving}
      isDeleting={isDeleting}
      activeDomain={activeDomain}
      setActiveDomain={setActiveDomain}
      guestMode={guestMode}
      currentResults={results}
      currentLocalisations={localisations}
      onResetAll={handleResetAll}
      onResultsChange={handleUpdateResults}
    >
      <div className="flex h-full w-full flex-col lg:flex-row lg:overflow-hidden bg-slate-50/50">
        
        {/* Center: Dynamic Form Area */}
        <div className="flex-1 h-full overflow-y-auto p-4 sm:p-6 border-r flex">
          {/* Main Form */}
          <div className="flex-1">
            <NeuroDynamicForm
              domain={neuroReference.domainSections.find(d => d.domain === activeDomain)!}
              results={results}
              onUpdate={handleUpdateResults}
            />
          </div>
          
          {/* Previous Chart Comparison (Side-by-side inside form area) */}
          {prevChart && (
            <div className="w-1/2 border-l pl-4 ml-4 hidden xl:block opacity-70 pointer-events-none">
              <NeuroPreviousComparison
                domain={neuroReference.domainSections.find(d => d.domain === activeDomain)!}
                prevResults={prevChart.results}
              />
            </div>
          )}
        </div>

        {/* Right: Localisation Engine Output & Summary - Desktop only */}
        <div className="hidden lg:block w-[450px] shrink-0 h-full overflow-y-auto bg-white border-l shadow-sm z-10">
          <NeuroLocalisationPanel 
            localisations={localisations} 
            results={results}
            summary={summary}
          />
        </div>

        {/* Mobile Floating Trigger for Localisation Results */}
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="lg" className="rounded-full h-14 w-14 shadow-xl bg-indigo-600 hover:bg-indigo-700">
                <BrainCircuit className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[90%] sm:w-[450px] p-0">
              <VisuallyHidden>
                <SheetHeader>
                  <SheetTitle>병변 국소화 결과</SheetTitle>
                </SheetHeader>
              </VisuallyHidden>
              <div className="h-full overflow-y-auto">
                <NeuroLocalisationPanel 
                  localisations={localisations} 
                  results={results}
                  summary={summary}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </NeuroChartLayout>
  )
}
