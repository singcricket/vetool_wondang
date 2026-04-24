'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import DentalToothSelector from './dental-tooth-selector'
import { Trash2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/utils'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { DialogTitle, DialogDescription } from '@radix-ui/react-dialog'

import type { DentalChartDetail, DentalTooth, DentalImage } from '@/types/dental/dental-type'
import { getDentalImages } from '@/lib/actions/dental/get-dental-images'
import { updateDentalImages } from '@/lib/actions/dental/update-dental-images'
import { deleteDentalImages } from '@/lib/actions/dental/delete-dental-images'

const DentalImageEditor = dynamic(() => import('../dental-image-editor'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center bg-slate-900 text-white">에디터 로딩 중...</div>
})

const DentalImageWithMark = dynamic(() => import('../dental-image-with-mark'), { 
  ssr: false,
  loading: () => <div className="aspect-square bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">Loading...</div>
})

type ManageableImage = DentalImage & { selected?: boolean }

type Props = {
  chartDetail: DentalChartDetail
  teeth: DentalTooth[]
  hosId: string
}

export default function DentalImageManageTab({ chartDetail, teeth, hosId }: Props) {
  const [images, setImages] = useState<ManageableImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [editingImage, setEditingImage] = useState<ManageableImage | null>(null)

  const species = chartDetail.species ?? chartDetail.patient?.species ?? 'canine'

  // 롱클릭(Long Press) 감지용 Ref
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const isLongPressed = useRef(false)

  const fetchImages = async () => {
    setIsLoading(true)
    try {
      const data = await getDentalImages(chartDetail.id)
      setImages(data.map(img => ({ ...img, selected: false })))
    } catch (e: any) {
      toast.error('불러오기 실패', { description: e.message })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchImages()
  }, [chartDetail.id])

  const toggleSelect = (id: string, e: React.MouseEvent | React.TouchEvent) => {
    const isMulti = (e as React.MouseEvent).ctrlKey || (e as React.MouseEvent).metaKey
    setImages(prev => prev.map(img => {
      if (img.dental_image_id === id) {
        return { ...img, selected: isMulti ? !img.selected : true }
      }
      return isMulti ? img : { ...img, selected: false }
    }))
  }

  const selectAll = () => setImages(prev => prev.map(img => ({ ...img, selected: true })))
  const deselectAll = () => setImages(prev => prev.map(img => ({ ...img, selected: false })))

  const selectedCount = images.filter(img => img.selected).length
  const selectedImages = images.filter(img => img.selected)
  
  const commonIsRadio = selectedImages.length > 0 ? selectedImages.every(img => img.is_radio) : false
  const commonToothIds = selectedImages.length > 0 
    ? (selectedImages[0].tooth_ids || []).filter(t => selectedImages.every(img => (img.tooth_ids || []).includes(t)))
    : []
  const commonOtherTags = selectedImages.length > 0
    ? (selectedImages[0].other_tags || []).filter(t => selectedImages.every(img => (img.other_tags || []).includes(t)))
    : []

  const updateSelectedImages = (updater: (img: ManageableImage) => ManageableImage) => {
    setImages(prev => prev.map(img => img.selected ? updater(img) : img))
  }

  const handleIsRadioChange = (checked: boolean) => updateSelectedImages(img => ({ ...img, is_radio: checked }))
  const handleToothIdsChange = (ids: string[]) => updateSelectedImages(img => ({ ...img, tooth_ids: ids }))
  const handleOtherTagsChange = (tags: string[]) => updateSelectedImages(img => ({ ...img, other_tags: tags }))

  const handleSaveUpdates = async () => {
    const toUpdate = images.filter(img => img.selected)
    if (toUpdate.length === 0) return

    setIsProcessing(true)
    try {
      const payload = toUpdate.map(img => {
        const matchedTeethIds = teeth
          .filter(t => (img.tooth_ids || []).includes(String(t.tooth_id)))
          .map(t => t.id)
          .filter((id): id is string => id !== undefined)

        return {
          dental_image_id: img.dental_image_id,
          tooth_ids: img.tooth_ids || [],
          dental_chart_teeth_ids: matchedTeethIds,
          is_radio: img.is_radio,
          other_tags: img.other_tags || []
        }
      })

      await updateDentalImages(payload, hosId)
      toast.success(`${toUpdate.length}장의 설정이 저장되었습니다.`)
      await fetchImages()
    } catch (e: any) {
      toast.error('저장 실패', { description: e.message })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    const toDeleteIds = images.filter(img => img.selected).map(img => img.dental_image_id)
    if (toDeleteIds.length === 0) return
    if (!confirm(`선택한 ${toDeleteIds.length}장의 사진을 삭제하시겠습니까?`)) return

    setIsProcessing(true)
    try {
      await deleteDentalImages(toDeleteIds, hosId)
      toast.success('삭제완료')
      await fetchImages()
    } catch (e: any) {
      toast.error('삭제 실패', { description: e.message })
    } finally {
      setIsProcessing(false)
    }
  }

  // 롱클릭 핸들러들
  const startLongPress = useCallback((img: ManageableImage) => {
    isLongPressed.current = false
    longPressTimer.current = setTimeout(() => {
      isLongPressed.current = true
      setEditingImage(img)
    }, 600) // 600ms 동안 누르면 에디터 열림
  }, [])

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const handleImageClick = (img: ManageableImage, e: React.MouseEvent) => {
    // 만약 롱클릭 상태였다면 클릭(선택) 이벤트 무시
    if (isLongPressed.current) {
      isLongPressed.current = false
      return
    }
    toggleSelect(img.dental_image_id, e)
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-slate-50/50 h-[70vh]">
          
      {/* LEFT PANE: 등록된 이미지 목록 */}
      <div className="flex-1 flex flex-col p-4 overflow-auto border-r h-full relative">
        <div className="flex justify-between items-center mb-4 px-1 shrink-0">
          <h3 className="text-sm font-medium text-slate-700">기존 이미지 보관함 ({images.length})</h3>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7 text-blue-600">전체 선택</Button>
            <Button variant="ghost" size="sm" onClick={deselectAll} className="text-xs h-7 text-slate-500">선택 해제</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-full text-slate-400">데이터를 불러오는 중입니다...</div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
             <Image src="/images/empty-folder.png" alt="empy" width={100} height={100} className="opacity-20 mb-4" />
             <p>아직 저장된 이미지가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto outline-none pb-4 px-1 content-start flex-1">
            {images.map((img) => (
              <div 
                key={img.dental_image_id}
                onMouseDown={() => startLongPress(img)}
                onMouseUp={cancelLongPress}
                onMouseLeave={cancelLongPress}
                onTouchStart={() => startLongPress(img)}
                onTouchEnd={cancelLongPress}
                onClick={(e) => handleImageClick(img, e)}
                className={cn(
                  "group relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-all p-0.5 bg-white select-none",
                  img.selected ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200 ring-offset-1" : "border-slate-200 hover:border-slate-300"
                )}
              >
                <DentalImageWithMark 
                  imageUrl={img.img_url} 
                  mark={img.mark} 
                  aspectRatio="aspect-square" 
                />
                
                <div className="absolute bottom-1 right-1 flex flex-col items-end gap-1 pointer-events-none">
                  {img.is_radio && <span className="text-[9px] bg-yellow-400 text-yellow-950 px-1 rounded font-bold shadow-sm inline-block">X-Ray</span>}
                  {img.tooth_ids && img.tooth_ids.length > 0 && (
                    <span className="text-[10px] bg-slate-800/80 text-white px-1.5 rounded shadow-sm inline-block max-w-full text-center truncate">
                      {img.tooth_ids.slice(0,2).join(',')} {img.tooth_ids.length > 2 && `+${img.tooth_ids.length-2}`}
                    </span>
                  )}
                  {img.other_tags && img.other_tags.length > 0 && (
                    <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 rounded shadow-sm inline-block max-w-full text-center truncate">
                      {img.other_tags[0]} {img.other_tags.length > 1 && `+${img.other_tags.length-1}`}
                    </span>
                  )}
                </div>

                {img.selected && (
                  <div className="absolute top-1 left-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center z-10 shadow">
                    <span className="text-xs font-bold text-wrap leading-none">✓</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT PANE: 태그 관리 및 삭제 */}
      <div className="w-full md:w-80 flex flex-col shrink-0 bg-white border-l h-full relative overflow-hidden">
        <div className="p-4 bg-slate-50 border-b shrink-0">
          <h3 className="font-semibold text-slate-800">일괄 관리 하기</h3>
          <p className="text-xs text-slate-500 mt-1 flex gap-1 bg-amber-50 p-1.5 rounded text-amber-800 my-2">
            <AlertCircle className="w-3.5 h-3.5" /> 선택된 모든 사진의 현재 태그를 완전히 <strong>무시하고 새로 덮어씁니다</strong>.
          </p>
        </div>

        <div className={cn("p-4 flex-1 space-y-6 overflow-y-auto pb-44", selectedCount === 0 && "opacity-40 pointer-events-none")}>
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">방사선 사진 (X-Ray)</Label>
            <Switch checked={commonIsRadio} onCheckedChange={handleIsRadioChange} />
          </div>

          <div className="space-y-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">새로운 치아 번호 지정</Label>
              <p className="text-[10px] text-muted-foreground">목록에서 선택한 치아 번호들로 교체됩니다.</p>
            </div>
            <div className="bg-slate-50 border rounded-lg p-2">
              <DentalToothSelector 
                species={species}
                selectedIds={commonToothIds}
                onChange={handleToothIdsChange}
                otherTags={commonOtherTags}
                onOtherTagsChange={handleOtherTagsChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 하단 전체 액션 바 */}
      <div className="p-4 border-t bg-white shrink-0 w-full h-20 flex absolute bottom-0 left-0 right-0 z-30 items-center shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
        <div className="w-full flex justify-between items-center px-4">
          <div className="text-sm text-slate-500">
            {images.length}개의 이미지 중 <span className="font-bold text-blue-600">{selectedCount}개</span> 선택됨
          </div>
          <div className="flex gap-3">
            <Button 
               variant="outline" 
               className="h-10 px-6 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" 
               onClick={handleDelete}
               disabled={selectedCount === 0 || isProcessing}
            >
               <Trash2 className="w-4 h-4 mr-2" /> 선택 삭제
            </Button>
            <Button onClick={handleSaveUpdates} disabled={selectedCount === 0 || isProcessing} className="h-10 px-8 font-bold">
              {isProcessing ? '처리 중...' : '변경사항 저장'}
            </Button>
          </div>
        </div>
      </div>

      {/* 롱클릭 시 나타날 에디터 다이얼로그 */}
      <Dialog open={!!editingImage} onOpenChange={(open) => !open && setEditingImage(null)} modal={false}>
        <DialogContent 
          className="max-w-[100vw] w-screen h-screen max-h-[100vh] p-0 m-0 border-0 flex flex-col bg-slate-900 rounded-none z-[150]"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
        >
          <VisuallyHidden>
            <DialogTitle>치과 이미지 에디터</DialogTitle>
            <DialogDescription>길게 눌러 열린 에디터입니다.</DialogDescription>
          </VisuallyHidden>
          
          {editingImage && (
             <DentalImageEditor 
               imageId={editingImage.dental_image_id} 
               imageUrl={editingImage.img_url} 
               initialMark={editingImage.mark} 
               onClose={() => {
                 setEditingImage(null)
                 fetchImages() // 편집 후 정보 갱신
               }}
             />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
