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

export default function DentalReportOwner({ chartDetail, teeth, images, species }: Props) {
  
  return (
    <div className="space-y-12">
      <div className="text-center border-b pb-4">
        <h1 className="text-2xl font-bold tracking-widest text-slate-800">
          치과 검진 리포트 (보호자용)
        </h1>
        <p className="text-slate-500 mt-2">
           반려동물 이름: <span className="font-semibold text-slate-700">{chartDetail.patient?.name}</span> | 
           검진 일자: <span className="font-semibold text-slate-700">{chartDetail.chart_date}</span>
        </p>
      </div>

      <div className="space-y-10">
        {teeth
          .filter(t => t.tooth_id)
          .sort((a,b) => a.tooth_id - b.tooth_id)
          .map(tooth => {
            
            // 이미지 매핑
            const toothImages = images.filter(img => 
              img.tooth_ids && img.tooth_ids.includes(String(tooth.tooth_id))
            )

            // 병소 소견 추출 (보호자용 텍스트: generalComment 위주)
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
                  // generalComment 사용
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

            // 치료 개입 (treatment_done)
            if (tooth.treatment_done && Array.isArray(tooth.treatment_done)) {
              tooth.treatment_done.forEach(code => {
                const abbrev = getByAbbr(code)
                // 보호자용은 한글 명칭 우선 노출
                let detailText = abbrev?.definition_kr || abbrev?.definition || code
                findings.push({
                  label: '치료 내역',
                  detail: detailText
                })
              })
            }

            // 패스 조건: 사진도 없고 특별한 병소도 없으면 렌더링 안 함
            if (findings.length === 0 && toothImages.length === 0) return null

            return (
              <div key={tooth.tooth_id} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-amber-50/70 border-b border-amber-100 px-4 py-3">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-base">
                      {tooth.tooth_id}
                    </span>
                    <span className="text-slate-700 font-medium">
                      {toothNames[String(tooth.tooth_id)]}
                    </span>
                  </h3>
                </div>

                <div className="flex flex-col md:flex-row p-4 gap-6">
                  
                  {/* 왼쪽: 설명 */}
                  <div className="flex-1 space-y-4">
                    <h4 className="text-sm font-bold text-amber-600">선생님 소견</h4>
                    {findings.length > 0 ? (
                      <div className="space-y-3">
                        {findings.map((f, i) => (
                          <div key={i} className="bg-slate-50 p-3 rounded text-sm text-slate-700 leading-relaxed border border-slate-100 border-l-2 border-l-amber-300">
                            {f.detail}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">특이 사항이 발견되지 않았습니다.</p>
                    )}
                  </div>

                  {/* 오른쪽: 이미지 */}
                  {toothImages.length > 0 && (
                    <div className="flex-1 border-l pl-4 border-slate-100">
                      <div className="flex flex-col gap-4">
                        {/* 치료 전후 비교 섹션 */}
                        {(toothImages.some(img => img.tooth_ids?.includes('tooth-assessment')) || 
                          toothImages.some(img => img.tooth_ids?.includes('tooth-treatment'))) && (
                          <div className="grid grid-cols-2 gap-2">
                            {/* 치료 전 */}
                            <div className="flex flex-col gap-2">
                              <div className="text-xs font-bold text-center bg-slate-200 py-1 rounded text-slate-700">치료 전</div>
                              {toothImages.filter(img => img.tooth_ids?.includes('tooth-assessment')).map(img => (
                                <div key={img.dental_image_id} className="rounded overflow-hidden bg-slate-50 shadow-sm relative">
                                  <img src={img.img_url} alt="before" className="w-full aspect-square object-cover" />
                                  <div className="p-1.5 text-center bg-white border-t text-[11px] text-slate-600 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                    {img.is_radio ? '방사선 촬영' : '일반 사진'}
                                  </div>
                                </div>
                              ))}
                            </div>
                            {/* 치료 후 */}
                            <div className="flex flex-col gap-2">
                              <div className="text-xs font-bold text-center bg-teal-100 py-1 rounded text-teal-800">치료 후</div>
                              {toothImages.filter(img => img.tooth_ids?.includes('tooth-treatment')).map(img => (
                                <div key={img.dental_image_id} className="rounded overflow-hidden bg-slate-50 shadow-sm relative">
                                  <img src={img.img_url} alt="after" className="w-full aspect-square object-cover" />
                                  <div className="p-1.5 text-center bg-white border-t text-[11px] text-slate-600 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                    {img.is_radio ? '방사선 촬영' : '일반 사진'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* X-Ray 및 기타 이미지 */}
                        {toothImages.filter(img => !img.tooth_ids?.includes('tooth-assessment') && !img.tooth_ids?.includes('tooth-treatment')).length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t">
                            {toothImages.filter(img => !img.tooth_ids?.includes('tooth-assessment') && !img.tooth_ids?.includes('tooth-treatment')).map(img => (
                              <div key={img.dental_image_id} className="rounded overflow-hidden bg-slate-50 shadow-sm relative">
                                <img src={img.img_url} alt="dental" className="w-full aspect-square object-cover" />
                                <div className="p-1.5 text-center bg-white border-t text-[11px] text-slate-600 font-medium">
                                  {img.is_radio ? '방사선 촬영' : '일반 사진'}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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
          <div className="border-t pt-8 mt-8 pb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-base">전체</span>
              전반적인 구강 사진
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {unassignedImages.map(img => (
                <div key={img.dental_image_id} className="rounded overflow-hidden bg-slate-50 shadow-sm relative border">
                  <img src={img.img_url} alt="dental-general" className="w-full aspect-square object-cover" />
                  <div className="p-1.5 text-center bg-white border-t text-[11px] text-slate-600 font-medium">
                    {img.is_radio ? '방사선 촬영' : '일반 사진'}
                    {img.tooth_ids?.includes('general') && ' (전체 구강)'}
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
