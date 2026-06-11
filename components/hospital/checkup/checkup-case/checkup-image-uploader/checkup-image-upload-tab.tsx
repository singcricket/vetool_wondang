'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { X, UploadCloud, Sparkles, Star, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/utils'
import { uploadCheckupImage, fileToSmallBase64 } from '@/lib/services/checkup/upload-checkup-image'
import { insertCheckupImages, suggestCheckupImageTags } from '@/lib/actions/checkup/checkup-image-actions'
import {
  CHECKUP_TAG_LABEL,
  TAG_COLOR_CLASS,
  getTagColor,
  type CheckupImageTagGroup,
} from '@/constants/hospital/checkup/checkup-image-tags'
import CheckupImageTagSelector from './checkup-image-tag-selector'

type StagedImage = {
  id: string
  file: File
  previewUrl: string
  selected: boolean
  tags: string[]
  isCover: boolean
}

interface Props {
  checkupId: string
  hosId: string
  onSuccess?: () => void
  defaultTags?: string[]
  dynamicTagGroups?: CheckupImageTagGroup[]
}

export default function CheckupImageUploadTab({ checkupId, hosId, onSuccess, defaultTags, dynamicTagGroups }: Props) {
  const [staged, setStaged] = useState<StagedImage[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [tagSheetOpen, setTagSheetOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const files: File[] = []
      for (let i = 0; i < (e.clipboardData?.items.length ?? 0); i++) {
        const item = e.clipboardData!.items[i]
        if (item.type.startsWith('image/')) {
          const f = item.getAsFile()
          if (f) files.push(f)
        }
      }
      if (files.length > 0) addFiles(files)
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [])

  const addFiles = (files: File[] | FileList) => {
    const arr = Array.from(files)
    const newImages: StagedImage[] = arr.map((file) => ({
      id: Math.random().toString(36).slice(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      selected: true,
      tags: defaultTags ? [...defaultTags] : [],
      isCover: false,
    }))
    setStaged((prev) =>
      prev.map((img) => ({ ...img, selected: false })).concat(newImages),
    )
  }

  const remove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setStaged((prev) => prev.filter((img) => img.id !== id))
  }

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    const multi = e.ctrlKey || e.metaKey
    setStaged((prev) =>
      prev.map((img) => {
        if (img.id === id) return { ...img, selected: multi ? !img.selected : true }
        return multi ? img : { ...img, selected: false }
      }),
    )
  }

  const selectedImages = staged.filter((img) => img.selected)
  const commonTags = selectedImages.length > 0
    ? selectedImages[0].tags.filter((t) => selectedImages.every((img) => img.tags.includes(t)))
    : []
  const commonCover = selectedImages.length > 0 && selectedImages.every((img) => img.isCover)

  const updateSelected = (updater: (img: StagedImage) => StagedImage) => {
    setStaged((prev) => prev.map((img) => (img.selected ? updater(img) : img)))
  }

  const handleTagsChange = (tags: string[]) => {
    updateSelected((img) => ({ ...img, tags }))
  }

  const handleCoverChange = (checked: boolean) => {
    updateSelected((img) => ({ ...img, isCover: checked }))
  }

  const handleAiTag = async () => {
    if (selectedImages.length === 0) return
    setIsAiLoading(true)
    try {
      const results = await Promise.all(
        selectedImages.map(async (img) => {
          const { base64, mimeType } = await fileToSmallBase64(img.file)
          const suggested = await suggestCheckupImageTags(base64, mimeType)
          return { id: img.id, suggested }
        }),
      )
      setStaged((prev) =>
        prev.map((img) => {
          const res = results.find((r) => r.id === img.id)
          if (!res) return img
          const merged = Array.from(new Set([...img.tags, ...res.suggested]))
          return { ...img, tags: merged }
        }),
      )
      toast.success('AI 태그 추천이 적용되었습니다.')
    } catch {
      toast.error('AI 태그 분석에 실패했습니다.')
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleSave = async () => {
    if (staged.length === 0) return
    setIsUploading(true)
    try {
      const payload: { checkup_id: string; hos_id: string; img_url: string; tags: string[]; is_cover: boolean }[] = []
      for (const img of staged) {
        const { url, error } = await uploadCheckupImage(img.file, checkupId)
        if (error || !url) throw new Error(error ?? '업로드 실패')
        payload.push({ checkup_id: checkupId, hos_id: hosId, img_url: url, tags: img.tags, is_cover: img.isCover })
      }
      await insertCheckupImages(payload)
      toast.success(`${staged.length}장이 저장되었습니다.`)
      setStaged([])
      onSuccess?.()
    } catch (e: any) {
      toast.error('저장 실패', { description: e.message })
    } finally {
      setIsUploading(false)
    }
  }

  // ── 태그 패널 내용 (데스크톱 오른쪽 + 모바일 Sheet 공용) ─────────
  const TagPanelContent = (
    <div className={cn('flex-1 space-y-4 overflow-y-auto p-3 pb-6', selectedImages.length === 0 && 'pointer-events-none opacity-40')}>
      {/* Cover toggle */}
      <div className="flex items-center justify-between rounded-md border p-2">
        <Label className="flex items-center gap-1.5 text-xs font-medium">
          <Star className="h-3.5 w-3.5 text-amber-500" />
          표지 / 대표사진
        </Label>
        <Switch checked={commonCover} onCheckedChange={handleCoverChange} />
      </div>

      {/* AI tag button */}
      <Button
        size="sm"
        variant="outline"
        className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
        onClick={handleAiTag}
        disabled={isAiLoading || selectedImages.length === 0}
      >
        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
        {isAiLoading ? 'AI 분석 중...' : 'AI 태그 자동 분류'}
      </Button>

      {/* Manual tag selector */}
      <div>
        <p className="mb-2 text-xs font-semibold text-slate-600">수동 태그 선택</p>
        <CheckupImageTagSelector selectedTags={commonTags} onChange={handleTagsChange} dynamicGroups={dynamicTagGroups} />
      </div>
    </div>
  )

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* ── LEFT: drop zone + image grid ─────────────────────── */}
      <div className="flex flex-1 flex-col overflow-auto border-r p-4 pb-20">
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files) }}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'mb-4 flex shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors',
            isDragging ? 'border-teal-400 bg-teal-50' : 'border-slate-300 bg-white hover:bg-slate-50',
          )}
        >
          <Input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
          <UploadCloud className="mb-2 h-9 w-9 text-slate-400" />
          <p className="text-sm font-medium text-slate-700">클릭 또는 드래그 & 드롭</p>
          <p className="mt-1 text-xs text-slate-400">클립보드 붙여넣기(Ctrl+V) 지원</p>
        </div>

        {staged.length > 0 && (
          <>
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-sm font-medium text-slate-700">추가된 이미지 ({staged.length})</span>
              <div className="flex items-center gap-1">
                {/* 모바일 전용: 태그 설정 버튼 */}
                <button
                  type="button"
                  onClick={() => setTagSheetOpen(true)}
                  className={cn(
                    'md:hidden flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                    selectedImages.length > 0
                      ? 'border-teal-300 bg-teal-50 text-teal-700'
                      : 'border-slate-200 bg-white text-slate-500',
                  )}
                >
                  <SlidersHorizontal size={11} />
                  태그 설정
                  {selectedImages.length > 0 && (
                    <span className="rounded-full bg-teal-500 px-1.5 py-0 text-[10px] font-bold text-white">
                      {selectedImages.length}
                    </span>
                  )}
                </button>
                <Button variant="ghost" size="sm" className="h-6 text-xs text-blue-600"
                  onClick={() => setStaged((p) => p.map((i) => ({ ...i, selected: true })))}>전체 선택</Button>
                <Button variant="ghost" size="sm" className="h-6 text-xs text-slate-500"
                  onClick={() => setStaged((p) => p.map((i) => ({ ...i, selected: false })))}>해제</Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 overflow-y-auto pb-4 sm:grid-cols-4">
              {staged.map((img) => (
                <div
                  key={img.id}
                  onClick={(e) => toggleSelect(img.id, e)}
                  className={cn(
                    'group relative aspect-square cursor-pointer overflow-hidden rounded-md border-2 transition-all',
                    img.selected
                      ? 'border-teal-500 ring-2 ring-teal-200 ring-offset-1'
                      : 'border-transparent bg-slate-100 hover:border-slate-300',
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />

                  <button
                    className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => remove(img.id, e)}
                  >
                    <X className="h-3 w-3" />
                  </button>

                  {img.selected && (
                    <div className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-[9px] font-bold text-white">✓</div>
                  )}
                  {img.isCover && (
                    <div className="absolute left-1 bottom-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400 drop-shadow" />
                    </div>
                  )}
                  {img.tags.length > 0 && (
                    <div className="absolute bottom-1 right-1 left-5 flex flex-wrap justify-end gap-0.5 pointer-events-none">
                      {img.tags.slice(0, 2).map((t) => {
                        const dynamicLabel = dynamicTagGroups?.flatMap(g => g.tags).find(tag => tag.id === t)?.label
                        const label = CHECKUP_TAG_LABEL[t] ?? dynamicLabel ?? t.split('_').at(-1)
                        return (
                          <span key={t} className={cn('rounded px-1 text-[8px] font-medium', TAG_COLOR_CLASS[getTagColor(t)] ?? TAG_COLOR_CLASS.amber)}>
                            {label?.slice(0, 4)}
                          </span>
                        )
                      })}
                      {img.tags.length > 2 && (
                        <span className="rounded bg-slate-700/70 px-1 text-[8px] text-white">+{img.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── RIGHT: 태그 패널 (데스크톱 전용) ─────────────────── */}
      <div className="hidden md:flex md:w-72 flex-col bg-white">
        <div className="border-b bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-800">선택 이미지 설정</p>
          <p className="mt-0.5 text-[11px] text-slate-500">{selectedImages.length}개 선택. 변경 시 일괄 적용됩니다.</p>
        </div>
        {TagPanelContent}
      </div>

      {/* ── 모바일: 태그 설정 Sheet ───────────────────────────── */}
      <Sheet open={tagSheetOpen} onOpenChange={setTagSheetOpen}>
        <SheetContent side="right" className="flex w-80 flex-col p-0">
          <SheetHeader className="shrink-0 border-b bg-slate-50 px-4 py-3">
            <SheetTitle className="text-sm">선택 이미지 설정</SheetTitle>
            <p className="text-[11px] text-slate-500">{selectedImages.length}개 선택. 변경 시 일괄 적용됩니다.</p>
          </SheetHeader>
          {TagPanelContent}
          <div className="shrink-0 border-t bg-white p-3">
            <Button
              className="w-full bg-teal-600 hover:bg-teal-700"
              onClick={() => setTagSheetOpen(false)}
            >
              확인
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── 저장 고정 바 ─────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t bg-white p-4 shadow-md">
        <span className="text-sm text-slate-500">총 {staged.length}개</span>
        <Button
          onClick={handleSave}
          disabled={staged.length === 0 || isUploading}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {isUploading ? '저장 중...' : '클라우드 저장'}
        </Button>
      </div>
    </div>
  )
}
