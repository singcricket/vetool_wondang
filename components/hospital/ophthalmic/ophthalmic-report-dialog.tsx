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
import { FileText, Printer, Eye, Activity, ClipboardList, AlertTriangle, ShieldCheck, Stethoscope, Pill, Droplets, Scissors, ChevronRight } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ophthalmicReference, ophthalmicTreatmentOptions } from '@/constants/hospital/ophthalmic/ophthalmic_ref'
import type { OphthalmicChartDetail } from '@/types/hospital/ophthalmic-type'
import type { OphEngineOutput, OphTreatmentCategory } from '@/constants/hospital/ophthalmic/ophthalmic_ref'
import { cn } from '@/lib/utils/utils'

interface Props {
  chartDetail: OphthalmicChartDetail
  results: Record<string, string | string[]>
  engineOutput: OphEngineOutput
}

export default function OphthalmicReportDialog({ chartDetail, results, engineOutput }: Props) {
  const patient = chartDetail.patient
  const { 
    diagnoses = [], 
    criticalFindings = [], 
    visionStatus,
    activeSigns = []
  } = engineOutput

  const handlePrint = () => {
    window.print()
  }

  const getVisibleResults = () => {
    const visibleData: any[] = []

    ophthalmicReference.domainSections.forEach((section) => {
      const odResults: any[] = []
      const osResults: any[] = []
      const ouResults: any[] = []

      section.tests.forEach((test) => {
        const val = results[test.testID]
        if (val === undefined || val === null || val === '') return

        let displayValue = ''
        if (test.testType === 'select') {
          const opt = test.options.find(o => o.value === val)
          displayValue = opt ? `${opt.labelKo} (${opt.label})` : String(val)
        } else if (test.testType === 'multiselect' && Array.isArray(val)) {
          displayValue = val.map(v => {
            const opt = test.options.find(o => o.value === v)
            return opt ? `${opt.labelKo} (${opt.label})` : v
          }).join(', ')
        } else if (test.testType === 'boolean') {
          displayValue = val === 'true' ? test.positiveLabelKo : test.negativeLabelKo
        } else if (test.testType === 'range') {
          displayValue = `${val} ${test.unit}`
        } else {
          displayValue = String(val)
        }

        const res = { name: test.testNameKo, value: displayValue }
        if (test.eye === 'OD') odResults.push(res)
        else if (test.eye === 'OS') osResults.push(res)
        else ouResults.push(res)
      })

      if (odResults.length > 0 || osResults.length > 0 || ouResults.length > 0) {
        visibleData.push({
          domain: section.domainNameKo,
          od: odResults,
          os: osResults,
          ou: ouResults
        })
      }
    })

    return visibleData
  }

  const visibleData = getVisibleResults()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50">
          <FileText className="h-4 w-4" />
          리포트 보기
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0 gap-0 no-scrollbar">
        <DialogHeader className="p-6 border-b sticky top-0 bg-white z-20 flex flex-row items-center justify-between space-y-0 shadow-sm">
          <DialogTitle className="flex items-center gap-3 text-2xl font-black text-slate-800">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Eye className="h-6 w-6 text-white" />
            </div>
            안과 정밀 검사 리포트
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2 font-bold shadow-sm">
              <Printer className="h-4 w-4" />
              인쇄하기 (PDF)
            </Button>
          </div>
        </DialogHeader>

        <div className="p-10 space-y-12 print:p-0 bg-white" id="ophthalmic-report-content">
          {/* 1. Patient & Clinic Info */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
            <InfoBlock label="Patient Name" value={patient?.name} />
            <InfoBlock label="Species / Breed" value={`${patient?.species === 'cat' ? '고양이' : '개'} / ${patient?.breed || '-'}`} />
            <InfoBlock label="Gender / Age" value={`${patient?.gender === 'male' ? '수컷' : '암컷'} / ${patient?.birth || '-'}`} />
            <InfoBlock label="Exam Date" value={chartDetail.chart_date} />
            {chartDetail.evaluator?.name && (
              <div className="col-span-full mt-2 pt-4 border-t border-slate-200 flex items-center gap-2 text-slate-600">
                <Stethoscope size={14} className="text-blue-500" />
                <span className="text-xs font-bold uppercase tracking-wider opacity-60 mr-2">Evaluator:</span>
                <span className="text-sm font-black">{chartDetail.evaluator.name}</span>
              </div>
            )}
          </section>

          {/* 2. Executive Summary (Vision & Critical) */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Vision Status
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <VisionBadgeMini eye="OD" status={visionStatus.od} />
                <VisionBadgeMini eye="OS" status={visionStatus.os} />
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Clinical Alerts
              </h3>
              {criticalFindings.length > 0 ? (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-2">
                  {criticalFindings.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm font-bold text-rose-700 leading-tight">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="text-sm font-bold">No critical emergency findings detected.</span>
                </div>
              )}
            </div>
          </section>

          {/* 3. Detailed Examination Table */}
          <section className="space-y-4">
            <h3 className="text-xl font-black text-slate-800 pb-2 border-b-4 border-blue-600 flex items-center gap-3">
              <Activity className="h-6 w-6 text-blue-600" />
              정밀 검사 소견 (Detailed Findings)
            </h3>
            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100/80 hover:bg-slate-100/80">
                    <TableHead className="w-[120px] font-black text-slate-800 text-center border-r">영역 (Domain)</TableHead>
                    <TableHead className="w-1/2 font-black text-blue-700 text-center border-r bg-blue-50/30">OD (우안)</TableHead>
                    <TableHead className="w-1/2 font-black text-orange-700 text-center bg-orange-50/30">OS (좌안)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleData.map((d, idx) => (
                    <TableRow key={idx} className="border-b last:border-0 hover:bg-slate-50/30">
                      <TableCell className="font-black text-slate-900 bg-slate-50 text-center align-top pt-4 border-r">
                        {d.domain}
                      </TableCell>
                      <TableCell className="p-0 align-top border-r">
                        <div className="p-3 space-y-2">
                          {d.od.map((r: any, i: number) => (
                            <ResultRow key={i} name={r.name} value={r.value} color="blue" />
                          ))}
                          {d.ou.map((r: any, i: number) => (
                            <ResultRow key={i} name={r.name} value={r.value} color="slate" isOU />
                          ))}
                          {d.od.length === 0 && d.ou.length === 0 && <p className="text-[10px] text-slate-300 italic text-center py-2">No records</p>}
                        </div>
                      </TableCell>
                      <TableCell className="p-0 align-top">
                        <div className="p-3 space-y-2">
                          {d.os.map((r: any, i: number) => (
                            <ResultRow key={i} name={r.name} value={r.value} color="orange" />
                          ))}
                          {d.ou.map((r: any, i: number) => (
                            <ResultRow key={i} name={r.name} value={r.value} color="slate" isOU />
                          ))}
                          {d.os.length === 0 && d.ou.length === 0 && <p className="text-[10px] text-slate-300 italic text-center py-2">No records</p>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          {/* 4. Diagnostic Assessment */}
          <section className="space-y-6 pt-10 border-t-2 border-slate-100">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
              <ClipboardList className="h-6 w-6 text-blue-600" />
              종합 진단 및 소견 (Assessment)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Diagnoses */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Suspected Diagnoses</h4>
                {diagnoses.length > 0 ? (
                  <div className="space-y-3">
                    {diagnoses.sort((a,b) => b.confidenceScore - a.confidenceScore).map((diag, i) => (
                      <div key={i} className="p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-black text-slate-900">{diag.rule.diagnosisNameKo}</p>
                          <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full">
                            {diag.confidenceScore}%
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">{diag.rule.diagnosisName}</p>
                        <p className="text-xs text-slate-600 leading-relaxed italic mb-3">"{diag.rule.descriptionKo}"</p>
                        {diag.rule.treatmentHintKo && (
                          <div className="mt-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <Stethoscope size={10} />
                              Management / Treatment
                            </p>
                            <p className="text-xs font-bold text-slate-700 leading-normal">{diag.rule.treatmentHintKo}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-slate-50 border border-dashed rounded-2xl text-center">
                    <p className="text-sm text-slate-400 font-bold">임상 소견을 종합한 특정 진단 결과 없음</p>
                  </div>
                )}
              </div>

              {/* Active Signs */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Key Clinical Signs</h4>
                <div className="flex flex-wrap gap-2">
                  {activeSigns.length > 0 ? activeSigns.map((s, i) => (
                    <span key={i} className="text-[10px] font-black bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200">
                      {s.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  )) : (
                    <p className="text-sm text-slate-400 italic">No abnormal signs recorded.</p>
                  )}
                </div>
                
                {/* Treatment Plan Section */}
                {chartDetail.treatment && Object.values(chartDetail.treatment).some(t => t.selectedIds.length > 0 || t.comment) && (
                  <div className="mt-8 pt-8 border-t border-slate-100 space-y-6">
                    <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-indigo-600" />
                      치료 계획 및 처방 (Treatment Plan)
                    </h4>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {Object.entries(chartDetail.treatment).map(([category, data]) => {
                        if (data.selectedIds.length === 0 && !data.comment) return null
                        const cat = category as OphTreatmentCategory
                        const options = ophthalmicTreatmentOptions[cat]
                        
                        return (
                          <div key={category} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                              {cat === 'topical' && <Droplets className="w-3.5 h-3.5 text-blue-500" />}
                              {cat === 'oral' && <Pill className="w-3.5 h-3.5 text-emerald-500" />}
                              {cat === 'procedure' && <Stethoscope className="w-3.5 h-3.5 text-amber-500" />}
                              {cat === 'surgery' && <Scissors className="w-3.5 h-3.5 text-rose-500" />}
                              <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                {cat === 'topical' ? '점안 처방' : cat === 'oral' ? '내복약 처방' : cat === 'procedure' ? '시술' : cat === 'surgery' ? '수술' : '기타 관리'}
                              </h5>
                            </div>

                            {data.selectedIds.length > 0 && options && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {data.selectedIds.map((id: string) => {
                                  const opt = options.find(o => o.id === id)
                                  if (!opt) return null
                                  return (
                                    <div key={id} className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-sm">
                                      <p className="text-xs font-black text-slate-800">{opt.nameKo}</p>
                                      {(data.frequencies?.[id] || opt.frequency) && (
                                        <p className="text-[9px] font-black text-indigo-500">
                                          {data.frequencies?.[id] || opt.frequency}
                                        </p>
                                      )}
                                      <p className="text-[9px] font-bold text-blue-600 italic">{opt.clientTerm}</p>
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            {data.comment && (
                              <div className="bg-white/80 rounded-lg p-2.5 border border-slate-100">
                                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap flex items-start gap-1.5">
                                  <ChevronRight className="w-3 h-3 text-slate-300 mt-0.5 shrink-0" />
                                  {data.comment}
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Legal Disclaimer */}
                <div className="mt-8 p-5 bg-slate-900 rounded-2xl border border-slate-800">
                  <h5 className="text-[10px] font-black text-slate-500 uppercase mb-2">Notice & Disclaimer</h5>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    본 리포트는 Vetool AI 엔진에 의한 자동 생성 분석 결과입니다. 
                    최종 진단 및 치료 계획은 수의사의 임상적 판단에 따라 결정되어야 합니다.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function InfoBlock({ label, value }: { label: string, value: any }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">{label}</p>
      <p className="font-black text-slate-800 text-sm leading-tight">{value || '-'}</p>
    </div>
  )
}

function VisionBadgeMini({ eye, status }: { eye: string, status: string }) {
  const isBlind = status === 'blind'
  const isVisual = status === 'visual'
  const isImpaired = status === 'impaired'

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-3 rounded-xl border transition-all",
      isBlind ? "bg-rose-600 border-rose-600 text-white" :
      isVisual ? "bg-emerald-500 border-emerald-500 text-white" :
      isImpaired ? "bg-amber-500 border-amber-500 text-white" :
      "bg-slate-100 border-slate-200 text-slate-400"
    )}>
      <span className="text-[9px] font-black opacity-80 uppercase mb-0.5">{eye}</span>
      <span className="text-xs font-black uppercase tracking-tight">
        {status === 'visual' ? 'Visual' : status === 'blind' ? 'Blind' : status === 'impaired' ? 'Impaired' : 'N/A'}
      </span>
    </div>
  )
}

function ResultRow({ name, value, color, isOU = false }: { name: string, value: string, color: string, isOU?: boolean }) {
  return (
    <div className={cn(
      "p-2 rounded-lg border text-left",
      color === 'blue' ? "bg-blue-50/50 border-blue-100" : 
      color === 'orange' ? "bg-orange-50/50 border-orange-100" :
      "bg-slate-50 border-slate-100"
    )}>
      <p className="text-[10px] font-bold text-slate-400 mb-0.5 flex items-center justify-between">
        {name}
        {isOU && <span className="bg-purple-100 text-purple-600 px-1 rounded-[2px] text-[8px] uppercase">OU</span>}
      </p>
      <p className={cn(
        "text-[12px] font-black leading-tight",
        color === 'blue' ? "text-blue-800" : 
        color === 'orange' ? "text-orange-800" :
        "text-slate-700"
      )}>{value}</p>
    </div>
  )
}
