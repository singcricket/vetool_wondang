'use client'
import React, { useState } from 'react'
import type { DentalChartDetail, DentalTooth, DentalImage } from '@/types/dental/dental-type'
import { DENTAL_TOOTH_TESTS } from '@/constants/hospital/dental/dentalToothTests'
import { DENTAL_CHART_TESTS } from '@/constants/hospital/dental/dentalChartTests'
import { toothNames, toothNames_kr } from '@/constants/hospital/dental/dental_chart_canine_combined'
import { getByAbbr } from '@/constants/hospital/dental/avdcAbbreviations'
import dynamic from 'next/dynamic'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { DialogTitle, DialogDescription } from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/utils'
import { DENTAL_CHART_COLORS, PRIORITY_LABELS } from '@/constants/hospital/dental/dental_svg_imgs/dental-svg-info'

const DentalImageWithMark = dynamic(() => import('../dental-image-with-mark'), { 
  ssr: false,
  loading: () => <div className="aspect-square bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">Loading...</div>
})

const DentalImageEditor = dynamic(() => import('../dental-image-editor'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center bg-slate-900 text-white">에디터 로딩 중...</div>
})

// SVG imports
import DogOpenteethSvg from '@/constants/hospital/dental/dental_svg_imgs/dog_openteeth'
import DogOpenmouthSvgA from '@/constants/hospital/dental/dental_svg_imgs/canine_openmouthA'
import DogSkullLeftSvg from '@/constants/hospital/dental/dental_svg_imgs/dog_skull_left'
import DogSkullRightSvg from '@/constants/hospital/dental/dental_svg_imgs/dog_skull_right'
import CatOpenteethSvg from '@/constants/hospital/dental/dental_svg_imgs/cat_openteeth'
import CatOpenmouthSvgA from '@/constants/hospital/dental/dental_svg_imgs/cat_openmouthA'
import CatSkullLeftSvg from '@/constants/hospital/dental/dental_svg_imgs/cat_skull_left'
import CatSkullRightSvg from '@/constants/hospital/dental/dental_svg_imgs/cat_skull_right'

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

// ─── CSS 생성 (뷰마다 고유 id를 사용해 격리) ──────────────────────────────
function buildCss(containerId: string, selectedToothId: string | null, teeth: DentalTooth[]): string {
  const toothRules = teeth.map(t => {
    const tid = String(t.tooth_id)
    const isSelected = tid === selectedToothId

    // 치료 발치 (EXT)
    const isTreatmentExt = t.treatment_done?.some(code =>
      ['EXT', 'X', 'XS', 'XSS'].includes(code.toUpperCase())
    )

    // 기발치/결손 (FE/ANO) — 최우선
    const status = t.status?.toUpperCase()
    const isPreExtracted = status === 'FE' || status === 'ANO' || status === 'EXTRACTED' || status === 'MISSING'

    // 치료 우선순위 (urgent, recommended, elective, monitor)
    const priority = t.treatment_priority?.toLowerCase()

    // 소견/치료 있음 (PRO, RAD 제외)
    const EXCLUDED_TREATMENTS = ['PRO', 'RAD']
    const hasFindings = [
      t.periodontal_stage, t.gingivitis, t.calculus, t.plaque, t.mobility,
      t.furcation, t.fracture, typeof t.pulp_exposure === 'string' ? t.pulp_exposure : null, t.caries, t.resorption_stage, t.resorption_type,
      t.staining, t.attrition, t.abrasion, t.periapical
    ].some(v => v && v !== 'none' && v !== 'normal') ||
    (t.treatment_done?.some(code => !EXCLUDED_TREATMENTS.includes(code.toUpperCase())) ?? false)

    let rule = ''

    // 우선순위: 선택 > FE/ANO > EXT > 우선순위(U/R/E/M) > 소견 있음
    if (isSelected) {
      // 선택된 치아: 최우선순위
      rule = `
        #${containerId} path[id="${tid}"],
        #${containerId} g[id="${tid}"] > path {
          stroke: ${DENTAL_CHART_COLORS.selected} !important;
          stroke-width: 3px !important;
          opacity: 1 !important;
          transform: scale(1.1); transform-box: fill-box; transform-origin: center; z-index: 10;
          ${isPreExtracted ? 'stroke-dasharray: 3, 2; opacity: 0.6 !important;' : ''}
        }
      `
    } else if (isPreExtracted) {
      // 기발치/결손: 반투명 + 점선 (형태는 보이게)
      rule = `
        #${containerId} path[id="${tid}"],
        #${containerId} g[id="${tid}"] > path {
          opacity: 0.3 !important;
          stroke: ${DENTAL_CHART_COLORS.preExtracted} !important;
          stroke-width: 1.5px !important;
          stroke-dasharray: 3, 2 !important;
        }
      `
    } else {
      let color = ''
      if (isTreatmentExt) color = DENTAL_CHART_COLORS.treatmentExt
      else if (priority === 'urgent') color = DENTAL_CHART_COLORS.urgent
      else if (priority === 'recommended') color = DENTAL_CHART_COLORS.recommended
      else if (priority === 'elective') color = DENTAL_CHART_COLORS.elective
      else if (priority === 'monitor') color = DENTAL_CHART_COLORS.monitor
      else if (hasFindings) color = DENTAL_CHART_COLORS.findings

      if (color) {
        rule = `
          #${containerId} path[id="${tid}"],
          #${containerId} g[id="${tid}"] > path {
            stroke: ${color} !important;
            stroke-width: 2px !important;
            opacity: 0.8 !important;
          }
        `
      }
    }

    return rule
  }).join('\n')

  return `
    #${containerId} path[id],
    #${containerId} g[id] {
      cursor: pointer;
      pointer-events: bounding-box;
      transition: all 0.15s ease;
      stroke: #94a3b8;
      stroke-width: 0.5px;
    }
    #${containerId} path[id]:hover,
    #${containerId} g[id]:hover > path {
      stroke: ${DENTAL_CHART_COLORS.selected} !important;
      stroke-width: 2px !important;
      opacity: 0.9;
    }
    ${toothRules}
  `
}

interface SvgPanelProps {
  containerId: string
  SvgComponent: React.ComponentType<{ style?: React.CSSProperties }>
  selectedToothId: string | null
  teeth: DentalTooth[]
  onToothClick: (id: string) => void
  label: string
  className?: string
  svgStyle?: React.CSSProperties
}

function SvgPanel({
  containerId,
  SvgComponent,
  selectedToothId,
  teeth,
  onToothClick,
  label,
  className = '',
  svgStyle,
}: SvgPanelProps) {
  const ref = React.useRef<HTMLDivElement>(null)

  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      let el = e.target as Element | null
      while (el && el !== ref.current) {
        const id = el.getAttribute('id')
        if (id && /^\d{3}$/.test(id)) {
          onToothClick(id)
          return
        }
        el = el.parentElement
      }
    },
    [onToothClick],
  )

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <p className="text-[10px] font-semibold text-slate-400 text-center tracking-wider uppercase">
        {label}
      </p>
      <div
        id={containerId}
        ref={ref}
        onClick={handleClick}
        className="w-full h-full flex items-center justify-center overflow-hidden"
      >
        <style>{buildCss(containerId, selectedToothId, teeth)}</style>
        <SvgComponent style={svgStyle ?? { width: '100%', height: 'auto' }} />
      </div>
    </div>
  )
}

function ImageCard({ img, caption, isShared }: { img: DentalImage; caption?: string; isShared?: boolean }) {
  const [viewerOpen, setViewerOpen] = useState(false)

  return (
    <>
      <div 
        className="rounded overflow-hidden bg-slate-50 shadow-sm border relative group cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
        onClick={() => setViewerOpen(true)}
      >
        <DentalImageWithMark 
          imageUrl={img.img_url} 
          mark={img.mark} 
          aspectRatio="aspect-square" 
        />
        <div className="p-1.5 bg-white border-t text-[11px] text-slate-600 font-medium">
          <div className="text-center truncate font-bold text-slate-500">
            {img.is_radio ? '방사선 촬영' : caption || '일반 사진'}
          </div>
        </div>
      </div>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen} modal={false}>
        <DialogContent 
           className={cn(
            "p-0 m-0 border-0 flex flex-col items-center justify-center bg-slate-900/95 rounded-none z-[200]",
            isShared 
              ? "max-w-[90vw] w-[1200px] h-auto aspect-auto border border-slate-700 shadow-2xl rounded-xl z-[150]" 
              : "outline-none max-w-[100vw] w-screen h-screen max-h-[100vh] z-[200]"
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

export default function DentalReportOwner({ chartDetail, teeth, images, species, isShared }: Props) {

  // 이미지 그룹 분류 (글로벌 태그 기준)
  const generalImages    = filterByTag(images, 'general')
  const assessmentImages = filterByTag(images, 'assessment')
  const treatmentImages  = filterByTag(images, 'treatment')

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
            "flex flex-col border border-amber-200 bg-white shadow-sm overflow-hidden rounded",
            img && "cursor-pointer hover:ring-2 hover:ring-amber-500 transition-all"
          )}
          onClick={() => img && setViewerOpen(true)}
        >
          <div className="text-[10px] font-bold text-center bg-amber-50 py-1 border-b border-amber-100 uppercase text-amber-700 tracking-wider">
            {label}
          </div>
          <div className="aspect-[4/3] bg-amber-50/30 flex items-center justify-center relative">
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
                <span className="text-[9px] font-medium text-amber-400 uppercase italic">No photo</span>
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

  // 처치 항목
  const procedureList = [
    chartDetail.procedure_scaling   && '스케일링',
    chartDetail.procedure_polishing && '연마',
    chartDetail.procedure_irrigation && '세정',
    chartDetail.procedure_fluoride  && '불소 도포',
    chartDetail.procedure_other     || null,
  ].filter(Boolean) as string[]

  const [selectedToothId, setSelectedToothId] = useState<string | null>(null)

  const OpenteethSvg = species === 'feline' ? CatOpenteethSvg : DogOpenteethSvg
  const OpenmouthSvg = species === 'feline' ? CatOpenmouthSvgA : DogOpenmouthSvgA
  const SkullLeftSvg = species === 'feline' ? CatSkullLeftSvg : DogSkullLeftSvg
  const SkullRightSvg = species === 'feline' ? CatSkullRightSvg : DogSkullRightSvg

  return (
    <div className="space-y-12">

      {/* ── 헤더 ── */}
      <div className="text-center border-b pb-4">
        <h1 className="text-2xl font-bold tracking-widest text-slate-800">
          치과 검진 리포트 (보호자용)
        </h1>
        <p className="text-slate-500 mt-2">
           반려동물 이름: <span className="font-semibold text-slate-700">{chartDetail.patient?.name}</span> | 
           검진 일자: <span className="font-semibold text-slate-700">{chartDetail.chart_date}</span>
        </p>
      </div>

      {/* ── 차트 전반 정보 (dental_charts) ── */}
      <section className="space-y-6 border border-amber-200 rounded-xl p-6 bg-amber-50/30">
        <h2 className="text-base font-bold text-amber-800 border-b border-amber-200 pb-2">
          전체 구강 검진 결과
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 좌: 전반 구강 평가 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-amber-700 mb-2">구강 상태 요약</h3>
            <div className="space-y-3">
              {[
                { field: 'skull_type', label: '두개 유형' },
                { field: 'occlusion', label: '교합 상태' },
                { field: 'crowding', label: '과밀 치열' },
                { field: 'gingivitis_overall', label: '치은염' },
                { field: 'calculus_overall', label: '치석 정도' },
                { field: 'periodontitis_stage', label: '치주염 단계' },
                { field: 'oral_mucosa', label: '구강 점막' },
                { field: 'tongue_eval', label: '혀 상태' },
                { field: 'palate_eval', label: '구개 상태' },
                { field: 'tonsil_eval', label: '편도 상태' },
                { field: 'pharynx_eval', label: '인두 상태' },
                { field: 'salivary_eval', label: '타액선' },
                { field: 'lymph_node_eval', label: '림프절' },
              ].map(({ field, label }) => {
                const value = (chartDetail as any)[field]
                if (!value || value === 'none' || value === 'normal' || value === 'PD0') return null

                // DENTAL_CHART_TESTS에서 보호자용 설명 찾기
                const chartTest = DENTAL_CHART_TESTS[field]
                let detailText = value
                
                if (chartTest) {
                  // generalComment가 있으면 우선 사용 (보호자용)
                  const generalComment = chartTest.generalComment?.[value]
                  const optLabel = chartTest.options?.find(o => o.value === value)?.label
                  detailText = generalComment || optLabel || value
                }

                return (
                  <div key={field} className="flex flex-col gap-1 text-sm">
                    <span className="text-amber-700 font-medium">{chartTest?.testNameKo || label}</span>
                    <span className="text-slate-800 leading-relaxed pl-2 border-l-2 border-amber-200">{detailText}</span>
                  </div>
                )
              })}

              {chartDetail.xray_taken && (
                <div className="flex flex-col gap-1 text-sm">
                  <span className="text-amber-700 font-medium">방사선 소견</span>
                  <span className="text-slate-800 leading-relaxed pl-2 border-l-2 border-amber-200">
                    {chartDetail.xray_findings || '방사선 촬영이 진행되었습니다.'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 우: 처치 / 계획 / 메모 */}
          <div className="space-y-4">
            {procedureList.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-amber-700 mb-2">진행된 처치</h3>
                <div className="flex flex-wrap gap-1.5">
                  {procedureList.map((p, i) => (
                    <span key={i} className="bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded-full font-medium">{p}</span>
                  ))}
                </div>
                {chartDetail.anesthesia && (
                  <p className="text-xs text-slate-500 mt-2">마취: {chartDetail.anesthesia_note || '전신마취 하에 진행되었습니다.'}</p>
                )}
              </div>
            )}

            {chartDetail.treatment_plan && (
              <div>
                <h3 className="text-sm font-semibold text-amber-700 mb-1">향후 치료 계획</h3>
                <p className="text-sm text-slate-700 leading-relaxed bg-white rounded p-3 border border-amber-100 whitespace-pre-wrap">{chartDetail.treatment_plan}</p>
              </div>
            )}

            {chartDetail.homecare_instruction && (
              <div>
                <h3 className="text-sm font-semibold text-amber-700 mb-1">가정 관리 방법</h3>
                <p className="text-sm text-slate-700 leading-relaxed bg-white rounded p-3 border border-amber-100 whitespace-pre-wrap">{chartDetail.homecare_instruction}</p>
              </div>
            )}

            {chartDetail.recheck_interval && (
              <div className="text-sm">
                <span className="text-slate-500">다음 검진 권장: </span>
                <span className="font-semibold text-amber-700">{recheckLabel[chartDetail.recheck_interval] ?? chartDetail.recheck_interval}</span>
              </div>
            )}

            {chartDetail.general_note && (
              <div>
                <h3 className="text-sm font-semibold text-amber-700 mb-1">수의사 메모</h3>
                <p className="text-sm text-slate-700 leading-relaxed bg-white rounded p-3 border border-amber-100 whitespace-pre-wrap">{chartDetail.general_note}</p>
              </div>
            )}
          </div>
        </div>

        {/* 구강 전반 사진 (general 태그)
        {generalImages.length > 0 && (
          <div className="border-t border-amber-200 pt-4">
            <h3 className="text-sm font-semibold text-amber-700 mb-3">구강 전반 사진</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {generalImages.map(img => <ImageCard key={img.dental_image_id} img={img} caption="전체 구강" isShared={isShared} />)}
            </div>
          </div>
        )} */}

        {/* 4분할 사진 */}
        <div className="border-t border-amber-200 pt-6 bg-amber-50/30 p-4 rounded-lg my-4">
          <h3 className="text-sm font-semibold text-amber-700 mb-4 text-center uppercase tracking-widest">
            구강 전반 사진
          </h3>
          <div className="w-full">
            <div className="grid grid-cols-2 gap-6">
              <QuadrantBox label="Rt Max" img={img100} isShared={isShared} />
              <QuadrantBox label="Lt Max" img={img200} isShared={isShared} />
              <QuadrantBox label="Rt Mand" img={img400} isShared={isShared} />
              <QuadrantBox label="Lt Mand" img={img300} isShared={isShared} />
            </div>
          </div>
        </div>

        {/* 치료 전/후 비교 사진 (assessment / treatment 글로벌 태그) */}
        {(assessmentImages.length > 0 || treatmentImages.length > 0) && (
          <div className="border-t border-amber-200 pt-4">
            <h3 className="text-sm font-semibold text-amber-700 mb-3">치료 전후 비교</h3>
            <div className="grid grid-cols-2 gap-4">
              {assessmentImages.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-center bg-slate-200 py-1 rounded text-slate-700 mb-2">치료 전</div>
                  <div className="space-y-2">
                    {assessmentImages.map(img => <ImageCard key={img.dental_image_id} img={img} isShared={isShared} />)}
                  </div>
                </div>
              )}
              {treatmentImages.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-center bg-teal-100 py-1 rounded text-teal-800 mb-2">치료 후</div>
                  <div className="space-y-2">
                    {treatmentImages.map(img => <ImageCard key={img.dental_image_id} img={img} isShared={isShared} />)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SVG 패널 영역 (추가됨) ── */}
        <div className="border-t border-amber-200 pt-6 mt-4">
          <h3 className="text-sm font-semibold text-amber-700 mb-4">구강 해부학 모식도</h3>
          <div className="flex flex-col items-center bg-white/40 p-4 rounded-xl border border-amber-100 shadow-inner overflow-auto">
            {/* 구강 전개도 */}
            <div className="mb-4 border rounded-xl bg-white/60 p-3 shadow-sm w-fit mx-auto">
              <SvgPanel
                containerId="svg-openmouth-report"
                SvgComponent={OpenmouthSvg}
                selectedToothId={selectedToothId}
                teeth={teeth}
                onToothClick={setSelectedToothId}
                label="구강 전개도"
                svgStyle={{ height: '550px', width: 'auto' }}
              />
            </div>

            {/* ── SVG 그림 영역: 왼쪽 치열 + 오른쪽 두개골 ── */}
            <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start justify-center w-full">
              {/* 왼쪽: 치열 정면 */}
              <div className="border rounded-xl bg-white/60 shadow-sm p-3 flex flex-col items-center w-fit shrink-0">
                <SvgPanel
                  containerId="svg-openteeth-report"
                  SvgComponent={OpenteethSvg}
                  selectedToothId={selectedToothId}
                  teeth={teeth}
                  onToothClick={setSelectedToothId}
                  label="치열 (정면)"
                  svgStyle={{ height: '500px', width: 'auto' }}
                />
              </div>

              {/* 오른쪽: 두개골 우측 + 좌측 (위 / 아래) */}
              <div className="flex flex-col gap-4 shrink-0">
                {/* 두개골 우측 */}
                <div className="border rounded-xl bg-white/60 shadow-sm p-2">
                  <SvgPanel
                    containerId="svg-skull-right-report"
                    SvgComponent={SkullRightSvg}
                    selectedToothId={selectedToothId}
                    teeth={teeth}
                    onToothClick={setSelectedToothId}
                    label="두개골 우측"
                    svgStyle={{ height: '250px', width: 'auto' }}
                  />
                </div>
                {/* 두개골 좌측 */}
                <div className="border rounded-xl bg-white/60 shadow-sm p-2">
                  <SvgPanel
                    containerId="svg-skull-left-report"
                    SvgComponent={SkullLeftSvg}
                    selectedToothId={selectedToothId}
                    teeth={teeth}
                    onToothClick={setSelectedToothId}
                    label="두개골 좌측"
                    svgStyle={{ height: '250px', width: 'auto' }}
                  />
                </div>
              </div>
            </div>

            {/* ── 범례 (Legend) ── */}
            <div className="mt-8 pt-4 border-t border-amber-100 w-full max-w-2xl">
              <p className="text-xs font-bold text-amber-800 mb-3 text-center uppercase tracking-widest">색상 및 기호 설명</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DENTAL_CHART_COLORS.urgent }}></div>
                  <span className="text-[11px] text-slate-600 font-medium">긴급 치료</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DENTAL_CHART_COLORS.recommended }}></div>
                  <span className="text-[11px] text-slate-600 font-medium">권장 치료</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DENTAL_CHART_COLORS.elective }}></div>
                  <span className="text-[11px] text-slate-600 font-medium">선택적 치료</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DENTAL_CHART_COLORS.monitor }}></div>
                  <span className="text-[11px] text-slate-600 font-medium">모니터링</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DENTAL_CHART_COLORS.treatmentExt }}></div>
                  <span className="text-[11px] text-slate-600 font-medium">치료적 발치</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DENTAL_CHART_COLORS.findings }}></div>
                  <span className="text-[11px] text-slate-600 font-medium">소견/이상 발견</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border border-slate-300 border-dashed" style={{ backgroundColor: 'transparent' }}></div>
                  <span className="text-[11px] text-slate-600 font-medium">기발치/선천결손</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-indigo-500" style={{ backgroundColor: 'transparent' }}></div>
                  <span className="text-[11px] text-slate-600 font-medium">선택된 치아</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 치아별 소견 ── */}
      <div className="space-y-10">
        {(() => {
          // 1. teeth 배열의 ID 수집
          const toothIds = new Set(teeth.filter(t => t.tooth_id).map(t => Number(t.tooth_id)))
          
          // 2. images 배열에서 상/하악 치아 번호(101~411) 수집
          images.forEach(img => {
            img.tooth_ids?.forEach(tid => {
              if (/^(10[1-9]|110|20[1-9]|210|30[1-9]|31[0-1]|40[1-9]|41[0-1])$/.test(tid)) {
                toothIds.add(Number(tid))
              }
            })
          })

          return Array.from(toothIds)
            .sort((a,b) => a - b)
            .map(tid => {
              const tooth = teeth.find(t => Number(t.tooth_id) === tid) || {
                tooth_id: tid,
                chart_id: chartDetail.id,
                hos_id: chartDetail.hos_id,
              } as DentalTooth

            // 이 치아에 번호로만 태그된 이미지 (글로벌 태그 및 비교 태그 제외)
            const toothImages = images.filter(img =>
              img.tooth_ids?.includes(String(tooth.tooth_id)) &&
              !img.tooth_ids.includes('general') &&
              !img.tooth_ids.includes('assessment') &&
              !img.tooth_ids.includes('treatment') &&
              !img.tooth_ids.includes('tooth-assessment') &&
              !img.tooth_ids.includes('tooth-treatment')
            )
            // 이 치아 번호 + assessment / treatment 함께 달린 이미지
            const toothAssessment = images.filter(img =>
              img.tooth_ids?.includes(String(tooth.tooth_id)) && 
              (img.tooth_ids?.includes('assessment') || img.tooth_ids?.includes('tooth-assessment') || img.tooth_ids?.includes('tooth-assesment'))
            )
            const toothTreatment = images.filter(img =>
              img.tooth_ids?.includes(String(tooth.tooth_id)) && 
              (img.tooth_ids?.includes('treatment') || img.tooth_ids?.includes('tooth-treatment'))
            )
            const allToothImages = [...toothImages, ...toothAssessment, ...toothTreatment]

            // 병소 소견 추출 (보호자용: generalComment 위주)
            const findings: { label: string, detail: string }[] = []

            // 6포인트 측정 데이터 계산 및 요약 (소견 루프 이전에 먼저 수행)
            const probingValues = [tooth.probing_ml, tooth.probing_l, tooth.probing_dl, tooth.probing_mb, tooth.probing_b, tooth.probing_db]
              .filter((v): v is number => v !== null && v !== undefined)
            const maxProbing = probingValues.length > 0 ? Math.max(...probingValues) : 0

            const grRank: Record<string, number> = { 'none': 0, 'GR1': 1, 'GR2': 2, 'GR3': 3 }
            const recessionRanks = [
              tooth.recession_ml, tooth.recession_l, tooth.recession_dl, 
              tooth.recession_mb, tooth.recession_b, tooth.recession_db
            ].map(v => grRank[v || 'none'] || 0)
            const maxGrRank = Math.max(...recessionRanks)

            const toothFields = [
              'status', 'periodontal_stage', 'gingivitis', 'calculus', 'mobility', 'furcation',
              'fracture', 'pulp_exposure', 'caries', 'resorption_stage', 'resorption_type', 'staining', 'attrition', 'abrasion', 'periapical'
            ]

            toothFields.forEach(field => {
              // 치주낭 측정값(probing_depth)이 있으면 periodontal_stage는 중복이므로 제외
              if (field === 'periodontal_stage' && maxProbing > 0) return

              const val = (tooth as any)[field]
              if (val && val !== 'none' && val !== 'normal' && val !== 'present' && val !== 'PD0') {
                const testKey = field === 'status' ? 'tooth_status' : field === 'fracture' ? 'tooth_fracture' : field
                const testDef = DENTAL_TOOTH_TESTS[testKey]
                if (testDef) {
                  const comment = (testDef.generalComment as any)?.[val]
                  if (comment) {
                    findings.push({
                      label: testDef.testNameKo || field,
                      detail: comment
                    })
                  }
                }
              }
            })

            // 치료 계획 (treatment_plan)
            if (tooth.treatment_plan && Array.isArray(tooth.treatment_plan)) {
              tooth.treatment_plan.forEach(code => {
                const abbrev = getByAbbr(code)
                const namePart = abbrev?.definition_kr || abbrev?.definition || code
                const detailText = abbrev?.generalComment
                  ? `${namePart} — ${abbrev.generalComment}`
                  : namePart
                findings.push({
                  label: '계획 내역',
                  detail: detailText
                })
              })
            }
            // 치료 개입 (treatment_done)
            if (tooth.treatment_done && Array.isArray(tooth.treatment_done)) {
              tooth.treatment_done.forEach(code => {
                const abbrev = getByAbbr(code)
                const namePart = abbrev?.definition_kr || abbrev?.definition || code
                const detailText = abbrev?.generalComment
                  ? `${namePart} — ${abbrev.generalComment}`
                  : namePart
                findings.push({
                  label: '치료 내역',
                  detail: detailText
                })
              })
            }

          


            let probingAutoInfo: { points: any[], comment: string } | null = null
            if (maxProbing > 0) {
              const testDef = DENTAL_TOOTH_TESTS.probing_depth
              if (testDef && testDef.rangeComments) {
                const thresholds = species === 'feline' ? testDef.thresholds_feline : testDef.thresholds_canine
                let rangeKey = 'normal'
                if (maxProbing > (thresholds?.[2] || 0)) rangeKey = 'PD4'
                else if (maxProbing > (thresholds?.[1] || 0)) rangeKey = 'PD3'
                else if (maxProbing > (thresholds?.[0] || 0)) rangeKey = 'PD2'
                
                probingAutoInfo = {
                  comment: testDef.rangeComments[rangeKey]?.generalComment || '',
                  points: [
                    { label: 'ML', val: tooth.probing_ml },
                    { label: 'L', val: tooth.probing_l },
                    { label: 'DL', val: tooth.probing_dl },
                    { label: 'MB', val: tooth.probing_mb },
                    { label: 'B', val: tooth.probing_b },
                    { label: 'DB', val: tooth.probing_db },
                  ].filter(p => p.val !== null && p.val !== undefined && p.val !== 0)
                }
              }
            }

            let recessionAutoInfo: { points: any[], comment: string } | null = null
            if (maxGrRank > 0) {
              const testDef = DENTAL_TOOTH_TESTS.gingival_recession
              if (testDef && testDef.generalComment) {
                const rangeKey = maxGrRank === 3 ? 'GR3' : maxGrRank === 2 ? 'GR2' : 'GR1'
                recessionAutoInfo = {
                  comment: (testDef.generalComment as any)?.[rangeKey] || '',
                  points: [
                    { label: 'ML', val: tooth.recession_ml },
                    { label: 'L', val: tooth.recession_l },
                    { label: 'DL', val: tooth.recession_dl },
                    { label: 'MB', val: tooth.recession_mb },
                    { label: 'B', val: tooth.recession_b },
                    { label: 'DB', val: tooth.recession_db },
                  ].filter(p => p.val !== null && p.val !== undefined && p.val !== '' && p.val !== '0' && p.val !== 'none')
                }
              }
            }

            // 패스 조건: 사진도 없고 소견도 없으며 6포인트 데이터도 없으면 렌더링 안 함
            if (findings.length === 0 && allToothImages.length === 0 && !probingAutoInfo && !recessionAutoInfo) return null

            return (
              <div key={tooth.tooth_id} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-amber-50/70 border-b border-amber-100 px-4 py-3">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-base shrink-0">
                        {tooth.tooth_id}
                      </span>
                      <span className="text-slate-700 font-medium">
                        {toothNames_kr[String(tooth.tooth_id)]}
                      </span>
                    </div>

                    {/* 모식도 */}
                    <div className="w-32 h-32 bg-white rounded-lg border border-amber-200 flex items-center justify-center overflow-hidden p-2 shadow-sm ml-2">
                      <img 
                        src={`/dental/each/${species === 'feline' ? 'cat' : 'dog'}-${tid}.png`}
                        alt={`Tooth ${tid}`}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>

                    {tooth.treatment_priority && (
                      <span 
                        className="text-[10px] px-2 py-0.5 rounded-full text-white font-bold"
                        style={{ 
                          backgroundColor: 
                            DENTAL_CHART_COLORS[tooth.treatment_priority.toLowerCase() as keyof typeof DENTAL_CHART_COLORS] || DENTAL_CHART_COLORS.preExtracted
                        }}
                      >
                        {PRIORITY_LABELS[tooth.treatment_priority.toLowerCase()] || tooth.treatment_priority}
                      </span>
                    )}
                  </h3>
                </div>

                <div className="flex flex-col md:flex-row p-4 gap-6">
                  {/* 왼쪽: 설명 */}
                  <div className="flex-1 space-y-5">
                    {(() => {
                      const clinicalFindings = findings.filter(f => f.label !== '치료 내역' && f.label !== '계획 내역')
                      const treatmentFindings = findings.filter(f => f.label === '치료 내역')
                      const planFindings = findings.filter(f => f.label === '계획 내역')
                      return (
                        <>
                          <div className="space-y-2">
                            <h4 className="text-sm font-bold text-amber-600">수의사 소견</h4>
                            {clinicalFindings.length > 0 || probingAutoInfo || recessionAutoInfo ? (
                              <div className="space-y-2">
                                {clinicalFindings.map((f, i) => (
                                  <div key={i} className="bg-slate-50 p-3 rounded text-sm text-slate-700 leading-relaxed border border-slate-100 border-l-2 border-l-amber-300">
                                    {f.detail}
                                  </div>
                                ))}

                                {/* 6포인트 자동 소견 (보호자용) */}
                                {probingAutoInfo && (
                                  <div className="bg-amber-50/50 p-3 rounded border border-amber-100 border-l-2 border-l-amber-400">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-xs font-bold text-amber-800">[치주낭 깊이]</span>
                                      <div className="flex gap-2">
                                        {probingAutoInfo.points.map(p => (
                                          <span key={p.label} className="text-[10px] text-slate-500">
                                            {p.label}:<span className="font-bold text-slate-700">{p.val}</span>
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed italic">
                                      💡 {probingAutoInfo.comment}
                                    </p>
                                  </div>
                                )}

                                {recessionAutoInfo && (
                                  <div className="bg-amber-50/50 p-3 rounded border border-amber-100 border-l-2 border-l-amber-400">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-xs font-bold text-amber-800">[치은 퇴축]</span>
                                      <div className="flex gap-2">
                                        {recessionAutoInfo.points.map(p => (
                                          <span key={p.label} className="text-[10px] text-slate-500">
                                            {p.label}:<span className="font-bold text-slate-700">{p.val}</span>
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed italic">
                                      💡 {recessionAutoInfo.comment}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-400">특이 사항이 발견되지 않았습니다.</p>
                            )}
                          </div>

                          {planFindings.length > 0 && (
                            <div className="space-y-2 border-t pt-4">
                              <h4 className="text-sm font-bold text-indigo-700">예정된 치료</h4>
                              <div className="space-y-2">
                                {planFindings.map((f, i) => (
                                  <div key={i} className="bg-indigo-50 p-3 rounded text-sm text-indigo-900 leading-relaxed border border-indigo-100 border-l-2 border-l-indigo-400">
                                    {f.detail}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {treatmentFindings.length > 0 && (
                            <div className="space-y-2 border-t pt-4">
                              <h4 className="text-sm font-bold text-teal-700">진행된 치료</h4>
                              <div className="space-y-2">
                                {treatmentFindings.map((f, i) => (
                                  <li key={i} className="list-none bg-teal-50 p-3 rounded text-sm text-teal-900 leading-relaxed border border-teal-100 border-l-2 border-l-teal-400">
                                    {f.detail}
                                  </li>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>

                  {/* 오른쪽: 이미지 */}
                  {allToothImages.length > 0 && (
                    <div className="flex-1 border-l pl-4 border-slate-100">
                      <div className="flex flex-col gap-4">
                        {/* 치아별 전후 비교 */}
                        {(toothAssessment.length > 0 || toothTreatment.length > 0) && (
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-2">
                              <div className="text-xs font-bold text-center bg-slate-200 py-1 rounded text-slate-700">치료 전</div>
                              {toothAssessment.map(img => (
                                <ImageCard key={img.dental_image_id} img={img} isShared={isShared} />
                              ))}
                            </div>
                            <div className="flex flex-col gap-2">
                              <div className="text-xs font-bold text-center bg-teal-100 py-1 rounded text-teal-800">치료 후</div>
                              {toothTreatment.map(img => (
                                <ImageCard key={img.dental_image_id} img={img} isShared={isShared} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 기타 이미지 (치아 번호만 태그) */}
                        {toothImages.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t">
                            {toothImages.map(img => (
                              <ImageCard key={img.dental_image_id} img={img} isShared={isShared} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                </div>
              </div>
            )
          })
        })()}
      </div>
    </div>
  )
}
