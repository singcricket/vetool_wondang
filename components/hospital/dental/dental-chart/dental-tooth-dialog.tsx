'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toothNames } from '@/constants/hospital/dental/dental_chart_canine_combined'
import type { DentalChartDetail, DentalTooth } from '@/types/dental/dental-type'
import DentalToothForm from './dental-tooth-detail/dental-tooth-form'
import { useRef, useState } from 'react'
import { CameraIcon, ImageIcon, LoaderCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadDentalImage } from '@/lib/services/dental/upload-dental-image'
import { insertDentalImages } from '@/lib/actions/dental/insert-dental-images'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type Props = {
  open: boolean
  onClose: () => void
  toothIds: string[]
  chartDetail: DentalChartDetail
  hosId: string
  existing: DentalTooth | undefined
  teeth: DentalTooth[]
}

export default function DentalToothDialog({
  open, onClose, toothIds, chartDetail, hosId, existing, teeth = []
}: Props) {
  const isMulti = toothIds.length > 1
  const firstId = toothIds[0]
  const toothName = isMulti ? `${toothIds.length}개 치아 선택됨` : (toothNames[firstId] ?? firstId)
  const [isUploading, setIsUploading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const { url, error } = await uploadDentalImage(file, chartDetail.id)
      if (error || !url) throw new Error(error || '업로드 실패')

      await insertDentalImages([{
        chart_id: chartDetail.id,
        tooth_ids: toothIds,
        dental_chart_teeth_ids: (teeth || [])
          .filter(t => t.id && toothIds.includes(String(t.tooth_id)))
          .map(t => t.id as string),
        other_tags: [],
        mark: null,
        img_url: url,
        is_radio: false
      }], hosId)

      toast.success('사진이 등록되었습니다.')
      setRefreshKey(prev => prev + 1)
      router.refresh()
    } catch (err: any) {
      console.error(err)
      toast.error('사진 등록에 실패했습니다.', { description: err.message })
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }} modal={false}>
      <DialogContent 
        className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-0 p-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 border-b px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="flex items-center gap-2">
              <span className="text-lg font-bold">
                {isMulti ? `다중 선택 (${toothIds.length})` : toothIds[0]}
              </span>
              <span className="text-sm font-normal text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]">
                — {isMulti ? toothIds.join(', ') : toothName}
                {isMulti && <span className='ml-2 text-indigo-500 font-bold'>(일괄 입력 모드)</span>}
              </span>
            </DialogTitle>

            <div className="flex items-center gap-2 mr-6">
                {isUploading && (
                  <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 font-medium animate-pulse">
                    <LoaderCircleIcon className="w-3 h-3 animate-spin" />
                    <span className='hidden sm:inline'>저장 중...</span>
                  </div>
                )}
                
                <input 
                  type="file" 
                  ref={cameraInputRef} 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                  onChange={handleImageUpload} 
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="h-8 px-2 flex gap-1.5 border-dashed border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <CameraIcon className="w-4 h-4 text-indigo-500" />
                  <span className="text-[10px] font-bold hidden sm:inline">촬영</span>
                </Button>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload} 
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="h-8 px-2 flex gap-1.5 border-dashed border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <ImageIcon className="w-4 h-4 text-slate-500" />
                  <span className="text-[10px] font-bold hidden sm:inline">추가</span>
                </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <DentalToothForm
            toothIds={toothIds}
            chartDetail={chartDetail}
            hosId={hosId}
            existing={existing}
            onSaved={onClose}
            onCancel={onClose}
            refreshKey={refreshKey}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
