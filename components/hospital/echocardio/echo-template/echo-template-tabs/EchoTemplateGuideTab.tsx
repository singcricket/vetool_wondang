'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { ImageIcon, UploadIcon } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { EchoTemplate, EchoTemplateGuideImage } from '@/types/echocardio/echocardio-type'
import { LAYOUT_CANINE, LAYOUT_FELINE } from '@/constants/hospital/echocardio/echo-layouts'
import { updateGuideImageOrder } from '@/lib/services/echocardio/echo-guide-image'
import { ReactSortable } from 'react-sortablejs'
import GuideImageRow from './GuideImageRow'
import GuideImageAddForm from './GuideImageAddForm'

interface EchoTemplateGuideTabProps {
  isEdit: boolean
  template?: EchoTemplate
  guideImages: EchoTemplateGuideImage[]
  isLoading: boolean
  nonCommentMeta: any[]
  onRefresh: () => void
  speciesColor: 'blue' | 'orange'
  onSubmit?: () => void
  isPending?: boolean
  name?: string
}

export default function EchoTemplateGuideTab({
  isEdit,
  template,
  guideImages,
  isLoading,
  nonCommentMeta,
  onRefresh,
  speciesColor,
  onSubmit,
  isPending,
  name,
}: EchoTemplateGuideTabProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [localImages, setLocalImages] = useState<EchoTemplateGuideImage[]>([])
  const [isOrderChanged, setIsOrderChanged] = useState(false)
  const [isSavingOrder, setIsSavingOrder] = useState(false)

  useEffect(() => {
    setLocalImages(guideImages)
    setIsOrderChanged(false)
  }, [guideImages])

  const buttonColor = speciesColor === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'

  const speciesLayout = speciesColor === 'blue' ? LAYOUT_CANINE : LAYOUT_FELINE
  const allowedSectionIds = new Set(speciesLayout.sections.map(s => s.sectionID))
  const filteredNonCommentMeta = nonCommentMeta.filter(m => 
    m.sections?.some((s: string) => allowedSectionIds.has(s))
  )

  const handleReorder = (newList: EchoTemplateGuideImage[]) => {
    // 1. 순서가 원래 서버 데이터(guideImages)와 달라졌는지 비교
    const savedIds = guideImages.map(img => img.id).join(',')
    const newIds = newList.map(img => img.id).join(',')
    
    // 2. 로컬 상태 업데이트
    setLocalImages(newList)

    // 3. 변경 여부 설정
    setIsOrderChanged(savedIds !== newIds)
  }

  async function handleSaveOrder() {
    setIsSavingOrder(true)
    try {
      const updates = localImages.map((img, index) => ({
        id: img.id,
        display_order: index
      }))
      await updateGuideImageOrder(updates)
      setIsOrderChanged(false)
      onRefresh()
    } catch (e) {
      console.error('순서 저장 실패:', e)
    } finally {
      setIsSavingOrder(false)
    }
  }

  if (!isEdit) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <ImageIcon className="h-8 w-8 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          템플릿을 먼저 생성한 후<br />수정 버튼에서 가이드 이미지를 추가할 수 있습니다
        </p>
        {onSubmit && (
          <Button 
            size="sm" 
            onClick={onSubmit} 
            disabled={isPending || !name?.trim()} 
            className={cn("text-white", buttonColor)}
          >
            {isPending ? <Spinner className="text-white" /> : '템플릿 먼저 생성'}
          </Button>
        )}
      </div>
    )
  }

  if (isLoading) return <p className="py-8 text-center text-xs text-muted-foreground">불러오는 중...</p>

  return (
    <div className="flex flex-col gap-3">
      {localImages.length === 0 && !showAddForm && (
        <p className="py-4 text-center text-xs text-muted-foreground">
          등록된 가이드 이미지가 없습니다
        </p>
      )}

      {isOrderChanged && (
        <div className="flex items-center justify-between rounded bg-amber-50 p-2 shadow-sm border border-amber-200">
          <p className="text-[10px] font-bold text-amber-700">순서가 변경되었습니다. 저장하시겠습니까?</p>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 text-xs px-2" 
              onClick={() => {
                setLocalImages(guideImages)
                setIsOrderChanged(false)
              }}
              disabled={isSavingOrder}
            >
              취소
            </Button>
            <Button 
              size="sm" 
              className={cn("h-7 text-xs text-white px-3", buttonColor)}
              onClick={handleSaveOrder}
              disabled={isSavingOrder}
            >
              {isSavingOrder ? <Spinner className="text-white" /> : '순서 저장'}
            </Button>
          </div>
        </div>
      )}

      {/* 기존 가이드 이미지 목록 (Drag & Drop 가능) */}
      <ReactSortable
        list={localImages}
        setList={handleReorder}
        animation={200}
        handle=".drag-handle-row"
        className="flex flex-col gap-3"
      >
        {localImages.map((img) => (
          <GuideImageRow
            key={img.id}
            image={img}
            nonCommentMeta={filteredNonCommentMeta}
            onRefresh={onRefresh}
            speciesColor={speciesColor}
          />
        ))}
      </ReactSortable>

      {/* 추가 폼 */}
      {showAddForm ? (
        <GuideImageAddForm
          templateId={template!.id}
          nonCommentMeta={filteredNonCommentMeta}
          onDone={() => { setShowAddForm(false); onRefresh() }}
          onCancel={() => setShowAddForm(false)}
          speciesColor={speciesColor}
        />
      ) : (
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "w-full border-dashed", 
            speciesColor === 'blue' ? "hover:border-blue-500 hover:text-blue-600" : "hover:border-orange-500 hover:text-orange-600"
          )}
          onClick={() => setShowAddForm(true)}
        >
          <UploadIcon className="mr-1 h-3 w-3" />
          가이드 이미지 추가
        </Button>
      )}
    </div>
  )
}
