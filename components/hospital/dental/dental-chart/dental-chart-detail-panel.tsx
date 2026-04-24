'use client'

import DentalChartSvgPanel from './dental-chart-svg-panel'
import type { DentalTooth, DentalImage } from '@/types/dental/dental-type'
import { CameraIcon } from 'lucide-react'

interface Props {
  species: string
  selectedToothId: string | null
  onToothClick: (id: string) => void
  teeth: DentalTooth[]
  images: DentalImage[]
}

const upperOrder = [110, 109, 108, 107, 106, 105, 104, 103, 102, 101, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210]
const lowerOrder = [411, 410, 409, 408, 407, 406, 405, 404, 403, 402, 401, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311]

const FELINE_MISSING = new Set([
  110, 105, 205, 210, // Upper
  411, 410, 406, 405, 305, 306, 310, 311 // Lower
])

function extractAbbrs(tooth: DentalTooth): string[] {
  const abbrs: string[] = []
  
  if (tooth.status && tooth.status !== 'present') {
    if (tooth.status === 'extracted') abbrs.push('Ext')
    else abbrs.push(tooth.status)
  }
  if (tooth.is_deciduous) abbrs.push('Decid')
  
  // The exact order requested by user: PD, GI, CI, PI, M, F, fracture, TR stage/type, caries, attrition, abrasion
  const fields = [
    tooth.periodontal_stage,
    tooth.gingivitis,
    tooth.calculus,
    tooth.plaque,
    tooth.mobility,
    tooth.furcation,
    tooth.fracture,
    tooth.resorption_stage,
    tooth.resorption_type,
    tooth.caries,
    tooth.attrition,
    tooth.abrasion
  ]
  
  fields.forEach(f => {
    if (f && f !== 'none') abbrs.push(f)
  })
  
  // Treatment done
  if (tooth.treatment_done && tooth.treatment_done.length > 0) {
    abbrs.push(...tooth.treatment_done)
  }
  // User asked to exclude treatment_plan
  
  return abbrs
}

export default function DentalChartDetailPanel({
  species,
  selectedToothId,
  onToothClick,
  teeth,
  images,
}: Props) {
  const isFeline = species?.toLowerCase().startsWith('fel')

  const shouldHideNum = (num: number) => {
    return isFeline && FELINE_MISSING.has(num)
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/30">
      <div className="shrink-0 border-b bg-slate-50 px-4 py-2">
        <p className="text-xs font-semibold text-muted-foreground">
          치아 차트 — 치아를 클릭하여 상세 정보를 입력하거나 확인하세요.
        </p>
      </div>
      <div className="flex-1 overflow-auto p-4 flex flex-col justify-start items-stretch gap-2">
        
        {/* 상악 표 (위쪽으로 역순) */}
        <div className="w-full mb-2">
          <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-x-0.5 w-full text-[10px] sm:text-xs">
            {upperOrder.map(num => {
              const t = teeth.find(x => x.tooth_id === num)
              const abbrs = t ? extractAbbrs(t) : []
              const hidden = shouldHideNum(num)
              
              return (
                <div key={num} className="flex flex-col items-center justify-end min-h-[7rem] h-auto gap-0.5 pb-1 select-none">
                  {!hidden && abbrs.slice().reverse().map((a, i) => (
                    <div key={i} className="text-center font-medium leading-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-full text-slate-700 bg-slate-200 px-0.5 rounded shadow-sm w-full opacity-90">
                      {a}
                    </div>
                  ))}
                  {!hidden && images.some(img => img.tooth_ids?.includes(String(num))) && (
                    <div className="flex items-center justify-center bg-indigo-100 text-indigo-600 rounded px-0.5 shadow-sm w-full py-0.5">
                      <CameraIcon className="w-3 h-3" />
                    </div>
                  )}
                  <div 
                    onClick={() => !hidden && onToothClick(String(num))}
                    className={`font-bold border-t-2 border-slate-400 w-full text-center pt-1 mt-1 text-slate-900 ${hidden ? 'invisible' : 'cursor-pointer hover:bg-slate-200/50'}`}
                  >
                    {!hidden ? num : ''}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 치아 모식도 */}
        <div className="w-full">
          <DentalChartSvgPanel
            species={species}
            selectedToothId={selectedToothId}
            onToothClick={onToothClick}
            teeth={teeth}
          />
        </div>

        {/* 하악 표 (아래쪽 정해진 순서) */}
        <div className="w-full mt-2">
          <div className="grid grid-cols-[repeat(22,minmax(0,1fr))] gap-x-0.5 w-full text-[10px] sm:text-xs">
            {lowerOrder.map(num => {
              const t = teeth.find(x => x.tooth_id === num)
              const abbrs = t ? extractAbbrs(t) : []
              const hidden = shouldHideNum(num)

              return (
                <div key={num} className="flex flex-col items-center justify-start min-h-[7rem] h-auto gap-0.5 pt-1 select-none">
                  <div 
                    onClick={() => !hidden && onToothClick(String(num))}
                    className={`font-bold border-b-2 border-slate-400 w-full text-center pb-1 mb-1 text-slate-900 ${hidden ? 'invisible' : 'cursor-pointer hover:bg-slate-200/50'}`}
                  >
                    {!hidden ? num : ''}
                  </div>
                  {!hidden && images.some(img => img.tooth_ids?.includes(String(num))) && (
                    <div className="flex items-center justify-center bg-indigo-100 text-indigo-600 rounded px-0.5 shadow-sm w-full py-0.5">
                      <CameraIcon className="w-3 h-3" />
                    </div>
                  )}
                  {!hidden && abbrs.map((a, i) => (
                    <div key={i} className="text-center font-medium leading-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-full text-slate-700 bg-slate-200 px-0.5 rounded shadow-sm w-full opacity-90">
                      {a}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
