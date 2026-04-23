'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { LoaderCircleIcon } from 'lucide-react'
import { updateDentalChart } from '@/lib/actions/dental/update-dental-chart'
import type { DentalChartDetail } from '@/types/dental/dental-type'
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

const DentalImageEditor = dynamic(() => import('@/components/hospital/dental/dental-image-editor'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center bg-slate-900 text-white">에디터 로딩 중...</div>
})

interface Props {
  chartDetail: DentalChartDetail
  hosId: string
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

  useEffect(() => {
    getDentalImages(chartDetail.id).then(res => setImages(res)).catch(console.error)
  }, [chartDetail.id])

  // Supabase Realtime 구독을 통해 이미지 마킹 실시간 업데이트
  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel('dental_images_general_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'dental_images',
        },
        (payload) => {
          const updatedImage = payload.new as DentalImage
          setImages((prev) => 
            prev.map((img) => 
              img.dental_image_id === updatedImage.dental_image_id 
                ? { ...img, ...updatedImage } 
                : img
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // 4분면 이미지 추출
  const img100 = images.find(img => img.tooth_ids?.includes('100'))
  const img200 = images.find(img => img.tooth_ids?.includes('200'))
  const img300 = images.find(img => img.tooth_ids?.includes('300'))
  const img400 = images.find(img => img.tooth_ids?.includes('400'))

  function QuadrantBox({ label, img }: { label: string, img?: DentalImage }) {
    return (
      <div 
        className={cn(
          "flex flex-col border border-slate-200 bg-white shadow-sm overflow-hidden rounded",
          img && "cursor-pointer hover:border-indigo-400 hover:ring-2 hover:ring-indigo-100 transition-all"
        )}
        onClick={() => img && setSelectedEditorImageId(img.dental_image_id)}
      >
        <div className="text-[10.5px] font-bold text-center bg-slate-100 py-1 border-b uppercase text-slate-600 tracking-wider">
          {label}
        </div>
        <div className="aspect-[4/3] bg-slate-50 flex items-center justify-center">
          {img ? (
            <DentalImageWithMark 
              imageUrl={img.img_url} 
              mark={img.mark} 
              noHover 
              aspectRatio="aspect-auto" 
              className="h-full w-full" 
            />
          ) : (
            <div className="flex flex-col items-center gap-1 opacity-20">
              <span className="text-[9px] font-medium text-slate-400">NO IMAGE</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  const editorImage = images.find(img => img.dental_image_id === selectedEditorImageId)
  const cn = (...args: any[]) => args.filter(Boolean).join(' ') // 헬퍼 함수가 위에서 cn import 안되었을 경우 대비 (실제로는 import 되어있을 것임)

  async function handleSave() {
    startTransition(async () => {
      // 시스템 태그 생성 로직 (검색용)
      const ageDays = Math.floor(
        (Date.now() - new Date(chartDetail.patient.birth ?? '').getTime()) / (1000 * 60 * 60 * 24),
      )
      const systemTags = `#${chartDetail.patient.hos_patient_id}#${chartDetail.patient.hos_owner_id ?? ''}#${chartDetail.patient.name}#${chartDetail.patient.species}#${chartDetail.patient.breed}#${chartDetail.patient.gender}#${ageDays}`

      try {
        await updateDentalChart(chartDetail.id, hosId, {
          // 일반
          vet_id: vetId,
          user_tags: userTags || null,
          tags: systemTags,
          general_note: generalNote || null,
          // 구강 평가
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
          // 처치
          anesthesia,
          anesthesia_note: anesthesiaNote || null,
          ...procedures,
          procedure_other: procedureOther || null,
          // 계획
          treatment_plan: treatmentPlan || null,
          recheck_interval: recheckInterval,
          homecare_instruction: homecareInstruction || null,
        })
        toast.success('치과 차트를 저장하였습니다.')
        refresh()
      } catch (error) {
        console.error(error)
        toast.error('저장에 실패하였습니다.')
      }
    })
  }

  const generalImages = images.filter(img => (img.tooth_ids || []).includes('general'))
  const assessmentImages = images.filter(img => (img.tooth_ids || []).includes('assessment'))
  const treatmentImages = images.filter(img => (img.tooth_ids || []).includes('treatment'))

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white relative">
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {/* 1. 일반 (DentalNoteTab) */}
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

          {/* 2. 구강 평가 (DentalOralEvalTab) */}
          <section id="oral-eval">
            <div className="bg-slate-50 px-4 py-2 border-b border-t mt-4">
              <h3 className="text-sm font-bold text-slate-700">구강 평가</h3>
            </div>
            
            {/* 4분면 그림 삽입 */}
            <div className="px-4 py-6 bg-slate-50/30">
               <div className="max-w-[800px] mx-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <QuadrantBox label="Rt Max" img={img100} />
                    <QuadrantBox label="Lt Max" img={img200} />
                    <QuadrantBox label="Rt Mand" img={img400} />
                    <QuadrantBox label="Lt Mand" img={img300} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 text-center italic">
                    * 개별 치아 선택 시 100~400 태그를 지정하면 자동으로 요약 차트에 반영됩니다.
                  </p>
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

          {/* 3. 처치 내역 (DentalProcedureTab) */}
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

          {/* 4. 치료 계획 (DentalTreatmentTab) - Treatment 이미지는 처치/치료 마지막에 통합 표시 */}
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

          {/* 여백 확보 */}
          <div className="h-40" />
        </div>
      </ScrollArea>

      {/* 고정 저장 버튼 */}
      <div className="shrink-0 flex justify-end border-t bg-slate-50 px-4 py-3 sticky bottom-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <Button onClick={handleSave} disabled={isPending} size="default" className="min-w-[120px]">
          {isPending ? <LoaderCircleIcon className="animate-spin mr-2 h-4 w-4" /> : null}
          {isPending ? '저장 중...' : '차트 저장'}
        </Button>
      </div>

      {/* 이미지 에디터 다이얼로그 */}
      <Dialog open={!!selectedEditorImageId} onOpenChange={(open) => !open && setSelectedEditorImageId(null)} modal={false}>
        <DialogContent 
          className="max-w-[100vw] w-screen h-screen max-h-[100vh] p-0 m-0 border-0 flex flex-col bg-slate-900 rounded-none z-[100]"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <VisuallyHidden>
            <DialogTitle>치과 이미지 에디터</DialogTitle>
            <DialogDescription>도형 및 글자를 추가하고 그림을 그릴 수 있는 에디터입니다.</DialogDescription>
          </VisuallyHidden>
          
          {editorImage && (
             <DentalImageEditor 
               imageId={editorImage.dental_image_id} 
               imageUrl={editorImage.img_url} 
               initialMark={editorImage.mark} 
               onClose={() => setSelectedEditorImageId(null)}
             />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
