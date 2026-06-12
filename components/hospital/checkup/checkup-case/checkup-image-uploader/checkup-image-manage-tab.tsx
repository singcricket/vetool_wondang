'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Trash2, Star, AlertCircle, Pencil, SlidersHorizontal } from 'lucide-react'
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
  type CheckupImageTagGroup,
} from '@/constants/hospital/checkup/checkup-image-tags'
import dynamic from 'next/dynamic'
import CheckupImageTagSelector from './checkup-image-tag-selector'

// ssr: false — editor imports fabric.js which requires a native canvas binary unavailable on the server
const CheckupImageEditor = dynamic(() => import('./checkup-image-editor'), { ssr: false })

type ManagedImage = CheckupImage & { selected: boolean; isDirty: boolean }

interface Props {
  checkupId: string
  dynamicTagGroups?: CheckupImageTagGroup[]
}

export default function CheckupImageManageTab({ checkupId, dynamicTagGroups }: Props) {
  const [images, setImages] = useState<ManagedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [editorImage, setEditorImage] = useState<ManagedImage | null>(null)
  const [tagSheetOpen, setTagSheetOpen] = useState(false)

  // Long-press state
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didLongPress = useRef(false)

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

  useEffect(() => {
    load()
  }, [checkupId])

  const selectedImages = images.filter((img) => img.selected)

  const commonTags =
    selectedImages.length > 0
      ? selectedImages[0].tags.filter((t) => selectedImages.every((img) => img.tags.includes(t)))
      : []
  const commonCover = selectedImages.length > 0 && selectedImages.every((img) => img.is_cover)

  const handlePointerDown = (img: ManagedImage) => {
    didLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true
      setEditorImage(img)
    }, 500)
  }

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleImageClick = (id: string, e: React.MouseEvent) => {
    if (didLongPress.current) {
      didLongPress.current = false
      return
    }
    const isMultiKey = e.ctrlKey || e.metaKey
    setImages((prev) =>
      prev.map((img) => {
        if (img.id === id) return { ...img, selected: isMultiKey ? !img.selected : true }
        return isMultiKey ? img : { ...img, selected: false }
      }),
    )
  }

  const updateSelected = (updater: (img: ManagedImage) => ManagedImage) => {
    setImages((prev) => prev.map((img) => (img.selected ? { ...updater(img), isDirty: true } : img)))
  }

  const handleSaveUpdates = async () => {
    const dirty = images.filter((img) => img.isDirty)
    if (dirty.length === 0) return
    setProcessing(true)
    try {
      await Promise.all(
        dirty.map((img) => updateCheckupImageTags(img.id, img.tags, img.is_cover, img.img_memo)),
      )
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

  // ── 태그 패널 내용 (데스크톱 오른쪽 + 모바일 Sheet 공용) ─────────
  const tagPanelHeader = (
    <>
      <p className="text-sm font-semibold text-slate-800">태그 관리</p>
      {selectedImages.length > 1 ? (
        <p className="mt-1 flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {selectedImages.length}개 선택 — 태그를 덮어씁니다
        </p>
      ) : selectedImages.length === 1 ? (
        <p className="mt-1 text-[11px] text-slate-400">이미지의 현재 태그를 편집합니다</p>
      ) : (
        <p className="mt-1 text-[11px] text-slate-400">이미지를 클릭해 태그를 편집하세요</p>
      )}
    </>
  )

  const TagPanelContent = (
    <div
      className={cn(
        'flex-1 space-y-4 overflow-y-auto p-3 pb-6',
        selectedImages.length === 0 && 'pointer-events-none opacity-40',
      )}
    >
      <div className="flex items-center justify-between rounded-md border p-2">
        <Label className="flex items-center gap-1.5 text-xs font-medium">
          <Star className="h-3.5 w-3.5 text-amber-500" />
          표지 / 대표사진
        </Label>
        <Switch
          checked={commonCover}
          onCheckedChange={(v) =>
            updateSelected((img) => ({ ...img, is_cover: v }))
          }
        />
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold text-slate-600">태그 선택</p>
        <CheckupImageTagSelector
          selectedTags={commonTags}
          onChange={(tags) => updateSelected((img) => ({ ...img, tags }))}
          dynamicGroups={dynamicTagGroups}
        />
      </div>
      <div>
        <p className="mb-1.5 text-xs font-semibold text-slate-600">사진 설명 (메모)</p>
        <textarea
          value={selectedImages.length === 1 ? (selectedImages[0].img_memo ?? '') : ''}
          onChange={(e) =>
            updateSelected((img) => ({ ...img, img_memo: e.target.value }))
          }
          disabled={selectedImages.length !== 1}
          rows={3}
          placeholder={
            selectedImages.length > 1
              ? '단일 선택 시 편집 가능'
              : '사진에 대한 설명을 입력하세요...'
          }
          className="w-full resize-none rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 placeholder:text-slate-300 focus:border-teal-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
        />
      </div>
    </div>
  )

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col md:flex-row overflow-hidden">
          {/* ── LEFT: 이미지 그리드 ──────────────────────────── */}
          <div className="flex flex-1 flex-col overflow-hidden border-r min-h-0">
            <div className="flex shrink-0 items-center justify-between border-b bg-white/80 p-3 backdrop-blur-sm">
              <span className="text-sm font-medium text-slate-700">
                저장된 이미지 ({images.length})
              </span>
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-blue-600"
                  onClick={() => setImages((p) => p.map((i) => ({ ...i, selected: true })))}
                >
                  전체 선택
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-slate-500"
                  onClick={() => setImages((p) => p.map((i) => ({ ...i, selected: false })))}
                >
                  해제
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
                불러오는 중...
              </div>
            ) : images.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
                저장된 이미지가 없습니다.
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-3">
                <p className="mb-2 text-[11px] text-slate-400">길게 누르면 에디터가 열립니다</p>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 content-start pb-4">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      onPointerDown={() => handlePointerDown(img)}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerUp}
                      onClick={(e) => handleImageClick(img.id, e)}
                      className={cn(
                        'group relative aspect-square cursor-pointer overflow-hidden rounded-md border-2 transition-all select-none bg-white',
                        img.selected
                          ? 'border-teal-500 ring-2 ring-teal-200 ring-offset-1'
                          : 'border-slate-200 hover:border-slate-300',
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.img_url} alt="" className="h-full w-full object-cover" />

                      {img.selected && (
                        <div className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white shadow">
                          ✓
                        </div>
                      )}
                      {img.is_cover && (
                        <Star className="absolute bottom-1 left-1 h-3.5 w-3.5 fill-amber-400 text-amber-400 drop-shadow" />
                      )}
                      {img.mark && (
                        <Pencil className="absolute bottom-1 right-1 h-3 w-3 text-teal-400 drop-shadow" />
                      )}
                      {img.isDirty && (
                        <span className="absolute right-1 top-1 animate-pulse rounded bg-amber-500 px-1 text-[8px] font-bold text-white shadow-sm">
                          수정됨
                        </span>
                      )}
                      {img.tags.length > 0 && (
                        <div className="absolute bottom-1 right-5 flex flex-col items-end gap-0.5 pointer-events-none">
                          {img.tags.slice(0, 2).map((t) => {
                            const dynamicLabel = dynamicTagGroups?.flatMap((g) => g.tags).find((tag) => tag.id === t)?.label
                            const label = CHECKUP_TAG_LABEL[t] ?? dynamicLabel ?? t.split('_').at(-1)
                            return (
                              <span
                                key={t}
                                className={cn(
                                  'rounded px-1 text-[8px] font-medium',
                                  TAG_COLOR_CLASS[getTagColor(t)] ?? TAG_COLOR_CLASS.teal,
                                )}
                              >
                                {label?.slice(0, 5)}
                              </span>
                            )
                          })}
                          {img.tags.length > 2 && (
                            <span className="rounded bg-slate-700/70 px-1 text-[8px] text-white">
                              +{img.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: 태그 패널 (데스크톱 전용) ─────────────── */}
          <div className="hidden md:flex md:w-72 shrink-0 flex-col bg-white min-h-0 overflow-hidden">
            <div className="shrink-0 border-b bg-slate-50 p-3">
              {tagPanelHeader}
            </div>
            {TagPanelContent}
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between border-t bg-white p-4 shadow-md">
          <span className="text-sm text-slate-500">
            {images.length}개 중{' '}
            <span className="font-bold text-teal-600">{selectedImages.length}개</span> 선택
            {selectedImages.length <= 1 && (
              <span className="ml-2 text-[11px] text-slate-400">Ctrl(⌘)+클릭으로 다중 선택</span>
            )}
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

      {/* ── 모바일: 태그 설정 Sheet ───────────────────────────── */}
      <Sheet open={tagSheetOpen} onOpenChange={setTagSheetOpen}>
        <SheetContent side="right" className="flex w-80 flex-col p-0">
          <SheetHeader className="shrink-0 border-b bg-slate-50 px-4 py-3">
            <SheetTitle className="text-sm">태그 관리</SheetTitle>
            {selectedImages.length > 1 ? (
              <p className="flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {selectedImages.length}개 선택 — 태그를 덮어씁니다
              </p>
            ) : selectedImages.length === 1 ? (
              <p className="text-[11px] text-slate-400">이미지의 현재 태그를 편집합니다</p>
            ) : (
              <p className="text-[11px] text-slate-400">이미지를 클릭해 태그를 편집하세요</p>
            )}
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

      {/* ── Editor Dialog ──────────────────────────────────── */}
      <Dialog open={!!editorImage} onOpenChange={(open) => { if (!open) setEditorImage(null) }} modal={false}>
        <DialogContent
          className="max-w-none w-screen h-screen p-0 m-0 rounded-none border-none overflow-hidden [&>button]:hidden z-[150]"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
        >
          <VisuallyHidden>
            <DialogTitle>검진 이미지 에디터</DialogTitle>
          </VisuallyHidden>
          {editorImage && (
            <CheckupImageEditor
              imageId={editorImage.id}
              imageUrl={editorImage.img_url}
              checkupId={checkupId}
              initialMark={editorImage.mark}
              initialTags={editorImage.tags}
              initialIsCover={editorImage.is_cover}
              initialMemo={editorImage.img_memo}
              onClose={() => setEditorImage(null)}
              onSaved={() => {
                setEditorImage(null)
                load()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
