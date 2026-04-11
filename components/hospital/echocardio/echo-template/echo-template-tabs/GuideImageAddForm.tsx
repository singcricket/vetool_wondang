'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/utils'
import { GripVertical } from 'lucide-react'
import { uploadEchoGuideImage } from '@/lib/services/echocardio/upload-echo-guide-image'
import { insertEchoGuideImage } from '@/lib/services/echocardio/echo-guide-image'
import { ReactSortable } from 'react-sortablejs'

interface GuideImageAddFormProps {
  templateId: string
  nonCommentMeta: any[]
  onDone: () => void
  onCancel: () => void
  speciesColor: 'blue' | 'orange'
}

export default function GuideImageAddForm({
  templateId,
  nonCommentMeta,
  onDone,
  onCancel,
  speciesColor,
}: GuideImageAddFormProps) {
  const [viewName, setViewName] = useState('')
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

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
    if (!viewName.trim()) return
    setIsUploading(true)
    try {
      let url = ''
      if (imageFile) {
        const { url: uploadUrl, error: uploadError } = await uploadEchoGuideImage(imageFile, templateId)
        if (!uploadUrl || uploadError) throw new Error(uploadError ?? '이미지 업로드 실패')
        url = uploadUrl
      }

      await insertEchoGuideImage({
        templateId,
        viewName: viewName.trim(),
        imageUrl: url,
        mappedKeywords: selectedKeywords,
        displayOrder: 0,
      })
      toast.success('가이드 항목을 추가하였습니다')
      onDone()
    } catch (e) {
      console.error(e)
      toast.error('저장 실패')
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
        className={cn("rounded border bg-white px-2 py-1 text-xs outline-none focus:ring-1", accentRing)}
      />

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground italic">이미지 파일 (선택)</label>
        <div className="relative group">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="text-xs w-full file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer" 
          />
        </div>
        {previewUrl ? (
          <div className="relative mt-1 aspect-video w-full overflow-hidden rounded border bg-black/5 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="preview" className="h-full w-full object-contain" />
          </div>
        ) : (
          <div className="relative mt-1 aspect-video w-full overflow-hidden rounded border bg-slate-200/40 flex flex-col items-center justify-center gap-1 border-dashed">
            <span className="text-xs font-bold text-slate-400">
              {viewName || '이미지 미리보기'}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground italic">연결할 측정 항목</label>
        
        <div className="flex flex-col md:flex-row gap-4">
          {/* 항목 추가 리스트 */}
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground ml-1 italic">항목 추가</p>
            <div className="rounded border bg-white p-1 max-h-60 overflow-y-auto">
              {availableItems.map((m: any) => (
                <label
                  key={m.keywordID}
                  className="flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 hover:bg-muted transition-colors"
                >
                  <div className="w-3" /> {/* GripVertical 더미 */}
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => toggleKeyword(m.keywordID)}
                    className={cn('h-3 w-3', accentCheckbox)}
                  />
                  <span className="text-xs truncate flex-1">
                    {m.keywordName}
                    <span className="ml-1 text-[10px] text-muted-foreground">({m.section})</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 선택된 항목 (순서 조정 가능) */}
          {selectedKeywords.length > 0 && (
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground ml-1 italic">
                선택된 항목 (드래그하여 순서 조정)
              </p>
              <div className="rounded border bg-white p-1 max-h-60 overflow-y-auto">
                <ReactSortable
                  list={selectedItems}
                  setList={(newList) => setSelectedKeywords(newList.map((item) => item.id))}
                  animation={200}
                  handle=".drag-handle"
                  className="flex flex-col gap-0.5"
                >
                  {selectedItems.map((m: any) => (
                    <div
                      key={m.keywordID}
                      className="flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-muted transition-colors group"
                    >
                      <GripVertical className="drag-handle h-3 w-3 cursor-grab text-muted-foreground hover:text-blue-600 group-active:cursor-grabbing" />
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => toggleKeyword(m.keywordID)}
                        className={cn('h-3 w-3', accentCheckbox)}
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
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1 border-t">
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onCancel}>취소</Button>
        <Button
          size="sm"
          className={cn("h-7 text-xs text-white", buttonColor)}
          onClick={handleUpload}
          disabled={isUploading || !viewName.trim()}
        >
          {isUploading ? <Spinner className="text-white" /> : (imageFile ? '파일 업로드 및 저장' : '저장')}
        </Button>
      </div>
    </div>
  )
}
