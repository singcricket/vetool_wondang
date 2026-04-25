'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { DentalTooth, DentalChartDetail, DentalImage } from '@/types/dental/dental-type'
import { getDentalImages } from '@/lib/actions/dental/get-dental-images'
import DentalToothDetailView from '@/components/hospital/dental/dental-report/dental-tooth-detail-view'

// SVG imports
import DogOpenteethSvg from '@/constants/hospital/dental/dental_svg_imgs/dog_openteeth'
import DogOpenmouthSvgB from '@/constants/hospital/dental/dental_svg_imgs/canine_openmouthB'
import DogSkullLeftSvg from '@/constants/hospital/dental/dental_svg_imgs/dog_skull_left'
import DogSkullRightSvg from '@/constants/hospital/dental/dental_svg_imgs/dog_skull_right'
import CatOpenteethSvg from '@/constants/hospital/dental/dental_svg_imgs/cat_openteeth'
import CatSkullLeftSvg from '@/constants/hospital/dental/dental_svg_imgs/cat_skull_left'
import CatSkullRightSvg from '@/constants/hospital/dental/dental_svg_imgs/cat_skull_right'

// ─── Tooth name maps ────────────────────────────────────────────────────────
const CANINE_TOOTH_NAMES: Record<string, string> = {
  '101': '우측 상악 제1절치', '102': '우측 상악 제2절치', '103': '우측 상악 제3절치',
  '104': '우측 상악 견치', '105': '우측 상악 제1전구치', '106': '우측 상악 제2전구치',
  '107': '우측 상악 제3전구치', '108': '우측 상악 제4전구치 (P4)',
  '109': '우측 상악 제1후구치', '110': '우측 상악 제2후구치',
  '201': '좌측 상악 제1절치', '202': '좌측 상악 제2절치', '203': '좌측 상악 제3절치',
  '204': '좌측 상악 견치', '205': '좌측 상악 제1전구치', '206': '좌측 상악 제2전구치',
  '207': '좌측 상악 제3전구치', '208': '좌측 상악 제4전구치 (P4)',
  '209': '좌측 상악 제1후구치', '210': '좌측 상악 제2후구치',
  '301': '좌측 하악 제1절치', '302': '좌측 하악 제2절치', '303': '좌측 하악 제3절치',
  '304': '좌측 하악 견치', '305': '좌측 하악 제1전구치', '306': '좌측 하악 제2전구치',
  '307': '좌측 하악 제3전구치', '308': '좌측 하악 제4전구치',
  '309': '좌측 하악 제1후구치 (M1)', '310': '좌측 하악 제2후구치', '311': '좌측 하악 제3후구치',
  '401': '우측 하악 제1절치', '402': '우측 하악 제2절치', '403': '우측 하악 제3절치',
  '404': '우측 하악 견치', '405': '우측 하악 제1전구치', '406': '우측 하악 제2전구치',
  '407': '우측 하악 제3전구치', '408': '우측 하악 제4전구치',
  '409': '우측 하악 제1후구치 (M1)', '410': '우측 하악 제2후구치', '411': '우측 하악 제3후구치',
}

const FELINE_TOOTH_NAMES: Record<string, string> = {
  '101': '우측 상악 제1절치', '102': '우측 상악 제2절치', '103': '우측 상악 제3절치',
  '104': '우측 상악 견치', '106': '우측 상악 제3전구치', '107': '우측 상악 제4전구치 (P4)',
  '108': '우측 상악 제1후구치',
  '201': '좌측 상악 제1절치', '202': '좌측 상악 제2절치', '203': '좌측 상악 제3절치',
  '204': '좌측 상악 견치', '206': '좌측 상악 제3전구치', '207': '좌측 상악 제4전구치 (P4)',
  '208': '좌측 상악 제1후구치',
  '301': '좌측 하악 제1절치', '302': '좌측 하악 제2절치', '303': '좌측 하악 제3절치',
  '304': '좌측 하악 견치', '307': '좌측 하악 제3전구치', '308': '좌측 하악 제4전구치',
  '309': '좌측 하악 제1후구치 (M1)',
  '401': '우측 하악 제1절치', '402': '우측 하악 제2절치', '403': '우측 하악 제3절치',
  '404': '우측 하악 견치', '407': '우측 하악 제3전구치', '408': '우측 하악 제4전구치',
  '409': '우측 하악 제1후구치 (M1)',
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

    // 소견/치료 있음 (PRO, RAD 제외)
    const EXCLUDED_TREATMENTS = ['PRO', 'RAD']
    const hasFindings = [
      t.periodontal_stage, t.gingivitis, t.calculus, t.plaque, t.mobility,
      t.furcation, t.fracture, t.caries, t.resorption_stage, t.resorption_type,
      t.staining, t.attrition, t.abrasion
    ].some(v => v && v !== 'none' && v !== 'normal') ||
    (t.treatment_done?.some(code => !EXCLUDED_TREATMENTS.includes(code.toUpperCase())) ?? false)

    let rule = ''

    // 우선순위: FE/ANO > EXT > 선택 > 소견 있음
    if (isPreExtracted) {
      // 기발치/결손: 반투명 + 점선 (형태는 보이게)
      rule = `
        #${containerId} path[id="${tid}"],
        #${containerId} g[id="${tid}"] > path {
          opacity: 0.3 !important;
          stroke: #94a3b8 !important;
          stroke-width: 1.5px !important;
          stroke-dasharray: 3, 2 !important;
          ${isSelected ? 'transform: scale(1.1); transform-box: fill-box; transform-origin: center; opacity: 0.5 !important;' : ''}
        }
      `
    } else {
      let color = ''
      if (isTreatmentExt) color = '#f472b6'    // Pink  — 치료발치
      else if (isSelected) color = '#6366f1'   // Indigo — 선택
      else if (hasFindings) color = '#10b981'  // Green  — 소견/치료

      if (color) {
        const isActuallySelected = isSelected && !isPreExtracted
        rule = `
          #${containerId} path[id="${tid}"],
          #${containerId} g[id="${tid}"] > path {
            stroke: ${color} !important;
            stroke-width: ${isActuallySelected ? '3px' : '2px'} !important;
            opacity: ${isSelected ? '1' : '0.8'} !important;
            ${isActuallySelected ? 'transform: scale(1.1); transform-box: fill-box; transform-origin: center; z-index: 10;' : ''}
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
      stroke: #6366f1 !important;
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
    tooth.furcation, tooth.fracture, tooth.caries, tooth.resorption_stage, tooth.staining, tooth.attrition
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
  const [showOpenmouth, setShowOpenmouth] = useState(false)

  const selectedTooth = teeth.find((t) => String(t.tooth_id) === selectedToothId)

  // SVG 컴포넌트 결정
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
            👄 구강 전개도
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
          {/* 구강 전개도 (개만, 토글 시) */}
          { showOpenmouth && (
            <div className="mb-4 border rounded-xl bg-white/60 p-3 shadow-sm w-fit mx-auto">
              <SvgPanel
                containerId="svg-openmouth"
                SvgComponent={DogOpenmouthSvgB}
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
        <div className="flex-1 min-w-[600px] border-l bg-white/70 backdrop-blur-sm overflow-y-auto flex flex-col">
          {selectedToothId ? (
            <div className="p-6 flex flex-col gap-6">
              {/* 치아별 상세 내역 (Report Detailed와 동일) */}
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
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-4 py-8">
              <div className="text-5xl opacity-20">🦷</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                치아를 클릭하면 상세 정보가 여기에 표시됩니다
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
