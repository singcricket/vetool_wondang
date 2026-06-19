'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { LoaderCircleIcon } from 'lucide-react'
import { updateDentalChart } from '@/lib/actions/dental/update-dental-chart'
import type { DentalChartDetail, DentalImage } from '@/types/dental/dental-type'
import DentalOralEvalTab from './dental-chart-tabs/dental-oral-eval-tab'
import DentalProcedureTab from './dental-chart-tabs/dental-procedure-tab'
import DentalTreatmentTab from './dental-chart-tabs/dental-treatment-tab'
import DentalNoteTab from './dental-chart-tabs/dental-note-tab'
import DentalImageGallery from '@/components/hospital/dental/dental-image-gallery'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/utils'

const DentalImageEditor = dynamic(() => import('../dental-image-editor'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center bg-slate-900 text-white">에디터 로딩 중...</div>
})

const DentalImageWithMark = dynamic(() => import('@/components/hospital/dental/dental-image-with-mark'), {
  ssr: false,
  loading: () => <div className="aspect-[4/3] bg-slate-100" />,
})
const upperOrder = [110, 109, 108, 107, 106, 105, 104, 103, 102, 101, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210]



// 4분면 이미지를 보여주기 위한 서브 컴포넌트
function QuadrantBox({ label, img }: { label: string, img?: DentalImage }) {
  const [viewerOpen, setViewerOpen] = useState(false)
  return (
    <>
      <div 
        className={cn(
          "flex flex-col border border-slate-200 bg-white shadow-sm overflow-hidden rounded h-full",
          img && "cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all"
        )}
        onClick={() => img && setViewerOpen(true)}
      >
        <div className="text-[10.5px] font-bold text-center bg-slate-100 py-1 border-b uppercase text-slate-600 tracking-wider">
          {label}
        </div>
        <div className="aspect-[4/3] bg-slate-50 flex items-center justify-center relative overflow-hidden">
          {img ? (
            <DentalImageWithMark 
              imageUrl={img.img_url} 
              mark={img.mark} 
              noHover 
              aspectRatio="aspect-auto" 
              className="h-full w-full object-cover" 
            />
          ) : (
            <span className="text-[9px] font-medium text-slate-400 opacity-50 uppercase italic">No photo</span>
          )}
        </div>
      </div>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen} modal={false}>
        <DialogContent 
           className="p-0 m-0 border-0 flex flex-col items-center justify-center bg-slate-900/95 rounded-none z-[200] max-w-[100vw] w-screen h-screen max-h-[100vh] outline-none"
           onOpenAutoFocus={(e) => e.preventDefault()}
           onCloseAutoFocus={(e) => e.preventDefault()}
           onPointerDownOutside={(e) => e.preventDefault()}
           onInteractOutside={(e) => e.preventDefault()}
           onFocusOutside={(e) => e.preventDefault()}
        >
          <VisuallyHidden>
            <DialogTitle>치과 이미지 에디터</DialogTitle>
            <DialogDescription>4분면 요약 사진을 편집합니다.</DialogDescription>
          </VisuallyHidden>
          {viewerOpen && img && (
            <DentalImageEditor 
              imageId={img.dental_image_id} 
              imageUrl={img.img_url} 
              initialMark={img.mark} 
              onClose={() => setViewerOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

interface Props {
  chartDetail: DentalChartDetail
  hosId: string
  images: DentalImage[]
  onImagesChange: (imgs: DentalImage[]) => void
}

export default function DentalChartGeneralPanel({ chartDetail, hosId, images, onImagesChange }: Props) {
  const { refresh } = useRouter()
  const [isPending, startTransition] = useTransition()
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
    setAssessmentOrder(chartDetail.assessment_image_order ?? [])
    setTreatmentOrder(chartDetail.treatment_image_order ?? [])
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

  const [assessmentOrder, setAssessmentOrder] = useState<string[]>(
    chartDetail.assessment_image_order ?? []
  )
  const [treatmentOrder, setTreatmentOrder] = useState<string[]>(
    chartDetail.treatment_image_order ?? []
  )

  function sortByOrder(imgs: DentalImage[], order: string[]): DentalImage[] {
    const inOrder = order
      .map(id => imgs.find(img => img.dental_image_id === id))
      .filter((img): img is DentalImage => img !== undefined)
    const notInOrder = imgs.filter(img => !order.includes(img.dental_image_id))
    return [...inOrder, ...notInOrder]
  }

  const handleAssessmentOrderChange = async (ids: string[]) => {
    setAssessmentOrder(ids)
    try {
      await updateDentalChart(chartDetail.id, hosId, { assessment_image_order: ids })
    } catch {
      toast.error('순서 저장에 실패했습니다.')
    }
  }

  const handleTreatmentOrderChange = async (ids: string[]) => {
    setTreatmentOrder(ids)
    try {
      await updateDentalChart(chartDetail.id, hosId, { treatment_image_order: ids })
    } catch {
      toast.error('순서 저장에 실패했습니다.')
    }
  }

  const img100 = images.find(img => img.tooth_ids?.includes('100'))
  const img200 = images.find(img => img.tooth_ids?.includes('200'))
  const img300 = images.find(img => img.tooth_ids?.includes('300'))
  const img400 = images.find(img => img.tooth_ids?.includes('400'))

  const generalImages = images.filter(img => (img.tooth_ids || []).includes('general'))
  const assessmentImages = sortByOrder(
    images.filter(img => (img.tooth_ids || []).includes('assessment')),
    assessmentOrder
  )
  const treatmentImages = sortByOrder(
    images.filter(img => (img.tooth_ids || []).includes('treatment')),
    treatmentOrder
  )

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

            <div className="bg-slate-50 px-4 py-6 border-b border-t mt-4">
               <h3 className="text-sm font-bold text-slate-700">구강 요약 (4분면)</h3>
               <p className="text-[10px] text-slate-400 mt-1 italic">* 100~400 태그가 지정된 사진이 자동으로 요약 차트에 반영됩니다.</p>
            </div>

            <div className="px-4 py-8 bg-slate-50/30">
               <div className="max-w-[700px] mx-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <QuadrantBox label="Rt Max (100)" img={img100} />
                    <QuadrantBox label="Lt Max (200)" img={img200} />
                    <QuadrantBox label="Rt Mand (400)" img={img400} />
                    <QuadrantBox label="Lt Mand (300)" img={img300} />
                  </div>
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
          </section>

          <Separator />

          {/* 진단 및 처치 사진 — 비교 순서 변경 */}
          {(assessmentImages.length > 0 || treatmentImages.length > 0) && (
            <section id="image-order">
              <div className="bg-slate-50 px-4 py-2 border-b border-t mt-4">
                <h3 className="text-sm font-bold text-slate-700">사진 순서 관리</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">드래그로 순서를 변경하면 자동 저장됩니다.</p>
              </div>
              <div className="flex flex-col divide-y">
                <DentalImageGallery
                  images={assessmentImages}
                  title="진단 및 평가"
                  onOrderChange={handleAssessmentOrderChange}
                  className="mt-0 border-t-0"
                />
                <DentalImageGallery
                  images={treatmentImages}
                  title="치료 및 처치"
                  onOrderChange={handleTreatmentOrderChange}
                  className="mt-0 border-t-0"
                />
              </div>
            </section>
          )}
          <div className="h-40" />
        </div>
      </ScrollArea>

      <div className="shrink-0 flex justify-end border-t bg-slate-50 px-4 py-3 sticky bottom-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] items-center gap-3">
        {isDirty && !isPending && <span className="text-[10px] text-amber-600 font-medium animate-pulse italic">* 저장되지 않은 변경사항이 있습니다.</span>}
        {isPending && <span className="text-[10px] text-indigo-600 font-medium italic flex items-center gap-1"><LoaderCircleIcon className="w-3 h-3 animate-spin" />저장 중...</span>}
        <Button onClick={() => handleSave()} disabled={isPending || !isDirty} size="default" className="min-w-[120px]">
          {isPending ? <LoaderCircleIcon className="animate-spin mr-2 h-4 w-4" /> : null}
          {isPending ? '저장 중...' : isDirty ? '지금 저장' : '저장됨'}
        </Button>
      </div>

    </div>
  )
}
