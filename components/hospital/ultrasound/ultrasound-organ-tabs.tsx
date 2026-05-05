'use client'

import React from 'react'
import { OrganSection, Organ } from '@/constants/hospital/ultrasound/ultrasound_testref'
import { UltrasoundChartOrgan } from '@/types/hospital/ultrasound-type'
import { cn } from '@/lib/utils/utils'
import { CheckCircle2, Circle } from 'lucide-react'

interface Props {
  organs: OrganSection[]
  activeOrgan: Organ
  onChangeOrgan: (organ: Organ) => void
  organsData: Record<string, UltrasoundChartOrgan>
}

export default function UltrasoundOrganTabs({
  organs,
  activeOrgan,
  onChangeOrgan,
  organsData,
}: Props) {
  return (
    <div className="py-4">
      <h2 className="px-4 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
        검사 장기 목록
      </h2>
      <nav className="flex flex-col gap-1 px-2">
        {organs.map((section) => {
          const data = organsData[section.organ]
          const isExamined = data && data.status !== 'not_examined'
          const isAbnormal = data && data.status === 'abnormal'
          const isActive = activeOrgan === section.organ

          return (
            <button
              key={section.organ}
              onClick={() => onChangeOrgan(section.organ as Organ)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors text-left",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-700 hover:bg-slate-100",
                isAbnormal && !isActive && "text-red-600"
              )}
            >
              <div className="shrink-0">
                {isExamined ? (
                  <CheckCircle2
                    className={cn(
                      "w-4 h-4",
                      isAbnormal ? "text-red-500" : "text-emerald-500"
                    )}
                  />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300" />
                )}
              </div>
              <span className="flex-1 truncate">{section.organNameKo}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
