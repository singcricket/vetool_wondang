'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { CytologyChartDetail } from '@/types/hospital/cytology-type'
import type { CytologySampleType, CytologyMode, CytologyEngineOutput } from '@/constants/hospital/cytology/cytology-types'
import { cytologyReference } from '@/constants/hospital/cytology/cytology_ref'
import { updateCytologyChart, deleteCytologyChart } from '@/lib/services/cytology/cytology-charts'
import { analyzeCytologyImage } from '@/lib/actions/cytology/ai-cytology-analyze'
import { getCytologyImages } from '@/lib/actions/cytology/cytology-image-actions'
import { Microscope, Maximize2, Copy, Check, X as XIcon, Tag, UserRound } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle as UIDialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { DialogTitle, DialogDescription } from '@radix-ui/react-dialog'
import dynamic from 'next/dynamic'
const CytologyImageEditor = dynamic(() => import('@/components/hospital/cytology/cytology-image-editor'), { ssr: false })
const CytologyImageWithMark = dynamic(() => import('@/components/hospital/cytology/cytology-image-with-mark'), { ssr: false })
import type { CytologyImageData, ExistingCytologyImage } from '@/components/hospital/cytology/cytology-ai-form'
import CytologyChartLayout from '@/components/hospital/cytology/cytology-chart-layout'
import CytologyRoutineForm from '@/components/hospital/cytology/cytology-routine-form'
import CytologySpecialistForm from '@/components/hospital/cytology/cytology-specialist-form'
import CytologyAiForm from '@/components/hospital/cytology/cytology-ai-form'
import CytologyDiagnosisPanel from '@/components/hospital/cytology/cytology-diagnosis-panel'
import CytologyReportDialog, { generateReportText } from '@/components/hospital/cytology/cytology-report-dialog'
import CytologyAiFillButton from '@/components/hospital/cytology/cytology-ai-fill-button'

// ── TXT 보고서 다이얼로그 ─────────────────────────────────────

function TxtReportDialog({ reportText }: { reportText: string }) {
  const [text, setText] = useState(reportText)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog onOpenChange={(open) => { if (open) setText(reportText) }}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Copy className="h-3.5 w-3.5" />
          TXT
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl flex flex-col gap-0 p-0 overflow-hidden max-h-[85vh]">
        <DialogHeader className="px-5 py-3 border-b bg-slate-50 shrink-0">
          <UIDialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <Copy className="h-4 w-4 text-violet-600" />
            텍스트 보고서
          </UIDialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto p-4">
          <textarea
            className="w-full h-full min-h-[50vh] rounded border border-gray-200 bg-gray-50 p-3 text-xs font-mono leading-relaxed text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
          />
        </div>
        <div className="shrink-0 flex justify-end px-5 py-3 border-t bg-slate-50">
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-1.5 rounded px-4 py-2 text-xs font-semibold transition-all ${
              copied
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-violet-600 text-white hover:bg-violet-700'
            }`}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? '복사됨!' : '클립보드 복사'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface Props {
  hosId: string
  chartId: string
  chartDate: string
  chartDetail: CytologyChartDetail
  vetList: { user_id: string; name: string }[]
  guestMode?: boolean
}

export default function CytologyChartClient({
  hosId,
  chartId,
  chartDate,
  chartDetail,
  vetList,
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
  const [allImages, setAllImages] = useState<any[]>([])
  const [engineOutput, setEngineOutput] = useState<CytologyEngineOutput | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingImageId, setEditingImageId] = useState<string | null>(null)
  const [vetId, setVetId] = useState<string | null>(chartDetail.vet_id ?? null)
  const [userTags, setUserTags] = useState<string[]>(
    chartDetail.user_tags ? chartDetail.user_tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
  )
  const [tagInput, setTagInput] = useState('')

  const fetchImages = useCallback(async () => {
    const data = await getCytologyImages(chartId)
    setAllImages(data || [])
  }, [chartId])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

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

  const handleAiAnalyze = async (images: CytologyImageData[], stain: string) => {
    setIsAnalyzing(true)
    try {
      // 임상소견(전문가 모드 Step 1 필드)을 텍스트로 조합해서 Claude에 함께 전달
      const clinicalParts: string[] = []
      const loc = findings['mass_location'] as string | undefined
      const sz = findings['mass_size'] as string | undefined
      const ctx = findings['clinical_context'] as string | undefined
      const cmt = findings['evaluator_comment'] as string | undefined
      if (loc) clinicalParts.push(`병변 위치: ${loc}`)
      if (sz) clinicalParts.push(`종괴 크기: ${sz}`)
      if (ctx) clinicalParts.push(`임상 상황: ${ctx}`)
      if (cmt) clinicalParts.push(`판독자 소견: ${cmt}`)
      const clinicalInfo = clinicalParts.length > 0 ? clinicalParts.join('\n') : undefined

      // Claude에 이미지 전송하여 판독 (업로드는 카메라 버튼 패널에서 별도 처리)
      const result = await analyzeCytologyImage(
        images.map((img) => ({
          base64: img.base64,
          mediaType: img.mediaType as 'image/jpeg' | 'image/png' | 'image/webp',
        })),
        sampleType,
        stain,
        clinicalInfo,
      )
      const normalized: Record<string, string | string[]> = {}
      for (const [k, v] of Object.entries(result.findings)) {
        normalized[k] = Array.isArray(v) ? v : String(v)
      }
      setAiFindings(normalized)
      setAiSummary(result.interpretation)
      toast.success(`AI 판독 완료 (${images.length}장 분석)`)
    } catch (err) {
      console.error(err)
      toast.error('AI 판독에 실패했습니다. 수동으로 입력해주세요.')
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
        vet_id: vetId,
        user_tags: userTags.length > 0 ? userTags.join(', ') : null,
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
              {/* {mode === 'specialist' && !guestMode && (
                <CytologyAiFillButton
                  sampleType={sampleType}
                  onFill={handleAiAutoFill}
                />
              )} */}
              <TxtReportDialog
                reportText={generateReportText(chartDetail, sampleType, activeFindings, engineOutput, aiSummary)}
              />
              <CytologyReportDialog
                chartDetail={chartDetail}
                sampleType={sampleType}
                findings={activeFindings}
                engineOutput={engineOutput}
                aiSummary={aiSummary}
              />
            </div>
          </div>

          {/* Cytologist + User Tags strip */}
          <div className="mb-4 flex flex-wrap items-start gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            {/* Cytologist */}
            <div className="flex items-center gap-2 min-w-[180px]">
              <UserRound className="h-3.5 w-3.5 shrink-0 text-violet-500" />
              <span className="text-[11px] font-semibold text-slate-500 shrink-0">세포검사자</span>
              <select
                value={vetId ?? ''}
                onChange={(e) => setVetId(e.target.value || null)}
                disabled={guestMode}
                className="flex-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50"
              >
                <option value="">미선택</option>
                {vetList.map((v) => (
                  <option key={v.user_id} value={v.user_id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Divider */}
            <div className="hidden sm:block h-6 w-px bg-slate-200 self-center" />

            {/* User Tags */}
            <div className="flex flex-1 flex-wrap items-center gap-2 min-w-[200px]">
              <Tag className="h-3.5 w-3.5 shrink-0 text-violet-500" />
              <span className="text-[11px] font-semibold text-slate-500 shrink-0">태그</span>
              {userTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-violet-50 border border-violet-200 px-2 py-0.5 text-[11px] text-violet-700 font-medium"
                >
                  {tag}
                  {!guestMode && (
                    <button
                      type="button"
                      onClick={() => setUserTags((prev) => prev.filter((t) => t !== tag))}
                      className="hover:text-violet-900 transition-colors"
                    >
                      <XIcon className="h-2.5 w-2.5" />
                    </button>
                  )}
                </span>
              ))}
              {!guestMode && (
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                      e.preventDefault()
                      const newTag = tagInput.trim().replace(/,$/, '')
                      if (newTag && !userTags.includes(newTag)) {
                        setUserTags((prev) => [...prev, newTag])
                      }
                      setTagInput('')
                    }
                  }}
                  placeholder="태그 입력 후 Enter"
                  className="flex-1 min-w-[120px] max-w-[200px] rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              )}
            </div>
          </div>

          {/* Filtered Image Strip */}
          {allImages.some(img => img.tags?.split(', ').includes(sampleType)) && (
            <div className="mb-6 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-violet-100 rounded text-violet-600">
                    <Microscope className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-tight">현미경 사진 (Microscopic View)</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                  {allImages.filter(img => img.tags?.split(', ').includes(sampleType)).length} images
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
                {allImages
                  .filter(img => img.tags?.split(', ').includes(sampleType))
                  .map((img) => (
                    <div 
                      key={img.id}
                      className="group relative min-w-[140px] aspect-square rounded-xl overflow-hidden border border-slate-100 cursor-pointer transition-all hover:border-violet-300 hover:ring-4 hover:ring-violet-50"
                      onClick={() => setEditingImageId(img.id)}
                    >
                      <CytologyImageWithMark 
                        imageUrl={img.image_url} 
                        marks={img.marks} 
                        aspectRatio="aspect-square"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="w-6 h-6 text-white drop-shadow-md" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Single Editor Dialog */}
          <Dialog open={!!editingImageId} onOpenChange={(open) => !open && setEditingImageId(null)}>
            <DialogContent className="max-w-[95vw] w-[95vw] h-[92vh] p-0 bg-slate-900 border-slate-800 overflow-hidden">
              <VisuallyHidden>
                <DialogTitle>이미지 편집</DialogTitle>
                <DialogDescription>현미경 이미지를 편집하고 마킹합니다.</DialogDescription>
              </VisuallyHidden>
              {editingImageId && (
                <CytologyImageEditor 
                  imageId={editingImageId}
                  imageUrl={allImages.find(img => img.id === editingImageId)?.image_url || ''}
                  initialMarks={allImages.find(img => img.id === editingImageId)?.marks}
                  onClose={() => {
                    setEditingImageId(null)
                    fetchImages()
                  }}
                />
              )}
            </DialogContent>
          </Dialog>

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
              existingImages={
                allImages.filter((img) =>
                  img.tags?.split(', ').includes(sampleType),
                ) as ExistingCytologyImage[]
              }
              hasClinicalInfo={!!(
                findings['mass_location'] ||
                findings['mass_size'] ||
                findings['clinical_context'] ||
                findings['evaluator_comment']
              )}
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
