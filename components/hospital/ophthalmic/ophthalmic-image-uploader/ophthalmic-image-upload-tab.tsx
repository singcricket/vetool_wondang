'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { X, UploadCloud, Loader2 } from 'lucide-react'
import OphthalmicTagSelector from './ophthalmic-tag-selector'
import { uploadOphthalmicImage } from '@/lib/services/ophthalmic/upload-ophthalmic-image'
import { insertOphthalmicImages } from '@/lib/actions/ophthalmic/insert-ophthalmic-images'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/utils'

export type StagedOphImage = {
  id: string
  file: File
  previewUrl: string
  selected: boolean
  tags: string[]
  side: string
}

type Props = {
  chartId: string
  hosId: string
  onSuccess?: () => void
}

export default function OphthalmicImageUploadTab({ chartId, hosId, onSuccess }: Props) {
  const [stagedImages, setStagedImages] = useState<StagedOphImage[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Clipboard Paste Support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      const pastedFiles: File[] = []
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile()
          if (file) pastedFiles.push(file)
        }
      }
      if (pastedFiles.length > 0) addFiles(pastedFiles)
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [])

  const addFiles = (files: File[] | FileList) => {
    const fileArray = Array.from(files)
    const newImages: StagedOphImage[] = fileArray.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      selected: false,
      tags: [],
      side: 'OU',
    }))
    
    setStagedImages((prev) => 
      prev.map(img => ({ ...img, selected: false }))
          .concat(newImages.map(img => ({ ...img, selected: true })))
    )
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  const removeImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setStagedImages(prev => prev.filter(img => img.id !== id))
  }

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    const isMulti = e.ctrlKey || e.metaKey
    setStagedImages(prev => prev.map(img => {
      if (img.id === id) return { ...img, selected: isMulti ? !img.selected : true }
      return isMulti ? img : { ...img, selected: false }
    }))
  }

  const selectedImages = stagedImages.filter(img => img.selected)
  const selectedCount = selectedImages.length

  // Common properties for selected images
  const commonTags = selectedCount > 0 
    ? selectedImages[0].tags.filter(t => selectedImages.every(img => img.tags.includes(t)))
    : []
  const commonSide = selectedCount > 0 && selectedImages.every(img => img.side === selectedImages[0].side)
    ? selectedImages[0].side
    : ''

  const updateSelectedImages = (updater: (img: StagedOphImage) => StagedOphImage) => {
    setStagedImages(prev => prev.map(img => img.selected ? updater(img) : img))
  }

  const handleSave = async () => {
    if (stagedImages.length === 0) return
    setIsUploading(true)

    try {
      const dbPayload = []
      for (const img of stagedImages) {
        const { url, error } = await uploadOphthalmicImage(img.file, chartId)
        if (error || !url) throw new Error(error || '업로드 실패')

        dbPayload.push({
          chart_id: chartId,
          hos_id: hosId,
          img_url: url,
          tags: img.tags,
          side: img.side
        })
      }

      await insertOphthalmicImages(dbPayload, hosId)
      toast.success(`${stagedImages.length}장의 이미지가 저장되었습니다.`)
      setStagedImages([])
      if (onSuccess) onSuccess()
    } catch (e: any) {
      toast.error('저장 중 오류가 발생했습니다.', { description: e.message })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row bg-slate-50/50 h-[70vh]">
      {/* Left: Dropzone & Previews */}
      <div className="flex-1 flex flex-col p-6 overflow-auto border-r h-full">
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer shrink-0 mb-6 bg-white",
            isDragging ? "border-rose-500 bg-rose-50" : "border-slate-200 hover:border-slate-300 shadow-sm"
          )}
        >
          <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files && addFiles(e.target.files)} />
          <UploadCloud className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-600">클릭하거나 파일을 드래그하여 추가하세요</p>
          <p className="text-xs text-slate-400 mt-1">스크린샷 붙여넣기(Ctrl+V) 지원</p>
        </div>

        {stagedImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-10">
            {stagedImages.map((img) => (
              <div 
                key={img.id}
                onClick={(e) => toggleSelect(img.id, e)}
                className={cn(
                  "relative aspect-square rounded-xl overflow-hidden cursor-pointer border-4 transition-all shadow-sm",
                  img.selected ? "border-rose-500 ring-4 ring-rose-100" : "border-white hover:border-slate-200"
                )}
              >
                <img src={img.previewUrl} alt="preview" className="w-full h-full object-cover" />
                <button 
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors"
                  onClick={(e) => removeImage(img.id, e)}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1 pointer-events-none">
                  <span className="text-[9px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-black shadow-sm uppercase">{img.side}</span>
                  {img.tags.map(t => (
                    <span key={t} className="text-[9px] bg-slate-900 text-white px-1.5 py-0.5 rounded font-black shadow-sm">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Settings */}
      <div className="w-full md:w-80 flex flex-col bg-white border-l h-full overflow-y-auto">
        <div className="p-6 bg-slate-50 border-b">
          <h3 className="font-black text-slate-800">이미지 설정</h3>
          <p className="text-xs text-slate-500 mt-1">{selectedCount}개의 이미지 선택됨</p>
        </div>

        <div className={cn("p-6 flex-1", selectedCount === 0 && "opacity-30 pointer-events-none")}>
          <OphthalmicTagSelector 
            selectedTags={commonTags}
            onTagsChange={(tags) => updateSelectedImages(img => ({ ...img, tags }))}
            selectedSide={commonSide}
            onSideChange={(side) => updateSelectedImages(img => ({ ...img, side }))}
          />
        </div>

        <div className="p-6 border-t bg-white mt-auto sticky bottom-0 z-10 shadow-lg">
          <Button 
            onClick={handleSave} 
            disabled={stagedImages.length === 0 || isUploading}
            className="w-full h-12 text-sm font-black bg-slate-900 hover:bg-slate-800"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                업로드 중...
              </>
            ) : (
              `이미지 ${stagedImages.length}장 저장`
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
