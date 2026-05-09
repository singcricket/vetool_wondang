'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileText, Printer, BrainCircuit, Activity, MapPin } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { neuroReference } from '@/constants/hospital/physical-exam/neuro/neuro_ref'
import type { NeuroChartDetail } from '@/types/hospital/neuro-type'

interface Props {
  chartDetail: NeuroChartDetail
  results: Record<string, string | string[]>
  localisations: any
}

export default function NeuroReportDialog({ chartDetail, results, localisations }: Props) {
  const patient = chartDetail.patient
  const { 
    localisationCandidates: candidates = [], 
    detectedSyndromes: syndromes = [],
    cerebralLateralisation = null 
  } = localisations

  const handlePrint = () => {
    window.print()
  }

  // 결과값이 있는 테스트들만 추출
  const getVisibleResults = () => {
    const visibleData: any[] = []

    neuroReference.domainSections.forEach((section) => {
      const sectionResults: any[] = []
      
      section.tests.forEach((test) => {
        const val = results[test.testID]
        if (val === undefined || val === null || val === '') return

        // 결과값의 한글(영어) 라벨 찾기
        let displayValue = ''
        if (test.testType === 'select' || test.testType === 'grade') {
          const options = (test as any).options || (test as any).grades?.map((g: any) => ({ value: String(g.grade), label: g.label, labelKo: g.labelKo }))
          const opt = options?.find((opt: any) => opt.value === val)
          displayValue = opt ? `${opt.labelKo} (${opt.label})` : String(val)
        } else if (test.testType === 'multiselect' && Array.isArray(val)) {
          const options = (test as any).options
          displayValue = val.map(v => {
            const opt = options.find((opt: any) => opt.value === v)
            return opt ? `${opt.labelKo} (${opt.label})` : v
          }).join(', ')
        } else if (test.testType === 'boolean') {
          const t = test as any
          displayValue = val === 'true' 
            ? `${t.positiveResultTextKo} (${t.positiveResultText})` 
            : `${t.negativeResultTextKo} (${t.negativeResultText})`
        } else {
          displayValue = String(val)
        }

        sectionResults.push({
          name: `${test.testNameKo} (${test.testName})`,
          value: displayValue,
        })
      })

      if (sectionResults.length > 0) {
        visibleData.push({
          domain: section.domainNameKo,
          results: sectionResults
        })
      }
    })

    return visibleData
  }

  const visibleData = getVisibleResults()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800">
          <FileText className="h-4 w-4" />
          리포트 보기
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-6 border-b sticky top-0 bg-white z-10 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ClipboardList className="h-6 w-6 text-indigo-600" />
            신경학적 검사 리포트
          </DialogTitle>
          <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2">
            <Printer className="h-4 w-4" />
            인쇄하기
          </Button>
        </DialogHeader>

        <div className="p-8 space-y-10 print:p-0" id="neuro-report-content">
          {/* 1. Patient Info */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Patient Name</p>
              <p className="font-bold text-slate-900">{patient?.name || '-'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Species / Breed</p>
              <p className="text-sm">{patient?.species === 'cat' ? '고양이' : '개'} / {patient?.breed || '-'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Gender / Age</p>
              <p className="text-sm">{patient?.gender === 'male' ? '수컷' : '암컷'} / {patient?.birth || '-'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Exam Date</p>
              <p className="text-sm">{chartDetail.chart_date}</p>
            </div>
          </section>

          {/* 2. Examination Findings Table */}
          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b-2 border-indigo-500 flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              검사 소견 (Examination Findings)
            </h3>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-[150px] font-bold text-slate-700">영역 (Domain)</TableHead>
                  <TableHead className="font-bold text-slate-700">검사 항목 (Test)</TableHead>
                  <TableHead className="font-bold text-slate-700">결과 (Result)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleData.map((domainData, dIdx) => (
                  <React.Fragment key={dIdx}>
                    {domainData.results.map((res: any, rIdx: number) => (
                      <TableRow key={`${dIdx}-${rIdx}`}>
                        {rIdx === 0 && (
                          <TableCell 
                            rowSpan={domainData.results.length} 
                            className="font-bold text-slate-900 align-top bg-slate-50/30"
                          >
                            {domainData.domain}
                          </TableCell>
                        )}
                        <TableCell className="text-slate-700">{res.name}</TableCell>
                        <TableCell className="font-medium text-indigo-700">{res.value}</TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </section>

          {/* 3. Analysis Panel */}
          <section className="space-y-6 pt-6 border-t-2 border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-indigo-600" />
              종합 분석 결과 (Analysis Report)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Syndromes */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-rose-700 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  감지된 증후군
                </h4>
                {syndromes.length > 0 ? (
                  <div className="space-y-2">
                    {syndromes.map((syn: any) => (
                      <div key={syn.syndromeID} className="p-3 bg-rose-50 border border-rose-100 rounded-lg">
                        <p className="font-bold text-rose-900 text-sm">{syn.nameKo}</p>
                        <p className="text-xs text-rose-700 mt-1">{syn.interpretationKo}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">감지된 특정 증후군 없음</p>
                )}
              </div>

              {/* Localisation */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-indigo-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  예상 병변 위치
                </h4>
                {candidates.length > 0 ? (
                  <div className="space-y-2">
                    {candidates.map((loc: any, idx: number) => (
                      <div key={idx} className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                        <div className="flex justify-between items-center">
                          <p className="font-bold text-indigo-900 text-sm">{loc.locationNameKo || loc.location}</p>
                          <span className="text-[10px] font-bold bg-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded-full">
                            {loc.confidenceScore}% match
                          </span>
                        </div>
                        {loc.differentials && (
                          <p className="text-[10px] text-slate-500 mt-1">DDx: {loc.differentials.join(', ')}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">국소화 데이터 부족</p>
                )}
              </div>
            </div>

            {/* Cerebral Lateralisation */}
            {cerebralLateralisation && cerebralLateralisation.hemisphere !== 'undetermined' && (
              <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl">
                <h4 className="text-sm font-bold text-violet-700 flex items-center gap-2 mb-2">
                  <BrainCircuit className="h-4 w-4" />
                  대뇌 반구 편측화 분석
                </h4>
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1 bg-violet-600 text-white rounded font-bold text-sm">
                    {cerebralLateralisation.hemisphere === 'left' ? '좌측 반구 병변 의심' : 
                     cerebralLateralisation.hemisphere === 'right' ? '우측 반구 병변 의심' : '양측성 병변 의심'}
                  </div>
                  <p className="text-xs text-violet-800 leading-tight">
                    {cerebralLateralisation.summaryKo.split('\n')[1]}
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ClipboardList(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  )
}
