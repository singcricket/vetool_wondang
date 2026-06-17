'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/utils'
import type { OncologyCaseFullDetail } from '@/lib/services/oncology/fetch-oncology-case'
import Tab1Diagnosis from './tab1-diagnosis'
import Tab2Protocol from './tab2-protocol'
import Tab3Dosing from './tab3-dosing'
import Tab4Adverse from './tab4-adverse'
import Tab5Response from './tab5-response'
import Tab6Qol from './tab6-qol'
import OncologyCaseHeaderButtons from './oncology-case-header-buttons'
import OwnerCaseDialog from '../oncology_owner/owner-case-dialog'
import { CalendarDays, Cat, Dog, PawPrint, Stethoscope, User, Users } from 'lucide-react'
import { useOncologyContext } from '@/providers/oncology-context-provider'

const STATUS_LABEL: Record<string, string> = {
  active: '진행 중',
  completed: '완료',
  discontinued: '중단',
  deceased: '사망',
}

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-blue-100 text-blue-800',
  discontinued: 'bg-slate-100 text-slate-700',
  deceased: 'bg-red-100 text-red-800',
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
    today.getMonth() - birthDate.getMonth() +
    (today.getDate() < birthDate.getDate() ? -1 : 0)
  const totalMonths = years * 12 + months
  if (totalMonths < 12) return `${totalMonths}개월`
  const y = Math.floor(totalMonths / 12)
  const m = totalMonths % 12
  return m > 0 ? `${y}세 ${m}개월` : `${y}세`
}

interface OncologyCaseClientProps {
  detail: OncologyCaseFullDetail
  hosId: string
}

export default function OncologyCaseClient({ detail, hosId }: OncologyCaseClientProps) {
  const { case: c, diagnosisInputs, caseProtocols, adverseEvents, responseEvals, qolRecords } = detail
  const p = c.patient
  const [ownerOpen, setOwnerOpen] = useState(false)
  const { vetsList } = useOncologyContext()
  const vetName = vetsList.find((v) => v.user_id === c.vet_id)?.name ?? null

  const diagnosisInput = diagnosisInputs.find((d) => d.input_type === 'text') ?? null
  const documentInput = diagnosisInputs.find((d) => d.input_type === 'document') ?? null

  return (
    <>
    <div className="flex flex-col h-full w-full">
      {/* Case header */}
      <div className="shrink-0 border-b bg-white px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
          {/* Patient info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
              {/^(cat|feline)$/i.test(p.species)
                ? <Cat size={18} className="text-rose-600" />
                : /^(dog|canine)$/i.test(p.species)
                  ? <Dog size={18} className="text-rose-600" />
                  : <PawPrint size={18} className="text-rose-600" />
              }
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base">{p.name}</span>
                <span className="text-xs text-slate-500">
                  {SPECIES_LABEL[p.species] ?? p.species}
                </span>
                {p.breed && <span className="text-xs text-slate-400">{p.breed}</span>}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
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

          {/* Divider */}
          <div className="hidden sm:block w-px h-10 bg-slate-200 self-center" />

          {/* Diagnosis info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-800 text-sm">{c.diagnosis_name}</span>
              {c.stage && (
                <Badge variant="outline" className="text-xs border-slate-300 text-slate-600">
                  Stage {c.stage}
                </Badge>
              )}
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  STATUS_COLOR[c.status] ?? 'bg-slate-100 text-slate-700',
                )}
              >
                {STATUS_LABEL[c.status] ?? c.status}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1">
                <CalendarDays size={11} />
                {c.case_date}
              </span>
              {c.body_weight && <span>{c.body_weight} kg</span>}
              {c.diagnosis_method && c.diagnosis_method.length > 0 && (
                <span>{c.diagnosis_method.join(', ')}</span>
              )}
              {vetName && (
                <span className="flex items-center gap-1">
                  <Stethoscope size={11} />
                  {vetName}
                </span>
              )}
            </div>
          </div>

          {/* Stats chips + action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-xs">
              {caseProtocols.length > 0 && (
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                  프로토콜 {caseProtocols.length}
                </span>
              )}
              {adverseEvents.length > 0 && (
                <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                  부작용 {adverseEvents.length}
                </span>
              )}
              {responseEvals.length > 0 && (
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  평가 {responseEvals.length}
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOwnerOpen(true)}
              className="h-7 text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-50 gap-1"
            >
              <Users size={13} />
              보호자 뷰
            </Button>
            <OncologyCaseHeaderButtons
              caseId={c.id}
              hosId={hosId}
              targetDate={c.case_date}
              patientName={p.name}
              currentStatus={c.status}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="tab1" className="h-full flex flex-col">
          <TabsList className="shrink-0 w-full rounded-none border-b bg-white h-10 px-2 justify-start gap-0 overflow-x-auto scrollbar-none">
            <TabsTrigger value="tab1" className="text-xs h-9 px-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-rose-600 data-[state=active]:text-rose-700">
              진단 & AI 가이드
            </TabsTrigger>
            <TabsTrigger value="tab2" className="text-xs h-9 px-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-rose-600 data-[state=active]:text-rose-700">
              프로토콜 & 스케줄
            </TabsTrigger>
            <TabsTrigger value="tab3" className="text-xs h-9 px-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-rose-600 data-[state=active]:text-rose-700">
              투약 기록
            </TabsTrigger>
            <TabsTrigger value="tab4" className="text-xs h-9 px-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-rose-600 data-[state=active]:text-rose-700">
              부작용 모니터링
              {adverseEvents.length > 0 && (
                <span className="ml-1.5 bg-orange-200 text-orange-800 text-xs px-1.5 py-0.5 rounded-full leading-none">
                  {adverseEvents.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="tab5" className="text-xs h-9 px-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-rose-600 data-[state=active]:text-rose-700">
              치료 반응 평가
              {responseEvals.length > 0 && (
                <span className="ml-1.5 bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full leading-none">
                  {responseEvals.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="tab6" className="text-xs h-9 px-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-rose-600 data-[state=active]:text-rose-700">
              QoL 트래킹
              {qolRecords.length > 0 && (
                <span className="ml-1.5 bg-emerald-100 text-emerald-800 text-xs px-1.5 py-0.5 rounded-full leading-none">
                  {qolRecords.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4">
            <TabsContent value="tab1" className="mt-0">
              <Tab1Diagnosis caseDetail={c} diagnosisInput={diagnosisInput} documentInput={documentInput} />
            </TabsContent>

            <TabsContent value="tab2" className="mt-0">
              <Tab2Protocol caseDetail={c} caseProtocols={caseProtocols} />
            </TabsContent>

            <TabsContent value="tab3" className="mt-0">
              <Tab3Dosing caseId={c.id} caseProtocols={caseProtocols} species={c.patient.species} />
            </TabsContent>

            <TabsContent value="tab4" className="mt-0">
              <Tab4Adverse caseId={c.id} adverseEvents={adverseEvents} caseProtocols={caseProtocols} />
            </TabsContent>

            <TabsContent value="tab5" className="mt-0">
              <Tab5Response caseId={c.id} responseEvals={responseEvals} caseProtocols={caseProtocols} />
            </TabsContent>

            <TabsContent value="tab6" className="mt-0">
              <Tab6Qol caseId={c.id} qolRecords={qolRecords} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>

    <OwnerCaseDialog
      open={ownerOpen}
      onOpenChange={setOwnerOpen}
      detail={detail}
    />
    </>
  )
}
