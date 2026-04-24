'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { LoaderCircleIcon, CameraIcon, ImageIcon } from 'lucide-react'
import { updateDentalChart } from '@/lib/actions/dental/update-dental-chart'
import type { DentalChartDetail } from '@/types/dental/dental-type'
import { uploadDentalImage } from '@/lib/services/dental/upload-dental-image'
import { insertDentalImages } from '@/lib/actions/dental/insert-dental-images'
import DentalOralEvalTab from './dental-chart-tabs/dental-oral-eval-tab'
import DentalProcedureTab from './dental-chart-tabs/dental-procedure-tab'
import DentalTreatmentTab from './dental-chart-tabs/dental-treatment-tab'
import DentalNoteTab from './dental-chart-tabs/dental-note-tab'
import { getDentalImages } from '@/lib/actions/dental/get-dental-images'
import type { DentalImage } from '@/types/dental/dental-type'
import DentalImageGallery from '@/components/hospital/dental/dental-image-gallery'
import DentalImageWithMark from '@/components/hospital/dental/dental-image-with-mark'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/utils'

const DentalImageEditor = dynamic(() => import('@/components/hospital/dental/dental-image-editor'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center bg-slate-900 text-white">에디터 로딩 중...</div>
})

interface Props {
  chartDetail: DentalChartDetail
  hosId: string
}

// 4분면 이미지 업로드를 위한 서브 컴포넌트 (깜빡임 방지를 위해 외부 정의)
function QuadrantBox({ 
  label, 
  img, 
  toothId, 
  chartId, 
  hosId, 
  onImagesUpdate,
  onImageEdit
}: { 
  label: string, 
  img?: DentalImage, 
  toothId: string,
  chartId: string,
  hosId: string,
  onImagesUpdate: (imgs: DentalImage[]) => void,
  onImageEdit: (id: string) => void
}) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const { url, error } = await uploadDentalImage(file, chartId)
      if (error || !url) throw new Error(error || '업로드 실패')

      await insertDentalImages([{
        chart_id: chartId,
        tooth_ids: [toothId],
        dental_chart_teeth_ids: [],
        other_tags: [],
        mark: null,
        img_url: url,
        is_radio: false
      }], hosId)

      toast.success('사진이 등록되었습니다.')
      const updatedImages = await getDentalImages(chartId)
      onImagesUpdate(updatedImages)
    } catch (err: any) {
      console.error(err)
      toast.error('사진 등록에 실패했습니다.', { description: err.message })
    } finally {
      setIsUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  return (
    <div 
      className={cn(
        "flex flex-col border border-slate-200 bg-white shadow-sm overflow-hidden rounded",
        img && "cursor-pointer hover:border-indigo-400 hover:ring-2 hover:ring-indigo-100 transition-all"
      )}
      onClick={() => img && onImageEdit(img.dental_image_id)}
    >
      <div className="text-[10.5px] font-bold text-center bg-slate-100 py-1 border-b uppercase text-slate-600 tracking-wider">
        {label}
      </div>
      <div className="aspect-[4/3] bg-slate-50 flex items-center justify-center relative">
        {isUploading && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
            <LoaderCircleIcon className="w-5 h-5 animate-spin text-indigo-600" />
          </div>
        )}

        {img ? (
          <DentalImageWithMark 
            imageUrl={img.img_url} 
            mark={img.mark} 
            noHover 
            aspectRatio="aspect-auto" 
            className="h-full w-full" 
          />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <span className="text-[9px] font-medium text-slate-400 opacity-50">NO IMAGE</span>
            
            <div className="flex items-center gap-2">
              <input 
                type="file" 
                ref={cameraInputRef} 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                onChange={handleImageUpload} 
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                className="h-9 w-9 p-0 flex items-center justify-center border-dashed border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50"
                onClick={(e) => {
                  e.stopPropagation()
                  cameraInputRef.current?.click()
                }}
                disabled={isUploading}
              >
                <CameraIcon className="w-4 h-4 text-indigo-500" />
              </Button>

              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload} 
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                className="h-9 w-9 p-0 flex items-center justify-center border-dashed border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
                disabled={isUploading}
              >
                <ImageIcon className="w-4 h-4 text-slate-500" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DentalChartGeneralPanel({ chartDetail, hosId }: Props) {
  const { refresh } = useRouter()
  const [isPending, startTransition] = useTransition()

  // 첨부 이미지 관리
  const [images, setImages] = useState<DentalImage[]>([])
  const [selectedEditorImageId, setSelectedEditorImageId] = useState<string | null>(null)
  
  // 1. 일반 정보 (DentalNoteTab)
  const [vetId, setVetId] = useState(chartDetail.vet_id)
  const [userTags, setUserTags] = useState(chartDetail.user_tags ?? '')
  const [generalNote, setGeneralNote] = useState(chartDetail.general_note ?? '')

  // 2. 구강 평가 (DentalOralEvalTab)
  const [skullType, setSkullType] = useState<DentalChartDetail['skull_type']>(chartDetail.skull_type)
  const [occlusion, setOcclusion] = useState<DentalChartDetail['occlusion']>(chartDetail.occlusion)
  const [crowding, setCrowding] = useState<DentalChartDetail['crowding']>(chartDetail.crowding)
  const [gingivitisOverall, setGingivitisOverall] = useState<DentalChartDetail['gingivitis_overall']>(chartDetail.gingivitis_overall)
  const [calculusOverall, setCalculusOverall] = useState<DentalChartDetail['calculus_overall']>(chartDetail.calculus_overall)
  const [periodontitisStage, setPeriodontitisStage] = useState<DentalChartDetail['periodontitis_stage']>(chartDetail.periodontitis_stage)
  const [oralMucosa, setOralMucosa] = useState(chartDetail.oral_mucosa ?? '')
  const [tongueEval, setTongueEval] = useState(chartDetail.tongue_eval ?? '')
  const [palateEval, setPalateEval] = useState(chartDetail.palate_eval ?? '')
  const [tonsilEval, setTonsilEval] = useState(chartDetail.tonsil_eval ?? '')
  const [pharynxEval, setPharynxEval] = useState(chartDetail.pharynx_eval ?? '')
  const [salivaryEval, setSalivaryEval] = useState(chartDetail.salivary_eval ?? '')
  const [lymphNodeEval, setLymphNodeEval] = useState(chartDetail.lymph_node_eval ?? '')
  const [xrayTaken, setXrayTaken] = useState(chartDetail.xray_taken ?? false)
  const [xrayFindings, setXrayFindings] = useState(chartDetail.xray_findings ?? '')

  // 3. 처치 내역 (DentalProcedureTab)
  const [anesthesia, setAnesthesia] = useState(chartDetail.anesthesia ?? false)
  const [anesthesiaNote, setAnesthesiaNote] = useState(chartDetail.anesthesia_note ?? '')
  const [procedures, setProcedures] = useState({
    procedure_scaling: chartDetail.procedure_scaling ?? false,
    procedure_polishing: chartDetail.procedure_polishing ?? false,
    procedure_irrigation: chartDetail.procedure_irrigation ?? false,
    procedure_fluoride: chartDetail.procedure_fluoride ?? false,
  })
  const [procedureOther, setProcedureOther] = useState(chartDetail.procedure_other ?? '')

  // 4. 치료 계획 (DentalTreatmentTab)
  const [treatmentPlan, setTreatmentPlan] = useState(chartDetail.treatment_plan ?? '')
  const [recheckInterval, setRecheckInterval] = useState<DentalChartDetail['recheck_interval']>(chartDetail.recheck_interval)
  const [homecareInstruction, setHomecareInstruction] = useState(chartDetail.homecare_instruction ?? '')

  const [isDirty, setIsDirty] = useState(false)

  // 1. 타 PC/서버의 변경사항 동기화 (Realtime 연동)
  useEffect(() => {
    if (isDirty || isPending) return

    setVetId(chartDetail.vet_id)
    setUserTags(chartDetail.user_tags ?? '')
    setGeneralNote(chartDetail.general_note ?? '')
    setSkullType(chartDetail.skull_type)
    setOcclusion(chartDetail.occlusion)
    setCrowding(chartDetail.crowding)
    setGingivitisOverall(chartDetail.gingivitis_overall)
    setCalculusOverall(chartDetail.calculus_overall)
    setPeriodontitisStage(chartDetail.periodontitis_stage)
    setOralMucosa(chartDetail.oral_mucosa ?? '')
    setTongueEval(chartDetail.tongue_eval ?? '')
    setPalateEval(chartDetail.palate_eval ?? '')
    setTonsilEval(chartDetail.tonsil_eval ?? '')
    setPharynxEval(chartDetail.pharynx_eval ?? '')
    setSalivaryEval(chartDetail.salivary_eval ?? '')
    setLymphNodeEval(chartDetail.lymph_node_eval ?? '')
    setXrayTaken(chartDetail.xray_taken ?? false)
    setXrayFindings(chartDetail.xray_findings ?? '')
    setAnesthesia(chartDetail.anesthesia ?? false)
    setAnesthesiaNote(chartDetail.anesthesia_note ?? '')
    setProcedures({
      procedure_scaling: chartDetail.procedure_scaling ?? false,
      procedure_polishing: chartDetail.procedure_polishing ?? false,
      procedure_irrigation: chartDetail.procedure_irrigation ?? false,
      procedure_fluoride: chartDetail.procedure_fluoride ?? false,
    })
    setProcedureOther(chartDetail.procedure_other ?? '')
    setTreatmentPlan(chartDetail.treatment_plan ?? '')
    setRecheckInterval(chartDetail.recheck_interval)
    setHomecareInstruction(chartDetail.homecare_instruction ?? '')
  }, [chartDetail, isDirty, isPending])

  // 2. 변경사항 여부(Dirty) 체크
  useEffect(() => {
    const isFieldsChanged = 
      vetId !== chartDetail.vet_id ||
      userTags !== (chartDetail.user_tags ?? '') ||
      generalNote !== (chartDetail.general_note ?? '') ||
      skullType !== chartDetail.skull_type ||
      occlusion !== chartDetail.occlusion ||
      crowding !== chartDetail.crowding ||
      gingivitisOverall !== chartDetail.gingivitis_overall ||
      calculusOverall !== chartDetail.calculus_overall ||
      periodontitisStage !== chartDetail.periodontitis_stage ||
      oralMucosa !== (chartDetail.oral_mucosa ?? '') ||
      tongueEval !== (chartDetail.tongue_eval ?? '') ||
      palateEval !== (chartDetail.palate_eval ?? '') ||
      tonsilEval !== (chartDetail.tonsil_eval ?? '') ||
      pharynxEval !== (chartDetail.pharynx_eval ?? '') ||
      salivaryEval !== (chartDetail.salivary_eval ?? '') ||
      lymphNodeEval !== (chartDetail.lymph_node_eval ?? '') ||
      xrayTaken !== (chartDetail.xray_taken ?? false) ||
      xrayFindings !== (chartDetail.xray_findings ?? '') ||
      anesthesia !== (chartDetail.anesthesia ?? false) ||
      anesthesiaNote !== (chartDetail.anesthesia_note ?? '') ||
      procedures.procedure_scaling !== (chartDetail.procedure_scaling ?? false) ||
      procedures.procedure_polishing !== (chartDetail.procedure_polishing ?? false) ||
      procedures.procedure_irrigation !== (chartDetail.procedure_irrigation ?? false) ||
      procedures.procedure_fluoride !== (chartDetail.procedure_fluoride ?? false) ||
      procedureOther !== (chartDetail.procedure_other ?? '') ||
      treatmentPlan !== (chartDetail.treatment_plan ?? '') ||
      recheckInterval !== chartDetail.recheck_interval ||
      homecareInstruction !== (chartDetail.homecare_instruction ?? '')

    setIsDirty(isFieldsChanged)
  }, [
    chartDetail, vetId, userTags, generalNote, skullType, occlusion, crowding,
    gingivitisOverall, calculusOverall, periodontitisStage, oralMucosa,
    tongueEval, palateEval, tonsilEval, pharynxEval, salivaryEval,
    lymphNodeEval, xrayTaken, xrayFindings, anesthesia, anesthesiaNote,
    procedures, procedureOther, treatmentPlan, recheckInterval, homecareInstruction
  ])

  // 3. 자동 저장 (3초간 입력 없을 시)
  useEffect(() => {
    if (!isDirty || isPending) return

    const timer = setTimeout(() => {
      handleSave(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [isDirty, isPending])

  useEffect(() => {
    getDentalImages(chartDetail.id).then(res => setImages(res)).catch(console.error)
  }, [chartDetail.id])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('dental_images_general_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'dental_images' },
        (payload) => {
          const updatedImage = payload.new as DentalImage
          setImages((prev) => 
            prev.map((img) => img.dental_image_id === updatedImage.dental_image_id ? { ...img, ...updatedImage } : img)
          )
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function handleSave(silent = false) {
    startTransition(async () => {
      const ageDays = Math.floor((Date.now() - new Date(chartDetail.patient?.birth ?? '').getTime()) / (1000 * 60 * 60 * 24))
      const systemTags = `#${chartDetail.patient?.hos_patient_id}#${chartDetail.patient?.hos_owner_id ?? ''}#${chartDetail.patient?.name}#${chartDetail.patient?.species}#${chartDetail.patient?.breed}#${chartDetail.patient?.gender}#${ageDays}`

      try {
        await updateDentalChart(chartDetail.id, hosId, {
          vet_id: vetId,
          user_tags: userTags || null,
          tags: systemTags,
          general_note: generalNote || null,
          skull_type: skullType,
          occlusion,
          crowding,
          gingivitis_overall: gingivitisOverall,
          calculus_overall: calculusOverall,
          periodontitis_stage: periodontitisStage,
          oral_mucosa: oralMucosa || null,
          tongue_eval: tongueEval || null,
          palate_eval: palateEval || null,
          tonsil_eval: tonsilEval || null,
          pharynx_eval: pharynxEval || null,
          salivary_eval: salivaryEval || null,
          lymph_node_eval: lymphNodeEval || null,
          xray_taken: xrayTaken,
          xray_findings: xrayFindings || null,
          anesthesia,
          anesthesia_note: anesthesiaNote || null,
          ...procedures,
          procedure_other: procedureOther || null,
          treatment_plan: treatmentPlan || null,
          recheck_interval: recheckInterval,
          homecare_instruction: homecareInstruction || null,
        })
        if (!silent) toast.success('치과 차트를 저장하였습니다.')
        setIsDirty(false)
      } catch (error) {
        console.error(error)
        if (!silent) toast.error('저장에 실패하였습니다.')
      }
    })
  }

  const img100 = images.find(img => img.tooth_ids?.includes('100'))
  const img200 = images.find(img => img.tooth_ids?.includes('200'))
  const img300 = images.find(img => img.tooth_ids?.includes('300'))
  const img400 = images.find(img => img.tooth_ids?.includes('400'))

  const generalImages = images.filter(img => (img.tooth_ids || []).includes('general'))
  const assessmentImages = images.filter(img => (img.tooth_ids || []).includes('assessment'))
  const treatmentImages = images.filter(img => (img.tooth_ids || []).includes('treatment'))
  const editorImage = images.find(img => img.dental_image_id === selectedEditorImageId)

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white relative">
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          <section id="general-info">
            <div className="bg-slate-50 px-4 py-2 border-b">
              <h3 className="text-sm font-bold text-slate-700">일반 정보</h3>
            </div>
            <DentalNoteTab
              chartDetail={chartDetail}
              hosId={hosId}
              vetId={vetId}
              onVetIdChange={setVetId}
              userTags={userTags}
              onUserTagsChange={setUserTags}
              generalNote={generalNote}
              onGeneralNoteChange={setGeneralNote}
            />
            <DentalImageGallery images={generalImages} title="구강 전반" />
          </section>

          <Separator />

          <section id="oral-eval">
            <div className="bg-slate-50 px-4 py-2 border-b border-t mt-4">
              <h3 className="text-sm font-bold text-slate-700">구강 평가</h3>
            </div>
            <div className="px-4 py-6 bg-slate-50/30">
               <div className="max-w-[800px] mx-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <QuadrantBox label="Rt Max" img={img100} toothId="100" chartId={chartDetail.id} hosId={hosId} onImagesUpdate={setImages} onImageEdit={setSelectedEditorImageId} />
                    <QuadrantBox label="Lt Max" img={img200} toothId="200" chartId={chartDetail.id} hosId={hosId} onImagesUpdate={setImages} onImageEdit={setSelectedEditorImageId} />
                    <QuadrantBox label="Rt Mand" img={img400} toothId="400" chartId={chartDetail.id} hosId={hosId} onImagesUpdate={setImages} onImageEdit={setSelectedEditorImageId} />
                    <QuadrantBox label="Lt Mand" img={img300} toothId="300" chartId={chartDetail.id} hosId={hosId} onImagesUpdate={setImages} onImageEdit={setSelectedEditorImageId} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 text-center italic">* 개별 치아 선택 시 100~400 태그를 지정하면 자동으로 요약 차트에 반영됩니다.</p>
               </div>
            </div>

            <DentalOralEvalTab
              skullType={skullType} onSkullTypeChange={(v) => setSkullType(v as any)}
              occlusion={occlusion} onOcclusionChange={(v) => setOcclusion(v as any)}
              crowding={crowding} onCrowdingChange={(v) => setCrowding(v as any)}
              gingivitisOverall={gingivitisOverall} onGingivitisOverallChange={(v) => setGingivitisOverall(v as any)}
              calculusOverall={calculusOverall} onCalculusOverallChange={(v) => setCalculusOverall(v as any)}
              periodontitisStage={periodontitisStage} onPeriodontitisStageChange={(v) => setPeriodontitisStage(v as any)}
              oralMucosa={oralMucosa} onOralMucosaChange={setOralMucosa}
              tongueEval={tongueEval} onTongueEvalChange={setTongueEval}
              palateEval={palateEval} onPalateEvalChange={setPalateEval}
              tonsilEval={tonsilEval} onTonsilEvalChange={setTonsilEval}
              pharynxEval={pharynxEval} onPharynxEvalChange={setPharynxEval}
              salivaryEval={salivaryEval} onSalivaryEvalChange={setSalivaryEval}
              lymphNodeEval={lymphNodeEval} onLymphNodeEvalChange={setLymphNodeEval}
              xrayTaken={xrayTaken} onXrayTakenChange={setXrayTaken}
              xrayFindings={xrayFindings} onXrayFindingsChange={setXrayFindings}
            />
            <DentalImageGallery images={assessmentImages} title="진단 및 평가" />
          </section>

          <Separator />

          <section id="procedure-info">
            <div className="bg-slate-50 px-4 py-2 border-b border-t mt-4">
              <h3 className="text-sm font-bold text-slate-700">처치 내역</h3>
            </div>
            <DentalProcedureTab
              anesthesia={anesthesia} onAnesthesiaChange={setAnesthesia}
              anesthesiaNote={anesthesiaNote} onAnesthesiaNoteChange={setAnesthesiaNote}
              procedures={procedures} onProceduresChange={setProcedures}
              procedureOther={procedureOther} onProcedureOtherChange={setProcedureOther}
            />
          </section>

          <Separator />

          <section id="treatment-plan">
            <div className="bg-slate-50 px-4 py-2 border-b border-t mt-4">
              <h3 className="text-sm font-bold text-slate-700">치료 계획</h3>
            </div>
            <DentalTreatmentTab
              treatmentPlan={treatmentPlan} onTreatmentPlanChange={setTreatmentPlan}
              recheckInterval={recheckInterval} onRecheckIntervalChange={setRecheckInterval}
              homecareInstruction={homecareInstruction} onHomecareInstructionChange={setHomecareInstruction}
            />
            <DentalImageGallery images={treatmentImages} title="치료 및 처치" />
          </section>
          <div className="h-40" />
        </div>
      </ScrollArea>

      <div className="shrink-0 flex justify-end border-t bg-slate-50 px-4 py-3 sticky bottom-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] items-center gap-3">
        {isDirty && !isPending && <span className="text-[10px] text-amber-600 font-medium animate-pulse italic">* 변경사항 있음 (3초 후 자동 저장)</span>}
        {isPending && <span className="text-[10px] text-indigo-600 font-medium italic flex items-center gap-1"><LoaderCircleIcon className="w-3 h-3 animate-spin" />저장 중...</span>}
        <Button onClick={() => handleSave()} disabled={isPending || !isDirty} size="default" className="min-w-[120px]">
          {isPending ? <LoaderCircleIcon className="animate-spin mr-2 h-4 w-4" /> : null}
          {isPending ? '저장 중...' : isDirty ? '지금 저장' : '저장됨'}
        </Button>
      </div>

      <Dialog open={!!selectedEditorImageId} onOpenChange={(open) => !open && setSelectedEditorImageId(null)} modal={false}>
        <DialogContent className="max-w-[100vw] w-screen h-screen max-h-[100vh] p-0 m-0 border-0 flex flex-col bg-slate-900 rounded-none z-[100]" onOpenAutoFocus={(e) => e.preventDefault()}>
          <VisuallyHidden><DialogTitle>치과 이미지 에디터</DialogTitle><DialogDescription>도형 및 글자를 추가하고 그림을 그릴 수 있는 에디터입니다.</DialogDescription></VisuallyHidden>
          {editorImage && <DentalImageEditor imageId={editorImage.dental_image_id} imageUrl={editorImage.img_url} initialMark={editorImage.mark} onClose={() => setSelectedEditorImageId(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
