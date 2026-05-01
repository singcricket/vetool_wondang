import { useState, useMemo, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import type { DentalImage, DentalChartDetail, DentalTooth } from '@/types/dental/dental-type'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { ScanLine, Camera, ZoomIn, ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils/utils'

// SVG imports
import DogOpenmouthSvgA from '@/constants/hospital/dental/dental_svg_imgs/canine_openmouthA'
import CatOpenmouthSvgA from '@/constants/hospital/dental/dental_svg_imgs/cat_openmouthA'
import { DENTAL_CHART_COLORS } from '@/constants/hospital/dental/dental_svg_imgs/dental-svg-info'

const DentalImageEditor = dynamic(() => import('../dental-image-editor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-900 text-white text-sm">
      에디터 로딩 중...
    </div>
  ),
})

const DentalImageWithMark = dynamic(() => import('../dental-image-with-mark'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-800 animate-pulse" />,
})

// ─── CSS 생성 (DentalChartTestPanel에서 차용) ──────────────────────────────
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

    if (isPreExtracted) {
      rule = `
        #${containerId} path[id="${tid}"],
        #${containerId} g[id="${tid}"] > path {
          opacity: 0.3 !important;
          stroke: ${DENTAL_CHART_COLORS.preExtracted} !important;
          stroke-width: 1.5px !important;
          stroke-dasharray: 3, 2 !important;
          ${isSelected ? 'transform: scale(1.1); transform-box: fill-box; transform-origin: center; opacity: 0.5 !important;' : ''}
        }
      `
    } else {
      let color = ''
      if (isTreatmentExt) color = DENTAL_CHART_COLORS.treatmentExt
      else if (isSelected) color = DENTAL_CHART_COLORS.selected
      else if (priority === 'urgent') color = DENTAL_CHART_COLORS.urgent
      else if (priority === 'recommended') color = DENTAL_CHART_COLORS.recommended
      else if (priority === 'elective') color = DENTAL_CHART_COLORS.elective
      else if (priority === 'monitor') color = DENTAL_CHART_COLORS.monitor
      else if (hasFindings) color = DENTAL_CHART_COLORS.findings

      if (color) {
        const isActuallySelected = isSelected && !isPreExtracted
        rule = `
          #${containerId} path[id="${tid}"],
          #${containerId} g[id="${tid}"] > path {
            stroke: ${color} !important;
            stroke-width: ${isActuallySelected ? '3.5px' : '2.5px'} !important;
            opacity: ${isSelected ? '1' : '0.8'} !important;
            ${isActuallySelected ? 'transform: scale(1.15); transform-box: fill-box; transform-origin: center; z-index: 10;' : ''}
          }
        `
      }
    }
    return rule
  }).join('\n')

  return `
    #${containerId} rect:not([id]) {
      fill: transparent !important;
    }
    #${containerId} path[id],
    #${containerId} g[id] {
      cursor: pointer;
      pointer-events: bounding-box;
      transition: all 0.15s ease;
      stroke: #64748b;
      stroke-width: 1.1px;
      fill: transparent;
    }
    #${containerId} path[id]:hover,
    #${containerId} g[id]:hover > path {
      stroke: ${DENTAL_CHART_COLORS.selected} !important;
      stroke-width: 3px !important;
      opacity: 1;
    }
    ${toothRules}
  `
}

interface SvgPanelProps {
  containerId: string
  SvgComponent: React.ComponentType<React.SVGProps<SVGSVGElement>>
  selectedToothId: string | null
  teeth: DentalTooth[]
  onToothClick: (id: string) => void
  label?: string
  className?: string
  svgStyle?: React.CSSProperties
  viewBox?: string
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
  viewBox,
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
      {label && (
        <p className="text-[10px] font-semibold text-slate-400 text-center tracking-wider uppercase">
          {label}
        </p>
      )}
      <div
        id={containerId}
        ref={ref}
        onClick={handleClick}
        className="flex items-center justify-center overflow-visible"
      >
        <style>{buildCss(containerId, selectedToothId, teeth)}</style>
        <SvgComponent 
          style={svgStyle ?? { width: '100%', height: 'auto' }} 
        />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Cell Type Definitions
// ═══════════════════════════════════════════════════════════
type RadioSlot = {
  label: string
  ids: string[]
  name: string
  nameKr: string
}

type GridCell =
  | { type: 'empty'; colSpan?: number }
  | { type: 'center-space'; colSpan?: number }   // 중앙 다이어그램 공간
  | { type: 'slot'; slot: RadioSlot; colSpan?: number }

type RadioRow = {
  rowLabel: string
  rowLabelKr: string
  jaw: 'maxilla' | 'mandible'
  cells: GridCell[]
}

// ═══════════════════════════════════════════════════════════
// Anatomical Layout — 수의학 방사선 표준 배치
//
// 7열 가변 그리드 (완벽한 중앙 정렬 및 동일 슬롯 크기)
// ═══════════════════════════════════════════════════════════
const RADIO_GRID: RadioRow[] = [
  // ── Row 1: 상악 전치 / 견치 ──────────────────────────────
  {
    rowLabel: 'Maxilla — Anterior',
    rowLabelKr: '상악 전치 / 견치',
    jaw: 'maxilla',
    cells: [
      { type: 'empty', colSpan: 2 },
      {
        type: 'slot',
        slot: { label: '104', ids: ['104'], name: 'Rt Max Canine', nameKr: '우측 상악 견치' },
      },
      {
        type: 'slot',
        slot: {
          label: '101–203',
          ids: ['101', '102', '103', '201', '202', '203'],
          name: 'Max Incisors',
          nameKr: '상악 절치 (전체)',
        },
      },
      {
        type: 'slot',
        slot: { label: '204', ids: ['204'], name: 'Lt Max Canine', nameKr: '좌측 상악 견치' },
      },
      { type: 'empty', colSpan: 2 },
    ],
  },

  // ── Row 2: 상악 구치 ──────────────────────────────────────
  {
    rowLabel: 'Maxilla — Posterior',
    rowLabelKr: '상악 구치',
    jaw: 'maxilla',
    cells: [
      {
        type: 'slot',
        slot: { label: '109–110', ids: ['109', '110'], name: 'Rt Max Molars', nameKr: '우측 상악 후구치' },
      },
      {
        type: 'slot',
        slot: {
          label: '105–108',
          ids: ['105', '106', '107', '108'],
          name: 'Rt Max PM + P4',
          nameKr: '우측 상악 전구치+P4',
        },
      },
      { type: 'center-space', colSpan: 3 },
      {
        type: 'slot',
        slot: {
          label: '205–208',
          ids: ['205', '206', '207', '208'],
          name: 'Lt Max PM + P4',
          nameKr: '좌측 상악 전구치+P4',
        },
      },
      {
        type: 'slot',
        slot: { label: '209–210', ids: ['209', '210'], name: 'Lt Max Molars', nameKr: '좌측 상악 후구치' },
      },
    ],
  },

  // ── Row 3: 하악 구치 ──────────────────────────────────────
  {
    rowLabel: 'Mandible — Posterior',
    rowLabelKr: '하악 구치',
    jaw: 'mandible',
    cells: [
      {
        type: 'slot',
        slot: { label: '409–411', ids: ['409', '410', '411'], name: 'Rt Mand Molars', nameKr: '우측 하악 후구치' },
      },
      {
        type: 'slot',
        slot: {
          label: '405–408',
          ids: ['405', '406', '407', '408'],
          name: 'Rt Mand PM + M1',
          nameKr: '우측 하악 전구치+M1',
        },
      },
      { type: 'center-space', colSpan: 3 },
      {
        type: 'slot',
        slot: {
          label: '305–308',
          ids: ['305', '306', '307', '308'],
          name: 'Lt Mand PM + M1',
          nameKr: '좌측 하악 전구치+M1',
        },
      },
      {
        type: 'slot',
        slot: { label: '309–311', ids: ['309', '310', '311'], name: 'Lt Mand Molars', nameKr: '좌측 하악 후구치' },
      },
    ],
  },

  // ── Row 4: 하악 전치 / 견치 ──────────────────────────────
  {
    rowLabel: 'Mandible — Anterior',
    rowLabelKr: '하악 전치 / 견치',
    jaw: 'mandible',
    cells: [
      { type: 'empty', colSpan: 2 },
      {
        type: 'slot',
        slot: { label: '404', ids: ['404'], name: 'Rt Mand Canine', nameKr: '우측 하악 견치' },
      },
      {
        type: 'slot',
        slot: {
          label: '401–303',
          ids: ['401', '402', '403', '301', '302', '303'],
          name: 'Mand Incisors',
          nameKr: '하악 절치 (전체)',
        },
      },
      {
        type: 'slot',
        slot: { label: '304', ids: ['304'], name: 'Lt Mand Canine', nameKr: '좌측 하악 견치' },
      },
      { type: 'empty', colSpan: 2 },
    ],
  },
]

// ═══════════════════════════════════════════════════════════
// SlotCard
// ═══════════════════════════════════════════════════════════
function SlotCard({
  slot,
  slotImages,
  isHighlighted,
  onClick,
}: {
  slot: RadioSlot
  slotImages: DentalImage[]
  isHighlighted?: boolean
  onClick: () => void
}) {
  const hasImages = slotImages.length > 0
  const representative = hasImages
    ? [...slotImages].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]
    : null

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-lg overflow-hidden border transition-all duration-300 min-w-0',
        hasImages
          ? 'cursor-pointer border-slate-700 bg-slate-800/60 hover:border-yellow-400/60 hover:shadow-[0_0_18px_rgba(250,204,21,0.18)]'
          : 'border-dashed border-slate-800 bg-slate-900/30',
        isHighlighted && 'border-yellow-400 ring-2 ring-yellow-400/30 shadow-[0_0_20px_rgba(250,204,21,0.3)] scale-105 z-10 bg-slate-800'
      )}
      onClick={hasImages ? onClick : undefined}
    >
      {/* 이미지 영역 */}
      <div className="relative aspect-square overflow-hidden bg-slate-900 flex-shrink-0">
        {representative ? (
          <>
            <DentalImageWithMark
              imageUrl={representative.img_url}
              mark={representative.mark}
              aspectRatio="aspect-square"
              className="w-full h-full"
              noHover
            />
            {/* hover 오버레이 */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200 flex items-center justify-center">
              <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-80 transition-all duration-200 drop-shadow-lg" />
            </div>
            {/* X-RAY 배지 */}
            <div className="absolute top-1 left-1">
              <span className="text-[7px] font-extrabold bg-yellow-400 text-yellow-950 px-1 py-0.5 rounded tracking-widest leading-none">
                X-RAY
              </span>
            </div>
            {/* 장수 배지 */}
            {slotImages.length > 1 && (
              <div className="absolute top-1 right-1">
                <span className="text-[8px] font-bold bg-slate-900/80 text-yellow-300 border border-yellow-500/30 px-1 py-0.5 rounded-full backdrop-blur-sm leading-none">
                  {slotImages.length}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-1 opacity-20">
            <Camera className="w-4 h-4 text-slate-500" />
          </div>
        )}
      </div>

      {/* 하단 라벨 */}
      <div className="px-1 py-1 border-t border-slate-700/30 bg-slate-800/30 min-w-0">
        <p className={cn(
          'text-[8px] font-bold font-mono tracking-wide leading-none truncate',
          hasImages ? 'text-yellow-300/80' : 'text-slate-700'
        )}>
          {slot.label}
        </p>
        <p className={cn(
          'text-[7px] mt-0.5 leading-none truncate',
          hasImages ? 'text-slate-600' : 'text-slate-800'
        )}>
          {slot.nameKr}
        </p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// SlotDetailDialog — 슬롯 이미지 갤러리 + 에디터
// ═══════════════════════════════════════════════════════════
function SlotDetailDialog({
  slot,
  slotImages,
  open,
  onClose,
}: {
  slot: RadioSlot | null
  slotImages: DentalImage[]
  open: boolean
  onClose: () => void
}) {
  const [editorImage, setEditorImage] = useState<DentalImage | null>(null)

  if (!slot) return null

  const sortedImages = [...slotImages].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <>
      {/* 갤러리 다이얼로그 */}
      <Dialog open={open && !editorImage} onOpenChange={(o) => { if (!o) onClose() }}>
        <DialogContent className="max-w-2xl w-full bg-slate-900 border border-slate-700 p-0 overflow-hidden rounded-xl shadow-2xl">
          <VisuallyHidden>
            <DialogDescription>{slot.label} 슬롯의 방사선 이미지 목록입니다.</DialogDescription>
          </VisuallyHidden>

          {/* 헤더 */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-700/60 bg-slate-800/60">
            <div className="w-7 h-7 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center shrink-0">
              <ScanLine className="w-3.5 h-3.5 text-yellow-400" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-bold text-slate-100 leading-none">
                {slot.label}
              </DialogTitle>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-none">
                {slot.name} · {slot.nameKr}
              </p>
            </div>
            <span className="ml-auto text-[10px] text-slate-500 shrink-0">{slotImages.length}장</span>
          </div>

          {/* 이미지 그리드 */}
          <div className="p-4 max-h-[65vh] overflow-y-auto">
            {sortedImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-600">
                <ImageOff className="w-8 h-8" />
                <span className="text-sm">이미지가 없습니다</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {sortedImages.map((img) => (
                  <div
                    key={img.dental_image_id}
                    className="group cursor-pointer rounded-lg overflow-hidden border border-slate-700 hover:border-yellow-400/50 transition-all duration-200 bg-slate-800"
                    onClick={() => setEditorImage(img)}
                  >
                    <div className="aspect-square relative overflow-hidden bg-slate-900">
                      <DentalImageWithMark
                        imageUrl={img.img_url}
                        mark={img.mark}
                        aspectRatio="aspect-square"
                        className="h-full w-full"
                        noHover
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-80 transition-opacity" />
                      </div>
                    </div>
                    <div className="px-1.5 py-1 bg-slate-800/60">
                      <span className="text-[8px] text-slate-500">
                        {new Date(img.created_at).toLocaleDateString('ko-KR', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 풀스크린 에디터 */}
      <Dialog
        open={!!editorImage}
        onOpenChange={(o) => { if (!o) setEditorImage(null) }}
        modal={false}
      >
        <DialogContent
          className="max-w-[100vw] w-screen h-screen max-h-[100vh] p-0 m-0 border-0 flex flex-col bg-slate-900 rounded-none z-[300]"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
        >
          <VisuallyHidden>
            <DialogTitle>방사선 이미지 에디터</DialogTitle>
            <DialogDescription>방사선 이미지를 확대하고 마킹을 편집합니다.</DialogDescription>
          </VisuallyHidden>
          {editorImage && (
            <DentalImageEditor
              imageId={editorImage.dental_image_id}
              imageUrl={editorImage.img_url}
              initialMark={editorImage.mark}
              onClose={() => setEditorImage(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

// ═══════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════
interface Props {
  images: DentalImage[]
  chartDetail: DentalChartDetail
  teeth: DentalTooth[]
}

export default function DentalChartRadioPanel({ images, chartDetail, teeth }: Props) {
  const [activeSlot, setActiveSlot] = useState<{ slot: RadioSlot; images: DentalImage[] } | null>(null)
  const [selectedToothId, setSelectedToothId] = useState<string | null>(null)

  const species = (chartDetail.species ?? chartDetail.patient?.species ?? 'canine').toLowerCase()
  const isFeline = species.startsWith('fel')
  const OpenmouthSvg = isFeline ? CatOpenmouthSvgA : DogOpenmouthSvgA

  // 101-203 등의 통합 슬롯이 현재 선택된 치아를 포함하는지 확인
  const highlightedSlotLabel = useMemo(() => {
    if (!selectedToothId) return null
    for (const row of RADIO_GRID) {
      for (const cell of row.cells) {
        if (cell.type === 'slot' && cell.slot.ids.includes(selectedToothId)) {
          return cell.slot.label
        }
      }
    }
    return null
  }, [selectedToothId])

  // 치아 클릭 시 핸들러: 슬롯 강조 + 슬롯 상세 다이얼로그 오픈
  const handleToothClickInSvg = useCallback((id: string) => {
    setSelectedToothId(id)

    // 해당 치아를 포함하는 슬롯 찾기
    for (const row of RADIO_GRID) {
      for (const cell of row.cells) {
        if (cell.type === 'slot' && cell.slot.ids.includes(id)) {
          const matchedImages = images.filter((img) =>
            (img.tooth_ids ?? []).some((tid) => cell.slot.ids.includes(tid))
          )
          // 이미지가 있든 없든 다이얼로그는 열 수 있지만, 기존 기획상 이미지가 있을 때만 상세를 보게 되어있음
          // 여기서는 유저 요청에 따라 "관련 방사선 사진 팝업" 하도록 함
          setActiveSlot({ slot: cell.slot, images: matchedImages })
          return
        }
      }
    }
  }, [images])

  // 슬롯 label → 해당 이미지 목록 맵
  const slotImageMap = useMemo(() => {
    const map = new Map<string, DentalImage[]>()
    RADIO_GRID.forEach((row) => {
      row.cells.forEach((cell) => {
        if (cell.type !== 'slot') return
        const matched = images.filter((img) =>
          (img.tooth_ids ?? []).some((id) => cell.slot.ids.includes(id))
        )
        map.set(cell.slot.label, matched)
      })
    })
    return map
  }, [images])

  const coveredSlots = useMemo(() => {
    let count = 0
    slotImageMap.forEach((imgs) => { if (imgs.length > 0) count++ })
    return count
  }, [slotImageMap])

  return (
    <>
      <div className="flex flex-col h-full bg-slate-950 overflow-hidden">

        {/* 상단 헤더 */}
        <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 bg-slate-900/70">
          <ScanLine className="w-4 h-4 text-yellow-400 shrink-0" />
          <span className="text-xs font-bold text-slate-200 tracking-wide">방사선 리뷰</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-yellow-500/10 border border-yellow-500/25 text-yellow-300 px-2 py-0.5 rounded-full font-mono">
              {images.length}장
            </span>
            {coveredSlots > 0 && (
              <span className="text-[10px] text-slate-600">{coveredSlots} / 12 구역 촬영</span>
            )}
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-2 text-[9px] text-slate-700 select-none">
            <span>← Rt 우측</span>
            <div className="w-8 h-px bg-slate-800" />
            <span>Lt 좌측 →</span>
          </div>
        </div>

        {/* 해부학 그리드 (단일 그리드로 변경하여 row-span 지원) */}
        <div className="flex-1 overflow-auto px-1 py-1">
          <div className="grid grid-cols-7 gap-y-6 gap-x-2 pb-10">
            {RADIO_GRID.map((row, rowIdx) => {
              const isMaxilla = row.jaw === 'maxilla'

              return (
                <div key={rowIdx} className="contents">
                  {/* 행 헤더 (8열 전체를 차지하도록 배치) */}
                  <div 
                    className="col-span-7 flex items-center gap-2 mb-1"
                    style={{ gridColumn: '1 / span 7', gridRow: rowIdx * 2 + 1 }}
                  >
                    <span className={cn(
                      'text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border',
                      isMaxilla
                        ? 'text-sky-300/60 border-sky-800/35 bg-sky-950/25'
                        : 'text-amber-300/60 border-amber-800/35 bg-amber-950/25'
                    )}>
                      {row.rowLabel}
                    </span>
                    <span className="text-[9px] text-slate-700">{row.rowLabelKr}</span>
                    <div className="flex-1 h-px bg-slate-800/80" />
                  </div>

                  {row.cells.reduce((acc, cell, cellIdx) => {
                    const rowPos = rowIdx * 2 + 2
                    const colIdx = acc.currentCol
                    const currentSpan = cell.colSpan || 1
                    
                    if (cell.type === 'empty') {
                      acc.elements.push(<div key={cellIdx} style={{ gridColumn: `${colIdx} / span ${currentSpan}`, gridRow: rowPos }} />)
                    } else if (cell.type === 'center-space') {
                      if (rowIdx === 1) {
                        acc.elements.push(
                            <div
                              key={cellIdx}
                              className="border rounded-xl bg-white/60 p-3 shadow-sm flex items-center justify-center overflow-visible w-fit mx-auto min-h-[550px] relative z-10"
                              style={{ 
                                gridColumn: `${colIdx} / span ${currentSpan}`, 
                                gridRow: `${rowPos} / span 4` 
                              }}
                            >
                              <SvgPanel
                                containerId="svg-radio-openmouth"
                                SvgComponent={OpenmouthSvg}
                                selectedToothId={selectedToothId}
                                teeth={teeth}
                                onToothClick={handleToothClickInSvg}
                                label="구강 전개도"
                                svgStyle={{ width: 'auto', height: '500px' }}
                              />
                            </div>
                        )
                      }
                    } else if (cell.type === 'slot') {
                      const slotImages = slotImageMap.get(cell.slot.label) ?? []
                      const isHighlightedFromSvg = highlightedSlotLabel === cell.slot.label
                      acc.elements.push(
                        <div 
                          key={cellIdx} 
                          className="min-w-0"
                          style={{ 
                            gridColumn: `${colIdx} / span ${currentSpan}`,
                            gridRow: rowPos 
                          }}
                        >
                          <SlotCard
                            slot={cell.slot}
                            slotImages={slotImages}
                            isHighlighted={isHighlightedFromSvg}
                            onClick={() => {
                              setSelectedToothId(null)
                              setActiveSlot({ slot: cell.slot, images: slotImages })
                            }}
                          />
                        </div>
                      )
                    }

                    acc.currentCol += currentSpan
                    return acc
                  }, { currentCol: 1, elements: [] as React.ReactNode[] }).elements}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 슬롯 상세 다이얼로그 */}
      <SlotDetailDialog
        slot={activeSlot?.slot ?? null}
        slotImages={activeSlot?.images ?? []}
        open={!!activeSlot}
        onClose={() => setActiveSlot(null)}
      />
    </>
  )
}
