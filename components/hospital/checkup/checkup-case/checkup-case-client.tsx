'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils/utils'
import type { CheckupDetail, CheckupStatus } from '@/types/hospital/checkup-type'
import Tab1Inquiry from './tab1-inquiry'
import Tab2Physical from './tab2-physical'
import Tab3Exam from './tab2-exam'
import Tab4Assessment from './tab3-assessment'
import Tab5Summary from './tab4-summary'
import { CalendarDays, Cat, Dog, PawPrint, User } from 'lucide-react'
import { updateCheckupStatus } from '@/lib/actions/checkup/checkup-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import PdfExtractDialog from './pdf-extract-dialog'
import type { PdfExtractionResult } from '@/lib/actions/checkup/pdf-extraction'

const STATUS_LABEL: Record<CheckupStatus, string> = {
  draft: '작성중',
  reviewing: '검토중',
  approved: '완료',
}

const STATUS_COLOR: Record<CheckupStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  reviewing: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
}

const SPECIES_LABEL: Record<string, string> = {
  dog: '개',
  cat: '고양이',
  rabbit: '토끼',
  bird: '조류',
  exotic: '특수동물',
}

function calcAge(birth: string | null): string {
  if (!birth) return '—'
  const birthDate = new Date(birth)
  const today = new Date()
  const years = today.getFullYear() - birthDate.getFullYear()
  const months =
    today.getMonth() - birthDate.getMonth() + (today.getDate() < birthDate.getDate() ? -1 : 0)
  const totalMonths = years * 12 + months
  if (totalMonths < 12) return `${totalMonths}개월`
  const y = Math.floor(totalMonths / 12)
  const m = totalMonths % 12
  return m > 0 ? `${y}세 ${m}개월` : `${y}세`
}

interface Props {
  detail: CheckupDetail
  hosId: string
}

export default function CheckupCaseClient({ detail, hosId }: Props) {
  const { record, sections, aiResult } = detail
  const p = record.patient
  const router = useRouter()
  const [status, setStatus] = useState<CheckupStatus>(record.status)
  const [pdfExtracted, setPdfExtracted] = useState<PdfExtractionResult | null>(null)

  const getSection = (type: string) => sections.find((s) => s.section_type === type)

  const handlePdfApply = (result: PdfExtractionResult) => {
    setPdfExtracted(result)
  }

  const handleStatusChange = async (next: 'reviewing' | 'approved') => {
    try {
      await updateCheckupStatus(record.id, next)
      setStatus(next)
      toast.success(next === 'approved' ? '최종 승인되었습니다.' : '검토 요청되었습니다.')
      router.refresh()
    } catch {
      toast.error('상태 변경에 실패했습니다.')
    }
  }

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b bg-white px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100">
              {/^(cat|feline)$/i.test(p.species) ? (
                <Cat size={18} className="text-teal-600" />
              ) : /^(dog|canine)$/i.test(p.species) ? (
                <Dog size={18} className="text-teal-600" />
              ) : (
                <PawPrint size={18} className="text-teal-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900">{p.name}</span>
                <span className="text-xs text-slate-500">
                  {SPECIES_LABEL[p.species] ?? p.species}
                </span>
                {p.breed && <span className="text-xs text-slate-400">{p.breed}</span>}
              </div>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                <span className="font-mono">{p.hos_patient_id}</span>
                {p.birth && <span>{calcAge(p.birth)}</span>}
                {p.gender && <span>{p.gender}</span>}
                {p.owner_name && (
                  <span className="flex items-center gap-0.5">
                    <User size={11} />
                    {p.owner_name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:ml-auto">
            <PdfExtractDialog
              checkupId={record.id}
              hosId={hosId}
              onApply={handlePdfApply}
            />
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <CalendarDays size={13} />
              {record.checkup_date}
            </div>
            {record.vet_name && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <User size={13} />
                {record.vet_name}
              </div>
            )}
            <span
              className={cn(
                'rounded px-2 py-0.5 text-xs font-semibold',
                STATUS_COLOR[status],
              )}
            >
              {STATUS_LABEL[status]}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="inquiry" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="shrink-0 rounded-none border-b bg-white px-4 justify-start h-10">
          <TabsTrigger value="inquiry" className="text-xs">문진</TabsTrigger>
          <TabsTrigger value="physical" className="text-xs">신체검사</TabsTrigger>
          <TabsTrigger value="exam" className="text-xs">검사결과</TabsTrigger>
          <TabsTrigger value="assessment" className="text-xs">평가·계획</TabsTrigger>
          <TabsTrigger value="summary" className="text-xs">종합소견</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="inquiry" className="m-0 h-full">
            <Tab1Inquiry
              checkupId={record.id}
              section={getSection('inquiry')}
              extractedInquiry={pdfExtracted?.inquiry ?? null}
            />
          </TabsContent>

          <TabsContent value="physical" className="m-0 h-full">
            <Tab2Physical
              checkupId={record.id}
              physicalSection={getSection('physical')}
              extractedPhysical={pdfExtracted?.physical ?? null}
            />
          </TabsContent>

          <TabsContent value="exam" className="m-0 h-full">
            <Tab3Exam
              checkupId={record.id}
              hosId={hosId}
              patientId={record.patient_id}
              patient={p}
              checkupDate={record.checkup_date}
              subCharts={record.sub_charts}
              labSection={getSection('lab')}
              imagingSection={getSection('imaging')}
              extractedLabItems={pdfExtracted?.lab_items ?? null}
            />
          </TabsContent>

          <TabsContent value="assessment" className="m-0 h-full">
            <Tab4Assessment
              checkupId={record.id}
              assessmentSection={getSection('assessment')}
              planSection={getSection('plan')}
            />
          </TabsContent>

          <TabsContent value="summary" className="m-0 h-full">
            <Tab5Summary
              checkupId={record.id}
              aiResult={aiResult}
              status={status}
              onStatusChange={handleStatusChange}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
