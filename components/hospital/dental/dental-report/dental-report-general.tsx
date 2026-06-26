'use client'
import React, { useState } from 'react'
import type { DentalChartDetail, DentalTooth, DentalImage } from '@/types/dental/dental-type'
import { DENTAL_CHART_TESTS } from '@/constants/hospital/dental/dentalChartTests'
import { Badge } from '@/components/ui/badge'
import { getByAbbr } from '@/constants/hospital/dental/avdcAbbreviations'
import dynamic from 'next/dynamic'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { DialogTitle, DialogDescription } from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/utils'

const DentalImageWithMark = dynamic(() => import('../dental-image-with-mark'), { 
  ssr: false,
  loading: () => <div className="aspect-square bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">Loading...</div>
})

const DentalImageEditor = dynamic(() => import('../dental-image-editor'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center bg-slate-900 text-white">에디터 로딩 중...</div>
})

const SUMMARY_EXT_CODES = ['X', 'XS', 'XSS', 'EXT']
const SUMMARY_RESTORE_CODES: Record<string, string> = {
  'R/C': '레진', 'R/I': 'GI 수복', 'RCT': '근관치료', 'VPT': '생활치수처치',
  'ODY': '치아성형', 'CR/A': '치관절단', 'GBR': '골유도재생',
  'GTR': '조직유도재생', 'GV': '치은성형', 'OA': '교정장치',
}
const SUMMARY_OTHER_CODES: Record<string, string> = {
  'PRO': '스케일링/연마', 'RP/C': '치근활택(비외과)', 'RP/O': '치근활택(외과)',
  'GC': '치은소파', 'PCI': '간접치수복조', 'AP/X': '치근단절제',
  'DTC/R': '낭종적출', 'ALV': '치조골성형', 'OC': '교합조정',
  'GF/B': '골이식', 'GF/CT': '결합조직이식', 'B/I': '절개생검',
  'B/E': '절제생검', 'RAD': '방사선촬영',
}
const SUMMARY_SKIP = new Set([...SUMMARY_EXT_CODES, ...Object.keys(SUMMARY_RESTORE_CODES)])

type Props = {
  chartDetail: DentalChartDetail
  teeth: DentalTooth[]
  images: DentalImage[]
  species: string
  isShared?: boolean
}

function ImageCard({ img, isShared }: { img: DentalImage; isShared?: boolean }) {
  const [viewerOpen, setViewerOpen] = useState(false)

  return (
    <>
      <div 
        className="border rounded bg-white p-1 shadow-sm group relative cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
        onClick={() => setViewerOpen(true)}
      >
        <DentalImageWithMark 
          imageUrl={img.img_url} 
          mark={img.mark} 
          aspectRatio="aspect-square" 
        />
        {img.is_radio && (
          <span className="absolute top-2 left-2 text-[9px] bg-yellow-400 text-yellow-950 px-1 rounded font-bold pointer-events-none">X-Ray</span>
        )}
      </div>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen} modal={!isShared}>
        <DialogContent 
           className={cn(
            "p-0 m-0 border-0 flex flex-col items-center justify-center bg-slate-900/95 rounded-none z-[150]",
            isShared 
              ? "max-w-[90vw] w-[1200px] h-auto aspect-auto border border-slate-700 shadow-2xl rounded-xl" 
              : "max-w-[100vw] w-screen h-screen max-h-[100vh] z-[200]"
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <VisuallyHidden>
            <DialogTitle>{isShared ? '이미지 크게 보기' : '치과 이미지 에디터'}</DialogTitle>
            <DialogDescription>{isShared ? '상세 이미지를 확인합니다.' : '이미지 마킹을 확인하거나 수정할 수 있습니다.'}</DialogDescription>
          </VisuallyHidden>
          
          {viewerOpen && (
             isShared ? (
                <div className="relative w-full h-full p-4 flex items-center justify-center">
                  <DentalImageWithMark 
                    imageUrl={img.img_url} 
                    mark={img.mark} 
                    aspectRatio="aspect-auto" 
                    className="max-h-[80vh] w-full"
                    noHover={true}
                  />
                  <Button 
                    variant="ghost" 
                    className="absolute top-4 right-4 text-white hover:bg-white/10" 
                    onClick={() => setViewerOpen(false)}
                  >
                    닫기
                  </Button>
                </div>
             ) : (
                <DentalImageEditor 
                  imageId={img.dental_image_id} 
                  imageUrl={img.img_url} 
                  initialMark={img.mark} 
                  onClose={() => setViewerOpen(false)}
                />
             )
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function DentalReportGeneral({ chartDetail, teeth, images, species, isShared }: Props) {
  
  // 환자 정보 및 병기 요약
  return (
    <div className="space-y-8">
      <div className="text-center border-b pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-widest text-slate-800">
          Dental Chart (General)
        </h1>
        <p className="text-slate-500 mt-2">
          Patient: <span className="font-semibold text-slate-700">{chartDetail.patient?.name}</span> | 
          Date: <span className="font-semibold text-slate-700">{chartDetail.chart_date}</span>
        </p>
      </div>

     

      {/* 전체 구강 평가 요약 */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
          <span className="w-2 h-6 bg-indigo-500 rounded-sm mr-2 block"></span>
          Overall Oral Assessment
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
             { key: 'periodontitis_stage', label: 'Overall Stage' },
             { key: 'calculus_overall', label: 'Calculus' },
             { key: 'gingivitis_overall', label: 'Gingivitis' },
             { key: 'occlusion', label: 'Occlusion' },
          ].map(({ key, label }) => {
            const val = (chartDetail as any)[key]
            if (!val || val === 'none' || val === 'normal') return null
            const testDef = DENTAL_CHART_TESTS[key]
            const optDef = testDef?.options?.find(o => o.value === val)
            if (!optDef) return null
            
            return (
              <div key={key} className="bg-slate-50 border rounded p-3">
                <div className="text-xs text-slate-500 font-medium">{label}</div>
                <div className="font-semibold text-sm text-slate-800 mt-1">{optDef.label}</div>
              </div>
            )
          })}
        </div>
      </section>
 {/* ── 처치 요약 ── */}
      {(() => {
        const procList = [
          chartDetail.procedure_scaling  && '스케일링',
          chartDetail.procedure_polishing && '연마',
          chartDetail.procedure_irrigation && '세정',
          chartDetail.procedure_fluoride  && '불소 도포',
          chartDetail.procedure_other     || null,
        ].filter(Boolean) as string[]
        const ext = teeth.filter(t => t.treatment_done?.some(c => SUMMARY_EXT_CODES.includes(c.toUpperCase())))
        const restored = teeth.map(t => ({
          t, ls: (t.treatment_done ?? []).filter(c => c in SUMMARY_RESTORE_CODES).map(c => SUMMARY_RESTORE_CODES[c]),
        })).filter(x => x.ls.length > 0)
        const other = teeth.map(t => ({
          t, ls: (t.treatment_done ?? []).filter(c => !SUMMARY_SKIP.has(c.toUpperCase()) && !SUMMARY_SKIP.has(c)).map(c => SUMMARY_OTHER_CODES[c] ?? c),
        })).filter(x => x.ls.length > 0)
        const perio = teeth.filter(t => t.periodontal_stage && ['PD2', 'PD3', 'PD4'].includes(t.periodontal_stage))
        const resorb = teeth.filter(t => t.resorption_stage && ['TR2', 'TR3', 'TR4', 'TR5'].includes(t.resorption_stage))
        const fract = teeth.filter(t => t.fracture && t.fracture !== 'none')
        const mob = teeth.filter(t => t.mobility && ['M1', 'M2', 'M3'].includes(t.mobility))
        const furc = teeth.filter(t => t.furcation && ['F2', 'F3'].includes(t.furcation))
        const peri = teeth.filter(t => t.periapical && t.periapical !== 'none')
        const wasExt = (t: DentalTooth) => t.treatment_done?.some(c => SUMMARY_EXT_CODES.includes(c.toUpperCase())) ?? false
        if (!ext.length && !restored.length && !other.length && !procList.length &&
            !perio.length && !resorb.length && !fract.length && !mob.length && !furc.length && !peri.length) return null

        const PERIO_CLS: Record<string, string> = {
          PD2: 'border-yellow-300 bg-yellow-50 text-yellow-700',
          PD3: 'border-orange-300 bg-orange-50 text-orange-700',
          PD4: 'border-red-300 bg-red-50 text-red-700',
        }
        const PERIO_LBL: Record<string, string> = {
          PD2: 'PD2 초기치주염', PD3: 'PD3 중등도치주염', PD4: 'PD4 진행성치주염',
        }
        const Chip = ({ tooth, cls }: { tooth: DentalTooth; cls: string }) => (
          <span className={`inline-flex flex-col items-center gap-0.5 rounded-lg border px-2 py-1 ${cls}`}>
            <span className="text-sm font-bold leading-none">{tooth.tooth_id}</span>
            {wasExt(tooth) && <span className="mt-0.5 rounded bg-pink-500 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">발치</span>}
          </span>
        )
        return (
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="flex items-center border-b pb-2 text-base font-semibold text-slate-800">
              <span className="mr-2 block h-6 w-2 rounded-sm bg-teal-500"></span>
              처치 요약
            </h2>
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-indigo-600">① 이번 내원 처치</h3>
              {procList.length > 0 && (
                <div>
                  <p className="mb-1 text-[11px] text-slate-400">전체 처치</p>
                  <div className="flex flex-wrap gap-1.5">{procList.map((p, i) => <span key={i} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{p}</span>)}</div>
                </div>
              )}
              {ext.length > 0 && (
                <div>
                  <p className="mb-1 text-[11px] text-slate-400">발치</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ext.map(t => (
                      <span key={t.tooth_id} className="inline-flex flex-col items-center gap-0.5 rounded-lg border border-pink-300 bg-pink-50 px-2 py-1 text-pink-700">
                        <span className="text-sm font-bold leading-none">{t.tooth_id}</span>
                        <span className="mt-0.5 rounded bg-pink-500 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">발치</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {restored.length > 0 && (
                <div>
                  <p className="mb-1 text-[11px] text-slate-400">수복 · 신경치료</p>
                  <div className="flex flex-wrap gap-2">
                    {restored.map(({ t, ls }) => (
                      <div key={t.tooth_id} className="flex items-start gap-1">
                        <Chip tooth={t} cls="border-teal-300 bg-teal-50 text-teal-700" />
                        <div className="flex flex-col gap-0.5 pt-0.5">{ls.map(l => <span key={l} className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-medium text-teal-700">{l}</span>)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {other.length > 0 && (
                <div>
                  <p className="mb-1 text-[11px] text-slate-400">기타 치료</p>
                  <div className="flex flex-wrap gap-2">
                    {other.map(({ t, ls }) => (
                      <div key={t.tooth_id} className="flex items-start gap-1">
                        <Chip tooth={t} cls="border-slate-300 bg-slate-50 text-slate-700" />
                        <div className="flex flex-col gap-0.5 pt-0.5">{ls.map(l => <span key={l} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">{l}</span>)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {!!(perio.length || resorb.length || fract.length || mob.length || furc.length || peri.length) && (
              <div className="space-y-3 border-t pt-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-600">② 관리 필요 치아</h3>
                {perio.length > 0 && (
                  <div>
                    <p className="mb-1 text-[11px] text-slate-400">치주 질환</p>
                    <div className="flex flex-wrap gap-2">
                      {perio.map(t => (
                        <div key={t.tooth_id} className="flex items-start gap-1">
                          <Chip tooth={t} cls={PERIO_CLS[t.periodontal_stage!] ?? 'border-slate-300 bg-slate-50 text-slate-700'} />
                          <span className={`mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold ${PERIO_CLS[t.periodontal_stage!] ?? 'bg-slate-100 text-slate-700'}`}>{PERIO_LBL[t.periodontal_stage!] ?? t.periodontal_stage}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {resorb.length > 0 && (
                  <div>
                    <p className="mb-1 text-[11px] text-slate-400">치아 흡수</p>
                    <div className="flex flex-wrap gap-2">
                      {resorb.map(t => (
                        <div key={t.tooth_id} className="flex items-start gap-1">
                          <Chip tooth={t} cls="border-purple-300 bg-purple-50 text-purple-700" />
                          <span className="mt-0.5 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">{t.resorption_stage}{t.resorption_type ? ` ${t.resorption_type}` : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {fract.length > 0 && (
                  <div>
                    <p className="mb-1 text-[11px] text-slate-400">파절</p>
                    <div className="flex flex-wrap gap-2">
                      {fract.map(t => (
                        <div key={t.tooth_id} className="flex items-start gap-1">
                          <Chip tooth={t} cls="border-orange-300 bg-orange-50 text-orange-700" />
                          <span className="mt-0.5 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700">{t.fracture}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {mob.length > 0 && (
                  <div>
                    <p className="mb-1 text-[11px] text-slate-400">동요도</p>
                    <div className="flex flex-wrap gap-2">
                      {mob.map(t => (
                        <div key={t.tooth_id} className="flex items-start gap-1">
                          <Chip tooth={t} cls="border-rose-300 bg-rose-50 text-rose-700" />
                          <span className="mt-0.5 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">{t.mobility}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {furc.length > 0 && (
                  <div>
                    <p className="mb-1 text-[11px] text-slate-400">분기부 병변</p>
                    <div className="flex flex-wrap gap-2">
                      {furc.map(t => (
                        <div key={t.tooth_id} className="flex items-start gap-1">
                          <Chip tooth={t} cls="border-sky-300 bg-sky-50 text-sky-700" />
                          <span className="mt-0.5 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">{t.furcation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {peri.length > 0 && (
                  <div>
                    <p className="mb-1 text-[11px] text-slate-400">치근단 병소</p>
                    <div className="flex flex-wrap gap-2">
                      {peri.map(t => (
                        <div key={t.tooth_id} className="flex items-start gap-1">
                          <Chip tooth={t} cls="border-red-300 bg-red-50 text-red-700" />
                          <span className="mt-0.5 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">{t.periapical}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )
      })()}
      {/* 치아별 이상 소견 (약어 위주) */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
          <span className="w-2 h-6 bg-teal-500 rounded-sm mr-2 block"></span>
          Individual Tooth Findings
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse border border-slate-200">
            <thead className="bg-slate-100/50">
              <tr>
                <th className="border p-2 w-20 font-semibold align-middle text-center">Tooth</th>
                <th className="border p-2 font-semibold align-middle">Findings (Abbreviations)</th>
              </tr>
            </thead>
            <tbody>
              {teeth
                .filter(t => t.tooth_id)
                .sort((a,b) => a.tooth_id - b.tooth_id)
                .map(tooth => {
                
                const findings: string[] = []
                
                // tooth.status 에 따라 (예: ANO, FE)
                if (tooth.status && tooth.status !== 'present') {
                  findings.push(tooth.status)
                }

                // 치주/병변 검사항목 추출
                const toothFields = [
                  'periodontal_stage', 'gingivitis', 'calculus', 'mobility', 'furcation',
                  'fracture', 'pulp_exposure', 'caries', 'resorption_stage', 'resorption_type', 'staining', 'attrition', 'abrasion', 'periapical'
                ]

                toothFields.forEach(field => {
                  const val = (tooth as any)[field]
                  if (val && val !== 'none' && val !== 'normal' && val !== 'PD0') {
                    findings.push(String(val).toUpperCase())
                  }
                })
                
                // 치료 내역 (treatment_done)
                if (tooth.treatment_done && Array.isArray(tooth.treatment_done)) {
                  tooth.treatment_done.forEach(code => {
                    findings.push(code)
                  })
                }

                // 추출된 소견이 없으면 표시 패스 
                if (findings.length === 0) return null

                return (
                  <tr key={tooth.tooth_id} className="hover:bg-slate-50">
                    <td className="border p-2 text-center font-bold">
                      {tooth.tooth_id}
                    </td>
                    <td className="border p-2 flex flex-wrap gap-1.5">
                      {findings.map((f, i) => (
                        <Badge key={i} variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50/50 font-mono">
                          {f}
                        </Badge>
                      ))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 이미지 갤러리 */}
      {images.length > 0 && (
        <section className="pt-4 border-t">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <span className="w-2 h-6 bg-blue-500 rounded-sm mr-2 block"></span>
            Dental Images
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map(img => (
              <ImageCard key={img.dental_image_id} img={img} isShared={isShared} />
            ))}
          </div>
        </section>
      )}
      
    </div>
  )
}
