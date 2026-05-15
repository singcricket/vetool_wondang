'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import type { OncologyCaseFullDetail } from '@/lib/services/oncology/fetch-oncology-case'
import ShareResourceDialog from '@/components/hospital/share/share-resource-dialog'
import AddToCollectionDialog from '@/components/hospital/collections/add-to-collection-dialog'
import OwnerTab1Info from './owner-tab1-info'
import OwnerTab2Schedule from './owner-tab2-schedule'
import OwnerTab3Adverse from './owner-tab3-adverse'
import OwnerTab4Qol from './owner-tab4-qol'
import { createClient } from '@/lib/supabase/client'
import { FolderPlus, Heart, Link, Users } from 'lucide-react'

interface OwnerCaseDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  detail: OncologyCaseFullDetail
}

export default function OwnerCaseDialog({ open, onOpenChange, detail }: OwnerCaseDialogProps) {
  const { case: c, diagnosisInputs, caseProtocols, adverseEvents, qolRecords } = detail
  const diagnosisInput = diagnosisInputs.find((d) => d.input_type === 'text') ?? null

  const [userId, setUserId] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [collectionOpen, setCollectionOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={[
          '!fixed !left-0 !top-0 !translate-x-0 !translate-y-0',
          '!max-w-none w-screen h-[100dvh]',
          'rounded-none border-0 p-0 gap-0',
          'flex flex-col bg-slate-50',
          'data-[state=open]:slide-in-from-bottom-0 data-[state=open]:zoom-in-100',
        ].join(' ')}
      >
        {/* Visually hidden title for accessibility */}
        <DialogTitle className="sr-only">보호자 뷰 — {c.patient.name}</DialogTitle>

        {/* Top bar */}
        <div className="shrink-0 bg-white border-b px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <Users size={15} className="text-indigo-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {c.patient.name} — 보호자 뷰
            </p>
            <p className="text-xs text-slate-400 truncate">{c.diagnosis_name}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCollectionOpen(true)}
              className="h-7 text-xs border-slate-300 text-slate-600 hover:bg-slate-50 gap-1"
            >
              <FolderPlus size={13} />
              컬렉션
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShareOpen(true)}
              className="h-7 text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-50 gap-1"
            >
              <Link size={13} />
              공유
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="tab1" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="shrink-0 w-full rounded-none border-b bg-white h-10 px-2 justify-start gap-0 overflow-x-auto scrollbar-none">
              <TabsTrigger
                value="tab1"
                className="text-xs h-9 px-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700"
              >
                기본 정보
              </TabsTrigger>
              <TabsTrigger
                value="tab2"
                className="text-xs h-9 px-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700"
              >
                항암치료 스케줄
              </TabsTrigger>
              <TabsTrigger
                value="tab3"
                className="text-xs h-9 px-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700"
              >
                증상 모니터링
                {adverseEvents.length > 0 && (
                  <span className="ml-1.5 bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5 rounded-full leading-none">
                    {adverseEvents.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="tab4"
                className="text-xs h-9 px-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700"
              >
                <Heart size={12} className="mr-1" />
                컨디션 기록
                {qolRecords.length > 0 && (
                  <span className="ml-1.5 bg-rose-100 text-rose-700 text-xs px-1.5 py-0.5 rounded-full leading-none">
                    {qolRecords.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-4">
              <TabsContent value="tab1" className="mt-0">
                <OwnerTab1Info caseDetail={c} diagnosisInput={diagnosisInput} />
              </TabsContent>
              <TabsContent value="tab2" className="mt-0">
                <OwnerTab2Schedule caseProtocols={caseProtocols} />
              </TabsContent>
              <TabsContent value="tab3" className="mt-0">
                <OwnerTab3Adverse caseId={c.id} adverseEvents={adverseEvents} />
              </TabsContent>
              <TabsContent value="tab4" className="mt-0">
                <OwnerTab4Qol caseId={c.id} qolRecords={qolRecords} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
    {/* Share dialog */}
    <ShareResourceDialog
      isOpen={shareOpen}
      onOpenChange={setShareOpen}
      resourceType="oncology_owner"
      resourceId={c.id}
      title={`${c.patient.name} — ${c.diagnosis_name} 보호자 뷰`}
      hosId={c.hos_id}
      userId={userId ?? undefined}
    />

    {/* Add to collection dialog */}
    {userId && (
      <AddToCollectionDialog
        isOpen={collectionOpen}
        onOpenChange={setCollectionOpen}
        hosId={c.hos_id}
        userId={userId}
        resourceType="oncology_owner"
        resourceId={c.id}
        resourceTitle={`${c.patient.name} — ${c.diagnosis_name}`}
      />
    )}
  </>
  )
}
