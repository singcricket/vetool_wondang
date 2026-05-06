'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { DentalTooth, DentalChartDetail, DentalImage } from '@/types/dental/dental-type'
import { getDentalImages } from '@/lib/actions/dental/get-dental-images'
import { fetchPatientDentalHistory } from '@/lib/services/dental/fetch-dental'
import { fetchDentalChartTeeth } from '@/lib/services/dental/fetch-dental-chart'
import DentalToothDetailView from '@/components/hospital/dental/dental-report/dental-tooth-detail-view'

// SVG imports
import DogOpenteethSvg from '@/constants/hospital/dental/dental_svg_imgs/dog_openteeth'
import DogOpenmouthSvgA from '@/constants/hospital/dental/dental_svg_imgs/canine_openmouthA'
import DogSkullLeftSvg from '@/constants/hospital/dental/dental_svg_imgs/dog_skull_left'
import DogSkullRightSvg from '@/constants/hospital/dental/dental_svg_imgs/dog_skull_right'
import CatOpenteethSvg from '@/constants/hospital/dental/dental_svg_imgs/cat_openteeth'
import CatOpenmouthSvgA from '@/constants/hospital/dental/dental_svg_imgs/cat_openmouthA'
import CatSkullLeftSvg from '@/constants/hospital/dental/dental_svg_imgs/cat_skull_left'
import CatSkullRightSvg from '@/constants/hospital/dental/dental_svg_imgs/cat_skull_right'
import {
  CANINE_TOOTH_NAMES,
  FELINE_TOOTH_NAMES,
  DENTAL_CHART_COLORS
} from '@/constants/hospital/dental/dental_svg_imgs/dental-svg-info'



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

// ─── 단일 SVG 뷰 (재사용 가능) ──────────────────────────────────────────────
interface SvgPanelProps {
  containerId: string
  SvgComponent: React.ComponentType<React.SVGProps<SVGSVGElement>>
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
  const ref = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(
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
      {/* 뷰 레이블 */}
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

// ─── 상태 색상 ──────────────────────────────────────────────────────────────
function getStatusStyle(tooth: DentalTooth | undefined): string {
  if (!tooth) return 'bg-slate-100 text-slate-400 border-slate-200'
  const status = tooth.status?.toUpperCase()
  
  if (status === 'FE' || status === 'EXTRACTED') return 'bg-slate-800 text-white border-slate-900'
  if (status === 'ANO' || status === 'MISSING') return 'bg-slate-500 text-white border-slate-600'
  
  const hasFindings = [
    tooth.periodontal_stage, tooth.gingivitis, tooth.calculus, tooth.plaque, tooth.mobility,
    tooth.furcation, tooth.fracture, typeof tooth.pulp_exposure === 'string' ? tooth.pulp_exposure : null, tooth.caries, tooth.resorption_stage, tooth.resorption_type,
    tooth.staining, tooth.attrition, tooth.abrasion, tooth.periapical
  ].some(v => v && v !== 'none' && v !== 'normal') || (tooth.treatment_done && tooth.treatment_done.length > 0)
    
  if (hasFindings) return 'bg-emerald-100 text-emerald-800 border-emerald-300'
  return 'bg-emerald-50 text-emerald-600 border-emerald-200'
}
interface Props {
  chartDetail: DentalChartDetail
  teeth: DentalTooth[]
  images: DentalImage[]
}

export default function DentalChartTestPanel({ chartDetail, teeth, images }: Props) {
  const species = (chartDetail.species ?? chartDetail.patient?.species ?? 'canine').toLowerCase()
  const isFeline = species.startsWith('fel')
  const toothNames = isFeline ? FELINE_TOOTH_NAMES : CANINE_TOOTH_NAMES

  const [selectedToothId, setSelectedToothId] = useState<string | null>(null)
  // 개 전용: 구강 전개도 표시 토글
  const [showOpenmouth, setShowOpenmouth] = useState(true)

  // ─── 과거 차트 비교 기능 ───
  const [prevTeeth, setPrevTeeth] = useState<DentalTooth[]>([])
  const [prevImages, setPrevImages] = useState<DentalImage[]>([])
  const [hasPrevData, setHasPrevData] = useState(false)
  const [prevChartDate, setPrevChartDate] = useState<string>('')

  useEffect(() => {
    const fetchHistory = async () => {
      if (!chartDetail.patient_id) return
      
      try {
        const history = await fetchPatientDentalHistory(chartDetail.patient_id)
        const currentIndex = history.findIndex(h => h.id === chartDetail.id)
        const prevChart = history[currentIndex + 1]

        if (prevChart) {
          const [pTeeth, pImages] = await Promise.all([
            fetchDentalChartTeeth(prevChart.id),
            getDentalImages(prevChart.id)
          ])
          setPrevTeeth(pTeeth)
          setPrevImages(pImages)
          setPrevChartDate(prevChart.chart_date)
          setHasPrevData(true)
        }
      } catch (err) {
        console.error('Failed to fetch dental history:', err)
      }
    }
    fetchHistory()
  }, [chartDetail.id, chartDetail.patient_id])

  const selectedTooth = teeth.find((t) => String(t.tooth_id) === selectedToothId)

  // SVG 컴포넌트 결정
  const OpenmouthSvg = isFeline ? CatOpenmouthSvgA : DogOpenmouthSvgA
  const OpenteethSvg = isFeline ? CatOpenteethSvg : DogOpenteethSvg
  const SkullRightSvg = isFeline ? CatSkullRightSvg : DogSkullRightSvg
  const SkullLeftSvg = isFeline ? CatSkullLeftSvg : DogSkullLeftSvg

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-indigo-50/30">

      {/* ── 헤더 ── */}
      <div className="shrink-0 border-b bg-white/80 backdrop-blur-sm px-4 py-2 flex items-center gap-3">
        <span className="text-lg">{isFeline ? '🐱' : '🐶'}</span>
        <p className="text-xs font-semibold text-slate-600">
          {isFeline ? '고양이' : '강아지'} 치아 뷰어 — 치아를 클릭하여 선택
        </p>

        {/* 개 전용: 구강 전개도 토글 */}
        { (
          <button
            onClick={() => setShowOpenmouth((v) => !v)}
            className={`ml-2 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
              showOpenmouth
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white text-slate-500 border-slate-200 hover:border-violet-300 hover:text-violet-600'
            }`}
          >
            {showOpenmouth ? "구강 전개도 숨기기" : "구강 전개도 보기"}
          </button>
        )}

        {selectedToothId && (
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
              #{selectedToothId}
            </span>
            <button
              onClick={() => setSelectedToothId(null)}
              className="text-xs text-slate-400 hover:text-slate-700 transition-colors w-5 h-5 flex items-center justify-center rounded hover:bg-slate-100"
              aria-label="선택 해제"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ── 메인 콘텐츠 ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── SVG 패널 영역 ── */}
        <div className="flex-none overflow-auto p-3 border-r bg-white/40">
          {/* 구강 전개도 */}
          { showOpenmouth && (
            <div className="mb-4 border rounded-xl bg-white/60 p-3 shadow-sm w-fit mx-auto">
              <SvgPanel
                containerId="svg-openmouth"
                SvgComponent={OpenmouthSvg}
                selectedToothId={selectedToothId}
                teeth={teeth}
                onToothClick={setSelectedToothId}
                label="구강 전개도"
                svgStyle={{ height: '500px', width: 'auto' }}
              />
            </div>
          )}

          {/* ── SVG 그림 영역: 왼쪽 치열 + 오른쪽 두개골 ── */}
          {/* 패널은 내용물(SVG) 크기에 맞게 수축, 나머지 공간은 설명·사진용 */}
          <div className="flex gap-4 items-start">

            {/* 왼쪽: 치열 정면 — 너비는 SVG 비율에 맞게 자동 수축 */}
            <div className="border rounded-xl bg-white/60 shadow-sm p-2 flex flex-col items-center w-fit shrink-0">
              <SvgPanel
                containerId="svg-openteeth"
                SvgComponent={OpenteethSvg}
                selectedToothId={selectedToothId}
                teeth={teeth}
                onToothClick={setSelectedToothId}
                label="치열 (정면)"
                svgStyle={{ height: '500px', width: 'auto' }}
              />
            </div>

            {/* 오른쪽: 두개골 우측 + 좌측 (위 / 아래) */}
            <div className="flex flex-col gap-3 shrink-0">

              {/* 두개골 우측 */}
              <div className="border rounded-xl bg-white/60 shadow-sm p-2">
                <SvgPanel
                  containerId="svg-skull-right"
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
                  containerId="svg-skull-left"
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

        </div>

        {/* ── 정보 사이드바 ── */}
        <div className="flex-1 min-w-[700px] border-l bg-white/70 backdrop-blur-sm overflow-y-auto flex flex-col">
          {selectedToothId ? (
            <div className="flex h-full divide-x divide-slate-200">
              
              {/* 왼쪽: 현재 차트 정보 */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="bg-blue-50 px-4 py-2 border-b flex justify-between items-center shrink-0">
                  <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Current Exam</span>
                  <span className="text-[10px] text-blue-500 font-medium">{chartDetail.chart_date}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  {selectedTooth ? (
                    <DentalToothDetailView 
                      tooth={selectedTooth} 
                      images={images} 
                      species={species}
                    />
                  ) : (
                    (() => {
                      const hasImages = images.some(img => img.tooth_ids?.includes(selectedToothId!))
                      if (hasImages) {
                        return (
                          <DentalToothDetailView 
                            tooth={{ tooth_id: Number(selectedToothId), hos_id: '', chart_id: '' } as DentalTooth} 
                            images={images} 
                            species={species}
                          />
                        )
                      }
                      return (
                        <div className="flex flex-col gap-4">
                          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <span className="bg-slate-800 text-white px-2 py-0.5 rounded text-lg">
                              {selectedToothId}
                            </span>
                            <span className="text-slate-600 font-medium">
                              {toothNames[selectedToothId!] ?? `치아 #${selectedToothId}`}
                            </span>
                          </h3>
                          <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center">
                            <p className="text-slate-400 text-sm italic">기록된 차트 정보가 없습니다.</p>
                          </div>
                        </div>
                      )
                    })()
                  )}
                </div>
              </div>

              {/* 오른쪽: 과거 차트 정보 (비교용) */}
              {hasPrevData ? (
                <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30 border-l border-slate-200">
                  <div className="bg-slate-100 px-4 py-2 border-b flex justify-between items-center shrink-0">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Previous Exam</span>
                    <span className="text-[10px] text-slate-500 font-medium">{prevChartDate}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 opacity-85 hover:opacity-100 transition-opacity">
                    {(() => {
                      const prevTooth = prevTeeth.find(t => t.tooth_id === Number(selectedToothId))
                      const hasPrevImages = prevImages.some(img => img.tooth_ids?.includes(selectedToothId!))
                      
                      if (prevTooth || hasPrevImages) {
                        return (
                          <DentalToothDetailView 
                            tooth={prevTooth || { tooth_id: Number(selectedToothId), hos_id: '', chart_id: '' } as DentalTooth} 
                            images={prevImages} 
                            species={species}
                          />
                        )
                      }
                      return (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 py-10">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                            <span className="text-slate-300">#</span>
                          </div>
                          <p className="text-xs italic">해당 일자에 기록된 치아 정보가 없습니다.</p>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              ) : (
                <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-slate-50/30 text-slate-400 p-10 text-center border-l border-slate-200">
                  <p className="text-xs italic">이전 진료 기록이 없습니다.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-2 animate-pulse">
                <span className="text-3xl font-bold text-slate-200">#</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-600">치아를 선택해 주세요</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                  왼쪽 도면에서 치아를 클릭하면 상세 정보와 과거 기록을 비교할 수 있습니다.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
