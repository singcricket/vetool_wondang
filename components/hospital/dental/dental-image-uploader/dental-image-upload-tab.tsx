'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { X, UploadCloud } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import DentalToothSelector from './dental-tooth-selector'
import { uploadDentalImage } from '@/lib/services/dental/upload-dental-image'
import { insertDentalImages } from '@/lib/actions/dental/insert-dental-images'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { DentalChartDetail, DentalTooth } from '@/types/dental/dental-type'
import { cn } from '@/lib/utils/utils'

export type StagedImage = {
  id: string
  file: File
  previewUrl: string
  selected: boolean
  tooth_ids: string[]
  is_radio: boolean
  other_tags: string[]
}

type Props = {
  chartDetail: DentalChartDetail
  teeth: DentalTooth[]
  hosId: string
  onSuccess?: () => void
}

export default function DentalImageUploadTab({ chartDetail, teeth, hosId, onSuccess }: Props) {
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const species = chartDetail.species ?? chartDetail.patient?.species ?? 'canine'

  // 클립보드 붙여넣기 이벤트 감지
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

      if (pastedFiles.length > 0) {
        addFiles(pastedFiles)
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [])

  // 파일 추가 공통 로직
  const addFiles = (files: File[] | FileList) => {
    const newImages: StagedImage[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      selected: false,
      tooth_ids: [],
      is_radio: false,
      other_tags: [],
    }))
    
    // 새로 들어온 파일들만 선택되게 설정
    setStagedImages((prev) => prev.map(img => ({ ...img, selected: false })).concat(newImages.map(img => ({ ...img, selected: true }))))
  }

  // 드래그 앤 드롭
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
    }
  }

  // 제거
  const removeImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setStagedImages(prev => {
      const updated = prev.filter((img) => img.id !== id)
      // 만약 모두 삭제됐다면 input 초기화
      if (updated.length === 0 && fileInputRef.current) {
         fileInputRef.current.value = ''
      }
      return updated
    })
  }

  // 선택 토글
  const toggleSelect = (id: string) => {
    setStagedImages(prev => prev.map((img) => 
      img.id === id ? { ...img, selected: !img.selected } : img
    ))
  }
  const selectAll = () => setStagedImages(prev => prev.map(img => ({ ...img, selected: true })))
  const deselectAll = () => setStagedImages(prev => prev.map(img => ({ ...img, selected: false })))

  // -- 공통 태그 적용 (현재 선택된 이미지들에 반영) --
  const selectedCount = stagedImages.filter(img => img.selected).length
  
  // 선택된 이미지들이 공통으로 가진 값들을 뽑아 UI에 보여주기 위함
  const selectedImages = stagedImages.filter(img => img.selected)
  const commonIsRadio = selectedImages.length > 0 ? selectedImages.every(img => img.is_radio) : false
  // 교집합 치아들 추출 (간단하게 첫 이미지의 치아를 기준으로 교집합 판별)
  const commonToothIds = selectedImages.length > 0 
    ? selectedImages[0].tooth_ids.filter(t => selectedImages.every(img => img.tooth_ids.includes(t)))
    : []

  const commonOtherTags = selectedImages.length > 0
    ? selectedImages[0].other_tags.filter(t => selectedImages.every(img => img.other_tags.includes(t)))
    : []

  const updateSelectedImages = (updater: (img: StagedImage) => StagedImage) => {
    setStagedImages(prev => prev.map(img => img.selected ? updater(img) : img))
  }

  const handleIsRadioChange = (checked: boolean) => {
    updateSelectedImages(img => ({ ...img, is_radio: checked }))
  }

  const handleToothIdsChange = (ids: string[]) => {
    // 덮어씌우기 (또는 합집합으로 처리할 수도 있지만, 직관성을 위해 덮어씌움)
    updateSelectedImages(img => ({ ...img, tooth_ids: ids }))
  }

  const handleOtherTagsChange = (tags: string[]) => {
    updateSelectedImages(img => ({ ...img, other_tags: tags }))
  }

  // 최종 저장
  const handleSave = async () => {
    if (stagedImages.length === 0) return
    setIsUploading(true)

    try {
      const dbPayload = []

      // 1. Storage 업로드 및 URL 획득
      for (const img of stagedImages) {
        const { url, error } = await uploadDentalImage(img.file, chartDetail.id)
        if (error || !url) throw new Error(error || '업로드 실패')

        // 2. 외래키(dental_chart_teeth_ids) 매핑
        const matchedTeethIds = teeth
          .filter(t => img.tooth_ids.includes(String(t.tooth_id)))
          .map(t => t.id)
          .filter((id): id is string => id !== undefined)

        dbPayload.push({
          chart_id: chartDetail.id,
          tooth_ids: img.tooth_ids,
          dental_chart_teeth_ids: matchedTeethIds,
          other_tags: img.other_tags,
          mark: null, // 초기엔 마크 없음
          img_url: url,
          is_radio: img.is_radio
        })
      }

      // 3. DB Insert
      await insertDentalImages(dbPayload, hosId)

      toast.success(`${stagedImages.length}장의 이미지가 성공적으로 저장되었습니다.`)
      setStagedImages([])
      if (onSuccess) onSuccess()

    } catch (e: any) {
      toast.error('저장 중 오류가 발생했습니다.', { description: e.message })
    } finally {
      setIsUploading(false)
    }
  }

  return (
        <div className="flex-1 flex flex-col md:flex-row bg-slate-50/50 h-[70vh]">
          
          {/* LEFT PANE: 드롭존 및 이미지 목록 */}
          <div className="flex-1 flex flex-col p-4 overflow-auto border-r h-full">
            
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 transition-colors cursor-pointer shrink-0 mb-4",
                isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:bg-slate-50 relative bg-white"
              )}
            >
              <Input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => e.target.files && addFiles(e.target.files)}
              />
              <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
              <p className="text-sm font-medium text-slate-700">클릭 또는 파일 드래그 & 드롭</p>
              <p className="text-xs text-slate-500 mt-1 hidden sm:block">클립보드 스크린샷 붙여넣기(Ctrl+V) 지원</p>
            </div>

            {stagedImages.length > 0 && (
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-2 px-1 shrink-0">
                  <h3 className="text-sm font-medium text-slate-700">추가된 이미지 ({stagedImages.length})</h3>
                  <div className="flex gap-2">
                     <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7 text-blue-600">전체 선택</Button>
                     <Button variant="ghost" size="sm" onClick={deselectAll} className="text-xs h-7 text-slate-500">선택 해제</Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto outline-none pb-4 px-1 content-start">
                  {stagedImages.map((img) => (
                    <div 
                      key={img.id}
                      onClick={() => toggleSelect(img.id)}
                      className={cn(
                        "group relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-all p-0.5",
                        img.selected ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200 ring-offset-1" : "border-transparent bg-slate-100 hover:border-slate-300"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={img.previewUrl} 
                        alt="preview" 
                        className="w-full h-full object-cover rounded-sm"
                      />
                      <button 
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => removeImage(img.id, e)}
                      >
                        <X className="w-3 h-3" />
                      </button>
                      
                      {/* Tags indicator */}
                      <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-1 pointer-events-none">
                        {img.is_radio && <span className="text-[9px] bg-yellow-400 text-yellow-950 px-1 rounded font-bold shadow-sm">X-Ray</span>}
                        {img.tooth_ids.slice(0, 3).map(id => (
                          <span key={id} className="text-[9px] bg-slate-800/80 text-white px-1 rounded shadow-sm">{id}</span>
                        ))}
                        {img.tooth_ids.length > 3 && <span className="text-[9px] bg-slate-800/80 text-white px-1 rounded shadow-sm">+{img.tooth_ids.length-3}</span>}
                        {img.other_tags && img.other_tags.length > 0 && (
                          <span className="text-[9px] bg-slate-200 text-slate-800 px-1 rounded shadow-sm">{img.other_tags[0]} {img.other_tags.length>1 && `+${img.other_tags.length-1}`}</span>
                        )}
                      </div>

                      {/* Selected check */}
                      {img.selected && (
                        <div className="absolute top-1 left-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                          <span className="text-xs font-bold text-wrap leading-none">✓</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANE: 태그 지정 및 설정 영역 */}
          <div className="w-full md:w-80 flex flex-col shrink-0 bg-white border-l h-full overflow-y-auto">
            <div className="p-4 bg-slate-50 border-b">
              <h3 className="font-semibold text-slate-800">선택된 이미지 설정</h3>
              <p className="text-xs text-slate-500 mt-1">
                {selectedCount}개 선택됨. 아래 설정을 변경하면 선택된 모든 이미지에 일괄 적용됩니다.
              </p>
            </div>

            <div className={cn("p-4 flex-1 space-y-6", selectedCount === 0 && "opacity-40 pointer-events-none")}>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">방사선 사진 (X-Ray)</Label>
                  <p className="text-[11px] text-muted-foreground">이 이미지들이 방사선 촬영물입니까?</p>
                </div>
                <Switch 
                  checked={commonIsRadio} 
                  onCheckedChange={handleIsRadioChange} 
                />
              </div>

              <div className="space-y-3">
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

              {/* 추가 태그 등 확장 가능한 공간 */}
            </div>
            
          </div>
        
        {/* 액션 컨트롤러 */}
        <div className="p-4 border-t bg-white shrink-0 mt-auto w-full col-span-2 md:w-auto h-20 flex absolute bottom-0 left-0 right-0 z-10 border-t items-center shadow-lg">
          <div className="w-full flex justify-between items-center px-2">
            <div className="text-sm text-slate-500">
               총 {stagedImages.length}개의 임시 이미지
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleSave} 
                disabled={stagedImages.length === 0 || isUploading}
                className="w-32"
              >
                {isUploading ? '업로드 중...' : '클라우드 저장'}
              </Button>
            </div>
          </div>
        </div>

      </div>
  )
}

