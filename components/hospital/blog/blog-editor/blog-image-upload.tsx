'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Camera, Trash2, Tag, X, Link2, Pencil, ClipboardPaste } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { toast } from 'sonner'
import { uploadBlogImage, deleteBlogImage, updateBlogImage } from '@/lib/actions/blog/blog-image-actions'
import { IMAGE_TAGS, THUMBNAIL_TAG, type BlogImage, type BlogSection } from '@/types/hospital/blog-type'
import Image from 'next/image'
import BlogImageEditor from './blog-image-editor'
import { parseBlogImageCaption } from '@/lib/utils/blog-image-caption'

export const SEC_PREFIX = 'sec:'

export function getSectionTag(tags: string[]): string | null {
  return tags.find((t) => t.startsWith(SEC_PREFIX))?.slice(SEC_PREFIX.length) ?? null
}

export function getRegularTags(tags: string[]): string[] {
  return tags.filter((t) => !t.startsWith(SEC_PREFIX))
}

interface Props {
  hosId: string
  postId: string
  images: BlogImage[]
  onImagesChange: (images: BlogImage[]) => void
  sections?: BlogSection[]
}

export default function BlogImageUpload({ hosId, postId, images, onImagesChange, sections = [] }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [tagOpenId, setTagOpenId] = useState<string | null>(null)
  const [editingImage, setEditingImage] = useState<BlogImage | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  // images를 ref로도 유지해 클로저 문제 방지
  const imagesRef = useRef(images)
  useEffect(() => { imagesRef.current = images }, [images])

  // 섹션 목록 (section / disease_info 타입만)
  const sectionTitles = sections
    .filter((s): s is Extract<BlogSection, { title: string }> => s.type !== 'image_row' && 'title' in s)
    .map((s) => s.title)
    .filter((t, i, arr) => t && arr.indexOf(t) === i) // 중복 제거

  const compressToBase64 = (file: File): Promise<{ base64: string; mime: string }> =>
    new Promise((resolve, reject) => {
      const img = new window.Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const MAX = 1600
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * ratio)
        canvas.height = Math.round(img.height * ratio)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        resolve({ base64: dataUrl.split(',')[1], mime: 'image/jpeg' })
      }
      img.onerror = reject
      img.src = url
    })

  // 클립보드 이미지 붙여넣기 (document 레벨 — 탭이 활성화된 동안만)
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = Array.from(e.clipboardData?.items ?? [])
    const imageFiles = items
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((f): f is File => f !== null)
    if (!imageFiles.length) return
    e.preventDefault()
    const dt = new DataTransfer()
    imageFiles.forEach((f) => dt.items.add(f))
    handleFilesImmediate(dt.files)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handlePaste])

  // 드래그앤드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files.length) handleFilesImmediate(e.dataTransfer.files)
  }

  const handleFilesImmediate = async (files: FileList) => {
    if (!files.length) return
    setUploading(true)
    const newImages: BlogImage[] = []
    for (const file of Array.from(files)) {
      try {
        const { base64, mime } = await compressToBase64(file)
        const img = await uploadBlogImage(hosId, postId, base64, mime, [], '', imagesRef.current.length + newImages.length)
        newImages.push(img)
      } catch {
        toast.error(`${file.name} 업로드 실패`)
      }
    }
    onImagesChange([...imagesRef.current, ...newImages])
    setUploading(false)
  }

  const handleFiles = (files: FileList) => handleFilesImmediate(files)

  const handleDelete = async (img: BlogImage) => {
    if (!confirm('이미지를 삭제하시겠습니까?')) return
    try {
      await deleteBlogImage(hosId, postId, img.id, img.image_url)
      onImagesChange(images.filter((i) => i.id !== img.id))
    } catch {
      toast.error('삭제 실패')
    }
  }

  const saveTags = async (img: BlogImage, newTags: string[]) => {
    try {
      await updateBlogImage(img.id, { tags: newTags })
      onImagesChange(images.map((i) => (i.id === img.id ? { ...i, tags: newTags } : i)))
    } catch {
      toast.error('태그 저장 실패')
    }
  }

  const toggleRegularTag = (img: BlogImage, tag: string) => {
    const regular = getRegularTags(img.tags)
    const secTag = getSectionTag(img.tags)
    const newRegular = regular.includes(tag) ? regular.filter((t) => t !== tag) : [...regular, tag]
    saveTags(img, [...(secTag ? [`${SEC_PREFIX}${secTag}`] : []), ...newRegular])
  }

  const setSectionTag = (img: BlogImage, sectionTitle: string) => {
    const regular = getRegularTags(img.tags)
    const current = getSectionTag(img.tags)
    // 같은 섹션 클릭 시 해제
    const newSec = current === sectionTitle ? null : sectionTitle
    saveTags(img, [...(newSec ? [`${SEC_PREFIX}${newSec}`] : []), ...regular])
  }

  return (
    <>
    <div className="space-y-3">
      {/* 업로드 존 (클릭 / 드래그앤드롭 / 클립보드 붙여넣기) */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed py-5 transition disabled:opacity-50',
          isDragging
            ? 'border-teal-400 bg-teal-50 text-teal-600'
            : 'border-slate-200 text-slate-400 hover:border-teal-400 hover:text-teal-500',
        )}
      >
        <div className="flex items-center gap-2">
          <Camera size={18} strokeWidth={1.4} />
          <span className="text-sm font-medium">
            {uploading ? '업로드 중...' : isDragging ? '놓아서 업로드' : '이미지 추가'}
          </span>
        </div>
        {!uploading && !isDragging && (
          <span className="flex items-center gap-1 text-[11px] text-slate-300">
            <ClipboardPaste size={11} />
            클릭 · 드래그앤드롭 · Ctrl+V 붙여넣기
          </span>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {/* 이미지 그리드 */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => {
            const sectionTag = getSectionTag(img.tags)
            const regularTags = getRegularTags(img.tags)
            const { description } = parseBlogImageCaption(img.caption)
            return (
              <div key={img.id} className="group relative">
                <div className={cn('aspect-square overflow-hidden rounded-lg border', regularTags.includes(THUMBNAIL_TAG) ? 'border-amber-400 ring-2 ring-amber-200' : 'border-slate-200')}>
                  <Image
                    src={img.image_url}
                    alt={description ?? ''}
                    width={200}
                    height={200}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>

                {/* description 미리보기 */}
                {description && (
                  <p className="mt-0.5 line-clamp-1 text-[9px] text-slate-500">{description}</p>
                )}

                {/* 태그 배지 */}
                <div className="mt-0.5 flex flex-wrap gap-0.5">
                  {sectionTag && (
                    <span className="flex items-center gap-0.5 rounded bg-violet-50 px-1 py-0.5 text-[9px] font-medium text-violet-600">
                      <Link2 size={8} />
                      {sectionTag}
                    </span>
                  )}
                  {regularTags.map((t) => (
                    <span key={t} className={cn('rounded px-1 py-0.5 text-[9px] font-medium', t === THUMBNAIL_TAG ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-teal-600')}>{t}</span>
                  ))}
                </div>

                {/* 호버 액션 */}
                <div className="absolute right-1 top-1 hidden gap-1 group-hover:flex">
                  <button
                    type="button"
                    onClick={() => setTagOpenId(tagOpenId === img.id ? null : img.id)}
                    className="rounded bg-white/90 p-1 shadow hover:bg-teal-50"
                    title="태그"
                  >
                    <Tag size={11} className="text-teal-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingImage(img)}
                    className="rounded bg-white/90 p-1 shadow hover:bg-indigo-50"
                    title="마킹 편집"
                  >
                    <Pencil size={11} className="text-indigo-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(img)}
                    className="rounded bg-white/90 p-1 shadow hover:bg-rose-50"
                    title="삭제"
                  >
                    <Trash2 size={11} className="text-rose-500" />
                  </button>
                </div>

                {/* 태그 선택 팝업 */}
                {tagOpenId === img.id && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-slate-200 bg-white p-2.5 shadow-lg space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-500">태그 설정</span>
                      <button type="button" onClick={() => setTagOpenId(null)}>
                        <X size={12} className="text-slate-400" />
                      </button>
                    </div>

                    {/* 섹션 연결 */}
                    {sectionTitles.length > 0 && (
                      <div>
                        <p className="mb-1 flex items-center gap-1 text-[10px] font-medium text-violet-600">
                          <Link2 size={9} /> 섹션 연결 <span className="text-slate-400 font-normal">(1개)</span>
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {sectionTitles.map((title) => (
                            <button
                              key={title}
                              type="button"
                              onClick={() => setSectionTag(img, title)}
                              className={cn(
                                'rounded-full border px-2 py-0.5 text-[10px] transition-colors',
                                sectionTag === title
                                  ? 'border-violet-400 bg-violet-50 font-semibold text-violet-700'
                                  : 'border-slate-200 text-slate-500 hover:border-violet-300',
                              )}
                            >
                              {title}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 썸네일 태그 */}
                    <div>
                      <p className="mb-1 text-[10px] font-medium text-amber-600">썸네일 이미지</p>
                      <button
                        type="button"
                        onClick={() => toggleRegularTag(img, THUMBNAIL_TAG)}
                        className={cn(
                          'rounded-full border px-2 py-0.5 text-[10px] transition-colors',
                          regularTags.includes(THUMBNAIL_TAG)
                            ? 'border-amber-400 bg-amber-50 font-semibold text-amber-700'
                            : 'border-slate-200 text-slate-500 hover:border-amber-300',
                        )}
                      >
                        ★ 썸네일
                      </button>
                    </div>

                    {/* 일반 태그 */}
                    <div>
                      <p className="mb-1 text-[10px] font-medium text-slate-500">이미지 태그</p>
                      <div className="flex flex-wrap gap-1">
                        {IMAGE_TAGS.filter((tag) => tag !== THUMBNAIL_TAG).map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleRegularTag(img, tag)}
                            className={cn(
                              'rounded-full border px-2 py-0.5 text-[10px] transition-colors',
                              regularTags.includes(tag)
                                ? 'border-teal-400 bg-teal-50 font-semibold text-teal-700'
                                : 'border-slate-200 text-slate-500 hover:border-teal-300',
                            )}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>

      {editingImage && (
        <BlogImageEditor
          image={editingImage}
          open={!!editingImage}
          onOpenChange={(v) => { if (!v) setEditingImage(null) }}
          onSaved={(updated) => {
            onImagesChange(images.map((i) => (i.id === updated.id ? updated : i)))
            setEditingImage(null)
          }}
        />
      )}
    </>
  )
}
