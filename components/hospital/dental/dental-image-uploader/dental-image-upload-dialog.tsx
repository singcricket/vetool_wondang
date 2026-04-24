'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Camera } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import DentalImageUploadTab from './dental-image-upload-tab'
import DentalImageManageTab from './dental-image-manage-tab'
import type { DentalChartDetail, DentalTooth } from '@/types/dental/dental-type'

type Props = {
  chartDetail: DentalChartDetail
  teeth: DentalTooth[]
  hosId: string
}

export default function DentalImageUploadDialog({ chartDetail, teeth, hosId }: Props) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('upload')

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={true}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          size="icon" 
          className="fixed bottom-40 right-8 h-12 w-12 rounded-full shadow-lg z-[60] hover:scale-105 transition-transform bg-teal-600 hover:bg-teal-700 text-white"
        >
          <Camera className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-50 z-[110]">
        <DialogHeader className="p-4 border-b bg-white shrink-0">
          <DialogTitle>치과 이미지 모듈</DialogTitle>
          <DialogDescription className="hidden">치과 이미지를 업로드하거나 관리하는 모달입니다.</DialogDescription>
        </DialogHeader>

        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="px-4 py-2 border-b bg-white shrink-0">
            <TabsList className="grid w-80 grid-cols-2">
              <TabsTrigger value="upload">새 이미지 업로드</TabsTrigger>
              <TabsTrigger value="manage">기존 이미지 관리</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="upload" className="flex-1 p-0 m-0 overflow-hidden relative">
            {open && activeTab === 'upload' && (
              <DentalImageUploadTab 
                chartDetail={chartDetail} 
                teeth={teeth} 
                hosId={hosId} 
                onSuccess={() => setActiveTab('manage')} 
              />
            )}
          </TabsContent>

          <TabsContent value="manage" className="flex-1 p-0 m-0 overflow-hidden relative">
            {open && activeTab === 'manage' && (
              <DentalImageManageTab 
                chartDetail={chartDetail} 
                teeth={teeth} 
                hosId={hosId} 
              />
            )}
          </TabsContent>
        </Tabs>
        
      </DialogContent>
    </Dialog>
  )
}
