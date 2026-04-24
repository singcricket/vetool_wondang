'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useRef } from 'react'
import { CameraIcon, ImageIcon, LoaderCircleIcon } from 'lucide-react'
import { upsertDentalTooth } from '@/lib/actions/dental/upsert-dental-tooth'
import { uploadDentalImage } from '@/lib/services/dental/upload-dental-image'
import { insertDentalImages } from '@/lib/actions/dental/insert-dental-images'
import { toothNames } from '@/constants/hospital/dental/dental_chart_canine_combined'
import { DENTAL_TOOTH_TESTS } from '@/constants/hospital/dental/dentalToothTests'
import type { DentalChartDetail, DentalTooth } from '@/types/dental/dental-type'
import DentalProbingGrid from './dental-probing-grid'
import AvdcAutocompleteInput from '../../avdc-autocomplete-input'
import { getDentalImages } from '@/lib/actions/dental/get-dental-images'
import { useEffect } from 'react'
import type { DentalImage } from '@/types/dental/dental-type'
import DentalImageGallery from '@/components/hospital/dental/dental-image-gallery'
import { toast } from 'sonner'
import { HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type SixPoint<T = number | null> = { ml: T; l: T; dl: T; mb: T; b: T; db: T }

type Props = {
  toothId: string
  chartDetail: DentalChartDetail
  hosId: string
  existing: DentalTooth | undefined
  onSaved?: () => void
  onCancel?: () => void
  refreshKey?: number
}

const PRIORITY_OPTS = [
  { value: 'urgent', label: '긴급 (Urgent)' },
  { value: 'recommended', label: '권장 (Recommended)' },
  { value: 'elective', label: '선택 (Elective)' },
  { value: 'monitor', label: '모니터링 (Monitor)' },
]
const SEVERITY_OPTS = [
  { value: 'none', label: '없음' },
  { value: 'mild', label: '경도' },
  { value: 'moderate', label: '중등도' },
  { value: 'severe', label: '중증' },
]

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

function TestHelpTooltip({ testId }: { testId?: string }) {
  if (!testId || !DENTAL_TOOTH_TESTS[testId]) return null
  
  const test = DENTAL_TOOTH_TESTS[testId]
  const comments = test.optComment
  const hasOptComments = comments && Object.keys(comments).length > 0

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex items-center justify-center rounded-full hover:bg-slate-100 p-0.5 transition-colors">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help hover:text-indigo-500 transition-colors" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" className="w-[280px] sm:w-[320px] p-3 text-xs bg-slate-900 text-slate-200 border-slate-700 shadow-2xl z-[100]">
        <div className="space-y-2">
          {test.testInfo && <p className="font-medium text-indigo-300 leading-relaxed">{test.testInfo}</p>}
          {hasOptComments && (
            <div className="space-y-1.5 border-t border-slate-800 pt-2 mt-2">
              {test.options?.map((opt) => {
                const comment = comments[opt.value]
                if (!comment) return null
                return (
                  <div key={opt.value} className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-100 text-[10px] uppercase">{opt.label}</span>
                    <span className="text-slate-400 text-[11px] leading-tight">{comment}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function SelectField({ label, value, onChange, options, testId }: {
  label: string
  value: string | null
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  testId?: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Label className="text-xs">{label}</Label>
        <TestHelpTooltip testId={testId} />
      </div>
      <Select value={value || 'clear'} onValueChange={(v) => onChange(v === 'clear' ? '' : v)}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="선택 안 함" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="clear" className="text-xs text-muted-foreground italic">선택 안 함</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function MultiCheckField({ label, selected, onChange, options, testId }: {
  label: string
  selected: string[]
  onChange: (v: string[]) => void
  options: { value: string; label: string }[]
  testId?: string
}) {
  function toggle(optValue: string) {
    onChange(selected.includes(optValue) ? selected.filter((s) => s !== optValue) : [...selected, optValue])
  }
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        <Label className="text-xs font-semibold">{label}</Label>
        <TestHelpTooltip testId={testId} />
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <div key={opt.value} className="flex items-center gap-1">
            <Checkbox
              id={`${label}-${opt.value}`}
              checked={selected.includes(opt.value)}
              onCheckedChange={() => toggle(opt.value)}
              className="h-3.5 w-3.5"
            />
            <label htmlFor={`${label}-${opt.value}`} className="cursor-pointer text-xs">{opt.label}</label>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DentalToothForm({ toothId, chartDetail, hosId, existing, onSaved, onCancel, refreshKey }: Props) {
  const species = chartDetail.species || 'canine'
  const { refresh } = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [images, setImages] = useState<DentalImage[]>([])

  const fetchImages = async () => {
    const data = await getDentalImages(chartDetail.id)
    setImages(data)
  }

  useEffect(() => {
    fetchImages()
  }, [chartDetail.id, refreshKey])

  const toothName = toothNames[toothId] ?? toothId

  // ── state 초기값 ──
  const [status, setStatus] = useState<string>(existing?.status ?? 'present')
  const [isDeciduous, setIsDeciduous] = useState(existing?.is_deciduous ?? false)
  const [periodontalStage, setPeriodontalStage] = useState<string>(existing?.periodontal_stage ?? '')
  const [gingivitis, setGingivitis] = useState<string>(existing?.gingivitis ?? '')
  const [calculus, setCalculus] = useState<string>(existing?.calculus ?? '')
  const [plaque, setPlaque] = useState<string>(existing?.plaque ?? '')
  const [mobility, setMobility] = useState<string>(existing?.mobility ?? '')
  const [furcation, setFurcation] = useState<string>(existing?.furcation ?? '')
  const [fracture, setFracture] = useState<string>(existing?.fracture ?? '')
  const [pulpExposure, setPulpExposure] = useState(existing?.pulp_exposure ?? false)
  const [caries, setCaries] = useState<string>(existing?.caries ?? '')
  const [resorptionStage, setResorptionStage] = useState<string>(existing?.resorption_stage ?? '')
  const [resorptionType, setResorptionType] = useState<string>(existing?.resorption_type ?? '')
  const [attrition, setAttrition] = useState<string>(existing?.attrition ?? '')
  const [abrasion, setAbrasion] = useState<string>(existing?.abrasion ?? '')
  const predefinedDone = DENTAL_TOOTH_TESTS.treatment_done.options?.map((o) => o.value) || []
  const initialDone = existing?.treatment_done ? [...existing.treatment_done] : []
  
  // 방사선(xray_taken) 및 스케일링(procedure_scaling) 자동 포함 로직
  if (chartDetail.xray_taken && !initialDone.includes('RAD')) initialDone.push('RAD')
  if (chartDetail.procedure_scaling && !initialDone.includes('PRO')) initialDone.push('PRO')

  const [treatmentDone, setTreatmentDone] = useState<string[]>(initialDone.filter((x) => predefinedDone.includes(x)))
  const [treatmentDoneOther, setTreatmentDoneOther] = useState<string>(
    initialDone.filter((x) => !predefinedDone.includes(x)).length > 0
      ? initialDone.filter((x) => !predefinedDone.includes(x)).join(', ') + ', '
      : ''
  )

  const predefinedPlan = DENTAL_TOOTH_TESTS.treatment_plan.options?.map((o) => o.value) || []
  const allPlan = existing?.treatment_plan ?? []
  const [treatmentPlan, setTreatmentPlan] = useState<string[]>(allPlan.filter((x) => predefinedPlan.includes(x)))
  const [treatmentPlanOther, setTreatmentPlanOther] = useState<string>(
    allPlan.filter((x) => !predefinedPlan.includes(x)).length > 0
      ? allPlan.filter((x) => !predefinedPlan.includes(x)).join(', ') + ', '
      : ''
  )
  const [priority, setPriority] = useState(existing?.treatment_priority ?? null)
  const [xrayFinding, setXrayFinding] = useState(existing?.xray_finding ?? '')
  const [toothNote, setToothNote] = useState(existing?.tooth_note || '')

  // 치주낭 깊이
  const [probing, setProbing] = useState<SixPoint<number | null>>({
    ml: existing?.probing_ml ?? null, l: existing?.probing_l ?? null, dl: existing?.probing_dl ?? null,
    mb: existing?.probing_mb ?? null, b: existing?.probing_b ?? null, db: existing?.probing_db ?? null,
  })
  // 치은 퇴축
  const [recession, setRecession] = useState<SixPoint<string | null>>({
    ml: existing?.recession_ml ?? null, l: existing?.recession_l ?? null, dl: existing?.recession_dl ?? null,
    mb: existing?.recession_mb ?? null, b: existing?.recession_b ?? null, db: existing?.recession_db ?? null,
  })

  function handleSave() {
    startTransition(async () => {
      await upsertDentalTooth({
        chart_id: chartDetail.id,
        hos_id: hosId,
        tooth_id: Number(toothId),
        status,
        is_deciduous: isDeciduous,
        periodontal_stage: periodontalStage || null,
        gingivitis: gingivitis || null,
        calculus: calculus || null,
        plaque: plaque || null,
        mobility: mobility || null,
        furcation: furcation || null,
        fracture: fracture || null,
        pulp_exposure: pulpExposure,
        caries: caries || null,
        resorption_stage: resorptionStage || null,
        resorption_type: resorptionType || null,
        attrition: attrition || null,
        abrasion: abrasion || null,
        probing_ml: probing.ml, probing_l: probing.l, probing_dl: probing.dl,
        probing_mb: probing.mb, probing_b: probing.b, probing_db: probing.db,
        recession_ml: recession.ml, recession_l: recession.l, recession_dl: recession.dl,
        recession_mb: recession.mb, recession_b: recession.b, recession_db: recession.db,
        treatment_done: (() => {
          const arr = Array.from(new Set([...treatmentDone, ...treatmentDoneOther.split(',').map(s=>s.trim()).filter(Boolean)]))
          return arr.length > 0 ? arr : null
        })(),
        treatment_plan: (() => {
          const arr = Array.from(new Set([...treatmentPlan, ...treatmentPlanOther.split(',').map(s=>s.trim()).filter(Boolean)]))
          return arr.length > 0 ? arr : null
        })(),
        treatment_priority: priority,
        xray_finding: xrayFinding || null,
        tooth_note: toothNote || null,
      })
      refresh()
      onSaved?.()
    })
  }

  // --- 이미지 필터링 로직 ---
  const toothImages = images.filter(img => (img.tooth_ids || []).includes(String(toothId)))

  const assessmentImgs = toothImages.filter(img => (img.tooth_ids || []).includes('tooth-assessment'))
  const treatmentImgs = toothImages.filter(img => (img.tooth_ids || []).includes('tooth-treatment'))
  const radioImgs = toothImages.filter(img => img.is_radio)
  const otherImgs = toothImages.filter(img => !assessmentImgs.includes(img) && !treatmentImgs.includes(img) && !radioImgs.includes(img))

  return (
    <div className="flex flex-1 flex-col overflow-hidden min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        <div className="space-y-6 pb-32">
          {/* 치아 제목 */}
          {/* <div className="flex items-center gap-2">
            <span className="text-base font-bold">{toothId}</span>
            <span className="text-sm text-muted-foreground">— {toothName}</span>
          </div> */}

          {/* 기본 정보 */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">기본 정보</p>
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="상태" value={status} onChange={setStatus} options={DENTAL_TOOTH_TESTS.tooth_status?.options || []} testId="tooth_status" />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="deciduous" checked={isDeciduous} onCheckedChange={setIsDeciduous} />
              <Label htmlFor="deciduous" className="text-xs cursor-pointer">유치 (Deciduous)</Label>
            </div>
          </section>

          {/* 치주 평가 */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">치주 평가</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <SelectField label="치주 질환 병기" value={periodontalStage} onChange={setPeriodontalStage} options={DENTAL_TOOTH_TESTS.periodontal_stage?.options || []} testId="periodontal_stage" />
              <SelectField label="잇몸 염증" value={gingivitis} onChange={setGingivitis} options={DENTAL_TOOTH_TESTS.gingivitis?.options || []} testId="gingivitis" />
              <SelectField label="치석" value={calculus} onChange={setCalculus} options={DENTAL_TOOTH_TESTS.calculus?.options || []} testId="calculus" />
              <SelectField label="치태" value={plaque} onChange={setPlaque} options={DENTAL_TOOTH_TESTS.plaque?.options || []} testId="plaque" />
              <SelectField label="동요도" value={mobility} onChange={setMobility} options={DENTAL_TOOTH_TESTS.mobility?.options || []} testId="mobility" />
              <SelectField label="분기부 병변" value={furcation} onChange={setFurcation} options={DENTAL_TOOTH_TESTS.furcation?.options || []} testId="furcation" />
            </div>
          </section>

          {/* 치주낭 깊이 */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">치주낭 깊이 (mm)</p>
            <DentalProbingGrid
              type="input"
              species={species}
              label="6포인트 측정"
              values={probing}
              onChange={(k, v) => setProbing((prev) => ({ ...prev, [k]: v as number | null }))}
            />
          </section>

          {/* 치은 퇴축 */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">치은 퇴축 (mm)</p>
            <DentalProbingGrid
              type="select"
              label="6포인트 측정"
              options={DENTAL_TOOTH_TESTS.gingival_recession.options}
              values={recession}
              onChange={(k, v) => setRecession((prev) => ({ ...prev, [k]: v as string | null }))}
            />
          </section>

          {/* 병변 */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">병변</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <SelectField label="치관 골절" value={fracture} onChange={setFracture} options={DENTAL_TOOTH_TESTS.tooth_fracture?.options || []} testId="tooth_fracture" />
              <SelectField label="치아 흡수 병기 (Stage)" value={resorptionStage} onChange={setResorptionStage} options={DENTAL_TOOTH_TESTS.resorption_stage?.options || []} testId="resorption_stage" />
              <SelectField label="치아 흡수 유형 (TR Type)" value={resorptionType} onChange={setResorptionType} options={DENTAL_TOOTH_TESTS.resorption_type?.options || []} testId="resorption_type" />
              <SelectField label="우식 (충치)" value={caries} onChange={setCaries} options={DENTAL_TOOTH_TESTS.caries?.options || SEVERITY_OPTS} testId="caries" />
              <SelectField label="마모 (교모)" value={attrition} onChange={setAttrition} options={SEVERITY_OPTS} testId="wear" />
              <SelectField label="마모 (마찰)" value={abrasion} onChange={setAbrasion} options={SEVERITY_OPTS} testId="wear" />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="pulp" checked={pulpExposure} onCheckedChange={setPulpExposure} />
              <Label htmlFor="pulp" className="text-xs cursor-pointer">치수 노출 (Pulp Exposure)</Label>
            </div>
          </section>

         
          {/* 처치 & 계획 */}
          <section className="space-y-3">
             {/* tooth-assessment 태그가 달린 이미지 */}
             <DentalImageGallery 
              images={assessmentImgs} 
              title="진단/평가 (Assessment)" 
              className="mt-0 mb-2 p-3 bg-slate-50/70"
              imageHeight="h-[72px]"
            />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">처치 & 계획</p>
            <div className="space-y-2">
              <MultiCheckField label="치료 계획" selected={treatmentPlan} onChange={setTreatmentPlan} options={DENTAL_TOOTH_TESTS.treatment_plan?.options || []} testId="treatment_plan" />
              <div className="pl-1">
                <AvdcAutocompleteInput value={treatmentPlanOther} onChange={setTreatmentPlanOther} placeholder="기타 치료 계획 (AVDC 약어 또는 정의 검색)" />
              </div>
            </div>
            <div className="border-t my-2" />
            <div className="space-y-2">
               {/* tooth-treatment 태그가 달린 이미지 */}
               <DentalImageGallery 
                images={treatmentImgs} 
                title="치료/처치 (Treatment)" 
                className="mt-0 mb-2 p-3 bg-slate-50/70"
                imageHeight="h-[72px]"
              />
              <MultiCheckField label="완료된 처치" selected={treatmentDone} onChange={setTreatmentDone} options={DENTAL_TOOTH_TESTS.treatment_done?.options || []} testId="treatment_done" />
              <div className="pl-1">
                <AvdcAutocompleteInput value={treatmentDoneOther} onChange={setTreatmentDoneOther} placeholder="기타 완료된 처치 (AVDC 약어 또는 정의 검색)" />
              </div>
            </div>
            <SelectField label="우선순위" value={priority} onChange={(v) => setPriority(v as DentalTooth['treatment_priority'])} options={PRIORITY_OPTS} testId="treatment_priority" />
            <div className="space-y-1">
               {/* is_radio : true 이미지 */}
               <DentalImageGallery 
                images={radioImgs} 
                title="방사선 (X-Ray)" 
                className="mt-0 mb-2 p-3 bg-slate-50/70"
                imageHeight="h-[72px]"
              />
              <Label className="text-xs">방사선 소견</Label>
              <Textarea value={xrayFinding} onChange={(e) => setXrayFinding(e.target.value)} rows={2} className="text-sm" />
            </div>
             {/* 나머지 이미지 */}
             <DentalImageGallery 
              images={otherImgs} 
              title="참고 이미지" 
              className="mt-0 mb-2 p-3 bg-slate-50/70"
              imageHeight="h-[72px]"
            />
            <div className="space-y-1">
              <Label className="text-xs">치아 메모</Label>
              <Textarea value={toothNote} onChange={(e) => setToothNote(e.target.value)} rows={2} className="text-sm" />
            </div>
          </section>
        </div>
      </div>

      {/* 고정 저장 버튼 */}
      <div className="shrink-0 flex justify-end gap-2 border-t bg-background px-6 py-4">
        {onCancel && (
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
            취소
          </Button>
        )}
        <Button onClick={handleSave} disabled={isPending} size="sm">
          {isPending ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  )
}
