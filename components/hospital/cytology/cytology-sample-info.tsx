'use client'

import React from 'react'
import { cytologyReference } from '@/constants/hospital/cytology/cytology_ref'
import type {
  CytologySampleType,
  CytologyMode,
} from '@/constants/hospital/cytology/cytology-types'

interface Props {
  sampleType: CytologySampleType
  mode: CytologyMode
}

export default function CytologySampleInfo({ sampleType, mode }: Props) {
  const sampleDef = cytologyReference.getSampleDef(sampleType)

  return (
    <div className="flex flex-wrap items-center gap-2 px-1 py-1">
      {/* Sample name */}
      <span className="text-sm font-semibold text-slate-700">
        {sampleDef?.nameKo ?? sampleType}
      </span>

      {/* Stain method chips */}
      {sampleDef?.stainMethods.map((stain) => (
        <span
          key={stain}
          className="text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full"
        >
          {stain}
        </span>
      ))}

      {/* Mode badge */}
      <span
        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
          mode === 'specialist'
            ? 'bg-violet-100 text-violet-700 border-violet-200'
            : 'bg-amber-100 text-amber-700 border-amber-200'
        }`}
      >
        {mode === 'specialist' ? '전문가' : 'AI 보조'}
      </span>
    </div>
  )
}
