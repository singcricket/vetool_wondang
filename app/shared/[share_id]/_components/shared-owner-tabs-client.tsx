'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { OncologyCaseFullDetail } from '@/lib/services/oncology/fetch-oncology-case'
import OwnerTab1Info from '@/components/hospital/oncology/oncology_owner/owner-tab1-info'
import OwnerTab2Schedule from '@/components/hospital/oncology/oncology_owner/owner-tab2-schedule'
import OwnerTab3Adverse from '@/components/hospital/oncology/oncology_owner/owner-tab3-adverse'
import OwnerTab4Qol from '@/components/hospital/oncology/oncology_owner/owner-tab4-qol'
import { Cat, Dog, Heart, PawPrint } from 'lucide-react'

interface Props {
  detail: OncologyCaseFullDetail
}

export default function SharedOwnerTabsClient({ detail }: Props) {
  const { case: c, diagnosisInputs, caseProtocols, adverseEvents, qolRecords } = detail
  const diagnosisInput = diagnosisInputs.find((d) => d.input_type === 'text') ?? null
  const p = c.patient

  return (
    <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 bg-indigo-50 border-b border-indigo-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
          {/^(cat|feline)$/i.test(p.species)
            ? <Cat size={18} className="text-indigo-600" />
            : /^(dog|canine)$/i.test(p.species)
              ? <Dog size={18} className="text-indigo-600" />
              : <PawPrint size={18} className="text-indigo-600" />
          }
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 text-base truncate">{p.name}</p>
          <p className="text-xs text-slate-500 truncate">{c.diagnosis_name}</p>
        </div>
        <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-medium shrink-0">
          보호자 뷰 (공유)
        </span>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tab1">
        <TabsList className="w-full rounded-none border-b bg-white h-10 px-2 justify-start gap-0 overflow-x-auto scrollbar-none">
          <TabsTrigger value="tab1" className="text-xs h-9 px-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700">
            기본 정보
          </TabsTrigger>
          <TabsTrigger value="tab2" className="text-xs h-9 px-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700">
            항암치료 스케줄
          </TabsTrigger>
          <TabsTrigger value="tab3" className="text-xs h-9 px-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700">
            증상 모니터링
            {adverseEvents.length > 0 && (
              <span className="ml-1.5 bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5 rounded-full leading-none">
                {adverseEvents.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="tab4" className="text-xs h-9 px-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700">
            <Heart size={12} className="mr-1" />
            컨디션 기록
            {qolRecords.length > 0 && (
              <span className="ml-1.5 bg-rose-100 text-rose-700 text-xs px-1.5 py-0.5 rounded-full leading-none">
                {qolRecords.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="p-4">
          <TabsContent value="tab1" className="mt-0">
            <OwnerTab1Info caseDetail={c} diagnosisInput={diagnosisInput} />
          </TabsContent>
          <TabsContent value="tab2" className="mt-0">
            <OwnerTab2Schedule caseProtocols={caseProtocols} />
          </TabsContent>
          <TabsContent value="tab3" className="mt-0">
            <OwnerTab3Adverse caseId={c.id} adverseEvents={adverseEvents} usePublicAction />
          </TabsContent>
          <TabsContent value="tab4" className="mt-0">
            <OwnerTab4Qol caseId={c.id} qolRecords={qolRecords} usePublicAction />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
