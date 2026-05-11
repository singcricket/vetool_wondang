'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Camera, Image as ImageIcon, Upload } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import OphthalmicImageUploadTab from './ophthalmic-image-upload-tab'
import OphthalmicImageManageTab from './ophthalmic-image-manage-tab'

interface Props {
  chartId: string
  hosId: string
}

export default function OphthalmicImageUploadDialog({ chartId, hosId }: Props) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('upload')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="fixed bottom-10 right-20 z-50 group flex items-center gap-3">
          <div className="flex items-center justify-center w-16 h-16 bg-rose-600 text-white rounded-full shadow-2xl transition-all group-hover:scale-110 group-hover:bg-rose-700 active:scale-95 border-4 border-white">
            <Camera className="w-8 h-8" />
          </div>
          <span className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black shadow-xl opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 pointer-events-none">
            안과 사진 업로드
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden bg-white">
        <DialogHeader className="p-6 border-b bg-slate-50/80 backdrop-blur-md">
          <DialogTitle className="flex items-center gap-3 text-2xl font-black text-slate-900">
            <div className="p-2 bg-rose-600 rounded-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
            Ophthalmic Image Hub
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 py-2 bg-slate-50 border-b">
            <TabsList className="bg-transparent gap-6">
              <TabsTrigger 
                value="upload" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-rose-600 rounded-none px-1 pb-2 font-black text-xs uppercase tracking-widest text-slate-400 data-[state=active]:text-rose-600 transition-all"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Photos
              </TabsTrigger>
              <TabsTrigger 
                value="manage"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-rose-600 rounded-none px-1 pb-2 font-black text-xs uppercase tracking-widest text-slate-400 data-[state=active]:text-rose-600 transition-all"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Gallery & Manage
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="upload" className="m-0 border-none">
            <OphthalmicImageUploadTab 
              chartId={chartId} 
              hosId={hosId} 
              onSuccess={() => setActiveTab('manage')} 
            />
          </TabsContent>
          
          <TabsContent value="manage" className="m-0 border-none">
            <OphthalmicImageManageTab 
              chartId={chartId} 
              hosId={hosId} 
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
