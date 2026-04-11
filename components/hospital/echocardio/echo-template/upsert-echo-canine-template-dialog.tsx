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
import { Edit2Icon, PlusIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { cn } from '@/lib/utils/utils'

import { LAYOUT_CANINE, LAYOUT_FELINE } from '@/constants/hospital/echocardio/echo-layouts'
import EchoTemplateItemsTab from './echo-template-tabs/EchoTemplateItemsTab'
import EchoTemplateOrderTab from './echo-template-tabs/EchoTemplateOrderTab'
import EchoTemplateGuideTab from './echo-template-tabs/EchoTemplateGuideTab'

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

  const allowedSectionIds = new Set(LAYOUT_CANINE.sections.map((s) => s.sectionID))

  const sectionOrder: EchoSection[] = (
    (template?.section_order as EchoSection[]) ?? (LAYOUT_CANINE.sections.map((s) => s.sectionID) as EchoSection[])
  ).filter((sid) => allowedSectionIds.has(sid))
  const sectionItems = testUIMeta.filter((m: any) => m.sections?.includes(activeSection) && m.species?.includes(SPECIES))
  const nonCommentMeta = testUIMeta.filter((m: any) => m.testType !== 'textcomment' && m.species?.includes(SPECIES))
  const activeIds = activeItems[activeSection] ?? sectionItems.map((m: any) => m.keywordID)

  // 현재 활성 항목 전체 (섹션 순서 기준 기본 순서)
  function getDefaultFlatItems() {
    const seen = new Set<string>()
    const items: any[] = []

    sectionOrder.forEach((section) => {
      const sectionItemsForThis = testUIMeta.filter(
        (m: any) => m.sections?.includes(section) && m.species?.includes(SPECIES),
      )
      const ids = activeItems[section] ?? sectionItemsForThis.map((m: any) => m.keywordID)

      const sectionActiveItems = testUIMeta.filter(
        (m: any) =>
          ids.includes(m.keywordID) &&
          m.sections?.includes(section) &&
          m.species?.includes(SPECIES),
      )

      sectionActiveItems.forEach((item) => {
        if (!seen.has(item.keywordID)) {
          seen.add(item.keywordID)
          items.push(item)
        }
      })
    })
    return items
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
      setActiveSection((template?.section_order?.[0] ?? sectionOrder[0] ?? 'PE') as EchoSection)
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

      <DialogContent className="flex h-full w-full max-w-none sm:h-[70vh] sm:max-w-[50vw] flex-col overflow-hidden p-0 border-none sm:border border-blue-200 rounded-none sm:rounded-lg">
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
            { key: 'guide' as const, label: '가이드' },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-3 py-2 text-sm transition-colors',
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
            <EchoTemplateItemsTab
              name={name}
              setName={setName}
              description={description}
              setDescription={setDescription}
              sectionOrder={sectionOrder}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              sectionItems={sectionItems}
              activeIds={activeIds}
              toggleItem={toggleItem}
              isEdit={isEdit}
              isPending={isPending}
              onCancel={() => setIsOpen(false)}
              onSubmit={handleSubmit}
              speciesColor="blue"
            />
          )}

          {/* ── 목록 순서 탭 ── */}
          {tab === 'order' && (
            <EchoTemplateOrderTab
              sortedFlatItems={getSortedFlatItems()}
              setFlatOrder={setFlatOrder}
              isPending={isPending}
              onSubmit={handleSubmit}
              speciesColor="blue"
            />
          )}

          {/* ── 가이드 이미지 탭 ── */}
          {tab === 'guide' && (
            <EchoTemplateGuideTab
              isEdit={isEdit}
              template={template}
              guideImages={guideImages}
              isLoading={isLoadingGuide}
              nonCommentMeta={nonCommentMeta}
              onRefresh={loadGuideImages}
              speciesColor="blue"
              onSubmit={handleSubmit}
              isPending={isPending}
              name={name}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

