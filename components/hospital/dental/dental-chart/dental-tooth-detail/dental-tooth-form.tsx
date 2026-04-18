'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { upsertDentalTooth } from '@/lib/actions/dental/upsert-dental-tooth'
import { toothNames } from '@/constants/hospital/dental/dental_chart_canine_combined'
import type { DentalTooth } from '@/types/dental/dental-type'
import DentalProbingGrid from './dental-probing-grid'

type SixPoint = { ml: number | null; l: number | null; dl: number | null; mb: number | null; b: number | null; db: number | null }

type Props = {
  toothId: string
  chartId: string
  hosId: string
  existing: DentalTooth | undefined
  onSaved?: () => void
  onCancel?: () => void
}

const GINGIVITIS_OPTS = ['GI0', 'GI1', 'GI2', 'GI3'] as const
const CALCULUS_OPTS = ['CI0', 'CI1', 'CI2', 'CI3'] as const
const PLAQUE_OPTS = ['PI0', 'PI1', 'PI2', 'PI3'] as const
const SEVERITY = ['none', 'mild', 'moderate', 'severe'] as const
const FRACTURE_OPTS = ['none', 'T/FX/EF', 'T/FX/UCF', 'T/FX/CCF', 'T/FX/UCRF', 'T/FX/CCRF', 'T/FX/RF'] as const
const RESORPTION_OPTS = ['none', 'TR1', 'TR2', 'TR3', 'TR4', 'TR5'] as const
const MOBILITY_OPTS = ['M0', 'M1', 'M2', 'M3'] as const
const FURCATION_OPTS = ['F0', 'F1', 'F2', 'F3'] as const
const STATUS_OPTS = ['present', 'ANO', 'extracted', 'T/U', 'T/I', 'DT/P'] as const
const PRIORITY_OPTS = ['urgent', 'recommended', 'elective', 'monitor'] as const
const TREATMENT_OPTIONS = [
  'scaling', 'polishing', 'extraction', 'root_canal', 'vital_pulp_therapy',
  'crown_restoration', 'composite_restoration', 'gingivectomy',
  'alveoloplasty', 'periodontal_surgery', 'splinting',
]

function SelectField({ label, value, onChange, options }: {
  label: string
  value: string | null
  onChange: (v: string) => void
  options: readonly string[]
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Select value={value ?? 'none'} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function MultiCheckField({ label, selected, onChange }: {
  label: string
  selected: string[]
  onChange: (v: string[]) => void
}) {
  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt])
  }
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {TREATMENT_OPTIONS.map((opt) => (
          <div key={opt} className="flex items-center gap-1">
            <Checkbox
              id={`${label}-${opt}`}
              checked={selected.includes(opt)}
              onCheckedChange={() => toggle(opt)}
              className="h-3.5 w-3.5"
            />
            <label htmlFor={`${label}-${opt}`} className="cursor-pointer text-xs">{opt}</label>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DentalToothForm({ toothId, chartId, hosId, existing, onSaved, onCancel }: Props) {
  const { refresh } = useRouter()
  const [isPending, startTransition] = useTransition()

  const toothName = toothNames[toothId] ?? toothId

  // ── state 초기값 ──
  const [status, setStatus] = useState<string>(existing?.status ?? 'present')
  const [isDeciduous, setIsDeciduous] = useState(existing?.is_deciduous ?? false)
  const [gingivitis, setGingivitis] = useState<string>(existing?.gingivitis ?? 'none')
  const [calculus, setCalculus] = useState<string>(existing?.calculus ?? 'none')
  const [plaque, setPlaque] = useState<string>(existing?.plaque ?? 'none')
  const [mobility, setMobility] = useState<string>(existing?.mobility ?? 'none')
  const [furcation, setFurcation] = useState<string>(existing?.furcation ?? 'none')
  const [fracture, setFracture] = useState<string>(existing?.fracture ?? 'none')
  const [pulpExposure, setPulpExposure] = useState(existing?.pulp_exposure ?? false)
  const [caries, setCaries] = useState<string>(existing?.caries ?? 'none')
  const [resorption, setResorption] = useState<string>(existing?.resorption ?? 'none')
  const [attrition, setAttrition] = useState<string>(existing?.attrition ?? 'none')
  const [abrasion, setAbrasion] = useState<string>(existing?.abrasion ?? 'none')
  const [treatmentDone, setTreatmentDone] = useState<string[]>(existing?.treatment_done ?? [])
  const [treatmentPlan, setTreatmentPlan] = useState<string[]>(existing?.treatment_plan ?? [])
  const [priority, setPriority] = useState(existing?.treatment_priority ?? null)
  const [xrayFinding, setXrayFinding] = useState(existing?.xray_finding ?? '')
  const [toothNote, setToothNote] = useState(existing?.tooth_note ?? '')

  // 치주낭 깊이
  const [probing, setProbing] = useState<SixPoint>({
    ml: existing?.probing_ml ?? null, l: existing?.probing_l ?? null, dl: existing?.probing_dl ?? null,
    mb: existing?.probing_mb ?? null, b: existing?.probing_b ?? null, db: existing?.probing_db ?? null,
  })
  // 치은 퇴축
  const [recession, setRecession] = useState<SixPoint>({
    ml: existing?.recession_ml ?? null, l: existing?.recession_l ?? null, dl: existing?.recession_dl ?? null,
    mb: existing?.recession_mb ?? null, b: existing?.recession_b ?? null, db: existing?.recession_db ?? null,
  })

  function handleSave() {
    startTransition(async () => {
      await upsertDentalTooth({
        chart_id: chartId,
        hos_id: hosId,
        tooth_id: Number(toothId),
        status: status as DentalTooth['status'],
        is_deciduous: isDeciduous,
        gingivitis: gingivitis as DentalTooth['gingivitis'],
        calculus: calculus as DentalTooth['calculus'],
        plaque: plaque as DentalTooth['plaque'],
        mobility: mobility as DentalTooth['mobility'],
        furcation: furcation as DentalTooth['furcation'],
        fracture: fracture as DentalTooth['fracture'],
        pulp_exposure: pulpExposure,
        caries: caries as DentalTooth['caries'],
        resorption: resorption as DentalTooth['resorption'],
        attrition: attrition as DentalTooth['attrition'],
        abrasion: abrasion as DentalTooth['abrasion'],
        probing_ml: probing.ml, probing_l: probing.l, probing_dl: probing.dl,
        probing_mb: probing.mb, probing_b: probing.b, probing_db: probing.db,
        recession_ml: recession.ml, recession_l: recession.l, recession_dl: recession.dl,
        recession_mb: recession.mb, recession_b: recession.b, recession_db: recession.db,
        treatment_done: treatmentDone,
        treatment_plan: treatmentPlan,
        treatment_priority: priority as DentalTooth['treatment_priority'],
        xray_finding: xrayFinding || null,
        tooth_note: toothNote || null,
      })
      refresh()
      onSaved?.()
    })
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ScrollArea className="flex-1 px-4 py-4">
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
              <SelectField label="상태" value={status} onChange={setStatus} options={STATUS_OPTS} />
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
              <SelectField label="잇몸 염증" value={gingivitis} onChange={setGingivitis} options={GINGIVITIS_OPTS} />
              <SelectField label="치석" value={calculus} onChange={setCalculus} options={CALCULUS_OPTS} />
              <SelectField label="치태" value={plaque} onChange={setPlaque} options={PLAQUE_OPTS} />
              <SelectField label="동요도" value={mobility} onChange={setMobility} options={MOBILITY_OPTS} />
              <SelectField label="분기부 병변" value={furcation} onChange={setFurcation} options={FURCATION_OPTS} />
            </div>
          </section>

          {/* 치주낭 깊이 */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">치주낭 깊이 (mm)</p>
            <DentalProbingGrid
              label="6포인트 측정"
              values={probing}
              onChange={(k, v) => setProbing((prev) => ({ ...prev, [k]: v }))}
            />
          </section>

          {/* 치은 퇴축 */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">치은 퇴축 (mm)</p>
            <DentalProbingGrid
              label="6포인트 측정"
              values={recession}
              onChange={(k, v) => setRecession((prev) => ({ ...prev, [k]: v }))}
            />
          </section>

          {/* 병변 */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">병변</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <SelectField label="치관 골절" value={fracture} onChange={setFracture} options={FRACTURE_OPTS} />
              <SelectField label="우식 (충치)" value={caries} onChange={setCaries} options={SEVERITY} />
              <SelectField label="치근 흡수" value={resorption} onChange={setResorption} options={RESORPTION_OPTS} />
              <SelectField label="마모 (교모)" value={attrition} onChange={setAttrition} options={SEVERITY} />
              <SelectField label="마모 (마찰)" value={abrasion} onChange={setAbrasion} options={SEVERITY} />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="pulp" checked={pulpExposure} onCheckedChange={setPulpExposure} />
              <Label htmlFor="pulp" className="text-xs cursor-pointer">치수 노출 (Pulp Exposure)</Label>
            </div>
          </section>

          {/* 처치 & 계획 */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">처치 & 계획</p>
            <MultiCheckField label="완료된 처치" selected={treatmentDone} onChange={setTreatmentDone} />
            <MultiCheckField label="치료 계획" selected={treatmentPlan} onChange={setTreatmentPlan} />
            <SelectField label="우선순위" value={priority} onChange={(v) => setPriority(v as DentalTooth['treatment_priority'])} options={PRIORITY_OPTS} />
            <div className="space-y-1">
              <Label className="text-xs">방사선 소견</Label>
              <Textarea value={xrayFinding} onChange={(e) => setXrayFinding(e.target.value)} rows={2} className="text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">치아 메모</Label>
              <Textarea value={toothNote} onChange={(e) => setToothNote(e.target.value)} rows={2} className="text-sm" />
            </div>
          </section>
        </div>
      </ScrollArea>

      {/* 고정 저장 버튼 */}
      <div className="shrink-0 flex justify-end gap-2 border-t bg-background py-3">
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
