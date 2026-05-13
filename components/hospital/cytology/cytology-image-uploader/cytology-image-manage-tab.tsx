'use client'

import React, { useState, useEffect } from 'react'
import { getCytologyImages, deleteCytologyImage, updateCytologyImages } from '@/lib/actions/cytology/cytology-image-actions'
import { Trash2, AlertCircle, Loader2, Microscope, CheckCircle2, Save, Maximize2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/utils'
import CytologyTagSelector from './cytology-tag-selector'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { DialogTitle, DialogDescription } from '@radix-ui/react-dialog'
import dynamic from 'next/dynamic'
const CytologyImageEditor = dynamic(() => import('../cytology-image-editor'), { ssr: false })
const CytologyImageWithMark = dynamic(() => import('../cytology-image-with-mark'), { ssr: false })

type CytologyImage = {
  id: string
  chart_id: string
  hos_id: string | null
  image_url: string
  tags: string | null
  marks: any | null
  created_at: string
}

type ManageableImage = CytologyImage & { selected?: boolean; isDirty?: boolean }

interface Props {
  chartId: string
  hosId: string
}

export default function CytologyImageManageTab({ chartId, hosId }: Props) {
  const [images, setImages] = useState<ManageableImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewImage, setPreviewImage] = useState<ManageableImage | null>(null)
  const [editingImage, setEditingImage] = useState<ManageableImage | null>(null)

  const fetchImages = async () => {
    setIsLoading(true)
    try {
      const data = await getCytologyImages(chartId)
      setImages((data || []).map(img => ({ ...img, selected: false, isDirty: false })) as unknown as ManageableImage[])
    } catch (e: any) {
      toast.error('불러오기 실패', { description: e.message })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchImages()
  }, [chartId])

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    if (e.detail === 2) {
      const img = images.find(i => i.id === id)
      if (img) setPreviewImage(img)
      return
    }

    const isMultiKey = e.ctrlKey || e.metaKey || e.shiftKey
    
    setImages(prev => prev.map(img => {
      if (img.id === id) {
        return { ...img, selected: isMultiKey ? !img.selected : true }
      }
      return isMultiKey ? img : { ...img, selected: false }
    }))
  }

  const selectAll = () => setImages(prev => prev.map(img => ({ ...img, selected: true })))
  const deselectAll = () => setImages(prev => prev.map(img => ({ ...img, selected: false })))

  const selectedCount = images.filter(img => img.selected).length
  const selectedImages = images.filter(img => img.selected)
  
  const commonTags = selectedImages.length > 0 
    ? (selectedImages[0].tags?.split(', ') || []).filter(t => selectedImages.every(img => (img.tags?.split(', ') || []).includes(t)))
    : []

  const updateSelectedImages = (updater: (img: ManageableImage) => ManageableImage) => {
    setImages(prev => prev.map(img => img.selected ? { ...updater(img), isDirty: true } : img))
  }

  const handleTagsChange = (tags: string[]) => updateSelectedImages(img => ({ ...img, tags: tags.join(', ') || null }))

  const handleSaveUpdates = async () => {
    const toUpdate = images.filter(img => img.isDirty)
    if (toUpdate.length === 0) return

    setIsProcessing(true)
    try {
      const payload = toUpdate.map(img => ({
        id: img.id,
        tags: img.tags,
        marks: img.marks
      }))

      await updateCytologyImages(payload, hosId)
      toast.success(`${toUpdate.length}장의 사진 정보가 저장되었습니다.`)
      fetchImages()
    } catch (e: any) {
      toast.error('저장 실패', { description: e.message })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedCount === 0) return
    if (!window.confirm(`선택한 ${selectedCount}장의 이미지를 정말 삭제하시겠습니까?`)) return
    
    setIsProcessing(true)
    try {
      for (const img of selectedImages) {
        await deleteCytologyImage(img.id, img.image_url, hosId)
      }
      toast.success('선택된 이미지가 삭제되었습니다.')
      fetchImages()
    } catch (e: any) {
      toast.error('삭제 실패', { description: e.message })
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading Gallery...</p>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-300">
        <div className="p-6 bg-slate-50 rounded-full">
          <Microscope className="w-12 h-12" />
        </div>
        <div className="text-center">
          <p className="text-lg font-black text-slate-400">저장된 이미지가 없습니다</p>
          <p className="text-sm font-bold text-slate-400/60 mt-1">업로드 탭에서 새로운 사진을 추가해 주세요</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[75vh] overflow-hidden">
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
              Gallery ({images.length})
            </h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll} className="text-[10px] h-7 font-black text-blue-600">전체 선택</Button>
              <Button variant="ghost" size="sm" onClick={deselectAll} className="text-[10px] h-7 font-black text-slate-500">선택 해제</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map((img) => (
              <div 
                key={img.id} 
                onClick={(e) => toggleSelect(img.id, e)}
                className={cn(
                  "group relative aspect-square bg-white rounded-xl border-2 overflow-hidden transition-all cursor-pointer select-none",
                  img.selected ? "border-violet-600 ring-4 ring-violet-50 shadow-md" : "border-slate-200 hover:border-slate-300",
                  img.isDirty && !img.selected && "border-amber-400 shadow-sm shadow-amber-100"
                )}
              >
                <div 
                  className="w-full h-full"
                  onDoubleClick={() => setEditingImage(img)}
                >
                  <CytologyImageWithMark 
                    imageUrl={img.image_url} 
                    marks={img.marks} 
                    aspectRatio="aspect-square"
                    noHover
                  />
                </div>
                
                {img.selected && (
                  <div className="absolute top-2 left-2 bg-violet-600 text-white rounded-full p-0.5 shadow-lg border border-white z-20">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}

                <div className="absolute top-2 right-2 flex gap-1 z-20">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingImage(img); }}
                    className="p-1.5 bg-white/90 backdrop-blur-sm text-slate-600 rounded-lg border border-slate-200 shadow-sm hover:text-violet-600 hover:border-violet-200 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {img.isDirty && (
                    <div className="bg-amber-500 text-white px-1.5 py-1 rounded text-[8px] font-black uppercase tracking-tighter shadow-sm animate-pulse">
                      Modified
                    </div>
                  )}
                </div>

                <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1 z-20">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setPreviewImage(img); }}
                    className="p-1.5 bg-white/90 backdrop-blur-sm text-slate-600 rounded-lg border border-slate-200 shadow-sm hover:text-violet-600 hover:border-violet-200 transition-colors mb-1"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  {img.tags && img.tags.split(', ').length > 0 && (
                    <span className="px-1.5 py-0.5 bg-white/90 backdrop-blur-sm text-slate-600 rounded text-[8px] font-black border border-slate-200 shadow-sm max-w-[80px] truncate">
                      {img.tags.split(', ')[0]} {img.tags.split(', ').length > 1 && `+${img.tags.split(', ').length - 1}`}
                    </span>
                  )}
                </div>

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                   <Maximize2 className="w-6 h-6 text-white drop-shadow-md" />
                   <p className="absolute bottom-2 text-[8px] font-black text-white uppercase tracking-tighter">Double Click to Edit</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-80 border-l bg-white flex flex-col shrink-0 overflow-hidden">
          <div className="p-5 border-b bg-slate-50/50">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">일괄 관리 도구</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Batch Management</p>
          </div>

          <div className={cn(
            "flex-1 overflow-y-auto p-5 space-y-8 transition-opacity",
            selectedCount === 0 ? "opacity-30 pointer-events-none" : "opacity-100"
          )}>
            <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg flex gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
                선택된 {selectedCount}장의 이미지 정보를 한꺼번에 수정합니다.
              </p>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">태그 변경</label>
              <div className="bg-slate-50 border rounded-xl p-4">
                <CytologyTagSelector 
                  selectedTags={commonTags}
                  onTagsChange={handleTagsChange}
                />
              </div>
            </div>
          </div>

          <div className="p-5 border-t bg-slate-50/50 space-y-3">
            <Button 
              className="w-full h-11 font-black uppercase tracking-widest gap-2 bg-slate-900"
              disabled={images.filter(img => img.isDirty).length === 0 || isProcessing}
              onClick={handleSaveUpdates}
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              변경사항 저장 ({images.filter(img => img.isDirty).length})
            </Button>
            <Button 
              variant="outline"
              className="w-full h-11 font-black uppercase tracking-widest gap-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-rose-100"
              disabled={selectedCount === 0 || isProcessing}
              onClick={handleDeleteSelected}
            >
              <Trash2 className="w-4 h-4" />
              선택 삭제 ({selectedCount})
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
          <VisuallyHidden>
            <DialogTitle>이미지 크게 보기</DialogTitle>
            <DialogDescription>선택한 이미지를 크게 확대해서 봅니다.</DialogDescription>
          </VisuallyHidden>
          {previewImage && (
            <img src={previewImage.image_url} alt="preview" className="w-full h-auto rounded-lg shadow-2xl" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
