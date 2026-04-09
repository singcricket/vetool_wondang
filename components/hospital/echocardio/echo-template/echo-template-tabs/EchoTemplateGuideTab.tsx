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

  useEffect(() => {
    setLocalImages(guideImages)
  }, [guideImages])

  const buttonColor = speciesColor === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'

  const speciesLayout = speciesColor === 'blue' ? LAYOUT_CANINE : LAYOUT_FELINE
  const allowedSectionIds = new Set(speciesLayout.sections.map(s => s.sectionID))
  const filteredNonCommentMeta = nonCommentMeta.filter(m => 
    m.sections?.some((s: string) => allowedSectionIds.has(s))
  )

  async function handleReorder(newList: EchoTemplateGuideImage[]) {
    // 1. 순서가 실제로 바뀌었는지 ID 배열로 비교
    const oldIds = localImages.map(img => img.id).join(',')
    const newIds = newList.map(img => img.id).join(',')
    
    // 2. 즉시 로컬 상태 업데이트 (ReactSortable 필수 동작)
    setLocalImages(newList)

    if (oldIds === newIds) return

    // 3. 서버에 순서 업데이트 요청
    try {
      const updates = newList.map((img, index) => ({
        id: img.id,
        display_order: index
      }))
      await updateGuideImageOrder(updates)
      // 주의: onRefresh()를 호출하면 부모의 isLoading이 true가 되면서 
      // 이 컴포넌트 전체가 "불러오는 중..."으로 덮여 일시적 깜빡임 발생.
      // 서버 저장이 완료되었으므로 로컬 상태만 유지해도 무방함.
    } catch (e) {
      console.error('순서 변경 실패:', e)
      setLocalImages(guideImages)
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
