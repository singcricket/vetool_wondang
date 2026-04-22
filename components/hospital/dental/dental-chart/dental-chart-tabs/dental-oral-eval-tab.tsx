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
import { DENTAL_CHART_TESTS } from '@/constants/hospital/dental/dentalChartTests'

type Props = {
  skullType: string | null
  onSkullTypeChange: (v: string) => void
  occlusion: string | null
  onOcclusionChange: (v: string) => void
  crowding: string | null
  onCrowdingChange: (v: string) => void
  gingivitisOverall: string | null
  onGingivitisOverallChange: (v: string) => void
  calculusOverall: string | null
  onCalculusOverallChange: (v: string) => void
  periodontitisStage: string | null
  onPeriodontitisStageChange: (v: string) => void
  oralMucosa: string
  onOralMucosaChange: (v: string) => void
  tongueEval: string
  onTongueEvalChange: (v: string) => void
  palateEval: string
  onPalateEvalChange: (v: string) => void
  tonsilEval: string
  onTonsilEvalChange: (v: string) => void
  pharynxEval: string
  onPharynxEvalChange: (v: string) => void
  salivaryEval: string
  onSalivaryEvalChange: (v: string) => void
  lymphNodeEval: string
  onLymphNodeEvalChange: (v: string) => void
  xrayTaken: boolean
  onXrayTakenChange: (v: boolean) => void
  xrayFindings: string
  onXrayFindingsChange: (v: string) => void
}

function SelectF({ label, value, onChange, options }: { label: string; value: string | null; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Select value={value ?? ''} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="선택" /></SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-xs">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
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

export default function DentalOralEvalTab({
  skullType, onSkullTypeChange,
  occlusion, onOcclusionChange,
  crowding, onCrowdingChange,
  gingivitisOverall, onGingivitisOverallChange,
  calculusOverall, onCalculusOverallChange,
  periodontitisStage, onPeriodontitisStageChange,
  oralMucosa, onOralMucosaChange,
  tongueEval, onTongueEvalChange,
  palateEval, onPalateEvalChange,
  tonsilEval, onTonsilEvalChange,
  pharynxEval, onPharynxEvalChange,
  salivaryEval, onSalivaryEvalChange,
  lymphNodeEval, onLymphNodeEvalChange,
  xrayTaken, onXrayTakenChange,
  xrayFindings, onXrayFindingsChange
}: Props) {
  return (
    <div className="flex flex-col">
      <div className="px-4 py-4">
        <div className="space-y-6">
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">두개 / 교합</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <SelectF label="두개 유형" value={skullType} onChange={onSkullTypeChange} options={DENTAL_CHART_TESTS.skull_type?.options || []} />
              <SelectF label="교합" value={occlusion} onChange={onOcclusionChange} options={DENTAL_CHART_TESTS.occlusion?.options || []} />
              <SelectF label="혼잡도" value={crowding} onChange={onCrowdingChange} options={DENTAL_CHART_TESTS.crowding?.options || []} />
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">전체 치주 평가</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <SelectF label="잇몸 염증 (전체)" value={gingivitisOverall} onChange={onGingivitisOverallChange} options={DENTAL_CHART_TESTS.gingivitis_overall?.options || []} />
              <SelectF label="치석 (전체)" value={calculusOverall} onChange={onCalculusOverallChange} options={DENTAL_CHART_TESTS.calculus_overall?.options || []} />
              <SelectF label="치주 질환 병기 (AVDC)" value={periodontitisStage} onChange={onPeriodontitisStageChange} options={DENTAL_CHART_TESTS.periodontitis_stage?.options || []} />
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">구강 점막 소견</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextF label="구강 점막" value={oralMucosa} onChange={onOralMucosaChange} />
              <TextF label="혀" value={tongueEval} onChange={onTongueEvalChange} />
              <TextF label="구개" value={palateEval} onChange={onPalateEvalChange} />
              <TextF label="편도" value={tonsilEval} onChange={onTonsilEvalChange} />
              <TextF label="인두" value={pharynxEval} onChange={onPharynxEvalChange} />
              <TextF label="침샘" value={salivaryEval} onChange={onSalivaryEvalChange} />
              <TextF label="하악 림프절" value={lymphNodeEval} onChange={onLymphNodeEvalChange} />
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">방사선</p>
            <div className="flex items-center gap-2">
              <Switch id="xray" checked={xrayTaken} onCheckedChange={onXrayTakenChange} />
              <Label htmlFor="xray" className="cursor-pointer text-xs">방사선 촬영 시행</Label>
            </div>
            {xrayTaken && <TextF label="방사선 소견" value={xrayFindings} onChange={onXrayFindingsChange} rows={3} />}
          </section>
        </div>
      </div>
    </div>
  )
}
