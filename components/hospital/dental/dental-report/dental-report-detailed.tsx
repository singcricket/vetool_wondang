'use client'
import React, { useState } from 'react'
import type { DentalChartDetail, DentalTooth, DentalImage } from '@/types/dental/dental-type'
import { DENTAL_TOOTH_TESTS } from '@/constants/hospital/dental/dentalToothTests'
import { DENTAL_CHART_TESTS } from '@/constants/hospital/dental/dentalChartTests'
import ImageCard from './dental-image-card'
import DentalToothDetailView from './dental-tooth-detail-view'
import dynamic from 'next/dynamic'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { cn } from '@/lib/utils/utils'
import { Button } from '@/components/ui/button'

const DentalImageEditor = dynamic(() => import('../dental-image-editor'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center bg-slate-900 text-white">에디터 로딩 중...</div>
})

const DentalImageWithMark = dynamic(() => import('@/components/hospital/dental/dental-image-with-mark'), {
  ssr: false,
  loading: () => <div className="aspect-square bg-slate-100" />,
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

function filterByTag(images: DentalImage[], tag: string) {
  return images.filter(img => img.tooth_ids?.includes(tag))
}

function filterAndSort(images: DentalImage[], tag: string, order: string[]): DentalImage[] {
  const filtered = images.filter(img => img.tooth_ids?.includes(tag))
  const inOrder = order
    .map(id => filtered.find(img => img.dental_image_id === id))
    .filter((img): img is DentalImage => img !== undefined)
  const notInOrder = filtered.filter(img => !order.includes(img.dental_image_id))
  return [...inOrder, ...notInOrder]
}

export default function DentalReportDetailed({ chartDetail, teeth, images, species, isShared }: Props) {

  // 이미지 그룹 분류
  const generalImages    = filterByTag(images, 'general')
  const assessmentImages = filterAndSort(images, 'assessment', chartDetail.assessment_image_order ?? [])
  const treatmentImages  = filterAndSort(images, 'treatment', chartDetail.treatment_image_order ?? [])

  // 4분면 이미지 추출
  const img100 = images.find(img => img.tooth_ids?.includes('100'))
  const img200 = images.find(img => img.tooth_ids?.includes('200'))
  const img300 = images.find(img => img.tooth_ids?.includes('300'))
  const img400 = images.find(img => img.tooth_ids?.includes('400'))

  function QuadrantBox({ label, img, isShared }: { label: string, img?: DentalImage, isShared?: boolean }) {
    const [viewerOpen, setViewerOpen] = useState(false)
    return (
      <>
        <div 
          className={cn(
            "flex flex-col border border-slate-200 bg-white shadow-sm overflow-hidden rounded",
            img && "cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all"
          )}
          onClick={() => img && setViewerOpen(true)}
        >
          <div className="text-[10px] font-bold text-center bg-slate-100 py-1 border-b uppercase text-slate-600 tracking-wider">
            {label}
          </div>
          <div className="aspect-[4/3] bg-slate-50 flex items-center justify-center relative">
            {img ? (
              <DentalImageWithMark 
                imageUrl={img.img_url} 
                mark={img.mark} 
                noHover 
                aspectRatio="aspect-auto" 
                className="h-full w-full object-cover" 
              />
            ) : (
              <div className="flex flex-col items-center gap-1 opacity-20 py-8">
                <span className="text-[9px] font-medium text-slate-400 uppercase italic">No photo</span>
              </div>
            )}
          </div>
        </div>

        <Dialog open={viewerOpen} onOpenChange={setViewerOpen} modal={!isShared}>
          <DialogContent 
            className={cn(
              "p-0 m-0 border-0 flex flex-col items-center justify-center bg-slate-900/95 rounded-none z-[150]",
              isShared 
                ? "max-w-[90vw] w-[1200px] h-auto aspect-auto border border-slate-700 shadow-2xl rounded-xl z-[150]" 
                : "max-w-[100vw] w-screen h-screen max-h-[100vh] z-[200] outline-none"
            )}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
            onFocusOutside={(e) => e.preventDefault()}
          >
            <VisuallyHidden>
              <DialogTitle>{isShared ? '이미지 크게 보기' : '치과 이미지 에디터'}</DialogTitle>
              <DialogDescription>{isShared ? '상세 이미지를 확인합니다.' : '이미지 마킹을 확인하거나 수정할 수 있습니다.'}</DialogDescription>
            </VisuallyHidden>
            {viewerOpen && img && (
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

  // recheck 라벨 맵
  const recheckLabel: Record<string, string> = {
    '1month': '1개월 후', '3months': '3개월 후',
    '6months': '6개월 후', '12months': '12개월 후', 'as_needed': '필요시 재방문'
  }

  // 처치 항목 요약
  const procedureList = [
    chartDetail.procedure_scaling  && '스케일링',
    chartDetail.procedure_polishing && '연마',
    chartDetail.procedure_irrigation && '세정',
    chartDetail.procedure_fluoride  && '불소 도포',
    chartDetail.procedure_other     || null,
  ].filter(Boolean) as string[]

  const renderToothDetail = (tid: number) => {
    const tooth = teeth.find(t => Number(t.tooth_id) === tid) || {
      tooth_id: tid,
      chart_id: chartDetail.id,
      hos_id: chartDetail.hos_id,
    } as DentalTooth
    
    return (
      <div key={tid} className="border-l-4 border-teal-500 pl-4 py-2">
        <DentalToothDetailView 
          tooth={tooth} 
          images={images} 
          isShared={isShared} 
          species={species}
        />
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {/* ── 헤더 ── */}
      <div className="text-center border-b pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-widest text-slate-800">
          Detailed Dental Report
        </h1>
        <p className="text-slate-500 mt-2">
          Patient: <span className="font-semibold text-slate-700">{chartDetail.patient?.name}</span> | 
          Date: <span className="font-semibold text-slate-700">{chartDetail.chart_date}</span>
        </p>
      </div>

     

      {/* ── 차트 전반 정보 (dental_charts) ── */}
      <section className="space-y-6 border border-slate-200 rounded-xl p-6 bg-slate-50/50">
        <h2 className="text-base font-bold text-slate-700 border-b pb-2">전체 구강 검진 결과</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 좌: 구강 평가 수치 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">구강 평가</h3>
            <div className="space-y-3">
              {[
                { field: 'skull_type', label: '두개 유형' },
                { field: 'occlusion', label: '교합 상태' },
                { field: 'crowding', label: '과밀치열' },
                { field: 'gingivitis_overall', label: '치은염' },
                { field: 'calculus_overall', label: '치석' },
                { field: 'periodontitis_stage', label: '치주염 단계' },
                { field: 'oral_mucosa', label: '구강 점막' },
                { field: 'tongue_eval', label: '혀 평가' },
                { field: 'palate_eval', label: '구개 평가' },
                { field: 'tonsil_eval', label: '편도 평가' },
                { field: 'pharynx_eval', label: '인두 평가' },
                { field: 'salivary_eval', label: '타액선 평가' },
                { field: 'lymph_node_eval', label: '림프절 평가' },
              ].map(({ field, label }) => {
                const value = (chartDetail as any)[field]
                if (value === null || value === undefined || value === '') return null

                // DENTAL_CHART_TESTS에서 상세 설명 찾기
                const chartTest = DENTAL_CHART_TESTS[field]
                let detailText = value
                
                if (chartTest) {
                  // optComment가 있으면 우선 사용
                  const optComment = chartTest.optComment?.[value]
                  const optLabel = chartTest.options?.find(o => o.value === value)?.label
                  detailText = optComment || optLabel || value
                }

                return (
                  <div key={field} className="flex flex-col gap-1 text-sm">
                    <span className="text-slate-500 font-medium">{chartTest?.testNameKo || label}</span>
                    <span className="text-slate-800 leading-relaxed pl-2 border-l-2 border-slate-200">{detailText}</span>
                  </div>
                )
              })}

              {chartDetail.xray_taken && (
                <div className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-500 font-medium">방사선 소견</span>
                  <span className="text-slate-800 leading-relaxed pl-2 border-l-2 border-slate-200">
                    {chartDetail.xray_findings || '촬영됨'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 우: 처치 / 계획 / 메모 */}
          <div className="space-y-4">
            {procedureList.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">처치 내역</h3>
                <div className="flex flex-wrap gap-1.5">
                  {procedureList.map((p, i) => (
                    <span key={i} className="bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded-full font-medium">{p}</span>
                  ))}
                </div>
                {chartDetail.anesthesia && (
                  <p className="text-xs text-slate-500 mt-2">마취: {chartDetail.anesthesia_note || '진행됨'}</p>
                )}
              </div>
            )}

            {chartDetail.treatment_plan && (
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">치료 계획</h3>
                <p className="text-sm text-slate-700 leading-relaxed bg-white rounded p-3 border border-slate-200">{chartDetail.treatment_plan}</p>
              </div>
            )}

            {chartDetail.homecare_instruction && (
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">가정 관리 지침</h3>
                <p className="text-sm text-slate-700 leading-relaxed bg-white rounded p-3 border border-slate-200">{chartDetail.homecare_instruction}</p>
              </div>
            )}

            {chartDetail.recheck_interval && (
              <div className="text-sm">
                <span className="text-slate-500">재검진 권장: </span>
                <span className="font-semibold text-teal-700">{recheckLabel[chartDetail.recheck_interval] ?? chartDetail.recheck_interval}</span>
              </div>
            )}

            {chartDetail.general_note && (
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">종합 메모</h3>
                <p className="text-sm text-slate-700 leading-relaxed bg-white rounded p-3 border border-slate-200 whitespace-pre-wrap">{chartDetail.general_note}</p>
              </div>
            )}
          </div>
        </div>

        {/* 구강 전반 사진 (general 태그)
        {generalImages.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-slate-600 mb-3">구강 전반 사진</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {generalImages.map(img => <ImageCard key={img.dental_image_id} img={img} isShared={isShared} />)}
            </div>
          </div>
        )} */}
        {/* 4분할 사진 */}
        <div className="border-t pt-6 bg-slate-50/30 p-4 rounded-lg my-4">
          <h3 className="text-sm font-semibold text-slate-600 mb-4 text-center uppercase tracking-widest">
            Overall Quadrant Views
          </h3>
          <div className="max-w-[700px] mx-auto">
            <div className="grid grid-cols-2 gap-4">
              <QuadrantBox label="Rt Max" img={img100} isShared={isShared} />
              <QuadrantBox label="Lt Max" img={img200} isShared={isShared} />
              <QuadrantBox label="Rt Mand" img={img400} isShared={isShared} />
              <QuadrantBox label="Lt Mand" img={img300} isShared={isShared} />
            </div>
          </div>
        </div>
        {/* 치료 전 평가 사진 (assessment 태그) */}
        {assessmentImages.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-slate-600 mb-3">치료 전 평가 사진</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {assessmentImages.map(img => <ImageCard key={img.dental_image_id} img={img} isShared={isShared} />)}
            </div>
          </div>
        )}

        {/* 치료 후 사진 (treatment 태그) */}
        {treatmentImages.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-teal-700 mb-3">치료 후 사진</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {treatmentImages.map(img => <ImageCard key={img.dental_image_id} img={img} isShared={isShared} />)}
            </div>
          </div>
        )}
      </section>
 {/* ── 처치 요약 ── */}
      {(() => {
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
        if (!ext.length && !restored.length && !other.length && !procedureList.length &&
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
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
            <h2 className="border-b pb-2 text-base font-bold text-slate-700">처치 요약</h2>
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-indigo-600">① 이번 내원 처치</h3>
              {procedureList.length > 0 && (
                <div>
                  <p className="mb-1 text-[11px] text-slate-400">전체 처치</p>
                  <div className="flex flex-wrap gap-1.5">{procedureList.map((p, i) => <span key={i} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{p}</span>)}</div>
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
      {/* ── 주요 치료 소견 및 치아별 상세 소견 ── */}
      {(() => {
        const toothIds = new Set(teeth.filter(t => t.tooth_id).map(t => Number(t.tooth_id)))
        
        images.forEach(img => {
          img.tooth_ids?.forEach(tid => {
            if (/^(10[1-9]|110|20[1-9]|210|30[1-9]|31[0-1]|40[1-9]|41[0-1])$/.test(tid)) {
              toothIds.add(Number(tid))
            }
          })
        })

        const sortedTids = Array.from(toothIds).sort((a,b) => a - b)

        const majorTids = sortedTids.filter(tid => {
          const tooth = teeth.find(t => Number(t.tooth_id) === tid)
          return tooth && tooth.treatment_priority !== null && tooth.treatment_priority !== undefined
        })

        const normalTids = sortedTids.filter(tid => {
          const tooth = teeth.find(t => Number(t.tooth_id) === tid)
          return !tooth || tooth.treatment_priority === null || tooth.treatment_priority === undefined
        })

        return (
          <div className="space-y-12">
            {majorTids.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-teal-700 border-b border-teal-200 pb-2">
                  주요 치료 소견
                </h2>
                <div className="space-y-10">
                  {majorTids.map(tid => renderToothDetail(tid))}
                </div>
              </div>
            )}

            {normalTids.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">
                  치아별 상세 소견
                </h2>
                <div className="space-y-10">
                  {normalTids.map(tid => renderToothDetail(tid))}
                </div>
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
