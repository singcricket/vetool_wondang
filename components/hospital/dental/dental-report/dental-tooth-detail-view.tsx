'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import type { DentalChartDetail, DentalTooth, DentalImage } from '@/types/dental/dental-type'
import { DENTAL_TOOTH_TESTS } from '@/constants/hospital/dental/dentalToothTests'
import { toothNames } from '@/constants/hospital/dental/dental_chart_canine_combined'
import { getByAbbr } from '@/constants/hospital/dental/avdcAbbreviations'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/utils'

import ImageCard from './dental-image-card'

interface DentalToothDetailViewProps {
  tooth: DentalTooth
  images: DentalImage[]
  isShared?: boolean
  chartDetail?: DentalChartDetail // Option for extra context if needed
}

export default function DentalToothDetailView({ tooth, images, isShared }: DentalToothDetailViewProps) {
  const toothIdStr = String(tooth.tooth_id)

  // 이 치아에 태그된 이미지 필터링 로직
  const toothImages = images.filter(img => 
    img.tooth_ids && img.tooth_ids.includes(toothIdStr) &&
    !img.tooth_ids.includes('general') &&
    !img.tooth_ids.includes('assessment') &&
    !img.tooth_ids.includes('treatment') &&
    !img.tooth_ids.includes('tooth-assessment') &&
    !img.tooth_ids.includes('tooth-treatment')
  )
  const toothAssessment = images.filter(img =>
    img.tooth_ids?.includes(toothIdStr) && 
    (img.tooth_ids?.includes('assessment') || img.tooth_ids?.includes('tooth-assessment') || img.tooth_ids?.includes('tooth-assesment'))
  )
  const toothTreatment = images.filter(img =>
    img.tooth_ids?.includes(toothIdStr) && 
    (img.tooth_ids?.includes('treatment') || img.tooth_ids?.includes('tooth-treatment'))
  )
  const allToothImages = [...toothImages, ...toothAssessment, ...toothTreatment]

  // 병소 소견 추출
  const findings: { label: string, detail: string }[] = []
  const toothFields = [
    'status', 'periodontal_stage', 'gingivitis', 'calculus', 'mobility', 'furcation',
    'fracture', 'caries', 'resorption_stage', 'staining', 'attrition'
  ]

  toothFields.forEach(field => {
    const val = (tooth as any)[field]
    if (val && val !== 'none' && val !== 'normal' && val !== 'present' && val !== 'PD0') {
      // status 필드는 DENTAL_TOOTH_TESTS의 tooth_status 키를 사용함
      const testKey = field === 'status' ? 'tooth_status' : field
      const testDef = DENTAL_TOOTH_TESTS[testKey]
      if (testDef) {
        const optDef = testDef.options?.find(o => o.value === val)
        if (optDef) {
          findings.push({
            label: testDef.testNameKo || field,
            detail: (testDef.optComment as any)?.[val] || optDef.detail || val
          })
        } else {
          // 옵션에 없더라도 값 자체를 표시
          findings.push({
            label: testDef.testNameKo || field,
            detail: val
          })
        }
      }
    }
  })

  // 치료 계획 (treatment_plan)
  if (tooth.treatment_plan && Array.isArray(tooth.treatment_plan)) {
    tooth.treatment_plan.forEach(code => {
      const abbrev = getByAbbr(code)
      let detailText = code
      if (abbrev) {
        detailText = `${abbrev.definition} ${abbrev.definition_kr ? `(${abbrev.definition_kr})` : ''}`
      }
      findings.push({ label: '계획 (Plan)', detail: detailText })
    })
  }

  // 치료 개입 (treatment_done)
  if (tooth.treatment_done && Array.isArray(tooth.treatment_done)) {
    tooth.treatment_done.forEach(code => {
      const abbrev = getByAbbr(code)
      let detailText = code
      if (abbrev) {
        detailText = `${abbrev.definition} ${abbrev.definition_kr ? `(${abbrev.definition_kr})` : ''}`
      }
      findings.push({ label: '치료 (Treatment)', detail: detailText })
    })
  }

  const clinicalFindings = findings.filter(f => f.label !== '치료 (Treatment)' && f.label !== '계획 (Plan)')
  const treatmentFindings = findings.filter(f => f.label === '치료 (Treatment)')
  const planFindings = findings.filter(f => f.label === '계획 (Plan)')

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
        <span className="bg-slate-800 text-white px-2 py-0.5 rounded text-lg">
          {tooth.tooth_id}
        </span>
        <span className="text-slate-600 font-medium">
          {toothNames[toothIdStr]}
        </span>
      </h3>

      <div className="grid grid-cols-1 gap-6">
        {/* 소견 및 치료 목록 */}
        <div className="space-y-5">
          {/* 발견 소견 */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-500 border-b pb-1">Clinical Findings</h4>
            {clinicalFindings.length > 0 ? (
              <ul className="space-y-1.5">
                {clinicalFindings.map((f, i) => (
                  <li key={i} className="text-sm text-slate-700 leading-relaxed">
                    <span className="font-bold mr-1 text-slate-900">[{f.label}]</span> 
                    {f.detail}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">특이 병소 소견 없음</p>
            )}
          </div>

          {/* 치료 계획 */}
          {planFindings.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-dashed">
              <h4 className="text-sm font-semibold text-indigo-700 font-bold">Planned Treatments</h4>
              <ul className="space-y-1.5">
                {planFindings.map((f, i) => (
                  <li key={i} className="text-sm text-indigo-900 leading-relaxed bg-indigo-50/50 p-2 rounded border border-indigo-100">
                    {f.detail}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 치료 내역 */}
          {treatmentFindings.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-dashed">
              <h4 className="text-sm font-semibold text-teal-700 font-bold">Done Treatments</h4>
              <ul className="space-y-1.5">
                {treatmentFindings.map((f, i) => (
                  <li key={i} className="text-sm text-teal-900 leading-relaxed bg-teal-50/50 p-2 rounded border border-teal-100">
                    {f.detail}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 이미지 갤러리 */}
        {allToothImages.length > 0 && (
          <div className="flex flex-col gap-4">
            {(toothAssessment.length > 0 || toothTreatment.length > 0) && (
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-bold text-center bg-slate-200 py-1 rounded text-slate-700">치료 전 (평가)</div>
                  {toothAssessment.map(img => (
                    <ImageCard key={img.dental_image_id} img={img} isShared={isShared} />
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-bold text-center bg-teal-100 py-1 rounded text-teal-800">치료 후 (결과)</div>
                  {toothTreatment.map(img => (
                    <ImageCard key={img.dental_image_id} img={img} isShared={isShared} />
                  ))}
                </div>
              </div>
            )}

            {toothImages.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t">
                {toothImages.map(img => <ImageCard key={img.dental_image_id} img={img} isShared={isShared} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
