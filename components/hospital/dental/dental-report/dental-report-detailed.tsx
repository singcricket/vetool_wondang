import React from 'react'
import type { DentalChartDetail, DentalTooth, DentalImage } from '@/types/dental/dental-type'
import { DENTAL_TOOTH_TESTS } from '@/constants/hospital/dental/dentalToothTests'
import { toothNames } from '@/constants/hospital/dental/dental_chart_canine_combined'
import { getByAbbr } from '@/constants/hospital/dental/avdcAbbreviations'

type Props = {
  chartDetail: DentalChartDetail
  teeth: DentalTooth[]
  images: DentalImage[]
  species: string
}

export default function DentalReportDetailed({ chartDetail, teeth, images, species }: Props) {
  
  return (
    <div className="space-y-12">
      <div className="text-center border-b pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-widest text-slate-800">
          Detailed Dental Report
        </h1>
        <p className="text-slate-500 mt-2">
          Patient: <span className="font-semibold text-slate-700">{chartDetail.patient?.name}</span> | 
          Date: <span className="font-semibold text-slate-700">{chartDetail.chart_date}</span>
        </p>
      </div>

      <div className="space-y-10">
        {teeth
          .filter(t => t.tooth_id)
          .sort((a,b) => a.tooth_id - b.tooth_id)
          .map(tooth => {
            
            // 이미지 매핑 (이 치아에 태그된 이미지)
            const toothImages = images.filter(img => 
              img.tooth_ids && img.tooth_ids.includes(String(tooth.tooth_id))
            )

            // 병소 소견 추출 (상세 텍스트: optComment 위주)
            const findings: { label: string, detail: string }[] = []

            const toothFields = [
              'status', 'periodontal_stage', 'gingivitis', 'calculus', 'mobility', 'furcation',
              'fracture', 'caries', 'resorption_stage', 'staining', 'attrition'
            ]

            toothFields.forEach(field => {
              const val = (tooth as any)[field]
              if (val && val !== 'none' && val !== 'normal' && val !== 'present' && val !== 'PD0') {
                const testDef = DENTAL_TOOTH_TESTS[field]
                if (testDef) {
                  const optDef = testDef.options?.find(o => o.value === val)
                  if (optDef) { // optComment 사용
                    findings.push({
                      label: testDef.testNameKo || field,
                      detail: (testDef.optComment as any)?.[val] || optDef.detail || val
                    })
                  }
                }
              }
            })

            // 치료 개입 (treatment_done)
            if (tooth.treatment_done && Array.isArray(tooth.treatment_done)) {
              tooth.treatment_done.forEach(code => {
                const abbrev = getByAbbr(code)
                let detailText = code
                if (abbrev) {
                  detailText = `${abbrev.definition} ${abbrev.definition_kr ? `(${abbrev.definition_kr})` : ''}`
                }
                findings.push({
                  label: '치료 (Treatment)',
                  detail: detailText
                })
              })
            }

            // 패스 조건: 사진도 없고 특별한 병소도 없으면 렌더링 안 함
            if (findings.length === 0 && toothImages.length === 0) return null

            return (
              <div key={tooth.tooth_id} className="border-l-4 border-teal-500 pl-4 py-2">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <span className="bg-slate-800 text-white px-2 py-0.5 rounded text-lg">
                    {tooth.tooth_id}
                  </span>
                  <span className="text-slate-600 font-medium">
                    {toothNames[String(tooth.tooth_id)]}
                  </span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* 왼쪽: 발견된 소견 목록 */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-500 border-b pb-1">Clinical Findings</h4>
                    {findings.length > 0 ? (
                      <ul className="space-y-2">
                        {findings.map((f, i) => (
                          <li key={i} className="text-sm text-slate-700 leading-relaxed">
                            <span className="font-semibold mr-1">[{f.label}]</span> 
                            {f.detail}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-400">특이 병소 소견 없음</p>
                    )}
                  </div>

                  {/* 오른쪽: 이미지 갤러리 */}
                  {toothImages.length > 0 && (
                    <div className="flex flex-col gap-4">
                      {/* 치료 전후 비교 섹션 */}
                      {(toothImages.some(img => img.tooth_ids?.includes('tooth-assessment')) || 
                        toothImages.some(img => img.tooth_ids?.includes('tooth-treatment'))) && (
                        <div className="grid grid-cols-2 gap-2">
                          {/* 치료 전 (Assessment) */}
                          <div className="flex flex-col gap-2">
                            <div className="text-xs font-bold text-center bg-slate-200 py-1 rounded text-slate-700">치료 전 (평가)</div>
                            {toothImages.filter(img => img.tooth_ids?.includes('tooth-assessment')).map(img => (
                              <div key={img.dental_image_id} className="border rounded relative p-0.5">
                                <img src={img.img_url} alt="before" className="w-full aspect-square object-cover rounded-sm" />
                                {img.is_radio && (
                                  <div className="absolute top-1 left-1">
                                    <span className="text-[10px] bg-yellow-400 text-yellow-900 px-1 font-bold shadow-sm rounded">X-Ray</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          {/* 치료 후 (Treatment) */}
                          <div className="flex flex-col gap-2">
                            <div className="text-xs font-bold text-center bg-teal-100 py-1 rounded text-teal-800">치료 후 (결과)</div>
                            {toothImages.filter(img => img.tooth_ids?.includes('tooth-treatment')).map(img => (
                              <div key={img.dental_image_id} className="border rounded relative p-0.5">
                                <img src={img.img_url} alt="after" className="w-full aspect-square object-cover rounded-sm" />
                                {img.is_radio && (
                                  <div className="absolute top-1 left-1">
                                    <span className="text-[10px] bg-yellow-400 text-yellow-900 px-1 font-bold shadow-sm rounded">X-Ray</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* X-Ray 및 기타 이미지 */}
                      {toothImages.filter(img => !img.tooth_ids?.includes('tooth-assessment') && !img.tooth_ids?.includes('tooth-treatment')).length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t">
                          {toothImages.filter(img => !img.tooth_ids?.includes('tooth-assessment') && !img.tooth_ids?.includes('tooth-treatment')).map(img => (
                            <div key={img.dental_image_id} className="border rounded bg-slate-50 p-1 relative">
                              <img src={img.img_url} alt="dental" className="w-full aspect-square object-cover rounded-sm" />
                              <div className="absolute top-2 left-2 flex flex-col gap-1">
                                {img.is_radio && (
                                  <span className="text-[10px] bg-yellow-400 text-yellow-900 px-1 font-bold shadow-sm rounded">X-Ray</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                </div>
              </div>
            )
          })}
      </div>

      {/* 치아 번호가 할당되지 않은 (General 포함) 이미지들 */}
      {(() => {
        const unassignedImages = images.filter(img => !img.tooth_ids || img.tooth_ids.length === 0 || img.tooth_ids.includes('general') || img.tooth_ids.every(id => isNaN(Number(id))))
        
        if (unassignedImages.length === 0) return null

        return (
          <div className="border-t pt-8 mt-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="bg-slate-800 text-white px-2 py-0.5 rounded text-lg">General</span>
              General / Unassigned Images
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {unassignedImages.map(img => (
                <div key={img.dental_image_id} className="border rounded bg-slate-50 p-1 relative">
                  <img src={img.img_url} alt="dental-general" className="w-full aspect-square object-cover rounded-sm" />
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {img.is_radio && (
                      <span className="text-[10px] bg-yellow-400 text-yellow-900 px-1 font-bold shadow-sm rounded">X-Ray</span>
                    )}
                    {img.tooth_ids?.includes('general') && (
                      <span className="text-[10px] bg-blue-500 text-white px-1 shadow-sm rounded font-medium">전체 구강</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
