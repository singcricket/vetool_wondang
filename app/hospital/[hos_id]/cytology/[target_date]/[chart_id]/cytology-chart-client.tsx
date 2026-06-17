'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { CytologyChartDetail, SamplePayload } from '@/types/hospital/cytology-type'
import { parseSampleTypes } from '@/types/hospital/cytology-type'
import type { CytologySampleType, CytologyMode, CytologyEngineOutput } from '@/constants/hospital/cytology/cytology-types'
import { cytologyReference } from '@/constants/hospital/cytology/cytology_ref'
import { updateCytologyChart, deleteCytologyChart } from '@/lib/services/cytology/cytology-charts'
import { analyzeToFormFields } from '@/lib/actions/cytology/ai-cytology-analyze'
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

// ── Per-sample state ──────────────────────────────────────────

interface SampleState {
  findings: Record<string, string | string[]>
  impression: string
  impressionAiFilled: boolean
  mode: CytologyMode
}

function buildInitialSampleState(payload?: SamplePayload): SampleState {
  return {
    findings: payload?.findings ?? {},
    impression: payload?.summary ?? '',
    impressionAiFilled: false,
    mode: payload?.mode ?? 'specialist',
  }
}

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

  // ── Multi-sample state ──────────────────────────────────────

  const [activeSamples, setActiveSamples] = useState<CytologySampleType[]>(() =>
    parseSampleTypes(chartDetail.sample_type),
  )
  const [currentSample, setCurrentSample] = useState<CytologySampleType>(() =>
    parseSampleTypes(chartDetail.sample_type)[0],
  )
  const [samplesData, setSamplesData] = useState<Record<string, SampleState>>(() => {
    const initial: Record<string, SampleState> = {}
    const types = parseSampleTypes(chartDetail.sample_type)
    for (const t of types) {
      const payload = (chartDetail.findings as Record<string, SamplePayload> | null)?.[t]
      initial[t] = buildInitialSampleState(payload)
    }
    return initial
  })

  // ── Engine output for current sample ───────────────────────

  const [engineOutput, setEngineOutput] = useState<CytologyEngineOutput | null>(null)

  useEffect(() => {
    const findings = samplesData[currentSample]?.findings ?? {}
    const output = cytologyReference.runFullAnalysis(findings, currentSample)
    setEngineOutput(output)
  }, [samplesData, currentSample])

  // ── Misc state ──────────────────────────────────────────────

  const [allImages, setAllImages] = useState<any[]>([])
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

  useEffect(() => { fetchImages() }, [fetchImages])

  // ── Sample helpers ──────────────────────────────────────────

  const getCurrentState = () => samplesData[currentSample] ?? buildInitialSampleState()

  const updateCurrentSample = useCallback((updater: (prev: SampleState) => SampleState) => {
    setSamplesData((prev) => ({
      ...prev,
      [currentSample]: updater(prev[currentSample] ?? buildInitialSampleState()),
    }))
  }, [currentSample])

  const handleFindingChange = useCallback((testId: string, value: string | string[]) => {
    updateCurrentSample((prev) => ({
      ...prev,
      findings: { ...prev.findings, [testId]: value },
    }))
  }, [updateCurrentSample])

  // ── Tab handlers ────────────────────────────────────────────

  const handleSampleClick = (type: CytologySampleType) => {
    if (!activeSamples.includes(type)) {
      // Add new sample
      setActiveSamples((prev) => [...prev, type])
      setSamplesData((prev) => ({
        ...prev,
        [type]: prev[type] ?? buildInitialSampleState(),
      }))
    }
    setCurrentSample(type)
  }

  const handleRemoveSample = (type: CytologySampleType) => {
    if (activeSamples.length <= 1) return
    const newActive = activeSamples.filter((t) => t !== type)
    setActiveSamples(newActive)
    if (currentSample === type) setCurrentSample(newActive[0])
  }

  const handleModeChange = (newMode: CytologyMode) => {
    updateCurrentSample((prev) => ({ ...prev, mode: newMode }))
  }

  // ── AI handlers ─────────────────────────────────────────────

  const handleAiAutoFill = useCallback(
    (aiFill: Record<string, string | string[]>, summary: string) => {
      updateCurrentSample((prev) => ({
        ...prev,
        findings: { ...prev.findings, ...aiFill },
        impression: summary || prev.impression,
        impressionAiFilled: !!summary,
      }))
    },
    [updateCurrentSample],
  )

  const handleAiAnalyze = async (images: CytologyImageData[], stain: string, clinicalContext: string) => {
    setIsAnalyzing(true)
    try {
      const result = await analyzeToFormFields(
        images.map((img) => ({
          base64: img.base64,
          mediaType: img.mediaType as 'image/jpeg' | 'image/png' | 'image/webp',
        })),
        currentSample,
        stain,
        clinicalContext || undefined,
        chartDetail.patient,
      )
      updateCurrentSample((prev) => ({
        ...prev,
        findings: { ...prev.findings, ...result.findings },
        impression: result.summary || prev.impression,
        impressionAiFilled: !!result.summary,
        mode: 'specialist',
      }))
      toast.success('AI 판독 완료 — 소견을 검토한 후 저장해주세요.')
    } catch (err) {
      console.error(err)
      toast.error('AI 판독에 실패했습니다. 수동으로 입력해주세요.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // ── Save ────────────────────────────────────────────────────

  const handleSave = async () => {
    if (guestMode) return
    setIsSaving(true)
    try {
      const findingsPayload: Record<string, SamplePayload> = {}
      for (const sType of activeSamples) {
        const state = samplesData[sType] ?? buildInitialSampleState()
        const output = cytologyReference.runFullAnalysis(state.findings, sType)
        findingsPayload[sType] = {
          findings: state.findings,
          summary: state.impression || null,
          mode: state.mode,
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
        }
      }

      await updateCytologyChart(chartId, {
        sample_type: activeSamples.join(','),
        findings: findingsPayload,
        ai_findings: null,
        sample_info: null,
        vet_id: vetId,
        user_tags: userTags.length > 0 ? userTags.join(', ') : null,
      })

      // Clear impressionAiFilled for all samples
      setSamplesData((prev) => {
        const next = { ...prev }
        for (const t of activeSamples) {
          if (next[t]?.impressionAiFilled) next[t] = { ...next[t], impressionAiFilled: false }
        }
        return next
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

  // ── Build combined report text (all samples) ────────────────

  const buildFullReportText = () => {
    if (activeSamples.length === 1) {
      const s = getCurrentState()
      return generateReportText(chartDetail, currentSample, s.findings, engineOutput, s.impression || null)
    }
    return activeSamples.map((t) => {
      const s = samplesData[t] ?? buildInitialSampleState()
      const out = cytologyReference.runFullAnalysis(s.findings, t)
      return generateReportText(chartDetail, t, s.findings, out, s.impression || null)
    }).join('\n\n' + '─'.repeat(40) + '\n\n')
  }

  // ── Current sample derived values ───────────────────────────

  const curState = getCurrentState()
  const curFindings = curState.findings
  const curMode = curState.mode
  const curImpression = curState.impression
  const curImpressionAiFilled = curState.impressionAiFilled

  const ROUTINE_TYPES: CytologySampleType[] = ['otic', 'skin_impression', 'skin_exudate', 'fecal']

  return (
    <CytologyChartLayout
      chartDetail={chartDetail}
      onSave={handleSave}
      isSaving={isSaving}
      onDelete={handleDelete}
      isDeleting={isDeleting}
      guestMode={guestMode}
      activeSamples={activeSamples}
      currentSample={currentSample}
      currentMode={curMode}
      onSampleClick={handleSampleClick}
      onRemoveSample={handleRemoveSample}
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
              <TxtReportDialog reportText={buildFullReportText()} />
              <CytologyReportDialog
                chartDetail={chartDetail}
                activeSamples={activeSamples}
                samplesData={Object.fromEntries(
                  activeSamples.map((t) => [t, samplesData[t] ?? buildInitialSampleState()])
                )}
                engineOutputs={Object.fromEntries(
                  activeSamples.map((t) => {
                    const s = samplesData[t] ?? buildInitialSampleState()
                    return [t, cytologyReference.runFullAnalysis(s.findings, t)]
                  })
                )}
              />
            </div>
          </div>

          {/* Cytologist + User Tags strip */}
          <div className="mb-4 flex flex-wrap items-start gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
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
                  <option key={v.user_id} value={v.user_id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="hidden sm:block h-6 w-px bg-slate-200 self-center" />

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
                    <button type="button" onClick={() => setUserTags((prev) => prev.filter((t) => t !== tag))}>
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
                      if (newTag && !userTags.includes(newTag)) setUserTags((prev) => [...prev, newTag])
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
          {allImages.some((img) => img.tags?.split(', ').includes(currentSample)) && (
            <div className="mb-6 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-violet-100 rounded text-violet-600">
                    <Microscope className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-tight">현미경 사진 (Microscopic View)</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                  {allImages.filter((img) => img.tags?.split(', ').includes(currentSample)).length} images
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
                {allImages
                  .filter((img) => img.tags?.split(', ').includes(currentSample))
                  .map((img) => (
                    <div
                      key={img.id}
                      className="group relative min-w-[140px] aspect-square rounded-xl overflow-hidden border border-slate-100 cursor-pointer transition-all hover:border-violet-300 hover:ring-4 hover:ring-violet-50"
                      onClick={() => setEditingImageId(img.id)}
                    >
                      <CytologyImageWithMark imageUrl={img.image_url} marks={img.marks} aspectRatio="aspect-square" />
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
                  imageUrl={allImages.find((img) => img.id === editingImageId)?.image_url || ''}
                  initialMarks={allImages.find((img) => img.id === editingImageId)?.marks}
                  onClose={() => { setEditingImageId(null); fetchImages() }}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Form by mode */}
          {curMode === 'specialist' ? (
            <>
              {ROUTINE_TYPES.includes(currentSample) ? (
                <CytologyRoutineForm
                  sampleType={currentSample}
                  findings={curFindings}
                  onChange={handleFindingChange}
                />
              ) : (
                <CytologySpecialistForm
                  sampleType={currentSample}
                  findings={curFindings}
                  onChange={handleFindingChange}
                  onAddToImpression={(text) => {
                    updateCurrentSample((prev) => ({
                      ...prev,
                      impression: prev.impression ? `${prev.impression}\n\n${text}` : text,
                      impressionAiFilled: false,
                    }))
                  }}
                />
              )}

              {/* 최종 임상 소견 */}
              <div className="mt-4 rounded-xl border-2 border-violet-200 bg-white p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="text-sm font-semibold text-slate-800">최종 임상 소견</label>
                  <span className="text-xs text-slate-400">보고서에 포함됩니다</span>
                  {curImpressionAiFilled && (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      ✦ AI 제안 — 검토 후 수정하세요
                    </span>
                  )}
                </div>
                <textarea
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 leading-relaxed ${
                    curImpressionAiFilled ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'
                  }`}
                  rows={5}
                  placeholder={`세포학적 소견 요약 및 임상 해석을 입력하세요\n예: 다수의 중성구와 세균이 확인되어 세균성 외이염 소견에 합당합니다.`}
                  value={curImpression}
                  onChange={(e) => {
                    updateCurrentSample((prev) => ({
                      ...prev,
                      impression: e.target.value,
                      impressionAiFilled: false,
                    }))
                  }}
                />
              </div>
            </>
          ) : (
            <CytologyAiForm
              sampleType={currentSample}
              findings={curFindings}
              existingImages={
                allImages.filter((img) =>
                  img.tags?.split(', ').includes(currentSample),
                ) as ExistingCytologyImage[]
              }
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
            sampleType={currentSample}
            findings={curFindings}
          />
        </div>
      </div>
    </CytologyChartLayout>
  )
}
