'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { updateDentalChart } from '@/lib/actions/dental/update-dental-chart'
import type { DentalChartDetail } from '@/types/dental/dental-type'

type Props = { chartDetail: DentalChartDetail; hosId: string }

const SKULL_OPTS = ['dolichocephalic', 'mesocephalic', 'brachycephalic']
const OCCLUSION_OPTS = ['normal', 'class1', 'class2', 'class3', 'class4']
const CROWDING_OPTS = ['none', 'mild', 'moderate', 'severe']
const SEVERITY = ['none', 'mild', 'moderate', 'severe']
const STAGE_OPTS = ['healthy', 'stage1', 'stage2', 'stage3', 'stage4']

function SelectF({ label, value, onChange, options }: { label: string; value: string | null; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Select value={value ?? ''} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="선택" /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  )
}

function TextF({ label, value, onChange, rows = 2 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="text-sm" />
    </div>
  )
}

export default function DentalOralEvalTab({ chartDetail, hosId }: Props) {
  const { refresh } = useRouter()
  const [isPending, startTransition] = useTransition()

  const [skullType, setSkullType] = useState<string | null>(chartDetail.skull_type ?? null)
  const [occlusion, setOcclusion] = useState<string | null>(chartDetail.occlusion ?? null)
  const [crowding, setCrowding] = useState<string | null>(chartDetail.crowding ?? null)
  const [gingivitisOverall, setGingivitisOverall] = useState<string | null>(chartDetail.gingivitis_overall ?? null)
  const [calculusOverall, setCalculusOverall] = useState<string | null>(chartDetail.calculus_overall ?? null)
  const [periodontitisStage, setPeriodontitisStage] = useState<string | null>(chartDetail.periodontitis_stage ?? null)
  const [oralMucosa, setOralMucosa] = useState(chartDetail.oral_mucosa ?? '')
  const [tongueEval, setTongueEval] = useState(chartDetail.tongue_eval ?? '')
  const [palateEval, setPalateEval] = useState(chartDetail.palate_eval ?? '')
  const [tonsilEval, setTonsilEval] = useState(chartDetail.tonsil_eval ?? '')
  const [pharynxEval, setPharynxEval] = useState(chartDetail.pharynx_eval ?? '')
  const [salivaryEval, setSalivaryEval] = useState(chartDetail.salivary_eval ?? '')
  const [lymphNodeEval, setLymphNodeEval] = useState(chartDetail.lymph_node_eval ?? '')
  const [xrayTaken, setXrayTaken] = useState(chartDetail.xray_taken ?? false)
  const [xrayFindings, setXrayFindings] = useState(chartDetail.xray_findings ?? '')

  function handleSave() {
    startTransition(async () => {
      await updateDentalChart(chartDetail.id, hosId, {
        skull_type: skullType as DentalChartDetail['skull_type'],
        occlusion: occlusion as DentalChartDetail['occlusion'],
        crowding: crowding as DentalChartDetail['crowding'],
        gingivitis_overall: gingivitisOverall as DentalChartDetail['gingivitis_overall'],
        calculus_overall: calculusOverall as DentalChartDetail['calculus_overall'],
        periodontitis_stage: periodontitisStage as DentalChartDetail['periodontitis_stage'],
        oral_mucosa: oralMucosa || null,
        tongue_eval: tongueEval || null,
        palate_eval: palateEval || null,
        tonsil_eval: tonsilEval || null,
        pharynx_eval: pharynxEval || null,
        salivary_eval: salivaryEval || null,
        lymph_node_eval: lymphNodeEval || null,
        xray_taken: xrayTaken,
        xray_findings: xrayFindings || null,
      })
      refresh()
    })
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-6 pb-20">
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">두개 / 교합</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <SelectF label="두개 유형" value={skullType} onChange={setSkullType} options={SKULL_OPTS} />
              <SelectF label="교합" value={occlusion} onChange={setOcclusion} options={OCCLUSION_OPTS} />
              <SelectF label="혼잡도" value={crowding} onChange={setCrowding} options={CROWDING_OPTS} />
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">전체 치주 평가</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <SelectF label="잇몸 염증 (전체)" value={gingivitisOverall} onChange={setGingivitisOverall} options={SEVERITY} />
              <SelectF label="치석 (전체)" value={calculusOverall} onChange={setCalculusOverall} options={SEVERITY} />
              <SelectF label="치주 질환 병기 (AVDC)" value={periodontitisStage} onChange={setPeriodontitisStage} options={STAGE_OPTS} />
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">구강 점막 소견</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextF label="구강 점막" value={oralMucosa} onChange={setOralMucosa} />
              <TextF label="혀" value={tongueEval} onChange={setTongueEval} />
              <TextF label="구개" value={palateEval} onChange={setPalateEval} />
              <TextF label="편도" value={tonsilEval} onChange={setTonsilEval} />
              <TextF label="인두" value={pharynxEval} onChange={setPharynxEval} />
              <TextF label="침샘" value={salivaryEval} onChange={setSalivaryEval} />
              <TextF label="하악 림프절" value={lymphNodeEval} onChange={setLymphNodeEval} />
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">방사선</p>
            <div className="flex items-center gap-2">
              <Switch id="xray" checked={xrayTaken} onCheckedChange={setXrayTaken} />
              <Label htmlFor="xray" className="cursor-pointer text-xs">방사선 촬영 시행</Label>
            </div>
            {xrayTaken && <TextF label="방사선 소견" value={xrayFindings} onChange={setXrayFindings} rows={3} />}
          </section>
        </div>
      </ScrollArea>

      <div className="shrink-0 flex justify-end border-t bg-background px-4 py-3">
        <Button onClick={handleSave} disabled={isPending} size="sm">
          {isPending ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  )
}
