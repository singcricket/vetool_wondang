'use client'

import { useState, type ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Camera } from 'lucide-react'
import CheckupImageUploadTab from './checkup-image-upload-tab'
import CheckupImageManageTab from './checkup-image-manage-tab'
import type { CheckupImageTagGroup } from '@/constants/hospital/checkup/checkup-image-tags'

interface Props {
  checkupId: string
  hosId: string
  /** 업로드 시 자동 적용 태그 (병변별 인라인 업로드용) */
  defaultTags?: string[]
  /** 동적 태그 그룹 (피부 병변 목록) */
  dynamicTagGroups?: CheckupImageTagGroup[]
  /** 커스텀 트리거 (기본: 이미지 버튼) */
  trigger?: ReactNode
}

export default function CheckupImageUploadDialog({ checkupId, hosId, defaultTags, dynamicTagGroups, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('upload')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
          >
            <Camera className="h-3.5 w-3.5" />
            이미지
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="flex h-[90vh] max-w-5xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b bg-white px-4 py-3">
          <DialogTitle className="text-sm">검진 이미지 관리</DialogTitle>
          <DialogDescription className="hidden">검진 이미지를 업로드하거나 태그를 관리합니다.</DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={setTab}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="shrink-0 border-b bg-white px-4 py-2">
            <TabsList className="grid w-72 grid-cols-2">
              <TabsTrigger value="upload" className="text-xs">새 이미지 업로드</TabsTrigger>
              <TabsTrigger value="manage" className="text-xs">기존 이미지 관리</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="upload" className="relative m-0 flex-1 overflow-hidden">
            {open && tab === 'upload' && (
              <CheckupImageUploadTab
                checkupId={checkupId}
                hosId={hosId}
                onSuccess={() => setTab('manage')}
                defaultTags={defaultTags}
                dynamicTagGroups={dynamicTagGroups}
              />
            )}
          </TabsContent>

          <TabsContent value="manage" className="relative m-0 flex-1 overflow-hidden">
            {open && tab === 'manage' && (
              <CheckupImageManageTab checkupId={checkupId} dynamicTagGroups={dynamicTagGroups} />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
