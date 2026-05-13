'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { CytologyChartDetail } from '@/types/hospital/cytology-type'
import type { CytologySampleType, CytologyMode, CytologyEngineOutput } from '@/constants/hospital/cytology/cytology-types'
import { cytologyReference } from '@/constants/hospital/cytology/cytology_ref'
import { updateCytologyChart, deleteCytologyChart } from '@/lib/services/cytology/cytology-charts'
import { analyzeCytologyImage } from '@/lib/actions/cytology/ai-cytology-analyze'
import CytologyChartLayout from '@/components/hospital/cytology/cytology-chart-layout'
import CytologyRoutineForm from '@/components/hospital/cytology/cytology-routine-form'
import CytologySpecialistForm from '@/components/hospital/cytology/cytology-specialist-form'
import CytologyAiForm from '@/components/hospital/cytology/cytology-ai-form'
import CytologyDiagnosisPanel from '@/components/hospital/cytology/cytology-diagnosis-panel'
import CytologyReportDialog from '@/components/hospital/cytology/cytology-report-dialog'
import CytologyAiFillButton from '@/components/hospital/cytology/cytology-ai-fill-button'

interface Props {
  hosId: string
  chartId: string
  chartDate: string
  chartDetail: CytologyChartDetail
  guestMode?: boolean
}

export default function CytologyChartClient({
  hosId,
  chartId,
  chartDate,
  chartDetail,
  guestMode = false,
}: Props) {
  const router = useRouter()

  const [sampleType, setSampleType] = useState<CytologySampleType>(
    chartDetail.sample_type ?? 'otic',
  )
  const [mode, setMode] = useState<CytologyMode>(chartDetail.mode ?? 'specialist')
  const [findings, setFindings] = useState<Record<string, string | string[]>>(
    chartDetail.findings ?? {},
  )
  const [aiFindings, setAiFindings] = useState<Record<string, string | string[]>>(
    chartDetail.ai_findings ?? {},
  )
  const [aiSummary, setAiSummary] = useState<string | null>(chartDetail.summary ?? null)
  const [imageUrls, setImageUrls] = useState<string[]>(
    (chartDetail.sample_info as any)?.imageUrls ?? [],
  )
  const [engineOutput, setEngineOutput] = useState<CytologyEngineOutput | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Re-run diagnosis engine whenever findings or sampleType change
  useEffect(() => {
    const activeFindings = mode === 'ai' ? { ...aiFindings, ...findings } : findings
    const output = cytologyReference.runFullAnalysis(activeFindings, sampleType)
    setEngineOutput(output)
  }, [findings, aiFindings, sampleType, mode])

  const handleFindingChange = useCallback((testId: string, value: string | string[]) => {
    setFindings((prev) => ({ ...prev, [testId]: value }))
  }, [])

  const handleSampleTypeChange = (newType: CytologySampleType) => {
    setSampleType(newType)
    // Reset findings when sample type changes (keep user confirmation pattern)
    setFindings({})
    setAiFindings({})
    setAiSummary(null)
    setEngineOutput(null)
  }

  const handleModeChange = (newMode: CytologyMode) => {
    setMode(newMode)
  }

  const handleAiAutoFill = useCallback(
    (aiFill: Record<string, string | string[]>, summary: string) => {
      setFindings((prev) => ({ ...prev, ...aiFill }))
      if (summary) setAiSummary(summary)
    },
    [],
  )

  const handleAiAnalyze = async (base64: string, mediaType: string, stain: string) => {
    setIsAnalyzing(true)
    try {
      const result = await analyzeCytologyImage(
        base64,
        mediaType as 'image/jpeg' | 'image/png' | 'image/webp',
        sampleType,
        stain,
      )
      // Merge AI findings into state
      const normalized: Record<string, string | string[]> = {}
      for (const [k, v] of Object.entries(result.findings)) {
        normalized[k] = Array.isArray(v) ? v : String(v)
      }
      setAiFindings(normalized)
      setAiSummary(result.interpretation)
      toast.success('AI 분석이 완료되었습니다.')
    } catch (err) {
      console.error(err)
      toast.error('AI 분석에 실패했습니다. 수동으로 입력해주세요.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSave = async () => {
    if (guestMode) return
    setIsSaving(true)
    try {
      const activeFindings = mode === 'ai' ? { ...aiFindings, ...findings } : findings
      const output = cytologyReference.runFullAnalysis(activeFindings, sampleType)
      const diagnosisSummary = cytologyReference.buildSummary(activeFindings, sampleType, output)

      await updateCytologyChart(chartId, {
        sample_type: sampleType,
        mode,
        findings: activeFindings,
        ai_findings: mode === 'ai' ? aiFindings : null,
        summary: diagnosisSummary,
        diagnosis: {
          activeSigns: output.activeSigns,
          inflammationType: output.inflammationType,
          malignancySuspicion: output.malignancySuspicion,
          criticalFindings: output.criticalFindings,
          topDiagnoses: output.diagnoses.slice(0, 5).map((d) => ({
            id: d.rule.diagnosisId,
            nameKo: d.rule.nameKo,
            confidence: d.confidenceScore,
            category: d.rule.category,
          })),
        },
        sample_info: imageUrls.length > 0 ? { imageUrls } : null,
      })

      toast.success('세포학 차트가 저장되었습니다.')
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error('저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteCytologyChart(chartId)
      toast.success('차트가 삭제되었습니다.')
      router.push(`/hospital/${hosId}/cytology/${chartDate}` as any)
    } catch (err) {
      console.error(err)
      toast.error('삭제에 실패했습니다.')
      setIsDeleting(false)
    }
  }

  const activeFindings = mode === 'ai' ? { ...aiFindings, ...findings } : findings

  return (
    <CytologyChartLayout
      chartDetail={chartDetail}
      onSave={handleSave}
      isSaving={isSaving}
      onDelete={handleDelete}
      isDeleting={isDeleting}
      guestMode={guestMode}
      currentSampleType={sampleType}
      currentMode={mode}
      currentFindings={activeFindings}
      engineOutput={engineOutput}
      onSampleTypeChange={handleSampleTypeChange}
      onModeChange={handleModeChange}
    >
      <div className="flex h-full gap-0">
        {/* Main form area */}
        <div className="flex-1 overflow-auto p-4">
          {/* Report dialog + header */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-slate-500">
              검사일: <span className="font-medium text-slate-700">{chartDate}</span>
            </div>
            <div className="flex items-center gap-2">
              {mode === 'specialist' && !guestMode && (
                <CytologyAiFillButton
                  sampleType={sampleType}
                  onFill={handleAiAutoFill}
                />
              )}
              <CytologyReportDialog
                chartDetail={chartDetail}
                sampleType={sampleType}
                findings={activeFindings}
                engineOutput={engineOutput}
                aiSummary={aiSummary}
              />
            </div>
          </div>

          {/* Form by mode */}
          {mode === 'specialist' ? (
            (['otic', 'skin_impression', 'skin_exudate', 'fecal', 'vaginal', 'conjunctival'] as CytologySampleType[]).includes(sampleType) ? (
              <CytologyRoutineForm
                sampleType={sampleType}
                findings={findings}
                onChange={handleFindingChange}
              />
            ) : (
              <CytologySpecialistForm
                sampleType={sampleType}
                findings={findings}
                onChange={handleFindingChange}
              />
            )
          ) : (
            <CytologyAiForm
              sampleType={sampleType}
              findings={findings}
              aiSummary={aiSummary}
              imageUrls={imageUrls}
              onAnalyze={handleAiAnalyze}
              isAnalyzing={isAnalyzing}
              onChange={handleFindingChange}
            />
          )}
        </div>

        {/* Diagnosis panel - right side */}
        <div className="hidden lg:flex lg:w-72 xl:w-80 shrink-0 border-l bg-slate-50 overflow-auto">
          <CytologyDiagnosisPanel
            engineOutput={engineOutput}
            sampleType={sampleType}
          />
        </div>
      </div>
    </CytologyChartLayout>
  )
}
