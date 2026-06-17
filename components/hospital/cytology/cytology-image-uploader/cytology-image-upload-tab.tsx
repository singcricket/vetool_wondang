'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { X, UploadCloud, Loader2 } from 'lucide-react'
import CytologyTagSelector from './cytology-tag-selector'
import { uploadCytologyImage } from '@/lib/services/cytology/upload-cytology-image'
import { insertCytologyImages } from '@/lib/actions/cytology/cytology-image-actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/utils'

export type StagedCytologyImage = {
  id: string
  file: File
  previewUrl: string
  selected: boolean
  tags: string[]
}

type Props = {
  chartId: string
  hosId: string
  onSuccess?: () => void
}

export default function CytologyImageUploadTab({ chartId, hosId, onSuccess }: Props) {
  const [stagedImages, setStagedImages] = useState<StagedCytologyImage[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // BMP → JPEG 변환 (canvas 이용, quality 0.85)
  function convertBmpToJpeg(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        URL.revokeObjectURL(url)
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error('BMP 변환 실패')); return }
            const newName = file.name.replace(/\.bmp$/i, '.jpg')
            resolve(new File([blob], newName, { type: 'image/jpeg' }))
          },
          'image/jpeg',
          0.85,
        )
      }
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('이미지 로드 실패')) }
      img.src = url
    })
  }

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
      if (pastedFiles.length > 0) void addFiles(pastedFiles)
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [])

  const addFiles = async (files: File[] | FileList) => {
    const fileArray = Array.from(files)
    const converted = await Promise.all(
      fileArray.map((file) =>
        file.type === 'image/bmp' || file.name.toLowerCase().endsWith('.bmp')
          ? convertBmpToJpeg(file)
          : Promise.resolve(file),
      ),
    )
    const newImages: StagedCytologyImage[] = converted.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      selected: false,
      tags: [],
    }))

    setStagedImages((prev) =>
      prev.map((img) => ({ ...img, selected: false }))
          .concat(newImages.map((img) => ({ ...img, selected: true })))
    )
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length) void addFiles(e.dataTransfer.files)
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

  const commonTags = selectedCount > 0 
    ? selectedImages[0].tags.filter(t => selectedImages.every(img => img.tags.includes(t)))
    : []

  const updateSelectedImages = (updater: (img: StagedCytologyImage) => StagedCytologyImage) => {
    setStagedImages(prev => prev.map(img => img.selected ? updater(img) : img))
  }

  const handleSave = async () => {
    if (stagedImages.length === 0) return
    setIsUploading(true)

    try {
      const dbPayload = []
      for (const img of stagedImages) {
        const { url, error } = await uploadCytologyImage(img.file, chartId)
        if (error || !url) throw new Error(error || '업로드 실패')

        dbPayload.push({
          chart_id: chartId,
          hos_id: hosId,
          image_url: url,
          tags: img.tags.join(', ') || null,
        })
      }

      await insertCytologyImages(dbPayload, hosId)
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
            isDragging ? "border-violet-500 bg-violet-50" : "border-slate-200 hover:border-slate-300 shadow-sm"
          )}
        >
          <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files && void addFiles(e.target.files)} />
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
                  img.selected ? "border-violet-500 ring-4 ring-violet-100" : "border-white hover:border-slate-200"
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
          <CytologyTagSelector 
            selectedTags={commonTags}
            onTagsChange={(tags) => updateSelectedImages(img => ({ ...img, tags }))}
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
