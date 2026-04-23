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
}

function filterByTag(images: DentalImage[], tag: string) {
  return images.filter(img => img.tooth_ids?.includes(tag))
}

function ImageCard({ img, caption }: { img: DentalImage; caption?: string }) {
  const [editorOpen, setEditorOpen] = useState(false)

  return (
    <>
      <div 
        className="rounded overflow-hidden bg-slate-50 shadow-sm border relative group cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
        onClick={() => setEditorOpen(true)}
      >
        <DentalImageWithMark 
          imageUrl={img.img_url} 
          mark={img.mark} 
          aspectRatio="aspect-square" 
        />
        <div className="p-1.5 bg-white border-t text-[11px] text-slate-600 font-medium">
          <div className="text-center truncate font-bold text-slate-500">
            {img.is_radio ? '방사선 촬영' : caption || '일반 사진'}
          </div>
        </div>
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen} modal={false}>
        <DialogContent 
          className="max-w-[100vw] w-screen h-screen max-h-[100vh] p-0 m-0 border-0 flex flex-col bg-slate-900 rounded-none z-[200]"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <VisuallyHidden>
            <DialogTitle>치과 이미지 에디터</DialogTitle>
            <DialogDescription>이미지 마킹을 확인하거나 수정할 수 있습니다.</DialogDescription>
          </VisuallyHidden>
          
          {editorOpen && (
             <DentalImageEditor 
               imageId={img.dental_image_id} 
               imageUrl={img.img_url} 
               initialMark={img.mark} 
               onClose={() => setEditorOpen(false)}
             />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function DentalReportOwner({ chartDetail, teeth, images, species }: Props) {

  // 이미지 그룹 분류 (글로벌 태그 기준)
  const generalImages    = filterByTag(images, 'general')
  const assessmentImages = filterByTag(images, 'assessment')
  const treatmentImages  = filterByTag(images, 'treatment')

  // recheck 라벨 맵
  const recheckLabel: Record<string, string> = {
    '1month': '1개월 후', '3months': '3개월 후',
    '6months': '6개월 후', '12months': '12개월 후', 'as_needed': '필요시 재방문'
  }

  // 처치 항목
  const procedureList = [
    chartDetail.procedure_scaling   && '스케일링',
    chartDetail.procedure_polishing && '연마',
    chartDetail.procedure_irrigation && '세정',
    chartDetail.procedure_fluoride  && '불소 도포',
    chartDetail.procedure_other     || null,
  ].filter(Boolean) as string[]

  return (
    <div className="space-y-12">

      {/* ── 헤더 ── */}
      <div className="text-center border-b pb-4">
        <h1 className="text-2xl font-bold tracking-widest text-slate-800">
          치과 검진 리포트 (보호자용)
        </h1>
        <p className="text-slate-500 mt-2">
           반려동물 이름: <span className="font-semibold text-slate-700">{chartDetail.patient?.name}</span> | 
           검진 일자: <span className="font-semibold text-slate-700">{chartDetail.chart_date}</span>
        </p>
      </div>

      {/* ── 차트 전반 정보 (dental_charts) ── */}
      <section className="space-y-6 border border-amber-200 rounded-xl p-6 bg-amber-50/30">
        <h2 className="text-base font-bold text-amber-800 border-b border-amber-200 pb-2">
          전체 구강 검진 결과
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 좌: 전반 구강 평가 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-amber-700 mb-2">구강 상태 요약</h3>
            <div className="space-y-3">
              {[
                { field: 'skull_type', label: '두개 유형' },
                { field: 'occlusion', label: '교합 상태' },
                { field: 'crowding', label: '과밀 치열' },
                { field: 'gingivitis_overall', label: '치은염' },
                { field: 'calculus_overall', label: '치석 정도' },
                { field: 'periodontitis_stage', label: '치주염 단계' },
                { field: 'oral_mucosa', label: '구강 점막' },
                { field: 'tongue_eval', label: '혀 상태' },
                { field: 'palate_eval', label: '구개 상태' },
                { field: 'tonsil_eval', label: '편도 상태' },
                { field: 'pharynx_eval', label: '인두 상태' },
                { field: 'salivary_eval', label: '타액선' },
                { field: 'lymph_node_eval', label: '림프절' },
              ].map(({ field, label }) => {
                const value = (chartDetail as any)[field]
                if (!value || value === 'none' || value === 'normal' || value === 'PD0') return null

                // DENTAL_CHART_TESTS에서 보호자용 설명 찾기
                const chartTest = DENTAL_CHART_TESTS[field]
                let detailText = value
                
                if (chartTest) {
                  // generalComment가 있으면 우선 사용 (보호자용)
                  const generalComment = chartTest.generalComment?.[value]
                  const optLabel = chartTest.options?.find(o => o.value === value)?.label
                  detailText = generalComment || optLabel || value
                }

                return (
                  <div key={field} className="flex flex-col gap-1 text-sm">
                    <span className="text-amber-700 font-medium">{chartTest?.testNameKo || label}</span>
                    <span className="text-slate-800 leading-relaxed pl-2 border-l-2 border-amber-200">{detailText}</span>
                  </div>
                )
              })}

              {chartDetail.xray_taken && (
                <div className="flex flex-col gap-1 text-sm">
                  <span className="text-amber-700 font-medium">방사선 소견</span>
                  <span className="text-slate-800 leading-relaxed pl-2 border-l-2 border-amber-200">
                    {chartDetail.xray_findings || '방사선 촬영이 진행되었습니다.'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 우: 처치 / 계획 / 메모 */}
          <div className="space-y-4">
            {procedureList.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-amber-700 mb-2">진행된 처치</h3>
                <div className="flex flex-wrap gap-1.5">
                  {procedureList.map((p, i) => (
                    <span key={i} className="bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded-full font-medium">{p}</span>
                  ))}
                </div>
                {chartDetail.anesthesia && (
                  <p className="text-xs text-slate-500 mt-2">마취: {chartDetail.anesthesia_note || '전신마취 하에 진행되었습니다.'}</p>
                )}
              </div>
            )}

            {chartDetail.treatment_plan && (
              <div>
                <h3 className="text-sm font-semibold text-amber-700 mb-1">향후 치료 계획</h3>
                <p className="text-sm text-slate-700 leading-relaxed bg-white rounded p-3 border border-amber-100 whitespace-pre-wrap">{chartDetail.treatment_plan}</p>
              </div>
            )}

            {chartDetail.homecare_instruction && (
              <div>
                <h3 className="text-sm font-semibold text-amber-700 mb-1">가정 관리 방법</h3>
                <p className="text-sm text-slate-700 leading-relaxed bg-white rounded p-3 border border-amber-100 whitespace-pre-wrap">{chartDetail.homecare_instruction}</p>
              </div>
            )}

            {chartDetail.recheck_interval && (
              <div className="text-sm">
                <span className="text-slate-500">다음 검진 권장: </span>
                <span className="font-semibold text-amber-700">{recheckLabel[chartDetail.recheck_interval] ?? chartDetail.recheck_interval}</span>
              </div>
            )}

            {chartDetail.general_note && (
              <div>
                <h3 className="text-sm font-semibold text-amber-700 mb-1">수의사 메모</h3>
                <p className="text-sm text-slate-700 leading-relaxed bg-white rounded p-3 border border-amber-100 whitespace-pre-wrap">{chartDetail.general_note}</p>
              </div>
            )}
          </div>
        </div>

        {/* 구강 전반 사진 (general 태그) */}
        {generalImages.length > 0 && (
          <div className="border-t border-amber-200 pt-4">
            <h3 className="text-sm font-semibold text-amber-700 mb-3">구강 전반 사진</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {generalImages.map(img => <ImageCard key={img.dental_image_id} img={img} caption="전체 구강" />)}
            </div>
          </div>
        )}

        {/* 치료 전/후 비교 사진 (assessment / treatment 글로벌 태그) */}
        {(assessmentImages.length > 0 || treatmentImages.length > 0) && (
          <div className="border-t border-amber-200 pt-4">
            <h3 className="text-sm font-semibold text-amber-700 mb-3">치료 전후 비교</h3>
            <div className="grid grid-cols-2 gap-4">
              {assessmentImages.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-center bg-slate-200 py-1 rounded text-slate-700 mb-2">치료 전</div>
                  <div className="space-y-2">
                    {assessmentImages.map(img => <ImageCard key={img.dental_image_id} img={img} />)}
                  </div>
                </div>
              )}
              {treatmentImages.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-center bg-teal-100 py-1 rounded text-teal-800 mb-2">치료 후</div>
                  <div className="space-y-2">
                    {treatmentImages.map(img => <ImageCard key={img.dental_image_id} img={img} />)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── 치아별 소견 ── */}
      <div className="space-y-10">
        {teeth
          .filter(t => t.tooth_id)
          .sort((a,b) => a.tooth_id - b.tooth_id)
          .map(tooth => {

            // 이 치아에 번호로만 태그된 이미지 (글로벌 태그 및 비교 태그 제외)
            const toothImages = images.filter(img =>
              img.tooth_ids?.includes(String(tooth.tooth_id)) &&
              !img.tooth_ids.includes('general') &&
              !img.tooth_ids.includes('assessment') &&
              !img.tooth_ids.includes('treatment') &&
              !img.tooth_ids.includes('tooth-assessment') &&
              !img.tooth_ids.includes('tooth-treatment')
            )
            // 이 치아 번호 + assessment / treatment 함께 달린 이미지
            const toothAssessment = images.filter(img =>
              img.tooth_ids?.includes(String(tooth.tooth_id)) && 
              (img.tooth_ids?.includes('assessment') || img.tooth_ids?.includes('tooth-assessment') || img.tooth_ids?.includes('tooth-assesment'))
            )
            const toothTreatment = images.filter(img =>
              img.tooth_ids?.includes(String(tooth.tooth_id)) && 
              (img.tooth_ids?.includes('treatment') || img.tooth_ids?.includes('tooth-treatment'))
            )
            const allToothImages = [...toothImages, ...toothAssessment, ...toothTreatment]

            // 병소 소견 추출 (보호자용: generalComment 위주)
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
                const namePart = abbrev?.definition_kr || abbrev?.definition || code
                const detailText = abbrev?.generalComment
                  ? `${namePart} — ${abbrev.generalComment}`
                  : namePart
                findings.push({
                  label: '치료 내역',
                  detail: detailText
                })
              })
            }

            // 패스 조건: 사진도 없고 소견도 없으면 렌더링 안 함
            if (findings.length === 0 && allToothImages.length === 0) return null

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
                  <div className="flex-1 space-y-5">
                    {(() => {
                      const clinicalFindings = findings.filter(f => f.label !== '치료 내역')
                      const treatmentFindings = findings.filter(f => f.label === '치료 내역')
                      return (
                        <>
                          <div className="space-y-2">
                            <h4 className="text-sm font-bold text-amber-600">수의사 소견</h4>
                            {clinicalFindings.length > 0 ? (
                              <div className="space-y-2">
                                {clinicalFindings.map((f, i) => (
                                  <div key={i} className="bg-slate-50 p-3 rounded text-sm text-slate-700 leading-relaxed border border-slate-100 border-l-2 border-l-amber-300">
                                    {f.detail}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-400">특이 사항이 발견되지 않았습니다.</p>
                            )}
                          </div>

                          {treatmentFindings.length > 0 && (
                            <div className="space-y-2 border-t pt-4">
                              <h4 className="text-sm font-bold text-teal-700">진행된 치료</h4>
                              <div className="space-y-2">
                                {treatmentFindings.map((f, i) => (
                                  <div key={i} className="bg-teal-50 p-3 rounded text-sm text-teal-900 leading-relaxed border border-teal-100 border-l-2 border-l-teal-400">
                                    {f.detail}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>

                  {/* 오른쪽: 이미지 */}
                  {allToothImages.length > 0 && (
                    <div className="flex-1 border-l pl-4 border-slate-100">
                      <div className="flex flex-col gap-4">
                        {/* 치아별 전후 비교 */}
                        {(toothAssessment.length > 0 || toothTreatment.length > 0) && (
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-2">
                              <div className="text-xs font-bold text-center bg-slate-200 py-1 rounded text-slate-700">치료 전</div>
                              {toothAssessment.map(img => (
                                <ImageCard key={img.dental_image_id} img={img} />
                              ))}
                            </div>
                            <div className="flex flex-col gap-2">
                              <div className="text-xs font-bold text-center bg-teal-100 py-1 rounded text-teal-800">치료 후</div>
                              {toothTreatment.map(img => (
                                <ImageCard key={img.dental_image_id} img={img} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 기타 이미지 (치아 번호만 태그) */}
                        {toothImages.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t">
                            {toothImages.map(img => (
                              <ImageCard key={img.dental_image_id} img={img} />
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
    </div>
  )
}
