'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Edit2Icon, Trash2Icon, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/utils'
import { EchoTemplateGuideImage } from '@/types/echocardio/echocardio-type'
import { updateGuideImageMapping } from '@/lib/services/echocardio/echo-guide-image'
import { deleteEchoGuideImage } from '@/lib/services/echocardio/delete-echo'
import { ReactSortable } from 'react-sortablejs'

interface GuideImageRowProps {
  image: EchoTemplateGuideImage
  nonCommentMeta: any[]
  onRefresh: () => void
  speciesColor: 'blue' | 'orange'
}

export default function GuideImageRow({
  image,
  nonCommentMeta,
  onRefresh,
  speciesColor,
}: GuideImageRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [viewName, setViewName] = useState(image.view_name)
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(image.mapped_keywords)
  const [isSaving, setIsSaving] = useState(false)

  const accentRing = speciesColor === 'blue' ? 'focus:ring-blue-500' : 'focus:ring-orange-500'
  const accentCheckbox = speciesColor === 'blue' ? 'accent-blue-600' : 'accent-orange-600'
  const buttonColor = speciesColor === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'

  const selectedItems = useMemo(() => {
    return selectedKeywords
      .map(id => nonCommentMeta.find(m => m.keywordID === id))
      .filter(Boolean)
      .map(m => ({ ...m, id: m.keywordID }))
  }, [selectedKeywords, nonCommentMeta])

  const availableItems = useMemo(() => {
    return nonCommentMeta.filter(m => !selectedKeywords.includes(m.keywordID))
  }, [selectedKeywords, nonCommentMeta])

  function toggleKeyword(keywordId: string) {
    setSelectedKeywords((prev) =>
      prev.includes(keywordId) ? prev.filter((k) => k !== keywordId) : [...prev, keywordId],
    )
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      await updateGuideImageMapping(image.id, selectedKeywords, viewName)
      toast.success('수정하였습니다')
      setIsSaving(false)
      setIsEditing(false)
      onRefresh()
    } catch (e) {
      console.error(e)
      toast.error('수정 실패')
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteEchoGuideImage(image.id)
      toast.success('삭제하였습니다')
      onRefresh()
    } catch (e) {
      console.error(e)
      toast.error('삭제 실패')
      setIsDeleting(false)
    }
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
          <p className="text-xs text-muted-foreground flex items-center gap-1">
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
            className={cn("w-full rounded border bg-white px-2 py-1 text-xs outline-none focus:ring-1", accentRing)}
          />

          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {/* 선택된 항목 (순서 조정 가능) */}
            {selectedKeywords.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold text-muted-foreground ml-1 italic">선택된 항목 (드래그하여 순서 조정)</p>
                <div className="rounded border bg-white p-1">
                  <ReactSortable
                    list={selectedItems}
                    setList={(newList) => setSelectedKeywords(newList.map(item => item.id))}
                    animation={200}
                    handle=".drag-handle"
                    className="flex flex-col gap-0.5"
                  >
                    {selectedItems.map((m: any) => (
                      <div key={m.keywordID} className="flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-muted transition-colors group">
                        <GripVertical className="drag-handle h-3 w-3 cursor-grab text-muted-foreground hover:text-blue-600 group-active:cursor-grabbing" />
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={() => toggleKeyword(m.keywordID)}
                          className={cn("h-3 w-3", accentCheckbox)}
                        />
                        <span className="text-xs truncate flex-1">
                          {m.keywordName}
                          <span className="ml-1 text-[10px] text-muted-foreground">({m.section})</span>
                        </span>
                      </div>
                    ))}
                  </ReactSortable>
                </div>
              </div>
            )}

            {/* 미선택 항목 */}
            {availableItems.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold text-muted-foreground ml-1 italic">항목 추가</p>
                <div className="rounded border bg-white p-1 max-h-40 overflow-y-auto">
                  {availableItems.map((m: any) => (
                    <label key={m.keywordID} className="flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 hover:bg-muted transition-colors">
                      <div className="w-3" /> {/* GripVertical 공간 확보를 위한 더미 */}
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => toggleKeyword(m.keywordID)}
                        className={cn("h-3 w-3", accentCheckbox)}
                      />
                      <span className="text-xs truncate flex-1">
                        {m.keywordName}
                        <span className="ml-1 text-[10px] text-muted-foreground">({m.section})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setIsEditing(false)}>취소</Button>
            <Button 
              size="sm" 
              className={cn("h-7 text-xs text-white", buttonColor)} 
              onClick={handleSave} 
              disabled={isSaving}
            >
              {isSaving ? <Spinner className="text-white" /> : '저장'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
