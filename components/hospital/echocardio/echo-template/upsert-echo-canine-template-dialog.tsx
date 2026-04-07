'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { ECHO_SECTION_META } from '@/constants/hospital/echocardio/echo-sections'
import { insertEchoTemplate, upsertEchoTemplate } from '@/lib/services/echocardio/update-echo'
import { fetchTemplateGuideImages } from '@/lib/services/echocardio/fetch-echo'
import { insertEchoGuideImage, updateGuideImageMapping } from '@/lib/services/echocardio/echo-guide-image'
import { uploadEchoGuideImage } from '@/lib/services/echocardio/upload-echo-guide-image'
import { deleteEchoGuideImage } from '@/lib/services/echocardio/delete-echo'
import type { EchoTemplate, EchoSection, EchoTemplateGuideImage, Species } from '@/types/echocardio/echocardio-type'
import { Edit2Icon, GripVertical, ImageIcon, PlusIcon, Trash2Icon, UploadIcon } from 'lucide-react'
import { ReactSortable } from 'react-sortablejs'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { cn } from '@/lib/utils/utils'

type DialogTab = 'items' | 'order' | 'guide'

type Props =
  | { isEdit: false; hosId: string; template?: undefined; testUIMeta: any[] }
  | { isEdit: true; hosId: string; template: EchoTemplate; testUIMeta: any[] }

/**
 * 개(Canine) 전용 심장초음파 템플릿 생성/수정 다이얼로그
 */
export default function UpsertEchoCanineTemplateDialog({ isEdit, hosId, template, testUIMeta }: Props) {
  const { refresh } = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [tab, setTab] = useState<DialogTab>('items')

  const SPECIES: Species = 'canine'

  // 항목 설정 상태
  const [name, setName] = useState(template?.name ?? '')
  const [description, setDescription] = useState(template?.description ?? '')
  const [activeItems, setActiveItems] = useState<Partial<Record<EchoSection, string[]>>>(
    template?.active_items ?? {},
  )
  const [activeSection, setActiveSection] = useState<EchoSection>(
    (template?.section_order?.[0] ?? 'PE') as EchoSection,
  )

  // 목록 순서 상태
  const [flatOrder, setFlatOrder] = useState<string[]>(template?.item_order['_flat'] ?? [])

  // 가이드 이미지 상태 (edit 모드만)
  const [guideImages, setGuideImages] = useState<EchoTemplateGuideImage[]>([])
  const [isLoadingGuide, setIsLoadingGuide] = useState(false)

  const sectionOrder: EchoSection[] = template?.section_order ?? (Object.keys(ECHO_SECTION_META) as EchoSection[])
  const sectionItems = testUIMeta.filter((m: any) => m.sections?.includes(activeSection) && m.species?.includes(SPECIES))
  const nonCommentMeta = testUIMeta.filter((m: any) => m.testType !== 'textcomment' && m.species?.includes(SPECIES))
  const activeIds = activeItems[activeSection] ?? sectionItems.map((m: any) => m.keywordID)

  // 현재 활성 항목 전체 (섹션 순서 기준 기본 순서)
  function getDefaultFlatItems() {
    return sectionOrder.flatMap((section) => {
      const sectionItemsForThis = testUIMeta.filter((m: any) => m.sections?.includes(section) && m.species?.includes(SPECIES))
      const ids = activeItems[section] ?? sectionItemsForThis.map((m: any) => m.keywordID)
      return testUIMeta.filter((m: any) => ids.includes(m.keywordID) && m.sections?.includes(section) && m.species?.includes(SPECIES))
    })
  }

  // _flat 순서 적용 후 정렬된 항목
  function getSortedFlatItems() {
    const all = getDefaultFlatItems()
    if (flatOrder.length === 0) return all
    return [...all].sort((a: any, b: any) => {
      const ai = flatOrder.indexOf(a.keywordID)
      const bi = flatOrder.indexOf(b.keywordID)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  }


  const loadGuideImages = useCallback(async () => {
    if (!template?.id) return
    setIsLoadingGuide(true)
    const images = await fetchTemplateGuideImages(template.id)
    setGuideImages(images)
    setIsLoadingGuide(false)
  }, [template?.id])

  useEffect(() => {
    if (isOpen && isEdit && tab === 'guide') {
      loadGuideImages()
    }
  }, [isOpen, isEdit, tab, loadGuideImages])

  function toggleItem(keywordId: string) {
    const current = new Set(activeIds)
    if (current.has(keywordId)) current.delete(keywordId)
    else current.add(keywordId)
    setActiveItems((prev) => ({ ...prev, [activeSection]: Array.from(current) }))
  }

  function handleOpenChange(open: boolean) {
    if (open) {
      setName(template?.name ?? '')
      setDescription(template?.description ?? '')
      setActiveItems(template?.active_items ?? {})
      setActiveSection((template?.section_order?.[0] ?? 'PE') as EchoSection)
      setFlatOrder(template?.item_order['_flat'] ?? [])
      setTab('items')
      setGuideImages([])
    }
    setIsOpen(open)
  }

  async function handleSubmit() {
    if (!name.trim()) return
    setIsPending(true)
    try {
      if (isEdit) {
        await upsertEchoTemplate(template.id, {
          name: name.trim(),
          template_species: SPECIES,
          description: description.trim() || null,
          section_order: template.section_order,
          item_order: { ...template.item_order, _flat: flatOrder },
          active_items: activeItems as Record<string, string[]>,
        })
        toast.success('템플릿을 수정하였습니다')
      } else {
        await insertEchoTemplate(hosId, name.trim(), SPECIES, description.trim() || undefined)
        toast.success('템플릿을 생성하였습니다')
      }
      setIsOpen(false)
      refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size={isEdit ? 'icon' : 'sm'}
          variant={isEdit ? 'ghost' : 'default'}
          className={cn(isEdit ? '' : 'h-8 px-3 text-xs')}
        >
          {isEdit ? (
            <Edit2Icon size={16} />
          ) : (
            <>
              <PlusIcon className="mr-1 h-3.5 w-3.5" />
              템플릿 추가
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col overflow-hidden p-0 border-blue-200">
        <DialogHeader className="px-4 pt-4 bg-blue-50/50">
          <DialogTitle className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            {isEdit ? '개 템플릿 수정' : '새 개(DOG) 템플릿 만들기'}
          </DialogTitle>
          <VisuallyHidden>
            <DialogDescription />
          </VisuallyHidden>
        </DialogHeader>

        {/* 탭 */}
        <div className="flex border-b px-4">
          {([
            { key: 'items' as const, label: '항목 설정' },
            { key: 'order' as const, label: '목록 순서' },
            { key: 'guide' as const, label: '가이드 이미지' },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-3 py-2 text-xs transition-colors',
                tab === t.key
                  ? 'border-b-2 border-blue-600 font-bold text-blue-600'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
          {/* ── 항목 설정 탭 ── */}
          {tab === 'items' && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 rounded border bg-muted/30 p-3 shadow-inner">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="템플릿 이름 *"
                  className="w-full rounded border bg-white px-2 py-1.5 text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="설명 (선택)"
                  className="rounded border bg-white px-2 py-1.5 text-xs text-muted-foreground focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* 섹션별 항목 선택 */}
              <div className="flex gap-3 rounded border p-3 bg-white" style={{ height: '320px' }}>
                <div className="flex w-28 shrink-0 flex-col gap-1 overflow-y-auto border-r pr-2">
                  {sectionOrder.map((section) => (
                    <button
                      key={section}
                      onClick={() => setActiveSection(section)}
                      className={cn(
                        'rounded px-2 py-1.5 text-left text-xs transition-colors',
                        activeSection === section
                          ? 'bg-blue-50 text-blue-700 font-bold'
                          : 'text-muted-foreground hover:bg-muted/50',
                      )}
                    >
                      {ECHO_SECTION_META[section]?.label ?? section}
                    </button>
                  ))}
                </div>
                <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
                  <p className="mb-1 text-[10px] text-muted-foreground">
                    체크된 항목이 검사 입력에 표시됩니다
                  </p>
                  {sectionItems.map((item: any) => (
                    <label
                      key={item.keywordID}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-muted transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={activeIds.includes(item.keywordID)}
                        onChange={() => toggleItem(item.keywordID)}
                        className="h-3 w-3 accent-blue-600"
                      />
                      <span className="text-xs">{item.keywordName}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground">{item.testType}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>취소</Button>
                <Button size="sm" onClick={handleSubmit} disabled={isPending || !name.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {isPending ? <Spinner className="text-white" /> : isEdit ? '수정 완료' : '템플릿 생성'}
                </Button>
              </div>
            </div>
          )}

          {/* ── 목록 순서 탭 ── */}
          {tab === 'order' && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] text-muted-foreground">
                항목을 드래그하여 목록 모드에서 표시될 순서를 지정합니다
              </p>
              <div className="flex flex-col overflow-hidden rounded border bg-white">
                <ReactSortable
                  list={getSortedFlatItems().map((item: any) => ({ ...item, id: item.keywordID }))}
                  setList={(newList) => setFlatOrder(newList.map((item) => item.id))}
                  animation={200}
                  handle=".drag-handle"
                  className="flex max-h-[400px] flex-col overflow-y-auto"
                >
                  {getSortedFlatItems().map((item: any, index: number) => (
                    <div key={item.keywordID} className="flex items-center gap-2 border-b px-3 py-1.5 last:border-b-0 hover:bg-slate-50 transition-colors">
                      <GripVertical className="drag-handle h-3 w-3 cursor-grab text-muted-foreground hover:text-blue-600 active:cursor-grabbing" />
                      <span className="w-5 shrink-0 text-center text-[10px] text-muted-foreground">{index + 1}</span>
                      <span className="flex-1 text-xs">{item.keywordName}</span>
                      <span className="text-[10px] text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded">{item.section}</span>
                    </div>
                  ))}
                </ReactSortable>
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="outline" size="sm" onClick={() => setFlatOrder([])}>
                  순서 초기화
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={isPending} className="bg-blue-600 hover:bg-blue-700">
                  {isPending ? <Spinner className="text-white" /> : '순서 저장'}
                </Button>
              </div>
            </div>
          )}

          {/* ── 가이드 이미지 탭 ── */}
          {tab === 'guide' && (
            isEdit ? (
              <GuideImagesTab
                template={template}
                guideImages={guideImages}
                isLoading={isLoadingGuide}
                nonCommentMeta={nonCommentMeta}
                onRefresh={loadGuideImages}
                speciesColor="blue"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  템플릿을 먼저 생성한 후<br />수정 버튼에서 가이드 이미지를 추가할 수 있습니다
                </p>
                <Button size="sm" onClick={handleSubmit} disabled={isPending || !name.trim()} className="bg-blue-600 hover:bg-blue-700">
                  {isPending ? <Spinner className="text-white" /> : '템플릿 먼저 생성'}
                </Button>
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────
// 가이드 이미지 관리 탭
// ─────────────────────────────────────────────
function GuideImagesTab({
  template,
  guideImages,
  isLoading,
  nonCommentMeta,
  onRefresh,
  speciesColor,
}: {
  template: EchoTemplate
  guideImages: EchoTemplateGuideImage[]
  isLoading: boolean
  nonCommentMeta: any[]
  onRefresh: () => void
  speciesColor: 'blue' | 'orange'
}) {
  const [showAddForm, setShowAddForm] = useState(false)

  if (isLoading) return <p className="py-8 text-center text-xs text-muted-foreground">불러오는 중...</p>

  return (
    <div className="flex flex-col gap-3">
      {guideImages.length === 0 && !showAddForm && (
        <p className="py-4 text-center text-xs text-muted-foreground">
          등록된 가이드 이미지가 없습니다
        </p>
      )}

      {/* 기존 가이드 이미지 목록 */}
      {guideImages.map((img) => (
        <GuideImageRow
          key={img.id}
          image={img}
          nonCommentMeta={nonCommentMeta}
          onRefresh={onRefresh}
          speciesColor={speciesColor}
        />
      ))}

      {/* 추가 폼 */}
      {showAddForm ? (
        <GuideImageAddForm
          templateId={template.id}
          nonCommentMeta={nonCommentMeta}
          onDone={() => { setShowAddForm(false); onRefresh() }}
          onCancel={() => setShowAddForm(false)}
          speciesColor={speciesColor}
        />
      ) : (
        <Button
          variant="outline"
          size="sm"
          className={cn("w-full border-dashed", speciesColor === 'blue' ? "hover:border-blue-500 hover:text-blue-600" : "hover:border-orange-500 hover:text-orange-600")}
          onClick={() => setShowAddForm(true)}
        >
          <UploadIcon className="mr-1 h-3 w-3" />
          가이드 이미지 추가
        </Button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// 개별 가이드 이미지 행 (편집 + 삭제)
// ─────────────────────────────────────────────
function GuideImageRow({
  image,
  nonCommentMeta,
  onRefresh,
  speciesColor,
}: {
  image: EchoTemplateGuideImage
  nonCommentMeta: any[]
  onRefresh: () => void
  speciesColor: 'blue' | 'orange'
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [viewName, setViewName] = useState(image.view_name)
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(image.mapped_keywords)
  const [isSaving, setIsSaving] = useState(false)

  function toggleKeyword(keywordId: string) {
    setSelectedKeywords((prev) =>
      prev.includes(keywordId) ? prev.filter((k) => k !== keywordId) : [...prev, keywordId],
    )
  }

  async function handleSave() {
    setIsSaving(true)
    await updateGuideImageMapping(image.id, selectedKeywords, viewName)
    toast.success('수정하였습니다')
    setIsSaving(false)
    setIsEditing(false)
    onRefresh()
  }

  async function handleDelete() {
    setIsDeleting(true)
    await deleteEchoGuideImage(image.id)
    toast.success('삭제하였습니다')
    onRefresh()
  }

  return (
    <div className="rounded border bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-2">
        {/* 썸네일 */}
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.image_url} alt={image.view_name} className="h-full w-full object-contain" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-slate-700">{image.view_name}</p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <span className={cn("w-1.5 h-1.5 rounded-full", speciesColor === 'blue' ? "bg-blue-400" : "bg-orange-400")} />
            연결 항목 {image.mapped_keywords.length}개
          </p>
        </div>

        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing((v) => !v)}>
            <Edit2Icon className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <Spinner className="h-3.5 w-3.5" /> : <Trash2Icon className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* 인라인 편집 */}
      {isEditing && (
        <div className="border-t bg-slate-50/50 p-2 flex flex-col gap-2">
          <input
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
            placeholder="뷰 이름"
            className="w-full rounded border bg-white px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
          />
          <div className="max-h-36 overflow-y-auto rounded border bg-white p-1">
            {nonCommentMeta.map((m: any) => (
              <label key={m.keywordID} className="flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 hover:bg-muted">
                <input
                  type="checkbox"
                  checked={selectedKeywords.includes(m.keywordID)}
                  onChange={() => toggleKeyword(m.keywordID)}
                  className={cn("h-3 w-3", speciesColor === 'blue' ? "accent-blue-600" : "accent-orange-600")}
                />
                <span className="text-[10px]">
                  {m.keywordName}
                  <span className="ml-1 text-muted-foreground">({m.section})</span>
                </span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setIsEditing(false)}>취소</Button>
            <Button size="sm" className={cn("h-7 text-[10px]", speciesColor === 'blue' ? "bg-blue-600" : "bg-orange-600")} onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Spinner className="text-white" /> : '저장'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// 새 가이드 이미지 추가 폼
// ─────────────────────────────────────────────
function GuideImageAddForm({
  templateId,
  nonCommentMeta,
  onDone,
  onCancel,
  speciesColor,
}: {
  templateId: string
  nonCommentMeta: any[]
  onDone: () => void
  onCancel: () => void
  speciesColor: 'blue' | 'orange'
}) {
  const [viewName, setViewName] = useState('')
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  function toggleKeyword(keywordId: string) {
    setSelectedKeywords((prev) =>
      prev.includes(keywordId) ? prev.filter((k) => k !== keywordId) : [...prev, keywordId],
    )
  }

  async function handleUpload() {
    if (!imageFile || !viewName.trim()) return
    setIsUploading(true)
    try {
      const { url, error: uploadError } = await uploadEchoGuideImage(imageFile, templateId)
      if (!url || uploadError) throw new Error(uploadError ?? '이미지 업로드 실패')

      await insertEchoGuideImage({
        templateId,
        viewName: viewName.trim(),
        imageUrl: url,
        mappedKeywords: selectedKeywords,
        displayOrder: 0,
      })
      toast.success('가이드 이미지를 추가하였습니다')
      onDone()
    } catch (e) {
      console.error(e)
      toast.error('업로드 실패')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded border bg-slate-50 p-3 shadow-inner">
      <p className="text-xs font-bold text-slate-700">새 가이드 이미지 추가</p>

      <input
        type="text"
        value={viewName}
        onChange={(e) => setViewName(e.target.value)}
        placeholder="뷰 이름 *  (예: 5chamber long axis)"
        className="rounded border bg-white px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
      />

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-medium text-muted-foreground italic">이미지 파일 *</label>
        <div className="relative group">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="text-[10px] w-full file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer" 
          />
        </div>
        {previewUrl && (
          <div className="relative mt-1 aspect-video w-full overflow-hidden rounded border bg-black/5 flex items-center justify-center">
            <img src={previewUrl} alt="preview" className="h-full w-full object-contain" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-medium text-muted-foreground italic">연결할 측정 항목</label>
        <div className="max-h-36 overflow-y-auto rounded border bg-white p-1">
          {nonCommentMeta.map((m: any) => (
            <label key={m.keywordID} className="flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 hover:bg-muted transition-colors">
              <input
                type="checkbox"
                checked={selectedKeywords.includes(m.keywordID)}
                onChange={() => toggleKeyword(m.keywordID)}
                className={cn("h-3 w-3", speciesColor === 'blue' ? "accent-blue-600" : "accent-orange-600")}
              />
              <span className="text-[10px]">
                {m.keywordName}
                <span className="ml-1 text-muted-foreground">({m.section})</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={onCancel}>취소</Button>
        <Button
          size="sm"
          className={cn("h-7 text-[10px]", speciesColor === 'blue' ? "bg-blue-600" : "bg-orange-600")}
          onClick={handleUpload}
          disabled={isUploading || !imageFile || !viewName.trim()}
        >
          {isUploading ? <Spinner className="text-white" /> : '파일 업로드'}
        </Button>
      </div>
    </div>
  )
}
