'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Trash2, Star } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/utils'
import {
  getCheckupImages,
  updateCheckupImageTags,
  deleteCheckupImages,
  type CheckupImage,
} from '@/lib/actions/checkup/checkup-image-actions'
import {
  CHECKUP_TAG_LABEL,
  TAG_COLOR_CLASS,
  getTagColor,
} from '@/constants/hospital/checkup/checkup-image-tags'
import CheckupImageTagSelector from './checkup-image-tag-selector'

type ManagedImage = CheckupImage & { selected: boolean; isDirty: boolean }

interface Props {
  checkupId: string
}

export default function CheckupImageManageTab({ checkupId }: Props) {
  const [images, setImages] = useState<ManagedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await getCheckupImages(checkupId)
      setImages(data.map((img) => ({ ...img, selected: false, isDirty: false })))
    } catch {
      toast.error('이미지를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [checkupId])

  const selectedImages = images.filter((img) => img.selected)
  const commonTags =
    selectedImages.length > 0
      ? selectedImages[0].tags.filter((t) => selectedImages.every((img) => img.tags.includes(t)))
      : []
  const commonCover =
    selectedImages.length > 0 && selectedImages.every((img) => img.is_cover)

  const updateSelected = (updater: (img: ManagedImage) => ManagedImage) => {
    setImages((prev) => prev.map((img) => (img.selected ? { ...updater(img), isDirty: true } : img)))
  }

  const handleSaveUpdates = async () => {
    const dirty = images.filter((img) => img.isDirty)
    if (dirty.length === 0) return
    setProcessing(true)
    try {
      await Promise.all(dirty.map((img) => updateCheckupImageTags(img.id, img.tags, img.is_cover)))
      toast.success(`${dirty.length}장 저장되었습니다.`)
      await load()
    } catch (e: any) {
      toast.error('저장 실패', { description: e.message })
    } finally {
      setProcessing(false)
    }
  }

  const handleDelete = async () => {
    const ids = selectedImages.map((img) => img.id)
    if (ids.length === 0) return
    if (!confirm(`${ids.length}장을 삭제하시겠습니까?`)) return
    setProcessing(true)
    try {
      await deleteCheckupImages(ids)
      toast.success('삭제되었습니다.')
      await load()
    } catch (e: any) {
      toast.error('삭제 실패', { description: e.message })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col md:flex-row overflow-hidden">
        {/* LEFT: image grid */}
        <div className="flex flex-1 flex-col overflow-hidden border-r">
          <div className="flex items-center justify-between border-b bg-white/80 p-3 backdrop-blur-sm">
            <span className="text-sm font-medium text-slate-700">저장된 이미지 ({images.length})</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-6 text-xs text-blue-600"
                onClick={() => setImages((p) => p.map((i) => ({ ...i, selected: true })))}>전체 선택</Button>
              <Button variant="ghost" size="sm" className="h-6 text-xs text-slate-500"
                onClick={() => setImages((p) => p.map((i) => ({ ...i, selected: false })))}>해제</Button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-400">불러오는 중...</div>
          ) : images.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-400">저장된 이미지가 없습니다.</div>
          ) : (
            <div className="flex-1 overflow-y-auto p-3 pb-24">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {images.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setImages((prev) => prev.map((i) =>
                      i.id === img.id ? { ...i, selected: !i.selected } : i
                    ))}
                    className={cn(
                      'group relative aspect-square cursor-pointer overflow-hidden rounded-md border-2 transition-all',
                      img.selected
                        ? 'border-teal-500 ring-2 ring-teal-200 ring-offset-1'
                        : 'border-slate-200 hover:border-slate-300',
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.img_url} alt="" className="h-full w-full object-cover" />

                    {img.selected && (
                      <div className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-[9px] font-bold text-white">✓</div>
                    )}
                    {img.is_cover && (
                      <Star className="absolute bottom-1 left-1 h-3 w-3 fill-amber-400 text-amber-400 drop-shadow" />
                    )}
                    {img.isDirty && (
                      <span className="absolute right-1 top-1 animate-pulse rounded bg-amber-500 px-1 text-[8px] font-bold text-white">
                        수정됨
                      </span>
                    )}
                    {img.tags.length > 0 && (
                      <div className="absolute bottom-1 right-1 flex flex-col items-end gap-0.5 pointer-events-none">
                        {img.tags.slice(0, 2).map((t) => (
                          <span key={t} className={cn('rounded px-1 text-[8px] font-medium', TAG_COLOR_CLASS[getTagColor(t)])}>
                            {CHECKUP_TAG_LABEL[t]?.slice(0, 5)}
                          </span>
                        ))}
                        {img.tags.length > 2 && (
                          <span className="rounded bg-slate-700/70 px-1 text-[8px] text-white">+{img.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: tag management */}
        <div className="flex w-full flex-col bg-white md:w-72">
          <div className="border-b bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800">일괄 태그 관리</p>
            <p className="mt-0.5 text-[11px] text-amber-700 bg-amber-50 rounded px-1.5 py-0.5">
              선택된 이미지의 태그를 덮어씁니다
            </p>
          </div>
          <div className={cn('flex-1 space-y-4 overflow-y-auto p-3', selectedImages.length === 0 && 'pointer-events-none opacity-40')}>
            <div className="flex items-center justify-between rounded-md border p-2">
              <Label className="flex items-center gap-1.5 text-xs font-medium">
                <Star className="h-3.5 w-3.5 text-amber-500" />
                표지 / 대표사진
              </Label>
              <Switch checked={commonCover} onCheckedChange={(v) => updateSelected((img) => ({ ...img, is_cover: v }))} />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-600">태그 선택</p>
              <CheckupImageTagSelector
                selectedTags={commonTags}
                onChange={(tags) => updateSelected((img) => ({ ...img, tags }))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t bg-white p-4 shadow-md">
        <span className="text-sm text-slate-500">
          {images.length}개 중 <span className="font-bold text-teal-600">{selectedImages.length}개</span> 선택
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
            onClick={handleDelete}
            disabled={selectedImages.length === 0 || processing}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            삭제
          </Button>
          <Button
            onClick={handleSaveUpdates}
            disabled={images.filter((i) => i.isDirty).length === 0 || processing}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {processing ? '처리 중...' : `변경 저장 (${images.filter((i) => i.isDirty).length})`}
          </Button>
        </div>
      </div>
    </div>
  )
}
