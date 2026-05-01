'use client'
import React, { useState } from 'react'
import type { DentalChartDetail, DentalTooth, DentalImage } from '@/types/dental/dental-type'
import { DENTAL_CHART_TESTS } from '@/constants/hospital/dental/dentalChartTests'
import { Badge } from '@/components/ui/badge'
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

function ImageCard({ img, isShared }: { img: DentalImage; isShared?: boolean }) {
  const [viewerOpen, setViewerOpen] = useState(false)

  return (
    <>
      <div 
        className="border rounded bg-white p-1 shadow-sm group relative cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
        onClick={() => setViewerOpen(true)}
      >
        <DentalImageWithMark 
          imageUrl={img.img_url} 
          mark={img.mark} 
          aspectRatio="aspect-square" 
        />
        {img.is_radio && (
          <span className="absolute top-2 left-2 text-[9px] bg-yellow-400 text-yellow-950 px-1 rounded font-bold pointer-events-none">X-Ray</span>
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

export default function DentalReportGeneral({ chartDetail, teeth, images, species, isShared }: Props) {
  
  // 환자 정보 및 병기 요약
  return (
    <div className="space-y-8">
      <div className="text-center border-b pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-widest text-slate-800">
          Dental Chart (General)
        </h1>
        <p className="text-slate-500 mt-2">
          Patient: <span className="font-semibold text-slate-700">{chartDetail.patient?.name}</span> | 
          Date: <span className="font-semibold text-slate-700">{chartDetail.chart_date}</span>
        </p>
      </div>

      {/* 전체 구강 평가 요약 */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
          <span className="w-2 h-6 bg-indigo-500 rounded-sm mr-2 block"></span>
          Overall Oral Assessment
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
             { key: 'periodontitis_stage', label: 'Overall Stage' },
             { key: 'calculus_overall', label: 'Calculus' },
             { key: 'gingivitis_overall', label: 'Gingivitis' },
             { key: 'occlusion', label: 'Occlusion' },
          ].map(({ key, label }) => {
            const val = (chartDetail as any)[key]
            if (!val || val === 'none' || val === 'normal') return null
            const testDef = DENTAL_CHART_TESTS[key]
            const optDef = testDef?.options?.find(o => o.value === val)
            if (!optDef) return null
            
            return (
              <div key={key} className="bg-slate-50 border rounded p-3">
                <div className="text-xs text-slate-500 font-medium">{label}</div>
                <div className="font-semibold text-sm text-slate-800 mt-1">{optDef.label}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 치아별 이상 소견 (약어 위주) */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
          <span className="w-2 h-6 bg-teal-500 rounded-sm mr-2 block"></span>
          Individual Tooth Findings
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse border border-slate-200">
            <thead className="bg-slate-100/50">
              <tr>
                <th className="border p-2 w-20 font-semibold align-middle text-center">Tooth</th>
                <th className="border p-2 font-semibold align-middle">Findings (Abbreviations)</th>
              </tr>
            </thead>
            <tbody>
              {teeth
                .filter(t => t.tooth_id)
                .sort((a,b) => a.tooth_id - b.tooth_id)
                .map(tooth => {
                
                const findings: string[] = []
                
                // tooth.status 에 따라 (예: ANO, FE)
                if (tooth.status && tooth.status !== 'present') {
                  findings.push(tooth.status)
                }

                // 치주/병변 검사항목 추출
                const toothFields = [
                  'periodontal_stage', 'gingivitis', 'calculus', 'mobility', 'furcation',
                  'fracture', 'pulp_exposure', 'caries', 'resorption_stage', 'resorption_type', 'staining', 'attrition', 'abrasion', 'periapical'
                ]

                toothFields.forEach(field => {
                  const val = (tooth as any)[field]
                  if (val && val !== 'none' && val !== 'normal' && val !== 'PD0') {
                    findings.push(String(val).toUpperCase())
                  }
                })
                
                // 치료 내역 (treatment_done)
                if (tooth.treatment_done && Array.isArray(tooth.treatment_done)) {
                  tooth.treatment_done.forEach(code => {
                    findings.push(code)
                  })
                }

                // 추출된 소견이 없으면 표시 패스 
                if (findings.length === 0) return null

                return (
                  <tr key={tooth.tooth_id} className="hover:bg-slate-50">
                    <td className="border p-2 text-center font-bold">
                      {tooth.tooth_id}
                    </td>
                    <td className="border p-2 flex flex-wrap gap-1.5">
                      {findings.map((f, i) => (
                        <Badge key={i} variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50/50 font-mono">
                          {f}
                        </Badge>
                      ))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 이미지 갤러리 */}
      {images.length > 0 && (
        <section className="pt-4 border-t">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <span className="w-2 h-6 bg-blue-500 rounded-sm mr-2 block"></span>
            Dental Images
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map(img => (
              <ImageCard key={img.dental_image_id} img={img} isShared={isShared} />
            ))}
          </div>
        </section>
      )}
      
    </div>
  )
}
