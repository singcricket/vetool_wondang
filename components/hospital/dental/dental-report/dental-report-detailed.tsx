'use client'
import React, { useState } from 'react'
import type { DentalChartDetail, DentalTooth, DentalImage } from '@/types/dental/dental-type'
import { DENTAL_TOOTH_TESTS } from '@/constants/hospital/dental/dentalToothTests'
import { DENTAL_CHART_TESTS } from '@/constants/hospital/dental/dentalChartTests'
import { toothNames } from '@/constants/hospital/dental/dental_chart_canine_combined'
import { getByAbbr } from '@/constants/hospital/dental/avdcAbbreviations'
import dynamic from 'next/dynamic'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { DialogTitle, DialogDescription } from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/utils'

const DentalImageWithMark = dynamic(() => import('../dental-image-with-mark'), { 
  ssr: false,
  loading: () => <div className="aspect-square bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">Loading...</div>
})

const DentalImageEditor = dynamic(() => import('../dental-image-editor'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center bg-slate-900 text-white">에디터 로딩 중...</div>
})

type Props = {
  chartDetail: DentalChartDetail
  teeth: DentalTooth[]
  images: DentalImage[]
  species: string
  isShared?: boolean
}

// 이미지 그룹별 필터 헬퍼(태그 우선)
function filterByTag(images: DentalImage[], tag: string) {
  return images.filter(img => img.tooth_ids?.includes(tag))
}

function ImageCard({ img, isShared }: { img: DentalImage; isShared?: boolean }) {
  const [viewerOpen, setViewerOpen] = useState(false)

  return (
    <>
      <div 
        className="border rounded bg-slate-50 p-0.5 relative group overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
        onClick={() => setViewerOpen(true)}
      >
        <DentalImageWithMark 
          imageUrl={img.img_url} 
          mark={img.mark} 
          aspectRatio="aspect-square" 
        />
        {img.is_radio && (
          <div className="absolute top-1 left-1 pointer-events-none">
            <span className="text-[10px] bg-yellow-400 text-yellow-900 px-1 font-bold shadow-sm rounded">X-Ray</span>
          </div>
        )}
      </div>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen} modal={!isShared}>
        <DialogContent 
          className={cn(
            "p-0 m-0 border-0 flex flex-col items-center justify-center bg-slate-900/95 rounded-none z-[150]",
            isShared 
              ? "max-w-[90vw] w-[1200px] h-auto aspect-auto border border-slate-700 shadow-2xl rounded-xl" 
              : "max-w-[100vw] w-screen h-screen max-h-[100vh] z-[200]"
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <VisuallyHidden>
            <DialogTitle>{isShared ? '이미지 크게 보기' : '치과 이미지 에디터'}</DialogTitle>
            <DialogDescription>{isShared ? '상세 이미지를 확인합니다.' : '이미지 마킹을 확인하거나 수정할 수 있습니다.'}</DialogDescription>
          </VisuallyHidden>
          
          {viewerOpen && (
             isShared ? (
                <div className="relative w-full h-full p-4 flex items-center justify-center">
                  <DentalImageWithMark 
                    imageUrl={img.img_url} 
                    mark={img.mark} 
                    aspectRatio="aspect-auto" 
                    className="max-h-[80vh] w-full"
                    noHover={true}
                  />
                  <Button 
                    variant="ghost" 
                    className="absolute top-4 right-4 text-white hover:bg-white/10" 
                    onClick={() => setViewerOpen(false)}
                  >
                    닫기
                  </Button>
                </div>
             ) : (
                <DentalImageEditor 
                  imageId={img.dental_image_id} 
                  imageUrl={img.img_url} 
                  initialMark={img.mark} 
                  onClose={() => setViewerOpen(false)}
                />
             )
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function DentalReportDetailed({ chartDetail, teeth, images, species, isShared }: Props) {

  // 이미지 그룹 분류
  const generalImages   = filterByTag(images, 'general')
  const assessmentImages = filterByTag(images, 'assessment')
  const treatmentImages  = filterByTag(images, 'treatment')

  // recheck 라벨 맵
  const recheckLabel: Record<string, string> = {
    '1month': '1개월 후', '3months': '3개월 후',
    '6months': '6개월 후', '12months': '12개월 후', 'as_needed': '필요시 재방문'
  }

  // 처치 항목 요약
  const procedureList = [
    chartDetail.procedure_scaling  && '스케일링',
    chartDetail.procedure_polishing && '연마',
    chartDetail.procedure_irrigation && '세정',
    chartDetail.procedure_fluoride  && '불소 도포',
    chartDetail.procedure_other     || null,
  ].filter(Boolean) as string[]

  return (
    <div className="space-y-12">
      {/* ── 헤더 ── */}
      <div className="text-center border-b pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-widest text-slate-800">
          Detailed Dental Report
        </h1>
        <p className="text-slate-500 mt-2">
          Patient: <span className="font-semibold text-slate-700">{chartDetail.patient?.name}</span> | 
          Date: <span className="font-semibold text-slate-700">{chartDetail.chart_date}</span>
        </p>
      </div>

      {/* ── 차트 전반 정보 (dental_charts) ── */}
      <section className="space-y-6 border border-slate-200 rounded-xl p-6 bg-slate-50/50">
        <h2 className="text-base font-bold text-slate-700 border-b pb-2">전체 구강 검진 결과</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 좌: 구강 평가 수치 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">구강 평가</h3>
            <div className="space-y-3">
              {[
                { field: 'skull_type', label: '두개 유형' },
                { field: 'occlusion', label: '교합 상태' },
                { field: 'crowding', label: '과밀치열' },
                { field: 'gingivitis_overall', label: '치은염' },
                { field: 'calculus_overall', label: '치석' },
                { field: 'periodontitis_stage', label: '치주염 단계' },
                { field: 'oral_mucosa', label: '구강 점막' },
                { field: 'tongue_eval', label: '혀 평가' },
                { field: 'palate_eval', label: '구개 평가' },
                { field: 'tonsil_eval', label: '편도 평가' },
                { field: 'pharynx_eval', label: '인두 평가' },
                { field: 'salivary_eval', label: '타액선 평가' },
                { field: 'lymph_node_eval', label: '림프절 평가' },
              ].map(({ field, label }) => {
                const value = (chartDetail as any)[field]
                if (!value || value === 'none' || value === 'normal' || value === 'PD0') return null

                // DENTAL_CHART_TESTS에서 상세 설명 찾기
                const chartTest = DENTAL_CHART_TESTS[field]
                let detailText = value
                
                if (chartTest) {
                  // optComment가 있으면 우선 사용
                  const optComment = chartTest.optComment?.[value]
                  const optLabel = chartTest.options?.find(o => o.value === value)?.label
                  detailText = optComment || optLabel || value
                }

                return (
                  <div key={field} className="flex flex-col gap-1 text-sm">
                    <span className="text-slate-500 font-medium">{chartTest?.testNameKo || label}</span>
                    <span className="text-slate-800 leading-relaxed pl-2 border-l-2 border-slate-200">{detailText}</span>
                  </div>
                )
              })}

              {chartDetail.xray_taken && (
                <div className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-500 font-medium">방사선 소견</span>
                  <span className="text-slate-800 leading-relaxed pl-2 border-l-2 border-slate-200">
                    {chartDetail.xray_findings || '촬영됨'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 우: 처치 / 계획 / 메모 */}
          <div className="space-y-4">
            {procedureList.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">처치 내역</h3>
                <div className="flex flex-wrap gap-1.5">
                  {procedureList.map((p, i) => (
                    <span key={i} className="bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded-full font-medium">{p}</span>
                  ))}
                </div>
                {chartDetail.anesthesia && (
                  <p className="text-xs text-slate-500 mt-2">마취: {chartDetail.anesthesia_note || '진행됨'}</p>
                )}
              </div>
            )}

            {chartDetail.treatment_plan && (
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">치료 계획</h3>
                <p className="text-sm text-slate-700 leading-relaxed bg-white rounded p-3 border border-slate-200">{chartDetail.treatment_plan}</p>
              </div>
            )}

            {chartDetail.homecare_instruction && (
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">가정 관리 지침</h3>
                <p className="text-sm text-slate-700 leading-relaxed bg-white rounded p-3 border border-slate-200">{chartDetail.homecare_instruction}</p>
              </div>
            )}

            {chartDetail.recheck_interval && (
              <div className="text-sm">
                <span className="text-slate-500">재검진 권장: </span>
                <span className="font-semibold text-teal-700">{recheckLabel[chartDetail.recheck_interval] ?? chartDetail.recheck_interval}</span>
              </div>
            )}

            {chartDetail.general_note && (
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">종합 메모</h3>
                <p className="text-sm text-slate-700 leading-relaxed bg-white rounded p-3 border border-slate-200 whitespace-pre-wrap">{chartDetail.general_note}</p>
              </div>
            )}
          </div>
        </div>

        {/* 구강 전반 사진 (general 태그) */}
        {generalImages.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-slate-600 mb-3">구강 전반 사진</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {generalImages.map(img => <ImageCard key={img.dental_image_id} img={img} isShared={isShared} />)}
            </div>
          </div>
        )}

        {/* 치료 전 평가 사진 (assessment 태그) */}
        {assessmentImages.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-slate-600 mb-3">치료 전 평가 사진</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {assessmentImages.map(img => <ImageCard key={img.dental_image_id} img={img} isShared={isShared} />)}
            </div>
          </div>
        )}

        {/* 치료 후 사진 (treatment 태그) */}
        {treatmentImages.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-teal-700 mb-3">치료 후 사진</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {treatmentImages.map(img => <ImageCard key={img.dental_image_id} img={img} isShared={isShared} />)}
            </div>
          </div>
        )}
      </section>

      {/* ── 치아별 상세 소견 ── */}
      <div className="space-y-10">
        {teeth
          .filter(t => t.tooth_id)
          .sort((a,b) => a.tooth_id - b.tooth_id)
          .map(tooth => {
            
            // 이 치아에 태그된 이미지 (치아 번호로 매핑되고, 비교용 태그가 없는 것)
            const toothImages = images.filter(img => 
              img.tooth_ids && img.tooth_ids.includes(String(tooth.tooth_id)) &&
              !img.tooth_ids.includes('general') &&
              !img.tooth_ids.includes('assessment') &&
              !img.tooth_ids.includes('treatment') &&
              !img.tooth_ids.includes('tooth-assessment') &&
              !img.tooth_ids.includes('tooth-treatment')
            )
            // 이 치아에 assessment/treatment 태그도 함께 달린 이미지 (프리픽스 유무 모두 지원)
            const toothAssessment = images.filter(img =>
              img.tooth_ids?.includes(String(tooth.tooth_id)) && 
              (img.tooth_ids?.includes('assessment') || img.tooth_ids?.includes('tooth-assessment') || img.tooth_ids?.includes('tooth-assesment'))
            )
            const toothTreatment = images.filter(img =>
              img.tooth_ids?.includes(String(tooth.tooth_id)) && 
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
                const testDef = DENTAL_TOOTH_TESTS[field]
                if (testDef) {
                  const optDef = testDef.options?.find(o => o.value === val)
                  if (optDef) {
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

            if (findings.length === 0 && allToothImages.length === 0) return null

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
                  
                  {/* 좌: 발견된 소견 및 치료 목록 */}
                  <div className="space-y-5">
                    {(() => {
                      const clinicalFindings = findings.filter(f => f.label !== '치료 (Treatment)')
                      const treatmentFindings = findings.filter(f => f.label === '치료 (Treatment)')
                      
                      return (
                        <>
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

                          {/* 치료 내역 */}
                          {treatmentFindings.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-dashed">
                              <h4 className="text-sm font-semibold text-teal-700">Treatments</h4>
                              <ul className="space-y-1.5">
                                {treatmentFindings.map((f, i) => (
                                  <li key={i} className="text-sm text-teal-900 leading-relaxed bg-teal-50/50 p-2 rounded border border-teal-100">
                                    {f.detail}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>

                  {/* 우: 이미지 갤러리 */}
                  {allToothImages.length > 0 && (
                    <div className="flex flex-col gap-4">
                      {/* 치아별 전/후 비교 */}
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

                      {/* 치아 번호만 태그된 기타 이미지 */}
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
          })}
      </div>
    </div>
  )
}

