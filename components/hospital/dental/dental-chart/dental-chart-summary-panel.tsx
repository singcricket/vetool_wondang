'use client'

import { useRef, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { cn } from '@/lib/utils/utils'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import type { DentalChartDetail, DentalTooth, DentalImage } from '@/types/dental/dental-type'
import {
  CANINE_TOOTH_NAMES,
  FELINE_TOOTH_NAMES,
} from '@/constants/hospital/dental/dental_svg_imgs/dental-svg-info'
import DentalToothDetailView from '@/components/hospital/dental/dental-report/dental-tooth-detail-view'

// ─── 상수 ────────────────────────────────────────────────────────────────────

const EXTRACTION_CODES = ['X', 'XS', 'XSS', 'EXT']
const RESTORATION_CODES: Record<string, string> = {
  'R/C': '레진',
  'R/I': 'GI 수복',
  'RCT': '근관치료',
  'VPT': '생활치수처치',
  'ODY': '치아성형',
  'CR/A': '치관절단',
  'GBR': '골유도재생',
  'GTR': '조직유도재생',
  'GV': '치은성형',
  'OA': '교정장치',
}
const PERIO_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  PD2: { label: 'PD2 초기치주염', color: 'text-yellow-700', bg: 'bg-yellow-50' },
  PD3: { label: 'PD3 중등도치주염', color: 'text-orange-700', bg: 'bg-orange-50' },
  PD4: { label: 'PD4 진행성치주염', color: 'text-red-700', bg: 'bg-red-50' },
}
const OTHER_TREATMENT_CODES: Record<string, string> = {
  'PRO':   '스케일링/연마',
  'RP/C':  '치근활택(비외과)',
  'RP/O':  '치근활택(외과)',
  'GC':    '치은소파',
  'PCI':   '간접치수복조',
  'AP/X':  '치근단절제',
  'DTC/R': '낭종적출',
  'ALV':   '치조골성형',
  'OC':    '교합조정',
  'GF/B':  '골이식',
  'GF/CT': '결합조직이식',
  'B/I':   '절개생검',
  'B/E':   '절제생검',
  'RAD':   '방사선촬영',
}
const PD_OVERALL_LABEL: Record<string, string> = {
  PD0: 'PD0 정상',
  PD1: 'PD1 치은염',
  PD2: 'PD2 초기',
  PD3: 'PD3 중등도',
  PD4: 'PD4 진행성',
}

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

function toothName(id: number, species: string): string {
  const names = species === 'feline' ? FELINE_TOOTH_NAMES : CANINE_TOOTH_NAMES
  return names[String(id)] ?? String(id)
}

function ToothBadge({
  id, species, className, onClick, extracted = false,
}: {
  id: number; species: string; className?: string; onClick?: () => void; extracted?: boolean
}) {
  return (
    <span
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
      className={cn(
        'inline-flex flex-col items-center gap-0.5 rounded-lg border px-2.5 py-1.5 text-center',
        onClick && 'cursor-pointer hover:brightness-95 active:scale-95 transition-transform',
        className,
      )}
    >
      <span className="text-sm font-bold leading-none">{id}</span>
      <span className="text-[9px] leading-tight text-current opacity-70 max-w-[72px] text-center">
        {toothName(id, species)}
      </span>
      {extracted && (
        <span className="mt-0.5 rounded bg-pink-500 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
          발치
        </span>
      )}
    </span>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
      {children}
    </h3>
  )
}

function EmptyNote({ text }: { text: string }) {
  return <p className="text-xs text-slate-400 py-1">{text}</p>
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

type Props = {
  chartDetail: DentalChartDetail
  teeth: DentalTooth[]
  images?: DentalImage[]
}

export default function DentalChartSummaryPanel({ chartDetail, teeth, images = [] }: Props) {
  const captureRef = useRef<HTMLDivElement>(null)
  const [dialogTooth, setDialogTooth] = useState<DentalTooth | null>(null)
  const species = chartDetail.species ?? chartDetail.patient?.species ?? 'canine'

  function openTooth(t: DentalTooth) { setDialogTooth(t) }

  // ── 이번 내원 처치 분류 ────────────────────────────────────────
  const extractedTeeth = teeth.filter(t =>
    t.treatment_done?.some(c => EXTRACTION_CODES.includes(c.toUpperCase()))
  )

  // 수복/신경 치료: 치아별로 어떤 처치를 했는지 라벨화
  const restoredTeeth: { tooth: DentalTooth; labels: string[] }[] = teeth
    .map(t => ({
      tooth: t,
      labels: (t.treatment_done ?? [])
        .filter(c => c in RESTORATION_CODES)
        .map(c => RESTORATION_CODES[c]),
    }))
    .filter(x => x.labels.length > 0)

  // ── 관리 필요 치아 분류 ────────────────────────────────────────
  // 치주 문제 (PD2+)
  const perioTeeth = teeth.filter(t =>
    t.periodontal_stage && ['PD2', 'PD3', 'PD4'].includes(t.periodontal_stage)
  )
  // 치아 흡수 (TR2+)
  const resorptionTeeth = teeth.filter(t =>
    t.resorption_stage && ['TR2', 'TR3', 'TR4', 'TR5'].includes(t.resorption_stage)
  )
  // 파절
  const fractureTeeth = teeth.filter(t =>
    t.fracture && t.fracture !== 'none'
  )
  // 동요도 (M1+)
  const mobilityTeeth = teeth.filter(t =>
    t.mobility && ['M1', 'M2', 'M3'].includes(t.mobility)
  )
  // 분기부 병변 (F2+)
  const furcationTeeth = teeth.filter(t =>
    t.furcation && ['F2', 'F3'].includes(t.furcation)
  )
  // 치근단 병소
  const periapicalTeeth = teeth.filter(t =>
    t.periapical && t.periapical !== 'none'
  )
  // 기타 치료 (발치·수복 제외한 치아별 처치)
  const SKIP_CODES = new Set([...EXTRACTION_CODES, ...Object.keys(RESTORATION_CODES)])
  const otherTreatedTeeth: { tooth: DentalTooth; labels: string[] }[] = teeth
    .map(t => ({
      tooth: t,
      labels: (t.treatment_done ?? [])
        .filter(c => !SKIP_CODES.has(c.toUpperCase()) && !SKIP_CODES.has(c))
        .map(c => OTHER_TREATMENT_CODES[c] ?? c),
    }))
    .filter(x => x.labels.length > 0)

  // ── PNG 저장 ───────────────────────────────────────────────────
  const handleExportPng = async () => {
    if (!captureRef.current) return
    try {
      toast.loading('이미지를 생성하는 중…', { id: 'summary-png' })
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(captureRef.current, {
        scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff',
      })
      const link = document.createElement('a')
      link.download = `치과요약_${chartDetail.patient?.name ?? ''}_${chartDetail.chart_date}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('저장됐습니다.', { id: 'summary-png' })
    } catch {
      toast.error('저장에 실패했습니다.', { id: 'summary-png' })
    }
  }

  return (
    <>
    {/* 치아 상세 Dialog */}
    <Dialog open={!!dialogTooth} onOpenChange={(o) => { if (!o) setDialogTooth(null) }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
        <VisuallyHidden>
          <DialogTitle>치아 상세</DialogTitle>
          <DialogDescription>선택한 치아의 검사 및 처치 내역</DialogDescription>
        </VisuallyHidden>
        {dialogTooth && (
          <div className="flex flex-col">
            <div className="bg-blue-50 px-5 py-3 border-b flex items-center justify-between shrink-0">
              <span className="text-sm font-bold text-blue-700">
                {dialogTooth.tooth_id} &nbsp;
                <span className="font-normal text-blue-600">
                  {toothName(dialogTooth.tooth_id, species)}
                </span>
              </span>
              <span className="text-[11px] text-blue-400">{chartDetail.chart_date}</span>
            </div>
            <div className="p-5">
              <DentalToothDetailView
                tooth={dialogTooth}
                images={images}
                species={species}
                chartDetail={chartDetail}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    <div className="flex h-full flex-col overflow-hidden">
      {/* 툴바 */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 py-2">
        <span className="text-xs font-semibold text-slate-600">치과 처치 요약</span>
        <Button
          size="sm" variant="outline" onClick={handleExportPng}
          className="h-7 gap-1 px-2.5 text-[11px] text-slate-500"
        >
          <Download size={11} />
          PNG 저장
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div ref={captureRef} className="space-y-5 bg-white p-4">

          {/* ── 헤더 (캡처용) ── */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-sm font-bold text-slate-800">{chartDetail.patient?.name}</span>
                <span className="ml-2 text-xs text-slate-500">
                  {chartDetail.patient?.species === 'feline' ? '고양이' : '강아지'} · {chartDetail.patient?.breed}
                </span>
              </div>
              <span className="text-xs text-slate-400">{chartDetail.chart_date}</span>
            </div>
            {/* 전체 구강 등급 */}
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
              {chartDetail.periodontitis_stage && (
                <span>치주: <strong>{PD_OVERALL_LABEL[chartDetail.periodontitis_stage] ?? chartDetail.periodontitis_stage}</strong></span>
              )}
              {chartDetail.calculus_overall && (
                <span>치석: <strong>{chartDetail.calculus_overall}</strong></span>
              )}
              {chartDetail.gingivitis_overall && (
                <span>치은염: <strong>{chartDetail.gingivitis_overall}</strong></span>
              )}
              {chartDetail.recheck_interval && (
                <span>재검: <strong>{{
                  '1month': '1개월 후', '3months': '3개월 후',
                  '6months': '6개월 후', '12months': '12개월 후', 'as_needed': '필요 시',
                }[chartDetail.recheck_interval] ?? chartDetail.recheck_interval}</strong></span>
              )}
            </div>
          </div>

          {/* ── 섹션 1: 이번 내원 처치 ── */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-100 bg-indigo-50 px-4 py-2">
              <span className="text-xs font-semibold text-indigo-700">① 이번 내원 처치</span>
            </div>
            <div className="divide-y divide-slate-50 px-4 py-3 space-y-4">

              {/* 전체 처치 */}
              {(chartDetail.procedure_scaling || chartDetail.procedure_polishing ||
                chartDetail.procedure_irrigation || chartDetail.procedure_fluoride ||
                chartDetail.procedure_other) && (
                <div>
                  <SectionTitle>전체 처치</SectionTitle>
                  <div className="flex flex-wrap gap-1.5">
                    {chartDetail.procedure_scaling && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">스케일링</span>
                    )}
                    {chartDetail.procedure_polishing && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">폴리싱</span>
                    )}
                    {chartDetail.procedure_irrigation && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">세정</span>
                    )}
                    {chartDetail.procedure_fluoride && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">불소도포</span>
                    )}
                    {chartDetail.procedure_other && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{chartDetail.procedure_other}</span>
                    )}
                  </div>
                </div>
              )}

              {/* 발치 */}
              <div>
                <SectionTitle>발치</SectionTitle>
                {extractedTeeth.length === 0 ? (
                  <EmptyNote text="발치 없음" />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {extractedTeeth.map(t => (
                      <ToothBadge
                        key={t.tooth_id}
                        id={t.tooth_id}
                        species={species}
                        className="border-pink-300 bg-pink-50 text-pink-700"
                        onClick={() => openTooth(t)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* 수복 / 신경치료 */}
              <div>
                <SectionTitle>수복 · 신경치료</SectionTitle>
                {restoredTeeth.length === 0 ? (
                  <EmptyNote text="해당 없음" />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {restoredTeeth.map(({ tooth, labels }) => (
                      <div key={tooth.tooth_id} className="flex items-start gap-1">
                        <ToothBadge
                          id={tooth.tooth_id}
                          species={species}
                          className="border-teal-300 bg-teal-50 text-teal-700"
                          onClick={() => openTooth(tooth)}
                          extracted={tooth.treatment_done?.some(c => EXTRACTION_CODES.includes(c.toUpperCase())) ?? false}
                        />
                        <div className="flex flex-col gap-0.5 pt-0.5">
                          {labels.map(l => (
                            <span key={l} className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-medium text-teal-700">
                              {l}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 기타 치료 */}
              {otherTreatedTeeth.length > 0 && (
                <div>
                  <SectionTitle>기타 치료</SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {otherTreatedTeeth.map(({ tooth, labels }) => (
                      <div key={tooth.tooth_id} className="flex items-start gap-1">
                        <ToothBadge
                          id={tooth.tooth_id}
                          species={species}
                          className="border-slate-300 bg-slate-50 text-slate-700"
                          onClick={() => openTooth(tooth)}
                          extracted={tooth.treatment_done?.some(c => EXTRACTION_CODES.includes(c.toUpperCase())) ?? false}
                        />
                        <div className="flex flex-col gap-0.5 pt-0.5">
                          {labels.map(l => (
                            <span key={l} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                              {l}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── 섹션 2: 관리 필요 치아 ── */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-100 bg-amber-50 px-4 py-2">
              <span className="text-xs font-semibold text-amber-700">② 관리 필요 치아</span>
            </div>
            <div className="px-4 py-3 space-y-4">

              {/* 치주 질환 */}
              <div>
                <SectionTitle>치주 질환 (PD2+)</SectionTitle>
                {perioTeeth.length === 0 ? (
                  <EmptyNote text="해당 없음" />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {perioTeeth.map(t => {
                      const stage = t.periodontal_stage!
                      const style = PERIO_LABEL[stage] ?? { label: stage, color: 'text-slate-600', bg: 'bg-slate-50' }
                      const wasExtracted = t.treatment_done?.some(c => EXTRACTION_CODES.includes(c.toUpperCase())) ?? false
                      return (
                        <div key={t.tooth_id} className="flex items-start gap-1">
                          <ToothBadge
                            id={t.tooth_id}
                            species={species}
                            className={cn('border-current', style.color, style.bg)}
                            onClick={() => openTooth(t)}
                            extracted={wasExtracted}
                          />
                          <span className={cn('mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold', style.bg, style.color)}>
                            {style.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* 치아 흡수 */}
              <div>
                <SectionTitle>치아 흡수 (TR2+)</SectionTitle>
                {resorptionTeeth.length === 0 ? (
                  <EmptyNote text="해당 없음" />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {resorptionTeeth.map(t => (
                      <div key={t.tooth_id} className="flex items-start gap-1">
                        <ToothBadge
                          id={t.tooth_id}
                          species={species}
                          className="border-purple-300 bg-purple-50 text-purple-700"
                          onClick={() => openTooth(t)}
                          extracted={t.treatment_done?.some(c => EXTRACTION_CODES.includes(c.toUpperCase())) ?? false}
                        />
                        <span className="mt-0.5 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">
                          {t.resorption_stage}{t.resorption_type ? ` ${t.resorption_type}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 파절 */}
              <div>
                <SectionTitle>파절</SectionTitle>
                {fractureTeeth.length === 0 ? (
                  <EmptyNote text="해당 없음" />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {fractureTeeth.map(t => (
                      <div key={t.tooth_id} className="flex items-start gap-1">
                        <ToothBadge
                          id={t.tooth_id}
                          species={species}
                          className="border-orange-300 bg-orange-50 text-orange-700"
                          onClick={() => openTooth(t)}
                          extracted={t.treatment_done?.some(c => EXTRACTION_CODES.includes(c.toUpperCase())) ?? false}
                        />
                        <span className="mt-0.5 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700">
                          {t.fracture}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 동요도 */}
              {mobilityTeeth.length > 0 && (
                <div>
                  <SectionTitle>동요도 (M1+)</SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {mobilityTeeth.map(t => (
                      <div key={t.tooth_id} className="flex items-start gap-1">
                        <ToothBadge
                          id={t.tooth_id}
                          species={species}
                          className="border-rose-300 bg-rose-50 text-rose-700"
                          onClick={() => openTooth(t)}
                          extracted={t.treatment_done?.some(c => EXTRACTION_CODES.includes(c.toUpperCase())) ?? false}
                        />
                        <span className="mt-0.5 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
                          {t.mobility}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 분기부 병변 */}
              {furcationTeeth.length > 0 && (
                <div>
                  <SectionTitle>분기부 병변 (F2+)</SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {furcationTeeth.map(t => (
                      <div key={t.tooth_id} className="flex items-start gap-1">
                        <ToothBadge
                          id={t.tooth_id}
                          species={species}
                          className="border-sky-300 bg-sky-50 text-sky-700"
                          onClick={() => openTooth(t)}
                          extracted={t.treatment_done?.some(c => EXTRACTION_CODES.includes(c.toUpperCase())) ?? false}
                        />
                        <span className="mt-0.5 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
                          {t.furcation}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 치근단 병소 */}
              {periapicalTeeth.length > 0 && (
                <div>
                  <SectionTitle>치근단 병소</SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {periapicalTeeth.map(t => (
                      <div key={t.tooth_id} className="flex items-start gap-1">
                        <ToothBadge
                          id={t.tooth_id}
                          species={species}
                          className="border-red-300 bg-red-50 text-red-700"
                          onClick={() => openTooth(t)}
                          extracted={t.treatment_done?.some(c => EXTRACTION_CODES.includes(c.toUpperCase())) ?? false}
                        />
                        <span className="mt-0.5 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                          {t.periapical}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </ScrollArea>
    </div>
    </>
  )
}
