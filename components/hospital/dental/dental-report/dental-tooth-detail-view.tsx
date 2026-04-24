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
  species: string
  chartDetail?: DentalChartDetail // Option for extra context if needed
}

export default function DentalToothDetailView({ tooth, images, isShared, species }: DentalToothDetailViewProps) {
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

  const probingValues = [tooth.probing_ml, tooth.probing_l, tooth.probing_dl, tooth.probing_mb, tooth.probing_b, tooth.probing_db]
    .filter((v): v is number => v !== null && v !== undefined)
  const maxProbing = probingValues.length > 0 ? Math.max(...probingValues) : 0

  toothFields.forEach(field => {
    // 치주낭 측정값(probing_depth)이 있으면 periodontal_stage는 중복이므로 제외
    if (field === 'periodontal_stage' && maxProbing > 0) return

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
  


  // Probing Depth 코멘트 계산
  let probingComment = ''
  if (maxProbing > 0) {
    const testDef = DENTAL_TOOTH_TESTS.probing_depth
    if (testDef && testDef.rangeComments) {
      const thresholds = species === 'feline' ? testDef.thresholds_feline : testDef.thresholds_canine
      if (thresholds) {
        let rangeKey = 'normal'
        if (maxProbing > thresholds[2]) rangeKey = 'PD4'
        else if (maxProbing > thresholds[1]) rangeKey = 'PD3'
        else if (maxProbing > thresholds[0]) rangeKey = 'PD2'
        
        probingComment = testDef.rangeComments[rangeKey]?.optComment || ''
      }
    }
  }

  // Gingival Recession 코멘트 계산 (범주형 데이터: none, GR1, GR2, GR3)
  const grRank: Record<string, number> = { 'none': 0, 'GR1': 1, 'GR2': 2, 'GR3': 3 }
  const recessionRanks = [
    tooth.recession_ml, tooth.recession_l, tooth.recession_dl, 
    tooth.recession_mb, tooth.recession_b, tooth.recession_db
  ].map(v => grRank[v || 'none'] || 0)
  
  const maxGrRank = Math.max(...recessionRanks)

  let recessionComment = ''
  if (maxGrRank > 0) {
    const testDef = DENTAL_TOOTH_TESTS.gingival_recession
    if (testDef && testDef.optComment) {
      const rangeKey = maxGrRank === 3 ? 'GR3' : maxGrRank === 2 ? 'GR2' : 'GR1'
      recessionComment = testDef.optComment[rangeKey] || ''
    }
  }

  const probingPoints = [
    { label: 'ML', val: tooth.probing_ml },
    { label: 'L', val: tooth.probing_l },
    { label: 'DL', val: tooth.probing_dl },
    { label: 'MB', val: tooth.probing_mb },
    { label: 'B', val: tooth.probing_b },
    { label: 'DB', val: tooth.probing_db },
  ].filter(p => p.val !== null && p.val !== undefined && p.val !== 0)

  const recessionPoints = [
    { label: 'ML', val: tooth.recession_ml },
    { label: 'L', val: tooth.recession_l },
    { label: 'DL', val: tooth.recession_dl },
    { label: 'MB', val: tooth.recession_mb },
    { label: 'B', val: tooth.recession_b },
    { label: 'DB', val: tooth.recession_db },
  ].filter(p => p.val !== null && p.val !== undefined && p.val !== '' && p.val !== '0')

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
            {clinicalFindings.length > 0 || probingPoints.length > 0 || recessionPoints.length > 0 ? (
              <ul className="space-y-1.5">
                {clinicalFindings.map((f, i) => (
                  <li key={i} className="text-sm text-slate-700 leading-relaxed">
                    <span className="font-bold mr-1 text-slate-900">[{f.label}]</span> 
                    {f.detail}
                  </li>
                ))}
                
                {/* 6포인트 데이터 표시 */}
                {probingPoints.length > 0 && (
                   <li className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">[치주낭 깊이 (PD)]</span>
                        <span className="text-xs text-slate-600 font-medium">
                          {probingPoints.map((p, idx) => (
                            <span key={p.label} className="ml-3 first:ml-0 inline-block">
                              <span className="text-[10px] text-slate-400 mr-0.5">{p.label}:</span>
                              <span className="font-bold text-slate-700">{p.val}</span>
                            </span>
                          ))}
                        </span>
                      </div>
                      {probingComment && (
                        <div className="text-[11px] text-indigo-600 font-medium bg-white px-2 py-1 rounded border border-indigo-50 mt-1 italic">
                          💡 {probingComment}
                        </div>
                      )}
                    </div>
                  </li>
                )}

                {recessionPoints.length > 0 && (
                  <li className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">[치은 퇴축 (GR)]</span>
                        <span className="text-xs text-slate-600 font-medium">
                          {recessionPoints.map((p, idx) => (
                            <span key={p.label} className="ml-3 first:ml-0 inline-block">
                              <span className="text-[10px] text-slate-400 mr-0.5">{p.label}:</span>
                              <span className="font-bold text-slate-700">{p.val}</span>
                            </span>
                          ))}
                        </span>
                      </div>
                      {recessionComment && (
                        <div className="text-[11px] text-amber-600 font-medium bg-white px-2 py-1 rounded border border-amber-50 mt-1 italic">
                          💡 {recessionComment}
                        </div>
                      )}
                    </div>
                  </li>
                )}
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
